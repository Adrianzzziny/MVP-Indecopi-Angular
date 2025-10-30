// personal-info-step.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from "@angular/material/core";
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormActionsComponent } from '../../shared/form-actions/form-actions.component';

import { startWith, combineLatest, map, Observable, of, switchMap, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormStateService } from '../../services/form-state.service';
import { PersonalInfo, TipoRepresentacion } from '../../models/form-state';

import { AlertComponent, AlertData } from '../../../../../../shared/components/alert/alert.component';

import { ActionsBusService } from '../../services/actions-bus.service';

// Ubigeo (JSON local + helpers)
import { UbigeoService } from '../../services/ubigeo.service';
import { normalize } from '../../models/ubigeo';

@Component({
  selector: 'app-personal-info-step',
  standalone: true,
  imports: [
    FormActionsComponent,
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatRadioModule,
    MatAutocompleteModule,
    AlertComponent,
  ],
  templateUrl: './personal-info-step.component.html',
  styleUrl: './personal-info-step.component.scss'
})
export class PersonalInfoStepComponent implements OnInit, OnDestroy {

  private service = inject(FormStateService);
  private ubigeo = inject(UbigeoService);
  private actionsBus = inject(ActionsBusService);
  private destroy$ = new Subject<void>();

  ocultarUbigeo = false;
  submitted = false;

  // Snapshots para validator de pertenencia
  private deptosSnapshot: string[] = [];
  private provsSnapshot: string[] = [];
  private distsSnapshot: string[] = [];

