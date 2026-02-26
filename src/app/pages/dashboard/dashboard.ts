import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, TrendingUp, Users, ShoppingBag, Star, Clock, CheckCircle, ChefHat, Package, CreditCard, Banknote, Smartphone, ArrowRight, RefreshCw, Utensils, AlertCircle } from 'lucide-angular';
import { Auth } from '../../core/services/auth';
import { MesaService } from '../../core/services/mesa';
import { PedidosServices } from '../../core/services/pedidos';
import { PedidoEstado } from '../../core/interfaces/pedido.model';

// ─── Types ────────────────────────────────────────────────────────────────────
type MesaEstado = 'Disponible' | 'Ocupada';

interface Mesa {
  mesa_id: string;
  numero: number;
  estado: MesaEstado;
  pedido_activo?: { numero_pedido: string; nombre_cliente: string; precio_total: number; created_at: Date };
}

interface PedidoActivo {
  pedido_id: string;
  numero_pedido: string;
  nombre_cliente: string;
  mesa_numero: number;
  precio_total: number;
  estado: PedidoEstado;
  created_at: Date;
  productos: string[];
}

interface TopProducto {
  nombre: string;
  cantidad: number;
  total: number;
  emoji: string;
}

interface Calificacion {
  nombre_cliente: string;
  puntuacion: number;
  resena: string;
  created_at: Date;
  numero_pedido: string;
}

interface ResumenPagos {
  efectivo: number;
  tarjeta: number;
  app: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  // Servicios
  authService = inject(Auth);
  mesaService = inject(MesaService);
  pedidosService = inject(PedidosServices);

  // Estados
  loading = signal(false);
  lastUpdated = signal(new Date());

  // Signals
  usuario = this.authService.user;
  mesas1 = this.mesaService.mesas;
  mesasDisponibles = this.mesaService.mesasDisponibles;
  mesasOcupadas = this.mesaService.mesasOcupadas;
  pedidos = this.pedidosService.pedidos;
  pedidosPorEstado = this.pedidosService.pedidosPorEstado;

  recaudadoHoy = signal(47850.75);
  recaudadoAyer = signal(38200.00);

  totalPedidosHoy = signal(34);
  pedidosAyer = signal(28);

  calificacionPromedio = signal(4.6);
  totalCalificaciones = signal(12);

  resumenPagos = signal<ResumenPagos>({
    efectivo: 18300,
    tarjeta: 22150.75,
    app: 7400,
  });

  mesas = signal<Mesa[]>([
    { mesa_id: '1', numero: 1, estado: 'Ocupada', pedido_activo: { numero_pedido: 'P-001', nombre_cliente: 'Martina G.', precio_total: 3200, created_at: new Date(Date.now() - 25 * 60000) } },
    { mesa_id: '2', numero: 2, estado: 'Ocupada', pedido_activo: { numero_pedido: 'P-005', nombre_cliente: 'Lucas M.', precio_total: 1850, created_at: new Date(Date.now() - 10 * 60000) } },
    { mesa_id: '3', numero: 3, estado: 'Disponible' },
    { mesa_id: '4', numero: 4, estado: 'Disponible' },
    { mesa_id: '5', numero: 5, estado: 'Ocupada', pedido_activo: { numero_pedido: 'P-008', nombre_cliente: 'Sofía R.', precio_total: 2750, created_at: new Date(Date.now() - 5 * 60000) } },
    { mesa_id: '6', numero: 6, estado: 'Disponible' },
    { mesa_id: '7', numero: 7, estado: 'Ocupada', pedido_activo: { numero_pedido: 'P-011', nombre_cliente: 'Diego P.', precio_total: 4100, created_at: new Date(Date.now() - 40 * 60000) } },
    { mesa_id: '8', numero: 8, estado: 'Disponible' },
    { mesa_id: '9', numero: 9, estado: 'Disponible' },
    { mesa_id: '10', numero: 10, estado: 'Ocupada', pedido_activo: { numero_pedido: 'P-014', nombre_cliente: 'Ana C.', precio_total: 1200, created_at: new Date(Date.now() - 3 * 60000) } },
    { mesa_id: '11', numero: 11, estado: 'Disponible' },
    { mesa_id: '12', numero: 12, estado: 'Disponible' },
  ]);

