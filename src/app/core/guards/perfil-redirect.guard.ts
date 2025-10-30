import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class PerfilGuard implements CanActivate {
    constructor(private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const oAuthUser = localStorage.getItem('oAuthUser');

        if (oAuthUser) {
            const parsedUser = JSON.parse(oAuthUser);
            const idPerfil = parsedUser.idPerfil;

            // Verifica los permisos según el perfil
            if (idPerfil === '3') {
                // Solo tiene acceso a mis-sesiones y pantallas de error
                if (state.url.startsWith('/gestion-salas/mis-sesiones') || state.url.startsWith('/gestion-salas/error')) {
                    return true;
                }
                this.router.navigate(['/gestion-salas/error-400']);
                return false;
            }

            if (idPerfil === '4') {
              if (state.url.startsWith('/gestion-salas/mis-sesiones') || state.url.startsWith('/gestion-salas/error')) {
                return true;
              }
                if (state.url.startsWith('/gestion-salas/mis-sesiones')) {
                    this.router.navigate(['/gestion-salas/error-400']);
                    return false;
                }
                return true;
            }

          if (idPerfil === '5') {
            if (state.url.startsWith('/gestion-salas/gerencia') || state.url.startsWith('/gestion-salas/error')) {
              return true;
            }
            if (state.url.startsWith('/gestion-salas/gerencia')) {
              this.router.navigate(['/gestion-salas/error-400']);
              return false;
            }
            return true;
          }

            // Perfiles 1 y 2 tienen acceso a todo
            if (idPerfil === '1' || idPerfil === '2') {
                return true;
            }
        }

        // Si no pertenece a ningún perfil válido, redirige a error-400
        this.router.navigate(['/gestion-salas/error-400']);
        return false;
    }
}
