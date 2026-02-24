import { Component, Input, Output, EventEmitter, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Mesa } from '../../../core/interfaces/mesa.model';
import { Check, LucideAngularModule, X, LockKeyhole } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast';
import { MesaService } from '../../../core/services/mesa';

@Component({
  selector: 'app-mesa-form-modal',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './mesa-form-modal.html',
  styleUrl: './mesa-form-modal.css',
})
export class MesaFormModal {
  // Servicios
  private fb = new FormBuilder();
  private toastService = inject(ToastService);
  private mesaService = inject(MesaService);

  @Input() mesa: Mesa | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Mesa>();
  
  form!: FormGroup;
  error = signal<string | null>(null);
  saving = this.mesaService.loading;
  isEditMode = computed(() => !!this.mesa);
  modalTitle = computed(() => 
    this.isEditMode() ? 'Editar Mesa' : 'Nueva Mesa'
  );

  ngOnInit() {
    this.form = this.fb.group({
      numero: [this.mesa?.numero || '', [Validators.required, Validators.min(1)]],
      estado: [this.mesa?.estado || 'Disponible']
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
    if (this.form.invalid) return this.toastService.error('Faltan datos','Completa los campos requeridos');

    // Si está en modo edición y no hubo cambios, cerrar
    if (this.isEditMode() && !this.form.dirty) {
      return this.onClose();
    }

    const mesaData: Mesa = {
      ...(this.mesa || {}),
      ...this.form.value
    };

    this.save.emit(mesaData);
  }

  // Icons
  readonly X = X;
  readonly Check = Check;
  readonly LockKeyhole = LockKeyhole;
}
