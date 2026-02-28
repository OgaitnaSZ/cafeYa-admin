import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidosServices } from '../../core/services/pedidos';
import { SocketService } from '../../core/services/socket';
import { NotificacionService } from '../../core/services/notificacion';
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
  // Servicios
  private pedidoService = inject(PedidosServices);
  private socketAdminService = inject(SocketService);
  private ns = inject(NotificacionService);

  // Data
  pedidosActivos = this.pedidoService.pedidosActivos;
  loadingLista = this.pedidoService.loadingLista;
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

  ngOnInit() {
    // Conectar socket
    if (!this.socketConnected()) {
      this.socketAdminService.connect();
    }
    
    // Setup socket listeners
    this.setupSocketListeners();
    
    // Auto-refresh
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
    this.cleanupSocketListeners();
  }

  private setupSocketListeners() {
    // Nuevo pedido
    this.socketAdminService.on('pedido:nuevo', (data: any) => {
      
      // Sonido de notificación (opcional)
      this.playNotificationSound();
      
      // Toast con animación
      this.ns.success(
        '🔔 Nuevo pedido', 
        `Mesa ${data.mesa_numero} - ${data.items_count} items`
      );
      
      this.recargar();
    });

    // Pedido actualizado
    this.socketAdminService.on('pedido:cambio-estado', (data: any) => {
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

  cambiarEstado(pedido: Pedido, nuevoEstado: PedidoEstado, event: Event) {
    event.preventDefault();
    event.stopPropagation();
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

