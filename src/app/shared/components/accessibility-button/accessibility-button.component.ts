import { Component } from '@angular/core';

@Component({
  selector: 'app-accessibility-button',
  standalone: true,
  templateUrl: './accessibility-button.component.html',
  styleUrls: ['./accessibility-button.component.scss']
})
export class AccessibilityButtonComponent {

  openAccessibilityOptions() {
    alert('Opciones de accesibilidad próximamente disponibles');
  }

}
