import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class ErrorMessageService {
  constructor() {}

  getErrorMessage(control: AbstractControl | null): string {
    if (!control) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('minlength')) {
      const requiredLength = control.errors?.['minlength']?.requiredLength;
      return `Debe tener al menos ${requiredLength} caracteres.`;
    }

    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `No puede tener más de ${maxLength} caracteres.`;
    }

    return '';
  }
}
