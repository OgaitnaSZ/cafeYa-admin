import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token';
import {
  DashboardResumen,
  PedidoActivoDashboard,
  calcularVariacion,
} from '../interfaces/dashboard.model';
import { catchError, finalize, of, tap } from 'rxjs';
import { NotificacionService } from './notificacion';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}gestion/dashboard`;

  // Servicios
  http = inject(HttpClient);
  tokenService = inject(TokenService);
  private ns = inject(NotificacionService);

  // Signals
  resumen = signal<DashboardResumen | null>(null);

  // Estados
  loading = signal(false);
  error   = signal<string | null>(null);

  // Computed - KPIs
  recaudadoHoy = computed(() => this.resumen()?.recaudadoHoy ?? 0);
  recaudadoAyer = computed(() => this.resumen()?.recaudadoAyer ?? 0);
  pedidosHoy = computed(() => this.resumen()?.totalPedidosHoy ?? 0);
  pedidosAyer = computed(() => this.resumen()?.pedidosAyer ?? 0);
  ticketPromedio = computed(() => this.resumen()?.ticketPromedioHoy ?? 0);

  variacionRecaudado = computed(() =>
    calcularVariacion(this.recaudadoHoy(), this.recaudadoAyer())
  );
  variacionPedidos = computed(() =>
    calcularVariacion(this.pedidosHoy(), this.pedidosAyer())
  );

  // Computed - Mesas
  mesas = computed(() => this.resumen()?.mesas        ?? []);
  mesasOcupadas = computed(() => this.resumen()?.mesasOcupadas ?? 0);
  mesasDisponibles = computed(() =>
    (this.resumen()?.totalMesas ?? 0) - (this.resumen()?.mesasOcupadas ?? 0)
  );
  totalMesas = computed(() => this.resumen()?.totalMesas ?? 0);

  // Computed - Pedidos activos
  pedidosActivos = computed(() => this.resumen()?.pedidosActivos ?? []);

  pedidosPendientes = computed(() =>
    this.pedidosActivos().filter((p: PedidoActivoDashboard) => p.estado === 'Pendiente')
  );
  pedidosEnPreparacion = computed(() =>
    this.pedidosActivos().filter((p: PedidoActivoDashboard) => p.estado === 'En_preparacion')
  );
  pedidosListos = computed(() =>
    this.pedidosActivos().filter((p: PedidoActivoDashboard) => p.estado === 'Listo')
  );

  // Computed - Pagos
  resumenPagos = computed(() =>
    this.resumen()?.resumenPagos ?? { efectivo: 0, tarjeta: 0, app: 0 }
  );
  totalCobrado = computed(() => {
    const p = this.resumenPagos();
    return p.efectivo + p.tarjeta + p.app;
  });
  pctEfectivo = computed(() => this.pct(this.resumenPagos().efectivo));
  pctTarjeta = computed(() => this.pct(this.resumenPagos().tarjeta));
  pctApp = computed(() => this.pct(this.resumenPagos().app));

  // Computed - Productos
  topProductos = computed(() => this.resumen()?.topProductos ?? []);

  // Computed - Calificaciones
  calificacionPromedio = computed(() => this.resumen()?.calificacionPromedio ?? null);
  totalCalificaciones = computed(() => this.resumen()?.totalCalificaciones ?? 0);
  calificacionesRecientes = computed(() => this.resumen()?.calificacionesRecientes ?? []);

  // Computed - Metadata
  generadoEn = computed(() => this.resumen()?.generadoEn ?? null);

  // Métodos
  private pct(valor: number): number {
    const total = this.totalCobrado();
    return total > 0 ? Math.round((valor / total) * 100) : 0;
  }

  cargarResumen(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<DashboardResumen>(this.apiUrl, {
        headers: this.tokenService.createAuthHeaders(),
      })
      .pipe(
        tap((data) => this.resumen.set(data)),
        catchError((err) => {
          this.ns.error('Error al cargar dashboard', err.error.message);
          return of([]);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe();
  }
}