// home.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { DocumentCardComponent, MaintenanceAlertComponent } from '../../components';
import {AlertComponent, AlertData} from '../../../../shared/components/alert/alert.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AccessAlertComponent } from '../../../../shared/components/access-alert/access-alert.component';


@Component({
    selector: 'app-home-page',
    standalone: true,
    templateUrl: './home-page.component.html',
    styleUrl: './home-page.component.scss',
    imports: [DocumentCardComponent, MaintenanceAlertComponent, AlertComponent],
})
export class HomePageComponent {

  constructor(
    private modalService: NgbModal,
    private router: Router
  ) {}

  ngOnInit() {
    const modalShow = localStorage.getItem('importantModalShow');
    if (!modalShow) {
    this.showImportantModal();
    }
  }

  onIngresar(type: string): void {
    console.log('Ingresando a:', type);

    // Ruta externa
    const externalUrl = environment.externalUrls.mdpVirtual;

    switch (type) {
      case 'otros':
        // Redirección interna dentro de Angular
        this.openAccessModal();
        break;

      case 'proteccion':
      case 'burocraticas':
        window.open(externalUrl, '_blank');
        break;

      default:
        console.warn('Tipo de opción no reconocida:', type);
        break;
    }
  }

  openAccessModal() {
    const modalRef = this.modalService.open(AccessAlertComponent, {
      centered: true,
      backdrop: true,
      keyboard: true
    });

    modalRef.componentInstance.selectOption.subscribe((option: 'login' | 'guest') => {
      modalRef.close();
      if (option === 'guest') {
        this.router.navigate(['/home/other-form']);
      } else if (option === 'login') {
        console.log('Abrir modal o vista de login próximamente');
      }
    });
  }

  showImportantModal() {

    const alertCfg = environment.maintenanceAlert;

    // Si está deshabilitada, no mostrar nada
    if (!alertCfg.enabled) return;

    const modalRef = this.modalService.open(AlertComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.data = {
      type: 'warning',
      title: alertCfg.title,
      message: alertCfg.message,
      titleAction: 'Continuar'
    } as AlertData;

    modalRef.componentInstance.mode = 'modal';

    modalRef.result.then(result => {
      console.log("Modal cerrado con acción:", result);
      localStorage.setItem('importantModalShow', 'true');
    });
  }
}
