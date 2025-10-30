// src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './core/helpers/auth.service';
import { jwtInterceptor } from './core/helpers/jwt.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
registerLocaleData(localeEs, 'es');

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    provideAnimations(),
    AuthService,

    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService, Router],
      multi: true, // Permite ejecutar junto con otros inicializadores
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const iconRegistry = inject(MatIconRegistry);
        const sanitizer = inject(DomSanitizer);

        iconRegistry.addSvgIcon('shield', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/shield.svg'));
        iconRegistry.addSvgIcon('search', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/search.svg'));
        iconRegistry.addSvgIcon('folder', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/folder.svg'));

        return () => { };
      },
      multi: true,
    },
    {
      provide: LOCALE_ID,
      useValue: 'es'
    }

  ],
};

function initializeApp(authService: AuthService, router: Router) {
  return async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('jgapps'); // Obtén el parámetro `jgapps`

    if (!token) {
      console.log('Login skipped. No token provided in URL.');
      return;
    }

    try {
      // Llama al servicio de login incluso si hay una sesión activa
      console.log('Login attempt with token:', token);
      await authService.login(token).toPromise();
      console.log('Login successful.');
    } catch (error) {
      console.error('Login failed:', error);
      router.navigate(['/gestion-salas/error-500']); // Redirige a /error-500 si el login falla
      throw error; // Angular detendrá la inicialización
    }
  };
}
