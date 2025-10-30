import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';

import { Observable, Subject, map, startWith, takeUntil } from 'rxjs';

import { FormStateService } from '../../services/form-state.service';
import { RecipientInfo } from '../../models/form-state';
import { ActionsBusService } from '../../services/actions-bus.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recipient-step',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatOptionModule
  ],
  templateUrl: './recipient-step.component.html',
  styleUrl: './recipient-step.component.scss'
})
export class RecipientStepComponent implements OnInit, OnDestroy {
  private service = inject(FormStateService);
  private actionsBus = inject(ActionsBusService);
  private destroy$ = new Subject<void>();

  submitted = false;

  form = new FormGroup({
    sede: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    areaDestino: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    asunto: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(30)]
    })
  });

  // Arrays estáticos para Autocomplete
  sedes: string[] = [
    'SEDE LIMA SUR - SAN BORJA',
    'SEDE CENTRAL'
  ];
  areas: string[] = [
    'SECRETARÍA TÉCNICA DE LOS ÓRGANOS INSTRUCTORES...',
    'OTRO ÁREA...'
  ];

  // Observables filtrados
  filteredSedes$!: Observable<string[]>;
  filteredAreas$!: Observable<string[]>;

  public limitarEntrada(
    campo: 'sede' | 'areaDestino' | 'asunto',
    event: Event
  ): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    let value = input.value;
    let maxLength = 0;

    switch (campo) {
      case 'sede':
        maxLength = 60;
        // Solo letras, espacios y guiones
        value = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s-]/g, '');
        value = value.toUpperCase();
        break;

      case 'areaDestino':
        maxLength = 60;
        // Solo letras, espacios y guiones
        value = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s-]/g, '');
        value = value.toUpperCase();
        break;

      case 'asunto':
        maxLength = 30;
        // Letras, números, espacio, coma, punto y guion
        value = value.replace(/[^A-Za-z0-9\s,.\-]/g, '');
        value = value.toUpperCase();
        break;
    }

    if (value.length > maxLength) value = value.slice(0, maxLength);

    input.value = value;
    this.form.get(campo)?.setValue(value, { emitEvent: false });
  }

  ngOnInit() {
    this.updateData();

    // 🔄 Resetear estado al volver al paso
    this.resetFormStateOnReturn();

    // Autocomplete sede
    this.filteredSedes$ = this.form.controls.sede.valueChanges.pipe(
      startWith(this.form.controls.sede.value),
      map(value => this._filter(value || '', this.sedes))
    );

    // Autocomplete área
    this.filteredAreas$ = this.form.controls.areaDestino.valueChanges.pipe(
      startWith(this.form.controls.areaDestino.value),
      map(value => this._filter(value || '', this.areas))
    );

    // 🚌 Botón global "Siguiente"
    this.actionsBus.requestNextValidation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.submitted = true;

        console.log('🔍 [Recipient] Validando formulario...', {
          formValid: this.form.valid,
          formValue: this.form.value
        });

        this.form.markAllAsTouched();

        setTimeout(() => {
          this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });

          const ok = this.form.valid;

          if (ok) {
            console.log('✅ [Recipient] Formulario válido. Guardando datos...');
            this.service.updateRecipient(this.form.getRawValue() as RecipientInfo);
          } else {
            console.error('❌ [Recipient] Formulario inválido. Errores:', this.getFormErrors());
          }

          this.actionsBus.nextValidationResult$.next(ok);
        }, 0);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Resetea el estado del formulario cuando se vuelve al paso */
  private resetFormStateOnReturn() {
    // Resetear el flag de submitted
    this.submitted = false;

    // Limpiar errores residuales
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control && control.errors) {
        control.setErrors(null);
      }
    });

    // Actualizar validación del formulario completo
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });

    console.log('🔄 [Recipient] Formulario reseteado:', {
      formValue: this.form.value,
      formValid: this.form.valid
    });
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

  private _filter(value: string, source: string[]): string[] {
    const q = (value || '').toLowerCase();
    return source.filter(option => option.toLowerCase().includes(q));
  }

  updateData() {
    const saved = this.service.data().recipient;
    if (saved) {
      console.log('📥 [Recipient] Cargando datos guardados:', saved);
      this.form.patchValue(saved, { emitEvent: false });
    }

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        // Siempre guardar, incluso si el form no es válido (para no perder datos)
        this.service.updateRecipient(value as RecipientInfo);
        console.log('💾 [Recipient] Guardando cambios:', value);
      });
  }

  // (Si mantienes un submit local para pruebas)
  onSubmit() {
    this.submitted = true;
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.valid) {
      this.service.updateRecipient(this.form.value as any);
      this.service.goToStep(2);
    }
  }
}
