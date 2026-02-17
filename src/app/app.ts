import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { Sidebar, AdminRol } from './layout/sidebar/sidebar';
import { Header, Notificacion } from './layout/header/header';

// Mapa de títulos por ruta
const PAGE_TITLES: Record<string, { title: string, subtitle: string }> = {
  '/dashboard':      { title: 'Dashboard',      subtitle: 'Resumen general del día' },
  '/cocina':         { title: 'Vista Cocina',   subtitle: 'Pedidos en tiempo real' },
  '/pedidos':        { title: 'Pedidos',        subtitle: 'Historial y gestión' },
  '/mesas':          { title: 'Mesas',          subtitle: 'Estado y configuración' },
  '/productos':      { title: 'Productos',      subtitle: 'Catálogo completo' },
  '/calificaciones': { title: 'Calificaciones', subtitle: 'Reseñas de clientes' },
  '/clientes':       { title: 'Clientes',       subtitle: 'Base de datos' },
  '/pagos':          { title: 'Pagos',          subtitle: 'Historial de transacciones' },
  '/usuarios':       { title: 'Usuarios',       subtitle: 'Gestión de staff' },
};

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Sidebar, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);

  // Datos del usuario
  // TODO: conectar con un servicio
  userRol: AdminRol = 'admin';
  userName: string = 'Diego Ramírez';
  pedidosActivos: number = 3;

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
    this.router.navigate(['/admin/login']);
  }

  onNotificacionClick(notif: Notificacion): void {
    console.log('Notificación clickeada:', notif);
  }
}
