import { Calificacion } from './calificacion.model';
import { MedioDePago } from './pago.model';
import { Mesa } from './mesa.model';
import { PedidoEstado } from './pedido.model';

export interface MesaDashboard extends Omit<Mesa, 'sesion' | 'codigo' | 'qr_url'> {
  pedido_activo: {
    numero_pedido: string;
    nombre_cliente: string;
    precio_total: number;
    estado: PedidoEstado;
    created_at: Date;
  } | null;
}

export interface PedidoActivoDashboard {
  pedido_id: string;
  numero_pedido: string;
  nombre_cliente: string;
  mesa_numero: number | null;
  precio_total: number;
  estado: PedidoEstado;
  created_at: Date;
  productos: string[];
}

export interface CalificacionDashboard
  extends Pick<Calificacion, 'nombre_cliente' | 'puntuacion' | 'resena' | 'created_at'> {
  numero_pedido: string;
}

export interface TopProductoDashboard {
  producto_id: string;
  nombre: string;
  cantidad: number;
  total: number;
}

export type ResumenPagosDashboard = Record<MedioDePago, number>;

export interface DashboardResumen {
  // Recaudación
  recaudadoHoy: number;
  recaudadoAyer: number;

  // Pedidos
  totalPedidosHoy: number;
  pedidosAyer: number;

  // Ticket promedio
  ticketPromedioHoy: number;

  // Mesas
  mesas: MesaDashboard[];
  mesasOcupadas: number;
  totalMesas: number;

  // Tiempo real
  pedidosActivos: PedidoActivoDashboard[];

  // Pagos
  resumenPagos: ResumenPagosDashboard;

  // Productos
  topProductos: TopProductoDashboard[];

  // Calificaciones
  calificacionPromedio: number | null;
  totalCalificaciones: number;
  calificacionesRecientes: CalificacionDashboard[];

  // Metadata
  generadoEn: Date;
}

export interface VariacionKpi {
  valor: number;
  porcentaje: number;
  tendencia: 'sube' | 'baja' | 'igual';
}

export interface DailyGoal {
  id: string;
  label: string;
  target: number;
  current: number;
}

export function calcularVariacion(hoy: number, ayer: number): VariacionKpi {
  const diferencia = hoy - ayer;
  const porcentaje = ayer > 0 ? (diferencia / ayer) * 100 : 0;
  return {
    valor: diferencia,
    porcentaje: Number(porcentaje.toFixed(1)),
    tendencia: diferencia > 0 ? 'sube' : diferencia < 0 ? 'baja' : 'igual',
  };
}