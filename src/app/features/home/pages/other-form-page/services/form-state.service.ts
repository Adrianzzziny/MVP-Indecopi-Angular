import { Injectable, signal, computed } from '@angular/core';
import { FileData, FormData, PersonalInfo, RecipientInfo } from '../models/form-state';

@Injectable({ providedIn: 'root' })
export class FormStateService {
  currentStep = signal(0);
  data = signal<FormData>({});

  readonly totalSteps = 5;

  // Validaciones por paso
  private validators: Record<number, (d: FormData) => boolean> = {
    0: d => {
      const p = d.personal;

      if (!p?.numeroDocumento || !p.correo) return false;

      if (p.tipoRepresentacion === 'juridica') {
        return !!(p.ruc && p.razonSocial);
      }
      if (p.tipoRepresentacion === 'natural') {
        return !!(p.leDni && p.nombresCompletos);
      }

      return false;
    },
    1: d => !!(d.recipient?.sede && d.recipient?.areaDestino && d.recipient?.asunto),
    2: d => !!(d.files?.tipoDocumento && d.files?.documentoPrincipal),
    3: _ => true
  };

  canAdvance = computed(() => {
    const step = this.currentStep();
    const d = this.data();
    return this.validators[step]?.(d) ?? true;
  });

  isLastStep = computed(() => this.currentStep() === this.totalSteps - 1);

  progress = computed(() => ((this.currentStep() + 1) / this.totalSteps) * 100);

  goToStep(step: number, strict: boolean = true) {
    const max = this.totalSteps - 1;
    if (step < 0 || step > max) return;

    if (strict && step > this.currentStep() + 1) return;

    console.log(`🚀 [FormStateService] Navegando al paso ${step} (actual: ${this.currentStep()})`);
    this.currentStep.set(step);
  }

  /**
   * Avanza al siguiente paso SOLO si el paso actual está válido
   * Este método NO debe ser usado directamente por los botones.
   * En su lugar, usa el patrón de validación con ActionsBusService.
   */
  next() {
    if (this.canAdvance()) {
      const nextStep = this.currentStep() + 1;
      console.log(`➡️ [FormStateService] Avanzando al paso ${nextStep}`);
      this.goToStep(nextStep);
    } else {
      console.warn(`⚠️ [FormStateService] No se puede avanzar. Paso ${this.currentStep()} no es válido.`);
    }
  }

  /**
   * Retrocede al paso anterior sin validación
   */
  prev() {
    const prevStep = this.currentStep() - 1;
    console.log(`⬅️ [FormStateService] Retrocediendo al paso ${prevStep}`);
    this.goToStep(prevStep, false);
  }

  updatePersonal(data: PersonalInfo) {
    console.log('💾 [FormStateService] Actualizando personal:', data);
    this.data.update(d => ({ ...d, personal: data }));
  }

  updateRecipient(data: RecipientInfo) {
    console.log('💾 [FormStateService] Actualizando recipient:', data);
    this.data.update(d => ({ ...d, recipient: data }));
  }

  updateFiles(data: FileData) {
    console.log('💾 [FormStateService] Actualizando files:', data);
    this.data.update(d => ({ ...d, files: data }));
  }

  reset() {
    console.log('🔄 [FormStateService] Reseteando formulario');
    this.currentStep.set(0);
    this.data.set({});
  }

  /**
   * Método para botón EDITAR de vista RESUMEN
   * Permite saltar libremente hacia atrás
   */
  editStep(step: number) {
    console.log(`✏️ [FormStateService] Editando paso ${step}`);
    this.goToStep(step, false);
  }

  /**
   * Verifica si un paso específico es válido
   * Útil para debugging
   */
  isStepValid(step: number): boolean {
    const d = this.data();
    return this.validators[step]?.(d) ?? false;
  }

  /**
   * Obtiene información de debug del estado actual
   */
  getDebugInfo(): any {
    const currentStep = this.currentStep();
    const data = this.data();
    return {
      currentStep,
      totalSteps: this.totalSteps,
      canAdvance: this.canAdvance(),
      isLastStep: this.isLastStep(),
      progress: this.progress(),
      stepValidations: {
        step0: this.validators[0]?.(data),
        step1: this.validators[1]?.(data),
        step2: this.validators[2]?.(data),
        step3: this.validators[3]?.(data),
      },
      data: {
        hasPersonal: !!data.personal,
        hasRecipient: !!data.recipient,
        hasFiles: !!data.files,
      }
    };
  }
}
