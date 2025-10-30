import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const currentToken = authService.getToken();

  if (currentToken) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${currentToken}`,
      },
    });
  }

  return next(req);
};