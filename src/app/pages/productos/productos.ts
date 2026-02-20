import { Component, signal, computed, inject, effect, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { Producto, Categoria } from '../../core/interfaces/producto.model';
import { ProductoFormModal } from './producto-form-modal/producto-form-modal';
import { ProductoService } from '../../core/services/producto';

@Component({
  selector: 'app-productos',
  imports: [
    CommonModule,
    FormsModule,
    ProductoFormModal,
    ConfirmModal
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos {
  // Services
  productoService = inject(ProductoService);
  cdr = inject(ChangeDetectorRef);

  // Signals
  productos = this.productoService.productos;
  producto = this.productoService.producto;
  loadingLista = this.productoService.loadingLista;
  loading = this.productoService.loading;
  success = this.productoService.success;
  categorias = this.productoService.categoriasEnUso;

  searchTerm = signal('');
  selectedCategoria = signal<number>(0);

  // Stats
  totalProductos = this.productoService.totalProductos;
  productosDisponibles = this.productoService.productosDisponibles;
  productosDestacados = this.productoService.productosDestacados;
  
  // Modales
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  selectedProducto = signal<Producto | null>(null);

  // Productos filtrados
  filteredProductos = computed(() => {
    let items = this.productos();
    
    // Filtrar por búsqueda
    const search = this.searchTerm().toLowerCase();
    if (search) {
      items = items.filter(p =>
        p.nombre.toLowerCase().includes(search) ||
        p.descripcion.toLowerCase().includes(search)
      );
    }

    // Filtrar por categoría
    const catId = this.selectedCategoria();
    if (catId && catId !== 0) {
      items = items.filter(p => p.categoria_id === catId);
    }

    return items;
  });

  ngOnInit() {
    this.productoService.cargarDatos();
  }

  // Cambiar disponibilidad
  toggleDisponibilidad(producto: Producto, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.productoService.cambiarEstadoProducto(producto.producto_id!);
  }

  // Cambiar destacado
  toggleDestacado(producto: Producto, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.productoService.destacarProducto(producto.producto_id!);
  }

  // Abrir modal editar
  openEditModal(producto: Producto) {
    this.selectedProducto.set(producto);
    this.showEditModal.set(true);
  }

  // Cerrar modal editar
  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedProducto.set(null);
  }

  // Guardar cambios del producto
  handleProductoSaved(updatedProducto: Producto) {
    this.productoService.actualizarProducto(updatedProducto);
    this.closeEditModal();
  }

  // Abrir modal eliminar
  openDeleteModal(producto: Producto, event: Event) {
    event.stopPropagation();
    this.selectedProducto.set(producto);
    this.showDeleteModal.set(true);
  }

  // Cerrar modal eliminar
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedProducto.set(null);
  }

  // Confirmar eliminación
  handleDeleteConfirmed() {
    const producto = this.selectedProducto();
    if (!producto) return;
    this.productoService.eliminarProducto(producto.producto_id!);
    this.closeEditModal();
  }

  // Obtener nombre de categoría
  getCategoriaNombre(categoriaId: number): string {
    return this.categorias().find(c => c.categoria_id === categoriaId)?.nombre || 'Sin categoría';
  }

  // Formatear precio
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR').format(price);
  }
}
