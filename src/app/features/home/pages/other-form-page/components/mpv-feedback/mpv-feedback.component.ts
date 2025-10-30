import { Component, inject } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormStateService } from '../../services/form-state.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-mpv-feedback',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './mpv-feedback.component.html',
  styleUrl: './mpv-feedback.component.scss'
})
export class MpvFeedbackComponent {
  form: FormGroup;
  private router = inject(Router);
  private service = inject(FormStateService);

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      satisfaction: [null, Validators.required]
    });
  }

  submit() {
    if (this.form.valid) {
      const value = this.form.value.satisfaction;
      console.log("Feedback enviado:", value);

      // Reiniciar el estado global del formulario
      this.service.reset();

      //Redirigir a /home
      this.router.navigate(['/home']);
    } else {
      // Mensaje de rror
      console.log("Debe seleccionar una opción antes de enviar");
      this.form.markAllAsTouched();
    }
  }
}