  form = new FormGroup({
    tipoDocumento: new FormControl('DNI', Validators.required),

    numeroDocumento: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^[0-9]{8}$/) // por defecto DNI
      ],
    }),

    nombres: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(40)
    ]),

    apellidoPaterno: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(30)
    ]),

    apellidoMaterno: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(30)
    ]),

    correo: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(
          /^[a-zA-Z0-9._%+-]{1,30}@[a-zA-Z0-9.-]{1,20}\.(com|org|net|edu|pe|gob\.pe|edu\.pe|org\.pe)$/
        ),
      ],
    }),

    codigoPais: new FormControl('+51', Validators.required),

    celular: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{9}$/),
      validarCelularInicioCon9()
    ]),

    // Deja vacíos para no chocar con el JSON demo
    departamento: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(28)
    ]),

    provincia: new FormControl({ value: '', disabled: true }, [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(28)
    ]),

    distrito: new FormControl({ value: '', disabled: true }, [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(28)
    ]),

    // Representación
    tipoRepresentacion: new FormControl<TipoRepresentacion>(null, Validators.required),
    ruc: new FormControl(''),
    razonSocial: new FormControl(''),
    leDni: new FormControl(''),
    nombresCompletos: new FormControl(''),
  });

  // Streams para autocomplete
  departamentos$!: Observable<string[]>;
  provincias$!: Observable<string[]>;
  distritos$!: Observable<string[]>;

  filteredDepartamentos$!: Observable<string[]>;
  filteredProvincias$!: Observable<string[]>;
  filteredDistritos$!: Observable<string[]>;

  ngOnInit() {
    this.updateData();

    // Config inicial según tipo documento
    this.setupTipoDocumentoValidatorsOnInit();

    // 🔄 Resetear estado al volver al paso
    this.resetFormStateOnReturn();

    // ======= UBIGEO: Streams y encadenado =======
    const depCtrl = this.form.controls.departamento;
    const provCtrl = this.form.controls.provincia;
    const distCtrl = this.form.controls.distrito;

    // 1) Departamentos base
    this.departamentos$ = this.ubigeo.departamentos$();
    this.departamentos$.subscribe(list => {
      this.deptosSnapshot = list;
      // 🔧 Revalida cuando ya tenemos opciones reales
      if (!this.ocultarUbigeo) {
        this.form.controls.departamento.updateValueAndValidity({ emitEvent: false });
      }
    });

    this.filteredDepartamentos$ = combineLatest([
      this.departamentos$,
      depCtrl.valueChanges.pipe(startWith(depCtrl.value))
    ]).pipe(map(([list, v]) => this.filterList(list, v)));

    // 2) Provincias dependen de Departamento
    this.provincias$ = depCtrl.valueChanges.pipe(
      startWith(depCtrl.value),
      switchMap(dep => dep ? this.ubigeo.provincias$(dep) : of([]))
    );
    this.provincias$.subscribe(list => {
      this.provsSnapshot = list;
      if (!this.ocultarUbigeo) {
        this.form.controls.provincia.updateValueAndValidity({ emitEvent: false });
      }
    });

    this.filteredProvincias$ = combineLatest([
      this.provincias$,
      provCtrl.valueChanges.pipe(startWith(provCtrl.value))
    ]).pipe(map(([list, v]) => this.filterList(list, v)));

    // 3) Distritos dependen de (Departamento + Provincia)
    this.distritos$ = combineLatest([
      depCtrl.valueChanges.pipe(startWith(depCtrl.value)),
      provCtrl.valueChanges.pipe(startWith(provCtrl.value))
    ]).pipe(
      switchMap(([dep, prov]) => (dep && prov) ? this.ubigeo.distritos$(dep, prov) : of([]))
    );
    this.distritos$.subscribe(list => {
      this.distsSnapshot = list;
      if (!this.ocultarUbigeo) {
        this.form.controls.distrito.updateValueAndValidity({ emitEvent: false });
      }
    });

    this.filteredDistritos$ = combineLatest([
      this.distritos$,
      distCtrl.valueChanges.pipe(startWith(distCtrl.value))
    ]).pipe(map(([list, v]) => this.filterList(list, v)));

    // Encadenar habilitado / reset
    depCtrl.valueChanges.subscribe(dep => {
      if (!this.ocultarUbigeo) {
        provCtrl.reset('');
        distCtrl.reset('');
        if (dep) {
          provCtrl.enable();
          distCtrl.disable();
        } else {
          provCtrl.disable();
          distCtrl.disable();
        }
        this.attachUbigeoValidators();
      }
    });

    provCtrl.valueChanges.subscribe(prov => {
      if (!this.ocultarUbigeo) {
        distCtrl.reset('');
        if (prov) distCtrl.enable();
        else distCtrl.disable();
        this.attachUbigeoValidators();
      }
    });

    // Primera vez: enganchar validadores de pertenencia
    this.attachUbigeoValidators();

    // ======= Cambio dinámico por tipoDocumento =======
    this.form.get('tipoDocumento')?.valueChanges.subscribe(tipo => {
      const nroCtrl = this.form.controls.numeroDocumento;
      const depCtrl = this.form.controls.departamento;
      const provCtrl = this.form.controls.provincia;
      const distCtrl = this.form.controls.distrito;

      if (tipo === 'DNI') {
        // Configurar validadores para DNI
        nroCtrl.setValidators([
          Validators.required,
          Validators.pattern(/^[0-9]{8}$/)
        ]);
        this.ocultarUbigeo = false;

        // Restaurar validadores de ubigeo
        depCtrl.setValidators([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(28)
        ]);
        provCtrl.setValidators([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(28)
        ]);
        distCtrl.setValidators([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(28)
        ]);

        // Limpiar errores residuales
        depCtrl.setErrors(null);
        provCtrl.setErrors(null);
        distCtrl.setErrors(null);

        // Sincronizar habilitación según valores actuales
        this.syncUbigeoEnablementFromValues();

        // Re-adjuntar validadores de pertenencia
        setTimeout(() => this.attachUbigeoValidators(), 0);

      } else if (tipo === 'CARNÉ DE EXTRANJERÍA') {
        // Configurar validadores para Carné de Extranjería
        nroCtrl.setValidators([
          Validators.required,
          Validators.pattern(/^[0-9]{12}$/)
        ]);
        this.ocultarUbigeo = true;

        // Limpiar completamente los campos de ubigeo
        depCtrl.clearValidators();
        provCtrl.clearValidators();
        distCtrl.clearValidators();

        // Limpiar valores
        depCtrl.setValue('', { emitEvent: false });
        provCtrl.setValue('', { emitEvent: false });
        distCtrl.setValue('', { emitEvent: false });

        // Limpiar errores
        depCtrl.setErrors(null);
        provCtrl.setErrors(null);
        distCtrl.setErrors(null);

        // Marcar como untouched para evitar mostrar errores
        depCtrl.markAsUntouched();
        provCtrl.markAsUntouched();
        distCtrl.markAsUntouched();

        // Deshabilitar campos
        depCtrl.disable({ emitEvent: false });
        provCtrl.disable({ emitEvent: false });
        distCtrl.disable({ emitEvent: false });
      }

      // Actualizar validación de todos los campos afectados
      nroCtrl.updateValueAndValidity({ emitEvent: false });
      depCtrl.updateValueAndValidity({ emitEvent: false });
      provCtrl.updateValueAndValidity({ emitEvent: false });
      distCtrl.updateValueAndValidity({ emitEvent: false });
    });

    // ======= Representación =======
    this.form.get('tipoRepresentacion')?.valueChanges.subscribe(type => {
      const rucCtrl = this.form.get('ruc');
      const rsCtrl = this.form.get('razonSocial');
      const leCtrl = this.form.get('leDni');
      const nomCtrl = this.form.get('nombresCompletos');

      if (type === 'juridica') {
        rucCtrl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{11}$/)]);
        rsCtrl?.setValidators([Validators.required]);
        leCtrl?.clearValidators();
        nomCtrl?.clearValidators();
        this.form.patchValue({ leDni: '', nombresCompletos: '' }, { emitEvent: false });

      } else if (type === 'natural') {
        leCtrl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{8}$/)]);
        nomCtrl?.setValidators([
          Validators.required,
          Validators.maxLength(60),
          Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)
        ]);
        rucCtrl?.clearValidators();
        rsCtrl?.clearValidators();
        this.form.patchValue({ ruc: '', razonSocial: '' }, { emitEvent: false });

      } else {
        rucCtrl?.clearValidators();
        rsCtrl?.clearValidators();
        leCtrl?.clearValidators();
        nomCtrl?.clearValidators();
        this.form.patchValue({ ruc: '', razonSocial: '', leDni: '', nombresCompletos: '' }, { emitEvent: false });
      }

      rucCtrl?.updateValueAndValidity();
      rsCtrl?.updateValueAndValidity();
      leCtrl?.updateValueAndValidity();
      nomCtrl?.updateValueAndValidity();
    });

    // 🚌 escuchar el botón global "Siguiente"
    this.actionsBus.requestNextValidation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.submitted = true;

        console.log('🔍 Validando formulario...', {
          tipoDocumento: this.form.get('tipoDocumento')?.value,
          ocultarUbigeo: this.ocultarUbigeo,
          formValid: this.form.valid
        });

        // PRIMERO: Ajustar el estado de ubigeo ANTES de marcar touched
        if (this.ocultarUbigeo) {
          // Carné de Extranjería: limpiar y deshabilitar ubigeo
          console.log('📋 Modo Carné: Deshabilitando ubigeo...');
          (['departamento', 'provincia', 'distrito'] as const).forEach(k => {
            const c = this.form.get(k)!;
            c.clearValidators();
            c.setValue('', { emitEvent: false });
            c.setErrors(null);
            c.markAsUntouched();
            c.disable({ emitEvent: false });
            c.updateValueAndValidity({ emitEvent: false });
          });
        } else {
          // DNI: asegurar que los campos estén habilitados según sus valores
          console.log('📋 Modo DNI: Validando ubigeo...');

          const depCtrl = this.form.controls.departamento;
          const provCtrl = this.form.controls.provincia;
          const distCtrl = this.form.controls.distrito;

          // Sincronizar habilitación primero
          this.syncUbigeoEnablementFromValues();

          // Restaurar validadores básicos
          depCtrl.setValidators([
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(28)
          ]);
          provCtrl.setValidators([
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(28)
          ]);
          distCtrl.setValidators([
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(28)
          ]);

          // Re-adjuntar validadores de pertenencia
          this.attachUbigeoValidators();

          // Revalidar campos de ubigeo
          depCtrl.updateValueAndValidity({ emitEvent: false });
          provCtrl.updateValueAndValidity({ emitEvent: false });
          distCtrl.updateValueAndValidity({ emitEvent: false });

          console.log('📋 Estado ubigeo después de validar:', {
            departamento: { value: depCtrl.value, valid: depCtrl.valid, errors: depCtrl.errors, disabled: depCtrl.disabled },
            provincia: { value: provCtrl.value, valid: provCtrl.valid, errors: provCtrl.errors, disabled: provCtrl.disabled },
            distrito: { value: distCtrl.value, valid: distCtrl.valid, errors: distCtrl.errors, disabled: distCtrl.disabled }
          });
        }

        // DESPUÉS: marcar todo como touched y validar
        this.form.markAllAsTouched();

        // Forzar actualización del formulario
        setTimeout(() => {
          this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });

          const ok = this.form.valid;

          console.log('✅ Resultado validación:', {
            valid: ok,
            errors: ok ? 'ninguno' : this.getFormErrors()
          });

          // Debug: mostrar estado del formulario
          if (!ok) {
            console.error('❌ Formulario inválido. Errores detallados:', this.getFormErrors());
            this.focusFirstError();
          } else {
            console.log('✅ Formulario válido. Guardando datos...');
            // Guardar datos antes de avanzar
            this.service.updatePersonal(this.form.getRawValue() as PersonalInfo);
          }

          this.actionsBus.nextValidationResult$.next(ok);
        }, 0);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Resetea el estado del formulario cuando se vuelve al paso */
  private resetFormStateOnReturn() {
    // Resetear el flag de submitted
    this.submitted = false;

    // Reconfigurar el formulario según el tipo de documento actual
    const tipoDoc = this.form.get('tipoDocumento')?.value;
    const nroCtrl = this.form.controls.numeroDocumento;

    if (tipoDoc === 'DNI') {
      // Configurar validadores para DNI
      nroCtrl.setValidators([
        Validators.required,
        Validators.pattern(/^[0-9]{8}$/)
      ]);

      // Asegurar que ubigeo esté correctamente configurado
      this.ocultarUbigeo = false;

      const depCtrl = this.form.controls.departamento;
      const provCtrl = this.form.controls.provincia;
      const distCtrl = this.form.controls.distrito;

      // Restaurar validadores de ubigeo
      depCtrl.setValidators([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(28)
      ]);
      provCtrl.setValidators([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(28)
      ]);
      distCtrl.setValidators([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(28)
      ]);

      // Sincronizar habilitación según valores
      this.syncUbigeoEnablementFromValues();

      // Limpiar errores residuales
      depCtrl.setErrors(null);
      provCtrl.setErrors(null);
      distCtrl.setErrors(null);

      // Actualizar validación
      depCtrl.updateValueAndValidity({ emitEvent: false });
      provCtrl.updateValueAndValidity({ emitEvent: false });
      distCtrl.updateValueAndValidity({ emitEvent: false });

    } else if (tipoDoc === 'CARNÉ DE EXTRANJERÍA') {
      // Configurar validadores para Carné de Extranjería
      nroCtrl.setValidators([
        Validators.required,
        Validators.pattern(/^[0-9]{12}$/)
      ]);

      // Asegurar que ubigeo esté oculto y limpio
      this.ocultarUbigeo = true;

      (['departamento', 'provincia', 'distrito'] as const).forEach(k => {
        const c = this.form.get(k)!;
        c.clearValidators();
        c.setValue('', { emitEvent: false });
        c.setErrors(null);
        c.markAsUntouched();
        c.disable({ emitEvent: false });
      });
    }

    // Actualizar validación del número de documento
    nroCtrl.setErrors(null);
    nroCtrl.updateValueAndValidity({ emitEvent: false });

    // 🔧 Reconfigurar validadores de representación
    const tipoRep = this.form.get('tipoRepresentacion')?.value;
    const rucCtrl = this.form.get('ruc');
    const rsCtrl = this.form.get('razonSocial');
    const leCtrl = this.form.get('leDni');
    const nomCtrl = this.form.get('nombresCompletos');

    if (tipoRep === 'juridica') {
      rucCtrl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{11}$/)]);
      rsCtrl?.setValidators([Validators.required]);
      leCtrl?.clearValidators();
      nomCtrl?.clearValidators();
      leCtrl?.setErrors(null);
      nomCtrl?.setErrors(null);

    } else if (tipoRep === 'natural') {
      leCtrl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{8}$/)]);
      nomCtrl?.setValidators([
        Validators.required,
        Validators.maxLength(60),
        Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)
      ]);
      rucCtrl?.clearValidators();
      rsCtrl?.clearValidators();
      rucCtrl?.setErrors(null);
      rsCtrl?.setErrors(null);

    } else {
      // Si no hay tipo de representación seleccionado, limpiar todos
      rucCtrl?.clearValidators();
      rsCtrl?.clearValidators();
      leCtrl?.clearValidators();
      nomCtrl?.clearValidators();
      rucCtrl?.setErrors(null);
      rsCtrl?.setErrors(null);
      leCtrl?.setErrors(null);
      nomCtrl?.setErrors(null);
    }

    rucCtrl?.updateValueAndValidity({ emitEvent: false });
    rsCtrl?.updateValueAndValidity({ emitEvent: false });
    leCtrl?.updateValueAndValidity({ emitEvent: false });
    nomCtrl?.updateValueAndValidity({ emitEvent: false });

    // Actualizar validación del formulario completo
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });

    console.log('🔄 Formulario reseteado:', {
      tipoDocumento: tipoDoc,
      numeroDocumento: nroCtrl.value,
      numeroDocumentoValid: nroCtrl.valid,
      numeroDocumentoErrors: nroCtrl.errors,
      ocultarUbigeo: this.ocultarUbigeo,
      formValid: this.form.valid
    });
  }

  /** Ajustes iniciales de validadores para tipoDocumento al cargar */
  private setupTipoDocumentoValidatorsOnInit() {
    const tipoDocumentoActual = this.form.get('tipoDocumento')?.value;
    const depCtrl = this.form.controls.departamento;
    const provCtrl = this.form.controls.provincia;
    const distCtrl = this.form.controls.distrito;

    if (tipoDocumentoActual === 'CARNÉ DE EXTRANJERÍA') {
      this.ocultarUbigeo = true;
      depCtrl.clearValidators();
      provCtrl.clearValidators();
      distCtrl.clearValidators();
      depCtrl.disable({ emitEvent: false });
      provCtrl.disable({ emitEvent: false });
      distCtrl.disable({ emitEvent: false });

      // Limpiar errores si existen
      depCtrl.setErrors(null);
      provCtrl.setErrors(null);
      distCtrl.setErrors(null);
    } else {
      this.ocultarUbigeo = false;
      depCtrl.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(28)]);
      provCtrl.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(28)]);
      distCtrl.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(28)]);
    }

    depCtrl.updateValueAndValidity({ emitEvent: false });
    provCtrl.updateValueAndValidity({ emitEvent: false });
    distCtrl.updateValueAndValidity({ emitEvent: false });

    this.syncUbigeoEnablementFromValues();
  }

  /** Engancha/actualiza el validador de pertenencia según snapshots actuales */
  private attachUbigeoValidators() {
    if (this.ocultarUbigeo) return;

    const depCtrl = this.form.controls.departamento;
    const provCtrl = this.form.controls.provincia;
    const distCtrl = this.form.controls.distrito;

    depCtrl.setValidators([
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(28),
      this.allowedValueValidator(() => this.deptosSnapshot)
    ]);

    provCtrl.setValidators([
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(28),
      this.allowedValueValidator(() => this.provsSnapshot)
    ]);

    distCtrl.setValidators([
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(28),
      this.allowedValueValidator(() => this.distsSnapshot)
    ]);

    depCtrl.updateValueAndValidity({ emitEvent: false });
    provCtrl.updateValueAndValidity({ emitEvent: false });
    distCtrl.updateValueAndValidity({ emitEvent: false });
  }

  /** Valida que el valor exista en la lista disponible actual */
  private allowedValueValidator(optionsProvider: () => string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = (control.value ?? '').toString().trim();
      if (!val) return null; // lo maneja required
      const options = optionsProvider() || [];
      const ok = options.some(o => normalize(o) === normalize(val));
      return ok ? null : { invalidUbigeoValue: true };
    };
  }

  /** Filtro para autocompletes (normaliza y busca por includes) */
  private filterList(list: string[], value?: string | null): string[] {
    const q = normalize(value ?? '');
    if (!q) return list;
    return list.filter(item => normalize(item).includes(q));
  }

  /** Sincroniza la habilitación de campos de ubigeo según sus valores */
  private syncUbigeoEnablementFromValues(): void {
    const depCtrl = this.form.controls.departamento;
    const provCtrl = this.form.controls.provincia;
    const distCtrl = this.form.controls.distrito;

    if (this.ocultarUbigeo) {
      // Si el ubigeo está oculto (Carné), asegúrate de tenerlos deshabilitados
      depCtrl.disable({ emitEvent: false });
      provCtrl.disable({ emitEvent: false });
      distCtrl.disable({ emitEvent: false });

      // Limpiar errores para que no bloqueen
      depCtrl.setErrors(null);
      provCtrl.setErrors(null);
      distCtrl.setErrors(null);

      return;
    }

    // Para DNI: gestionar la cascada de habilitación
    const hasDep = !!depCtrl.value && depCtrl.value.trim().length > 0;
    const hasProv = !!provCtrl.value && provCtrl.value.trim().length > 0;

    console.log('🔄 Sincronizando ubigeo:', { hasDep, hasProv, depValue: depCtrl.value, provValue: provCtrl.value });

    // Departamento siempre habilitado para DNI
    if (depCtrl.disabled) {
      depCtrl.enable({ emitEvent: false });
    }

    // Provincia depende de departamento
    if (hasDep) {
      if (provCtrl.disabled) {
        provCtrl.enable({ emitEvent: false });
      }
    } else {
      provCtrl.disable({ emitEvent: false });
      if (provCtrl.value) {
        provCtrl.reset('', { emitEvent: false });
      }
    }

    // Distrito depende de provincia
    if (hasProv && hasDep) {
      if (distCtrl.disabled) {
        distCtrl.enable({ emitEvent: false });
      }
    } else {
      distCtrl.disable({ emitEvent: false });
      if (distCtrl.value) {
        distCtrl.reset('', { emitEvent: false });
      }
    }
  }

  /** Obtiene todos los errores del formulario para debug */
  private getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  // ==== Helpers ====

  // Límite y limpieza por campo
  limitarEntrada(campo: string, event: Event) {
    const input = event.target as HTMLInputElement;
    let maxLength = 0;
    let value = input.value;

    switch (campo) {
      case 'numeroDocumento': {
        const tipo = this.form.get('tipoDocumento')?.value;
        if (tipo === 'DNI') {
          maxLength = 8;
          value = value.replace(/\D/g, '');
        } else if (tipo === 'CARNÉ DE EXTRANJERÍA') {
          maxLength = 12;
          value = value.replace(/\D/g, '');
        }
        break;
      }
      case 'nombres':
        maxLength = 40;
        value = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ\s]/g, '');
        value = value.toUpperCase();
        break;
      case 'apellidoPaterno':
      case 'apellidoMaterno':
        maxLength = 30;
        value = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ\s]/g, '');
        value = value.toUpperCase();
        break;
      case 'correo':
        maxLength = 40;
        value = value.slice(0, maxLength).toLowerCase();
        break;
      case 'celular':
        maxLength = 9;
        value = value.replace(/\D/g, '');
        break;
      case 'departamento':
        maxLength = 28;
        value = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ\s]/g, '');
        value = value.toUpperCase();
        break;
      case 'provincia':
      case 'distrito':
        maxLength = 28;
        value = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
        value = value.toUpperCase();
        break;
      case 'ruc':
        value = value.replace(/[^0-9]/g, '');
        maxLength = 11;
        break;
      case 'leDni':
        value = value.replace(/[^0-9]/g, '');
        maxLength = 8;
        break;
      case 'nombresCompletos':
        value = value.replace(/[^A-Za-zÑñ\s]/g, '');
        maxLength = 60;
        value = value.toUpperCase();
        break;
    }

    if (value.length > maxLength) value = value.slice(0, maxLength);

    input.value = value;
    this.form.get(campo)?.setValue(value, { emitEvent: false });
  }

  validarCorreo() {
    const control = this.form.get('correo');
    const email = (control?.value || '').trim();
    const maxLength = 40;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email.length > maxLength) {
      control?.setErrors({ maxlength: true });
      return;
    }
    if (!emailRegex.test(email)) {
      control?.setErrors({ pattern: true });
      return;
    }
    control?.setErrors(null);
  }

  updateData() {
    const savedData = this.service.data().personal;

    if (savedData) {
      console.log('📥 Cargando datos guardados:', savedData);
      this.form.patchValue(savedData, { emitEvent: false });
    }

    // Sincronizar habilitación después de cargar datos
    setTimeout(() => {
      this.syncUbigeoEnablementFromValues();

      // Si hay datos de ubigeo cargados, re-adjuntar validadores
      if (!this.ocultarUbigeo) {
        this.attachUbigeoValidators();
      }
    }, 100);

    // Guardar cambios en el servicio
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        // Siempre guardar, incluso si el form no es válido (para no perder datos)
        const dataToSave = this.ocultarUbigeo
          ? { ...value, departamento: '', provincia: '', distrito: '' }
          : value;

        this.service.updatePersonal(dataToSave as PersonalInfo);
        console.log('💾 Guardando cambios:', dataToSave);
      });
  }

  // Simulación de búsqueda de RUC
  buscarRuc() {
    const ruc = (this.form.get('ruc')?.value || '').trim();

    if (!/^\d{11}$/.test(ruc)) {
      console.warn('Debes ingresar un RUC válido de 11 dígitos antes de buscar.');
      return;
    }

    const tipoRepresentacion = this.form.get('tipoRepresentacion')?.value;
    if (tipoRepresentacion !== 'juridica') {
      console.warn('Solo se puede buscar RUC cuando el tipo de representación es Jurídica.');
      return;
    }

    const razonSocialSimulada = "Empresa Demo SAC";
    this.form.get('razonSocial')?.setValue(razonSocialSimulada);
    this.form.get('razonSocial')?.markAsTouched();
    this.form.get('razonSocial')?.updateValueAndValidity({ emitEvent: true });
  }

  // Alerta
  dataProteccion: AlertData = {
    type: 'info',
    icon: 'security',
    title: 'Protección de datos personales',
    message:
      'En cumplimiento de lo dispuesto por la Ley N° 29733, Ley de Protección de Datos Personales, ' +
      'le informamos que los datos personales que usted nos proporcione serán utilizados y/o tratados por el ' +
      'Indecopi (por sí mismo o a través de terceros), estricta y únicamente para la atención de los ' +
      'servicios que realice la Mesa de Partes de nuestra Institución, pudiendo ser incorporados en un ' +
      'banco de datos personales de titularidad del Indecopi. ' +
      'Los datos personales proporcionados se mantendrán almacenados mientras su uso y tratamiento ' +
      'sean necesarios para cumplir con las finalidades anteriormente descritas. ' +
      'Se informa que el Indecopi podría compartir y/o usar y /o almacenar y/o ' +
      'transferir dicha información a terceras personas, estrictamente con el objeto de ' +
      'realizar las actividades antes mencionadas. Usted podrá ejercer sus derechos de ' +
      'información, acceso, rectificación, cancelación y oposición de sus datos personales, ' +
      'en cualquier momento, a través de una solicitud simple presentada por este portal.',
    linkAction: { label: 'Leer más...', url: '#' }
  };

  // Marca todo como touched, ejecuta validaciones y devuelve si el form es válido
  public validateStepAndShowErrors(): boolean {
    this.submitted = true;
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });
    return this.form.valid;
  }

  // Llevar foco al primer campo con error
  public focusFirstError(): void {
    const firstInvalid = document.querySelector(
      'input.ng-invalid, select.ng-invalid, textarea.ng-invalid'
    ) as HTMLElement | null;

    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus?.({ preventScroll: true });
    }
  }
}

// ===== Helpers fuera de la clase =====
export function validarCelularInicioCon9(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value || '';
    if (value && !value.startsWith('9')) {
      return { empiezaCon9: true };
    }
    return null;
  };
}
