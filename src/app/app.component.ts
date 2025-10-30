import { CommonModule } from '@angular/common';
import { Component, Renderer2, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NgbDateParserFormatter, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateParserFormatterCustom } from './core/utils/NgbDateParserFormatterCustom';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    NgbModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    { provide: NgbDateParserFormatter, useClass: NgbDateParserFormatterCustom }
  ]
})
export class AppComponent implements OnInit {
  title = 'project-mdpvfrontend';

  constructor(private renderer: Renderer2) {
    console.log('version 2.0');
  }

  ngOnInit() {
    if (environment.accesibilidadURL) {
      this.loadAccessibilityFiles();
    } else {
      console.warn('Widget de accesibilidad no configurado o fuera de servicio');
    }
  }

  private loadAccessibilityFiles(): void {
    const accesibilidadURL = environment.accesibilidadURL;

    if (!accesibilidadURL) {
      console.warn('No se encontró environment.accesibilidadURL');
      return;
    }

    // ---- Cargar el CSS ----
    const link = this.renderer.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${accesibilidadURL}accesibilidad.css?v=1.0.51`;
    this.renderer.appendChild(document.head, link);

    // ---- Cargar el JS ----
    const script = this.renderer.createElement('script');
    script.src = `${accesibilidadURL}accesibilidad.js?v=1.0.51`;
    script.defer = true;

    // Listener opcional para depuración
    script.onload = () => console.log('Widget de accesibilidad cargado correctamente');
    script.onerror = () => console.error('Error al cargar accesibilidad.js');

    this.renderer.appendChild(document.body, script);
  }

}
