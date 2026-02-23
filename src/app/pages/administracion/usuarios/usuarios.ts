import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioFormModal } from './usuario-form-modal/usuario-form-modal';
import { ConfirmModal } from '../../../layout/components/confirm-modal/confirm-modal';
import { ToastService } from '../../../core/services/toast';
import { User } from '../../../core/interfaces/user.model';
import { Usuario } from '../../../core/services/usuario';
import { LucideAngularModule, UserPlus, Pen, Trash2, Shield, ChefHat, Users } from 'lucide-angular';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, UsuarioFormModal, ConfirmModal, LucideAngularModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios {
  private usuarioService = inject(Usuario);
  private toastService = inject(ToastService);

  usuarios = this.usuarioService.usuarios;
  loading = this.usuarioService.loading;
  loadingLista = this.usuarioService.loadingLista;
  error = this.usuarioService.error;
  success = this.usuarioService.success;

  // Modales
  showFormModal = signal(false);
  showDeleteModal = signal(false);
  selectedUsuario = signal<User | null>(null);

  // Filtro por rol
  filtroRol = signal<string>('todos');

  // Stats
  totalUsuarios = this.usuarioService.totalUsuarios;
  usuariosPorRol = this.usuarioService.usuariosPorRol;

  // Usuarios filtrados
  usuariosFiltrados = computed(() => {
    const filtro = this.filtroRol();
    if (filtro === 'todos') return this.usuarios();
    return this.usuarios().filter(u => u.rol === filtro);
  });

  constructor() {
    effect(() => {
      if (this.success()) {
        this.toastService.success(this.success()!);
      }
      
      if (this.error()) {
        this.toastService.error(this.error()!);
      }
    });
  }

  ngOnInit() {
    this.usuarioService.cargarUsuarios();
  }

  // Abrir modal CREAR
  openCreateModal() {
    this.selectedUsuario.set(null);
    this.showFormModal.set(true);
  }

  // Abrir modal EDITAR
  openEditModal(usuario: User) {
    this.selectedUsuario.set(usuario);
    this.showFormModal.set(true);
  }

  // Cerrar modal form
  closeFormModal() {
    this.showFormModal.set(false);
    this.selectedUsuario.set(null);
  }

  // Guardar (crear o editar)
  handleUsuarioSaved(usuarioData: User) {
    const isEdit = !!usuarioData.id;

    // Verificar si ya existe un usuario con el mismo número
    const usuarioExistente = this.usuarios().find(u =>
      u.email === usuarioData.email &&
      u.id !== usuarioData.id
    );
  
    if (usuarioExistente) return this.toastService.error('Ya existe un usuario con ese email', 'Por favor, cambia el email para continuar');

    if (isEdit) {
      this.usuarioService.actualizarUsuario(usuarioData);
    } else {
      this.usuarioService.crearUsuario(usuarioData);
    }
    this.closeFormModal();
  }

  // Abrir modal ELIMINAR
  openDeleteModal(usuario: User, event: Event) {
    event.stopPropagation();
    this.selectedUsuario.set(usuario);
    this.showDeleteModal.set(true);
  }

  // Cerrar modal eliminar
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedUsuario.set(null);
  }

  // Confirmar eliminación
  handleDeleteConfirmed() {
    const usuario = this.selectedUsuario();
    if (!usuario) return this.toastService.error('Usuario inexistente', 'El usuario no existe');

    if(usuario.rol === 'admin'){
      const totalAdmins = this.usuarios().filter(u => u.rol === 'admin').length;
      if(totalAdmins === 1) return this.toastService.error('Error al eliminar','No se puede eliminar al único administrador');
    }

    this.usuarioService.eliminarUsuario(usuario.id);
    this.closeDeleteModal();
  }

  // Helper para obtener estilos según rol
  getRolStyles(rol: User['rol']) {
    const styles = {
      admin: { 
        bg: 'bg-red-100', 
        text: 'text-red-700', 
        icon: Shield,
        label: 'Admin'
      },
      encargado: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        icon: Users,
        label: 'Encargado'
      },
      cocina: { 
        bg: 'bg-orange-100', 
        text: 'text-orange-700', 
        icon: ChefHat,
        label: 'Cocina'
      },
    };
    return styles[rol];
  }

  // Icons
  readonly UserPlus = UserPlus;
  readonly Pen = Pen;
  readonly Trash2 = Trash2;
  readonly Shield = Shield;
  readonly ChefHat = ChefHat;
  readonly Users = Users;
}
