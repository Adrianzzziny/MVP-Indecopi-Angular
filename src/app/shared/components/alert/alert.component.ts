import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export interface AlertData {
  type?: 'info' | 'error' | 'success' | 'warning';
  icon?: string;
  title?: string;
  message?: string;
  fullMessage?: string;
  titleAction?: string;
  secondaryAction?: string;
  linkAction?: { label: string; url?: string };
  questionAction?: { text: string; yes: string; no: string };
}

@Component({
  standalone: true,
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  imports: [CommonModule, MatCardModule, MatIconModule]
})
export class AlertComponent {

  private readonly activeModal =  inject(NgbActiveModal, {optional: true});

  @Input() data!: AlertData;
  @Input() mode: 'inline' | 'modal' | 'card' = 'inline';

  closeModal(action: 'primary' | 'secondary' | 'yes' | 'no' = 'primary') {
    if (this.mode === 'modal' && this.activeModal) {
    this.activeModal.close(action);
    }
  }

  expanded = false; // 👈 controla si el texto está expandido o no

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  get displayedMessage(): string {
    if (this.expanded || !this.data.fullMessage) {
      return this.data.message || '';
    }
    return this.data.message || '';
  }

}
