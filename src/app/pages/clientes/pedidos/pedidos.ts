import { Component, signal, inject, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoDetalleModal } from './pedido-detalle-modal/pedido-detalle-modal';
import { ToastService } from '../../../core/services/toast';
import { ClientesService } from '../../../core/services/clientes';
import { MesaService } from '../../../core/services/mesa';
import { Pedido, FiltrosPedidos, PedidoEstado } from '../../../core/interfaces/pedido.model';
import { PedidosServices } from '../../../core/services/pedidos';
import { SocketService } from '../../../core/services/socket';
import { 
  LucideAngularModule, 
  Filter,
  X,
  Receipt,
  Clock,
  CheckCircle,
  Package,
  XCircle,
  Search,
  User,
  Table2,
  Eye,
  RefreshCw,
  DollarSign,
  CreditCard
} from 'lucide-angular';

@Component({
  selector: 'app-pedidos',
  imports: [CommonModule, PedidoDetalleModal, LucideAngularModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos {
  private pedidoService = inject(PedidosServices);
  private clienteService = inject(ClientesService);
  private mesaService = inject(MesaService);
  private socketAdminService = inject(SocketService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Data
  pedidos = this.pedidoService.pedidos;
  loading = this.pedidoService.loading;
  loadingLista = this.pedidoService.loadingLista;
  error = this.pedidoService.error;
  success = this.pedidoService.success;

  // Stats
  totalPedidos = this.pedidoService.totalPedidos;
  pedidosPorEstado = this.pedidoService.pedidosPorEstado;
  totalRecaudado = this.pedidoService.totalRecaudado;

  // Filtros
  filtrosActivos = this.pedidoService.filtrosActivos;
  tieneFiltros = this.pedidoService.tieneFiltros;
  
  filtroEstado = signal<PedidoEstado | 'todos'>('todos');
  filtroClienteId = signal<string | null>(null);
  filtroMesaId = signal<string | null>(null);
  searchTerm = signal('');

  // Info adicional para breadcrumbs
  nombreClienteFiltrado = signal<string>('');
  numeroMesaFiltrada = signal<number | null>(null);

  // Modal
  showDetalleModal = signal(false);
  selectedPedido = signal<Pedido | null>(null);

  // Socket
  socketConnected = this.socketAdminService.isConnected;

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
    // Leer queryParams y aplicar filtros
    this.route.queryParams.subscribe(params => {
      const filtros: FiltrosPedidos = {};

      if (params['cliente_id']) {
        this.filtroClienteId.set(params['cliente_id']);
        filtros.cliente_id = params['cliente_id'];
        this.cargarNombreCliente(params['cliente_id']);
      }

      if (params['mesa_id']) {
        this.filtroMesaId.set(params['mesa_id']);
        filtros.mesa_id = params['mesa_id'];
        this.cargarNumeroMesa(params['mesa_id']);
      }

      if (params['estado']) {
        this.filtroEstado.set(params['estado'] as PedidoEstado);
        filtros.estado = params['estado'] as PedidoEstado;
      }

      // Cargar pedidos con filtros
      this.aplicarFiltros(filtros);
    });

    // Setup socket listeners
    this.setupSocketListeners();
  }

  ngOnDestroy() {
    this.cleanupSocketListeners();
  }

  private setupSocketListeners() {
    this.socketAdminService.on('pedido:nuevo', (data: any) => {
      console.log('🆕 Nuevo pedido via socket:', data);
      this.toastService.success('Nuevo pedido', `#${data.numero_pedido} - Mesa ${data.mesa_numero}`);
      this.recargarPedidos();
    });

    this.socketAdminService.on('pedido:cambio-estado', (data: any) => {
      console.log('📦 Pedido actualizado via socket:', data);
      this.recargarPedidos();
    });
  }

  private cleanupSocketListeners() {
    this.socketAdminService.off('pedido:nuevo');
    this.socketAdminService.off('pedido:cambio-estado');
  }

  private cargarNombreCliente(clienteId: string) {
    this.clienteService.http.get<any>(`${this.clienteService['apiUrl']}${clienteId}`, {
      headers: this.clienteService.tokenService.createAuthHeaders()
    }).subscribe({
      next: (cliente) => {
        this.nombreClienteFiltrado.set(cliente.nombre);
      },
      error: () => {
        this.nombreClienteFiltrado.set('Cliente');
      }
    });
  }

  private cargarNumeroMesa(mesaId: string) {
    this.mesaService.http.get<any>(`${this.mesaService['apiUrl']}mesa/${mesaId}`, {
      headers: this.mesaService.tokenService.createAuthHeaders()
    }).subscribe({
      next: (mesa) => {
        this.numeroMesaFiltrada.set(mesa.numero);
      },
      error: () => {
        this.numeroMesaFiltrada.set(null);
      }
    });
  }

  aplicarFiltros(filtrosExtra?: FiltrosPedidos) {
    const filtros: FiltrosPedidos = {
      estado: this.filtroEstado() !== 'todos' ? this.filtroEstado() as PedidoEstado : undefined,
      cliente_id: this.filtroClienteId() || undefined,
      mesa_id: this.filtroMesaId() || undefined,
      search: this.searchTerm() || undefined,
      ...filtrosExtra
    };

    this.pedidoService.cargarPedidos(filtros);
  }

  cambiarFiltroEstado(estado: PedidoEstado | 'todos') {
    this.filtroEstado.set(estado);
    this.updateQueryParams({ estado: estado !== 'todos' ? estado : null });
    this.aplicarFiltros();
  }

  limpiarFiltroCliente() {
    this.filtroClienteId.set(null);
    this.nombreClienteFiltrado.set('');
    this.updateQueryParams({ cliente_id: null });
    this.aplicarFiltros();
  }

  limpiarFiltroMesa() {
    this.filtroMesaId.set(null);
    this.numeroMesaFiltrada.set(null);
    this.updateQueryParams({ mesa_id: null });
    this.aplicarFiltros();
  }

  limpiarTodosFiltros() {
    this.filtroEstado.set('todos');
    this.filtroClienteId.set(null);
    this.filtroMesaId.set(null);
    this.searchTerm.set('');
    this.nombreClienteFiltrado.set('');
    this.numeroMesaFiltrada.set(null);
    
    this.router.navigate(['/admin/pedidos']);
    this.pedidoService.limpiarFiltros();
    this.aplicarFiltros();
  }

  private updateQueryParams(params: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }

  recargarPedidos() {
    this.aplicarFiltros();
  }

  verDetalle(pedido: Pedido) {
    this.selectedPedido.set(pedido);
    this.showDetalleModal.set(true);
  }

  closeDetalleModal() {
    this.showDetalleModal.set(false);
    this.selectedPedido.set(null);
  }

  cambiarEstado(pedido: Pedido, nuevoEstado: PedidoEstado) {
    this.pedidoService.cambiarEstadoPedido(pedido.pedido_id, nuevoEstado);
  }

  // Navegar a página de pagos con filtro de pedido
  verPagos(pedido: Pedido) {
    this.router.navigate(['/admin/pagos'], {
      queryParams: { pedido_id: pedido.pedido_id }
    });
  }

  getEstadoStyles(estado: PedidoEstado) {
    const styles = {
      Pendiente: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: Clock,
        label: 'Pendiente'
      },
      EnPreparacion: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: Package,
        label: 'En Preparación'
      },
      Listo: { 
        bg: 'bg-green-100', 
        text: 'text-green-700',
        border: 'border-green-200',
        icon: CheckCircle,
        label: 'Listo'
      },
      Entregado: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-700',
        border: 'border-gray-200',
        icon: CheckCircle,
        label: 'Entregado'
      },
      Cancelado: { 
        bg: 'bg-red-100', 
        text: 'text-red-700',
        border: 'border-red-200',
        icon: XCircle,
        label: 'Cancelado'
      }
    };
    return styles[estado];
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

  formatHora(fecha: Date): string {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Icons
  readonly Filter = Filter;
  readonly X = X;
  readonly Receipt = Receipt;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly Package = Package;
  readonly XCircle = XCircle;
  readonly Search = Search;
  readonly User = User;
  readonly Table2 = Table2;
  readonly Eye = Eye;
  readonly RefreshCw = RefreshCw;
  readonly DollarSign = DollarSign;
  readonly CreditCard = CreditCard;
}
