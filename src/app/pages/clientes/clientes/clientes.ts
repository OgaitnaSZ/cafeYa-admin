import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConfirmModal } from '../../../layout/components/confirm-modal/confirm-modal';
import { ToastService } from '../../../core/services/toast';
import { Cliente } from '../../../core/interfaces/cliente.model';
import { ClientesService } from '../../../core/services/clientes';
import { 
  LucideAngularModule, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Trash2,
  Mail,
  Phone,
  Clock,
  Receipt,
  ChevronRight,
  Search
} from 'lucide-angular';

@Component({
  selector: 'app-clientes',
  imports: [CommonModule, ConfirmModal, LucideAngularModule],

  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes {
  private clienteService = inject(ClientesService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  clientes = this.clienteService.clientes;
  loading = this.clienteService.loading;
  loadingLista = this.clienteService.loadingLista;
  error = this.clienteService.error;
  success = this.clienteService.success;

  // Modales
  showDeleteModal = signal(false);
  selectedCliente = signal<Cliente | null>(null);

  // Búsqueda
  searchTerm = signal('');

  // Stats
  totalClientes = this.clienteService.totalClientes;
  clientesConPedidos = this.clienteService.clientesConPedidos;
  clientesSinPedidos = this.clienteService.clientesSinPedidos;
  totalPedidos = this.clienteService.totalPedidos;

  // Clientes filtrados
  clientesFiltrados = computed(() => {
    const search = this.searchTerm().toLowerCase();
    if (!search) return this.clientes();

    return this.clientes().filter(c => 
      c.nombre.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search) ||
      c.telefono?.includes(search)
    );
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
    this.clienteService.cargarClientes();
  }

  // Navegar a pedidos del cliente
  verPedidos(cliente: Cliente) {
    this.router.navigate(['/clientes/pedidos'], {
      queryParams: { cliente_id: cliente.cliente_id }
    });
  }

  // Abrir modal ELIMINAR
  openDeleteModal(cliente: Cliente, event: Event) {
    event.stopPropagation();
    this.selectedCliente.set(cliente);
    this.showDeleteModal.set(true);
  }

  // Cerrar modal eliminar
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedCliente.set(null);
  }

  // Confirmar eliminación
  handleDeleteConfirmed() {
    const cliente = this.selectedCliente();
    if (!cliente) {
      return this.toastService.error('Cliente inexistente', 'El cliente no existe');
    }
    
    if ((cliente._count?.pedidos || 0) > 0) {
      this.toastService.error(
        'No se puede eliminar', 
        'El cliente tiene pedidos asociados'
      );
      this.closeDeleteModal();
      return;
    }

    this.clienteService.eliminarCliente(cliente.cliente_id);
    this.closeDeleteModal();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatTiempoRelativo(fecha: Date): string {
    const ahora = new Date();
    const diff = ahora.getTime() - new Date(fecha).getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
    if (dias < 365) return `Hace ${Math.floor(dias / 30)} meses`;
    return `Hace ${Math.floor(dias / 365)} años`;
  }

  // Icons
  readonly Users = Users;
  readonly ShoppingBag = ShoppingBag;
  readonly DollarSign = DollarSign;
  readonly Trash2 = Trash2;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Clock = Clock;
  readonly Receipt = Receipt;
  readonly ChevronRight = ChevronRight;
  readonly Search = Search;
}
