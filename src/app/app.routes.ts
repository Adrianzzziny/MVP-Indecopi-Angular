import { Routes } from '@angular/router';
import { Error404PageComponent } from './shared/pages';
import { InitialRedirectGuard } from './core/guards/initial-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    // canActivate: [InitialRedirectGuard],
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./features/home/home.routes').then(m => m.HOME_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  { path: '**', component: Error404PageComponent }
];
