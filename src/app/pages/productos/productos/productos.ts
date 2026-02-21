import { Component, signal, computed, inject, effect, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { Producto } from '../../../core/interfaces/producto.model';
import { ProductoFormModal } from './producto-form-modal/producto-form-modal';
import { ProductoService } from '../../../core/services/producto';
import { LucideAngularModule, Pen, Plus, Search, Trash, Trash2 } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast';

@Component({
  selector: 'app-productos',
  imports: [
    CommonModule,
    FormsModule,
    ProductoFormModal,
    ConfirmModal,
    LucideAngularModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos {
  // Services
  productoService = inject(ProductoService);
  cdr = inject(ChangeDetectorRef);
  toastService = inject(ToastService);

  // Signals
  productos = this.productoService.productos;
  producto = this.productoService.producto;
  loadingLista = this.productoService.loadingLista;
  loading = this.productoService.loading;
  error = this.productoService.error;
  success = this.productoService.success;
  categorias = this.productoService.categoriasEnUso;

  searchTerm = signal('');
  selectedCategoria = signal<number>(0);

  // Stats
  totalProductos = this.productoService.totalProductos;
  productosDisponibles = this.productoService.productosDisponibles;
  productosDestacados = this.productoService.productosDestacados;
  
  // Modales
  showFormModal = signal(false);
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
    const catId = Number(this.selectedCategoria());
    if (catId && catId !== 0) {
      items = items.filter(p => p.categoria_id === catId);
    }

    return items;
  });

  constructor() {
    effect(() => {
      if (this.success()) {
        this.toastService.success(this.success()!);
      }
      
      if(this.error()){
        this.toastService.error(this.error()!);
      }
    });
  }

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
    if(this.productosDestacados() >= 4) return this.toastService.error("Límite alcanzado", "Desmarque un producto destacado para poder seleccionar uno nuevo."); 
    if(producto.estado === "Inactivo") return this.toastService.error("Producto inactivo", "Habilite el producto para poder destacarlo."); 
    this.productoService.destacarProducto(producto.producto_id!);
  }

  // Abrir modal para CREAR
  openCreateModal() {
    this.selectedProducto.set(null); // ← null indica modo crear
    this.showFormModal.set(true);
  }

  // Abrir modal para EDITAR
  openEditModal(producto: Producto) {
    this.selectedProducto.set(producto); // ← producto indica modo editar
    this.showFormModal.set(true);
  }

  // Cerrar modal
  closeFormModal() {
    this.showFormModal.set(false);
    this.selectedProducto.set(null);
  }

  // Guardar cambios del producto
  handleProductoSaved(producto: Producto) {
    const existingIndex = this.productos().findIndex(
      p => p.producto_id === producto.producto_id
    );

    if (existingIndex >= 0) {
      // EDITAR: actualizar existente
      this.productoService.actualizarProducto(producto);
    } else {
      // CREAR: agregar nuevo
      this.productoService.crearProducto(producto);
    }

    this.closeFormModal();
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
    this.closeDeleteModal();
  }

  // Obtener nombre de categoría
  getCategoriaNombre(categoriaId: number): string {
    return this.categorias().find(c => c.categoria_id === categoriaId)?.nombre || 'Sin categoría';
  }

  // Formatear precio
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR').format(price);
  }

  // Icons
  readonly Trash2 = Trash2;
  readonly Pen = Pen;
  readonly Search = Search;
  readonly Plus = Plus;
}
