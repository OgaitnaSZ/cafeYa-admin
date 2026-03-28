import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConfirmModal } from '../../../layout/components/confirm-modal/confirm-modal';
import { NotificacionService } from '../../../core/services/notificacion';
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
  Search,
  ChevronLeft
} from 'lucide-angular';

@Component({
  selector: 'app-clientes',
  imports: [CommonModule, ConfirmModal, LucideAngularModule],

  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes {
  // Servicios
  private clienteService = inject(ClientesService);
  private ns = inject(NotificacionService);
  private router = inject(Router);

  // Signals
  clientes = this.clienteService.clientes;
  loading = this.clienteService.loading;
  loadingLista = this.clienteService.loadingLista;

  // Paginacion
  paginaActual    = this.clienteService.paginaActual;
  limitePorPagina = this.clienteService.limitePorPagina;
  totalRegistros  = this.clienteService.totalRegistros;
  totalPaginas    = this.clienteService.totalPaginas;
  registroDesde   = this.clienteService.registroDesde;
  registroHasta   = this.clienteService.registroHasta;

  readonly LIMITES_PAGINA = [10, 20, 50, 100];

  irAPagina(pagina: number) {
    this.clienteService.irAPagina(pagina);
  }
  
  cambiarLimite(event: Event) {
    const limite = +(event.target as HTMLSelectElement).value;
    this.clienteService.cambiarLimite(limite);
  }
  
  getPaginas(): (number | null)[] {
    const total  = this.totalPaginas();
    const actual = this.paginaActual();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  
    const pages: (number | null)[] = [1];
    if (actual > 3)         pages.push(null);
    for (let i = Math.max(2, actual - 1); i <= Math.min(total - 1, actual + 1); i++) pages.push(i);
    if (actual < total - 2) pages.push(null);
    pages.push(total);
    return pages;
  }

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
      return this.ns.error('Cliente inexistente', 'El cliente no existe');
    }
    
    if ((cliente._count?.pedidos || 0) > 0) {
      this.ns.error(
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
  readonly ChevronLeft = ChevronLeft;
  readonly Search = Search;
}
