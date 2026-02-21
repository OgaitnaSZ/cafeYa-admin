export interface Mesa {
  mesa_id: string;
  numero: number;
  codigo: string; 
  qr_url: string;
  estado: 'Disponible' | 'Ocupada';
  // Datos de sesión activa (si está ocupada)
  sesion?: {
    cliente_nombre?: string;
    hora_inicio?: Date;
    total_actual?: number;
    pedidos_count?: number;
  };
}