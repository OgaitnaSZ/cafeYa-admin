import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user.model';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TokenService } from './token';
import { catchError, finalize, of, tap } from 'rxjs';

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})

export class Auth {
  private authUrl = `${environment.apiUrl}auth/`;

  // Inject
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals de estado
  user = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(this.getStoredToken());
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Computed Estados intermedios
  readonly isAuthenticated = computed(() => !!this.user() && !!this.token());

  // Computed útiles
  readonly currentUser = computed(() => this.user());

  constructor() {
    // Efecto para mantener sincronizado localStorage
    effect(() => {
      const token = this.token();
      const user = this.user();

      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    });
  }

  // Login
  login(user: User): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.post<LoginResponse>(`${this.authUrl}login`, { user }).pipe(
      tap((data) => {
        console.log('Respuesta de login:', data);
        this.success.set("Login exitoso");
        this.user.set(data.user);
        this.token.set(data.token);
      }),
      catchError(err => {
        this.error.set('Error al iniciar session');
        console.error(err);
        return of(null);
      }), 
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  // Logout
  logout() {
    this.token.set(null);
    this.user.set(null);
    this.router.navigate(['/']);
  }

  // Helpers
  private getStoredUser(): User | null {
    const stored = localStorage.getItem('user');
    if (!stored || stored === 'undefined' || stored === 'null') {
      return null;
    }
  
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error al parsear usuario almacenado:', e);
      return null;
    }
  }
  
  private getStoredToken(): string | null {
    const stored = localStorage.getItem('token');
    if (!stored || stored === 'undefined' || stored === 'null') {
      return null;
    }
  
    return stored;
  }

  // Accesores públicos (solo lectura)
  get getToken() {
    return this.token.asReadonly();
  }

  get getUser() {
    return this.user.asReadonly();
  }
}
