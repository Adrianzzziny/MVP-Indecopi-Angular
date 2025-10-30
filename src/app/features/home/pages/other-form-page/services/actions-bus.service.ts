// actions-bus.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ActionsBusService {
  /** El footer global pide validar el step actual */
  requestNextValidation$ = new Subject<void>();

  /** El step responde si está OK para avanzar */
  nextValidationResult$ = new Subject<boolean>();
}
