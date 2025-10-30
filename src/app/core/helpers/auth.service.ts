import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl: string;
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<any>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.baseUrl = environment.url_host;
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('oAuthUser');
    this.tokenSubject.next(savedToken);
    this.userSubject.next(savedUser ? JSON.parse(savedUser) : null);
    this.isAuthenticatedSubject.next(!!savedToken);
  }

  login(token: string) {
    const url = `${this.baseUrl}auth/login`;
    return this.http.get<any>(url, { params: { token } }).pipe(
      tap((response) => {


        //PROVICIONAL
        //response.idPerfil = "2";


        this.tokenSubject.next(response.token);
        this.userSubject.next(response);
        this.isAuthenticatedSubject.next(true);

        console.log('response', response);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('oAuthUser', JSON.stringify(response));
      })
    );
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getUser(): any {
    return this.userSubject.value;
  }

  isAuthenticated(): BehaviorSubject<boolean> {
    return this.isAuthenticatedSubject;
  }

  ensureLoginCompleted(): Promise<void> {
    return firstValueFrom(this.isAuthenticatedSubject.asObservable()).then(() => { });
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('oAuthUser');
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
