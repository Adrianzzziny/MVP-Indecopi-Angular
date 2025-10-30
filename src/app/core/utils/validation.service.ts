import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Injectable({
    providedIn: 'root'
})
export class ValidationService {
    constructor() { }

    validateInput(type: string, maxLength: number, event: any, formGroup?: FormGroup): void {
        const input = event.target as HTMLInputElement;
        let value = input.value;

        if (type === 'number') {
            value = value.replace(/[^0-9]/g, '');
            if (value.length > maxLength) {
                value = value.slice(0, maxLength);
            }
        } else if (type === 'decimal') {
            value = value.replace(/[^0-9.]/g, '');
            value = value.replace(/(\..*)\./g, '$1');
            if (value.length > maxLength) {
                value = value.slice(0, maxLength);
            }
        } else if (type === 'text') {
            if (value.length > maxLength) {
                value = value.slice(0, maxLength);
            }
        }

        input.value = value;

        if (formGroup) {
            const controlName = input.getAttribute('formControlName');
            if (controlName) {
                const formControl = formGroup.get(controlName);
                if (formControl) {
                    formControl.setValue(value, { emitEvent: false });
                }
            }
        }
    }
}
