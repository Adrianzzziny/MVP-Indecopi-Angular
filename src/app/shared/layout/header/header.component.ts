import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

  isLoggedIn = false;  // CAMBIAR A TRUE O FALSE
  userName = 'Marco Suarez';

  // estado submenús
  isManualesOpen = false;
  isTutorialesOpen = false;

  onLogin() {
    // lógica de login
    console.log('Ir a pantalla de login');
  }

  getInitials(fullName: string): string {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    const initials = parts.map(p => p[0]).slice(0, 2).join('');
    return initials.toUpperCase();
  }

  toggleMenu(menu: 'manuales' | 'tutoriales') {
    if (menu === 'manuales') {
      this.isManualesOpen = !this.isManualesOpen;
      this.isTutorialesOpen = false;
    } else {
      this.isTutorialesOpen = !this.isTutorialesOpen;
      this.isManualesOpen = false;
    }
  }

  openPdf(which: 'manuales' | 'tutoriales') {
    const url = which === 'manuales'
      ? environment.externalUrls.manualesPdf
      : environment.externalUrls.tutorialesPdf;

    // abrir en nueva pestaña (visualización)
    window.open(url, '_blank', 'noopener,noreferrer');
    // cerrar submenús
    this.closeMenus();
  }

  closeMenus() {
    this.isManualesOpen = false;
    this.isTutorialesOpen = false;
  }

  // Click fuera: cerrar
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const el = ev.target as HTMLElement;
    if (!el.closest('.top-nav')) this.closeMenus();
  }

  // Escape: cerrar
  @HostListener('document:keydown.escape')
  onEsc() {
    this.closeMenus();
  }

}
