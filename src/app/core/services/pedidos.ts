import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TokenService } from './token';
import { Pedido, FiltrosPedidos, StatsPedidos, PedidoEstado } from '../interfaces/pedido.model';
import { catchError, finalize, of, tap } from 'rxjs';
import { NotificacionService } from './notificacion';

export interface PaginatedPedidos {
  data:       Pedido[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class PedidosServices {
  private apiUrl = `${environment.apiUrl}gestion/pedido/`;

  // Servicios
  http = inject(HttpClient);
  tokenService = inject(TokenService);
  private ns = inject(NotificacionService);

  // Signals
  pedidos = signal<Pedido[]>([]);
  pedidosActivos = signal<Pedido[]>([]);
  pedido = signal<Pedido | null>(null);
  stats = signal<StatsPedidos | null>(null);

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

  // Filtros activos
  filtrosActivos = signal<FiltrosPedidos>({});

  // Computed
  totalPedidos = computed(() => this.pedidos().length);
  
  pedidosPorEstado = computed(() => {
    const pedidos = this.pedidos();
    return {
      pendientes: pedidos.filter(p => p.estado === 'Pendiente').length,
      en_preparacion: pedidos.filter(p => p.estado === 'En_preparacion').length,
      listos: pedidos.filter(p => p.estado === 'Listo').length,
      entregados: pedidos.filter(p => p.estado === 'Entregado').length,
      cancelados: pedidos.filter(p => p.estado === 'Cancelado').length,
    };
  });

  totalRecaudado = computed(() => 
    this.pedidos()
      .filter(p => p.estado !== 'Cancelado')
      .reduce((sum, p) => sum + Number(p.precio_total), 0)
  );

  registroDesde = computed(() =>
    this.totalRegistros() === 0
      ? 0
      : (this.paginaActual() - 1) * this.limitePorPagina() + 1
  );

  registroHasta = computed(() =>
    Math.min(this.paginaActual() * this.limitePorPagina(), this.totalRegistros())
  );

  tieneFiltros = computed(() => {
    const filtros = this.filtrosActivos();
    return !!(
      filtros.pedido_id || 
      filtros.cliente_id || 
      filtros.mesa_id || 
      (filtros.estado && filtros.estado !== 'todos') ||
      filtros.fecha_desde ||
      filtros.fecha_hasta ||
      filtros.search
    );
  });

  cargarPedidos(filtros?: FiltrosPedidos, pagina = this.paginaActual()): void {
    this.loadingLista.set(true);
    this.error.set(null);
    this.success.set(null);

    if (filtros) {
      this.filtrosActivos.set(filtros);
      this.paginaActual.set(1);
      pagina = 1;
    }

    const f = filtros ?? this.filtrosActivos();
    let params = new HttpParams()
      .set('page',  pagina)
      .set('limit', this.limitePorPagina());

    if (f.pedido_id) params = params.set('pedido_id', f.pedido_id);
    if (f.cliente_id) params = params.set('cliente_id', f.cliente_id);
    if (f.mesa_id) params = params.set('mesa_id', f.mesa_id);
    if (f.estado && f.estado !== 'todos') params = params.set('estado', f.estado);
    if (f.search) params = params.set('search', f.search);
    if (f.fecha_desde) {
      const d = new Date(f.fecha_desde as any);
      if (!isNaN(d.getTime())) params = params.set('fecha_desde', d.toISOString());
    }
    if (f.fecha_hasta) {
      const d = new Date(f.fecha_hasta as any);
      if (!isNaN(d.getTime())) params = params.set('fecha_hasta', d.toISOString());
    }

    this.http.get<PaginatedPedidos>(`${this.apiUrl}pedidos`, { params }).pipe(
      tap(res => {
        this.pedidos.set(res.data.map(p => ({ ...p, productos: p.productos ?? [] })));
        this.paginaActual.set(res.page);
        this.limitePorPagina.set(res.limit);
        this.totalRegistros.set(res.total);
        this.totalPaginas.set(res.totalPages);
      }),
      catchError(err => {
        this.ns.error('Error al cargar pedidos', err.error.message);
        return of([]);
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaActual.set(pagina);
    this.cargarPedidos(undefined, pagina);
  }

  cambiarLimite(limite: number): void {
    this.limitePorPagina.set(limite);
    this.paginaActual.set(1);
    this.cargarPedidos(undefined, 1);
  }

  cargarPedido(pedidoId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Pedido>(`${this.apiUrl}pedidos/pedidos/${pedidoId}`).pipe(
      tap(data => {
        this.pedido.set(data);
      }),
      catchError(err => {
        this.ns.error('Error al cargar pedido', err.error.message);       
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  cargarPedidosActivos(): void {
    this.loadingLista.set(true);
    this.error.set(null);

    this.http.get<Pedido[]>(`${this.apiUrl}activos`).pipe(
      tap(data => {
        this.pedidosActivos.set(data);
      }),
      catchError(err => {
        this.ns.error('Error al cargar pedidos', err.error.message);       
        return of([]);
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  cambiarEstadoPedido(pedidoId: string, nuevoEstado: PedidoEstado): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.patch<Pedido>(`${this.apiUrl}estado`, { pedido_id: pedidoId ,estado: nuevoEstado }).pipe(
      tap(data => {
        this.pedido.set(data);
        this.pedidos.update(items =>
          items.map(p => p.pedido_id === data.pedido_id ? data : p)
        );
        this.ns.success(`Pedido ${data.numero_pedido} → ${nuevoEstado}`);
      }),
      catchError(err => {
        this.ns.error("Error al actualizar pedido", err.error.message);       
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  limpiarFiltros(): void {
    this.filtrosActivos.set({});
  }
}
