import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Bell, LucideAngularModule, Menu } from 'lucide-angular';

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
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  @Output() toggleSidebar = new EventEmitter<void>();
  
  @Input() pageTitle: string = 'Dashboard';
  @Input() pageSubtitle: string = '';
  @Input() pedidosActivos: number = 0;
  @Input() nombreUsuario: string = 'Usuario';
  @Input() notificaciones: Notificacion[] = [];
  @Output() notificacionClick = new EventEmitter<Notificacion>();

  showNotifications = signal(false);

  private timerInterval: any;
  private _hora = signal('');
  private _fecha = signal('');

  get nombreInicial(): string {
    return this.nombreUsuario?.charAt(0).toUpperCase() || 'U';
  }

  notificacionesNoLeidas = () =>
    this.notificaciones.filter(n => !n.leida).length;

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

  // Icons
  readonly Menu = Menu;
  readonly Bell = Bell;
}
