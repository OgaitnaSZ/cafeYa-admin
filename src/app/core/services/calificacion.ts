import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TokenService } from './token';
import { Calificacion, FiltrosCalificaciones, StatsCalificaciones } from '../interfaces/calificacion.model';
import { catchError, finalize, of, tap } from 'rxjs';
import { NotificacionService } from './notificacion';

export interface PaginatedCalificaciones {
  data: Calificacion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class CalificacionService {
  private apiUrl = `${environment.apiUrl}gestion/calificaciones`;

  // Servicios
  http = inject(HttpClient);
  tokenService = inject(TokenService);
  private ns = inject(NotificacionService);

  // Signals
  calificaciones = signal<Calificacion[]>([]);
  calificacion = signal<Calificacion | null>(null);
  stats = signal<StatsCalificaciones | null>(null);

  // Paginación
  paginaActual = signal(1);
  limitePorPagina = signal(12);
  totalRegistros = signal(0);
  totalPaginas = signal(0);

  // Estados
  loading = signal(false);
  loadingLista = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Filtros activos
  filtrosActivos = signal<FiltrosCalificaciones>({});

  // Computed
  totalCalificaciones = computed(() => this.calificaciones().length);
  promedioGeneral = computed(() => {
    const cals = this.calificaciones();
    if (cals.length === 0) return 0;
    return cals.reduce((sum, c) => sum + c.puntuacion, 0) / cals.length;
  });

  calificacionesPorPuntuacion = computed(() => {
    const cals = this.calificaciones();
    return {
      cinco: cals.filter(c => c.puntuacion === 5).length,
      cuatro: cals.filter(c => c.puntuacion === 4).length,
      tres: cals.filter(c => c.puntuacion === 3).length,
      dos: cals.filter(c => c.puntuacion === 2).length,
      uno: cals.filter(c => c.puntuacion === 1).length,
    };
  });

  conResena = computed(() => 
    this.calificaciones().filter(c => c.resena && c.resena.trim().length > 0).length
  );

  registroDesde = computed(() =>
    this.totalRegistros() === 0 ? 0 : (this.paginaActual() - 1) * this.limitePorPagina() + 1
  );

  registroHasta = computed(() =>
    Math.min(this.paginaActual() * this.limitePorPagina(), this.totalRegistros())
  );

  tieneFiltros = computed(() => {
    const filtros = this.filtrosActivos();
    return !!(
      filtros.pedido_id || 
      filtros.fecha_desde ||
      filtros.fecha_hasta ||
      filtros.search ||
      filtros.puntuacion
    );
  });

  cargarCalificaciones(filtros?: FiltrosCalificaciones, pagina = this.paginaActual()): void {
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
      .set('page', pagina)
      .set('limit', this.limitePorPagina());

    if (f.pedido_id) params = params.set('pedido_id', f.pedido_id);
    if (f.puntuacion) params = params.set('puntuacion', f.puntuacion.toString());
    if (f.search) params = params.set('search', f.search);
    if (f.fecha_desde) params = params.set('fecha_desde', f.fecha_desde.toISOString());
    if (f.fecha_hasta) params = params.set('fecha_hasta', f.fecha_hasta.toISOString());

    this.http.get<PaginatedCalificaciones>(`${this.apiUrl}`, {params}).pipe(
      tap(res => {
        this.calificaciones.set(res.data);
        this.paginaActual.set(res.page);
        this.limitePorPagina.set(res.limit);
        this.totalRegistros.set(res.total);
        this.totalPaginas.set(res.totalPages);
      }),
      catchError(err => {
        this.ns.error('Error al cargar calificaciones', err.error.message);
        return of([]);
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaActual.set(pagina);
    this.cargarCalificaciones(undefined, pagina);
  }

  cambiarLimite(limite: number): void {
    this.limitePorPagina.set(limite);
    this.paginaActual.set(1);
    this.cargarCalificaciones(undefined, 1);
  }

  cargarCalificacion(calificacionId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Calificacion>(`${this.apiUrl}${calificacionId}`).pipe(
      tap(data => {
        this.calificacion.set(data);
      }),
      catchError(err => {
        this.ns.error('Error al cargar calificacion', err.error.message);
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  limpiarFiltros(): void {
    this.filtrosActivos.set({});
  }
}
