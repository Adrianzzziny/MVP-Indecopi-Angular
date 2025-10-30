import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import { FormStateService } from '../../services/form-state.service';

@Component({
  selector: 'app-form-actions',
  standalone: true,
  imports: [],
  templateUrl: './form-actions.component.html',
  styleUrls: ['./form-actions.component.scss']
})
export class FormActionsComponent {
  private service = inject(FormStateService);

  @Input() useValidationBus = false;

  canAdvance = this.service.canAdvance;
  isLastStep = this.service.isLastStep;
  currentStep = this.service.currentStep;

  data = this.service.data;

  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  onBack(): void {
    this.back.emit();
  }

  onNext(): void {
    this.next.emit();
  }
}
