export interface Calificacion {
  id: string;
  pedido_id: string;
  puntuacion: number; // 1-5
  resena?: string;
  created_at: Date;
  nombre_cliente: string;
  
  // Relación (cuando se incluye)
  pedido?: {
    pedido_id: string;
    numero_pedido: string;
    precio_total: number;
    mesa_id: string;
    mesa?: {
      numero: number;
    };
  };
}

export interface FiltrosCalificaciones {
  pedido_id?: string;
  fecha_desde?: Date;
  fecha_hasta?: Date;
  search?: string; // Busca por nombre_cliente o pedido_id
  puntuacion?: number; // Filtrar por estrellas específicas
}

export interface StatsCalificaciones {
  total_calificaciones: number;
  promedio_puntuacion: number;
  por_puntuacion: {
    cinco: number;
    cuatro: number;
    tres: number;
    dos: number;
    uno: number;
  };
  con_resena: number;
  sin_resena: number;
}