import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-access-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './access-alert.component.html',
  styleUrls: ['./access-alert.component.scss']
})
export class AccessAlertComponent {
  @Input() title: string = '¡Acceso al Sistema!';
  @Input() message: string = 'Para continuar, selecciona el modo de acceso:';

  @Output() selectOption = new EventEmitter<'login' | 'guest'>();

  constructor(public activeModal: NgbActiveModal) {}

  choose(option: 'login' | 'guest') {
    this.selectOption.emit(option);
  }

  close(): void {
    this.activeModal.close();
  }
}
