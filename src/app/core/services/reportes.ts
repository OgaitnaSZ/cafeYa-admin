import { Injectable, signal, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TokenService } from './token';
import { ReportesResumen, CalendarioReporte } from '../interfaces/reportes.model';
import { catchError, finalize, of, tap } from 'rxjs';
import { NotificacionService } from './notificacion';

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private apiUrl = `${environment.apiUrl}gestion/reportes/`;

  // Servicios
  http = inject(HttpClient);
  tokenService = inject(TokenService);
  private ns = inject(NotificacionService);

  // Signals
  resumen    = signal<ReportesResumen | null>(null);
  calendario = signal<CalendarioReporte | null>(null);

  // Estados
  loading = signal(false);
  loadingCalendario = signal(false);
  error = signal<string | null>(null);

  // Métodos
  cargarResumen(from: string, to: string): void {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('from', from).set('to', to);

    this.http
      .get<ReportesResumen>(`${this.apiUrl}resumen?${params}`)
      .pipe(
        tap((data) => this.resumen.set(data)),
        catchError((err) => {
          this.ns.error('Error al cargar los reportes', err.error.message);
          return of([]);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe();
  }

  cargarCalendario(year: number, month: number): void {
    this.loadingCalendario.set(true);

    const params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());

    this.http
      .get<CalendarioReporte>(`${this.apiUrl}calendario?${params}`)
      .pipe(
        tap((data) => this.calendario.set(data)),
        catchError((err) => {
          this.ns.error('Error al cargar calendario', err.error.message);
          return of([]);
        }),
        finalize(() => this.loadingCalendario.set(false))
      )
      .subscribe();
  }
}