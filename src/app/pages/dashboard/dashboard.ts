import { Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  TrendingUp, Users, ShoppingBag, Star, Clock,
  CheckCircle, ChefHat, CreditCard, Banknote,
  Smartphone, ArrowRight, RefreshCw, Utensils, AlertCircle,
} from 'lucide-angular';
import { DashboardService } from '../../core/services/dashboard';
import { PedidoEstado } from '../../core/interfaces/pedido.model';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  // Servicios
  readonly ds = inject(DashboardService);
  readonly as = inject(Auth);

  // Estados
  loading      = this.ds.loading;
  error        = this.ds.error;

  // Variables
  recaudadoHoy        = this.ds.recaudadoHoy;
  recaudadoAyer       = this.ds.recaudadoAyer;
  totalPedidosHoy     = this.ds.pedidosHoy;
  pedidosAyer         = this.ds.pedidosAyer;
  variacionRecaudado  = this.ds.variacionRecaudado;
  variacionPedidos    = this.ds.variacionPedidos;

  mesas            = this.ds.mesas;
  mesasOcupadas    = this.ds.mesasOcupadas;
  mesasDisponibles = this.ds.mesasDisponibles;
  totalMesas       = this.ds.totalMesas;

  pedidosActivos       = this.ds.pedidosActivos;
  pedidosPendientes    = this.ds.pedidosPendientes;
  pedidosEnPreparacion = this.ds.pedidosEnPreparacion;
  pedidosListos        = this.ds.pedidosListos;

  resumenPagos  = this.ds.resumenPagos;
  totalCobrado  = this.ds.totalCobrado;
  pctEfectivo   = this.ds.pctEfectivo;
  pctTarjeta    = this.ds.pctTarjeta;
  pctApp        = this.ds.pctApp;

  topProductos = this.ds.topProductos;

  calificacionPromedio    = this.ds.calificacionPromedio;
  totalCalificaciones     = this.ds.totalCalificaciones;
  calificacionesRecientes = this.ds.calificacionesRecientes;
  generadoEn              = this.ds.generadoEn;

  private refreshInterval?: ReturnType<typeof setInterval>;

  // Lifecycle
  ngOnInit() {
    this.ds.cargarResumen();

    // Refresco automático cada 30 segundos
    this.refreshInterval = setInterval(() => {
      this.ds.cargarResumen();
    }, 60_000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  // Helpers
  refreshData() {
    this.ds.cargarResumen();
  }

  formatPrice(value: number): string {
    return value.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatTime(date: Date | string): string {
    const d    = new Date(date);
    const diff = Math.floor((Date.now() - d.getTime()) / 60_000);
    if (diff < 1)  return 'Ahora';
    if (diff < 60) return `hace ${diff} min`;
    return `hace ${Math.floor(diff / 60)}h`;
  }

  formatHora(date: Date | string | null): string {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getEstadoBadge(estado: PedidoEstado): {
    bg: string; text: string; dot: string; label: string;
  } {
    const map: Record<PedidoEstado, { bg: string; text: string; dot: string; label: string }> = {
      Pendiente:       { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400',  label: 'Pendiente'       },
      En_preparacion:  { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700',  dot: 'bg-blue-400',   label: 'En preparación'  },
      Listo:           { bg: 'bg-green-50 border-green-200', text: 'text-green-700', dot: 'bg-green-400',  label: 'Listo ✓'         },
      Entregado:       { bg: 'bg-gray-50 border-gray-200',   text: 'text-gray-600',  dot: 'bg-gray-400',   label: 'Entregado'       },
      Cancelado:       { bg: 'bg-red-50 border-red-200',     text: 'text-red-600',   dot: 'bg-red-400',    label: 'Cancelado'       },
    };
    return map[estado] ?? map['Pendiente'];
  }

  stars(n: number): number[] {
    return Array.from({ length: n });
  }

  get saludo(): string {
    const h = new Date().getHours();
    if (h < 12) return '¡Buenos días';
    if (h < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  }

  get fechaHoy(): string {
    return new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  getPagosPorcentaje(tipo: 'efectivo' | 'tarjeta' | 'app'): number {
    return { efectivo: this.pctEfectivo(), tarjeta: this.pctTarjeta(), app: this.pctApp() }[tipo];
  }

  // Icons
  readonly TrendingUp   = TrendingUp;
  readonly Users        = Users;
  readonly ShoppingBag  = ShoppingBag;
  readonly Star         = Star;
  readonly Clock        = Clock;
  readonly CheckCircle  = CheckCircle;
  readonly ChefHat      = ChefHat;
  readonly CreditCard   = CreditCard;
  readonly Banknote     = Banknote;
  readonly Smartphone   = Smartphone;
  readonly ArrowRight   = ArrowRight;
  readonly RefreshCw    = RefreshCw;
  readonly Utensils     = Utensils;
  readonly AlertCircle  = AlertCircle;
}
