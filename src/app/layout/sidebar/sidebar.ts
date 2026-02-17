import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

export type AdminRol = 'admin' | 'encargado' | 'cocina';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  roles: AdminRol[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',      label: 'Dashboard',       icon: '📊', route: '/dashboard',      roles: ['admin', 'encargado'] },
  { id: 'cocina',         label: 'Pedidos Activos',  icon: '👨‍🍳', route: '/cocina',          roles: ['admin', 'encargado', 'cocina'] },
  { id: 'pedidos',        label: 'Pedidos',          icon: '📋', route: '/pedidos',         roles: ['admin', 'encargado'] },
  { id: 'mesas',          label: 'Mesas',            icon: '🪑', route: '/mesas',           roles: ['admin', 'encargado'] },
  { id: 'productos',      label: 'Productos',        icon: '🍕', route: '/productos',       roles: ['admin'] },
  { id: 'calificaciones', label: 'Calificaciones',   icon: '⭐', route: '/calificaciones',  roles: ['admin'] },
  { id: 'clientes',       label: 'Clientes',         icon: '👥', route: '/clientes',        roles: ['admin'] },
  { id: 'pagos',          label: 'Pagos',            icon: '💳', route: '/pagos',           roles: ['admin'] },
  { id: 'usuarios',       label: 'Usuarios',         icon: '👤', route: '/usuarios',        roles: ['admin'] },
];

const ROL_CONFIG = {
  admin:     { label: 'Admin',     bg: 'bg-red-100',    text: 'text-red-700' },
  encargado: { label: 'Encargado', bg: 'bg-orange-100', text: 'text-orange-700' },
  cocina:    { label: 'Cocina',    bg: 'bg-blue-100',   text: 'text-blue-700' },
};

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  @Input({ required: true }) rol!: AdminRol;
  @Input() nombreUsuario: string = 'Usuario';
  @Output() logout = new EventEmitter<void>();

  collapsed = signal(false);

  // Items filtrados según el rol
  navItems = computed(() =>
    NAV_ITEMS.filter(item => item.roles.includes(this.rol))
  );

  // Inicial del nombre
  nombreInicial = computed(() =>
    this.nombreUsuario?.charAt(0).toUpperCase() || 'U'
  );

  // Config visual del rol
  rolConfig = computed(() => ROL_CONFIG[this.rol]);

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }

  onLogout(): void {
    this.logout.emit();
  }
}
