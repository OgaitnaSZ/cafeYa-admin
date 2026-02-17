import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard',      loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
    { path: 'cocina',         loadComponent: () => import('./pages/cocina/cocina').then(m => m.Cocina) },
    { path: 'pedidos',        loadComponent: () => import('./pages/pedidos/pedidos').then(m => m.Pedidos) },
    { path: 'mesas',          loadComponent: () => import('./pages/mesas/mesas').then(m => m.Mesas) },
    { path: 'productos',      loadComponent: () => import('./pages/productos/productos').then(m => m.Productos) },
    { path: 'calificaciones', loadComponent: () => import('./pages/calificaciones/calificaciones').then(m => m.Calificaciones) },
    { path: 'clientes',       loadComponent: () => import('./pages/clientes/clientes').then(m => m.Clientes) },
    { path: 'pagos',          loadComponent: () => import('./pages/pagos/pagos').then(m => m.Pagos) },
    { path: 'usuarios',       loadComponent: () => import('./pages/usuarios/usuarios').then(m => m.Usuarios) },
];
