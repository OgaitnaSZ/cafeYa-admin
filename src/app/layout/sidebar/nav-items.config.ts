import {
  LayoutDashboard, ChefHat, Package, Armchair,
  CheckCircle, Settings, Users, ClipboardList,
  Star, CreditCard, Settings2, BarChart2,
  AlertTriangle, User, LucideIconData,
  LayoutGrid,
} from 'lucide-angular';
 
export interface NavItem {
  id: string;
  label: string;
  icon: LucideIconData;
  route?: string;
  roles: string[];
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',      label: 'Dashboard',       icon: LayoutDashboard,  route: '/dashboard', roles: ['admin', 'encargado'] },
  { id: 'pedidos-activos',         label: 'Pedidos Activos',  icon: ChefHat,          route: '/pedidos-activos',    roles: ['admin', 'encargado', 'cocina'] },
  {
    id: 'productos', label: 'Productos', icon: Armchair, roles: ['admin', 'encargado'],
    children: [
      { id: 'productos',  label: 'Productos',    icon: Package, route: '/productos/productos',  roles: ['admin', 'encargado'] },
      { id: 'categorias',  label: 'Categorias',    icon: LayoutGrid, route: '/productos/categorias',  roles: ['admin', 'encargado'] },
    ]
  },
  {
    id: 'mesas', label: 'Mesas', icon: Armchair, roles: ['admin', 'encargado'],
    children: [
      { id: 'mesas-activas',  label: 'Mesas Activas',    icon: CheckCircle, route: '/mesas/activas',  roles: ['admin', 'encargado'] },
      { id: 'mesas-gestion',  label: 'Gestión de Mesas', icon: Settings,    route: '/mesas/gestion',  roles: ['admin', 'encargado'] },
    ]
  },
  {
    id: 'clientes', label: 'Clientes', icon: Users, roles: ['admin'],
    children: [
      { id: 'clientes-lista',          label: 'Clientes',       icon: Users,         route: '/clientes',                  roles: ['admin'] },
      { id: 'clientes-pedidos',        label: 'Pedidos',        icon: ClipboardList, route: '/clientes/pedidos',          roles: ['admin'] },
      { id: 'clientes-calificaciones', label: 'Calificaciones', icon: Star,          route: '/clientes/calificaciones',   roles: ['admin'] },
      { id: 'clientes-pagos',          label: 'Pagos',          icon: CreditCard,    route: '/clientes/pagos',            roles: ['admin'] },
    ]
  },
  {
    id: 'administracion', label: 'Administración', icon: Settings2, roles: ['admin'],
    children: [
      { id: 'admin-reportes',  label: 'Reportes e Informes', icon: BarChart2,      route: 'administracion/reportes', roles: ['admin'] },
      { id: 'admin-errorlog',  label: 'Error Log',           icon: AlertTriangle,  route: 'administracion/logs',     roles: ['admin'] },
      { id: 'admin-usuarios',  label: 'Usuarios',            icon: User,           route: 'administracion/usuarios', roles: ['admin'] },
    ]
  },
];

export const ROL_CONFIG = {
  admin:     { label: 'Admin',     bg: 'bg-red-100',    text: 'text-red-700' },
  encargado: { label: 'Encargado', bg: 'bg-orange-100', text: 'text-orange-700' },
  cocina:    { label: 'Cocina',    bg: 'bg-blue-100',   text: 'text-blue-700' },
};
