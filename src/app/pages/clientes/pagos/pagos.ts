import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Pago, FiltrosPagos, MedioDePago } from '../../../core/interfaces/pago.model';
import { PagoService } from '../../../core/services/pago';
import { 
  LucideAngularModule, 
  Filter,
  X,
  CreditCard,
  DollarSign,
  Receipt,
  Smartphone,
  Banknote,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  ReceiptText,
  Search,
  Calendar
} from 'lucide-angular';

@Component({
  selector: 'app-pagos',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './pagos.html',
  styleUrl: './pagos.css',
})
export class Pagos {
  private pagoService = inject(PagoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Data
  pagos = this.pagoService.pagos;
  loading = this.pagoService.loading;
  loadingLista = this.pagoService.loadingLista;

  // Stats
  totalPagos = this.pagoService.totalPagos;
  totalRecaudado = this.pagoService.totalRecaudado;
  totalIVA = this.pagoService.totalIVA;
  pagosPorMedio = this.pagoService.pagosPorMedio;

  // Filtros
  filtrosActivos = this.pagoService.filtrosActivos;
  tieneFiltros = this.pagoService.tieneFiltros;
  searchTerm = signal('');
  fechaDesde = signal<Date | null>(null);
  fechaHasta = signal<Date | null>(null);
  
  filtroMedioPago = signal<MedioDePago | 'todos'>('todos');
  filtroPedidoId = signal<string | null>(null);

  // Info adicional para breadcrumbs
  numeroPedidoFiltrado = signal<string>('');

  ngOnInit() {
    // Leer queryParams y aplicar filtros
    this.route.queryParams.subscribe(params => {
      const filtros: FiltrosPagos = {};

      if (params['pedido_id']) {
        this.filtroPedidoId.set(params['pedido_id']);
        filtros.pedido_id = params['pedido_id'];
      }

      if (params['medio_de_pago'] !== undefined) {
        this.filtroMedioPago.set(params['medio_de_pago'] as MedioDePago);
        filtros.medio_de_pago = params['medio_de_pago'] as MedioDePago;
      }

      // Cargar pagos con filtros
      this.aplicarFiltros(filtros);
    });
  }

  aplicarFiltros(filtrosExtra?: FiltrosPagos) {
    const filtros: FiltrosPagos = {
      medio_de_pago: this.filtroMedioPago() !== 'todos' ? this.filtroMedioPago() as MedioDePago : undefined,
      pedido_id: this.filtroPedidoId() || undefined,
      search: this.searchTerm() || undefined,
      fecha_desde: this.fechaDesde() || undefined,
      fecha_hasta: this.fechaHasta() || undefined,
      ...filtrosExtra
    };

    this.pagoService.cargarPagos(filtros);
  }

  cambiarFiltroMedioPago(medio: MedioDePago | 'todos') {
    this.filtroMedioPago.set(medio);
    this.updateQueryParams({ medio_de_pago: medio !== 'todos' ? medio : null });
    this.aplicarFiltros();
  }

  limpiarFiltroPedido() {
    this.filtroPedidoId.set(null);
    this.numeroPedidoFiltrado.set('');
    this.updateQueryParams({ pedido_id: null });
    this.aplicarFiltros();
  }

  limpiarTodosFiltros() {
    this.filtroMedioPago.set('todos');
    this.filtroPedidoId.set(null);
    this.numeroPedidoFiltrado.set('');
    
    this.router.navigate(['/clientes/pagos']);
    this.pagoService.limpiarFiltros();
    this.aplicarFiltros();
  }

  private updateQueryParams(params: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }

  recargarPagos() {
    console.log(this.totalIVA())
    this.aplicarFiltros();
  }

  // Navegar al pedido
  verPedido(pago: Pago) {
    this.router.navigate(['/clientes/pedidos'], {
      queryParams: { pedido_id: pago.pedido_id }
    });
  }

  // Ver recibo para imprimir
  verRecibo(pago: Pago) {
    this.pagoService.generarRecibo(pago.pago_id);
  }

  // Helper para obtener estilos según medio de pago
  getMedioPagoStyles(medio: MedioDePago) {
    const styles = {
      app: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: Smartphone,
        label: 'App'
      },
      tarjeta: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-700',
        border: 'border-purple-200',
        icon: CreditCard,
        label: 'Tarjeta'
      },
      efectivo: { 
        bg: 'bg-green-100', 
        text: 'text-green-700',
        border: 'border-green-200',
        icon: Banknote,
        label: 'Efectivo'
      }
    };
    return styles[medio];
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
  readonly CreditCard = CreditCard;
  readonly DollarSign = DollarSign;
  readonly Receipt = Receipt;
  readonly Smartphone = Smartphone;
  readonly Banknote = Banknote;
  readonly RefreshCw = RefreshCw;
  readonly ExternalLink = ExternalLink;
  readonly TrendingUp = TrendingUp;
  readonly ReceiptText = ReceiptText;
  readonly Search = Search;
  readonly Calendar = Calendar;
}