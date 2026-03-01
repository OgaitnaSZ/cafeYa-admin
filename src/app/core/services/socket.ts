import { Injectable, signal, inject, computed, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Auth } from './auth';
import { NotificacionService } from './notificacion';

// Tipos (espejando el backend)
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// Prisma enums 
export type PedidoEstado = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';
export type PagoMedioDePago = 'efectivo' | 'tarjeta' | 'qr';
export type UsuarioRol = 'cliente' | 'admin' | 'encargado' | 'cocina';

export interface ClienteConectado {
  socketId: string;
  usuario_id: string;
  nombre_usuario: string;
  mesa_id: string;
  mesa_numero: number;
  connectedAt: Date;
}

export interface NuevoPedidoPayload {
  pedido_id: string;
  numero_pedido: string;
  mesa_id: string;
  cliente_id: string;
  nombre_cliente: string;
  productos: number;
  precio_total: number;
}

export interface NuevaMesaOcupadaPayload {
  mesa_id: string;
  mesa_numero: number;
  ocupadaAt: Date;
}

export interface NuevaResenaPayload {
  resena_id: string;
  pedido_id: string;
  nombre_cliente: string;
  puntuacion: number;
  resena: string;
  createdAt: Date;
}

export interface NuevoPagoPayload {
  pago_id: string;
  pedido_id: string;
  mesa_id: string;
  mesa_numero: number;
  usuario_id: string;
  nombre_usuario: string;
  monto_final: number;
  metodoPago: PagoMedioDePago;
  createdAt: Date;
}

export interface LlamadaMozoPayload {
  mesa_id: string;
  mesa_numero: number;
  usuario_id: string;
  nombre_usuario: string;
  timestamp: Date;
}

export interface CambioEstadoPedidoPayload {
  pedido_id: string;
  mesa_id: string;
  estado: PedidoEstado;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private authService = inject(Auth);
  private ns = inject(NotificacionService);

  private socket: Socket | null = null;

  // Conexión
  connectionStatus = signal<ConnectionStatus>('disconnected');
  isConnected = computed(() => this.connectionStatus() === 'connected');

  // Clientes
  clientesConectados = signal<ClienteConectado[]>([]);
  totalClientesConectados = computed(() => this.clientesConectados().length);

  // Notificaciones
  pedidos = signal<NuevoPedidoPayload[]>([]);
  mesasOcupadas = signal<NuevaMesaOcupadaPayload[]>([]);
  resenas = signal<NuevaResenaPayload[]>([]);
  pagos = signal<NuevoPagoPayload[]>([]);
  llamadasMozo = signal<LlamadaMozoPayload[]>([]);

  // Badges
  pedidosSinLeer = signal(0);
  llamadasSinLeer = signal(0);
  pagosSinLeer = signal(0);
  resenasSinLeer = signal(0);

  // Total de notificaciones
  totalSinLeer = computed(() =>
    this.pedidosSinLeer() +
    this.llamadasSinLeer() +
    this.pagosSinLeer() +
    this.resenasSinLeer()
  );

  constructor() {
    if (this.authService.getToken()) {
      this.connect();
    }
  }

  connect() {
    if (this.socket?.connected) return;

    this.connectionStatus.set('connecting');

    this.socket = io(environment.socketUrl || environment.apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000,
      auth: { token: this.authService.getToken() }
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    // Conexión
    this.socket.on('connect', () => {
      console.log('✅ Admin conectado:', this.socket?.id);
      this.connectionStatus.set('connected');

      const userData = this.authService.getUser();
      this.socket?.emit('authenticate', {
        userId: userData?.id,
        userName: userData?.nombre,
        userRole: userData?.rol ?? 'admin',
      });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Admin desconectado');
      this.connectionStatus.set('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      this.ns.error('Error de conexión', error.message);
      this.connectionStatus.set('error');
    });

    this.socket.on('reconnect', () => {
      console.log('🔄 Admin reconectado');
      this.connectionStatus.set('connected');
    });

    // Clientes
    this.socket.on('admin:clientes-conectados', (clientes: ClienteConectado[]) => {
      this.clientesConectados.set(clientes);
    });

    this.socket.on('cliente:conectado', (data: ClienteConectado) => {
      this.clientesConectados.update(list => [...list, data]);
    });

    this.socket.on('cliente:desconectado', (data: ClienteConectado) => {
      this.clientesConectados.update(list =>
        list.filter(c => c.socketId !== data.socketId)
      );
    });

    // Notificaciones
    this.socket.on('admin:nuevo-pedido', (data: NuevoPedidoPayload) => {
      this.pedidos.update(list => [data, ...list]);
      this.pedidosSinLeer.update(n => n + 1);
      this.ns.agregarServidor({
        tipo: 'pedido',
        titulo: `Nuevo pedido #${data.numero_pedido}`,
        mensaje: `Cliente ${data.nombre_cliente} · ${data.productos} productos · $${data.precio_total}`,
        url: '/pedidos-activos'
      });
    });

    this.socket.on('admin:mesa-ocupada', (data: NuevaMesaOcupadaPayload) => {
      this.mesasOcupadas.update(list => [data, ...list]);
      this.ns.agregarServidor({
        tipo: 'mesa',
        titulo: `Mesa ${data.mesa_numero} ocupada`,
        mensaje: `Ocupada a las ${new Date(data.ocupadaAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
        url: '/mesas'
      });
    });

    this.socket.on('admin:nueva-resena', (data: NuevaResenaPayload) => {
      this.resenas.update(list => [data, ...list]);
      this.resenasSinLeer.update(n => n + 1);
      this.ns.agregarServidor({
        tipo: 'resena',
        titulo: `Nueva reseña de ${data.nombre_cliente}`,
        mensaje: `${'⭐'.repeat(data.puntuacion)} · "${data.resena}"`,
        url: `/clientes/calificaciones?pedido_id=${data.pedido_id}`
      });
    });

    this.socket.on('admin:nuevo-pago', (data: NuevoPagoPayload) => {
      this.pagos.update(list => [data, ...list]);
      this.pagosSinLeer.update(n => n + 1);
      this.ns.agregarServidor({
        tipo: 'pago',
        titulo: `Pago recibido - Mesa ${data.mesa_numero}`,
        mensaje: `$${data.monto_final} · ${data.metodoPago}`,
        url: `/clientes/pagos?pedido_id=${data.pedido_id}`
      });
    });

    this.socket.on('admin:llamada-mozo', (data: LlamadaMozoPayload) => {
      this.llamadasMozo.update(list => [data, ...list]);
      this.llamadasSinLeer.update(n => n + 1);
      this.ns.agregarServidor({
        tipo: 'mozo',
        titulo: `🔔 Llamada al mozo - Mesa ${data.mesa_numero}`,
        mensaje: data.nombre_usuario,
        url: '/mesas'
      });
    });
  }

  // Marcar como leído
  marcarPedidosLeidos()  { this.pedidosSinLeer.set(0); }
  marcarLlamadasLeidas() { this.llamadasSinLeer.set(0); }
  marcarPagosLeidos()    { this.pagosSinLeer.set(0); }
  marcarResenasLeidas()  { this.resenasSinLeer.set(0); }
  marcarTodoLeido()      {
    this.pedidosSinLeer.set(0);
    this.llamadasSinLeer.set(0);
    this.pagosSinLeer.set(0);
    this.resenasSinLeer.set(0);
  }

  // Utilidades
  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on<T>(event: string, callback: (data: T) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.connectionStatus.set('disconnected');
  }

  ngOnDestroy() {
    this.disconnect();
  }
}