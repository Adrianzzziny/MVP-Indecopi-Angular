import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    accessibilityWidget?: {
      setProyecto: (name: string) => void;
    };
    gtag?: (...args: any[]) => void; // Google Analytics 4
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor() {
    // Configura el nombre del proyecto para el widget de accesibilidad (si está disponible)
    if (window.accessibilityWidget?.setProyecto) {
      window.accessibilityWidget.setProyecto(environment.proyectoAccesibilidad);
      console.log('🎯 Proyecto de accesibilidad registrado:', environment.proyectoAccesibilidad);
    } else {
      console.warn('⚠️ Widget de accesibilidad no disponible al inicializar AnalyticsService.');
    }
  }

  /**
   * Envía un evento de uso de accesibilidad a Google Analytics.
   * @param nombre Nombre del evento (por ejemplo "AumentarTexto", "ContrasteAlto").
   */
  enviarEventoAccesibilidad(nombre: string): void {
    const proyecto = environment.proyectoAccesibilidad || 'DefaultProyecto';
    const eventoFinal = `${nombre}_${proyecto}`;

    console.log('📊 Enviando evento de accesibilidad:', eventoFinal);

    // Si tienes configurado Google Analytics con gtag (GA4)
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventoFinal, {
        event_category: 'Accesibilidad',
        event_label: 'Uso de Funcionalidad'
      });
    } else {
      console.warn('⚠️ Google Analytics no detectado (window.gtag no definido).');
    }
  }
}
