import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token';
import { Mesa } from '../interfaces/mesa.model';
import { catchError, finalize, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MesaService {
  private apiUrl = `${environment.apiUrl}gestion/`;

  // Inject
  http = inject(HttpClient);
  tokenService = inject(TokenService)

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

    this.http.get<Mesa[]>(`${this.apiUrl}mesa/mesas`, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.mesas.set(data);
      }),
      catchError(err => {
        this.error.set('Error al cargar mesas');
        console.error(err);
        return [];
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  crearMesa(mesa: Mesa): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.post<Mesa>(`${this.apiUrl}mesa/crear`, mesa, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.mesa.set(data);
        this.mesas.update(items => [...items, data]);
        this.success.set('Mesa creada con exito');
      }),
      catchError(err => {
        this.error.set('Error al crear mesa');
        console.error(err);
        return [];
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  actualizarMesa(mesa: Mesa): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.put<Mesa>(`${this.apiUrl}mesa`, mesa, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.mesa.set(data);
        this.mesas.update(items =>
          items.map(p =>
            p.mesa_id === mesa.mesa_id ? mesa : p
          )
        );
        this.success.set('Mesa actualizada con exito');
      }),
      catchError(err => {
        this.error.set('Error al actualizar mesa');
        console.error(err);
        return [];
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  actualizarCodigoMesa(mesa_id: string) {
      this.loading.set(true);
      this.error.set(null);

      this.http.patch<Mesa>(`${this.apiUrl}mesa/codigo/${mesa_id}`, {}, { headers: this.tokenService.createAuthHeaders() }).pipe(
          tap((data) => {
              this.mesa.set(data);
              this.mesas.update(items =>
                items.map(p => p.mesa_id === data.mesa_id ? data : p)
              );
              this.success.set("Codigo actualizado con exito")
          }),
          catchError(err => {
              this.error.set('Error al actualizar codigo de mesa');
              console.error(err);
              return [];
          }),
          finalize(() => this.loading.set(false))
      ).subscribe();
  }

  eliminarMesa(mesa_id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.delete<Mesa>(`${this.apiUrl}mesa/eliminar/${mesa_id}`, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap((data) => {
        this.mesa.set(data);
        this.mesas.update(items =>
          items.filter(c => c.mesa_id !== data.mesa_id)
        );
        this.success.set('Mesa eliminada con exito');
      }),
      catchError(err => {
        this.error.set('Error al eliminar mesa');
        console.error(err);
        return [];
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }
}
