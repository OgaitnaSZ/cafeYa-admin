import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MesaFormModal } from './mesa-form-modal/mesa-form-modal';
import { ConfirmModal } from '../../../layout/components/confirm-modal/confirm-modal';
import { ToastService } from '../../../core/services/toast';
import { Mesa } from '../../../core/interfaces/mesa.model';
import { MesaService } from '../../../core/services/mesa';
import { LucideAngularModule, Pen, Plus, Trash2, RefreshCw, QrCode, ExternalLink, Copy } from 'lucide-angular';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-gestion-mesas',
  imports: [CommonModule, MesaFormModal, ConfirmModal, LucideAngularModule, QRCodeComponent],
  templateUrl: './gestion-mesas.html',
  styleUrl: './gestion-mesas.css',
})
export class GestionMesas {
  private mesasService = inject(MesaService);
  private toastService = inject(ToastService);

  mesas = this.mesasService.mesas;
  loading = this.mesasService.loading;
  loadingLista = this.mesasService.loadingLista;
  error = this.mesasService.error;
  success = this.mesasService.success;

  // Modales
  showFormModal = signal(false);
  showDeleteModal = signal(false);
  showCodigoModal = signal(false);
  selectedMesa = signal<Mesa | null>(null);

  // Filtro de estado
  filtroEstado = signal<string>('todas');

  // Stats
  totalMesas = this.mesasService.totalMesas;
  mesasDisponibles = this.mesasService.mesasDisponibles;
  mesasOcupadas = this.mesasService.mesasOcupadas;

  // Mesas filtradas
  mesasFiltradas = computed(() => {
    const filtro = this.filtroEstado();
    if (filtro === 'todas') return this.mesas();
    return this.mesas().filter(m => m.estado === filtro);
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
    this.mesasService.cargarMesas();
  }

  // Abrir modal CREAR
  openCreateModal() {
    this.selectedMesa.set(null);
    this.showFormModal.set(true);
  }

  // Abrir modal EDITAR
  openEditModal(mesa: Mesa) {
    this.selectedMesa.set(mesa);
    this.showFormModal.set(true);
  }

  // Cerrar modal form
  closeFormModal() {
    this.showFormModal.set(false);
    this.selectedMesa.set(null);
  }

  // Guardar (crear o editar)
  handleMesaSaved(mesaData: Mesa) {
    const isEdit = !!mesaData.mesa_id;

    // Verificar si ya existe una mesa con el mismo número
    const mesaExistente = this.mesas().find(m =>
      m.numero === mesaData.numero &&
      m.mesa_id !== mesaData.mesa_id
    );
  
    if (mesaExistente) return this.toastService.error('Ya existe una mesa con ese numero', 'Por favor, cambia el numero para continuar');

    if (isEdit) {
      this.mesasService.actualizarMesa(mesaData);
    } else {
      this.mesasService.crearMesa(mesaData);
    }
    this.closeFormModal();
  }

  // Abrir modal ELIMINAR
  openDeleteModal(mesa: Mesa, event: Event) {
    event.stopPropagation();
    this.selectedMesa.set(mesa);
    this.showDeleteModal.set(true);
  }

  // Cerrar modal eliminar
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedMesa.set(null);
  }

  // Confirmar eliminación
  handleDeleteConfirmed() {
    const mesa = this.selectedMesa();
    if (!mesa) return this.toastService.error('Mesa inexistente', 'La mesa no existe');
    this.mesasService.eliminarMesa(mesa.mesa_id);
    this.closeDeleteModal();
  }

  // Regenerar código
  regenerarCodigo(mesa: Mesa, event: Event) {
    event.stopPropagation();
    this.mesasService.actualizarCodigoMesa(mesa.mesa_id);
  }

  // Ver código QR
  verCodigo(mesa: Mesa, event: Event) {
    event.stopPropagation();
    this.selectedMesa.set(mesa);
    this.showCodigoModal.set(true);
  }

  closeCodigoModal() {
    this.showCodigoModal.set(false);
    this.selectedMesa.set(null);
  }

  // Helper para obtener estilos según estado
  getEstadoStyles(estado: Mesa['estado']) {
    const styles = {
      Disponible: { 
        bg: 'bg-green-500', 
        text: 'text-white', 
        label: 'Disponible', 
        badgeBg: 'bg-green-100', 
        badgeText: 'text-green-700',
        dot: 'bg-green-500'
      },
      Ocupada: { 
        bg: 'bg-orange-500', 
        text: 'text-white', 
        label: 'Ocupada', 
        badgeBg: 'bg-orange-100', 
        badgeText: 'text-orange-700',
        dot: 'bg-orange-500'
      },
    };
    return styles[estado];
  }

  // Copiar código al portapapeles
  copiarCodigo(codigo: string, event: Event) {
    event.stopPropagation();
    navigator.clipboard.writeText(codigo);
    this.toastService.success('Código copiado', 'El código fue copiado al portapapeles');
  }

  // Copiar enlace de verificación
  copiarEnlace(mesa: Mesa, event: Event) {
    event.stopPropagation();
    const enlace = mesa.qr_url;
    navigator.clipboard.writeText(enlace);
    this.toastService.success('Enlace copiado', 'El enlace fue copiado al portapapeles');
  }

  // Icons
  readonly Trash2 = Trash2;
  readonly Pen = Pen;
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;
  readonly QrCode = QrCode;
  readonly ExternalLink = ExternalLink;
  readonly Copy = Copy;
}
