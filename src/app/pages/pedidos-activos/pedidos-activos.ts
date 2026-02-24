import { Component, signal, inject, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidosServices } from '../../core/services/pedidos';
import { SocketService } from '../../core/services/socket';
import { ToastService } from '../../core/services/toast';
import { Pedido, PedidoEstado } from '../../core/interfaces/pedido.model';
import { 
  LucideAngularModule, 
  Clock,
  Package,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  Receipt,
  AlertCircle
} from 'lucide-angular';

@Component({
  selector: 'app-pedidos-activos',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './pedidos-activos.html',
  styleUrl: './pedidos-activos.css',
})
export class PedidosActivos {
  private pedidoService = inject(PedidosServices);
  private socketAdminService = inject(SocketService);
  private toastService = inject(ToastService);

  // Data
  pedidosActivos = this.pedidoService.pedidos;
  loading = signal(false);
  actualizando = signal(false);

  // Socket
  socketConnected = this.socketAdminService.isConnected;

  // Filtro móvil
  estadoFiltroMovil = signal<PedidoEstado | 'todos'>('todos');

  // Computed - Pedidos por estado
  pedidosPendientes = computed(() => 
    this.pedidosActivos().filter(p => p.estado === 'Pendiente')
  );

  pedidosEnPreparacion = computed(() => 
    this.pedidosActivos().filter(p => p.estado === 'En_preparacion')
  );

  pedidosListos = computed(() => 
    this.pedidosActivos().filter(p => p.estado === 'Listo')
  );

  // Para vista móvil - pedidos filtrados
  pedidosFiltradosMovil = computed(() => {
    const filtro = this.estadoFiltroMovil();
    if (filtro === 'todos') return this.pedidosActivos();
    return this.pedidosActivos().filter(p => p.estado === filtro);
  });

  // Counts
  totalActivos = computed(() => this.pedidosActivos().length);

  // Auto-refresh interval
  private refreshInterval: any;
  private readonly REFRESH_INTERVAL = 30000; // 30 segundos

  constructor() {
    effect(() => {
      if (this.pedidoService.success()) {
        this.toastService.success(this.pedidoService.success()!);
      }
      
      if (this.pedidoService.error()) {
        this.toastService.error(this.pedidoService.error()!);
      }
    });
  }

  ngOnInit() {
    // Conectar socket
    if (!this.socketConnected()) {
      this.socketAdminService.connect();
    }

    // Cargar pedidos activos
    this.cargarPedidosActivos();
    
    // Setup socket listeners
    this.setupSocketListeners();
    
    // Auto-refresh
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
    this.cleanupSocketListeners();
  }

  cargarPedidosActivos() {
    this.loading.set(true);
    
    // Cargar solo pedidos con estados activos
    this.pedidoService.cargarPedidosActivos();
  }

  private setupSocketListeners() {
    // Nuevo pedido
    this.socketAdminService.on('pedido:nuevo', (data: any) => {
      console.log('🆕 Nuevo pedido en cocina:', data);
      
      // Sonido de notificación (opcional)
      this.playNotificationSound();
      
      // Toast con animación
      this.toastService.success(
        '🔔 Nuevo pedido', 
        `Mesa ${data.mesa_numero} - ${data.items_count} items`
      );
      
      this.recargar();
    });

    // Pedido actualizado
    this.socketAdminService.on('pedido:cambio-estado', (data: any) => {
      console.log('📦 Pedido actualizado en cocina:', data);
      this.recargar();
    });
  }

  private cleanupSocketListeners() {
    this.socketAdminService.off('pedido:nuevo');
    this.socketAdminService.off('pedido:cambio-estado');
  }

  private startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.recargar(true); // Silent refresh
    }, this.REFRESH_INTERVAL);
  }

  private stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  recargar(silent: boolean = false) {
    if (!silent) {
      this.actualizando.set(true);
    }
    
    this.pedidoService.cargarPedidosActivos();
  }

  cambiarEstado(pedido: Pedido, nuevoEstado: PedidoEstado) {
    this.pedidoService.cambiarEstadoPedido(pedido.pedido_id, nuevoEstado);
    
    // Actualizar localmente para feedback inmediato
    this.pedidosActivos.update(pedidos => 
      pedidos.map(p => p.pedido_id === pedido.pedido_id ? { ...p, estado: nuevoEstado } : p)
    );

    // Si el estado es "Entregado", remover de la lista después de un delay
    if (nuevoEstado === 'Entregado') {
      setTimeout(() => {
        this.pedidosActivos.update(pedidos => 
          pedidos.filter(p => p.pedido_id !== pedido.pedido_id)
        );
      }, 1000);
    }
  }

  // Sonido de notificación (opcional)
  private playNotificationSound() {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignorar si el navegador bloquea el audio
      });
    } catch (e) {
      // Ignorar errores de audio
    }
  }

  // Calcular tiempo transcurrido
  getTiempoTranscurrido(fecha: Date): string {
    const ahora = new Date();
    const diff = ahora.getTime() - new Date(fecha).getTime();
    const minutos = Math.floor(diff / 60000);
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `${minutos}m`;
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  }

  // Color de urgencia según tiempo
  getColorUrgencia(fecha: Date): 'normal' | 'warning' | 'urgent' {
    const ahora = new Date();
    const diff = ahora.getTime() - new Date(fecha).getTime();
    const minutos = Math.floor(diff / 60000);
    
    if (minutos > 30) return 'urgent';
    if (minutos > 15) return 'warning';
    return 'normal';
  }

  formatHora(fecha: Date): string {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  }

  // Icons
  readonly Clock = Clock;
  readonly Package = Package;
  readonly CheckCircle = CheckCircle;
  readonly ChevronRight = ChevronRight;
  readonly RefreshCw = RefreshCw;
  readonly Receipt = Receipt;
  readonly AlertCircle = AlertCircle;
}

