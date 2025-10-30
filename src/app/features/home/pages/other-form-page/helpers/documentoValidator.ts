import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function documentoValidator(tipoCtrlName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.parent) return null;

        const tipo = control.parent.get(tipoCtrlName)?.value;
        const valor = control.value?.trim();

        if (!valor) return null;

        switch (tipo) {
            case 'DNI':
                return /^\d{8}$/.test(valor) ? null : { dniInvalido: true };

            case 'CARNÉ DE EXTRANJERÍA':
                return /^[A-Z]\d{8,12}$/.test(valor) ? null : { ceInvalido: true };

            case 'PASAPORTE':
                return /^[A-Z0-9]{6,20}$/i.test(valor) ? null : { pasaporteInvalido: true };

            default:
                return null;
        }
    };
}