  topProductos = signal<TopProducto[]>([
    { nombre: 'Cappuccino', cantidad: 38, total: 22800, emoji: '☕' },
    { nombre: 'Medialunas x3', cantidad: 29, total: 11600, emoji: '🥐' },
    { nombre: 'Tostado mixto', cantidad: 22, total: 13200, emoji: '🥪' },
    { nombre: 'Smoothie mango', cantidad: 18, total: 12600, emoji: '🥭' },
    { nombre: 'Café con leche', cantidad: 17, total: 8500, emoji: '🍵' },
  ]);

  calificacionesRecientes = signal<Calificacion[]>([
    { nombre_cliente: 'Martina G.', puntuacion: 5, resena: 'Excelente servicio y el café estuvo increíble 😍', created_at: new Date(Date.now() - 30 * 60000), numero_pedido: 'P-002' },
    { nombre_cliente: 'Tomás H.', puntuacion: 4, resena: 'Muy rico todo, tardó un poco pero valió la pena.', created_at: new Date(Date.now() - 2 * 3600000), numero_pedido: 'P-003' },
    { nombre_cliente: 'Valeria N.', puntuacion: 5, resena: '¡Siempre vengo acá! El mejor lugar del barrio.', created_at: new Date(Date.now() - 4 * 3600000), numero_pedido: 'P-007' },
  ]);

  variacionRecaudado = computed(() => {
    const ayer = this.recaudadoAyer();
    if (ayer === 0) return 0;
    return ((this.recaudadoHoy() - ayer) / ayer * 100);
  });

  variacionPedidos = computed(() => {
    const ayer = this.pedidosAyer();
    if (ayer === 0) return 0;
    return ((this.totalPedidosHoy() - ayer) / ayer * 100);
  });

  private refreshInterval?: ReturnType<typeof setInterval>;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit() {
    // TODO: Conectar servicios reales aquí
    // this.cargarDashboard();
    // Refresco automático cada 60 segundos
    this.refreshInterval = setInterval(() => {
      this.lastUpdated.set(new Date());
      // TODO: llamar a los servicios para actualizar
    }, 60000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  refreshData() {
    this.loading.set(true);
    // TODO: reemplazar con llamadas reales
    setTimeout(() => {
      this.lastUpdated.set(new Date());
      this.loading.set(false);
    }, 800);
  }

  formatPrice(value: number | string): string {
    return Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `hace ${diff} min`;
    return `hace ${Math.floor(diff / 60)}h`;
  }

  formatHora(date: Date): string {
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  getEstadoBadge(estado: PedidoEstado): { bg: string; text: string; dot: string; label: string } {
    switch (estado) {
      case 'Pendiente':       return { bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-700',  dot: 'bg-amber-400',  label: 'Pendiente' };
      case 'En_preparacion':  return { bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',   dot: 'bg-blue-400',   label: 'En preparación' };
      case 'Listo':           return { bg: 'bg-green-50 border-green-200',   text: 'text-green-700',  dot: 'bg-green-400',  label: 'Listo ✓' };
      case 'Entregado':       return { bg: 'bg-gray-50 border-gray-200',     text: 'text-gray-600',   dot: 'bg-gray-400',   label: 'Entregado' };
      default: return { bg: "", text: "", dot: "", label: "" }
    }
  }

  get saludo(): string {
    const h = new Date().getHours();
    if (h < 12) return '¡Buenos días';
    if (h < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  }

  get fechaHoy(): string {
    return new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  stars(n: number): number[] {
    return Array.from({ length: n });
  }

  getPagosPorcentaje(tipo: keyof ResumenPagos): number {
    const pagos = this.resumenPagos();
    const total = pagos.efectivo + pagos.tarjeta + pagos.app;
    return total > 0 ? Math.round((pagos[tipo] / total) * 100) : 0;
  }

    // Icons
  readonly TrendingUp = TrendingUp;
  readonly Users = Users;
  readonly ShoppingBag = ShoppingBag;
  readonly Star = Star;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly ChefHat = ChefHat;
  readonly Package = Package;
  readonly CreditCard = CreditCard;
  readonly Banknote = Banknote;
  readonly Smartphone = Smartphone;
  readonly ArrowRight = ArrowRight;
  readonly RefreshCw = RefreshCw;
  readonly Utensils = Utensils;
  readonly AlertCircle = AlertCircle;
}
