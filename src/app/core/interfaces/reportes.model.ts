import { MedioDePago } from './pago.model';
import { PedidoEstado } from './pedido.model';
import { VariacionKpi, calcularVariacion } from './dashboard.model';

export interface PeriodoFiltro {
  from: string; // "YYYY-MM-DD"
  to:   string;
}

export interface DiaSerie {
  fecha:     string; // "YYYY-MM-DD"
  pedidos:   number;
  clientes:  number;
  recaudado: number;
}

export interface KpisReporte {
  recaudado:    number;
  pedidos:      number;
  clientes:     number;
  ticket:       number;
  calificacion: number | null;
}

export interface VariacionesReporte {
  recaudado:  number | null;
  pedidos:    number | null;
  clientes:   number | null;
  ticket:     number | null;
}


export interface TopProductoReporte {
  producto_id: string;
  nombre:      string;
  cantidad:    number;
  total:       number;
  porcentaje:  number;
}

export type PagosReporte = Record<MedioDePago, number>;

export type EstadosPedidoReporte = Record<PedidoEstado, number>;

export interface HoraPicoReporte {
  hora:      number;  // 0-23
  pedidos:   number;
  intensity: number;
}

export interface ReportesResumen {
  periodo:      PeriodoFiltro;
  kpis:         KpisReporte;
  variaciones:  VariacionesReporte;
  serie:        DiaSerie[];
  topProductos: TopProductoReporte[];
  pagos:        PagosReporte;
  estados:      EstadosPedidoReporte;
  horasPico:    HoraPicoReporte[];
}

export interface CalendarioReporte {
  year:  number;
  month: number;
  dias:  DiaSerie[];
  totales: {
    recaudado: number;
    pedidos:   number;
    clientes:  number;
  };
}

// ─── Helpers para el componente ───────────────────────────────────────────────
export function buildVariaciones(
  kpis: KpisReporte,
  variaciones: VariacionesReporte
): {
  recaudado: VariacionKpi;
  pedidos:   VariacionKpi;
  clientes:  VariacionKpi;
  ticket:    VariacionKpi;
} {
  const toKpi = (actual: number, pct: number | null): VariacionKpi => {
    if (pct === null) return { valor: 0, porcentaje: 0, tendencia: 'igual' };
    const anterior = pct !== 0 ? actual / (1 + pct / 100) : actual;
    return calcularVariacion(actual, anterior);
  };

  return {
    recaudado: toKpi(kpis.recaudado, variaciones.recaudado),
    pedidos: toKpi(kpis.pedidos, variaciones.pedidos),
    clientes: toKpi(kpis.clientes, variaciones.clientes),
    ticket: toKpi(kpis.ticket, variaciones.ticket),
  };
}

/**
 * Filtra la serie temporal a un mes/año específico.
 * Útil cuando el calendario usa datos ya cargados en el frontend
 * sin hacer un request extra.
 */
export function filtrarSeriePorMes(
  serie: DiaSerie[],
  year: number,
  month: number
): DiaSerie[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return serie.filter((d) => d.fecha.startsWith(prefix));
}