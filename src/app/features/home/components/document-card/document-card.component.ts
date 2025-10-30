import { Component, HostBinding, HostListener, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-document-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './document-card.component.html',
  styleUrls: ['./document-card.component.scss']
})
export class DocumentCardComponent {
  title = input<string>('');
  icon  = input<string>(''); // nombre de svgIcon
  type  = input<string>(''); // 'proteccion' | 'burocraticas' | 'otros'

  ingresar = output<string>();

  // A11y: todo el host actúa como botón
  @HostBinding('attr.role') role = 'button';
  @HostBinding('attr.tabindex') tabIndex = 0;
  @HostBinding('class.clickable') clickable = true;
  @HostBinding('attr.aria-label') get ariaLabel() {
    return `Ingresar a ${this.title()}`;
  }

  // Activación por clic en cualquier parte de la card
  @HostListener('click')
  onHostActivate() {
    this.ingresar.emit(this.type());
  }

  // Activación por teclado: Enter / Space
  @HostListener('keydown', ['$event'])
  onKeydown(ev: KeyboardEvent) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this.ingresar.emit(this.type());
    }
  }

  // (opcional)
  onIngresar(ev?: Event): void {
    ev?.stopPropagation(); // evita doble emisión
    this.ingresar.emit(this.type());
  }
}
