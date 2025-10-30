import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import {
  PersonalInfoStepComponent,
  RecipientStepComponent,
  SummaryStepComponent,
  UploadFilesStepComponent
} from './components';

import { FormActionsComponent } from './shared/form-actions/form-actions.component';
import { StepIndicatorComponent } from "./shared/step-indicator/step-indicator.component";
import { MpvFeedbackComponent } from "./components/mpv-feedback/mpv-feedback.component";

import { ModalSuccessSentComponent } from './shared/modal-success-sent/modal-success-sent.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { FormStateService } from './services/form-state.service';
import { ActionsBusService } from './services/actions-bus.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-other-form-page',
  standalone: true,
  imports: [
    PersonalInfoStepComponent,
    RecipientStepComponent,
    UploadFilesStepComponent,
    SummaryStepComponent,
    MatButtonModule,
    FormActionsComponent,
    StepIndicatorComponent,
    MpvFeedbackComponent
  ],
  templateUrl: './other-form-page.component.html',
  styleUrl: './other-form-page.component.scss'
})
export class OtherFormPageComponent {
  protected service = inject(FormStateService);
  private modalService = inject(NgbModal);
  private actionsBus = inject(ActionsBusService);
  private router = inject(Router);

  goBack() {
    const current = this.service.currentStep();

    console.log('⬅️ [Container] Retrocediendo desde paso', current);

    if (current === 0) {
      this.router.navigateByUrl('/home');
      return;
    }
    this.service.prev();
  }

  goNext() {
    const current = this.service.currentStep();

    console.log('➡️ [Container] Intentando avanzar desde paso', current);

    // Paso 3 (Resumen): abrir modal y terminar flujo aquí
    if (current === 3) {
      const data = this.service.data();
      const modalRef = this.modalService.open(ModalSuccessSentComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
      });

      modalRef.componentInstance.email = data.personal?.correo || 'sin-correo';
      modalRef.componentInstance.carga = '2025-V01-000111';

      modalRef.result.then(result => {
        if (result === 'yes') {
          console.log('✅ [Container] Reseteando formulario');
          this.service.reset();
          this.service.goToStep(0);
        } else if (result === 'no') {
          console.log('📋 [Container] Ir a feedback');
          this.service.goToStep(4);
        } else if (result === 'download') {
          console.log('💾 [Container] Descargar archivo...');
        }
      });

      return; // Importantísimo: no continúes después del modal
    }

    // Flujo de avance: pedir validación al step visible y avanzar solo si ok
    console.log('🔍 [Container] Solicitando validación del paso', current);
    this.actionsBus.requestNextValidation$.next();

    this.actionsBus.nextValidationResult$
      .pipe(take(1)) // evita dobles avances por múltiples emisiones
      .subscribe(ok => {
        if (!ok) {
          console.warn('❌ [Container] Validación falló para paso', current);
          return; // el step ya pintó errores / hizo focus si corresponde
        }

        // ✅ CAMBIO CLAVE: Avanzar secuencialmente al siguiente paso
        const nextStep = current + 1;
        console.log(`✅ [Container] Validación exitosa. Avanzando al paso ${nextStep}`);

        // Usar goToStep directamente en lugar de service.next()
        this.service.goToStep(nextStep);

        // Debug: Mostrar estado después de avanzar
        console.log('📊 [Container] Estado después de avanzar:', this.service.getDebugInfo());
      });
  }
}
