import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token';
import { Categoria } from '../interfaces/producto.model';
import { catchError, finalize, of, tap } from 'rxjs';
import { NotificacionService } from './notificacion';

@Injectable({
  providedIn: 'root',
})
export class CategoriaSevice {
  private apiUrl = `${environment.apiUrl}gestion/`;

  // Servicios
  http = inject(HttpClient);
  tokenService = inject(TokenService)
  private ns = inject(NotificacionService);
  

  // Signals
  categoriasRaw = signal<Categoria[]>([]);
  categorias = computed(() =>
    this.categoriasRaw().filter(c => c.categoria_id !== 0)
  );
  categoria = signal<Categoria | null>(null);

  // Estados
  loadingLista = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Computed
  totalCategorias = computed(() => this.categorias().length);
  
  totalProductos = computed(() =>
    this.categoriasRaw().reduce((sum, cat) => sum + (cat.count ?? 0),0)
  );
  
  totalProductosSinCategoria = computed(() =>
    this.categoriasRaw().find(c => c.categoria_id === 0)?.count ?? 0
  );

  cargarCategorias(): void {
    this.loadingLista.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.get<Categoria[]>(`${this.apiUrl}categoria/categorias`, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.categoriasRaw.set(data);
      }),
      catchError(err => {
        this.ns.error('Error al cargar categorias', err.error.message);
        return of([]);
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  crearCategoria(categoria: Categoria): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.post<Categoria>(`${this.apiUrl}categoria/crear`, categoria, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.categoria.set(data);
        this.categoriasRaw.update(items => [...items, data]);
        this.ns.success('Categoria creada con exito');
      }),
      catchError(err => {
        this.ns.error('Error al crear categoria', err.error.message);
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  actualizarCategoria(categoria: Categoria): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.put<Categoria>(`${this.apiUrl}categoria/editar`, categoria, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap(data => {
        this.categoria.set(data);
        this.categoriasRaw.update(items =>
          items.map(p =>
            p.categoria_id === categoria.categoria_id ? categoria : p
          )
        );
        this.ns.success('Categoria actualizada con exito');
      }),
      catchError(err => {
        this.ns.error('Error al actualizar categoria', err.error.message);
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  eliminarCategoria(categoria_id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.delete<Categoria>(`${this.apiUrl}categoria/eliminar/${categoria_id}`, {
      headers: this.tokenService.createAuthHeaders(),
    }).pipe(
      tap((data) => {
        this.categoria.set(data);
        this.categoriasRaw.update(items =>
          items.filter(c => c.categoria_id !== data.categoria_id)
        );
        this.ns.success('Categoria eliminada con exito');
      }),
      catchError(err => {
        this.ns.error('Error al eliminar categoria', err.error.message);
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }
}
