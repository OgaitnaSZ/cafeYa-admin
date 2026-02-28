import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MesaFormModal } from './mesa-form-modal/mesa-form-modal';
import { ConfirmModal } from '../../layout/components/confirm-modal/confirm-modal';
import { Mesa } from '../../core/interfaces/mesa.model';
import { MesaService } from '../../core/services/mesa';
import { LucideAngularModule, Pen, Plus, Trash2, RefreshCw, QrCode, ExternalLink, Copy } from 'lucide-angular';
import { QRCodeComponent } from 'angularx-qrcode';
import { NotificacionService } from '../../core/services/notificacion';

@Component({
  selector: 'app-mesas',
  imports: [CommonModule, MesaFormModal, ConfirmModal, LucideAngularModule, QRCodeComponent],
  templateUrl: './mesas.html',
  styleUrl: './mesas.css',
})
export class Mesas {
  private mesasService = inject(MesaService);
  private ns = inject(NotificacionService);

  mesas = this.mesasService.mesas;
  loading = this.mesasService.loading;
  loadingLista = this.mesasService.loadingLista;

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
  
    if (mesaExistente) return this.ns.error('Ya existe una mesa con ese numero', 'Por favor, cambia el numero para continuar');

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
    if (!mesa) return this.ns.error('Mesa inexistente', 'La mesa no existe');
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
    this.ns.success('Código copiado', 'El código fue copiado al portapapeles');
  }

  // Copiar enlace de verificación
  copiarEnlace(mesa: Mesa, event: Event) {
    event.stopPropagation();
    const enlace = mesa.qr_url;
    navigator.clipboard.writeText(enlace);
    this.ns.success('Enlace copiado', 'El enlace fue copiado al portapapeles');
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
