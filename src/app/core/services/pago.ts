import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TokenService } from './token';
import { Pago, FiltrosPagos, StatsPagos } from '../interfaces/pago.model';
import { catchError, finalize, of, tap } from 'rxjs';
import { NotificacionService } from './notificacion';

export interface PaginatedPagos {
  data:       Pago[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class PagoService {
  private apiUrl = `${environment.apiUrl}gestion/pago/`;

  // Servicios
  http = inject(HttpClient);
  tokenService = inject(TokenService);
  private ns = inject(NotificacionService);

  // Signals
  pagos = signal<Pago[]>([]);
  pago = signal<Pago | null>(null);
  recibo_url = signal<string | null>(null);
  stats = signal<StatsPagos | null>(null);

  // Paginación
  paginaActual = signal(1);
  limitePorPagina = signal(10);
  totalRegistros = signal(0);
  totalPaginas = signal(0);

  // Estados
  loading = signal(false);
  loadingLista = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Filtros activos
  filtrosActivos = signal<FiltrosPagos>({});

  // Computed
  totalPagos = computed(() => this.pagos().length);
  totalRecaudado = computed(() => 
    this.pagos().reduce((sum, p) => sum + Number(p.monto_final), 0)
  );
  totalIVA = computed(() => 
    this.pagos().reduce<number>((sum, p) => {
      const iva = Number(p.iva);
      return sum + (isNaN(iva) ? 0 : iva);
    }, 0)
  );
  
  pagosPorMedio = computed(() => {
    const pagos = this.pagos();
    return {
      app: pagos.filter(p => p.medio_de_pago === 'app').length,
      tarjeta: pagos.filter(p => p.medio_de_pago === 'tarjeta').length,
      efectivo: pagos.filter(p => p.medio_de_pago === 'efectivo').length,
    };
  });

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
      (filtros.medio_de_pago && filtros.medio_de_pago !== 'todos') ||
      filtros.fecha_desde ||
      filtros.fecha_hasta
    );
  });

  cargarPagos(filtros?: FiltrosPagos, pagina = this.paginaActual()): void {
    this.loadingLista.set(true);
    this.error.set(null);
    this.success.set(null);

    if (filtros) {
      this.filtrosActivos.set(filtros);
      this.paginaActual.set(1); // Al cambiar filtros volver a la página 1
      pagina = 1;
    }

    let params = new HttpParams()
      .set('page',  pagina)
      .set('limit', this.limitePorPagina());
    
    const f = filtros ?? this.filtrosActivos();
    if (f.pedido_id) params = params.set('pedido_id', f.pedido_id);
    if (f.medio_de_pago && f.medio_de_pago !== 'todos') params = params.set('medio_de_pago', f.medio_de_pago);
    if (f.fecha_desde) {
      const d = new Date(f.fecha_desde as any);
      if (!isNaN(d.getTime())) params = params.set('fecha_desde', d.toISOString());
    }
    if (f.fecha_hasta) {
      const d = new Date(f.fecha_hasta as any);
      if (!isNaN(d.getTime())) params = params.set('fecha_hasta', d.toISOString());
    }
    if (f.search) params = params.set('search', f.search);
    
    this.http.get<PaginatedPagos>(`${this.apiUrl}pagos`, { params }).pipe(
      tap(res => {
        this.pagos.set(res.data);
        this.paginaActual.set(res.page);
        this.limitePorPagina.set(res.limit);
        this.totalRegistros.set(res.total);
        this.totalPaginas.set(res.totalPages);
      }),
      catchError(err => {
        this.ns.error('Error al cargar pagos', err.error.message);
        return of([]);
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaActual.set(pagina);
    this.cargarPagos(undefined, pagina);
  }  
  cambiarLimite(limite: number): void {
    this.limitePorPagina.set(limite);
    this.paginaActual.set(1);
    this.cargarPagos(undefined, 1);
  }

  cargarPago(pagoId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Pago>(`${this.apiUrl}${pagoId}`).pipe(
      tap(data => {
        this.pago.set(data);
      }),
      catchError(err => {
        this.ns.error('Error al cargar pago', err.error.message);
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  generarRecibo(pago_id: string): void {
    window.open(`${environment.apiUrl}pago/${pago_id}/recibo`, '_blank');
  }

  limpiarFiltros(): void {
    this.filtrosActivos.set({});
  }
}

