import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class InitialRedirectGuard implements CanActivate {
    constructor(private router: Router) { }

  canActivate(): boolean {
    const oAuthUser = localStorage.getItem('oAuthUser');

    if (oAuthUser) {
      const parsedUser = JSON.parse(oAuthUser);
      const idPerfil = parsedUser.idPerfil;

      if (idPerfil === '3') {
        this.router.navigate(['/gestion-salas/mis-sesiones']);
        return false;
      }
      if (idPerfil === '5') {
        this.router.navigate(['/gestion-salas/gerencia']);
        return false;
      }
    }

    // Si no hay perfil válido, redirige a gestion-salas/comision
    this.router.navigate(['/gestion-salas/comision']);
    return false;
  }
}
