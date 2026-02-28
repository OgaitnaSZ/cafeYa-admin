import {
  Component, signal, computed, inject, effect, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  TrendingUp, TrendingDown, ShoppingBag, Users, Star,
  CreditCard, Banknote, Smartphone, ArrowLeft,
  BarChart2, Calendar, Package, Clock, ChevronLeft, ChevronRight,
  Activity, AlertCircle, RefreshCw,
} from 'lucide-angular';
import { ReportesService } from '../../../core/services/reportes';
import { TopProductoReporte, HoraPicoReporte } from '../../../core/interfaces/reportes.model';
import { of } from 'rxjs';

// Tipos internos
type RangoPreset    = '7d' | '30d' | '90d' | 'custom';
type ChartMetric    = 'recaudado' | 'pedidos' | 'clientes';
type CalendarMetric = 'recaudado' | 'pedidos' | 'clientes';

interface DayData {
  date:      Date;
  recaudado: number;
  pedidos:   number;
  clientes:  number;
}

interface ChartPoint {
  label: string;
  value: number;
  date:  Date;
}

interface EstadoCount {
  estado:  string;
  count:   number;
  bgColor: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reportes.html',
})
export class Reportes {
  // Servicios
  readonly rs = inject(ReportesService);

  // Alias directo para el template
  loading = this.rs.loading;
  loadingCalendario = this.rs.loadingCalendario;

  // Filtros
  rangoPreset = signal<RangoPreset>('7d');
  customFrom  = signal<string>(this.toInputDate(this.daysAgo(30)));
  customTo    = signal<string>(this.toInputDate(new Date()));

