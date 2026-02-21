import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaFormModal } from './categoria-form-modal/categoria-form-modal';
import { ConfirmModal } from '../../../layout/components/confirm-modal/confirm-modal';
import { ToastService } from '../../../core/services/toast';
import { Categoria } from '../../../core/interfaces/producto.model';
import { CategoriaSevice } from '../../../core/services/categoria';
import { LucideAngularModule, Pen, Plus, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-categorias',
  imports: [CommonModule, CategoriaFormModal, ConfirmModal, LucideAngularModule],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css',
})
export class Categorias {
  private categoriasService = inject(CategoriaSevice);
  private toastService = inject(ToastService);

  categorias = this.categoriasService.categorias;
  loading = this.categoriasService.loading;
  loadingLista = this.categoriasService.loadingLista;
  error = this.categoriasService.error;
  success = this.categoriasService.success;

  // Modales
  showFormModal = signal(false);
  showDeleteModal = signal(false);
  selectedCategoria = signal<Categoria | null>(null);

  // Stats
  totalCategorias = this.categoriasService.totalCategorias;
  totalProductos = this.categoriasService.totalProductos;
  totalProductosSinCategoria = this.categoriasService.totalProductosSinCategoria;

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
    this.categoriasService.cargarCategorias();
  }

  // Abrir modal CREAR
  openCreateModal() {
    this.selectedCategoria.set(null);
    this.showFormModal.set(true);
  }

  // Abrir modal EDITAR
  openEditModal(categoria: Categoria) {
    this.selectedCategoria.set(categoria);
    this.showFormModal.set(true);
  }

  // Cerrar modal form
  closeFormModal() {
    this.showFormModal.set(false);
    this.selectedCategoria.set(null);
  }

  // Guardar (crear o editar)
  handleCategoriaSaved(categoriaData: Categoria) {
    const isEdit = !!categoriaData.categoria_id;

    if (isEdit) {
      // EDITAR
      this.categoriasService.actualizarCategoria(categoriaData);
    } else {
      // CREAR
      this.categoriasService.crearCategoria(categoriaData);
    }
    this.closeFormModal();
  }

  // Abrir modal ELIMINAR
  openDeleteModal(categoria: Categoria, event: Event) {
    event.stopPropagation();
    this.selectedCategoria.set(categoria);
    this.showDeleteModal.set(true);
  }

  // Cerrar modal eliminar
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedCategoria.set(null);
  }

  // Confirmar eliminación
  handleDeleteConfirmed() {
    const categoria = this.selectedCategoria();
    if (!categoria) return this.toastService.error('Categoría inexistente.','La categoría no existe.');
    this.categoriasService.eliminarCategoria(categoria.categoria_id);
    this.closeDeleteModal();
  }

  // Icons
  readonly Trash2 = Trash2;
  readonly Pen = Pen;
  readonly Plus = Plus;
}
