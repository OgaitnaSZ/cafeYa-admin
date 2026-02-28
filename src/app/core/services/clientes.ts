import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token';
import { Cliente } from '../interfaces/cliente.model';
import { catchError, finalize, tap } from 'rxjs';
import { NotificacionService } from './notificacion';

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private apiUrl = `${environment.apiUrl}gestion/cliente/`;

  // Servicios
  http = inject(HttpClient);
  tokenService = inject(TokenService);
  private ns = inject(NotificacionService);

  // Signals
  clientes = signal<Cliente[]>([]);
  cliente = signal<Cliente | null>(null);

  // Estados
  loading = signal(false);
  loadingLista = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Computed
  totalClientes = computed(() => this.clientes().length);
  clientesConPedidos = computed(() => 
    this.clientes().filter(c => (c._count?.pedidos || 0) > 0).length
  );
  clientesSinPedidos = computed(() => 
    this.clientes().filter(c => (c._count?.pedidos || 0) === 0).length
  );
  totalPedidos = computed(() => 
    this.clientes().reduce((sum, c) => sum + (c._count?.pedidos || 0), 0)
  );

  cargarClientes(): void {
    this.loadingLista.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.get<Cliente[]>(`${this.apiUrl}clientes`, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.clientes.set(data);
      }),
      catchError(err => {
        this.ns.error('Error al cargar clientes', err.error);
        return [];
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  cargarCliente(clienteId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Cliente>(`${this.apiUrl}${clienteId}`, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.cliente.set(data);
      }),
      catchError(err => {
        this.ns.error('Error al cargar cliente', err.error);
        return [];
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  eliminarCliente(clienteId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.delete(`${this.apiUrl}eliminar/${clienteId}`, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(() => {
        this.clientes.update(items =>
          items.filter(c => c.cliente_id !== clienteId)
        );
        this.ns.success('Cliente eliminado con exito');
      }),
      catchError(err => {
        this.ns.error('Error al elimnar clientes', err.error);
        return [];
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }
}
