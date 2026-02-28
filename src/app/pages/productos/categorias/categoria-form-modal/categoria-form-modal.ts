import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria } from '../../../../core/interfaces/producto.model';
import { NotificacionService } from '../../../../core/services/notificacion';
import { CategoriaSevice } from '../../../../core/services/categoria';
import { LucideAngularModule, X } from 'lucide-angular';

const EMOJI_PRESETS = [
  '☕', '🥐', '🍰', '🥗', '🍕', '🍔', '🌮', '🍜', 
  '🍱', '🍣', '🥪', '🥙', '🌯', '🍲', '🥘', '🍛',
  '🧁', '🍪', '🎂', '🍩', '🥤', '🍹', '🧃', '🍺'
];

@Component({
  selector: 'app-categoria-form-modal',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './categoria-form-modal.html',
  styleUrl: './categoria-form-modal.css',
})
export class CategoriaFormModal {
  // Servicios
  private categoriaService = inject(CategoriaSevice);
  private ns = inject(NotificacionService);
  private fb = new FormBuilder();

  @Input() categoria: Categoria | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Categoria>();
  
  form!: FormGroup;
  saving = this.categoriaService.loading;
  emojiPresets = EMOJI_PRESETS;
  showEmojiPicker = signal(false);

  isEditMode = computed(() => !!this.categoria);
  modalTitle = computed(() => 
    this.isEditMode() ? 'Editar Categoría' : 'Nueva Categoría'
  );

  ngOnInit() {
    this.form = this.fb.group({
      nombre: [this.categoria?.nombre || '', [Validators.required, Validators.minLength(2)]],
      emoji: [this.categoria?.emoji || '🏷️', [Validators.required]]
    });
  }

  selectEmoji(emoji: string) {
    this.form.patchValue({ emoji });
    this.showEmojiPicker.set(false);
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
    if (this.form.invalid) return this.ns.error('Faltan datos','Completa los campos requeridos');

    const categoriaData: Categoria = {
      ...(this.categoria || {}),
      ...this.form.value
    };

    this.save.emit(categoriaData);
  }

  // Icons
  readonly X = X;
}
