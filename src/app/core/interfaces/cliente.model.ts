export interface Cliente {
  cliente_id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  duracion_minutos?: number;
  created_at: Date;
  
  // Stats calculadas (del backend)
  _count?: {
    pedidos: number;
  };
  total_gastado?: number;
  ultimo_pedido?: Date;
}