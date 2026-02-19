import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header, Notificacion } from '../../layout/header/header';
import { Auth } from '../../core/services/auth';

// Mapa de títulos por ruta
const PAGE_TITLES: Record<string, { title: string, subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Resumen general del sistema'
  },

  '/pedidos-activos': {
    title: 'Pedidos Activos',
    subtitle: 'Órdenes en preparación y servicio'
  },

  '/productos': {
    title: 'Productos',
    subtitle: 'Gestión del catálogo y precios'
  },

  '/mesas/activas': {
    title: 'Mesas Activas',
    subtitle: 'Estado actual de mesas en servicio'
  },

  '/mesas/gestion': {
    title: 'Gestión de Mesas',
    subtitle: 'Configuración y administración de mesas'
  },

  '/clientes': {
    title: 'Clientes',
    subtitle: 'Listado y gestión de clientes'
  },

  '/clientes/pedidos': {
    title: 'Pedidos de Clientes',
    subtitle: 'Historial de pedidos realizados'
  },

  '/clientes/calificaciones': {
    title: 'Calificaciones',
    subtitle: 'Reseñas y valoraciones recibidas'
  },

  '/clientes/pagos': {
    title: 'Pagos',
    subtitle: 'Historial y control de transacciones'
  },

  '/administracion/reportes': {
    title: 'Reportes e Informes',
    subtitle: 'Análisis y estadísticas del sistema'
  },

  '/administracion/logs': {
    title: 'Error Log',
    subtitle: 'Registro de eventos y errores del sistema'
  },

  '/administracion/usuarios': {
    title: 'Usuarios',
    subtitle: 'Gestión de usuarios y roles'
  }
};


@Component({
  selector: 'app-private',
  imports: [CommonModule, RouterOutlet, Sidebar, Header],
  templateUrl: './private.html',
  styleUrl: './private.css',
})
export class Private {
  // Servicios
  private router = inject(Router);
  public auth = inject(Auth);

  // Datos del usuario
  usuario = this.auth.user;
  pedidosActivos: number = 3;

  // Sidebar
  isSidebarOpen = signal(false);
  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }
  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  // Título dinámico según la ruta
  pageTitle = 'Dashboard';
  pageSubtitle = '';

  // Notificaciones de prueba
  // TODO: Conectar con un servicio
  notificaciones: Notificacion[] = [
    { id: '1', titulo: 'Nuevo pedido', mensaje: 'Mesa 5 realizó un pedido de $4.800', tipo: 'pedido', leida: false, tiempo: 'Hace 2 min' },
    { id: '2', titulo: 'Stock bajo', mensaje: 'Medialuna: quedan solo 3 unidades', tipo: 'stock', leida: false, tiempo: 'Hace 15 min' },
    { id: '3', titulo: 'Mesa ocupada', mensaje: 'Mesa 7 inició una nueva sesión', tipo: 'mesa', leida: true, tiempo: 'Hace 30 min' },
  ];

  constructor() {
    // Actualizar título según la ruta activa
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: any) => PAGE_TITLES[event.url] || { title: 'Admin', subtitle: '' })
    ).subscribe(({ title, subtitle }) => {
      this.pageTitle = title;
      this.pageSubtitle = subtitle;
    });
  }

  onLogout(): void {
    this.auth.logout();
  }

  onNotificacionClick(notif: Notificacion): void {
    console.log('Notificación clickeada:', notif);
  }
}