  private presetDays: Record<Exclude<RangoPreset, 'custom'>, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90
  };

  // Chart / Calendar UI state
  chartMetric = signal<ChartMetric>('recaudado');
  calMetric = signal<CalendarMetric>('recaudado');
  calMonth = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  hoveredPoint = signal<ChartPoint | null>(null);
  hoveredIndex = signal<number>(-1);
  hoveredCalDay = signal<{ date: Date; value: number } | null>(null);

  // Effect: recarga al cambiar filtro
  constructor() {
    effect(() => {
      const { from, to } = this.getFromTo();
      this.rs.cargarResumen(from, to);
    });
  }

  // AllData: serie del período convertida a DayData
  private readonly allData = computed<DayData[]>(() =>
    (this.rs.resumen()?.serie ?? []).map(d => ({
      date: this.parseFecha(d.fecha),
      pedidos: d.pedidos,
      clientes: d.clientes,
      recaudado: d.recaudado,
    }))
  );

  // CalendarMonthData: datos del mes visible en el calendario
  private calendarMonthData = computed<DayData[]>(() => {
    const m = this.calMonth();
    const y = m.getFullYear();
    const mo = m.getMonth();

    const fromAllData = this.allData().filter(
      d => d.date.getFullYear() === y && d.date.getMonth() === mo
    );
    if (fromAllData.length > 0) return fromAllData;

    const cal = this.rs.calendario();
    if (cal && cal.year === y && cal.month === mo + 1) {
      return cal.dias.map(d => ({
        date: this.parseFecha(d.fecha),
        pedidos: d.pedidos,
        clientes: d.clientes,
        recaudado: d.recaudado,
      }));
    }
    return [];
  });

  // Período filtrado (para el gráfico de línea)
  periodoData = computed<DayData[]>(() => {
    const { from, to } = this.getRange();
    return this.allData().filter(d => d.date >= from && d.date <= to);
  });

  // KPIs (del backend)
  kpiRecaudado = computed(() => this.rs.resumen()?.kpis.recaudado ?? 0);
  kpiPedidos = computed(() => this.rs.resumen()?.kpis.pedidos ?? 0);
  kpiClientes = computed(() => this.rs.resumen()?.kpis.clientes ?? 0);
  kpiTicket = computed(() => this.rs.resumen()?.kpis.ticket ?? 0);
  kpiCalif = computed(() => this.rs.resumen()?.kpis.calificacion ?? null);

  // Variaciones (del backend, null = sin datos previos)
  kpiRecaudadoVar = computed(() => this.rs.resumen()?.variaciones.recaudado ?? null);
  kpiPedidosVar = computed(() => this.rs.resumen()?.variaciones.pedidos ?? null);
  kpiClientesVar = computed(() => this.rs.resumen()?.variaciones.clientes ?? null);
  kpiTicketVar = computed(() => this.rs.resumen()?.variaciones.ticket ?? null);

  // Chart SVG
  chartPoints = computed<ChartPoint[]>(() => {
    const metric = this.chartMetric();
    return this.periodoData().map(d => ({
      label: this.shortDate(d.date),
      value: d[metric],
      date:  d.date,
    }));
  });

  chartMax = computed(() => Math.max(...this.chartPoints().map(p => p.value), 1));
  chartMin = computed(() => Math.min(...this.chartPoints().map(p => p.value)));

  svgPolyline = computed(() => {
    const pts = this.chartPoints();
    if (pts.length < 2) return '';
    const W = 800, H = 200, PAD = 10;
    const max = this.chartMax(), min = this.chartMin();
    const range = max - min || 1;
    return pts.map((p, i) => {
      const x = PAD + (i / (pts.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((p.value - min) / range) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });

  svgArea = computed(() => {
    const pts = this.chartPoints();
    if (pts.length < 2) return '';
    const W = 800, H = 200, PAD = 10;
    const max = this.chartMax(), min = this.chartMin();
    const range = max - min || 1;
    const line = pts.map((p, i) => {
      const x = PAD + (i / (pts.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((p.value - min) / range) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `${PAD},${H - PAD} ${line} ${W - PAD},${H - PAD}`;
  });

  chartLabelStep = computed(() => Math.ceil(this.chartPoints().length / 6));

  // Calendario heatmap
  calendarWeeks = computed(() => {
    const month = this.calMonth();
    const metric = this.calMetric();
    const y = month.getFullYear();
    const mo = month.getMonth();

    const firstDay = new Date(y, mo, 1);
    const lastDay  = new Date(y, mo + 1, 0);
    const monthData = this.calendarMonthData();
    const maxVal = Math.max(...monthData.map(d => d[metric]), 1);

    const weeks: ({ date: Date; value: number; intensity: number } | null)[][] = [];
    let week: ({ date: Date; value: number; intensity: number } | null)[] = [];

    const startDow = (firstDay.getDay() + 6) % 7; // lunes = 0
    for (let i = 0; i < startDow; i++) week.push(null);

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const cur = new Date(d);
      const dataPoint = monthData.find(
        x => x.date.getDate() === cur.getDate()
      );
      const value     = dataPoint ? dataPoint[metric] : 0;
      const intensity = value / maxVal;
      week.push({ date: cur, value, intensity });

      if (week.length === 7) { weeks.push([...week]); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  });

  calendarMonthTotal = computed(() => {
    const metric = this.calMetric();
    return this.calendarMonthData().reduce((acc, d) => acc + d[metric], 0);
  });

  calMonthLabel = computed(() =>
    this.calMonth().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  );

  // Top productos
  topProductos = computed<TopProductoReporte[]>(() =>
    this.rs.resumen()?.topProductos ?? []
  );

  // Pagos 
  pagoEfectivo = computed(() => this.rs.resumen()?.pagos.efectivo ?? 0);
  pagoTarjeta = computed(() => this.rs.resumen()?.pagos.tarjeta ?? 0);
  pagoApp = computed(() => this.rs.resumen()?.pagos.app ?? 0);

  // Pedidos por estado
  estadosPedido = computed<EstadoCount[]>(() => {
    const e = this.rs.resumen()?.estados;
    if (!e) return [];
    return [
      { estado: 'Entregados', count: e.Entregado, bgColor: 'bg-green-500' },
      { estado: 'En preparación', count: e.En_preparacion, bgColor: 'bg-blue-500' },
      { estado: 'Pendientes', count: e.Pendiente, bgColor: 'bg-amber-500' },
      { estado: 'Cancelados', count: e.Cancelado, bgColor: 'bg-red-400' },
    ];
  });

  estadoMaxCount = computed(() =>
    Math.max(...this.estadosPedido().map(e => e.count), 1)
  );

  tasaEntrega = computed(() => {
    const total = this.kpiPedidos();
    const e = this.rs.resumen()?.estados;
    if (!e || total === 0) return 0;
    return Math.round((e.Entregado / total) * 100);
  });

  // Horas pico
  horasPico = computed<HoraPicoReporte[]>(() =>
    this.rs.resumen()?.horasPico ?? []
  );

  horasPicoPromedio = computed(() => {
    const horas = this.horasPico();
    if (!horas.length) return 0;
    return Math.round(horas.reduce((a, h) => a + h.pedidos, 0) / horas.length);
  });

  horaPicoLabel = computed(() => {
    const horas = this.horasPico();
    if (!horas.length) return '--';
    const max = horas.reduce((a, b) => (b.pedidos > a.pedidos ? b : a));
    return `${max.hora}h – ${max.hora + 1}h`;
  });

  // Helpers
  parseFecha(fecha: string): Date {
    const [y, m, d] = fecha.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  getFromTo(): { from: string; to: string } {
    const preset = this.rangoPreset();
    if (preset === 'custom') {
      return { from: this.customFrom(), to: this.customTo() };
    }
    const days = preset === '7d' ? 6 : preset === '30d' ? 29 : 89;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    };
  }

  /** Devuelve el rango como objetos Date (para filtrar periodoData) */
  getRange(): { from: Date; to: Date } {
    const { from, to } = this.getFromTo();
    return {
      from: new Date(from + 'T00:00:00'),
      to: new Date(to + 'T23:59:59'),
    };
  }

  setPreset(preset: RangoPreset) {
    this.rangoPreset.set(preset);

    if (preset !== 'custom') {
      const today = new Date();
      const from = this.daysAgo(this.presetDays[preset]);

      this.customFrom.set(this.toInputDate(from));
      this.customTo.set(this.toInputDate(today));
    }
  }

  prevMonth() {
    const m = this.calMonth();
    const prev = new Date(m.getFullYear(), m.getMonth() - 1, 1);
    this.calMonth.set(prev);
    this.loadCalendarIfNeeded(prev);
  }

  nextMonth() {
    const m = this.calMonth();
    const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    if (next <= new Date()) {
      this.calMonth.set(next);
      this.loadCalendarIfNeeded(next);
    }
  }

  canGoNext(): boolean {
    const next = new Date(this.calMonth().getFullYear(), this.calMonth().getMonth() + 1, 1);
    return next <= new Date();
  }

  private loadCalendarIfNeeded(month: Date) {
    const y = month.getFullYear();
    const mo = month.getMonth();
    const hasData = this.allData().some(
      d => d.date.getFullYear() === y && d.date.getMonth() === mo
    );
    if (!hasData) {
      this.rs.cargarCalendario(y, mo + 1);
    }
  }

  // Chart hover
  onChartHover(event: MouseEvent, container: HTMLElement) {
    const pts = this.chartPoints();
    if (!pts.length) return;
    const rect = container.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    const idx = Math.min(Math.round(xRatio * (pts.length - 1)), pts.length - 1);
    this.hoveredIndex.set(idx);
    this.hoveredPoint.set(pts[Math.max(0, idx)]);
  }

  onChartLeave() {
    this.hoveredIndex.set(-1);
    this.hoveredPoint.set(null);
  }

  getHoverX(idx: number): number {
    const pts = this.chartPoints();
    if (!pts.length) return 0;
    return 10 + (idx / (pts.length - 1)) * 780;
  }

  getHoverY(idx: number): number {
    const pts = this.chartPoints();
    if (!pts.length) return 0;
    const H = 200, PAD = 10;
    const max = this.chartMax(), min = this.chartMin();
    const range = max - min || 1;
    return H - PAD - ((pts[idx].value - min) / range) * (H - PAD * 2);
  }

  // Typed setters
  setChartMetric(m: string) { this.chartMetric.set(m as ChartMetric); }
  setCalMetric(m: string) { this.calMetric.set(m as CalendarMetric); }

  // Formatters
  formatPrice(v: number): string {
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000)     return '$' + (v / 1_000).toFixed(1) + 'K';
    return '$' + v.toLocaleString('es-AR');
  }

  formatPriceFull(v: number): string {
    return '$' + Math.round(v).toLocaleString('es-AR', { minimumFractionDigits: 0 });
  }

  formatVar(v: number | null): string {
    if (v === null) return 'N/A';
    return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  }

  formatChartVal(v: number): string {
    return this.chartMetric() === 'recaudado' ? this.formatPrice(v) : v.toString();
  }

  shortDate(d: Date): string {
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  isToday(date: Date): boolean {
    const t = new Date();
    return date.getDate() === t.getDate()
      && date.getMonth() === t.getMonth()
      && date.getFullYear() === t.getFullYear();
  }

  getPagosPct(val: number): number {
    const total = this.pagoEfectivo() + this.pagoTarjeta() + this.pagoApp();
    return total > 0 ? Math.round((val / total) * 100) : 0;
  }

  getIntensityClass(intensity: number): string {
    const palettes: Record<CalendarMetric, string[]> = {
      recaudado: ['bg-orange-50','bg-orange-100','bg-orange-200','bg-orange-300','bg-orange-400','bg-orange-500','bg-orange-600'],
      pedidos: ['bg-blue-50',  'bg-blue-100',  'bg-blue-200',  'bg-blue-300',  'bg-blue-400',  'bg-blue-500',  'bg-blue-600'],
      clientes: ['bg-green-50', 'bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-green-600'],
    };
    const p = palettes[this.calMetric()];
    const idx = Math.min(Math.floor(intensity * (p.length - 1)), p.length - 1);
    return p[intensity === 0 ? 0 : idx];
  }

  calMetricLabel(): string {
    return { recaudado: 'Recaudado', pedidos: 'Pedidos', clientes: 'Clientes' }[this.calMetric()];
  }

  chartColor(): string { return { recaudado: '#f97316', pedidos: '#3b82f6', clientes: '#22c55e' }[this.chartMetric()]; }
  chartColorLight(): string { return { recaudado: '#fff7ed', pedidos: '#eff6ff', clientes: '#f0fdf4' }[this.chartMetric()]; }

  varPositiva(v: number | null): boolean { return v !== null && v >= 0; }
  varNegativa(v: number | null): boolean { return v !== null && v < 0; }

  // Misc 
  readonly DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  private daysAgo(n: number): Date {
    const d = new Date(); d.setDate(d.getDate() - n); return d;
  }

  private toInputDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly ShoppingBag = ShoppingBag;
  readonly Users = Users;
  readonly Star = Star;
  readonly CreditCard   = CreditCard;
  readonly Banknote = Banknote;
  readonly Smartphone = Smartphone;
  readonly ArrowLeft = ArrowLeft;
  readonly BarChart2 = BarChart2;
  readonly Calendar = Calendar;
  readonly Package = Package;
  readonly Clock = Clock;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Activity = Activity;
  readonly AlertCircle = AlertCircle;
  readonly RefreshCw = RefreshCw;
}