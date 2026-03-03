import { Injectable, signal, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token';
import { catchError, finalize, of, tap } from 'rxjs';
import { NotificacionService } from './notificacion';
import { Log } from '../interfaces/audit.model';

@Injectable({
  providedIn: 'root',
})
export class LogsService {
  private apiUrl = `${environment.apiUrl}gestion/`;

  // Servicios
  http = inject(HttpClient);
  tokenService = inject(TokenService);
  private ns = inject(NotificacionService);

  // Signals
  auditLogs = signal<Log[]>([]);

  // Estados
  loading = signal(false);

  cargarAuditLog(): void {
    this.loading.set(true);

    this.http.get<Log[]>(`${this.apiUrl}audit-log`).pipe(
      tap(data => {
        this.auditLogs.set(data);
      }),
      catchError(err => {
        this.ns.error('Error al cargar registros', err.error.message);
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }
}
