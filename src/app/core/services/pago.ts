import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TokenService } from './token';
import { Pago, FiltrosPagos, StatsPagos, MedioDePago } from '../interfaces/pago.model';
import { catchError, finalize, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PagoService {
  private apiUrl = `${environment.apiUrl}gestion/pago/`;

  http = inject(HttpClient);
  tokenService = inject(TokenService);

  // Signals
  pagos = signal<Pago[]>([]);
  pago = signal<Pago | null>(null);
  recibo_url = signal<string | null>(null);
  stats = signal<StatsPagos | null>(null);

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
    this.pagos().reduce((sum, p) => sum + Number(p.IVA), 0)
  );

  pagosPorMedio = computed(() => {
    const pagos = this.pagos();
    return {
      app: pagos.filter(p => p.medio_de_pago === 'app').length,
      tarjeta: pagos.filter(p => p.medio_de_pago === 'tarjeta').length,
      efectivo: pagos.filter(p => p.medio_de_pago === 'efectivo').length,
    };
  });

  // Tiene filtros activos
  tieneFiltros = computed(() => {
    const filtros = this.filtrosActivos();
    return !!(
      filtros.pedido_id || 
      (filtros.medio_de_pago && filtros.medio_de_pago !== 'todos') ||
      filtros.fecha_desde ||
      filtros.fecha_hasta
    );
  });

  cargarPagos(filtros?: FiltrosPagos): void {
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
    if (filtros?.medio_de_pago && filtros.medio_de_pago !== 'todos') {
      params = params.set('medio_de_pago', filtros.medio_de_pago);
    }
    if (filtros?.fecha_desde) {
      params = params.set('fecha_desde', filtros.fecha_desde.toISOString());
    }
    if (filtros?.fecha_hasta) {
      params = params.set('fecha_hasta', filtros.fecha_hasta.toISOString());
    }

    this.http.get<Pago[]>(`${this.apiUrl}pagos`, {
      headers: this.tokenService.createAuthHeaders(),
      params
    }).pipe(
      tap(data => {
        this.pagos.set(data);
      }),
      catchError(err => {
        this.error.set('Error al cargar pagos');
        console.error(err);
        return [];
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  cargarPago(pagoId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Pago>(`${this.apiUrl}${pagoId}`, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.pago.set(data);
      }),
      catchError(err => {
        this.error.set('Error al cargar pago');
        console.error(err);
        return [];
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

