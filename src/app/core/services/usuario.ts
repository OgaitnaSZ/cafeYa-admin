import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token';
import { User } from '../interfaces/user.model';
import { catchError, finalize, tap } from 'rxjs';
import { NotificacionService } from './notificacion';

@Injectable({
  providedIn: 'root',
})
export class Usuario {
  private apiUrl = `${environment.apiUrl}gestion/usuario/`;

  // Servicios
  http = inject(HttpClient);
  tokenService = inject(TokenService);
  private ns = inject(NotificacionService);

  // Signals
  usuarios = signal<User[]>([]);
  usuario = signal<User | null>(null);

  // Estados
  loading = signal(false);
  loadingLista = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Computed
  totalUsuarios = computed(() => this.usuarios().length);
  usuariosPorRol = computed(() => {
    const usuarios = this.usuarios();
    return {
      admin: usuarios.filter(u => u.rol === 'admin').length,
      encargado: usuarios.filter(u => u.rol === 'encargado').length,
      cocina: usuarios.filter(u => u.rol === 'cocina').length
    };
  });

  cargarUsuarios(): void {
    this.loadingLista.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.get<User[]>(`${this.apiUrl}usuarios`, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.usuarios.set(data);
      }),
      catchError(err => {
        this.ns.error('Error al cargar usuarios', err.error);
        return [];
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  crearUsuario(usuario: User): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.post<User>(`${this.apiUrl}crear`, usuario, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.usuario.set(data);
        this.usuarios.update(items => [...items, data]);
        this.ns.success(`Usuario ${data.nombre} creado con éxito`);
      }),
      catchError(err => {
        this.ns.error('Error al crear usuario', err.error);
        return [];
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  actualizarUsuario(usuario: User): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.put<User>(`${this.apiUrl}`, usuario, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.usuario.set(data);
        this.usuarios.update(items =>
          items.map(u => u.id === data.id ? data : u)
        );
        this.ns.success(`Usuario ${data.nombre} actualizado con éxito`);
      }),
      catchError(err => {
        this.ns.error('Error al actualizar usuario', err.error);
        return [];
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  eliminarUsuario(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.delete(`${this.apiUrl}eliminar/${id}`, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(() => {
        this.usuarios.update(items =>
          items.filter(u => u.id !== id)
        );
        this.ns.success('Usuario eliminado con éxito');
      }),
      catchError(err => {
        this.ns.error('Error al eliminar usuarios', err.error);
        return [];
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }
}
