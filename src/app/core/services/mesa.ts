import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token';
import { Mesa } from '../interfaces/mesa.model';
import { catchError, finalize, of, tap } from 'rxjs';
import { NotificacionService } from './notificacion';

@Injectable({
  providedIn: 'root',
})
export class MesaService {
  private apiUrl = `${environment.apiUrl}gestion/`;

  // Servicios
  http = inject(HttpClient);
  tokenService = inject(TokenService);
  private ns = inject(NotificacionService);

  // Signals
  mesas = signal<Mesa[]>([]);
  mesa = signal<Mesa | null>(null);

  // Estados
  loadingLista = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Computed
  totalMesas = computed(() => this.mesas().length);
  mesasDisponibles = computed(() => 
    this.mesas().filter(m => m.estado === 'Disponible').length
  );
  mesasOcupadas = computed(() => 
    this.mesas().filter(m => m.estado === 'Ocupada').length
  );

  cargarMesas(): void {
    this.loadingLista.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.get<Mesa[]>(`${this.apiUrl}mesa/mesas`).pipe(
      tap(data => {
        this.mesas.set(data);
      }),
      catchError(err => {
        this.ns.error('Error al cargar mesas', err.error.message);
        return of([]);
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  crearMesa(mesa: Mesa): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.post<Mesa>(`${this.apiUrl}mesa/crear`, mesa).pipe(
      tap(data => {
        this.mesa.set(data);
        this.mesas.update(items => [...items, data]);
        this.ns.success('Mesa creada con exito');
      }),
      catchError(err => {
        this.ns.error('Error al crear mesas', err.error.message);
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  actualizarMesa(mesa: Mesa): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.put<Mesa>(`${this.apiUrl}mesa`, mesa).pipe(
      tap(data => {
        this.mesa.set(data);
        this.mesas.update(items =>
          items.map(p =>
            p.mesa_id === mesa.mesa_id ? mesa : p
          )
        );
        this.ns.success('Mesa actualizada con exito');
      }),
      catchError(err => {
        this.ns.error('Error al actualizar mesa', err.error.message);
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  actualizarCodigoMesa(mesa_id: string) {
      this.loading.set(true);
      this.error.set(null);

      this.http.patch<Mesa>(`${this.apiUrl}mesa/codigo/${mesa_id}`, {}).pipe(
          tap((data) => {
              this.mesa.set(data);
              this.mesas.update(items =>
                items.map(p => p.mesa_id === data.mesa_id ? data : p)
              );
              this.ns.success("Codigo actualizado con exito")
          }),
          catchError(err => {
              this.ns.error('Error al actualizar codigo de mesa');      
              return of([]);
          }),
          finalize(() => this.loading.set(false))
      ).subscribe();
  }

  eliminarMesa(mesa_id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.delete<Mesa>(`${this.apiUrl}mesa/eliminar/${mesa_id}`).pipe(
      tap((data) => {
        this.mesa.set(data);
        this.mesas.update(items =>
          items.filter(c => c.mesa_id !== data.mesa_id)
        );
        this.ns.success('Mesa eliminada con exito');
      }),
      catchError(err => {
        this.ns.error('Error al eliminar mesa');
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }
}
