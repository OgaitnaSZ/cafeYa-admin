import { Injectable, signal, inject, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Auth } from './auth';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ClienteConectado {
  socketId: string;
  userId: string;
  mesaId?: string;
  sesionId?: string;
  timestamp?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private authService = inject(Auth);
  
  private socket: Socket | null = null;
  
  // Signals
  connectionStatus = signal<ConnectionStatus>('disconnected');
  isConnected = computed(() => this.connectionStatus() === 'connected');
  clientesConectados = signal<ClienteConectado[]>([]);
  
  // Stats en tiempo real
  totalClientesConectados = computed(() => this.clientesConectados().length);

  constructor() {
    // Auto-conectar si hay token
    if (this.authService.getToken()) {
      this.connect();
    }
  }

  connect() {
    if (this.socket?.connected) {
      console.log('Socket admin ya conectado');
      return;
    }

    this.connectionStatus.set('connecting');

    this.socket = io(environment.socketUrl || environment.apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000,
      auth: {
        token: this.authService.getToken()
      }
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    // Conexión exitosa
    this.socket.on('connect', () => {
      console.log('✅ Socket Admin conectado:', this.socket?.id);
      this.connectionStatus.set('connected');

      // Autenticarse como admin
      const userData = this.authService.getUser();
      this.socket?.emit('authenticate', {
        userId: userData?.id,
        userRole: userData?.rol || 'admin'
      });
    });

    // Desconexión
    this.socket.on('disconnect', () => {
      console.log('❌ Socket Admin desconectado');
      this.connectionStatus.set('disconnected');
    });

    // Error
    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Admin:', error);
      this.connectionStatus.set('error');
    });

    // Lista inicial de clientes conectados
    this.socket.on('admin:clientes-conectados', (clientes: ClienteConectado[]) => {
      console.log('📋 Clientes conectados:', clientes);
      this.clientesConectados.set(clientes);
    });

    // Cliente se conectó
    this.socket.on('cliente:conectado', (data: ClienteConectado) => {
      console.log('✅ Cliente conectado:', data);
      this.clientesConectados.update(list => [...list, data]);
    });

    // Cliente se desconectó
    this.socket.on('cliente:desconectado', (data: ClienteConectado) => {
      console.log('❌ Cliente desconectado:', data);
      this.clientesConectados.update(list => 
        list.filter(c => c.socketId !== data.socketId)
      );
    });

    // Reconexión
    this.socket.on('reconnect', () => {
      console.log('🔄 Admin reconectado');
      this.connectionStatus.set('connected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus.set('disconnected');
    }
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
