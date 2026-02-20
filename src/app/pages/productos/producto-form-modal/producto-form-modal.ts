import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Producto, Categoria } from '../../../core/interfaces/producto.model';

@Component({
  selector: 'app-producto-form-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './producto-form-modal.html',
  styleUrl: './producto-form-modal.css',
})
export class ProductoFormModal {
  @Input({ required: true }) producto!: Producto;
  @Input() categorias: Categoria[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Producto>();

  private fb = new FormBuilder();
  
  form!: FormGroup;
  saving = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.form = this.fb.group({
      nombre: [this.producto.nombre, [Validators.required]],
      descripcion: [this.producto.descripcion, [Validators.required]],
      precio_unitario: [this.producto.precio_unitario, [Validators.required, Validators.min(0)]],
      imagen_url: [this.producto.imagen_url],
      categoria_id: [this.producto.categoria_id, [Validators.required]],
      estado: [this.producto.estado],
      destacado: [this.producto.destacado],
    });
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.saving.set(true);
    this.error.set(null);

    const updatedProducto: Producto = {
      ...this.producto,
      ...this.form.value
    };

    this.save.emit(updatedProducto);

  }
}
