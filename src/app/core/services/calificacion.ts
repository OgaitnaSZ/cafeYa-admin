import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TokenService } from './token';
import { Calificacion, FiltrosCalificaciones, StatsCalificaciones } from '../interfaces/calificacion.model';
import { catchError, finalize, of, tap } from 'rxjs';
import { NotificacionService } from './notificacion';

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

  // Tiene filtros activos
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

  cargarCalificaciones(filtros?: FiltrosCalificaciones): void {
    this.loadingLista.set(true);
    this.error.set(null);
    this.success.set(null);

    // Guardar filtros activos
    if (filtros) {
      this.filtrosActivos.set(filtros);
    }

    // Construir query params
    let params = new HttpParams();
    
    if (filtros?.pedido_id) {
      params = params.set('pedido_id', filtros.pedido_id);
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
    if (filtros?.puntuacion) {
      params = params.set('puntuacion', filtros.puntuacion.toString());
    }

    this.http.get<Calificacion[]>(`${this.apiUrl}`).pipe(
      tap(data => {
        this.calificaciones.set(data);
      }),
      catchError(err => {
        this.ns.error('Error al cargar calificaciones', err.error.message);
        return of([]);
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
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
