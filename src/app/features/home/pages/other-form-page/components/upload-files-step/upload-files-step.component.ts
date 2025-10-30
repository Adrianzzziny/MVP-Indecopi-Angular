import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination.component';
import { FormStateService } from '../../services/form-state.service';
import { ActionsBusService } from '../../services/actions-bus.service';
import { FileData } from '../../models/form-state';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-upload-files-step',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    PaginationComponent
  ],
  templateUrl: './upload-files-step.component.html',
  styleUrls: ['./upload-files-step.component.scss']
})
export class UploadFilesStepComponent implements OnInit, OnDestroy {
  private service = inject(FormStateService);
  private actionsBus = inject(ActionsBusService);
  private destroy$ = new Subject<void>();

  submitted = false;

  form = new FormGroup({
    tipoDocumento: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    numeroExpediente: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.pattern(/^[0-9]*$/), Validators.maxLength(20)]
    })
  });

  files = {
    principal: null as File | null,
    anexos: [] as File[]
  };

  // flags de UI
  showTipoDocError = false;
  showDocError = false;

  ngOnInit(): void {
    this.loadSavedData();
    this.setupFormListener();

    // Al cambiar el select, si ya enviamos, recalculamos flag
    this.form.controls.tipoDocumento.valueChanges.subscribe(v => {
      if (this.submitted) this.showTipoDocError = !v;
    });

    // 🚌 Botón global “Siguiente”
    this.actionsBus.requestNextValidation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.submitted = true;
        this.form.markAllAsTouched();
        this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });

        // calcular y mostrar advertencias
        this.showTipoDocError = !this.form.controls.tipoDocumento.value;
        this.showDocError = !this.files.principal;

        const ok = this.validateBeforeNext();        // NO navega
        if (!ok) this.focusFirstError();             // UX
        this.actionsBus.nextValidationResult$.next(ok); // responde al padre
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- persistencia ----------
  private loadSavedData() {
    const saved = this.service.data().files;
    if (!saved) return;

    this.form.patchValue(saved);
    this.files.principal = saved.documentoPrincipal || null;
    this.files.anexos = saved.anexos || [];
  }

  private setupFormListener() {
    this.form.valueChanges.subscribe(() => {
      if (!this.form.valid) return;
      this.service.updateFiles({
        ...this.form.getRawValue(),
        documentoPrincipal: this.files.principal,
        anexos: this.files.anexos
      } as FileData);
    });
  }

  // ---------- inputs ----------
  limitarEntrada(campo: 'numeroExpediente', event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 20) value = value.slice(0, 20);
    input.value = value;
    this.form.get(campo)?.setValue(value, { emitEvent: false });
  }

  // ---------- drag & drop / file ----------
  onDragOver(e: DragEvent) { e.preventDefault(); e.stopPropagation(); }
  onDragLeave(e: DragEvent) { e.preventDefault(); e.stopPropagation(); }

  onDrop(e: DragEvent, type: 'principal' | 'anexos') {
    e.preventDefault(); e.stopPropagation();
    if (!e.dataTransfer?.files) return;
    const dropped = Array.from(e.dataTransfer.files);
    if (type === 'principal') {
      this.files.principal = dropped[0];
      if (this.submitted) this.showDocError = false;
    } else {
      this.files.anexos.push(...dropped);
    }
    this.syncFiles();
  }

  onFileSelect(event: Event, type: 'principal' | 'anexos') {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const selected = Array.from(input.files);
    if (type === 'principal') {
      this.files.principal = selected[0];
      if (this.submitted) this.showDocError = false;
    } else {
      this.files.anexos.push(...selected);
    }
    this.syncFiles();
  }

  removeFile(type: 'principal' | 'anexos', index?: number) {
    if (type === 'principal') {
      this.files.principal = null;
      if (this.submitted) this.showDocError = true;
    } else if (index !== undefined) {
      this.files.anexos.splice(index, 1);
    }
    this.syncFiles();
  }

  private syncFiles() {
    this.service.updateFiles({
      ...this.form.getRawValue(),
      documentoPrincipal: this.files.principal,
      anexos: this.files.anexos
    } as FileData);
  }

  // ---------- utilidades ----------
  editFile(type: 'principal' | 'anexos', index?: number) { console.log('Editar', type, index); }

  downloadFile(type: 'principal' | 'anexos', index?: number) {
    let file: File | null = null;
    if (type === 'principal') file = this.files.principal;
    else if (index !== undefined) file = this.files.anexos[index];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; a.style.display = 'none';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  pageSize = 3;
  currentPage = 1;
  get pagedAnexos(): File[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.files.anexos.slice(start, start + this.pageSize);
  }
  changePage(page: number) { this.currentPage = page; }

  // ---------- validación de paso ----------
  validateBeforeNext(): boolean {
    const tipoDoc = this.form.controls.tipoDocumento.value;
    const hasPrincipal = !!this.files.principal;

    this.showTipoDocError = !tipoDoc;
    this.showDocError = !hasPrincipal;

    if (!tipoDoc || !hasPrincipal) return false;

    // Persistimos antes de avanzar (el avance lo hace el padre)
    this.service.updateFiles({
      ...this.form.getRawValue(),
      documentoPrincipal: this.files.principal,
      anexos: this.files.anexos
    } as FileData);

    return true;
  }

  private focusFirstError() {
    const tipoDocEl = document.querySelector<HTMLElement>('select[formControlName="tipoDocumento"]');
    const dropZoneEl = document.querySelector<HTMLElement>('.file-upload .drop-zone');

    if (this.showTipoDocError && tipoDocEl) {
      tipoDocEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      tipoDocEl.focus?.({ preventScroll: true });
      return;
    }
    if (this.showDocError && dropZoneEl) {
      dropZoneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
