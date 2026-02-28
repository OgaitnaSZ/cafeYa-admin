import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../../core/services/socket';
import { NotificacionService } from '../../../core/services/notificacion';

@Component({
  selector: 'app-socket-connection',
  imports: [CommonModule],
  templateUrl: './socket-connection.html',
  styleUrl: './socket-connection.css',
})
export class SocketConnection {
  private socketAdminService = inject(SocketService);
  private ns = inject(NotificacionService);

  socketConnected = this.socketAdminService.isConnected;
  clientesConectados = this.socketAdminService.clientesConectados;
  totalClientesConectados = this.socketAdminService.totalClientesConectados;

  constructor() {
    // Conectar socket al iniciar
    effect(() => {
      if (!this.socketAdminService.isConnected()) {
        this.socketAdminService.connect();
      }
    });

    // Notificar cuando cambian las conexiones
    effect(() => {
      const total = this.totalClientesConectados();
      console.log(`👥 ${total} cliente(s) conectado(s) en tiempo real`);
    });
  }

  ngOnInit() {
    // Socket listeners
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    // Escuchar eventos personalizados del servidor
    this.socketAdminService.on('sesion:iniciada', (data: any) => {
      console.log('🆕 Nueva sesión iniciada:', data);
      this.ns.success('Nueva sesión', `Mesa ${data.mesaNumero} iniciada`);
    });

    this.socketAdminService.on('pedido:creado', (data: any) => {
      console.log('🆕 Nuevo pedido:', data);
      this.ns.success('Nuevo pedido', `Mesa ${data.mesaNumero}`);
    });
  }

  ngOnDestroy() {
    // Limpiar listeners
    this.socketAdminService.off('sesion:iniciada');
    this.socketAdminService.off('pedido:creado');
  }
}
