import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TokenService } from './token';
import { Cliente } from '../interfaces/cliente.model';
import { catchError, finalize, of, tap } from 'rxjs';
import { NotificacionService } from './notificacion';

export interface PaginatedClientes {
  data:       Cliente[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

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

  // Paginación
  paginaActual    = signal(1);
  limitePorPagina = signal(10);
  totalRegistros  = signal(0);
  totalPaginas    = signal(0);

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

  registroDesde = computed(() =>
    this.totalRegistros() === 0 ? 0 : (this.paginaActual() - 1) * this.limitePorPagina() + 1
  );
  registroHasta = computed(() =>
    Math.min(this.paginaActual() * this.limitePorPagina(), this.totalRegistros())
  );

  cargarClientes(pagina = this.paginaActual()): void {
    this.loadingLista.set(true);
    this.error.set(null);
    this.success.set(null);

    const params = new HttpParams()
      .set('page', pagina)
      .set('limit', this.limitePorPagina());

    this.http.get<PaginatedClientes>(`${this.apiUrl}clientes`).pipe(
      tap(res => {
        this.clientes.set(res.data);
        this.paginaActual.set(res.page);
        this.limitePorPagina.set(res.limit);
        this.totalRegistros.set(res.total);
        this.totalPaginas.set(res.totalPages);
      }),
      catchError(err => {
        this.ns.error('Error al cargar clientes', err.error.message);
        return of([]);
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }
  
  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaActual.set(pagina);
    this.cargarClientes(pagina);
  }

  cambiarLimite(limite: number): void {
    this.limitePorPagina.set(limite);
    this.paginaActual.set(1);
    this.cargarClientes(1);
  }

  cargarCliente(clienteId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Cliente>(`${this.apiUrl}${clienteId}`).pipe(
      tap(data => {
        this.cliente.set(data);
      }),
      catchError(err => {
        this.ns.error('Error al cargar cliente', err.error.message);
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  eliminarCliente(clienteId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.delete(`${this.apiUrl}eliminar/${clienteId}`).pipe(
      tap(() => {
        this.clientes.update(items =>
          items.filter(c => c.cliente_id !== clienteId)
        );
        this.ns.success('Cliente eliminado con exito');
      }),
      catchError(err => {
        this.ns.error('Error al elimnar clientes', err.error.message);
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }
}
