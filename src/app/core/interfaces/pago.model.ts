export type MedioDePago = 'app' | 'tarjeta' | 'efectivo';

export interface Pago {
  pago_id: string;
  pedido_id: string;
  medio_de_pago: MedioDePago;
  monto: number;
  IVA: number;
  monto_final: number;
  created_at: Date;
  
  // Relaciones (cuando se incluyen)
  pedido?: {
    pedido_id: string;
    numero_pedido: string;
    nombre_cliente: string;
    mesa_id: string;
    precio_total: number;
    estado: string;
    mesa?: {
      numero: number;
    };
  };
}

export interface FiltrosPagos {
  pedido_id?: string;
  medio_de_pago?: MedioDePago | 'todos';
  fecha_desde?: Date;
  fecha_hasta?: Date;
}

export interface StatsPagos {
  total_pagos: number;
  total_recaudado: number;
  total_iva: number;
  por_medio_pago: {
    app: { count: number; total: number };
    tarjeta: { count: number; total: number };
    efectivo: { count: number; total: number };
  };
  promedio_pago: number;
}