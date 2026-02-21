import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Producto, Categoria } from '../../../../core/interfaces/producto.model';
import { ProductoService } from '../../../../core/services/producto';
import { Image, LucideAngularModule, X } from 'lucide-angular';
import { ToastService } from '../../../../core/services/toast';

@Component({
  selector: 'app-producto-form-modal',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './producto-form-modal.html',
  styleUrl: './producto-form-modal.css',
})
export class ProductoFormModal {
  // Servicios
  private productosService = inject(ProductoService);
  private toastService = inject(ToastService);
  private fb = new FormBuilder();

  @Input() producto: Producto | null = null;
  @Input() categorias: Categoria[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Producto>();
  
  form!: FormGroup;
  saving = this.productosService.loading;
  error = this.productosService.error;
  imagePreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  uploadingImage = signal(false);

  isEditMode = computed(() => !!this.producto);
  modalTitle = computed(() => 
    this.isEditMode() ? 'Editar Producto' : 'Nuevo Producto'
  );
  modalSubtitle = computed(() => 
    this.isEditMode() 
      ? 'Modificá los datos del producto' 
      : 'Completá la información del producto'
  );
  submitButtonText = computed(() => 
    this.isEditMode() ? 'Guardar Cambios' : 'Crear Producto'
  );

  ngOnInit() {
    // Valores por defecto para modo crear
    const defaultValues = {
      nombre: '',
      descripcion: '',
      precio_unitario: 0,
      categoria_id: 0
    };

    // Si hay producto (editar), usar sus valores, sino usar defaults
    const initialValues = this.producto 
      ? {
          nombre: this.producto.nombre,
          descripcion: this.producto.descripcion,
          precio_unitario: this.producto.precio_unitario,
          categoria_id: this.producto.categoria_id
        }
      : defaultValues;

    this.form = this.fb.group({
      nombre: [initialValues.nombre, [Validators.required]],
      descripcion: [initialValues.descripcion, [Validators.required]],
      precio_unitario: [initialValues.precio_unitario, [Validators.required, Validators.min(0)]],
      categoria_id: [initialValues.categoria_id, [Validators.required]],
    });

    // Si hay imagen inicial, mostrar preview
    if (this.producto?.imagen_url) {
      this.imagePreview.set(this.producto.imagen_url);
    }
  }

  // Foto
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) return this.toastService.error('Tipo de archivo incorrecto','Por favor seleccioná un archivo de imagen válido');

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) return this.toastService.error('La imagen no puede superar los 5MB','Por favor subí un archivo de menor tamaño');

    // Verificar que el producto exista (para editar)
    if (!this.producto?.producto_id) return this.toastService.error('La imagen no tiene producto','Primero debés crear el producto antes de subir la imagen');

    this.error.set(null);
    this.uploadingImage.set(true);

    // Crear preview local mientras sube
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir al backend inmediatamente
    const formData = new FormData();
    formData.append('producto_id', this.producto?.producto_id);
    formData.append('foto', file);

    this.productosService.subirFotoProducto(formData);

    // Limpiar el input para permitir re-selección del mismo archivo
    input.value = '';
  }

  removeImage() {
    this.imagePreview.set(null);
    this.selectedFile.set(null);
    this.form.patchValue({ imagen_url: '' });
  }

  triggerFileInput() {
    if (!this.producto?.producto_id) return this.toastService.error('La imagen no tiene producto','Primero debés crear el producto antes de subir la imagen');
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) this.onClose();
  }

  onClose() {
    this.close.emit();
  }

  async onSubmit() {
    if (this.form.invalid) return this.toastService.error('Faltan datos','Completa los campos requeridos');

    // Si está en modo edición y no hubo cambios, cerrar
    if (this.isEditMode() && !this.form.dirty) {
      return this.onClose();
    }

    this.saving.set(true);
    this.error.set(null);

    // Modo EDITAR: Actualizar producto existente
    if (this.isEditMode()) {
      const updatedProducto: Producto = {
        ...this.producto!,
        ...this.form.value
      };
      this.save.emit(updatedProducto);
    } 
    // Modo CREAR: Nuevo producto
    else {
      const newProducto: Producto = {
        producto_id: '',
        ...this.form.value,
        created_at: new Date(),
        updated_at: new Date()
      };
      this.save.emit(newProducto);
    }
  }

  // Icons
  readonly X = X;
  readonly Image = Image;
}
