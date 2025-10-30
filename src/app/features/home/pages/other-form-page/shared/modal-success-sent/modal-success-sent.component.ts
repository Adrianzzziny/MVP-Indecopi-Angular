import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal-success-sent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-success-sent.component.html',
  styleUrls: ['./modal-success-sent.component.scss']
})
export class ModalSuccessSentComponent {
  @Input() email: string = 'correo@ejemplo.com';
  @Input() carga: string = '2025-V01-000111';

  constructor(public activeModal: NgbActiveModal) {}

  onDownload() {
    this.activeModal.close('download');
  }

  onYes() {
    this.activeModal.close('yes');
  }

  onNo() {
    this.activeModal.close('no');
  }
}
