import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TokenService } from './token';
import { Pedido, FiltrosPedidos, StatsPedidos, PedidoEstado } from '../interfaces/pedido.model';
import { catchError, finalize, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PedidosServices {
  private apiUrl = `${environment.apiUrl}gestion/pedido/`;

  http = inject(HttpClient);
  tokenService = inject(TokenService);

  // Signals
  pedidos = signal<Pedido[]>([]);
  pedido = signal<Pedido | null>(null);
  stats = signal<StatsPedidos | null>(null);

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

  // Tiene filtros activos
  tieneFiltros = computed(() => {
    const filtros = this.filtrosActivos();
    return !!(
      filtros.cliente_id || 
      filtros.mesa_id || 
      (filtros.estado && filtros.estado !== 'todos') ||
      filtros.fecha_desde ||
      filtros.fecha_hasta ||
      filtros.search
    );
  });

  cargarPedidos(filtros?: FiltrosPedidos): void {
    this.loadingLista.set(true);
    this.error.set(null);
    this.success.set(null);

    // Guardar filtros activos
    if (filtros) {
      this.filtrosActivos.set(filtros);
    }

    // Construir query params
    let params = new HttpParams();
    
    if (filtros?.cliente_id) {
      params = params.set('cliente_id', filtros.cliente_id);
    }
    if (filtros?.mesa_id) {
      params = params.set('mesa_id', filtros.mesa_id);
    }
    if (filtros?.estado && filtros.estado !== 'todos') {
      params = params.set('estado', filtros.estado);
    }
    if (filtros?.fecha_desde) {
      params = params.set('fecha_desde', filtros.fecha_desde.toISOString());
    }
    if (filtros?.fecha_hasta) {
      params = params.set('fecha_hasta', filtros.fecha_hasta.toISOString());
    }
    if (filtros?.search) {
      params = params.set('search', filtros.search);
    }

    this.http.get<Pedido[]>(`${this.apiUrl}pedidos`, {
      headers: this.tokenService.createAuthHeaders(),
      params
    }).pipe(
      tap(data => {
        const pedidosNormalizados = data.map(p => ({
          ...p,
          productos: p.productos ?? []
        }));
      
        this.pedidos.set(pedidosNormalizados);
      }),
      catchError(err => {
        this.error.set('Error al cargar pedidos');
        console.error(err);
        return of([]);
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  cargarPedido(pedidoId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Pedido>(`${this.apiUrl}pedidos/pedidos/${pedidoId}`, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.pedido.set(data);
      }),
      catchError(err => {
        this.error.set('Error al cargar pedido');
        console.error(err);
        return [];
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  cargarPedidosActivos(): void {
    this.loadingLista.set(true);
    this.error.set(null);

    this.http.get<Pedido[]>(`${this.apiUrl}activos`, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.pedidos.set(data);
      }),
      catchError(err => {
        this.error.set('Error al cargar pedidos');
        console.error(err);
        return [];
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  cambiarEstadoPedido(pedidoId: string, nuevoEstado: PedidoEstado): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.patch<Pedido>(`${this.apiUrl}estado`, { pedido_id: pedidoId ,estado: nuevoEstado }, {
      headers: this.tokenService.createAuthHeaders()
    }).pipe(
      tap(data => {
        this.pedido.set(data);
        this.pedidos.update(items =>
          items.map(p => p.pedido_id === data.pedido_id ? data : p)
        );
        this.success.set(`Pedido ${data.numero_pedido} → ${nuevoEstado}`);
      }),
      catchError(err => {
        this.error.set(err.error?.message || 'Error al actualizar pedido');
        console.error(err);
        return [];
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  limpiarFiltros(): void {
    this.filtrosActivos.set({});
  }
}
