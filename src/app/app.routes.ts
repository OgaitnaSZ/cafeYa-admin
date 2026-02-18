import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    // Rutas públicas
    {
        path: '',
        loadComponent: () =>
            import('./layouts/public/public')
            .then(m => m.Public),
        children: [
            { path: 'login', loadComponent: () => import('./pages/auth/login/login').then(m => m.Login)}
        ]
    },

    // Rutas privadas
    { 
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./layouts/private/private')
            .then(m => m.Private),
        children: [
            { path: 'dashboard',      loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
            { path: 'pedidos-activos',loadComponent: () => import('./pages/pedidos-activos/pedidos-activos').then(m => m.PedidosActivos) },
            { path: 'productos',      loadComponent: () => import('./pages/productos/productos').then(m => m.Productos) },
            { path: 'mesas/activas',  loadComponent: () => import('./pages/mesas/mesas-activas/mesas-activas').then(m => m.MesasActivas) },
            { path: 'mesas/gestion',  loadComponent: () => import('./pages/mesas/gestion-mesas/gestion-mesas').then(m => m.GestionMesas) },
            { path: 'clientes',       loadComponent: () => import('./pages/clientes/clientes/clientes').then(m => m.Clientes) },
            { path: 'clientes/pedidos',        loadComponent: () => import('./pages/clientes/pedidos/pedidos').then(m => m.Pedidos) },
            { path: 'clientes/calificaciones', loadComponent: () => import('./pages/clientes/calificaciones/calificaciones').then(m => m.Calificaciones) },
            { path: 'clientes/pagos',          loadComponent: () => import('./pages/clientes/pagos/pagos').then(m => m.Pagos) },
            { path: 'administracion/reportes',          loadComponent: () => import('./pages/administracion/reportes/reportes').then(m => m.Reportes) },
            { path: 'administracion/logs',          loadComponent: () => import('./pages/administracion/logs/logs').then(m => m.Logs) },
            { path: 'administracion/usuarios',       loadComponent: () => import('./pages/administracion/usuarios/usuarios').then(m => m.Usuarios) }
        ]
    }
];
