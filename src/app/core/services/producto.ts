import { Injectable, signal, inject, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token';
import { Categoria, Producto } from '../interfaces/producto.model';
import { catchError, finalize, forkJoin, of, tap } from 'rxjs';
import { NotificacionService } from './notificacion';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private apiUrl = `${environment.apiUrl}gestion/`;

  // Servicios
  http = inject(HttpClient);
  tokenService = inject(TokenService)
  private ns = inject(NotificacionService);

  // Signals
  productos = signal<Producto[]>([]);
  producto = signal<Producto | null>(null);

  todasLasCategorias = signal<Categoria[]>([]);
  categoria = signal<Categoria | null>(null);

  loadingLista = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  
  // Computed
  totalProductos = computed(() => this.productos().length);

  productosDisponibles = computed(() =>
    this.productos().filter(p => p.estado === 'Activo').length
  );

  productosDestacados = computed(() =>
    this.productos().filter(p => p.destacado).length
  );

  // Solo categorías que tienen al menos un producto asignado (para filtros)
  categoriasEnUso = computed(() => {
    const idsEnUso = new Set(this.productos().map(p => p.categoria_id));
    return this.todasLasCategorias()
      .filter(cat => idsEnUso.has(cat.categoria_id))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  // Productos con emoji derivado de su categoría (lógica de presentación centralizada)
  productosConEmoji = computed(() => {
    const categoriaMap = new Map(
      this.todasLasCategorias().map(cat => [cat.categoria_id, cat])
    );
    return this.productos().map(p => ({
      ...p,
      emoji: categoriaMap.get(p.categoria_id)?.emoji ?? '🍽️',
    }));
  });

  cargarDatos(): void {
    this.loadingLista.set(true);
    this.error.set(null);

    forkJoin({
      productos: this.http.get<Producto[]>(`${this.apiUrl}producto/productos`, {
        headers: this.tokenService.createAuthHeaders(),
      }),
      categorias: this.http.get<Categoria[]>(`${this.apiUrl}categoria/categorias`, {
        headers: this.tokenService.createAuthHeaders(),
      }),
    }).pipe(
      tap(({ productos, categorias }) => {
        this.productos.set(productos);
        this.todasLasCategorias.set(categorias);
      }),
      catchError(err => {
        this.ns.error('Error al cargar los datos', err.error.message);        
        return of({ productos: [], categorias: [] });
      }),
      finalize(() => this.loadingLista.set(false))
    ).subscribe();
  }

  crearProducto(producto: Producto): void {
      this.loading.set(true);
      this.error.set(null);
      this.success.set(null);

      this.http.post<Producto>(`${this.apiUrl}producto/crear`, producto, { headers: this.tokenService.createAuthHeaders() }).pipe(
          tap((data) => {
              this.producto.set(data);
              this.productos.update(items => [...items, data]);
              this.ns.success("Producto creado correctamente");
          }),
          catchError(err => {
              this.ns.error('Error al agregar producto', err.error.message);              
              return of([]);
          }),
          finalize(() => this.loading.set(false))
      ).subscribe();
  }

  actualizarProducto(producto: Producto): void {
      this.loading.set(true);
      this.error.set(null);

      this.http.put<Producto>(`${this.apiUrl}producto/editar`, producto, { headers: this.tokenService.createAuthHeaders() }).pipe(
          tap((data) => {
              this.producto.set(data);
              this.productos.update(items =>
                items.map(p =>
                  p.producto_id === producto.producto_id ? producto : p
                )
              );
              this.ns.success("producto modificado con exito")
          }),
          catchError(err => {
              this.ns.error('Error al modificar producto', err.error.message);              
              return of([]);
          }),
          finalize(() => this.loading.set(false))
      ).subscribe();
  }

  cambiarEstadoProducto(producto_id: string) {
      this.loading.set(true);
      this.error.set(null);

      this.http.patch<Producto>(`${this.apiUrl}producto/estado/${producto_id}`, {}, { headers: this.tokenService.createAuthHeaders() }).pipe(
          tap((data) => {
              this.producto.set(data);
              this.productos.update(items =>
                items.map(p => p.producto_id === data.producto_id ? data : p)
              );
              this.ns.success("Estado actualizado con exito")
          }),
          catchError(err => {
              this.ns.error('Error al actualizar producto', err.error.message);              
              return of([]);
          }),
          finalize(() => this.loading.set(false))
      ).subscribe();
  }

  destacarProducto(producto_id: string) {
      this.loading.set(true);
      this.error.set(null);

      this.http.patch<Producto>(`${this.apiUrl}producto/destacar/${producto_id}`, {}, { headers: this.tokenService.createAuthHeaders() }).pipe(
          tap((data) => {
              this.producto.set(data);
              this.productos.update(items =>
                items.map(p => p.producto_id === data.producto_id ? data : p)
              );
              this.ns.success("Producto destacado con exito")
          }),
          catchError(err => {
              this.ns.error('Error al destacar producto', err.error.message);              
              return of([]);
          }),
          finalize(() => this.loading.set(false))
      ).subscribe();
  }

  eliminarProducto(producto_id: string) {
      this.loading.set(true);
      this.error.set(null);

      this.http.delete<Producto>(`${this.apiUrl}producto/eliminar/${producto_id}`, { headers: this.tokenService.createAuthHeaders() }).pipe(
          tap((data) => {
              this.producto.set(data);
              this.productos.update(items =>
                items.filter(p => p.producto_id !== data.producto_id)
              );
              this.ns.success("Producto eliminado con exito")
          }),
          catchError(err => {
              this.ns.error('Error al eliminar Producto', err.error.message);              
              return of([]);
          }),
          finalize(() => this.loading.set(false))
      ).subscribe();
  }

  subirFotoProducto(formData: FormData){
      this.loading.set(true);
      this.error.set(null);

      this.http.post<Producto>(`${this.apiUrl}producto/foto`, formData, { headers: this.tokenService.createAuthHeaders({ excludeContentType: true }) }).pipe(
          tap((data) => {
              this.producto.set(data);
              this.productos.update(items =>
                items.map(p => p.producto_id === data.producto_id ? data : p)
              );
              this.ns.success("Foto subida con exito")
          }),
          catchError(err => {
              this.ns.error('Error al subir foto', err.error.message);              
              return of([]);
          }),
          finalize(() => this.loading.set(false))
      ).subscribe();
  }

  eliminarFoto(foto_id: string): void {
      this.loading.set(true);
      this.error.set(null);

      this.http.delete(`${this.apiUrl}foto/eliminar/${foto_id}`, { headers: this.tokenService.createAuthHeaders() }).pipe(
          tap(() => {
              this.ns.success("Foto eliminada con exito")
          }),
          catchError(err => {
              this.ns.error('Error al eliminar foto', err.error.message);              
              return of([]);
          }),
          finalize(() => this.loading.set(false))
      ).subscribe();
  }
}
