import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Bell, LucideAngularModule, Menu, X } from 'lucide-angular';
import { SocketConnection } from '../components/socket-connection/socket-connection';
import { NotificacionService, NOTIF_SERVIDOR_META, NOTIF_ESTADO_META, TipoNotifServidor, TipoNotifEstado } from '../../core/services/notificacion';

export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'pedido' | 'stock' | 'mesa' | 'sistema';
  leida: boolean;
  tiempo: string;
}

@Component({
  selector: 'app-header',
  imports: [CommonModule, LucideAngularModule, SocketConnection],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  @Output() toggleSidebar = new EventEmitter<void>();
  
  @Input() pageTitle: string = 'Dashboard';
  @Input() pageSubtitle: string = '';
  @Input() pedidosActivos: number = 0;
  @Input() nombreUsuario: string | undefined = 'Usuario';
  @Input() notificaciones: Notificacion[] = [];
  @Output() notificacionClick = new EventEmitter<Notificacion>();

  // Servicios
  readonly ns = inject(NotificacionService);

  private timerInterval: any;
  private _hora = signal('');
  private _fecha = signal('');

  get nombreInicial(): string {
    return this.nombreUsuario?.charAt(0).toUpperCase() || 'U';
  }

  horaActual = this._hora.asReadonly();
  fechaActual = this._fecha.asReadonly();

  constructor() {
    this.updateTime();
    this.timerInterval = setInterval(() => this.updateTime(), 60000);
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  private updateTime(): void {
    const now = new Date();
    this._hora.set(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    this._fecha.set(now.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' }));
  }

  // Notificaciones
  tabActivo = signal<'servidor' | 'estado'>('servidor');
  showNotifications = signal(false);
  notificacionesNoLeidas = () => this.notificaciones.filter(n => !n.leida).length;

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
  }

  marcarTodasLeidas(): void {
    this.notificaciones.forEach(n => n.leida = true);
  }

  onNotificacionClick(notif: Notificacion): void {
    notif.leida = true;
    this.notificacionClick.emit(notif);
    this.showNotifications.set(false);
  }

  getMetaServidor(tipo: TipoNotifServidor) {
    return NOTIF_SERVIDOR_META[tipo];
  }

  getMetaEstado(tipo: TipoNotifEstado) {
    return NOTIF_ESTADO_META[tipo];
  }

  // Icons
  readonly Menu = Menu;
  readonly Bell = Bell;
  readonly X = X;
}
