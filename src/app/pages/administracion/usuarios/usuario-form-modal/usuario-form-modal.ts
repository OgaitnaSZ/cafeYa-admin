import { Component, Input, Output, EventEmitter, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../../../core/interfaces/user.model';
import { LucideAngularModule, Shield, Users, ChefHat, Eye, EyeOff, X } from 'lucide-angular';
import { ToastService } from '../../../../core/services/toast';
import { Usuario } from '../../../../core/services/usuario';

@Component({
  selector: 'app-usuario-form-modal',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './usuario-form-modal.html',
  styleUrl: './usuario-form-modal.css',
})
export class UsuarioFormModal {
  // Servicios
  private fb = new FormBuilder();
  private toastService = inject(ToastService);
  private userService = inject(Usuario);

  @Input() usuario: User | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  
  form!: FormGroup;
  error = signal<string | null>(null);
  saving = this.userService.loading;
  showPassword = signal(false);

  isEditMode = computed(() => !!this.usuario);
  modalTitle = computed(() => 
    this.isEditMode() ? 'Editar Usuario' : 'Nuevo Usuario'
  );

  // Opciones de roles
  roles = [
    { value: 'admin', label: 'Administrador', icon: Shield, color: 'red' },
    { value: 'encargado', label: 'Encargado', icon: Users, color: 'blue' },
    { value: 'cocina', label: 'Cocina', icon: ChefHat, color: 'orange' }
  ];

  ngOnInit() {
    this.form = this.fb.group({
      nombre: [this.usuario?.nombre || '', [Validators.required, Validators.minLength(3)]],
      email: [this.usuario?.email || '', [Validators.required, Validators.email]],
      password: ['', this.isEditMode() ? [] : [Validators.required, Validators.minLength(6)]],
      rol: [this.usuario?.rol || 'encargado', [Validators.required]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
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

    const formData = this.form.value;

    // Si es edición y no se cambió la contraseña, no enviarla
    if (this.isEditMode() && !formData.password) {
      delete formData.password;
    }

    const usuarioData = {
      ...(this.usuario || {}),
      ...formData
    };

    this.save.emit(usuarioData);
  }

  // Icons
  readonly Shield = Shield;
  readonly Users = Users;
  readonly ChefHat = ChefHat;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly X = X;
}
