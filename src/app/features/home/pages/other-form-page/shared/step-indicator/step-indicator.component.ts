import { Component, inject, Input } from '@angular/core';
import { FormStateService } from '../../services/form-state.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-indicator.component.html',
  styleUrls: ['./step-indicator.component.scss']
})
export class StepIndicatorComponent {
  protected service = inject(FormStateService);

  steps = ['Mis datos', 'Destinatario', 'Mis archivos', 'Resumen'];
}
