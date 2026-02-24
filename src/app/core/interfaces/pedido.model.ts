export interface Pedido {
  pedido_id: string;
  numero_pedido: string; // "0224-1", "0224-2", etc
  cliente_id: string;
  nombre_cliente: string;
  mesa_id: string;
  nota?: string;
  precio_total: number;
  estado: PedidoEstado;
  created_at: Date;
  pedido_padre?: string;
  
  // Relaciones (cuando se incluyen)
  mesa?: {
    mesa_id: string;
    numero: number;
  };
  cliente?: {
    cliente_id: string;
    nombre: string;
    email?: string;
  };
  productos: PedidoProducto[];
  
  // Agregados
  _count?: {
    productos: number;
  };
}

export type PedidoEstado = 'Pendiente' | 'EnPreparacion' | 'Listo' | 'Entregado' | 'Cancelado';

export interface PedidoProducto {
  pedido_producto_id: number;
  pedido_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  
  // Relación
  producto?: {
    producto_id: string;
    nombre: string;
    descripcion: string;
    imagen_url?: string;
    categoria_id: number;
  };
}

export interface FiltrosPedidos {
  cliente_id?: string;
  mesa_id?: string;
  estado?: PedidoEstado | 'todos';
  fecha_desde?: Date;
  fecha_hasta?: Date;
  search?: string; // Busca por numero_pedido o nombre_cliente
}

export interface StatsPedidos {
  total_pedidos: number;
  pendientes: number;
  en_preparacion: number;
  listos: number;
  entregados: number;
  cancelados: number;
  total_recaudado: number;
  promedio_pedido: number;
}