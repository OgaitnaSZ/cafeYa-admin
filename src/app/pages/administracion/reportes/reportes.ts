import {
  Component, signal, computed, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  TrendingUp, TrendingDown, ShoppingBag, Users, Star,
  CreditCard, Banknote, Smartphone, ArrowLeft,
  BarChart2, Calendar, Package, Clock, ChevronLeft, ChevronRight,
  Activity
} from 'lucide-angular';

// ─── Types ────────────────────────────────────────────────────────────────────

type RangoPreset = '7d' | '30d' | '90d' | 'custom';
type ChartMetric = 'recaudado' | 'pedidos' | 'clientes';
type CalendarMetric = 'recaudado' | 'pedidos' | 'clientes';

interface DayData {
  date: Date;
  recaudado: number;
  pedidos: number;
  clientes: number;
}

interface ChartPoint {
  label: string;
  value: number;
  date: Date;
}

interface TopProducto {
  nombre: string;
  cantidad: number;
  total: number;
  emoji: string;
  porcentaje: number;
}

interface PedidoEstadoCount {
  estado: string;
  count: number;
  color: string;
  bgColor: string;
}

interface HoraPico {
  hora: string;
  pedidos: number;
  intensity: number;
}

// ─── Mock data generator ──────────────────────────────────────────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDayData(date: Date, seed: number): Omit<DayData, 'date'> {
  const dow = date.getDay(); // 0=Dom, 6=Sab
  const isWeekend = dow === 0 || dow === 6;
  const base = isWeekend ? 1.4 : 1;
  const noise = seededRandom(seed) * 0.4 + 0.8;
  const pedidos = Math.round(28 * base * noise);
  const clientes = Math.round(pedidos * (seededRandom(seed + 1) * 0.3 + 0.7));
  const ticketProm = 1400 + seededRandom(seed + 2) * 600;
  return {
    pedidos,
    clientes,
    recaudado: Math.round(pedidos * ticketProm),
  };
}

function generateHistory(days: number): DayData[] {
  const result: DayData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    result.push({ date: d, ...generateDayData(d, seed) });
  }
  return result;
}

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes {

  // Icons
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly ShoppingBag = ShoppingBag;
  readonly Users = Users;
  readonly Star = Star;
  readonly CreditCard = CreditCard;
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

  // ── Filters ────────────────────────────────────────────────────────────────
  rangoPreset = signal<RangoPreset>('7d');
  customFrom = signal<string>(this.toInputDate(this.daysAgo(30)));
  customTo   = signal<string>(this.toInputDate(new Date()));

  // ── Chart ──────────────────────────────────────────────────────────────────
  chartMetric = signal<ChartMetric>('recaudado');

  // ── Calendar ───────────────────────────────────────────────────────────────
  calMetric   = signal<CalendarMetric>('recaudado');
  calMonth    = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  // ── Raw data (90 días para tener siempre suficiente historia) ──────────────
  private readonly allData = signal<DayData[]>(generateHistory(120));

  // ── Derived: datos del período actual ─────────────────────────────────────
  periodoData = computed<DayData[]>(() => {
    const { from, to } = this.getRange();
    return this.allData().filter(d => d.date >= from && d.date <= to);
  });

  // ── Datos del período anterior (para comparar) ────────────────────────────
  periodoAnteriorData = computed<DayData[]>(() => {
    const { from, to } = this.getRange();
    const diff = to.getTime() - from.getTime();
    const prevTo   = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - diff);
    return this.allData().filter(d => d.date >= prevFrom && d.date <= prevTo);
  });

  // ── KPIs ───────────────────────────────────────────────────────────────────
  kpiRecaudado = computed(() => this.sum(this.periodoData(), 'recaudado'));
  kpiPedidos   = computed(() => this.sum(this.periodoData(), 'pedidos'));
  kpiClientes  = computed(() => this.sum(this.periodoData(), 'clientes'));
  kpiTicket    = computed(() => {
    const p = this.kpiPedidos();
    return p > 0 ? this.kpiRecaudado() / p : 0;
  });
  kpiCalif     = computed(() => {
    // Mock: promedio estable entre 4.2 y 4.9
    const days = this.periodoData().length;
    const seed = days * 137;
    return Math.round((4.2 + seededRandom(seed) * 0.7) * 10) / 10;
  });

  kpiRecaudadoVar = computed(() => this.variacion('recaudado'));
  kpiPedidosVar   = computed(() => this.variacion('pedidos'));
  kpiClientesVar  = computed(() => this.variacion('clientes'));
  kpiTicketVar    = computed(() => {
    const curr = this.kpiRecaudado() / Math.max(1, this.kpiPedidos());
    const prev = this.sumPrev('recaudado') / Math.max(1, this.sumPrev('pedidos'));
    return prev > 0 ? ((curr - prev) / prev) * 100 : 0;
  });

  // ── Chart points ───────────────────────────────────────────────────────────
  chartPoints = computed<ChartPoint[]>(() => {
    const metric = this.chartMetric();
    return this.periodoData().map(d => ({
      label: this.shortDate(d.date),
      value: d[metric],
      date: d.date,
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
    const firstX = PAD;
    const lastX  = (W - PAD).toFixed(1);
    return `${firstX},${H - PAD} ${line} ${lastX},${H - PAD}`;
  });

  hoveredPoint = signal<ChartPoint | null>(null);
  hoveredIndex = signal<number>(-1);

  // ── Calendar heatmap ───────────────────────────────────────────────────────
  calendarWeeks = computed(() => {
    const month  = this.calMonth();
    const metric = this.calMetric();
    const year   = month.getFullYear();
    const mon    = month.getMonth();

    const firstDay = new Date(year, mon, 1);
    const lastDay  = new Date(year, mon + 1, 0);

    // Max del mes para normalizar intensidad
    const monthData = this.allData().filter(d =>
      d.date.getFullYear() === year && d.date.getMonth() === mon
    );
    const maxVal = Math.max(...monthData.map(d => d[metric]), 1);

    // Construir grilla semanas
    const weeks: ({ date: Date; value: number; intensity: number; isCurrentMonth: boolean } | null)[][] = [];
    let week: ({ date: Date; value: number; intensity: number; isCurrentMonth: boolean } | null)[] = [];

    // Padding inicio (lunes=0)
    const startDow = (firstDay.getDay() + 6) % 7; // 0=Lunes
    for (let i = 0; i < startDow; i++) week.push(null);

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const cur = new Date(d);
      const dataPoint = this.allData().find(x =>
        x.date.getFullYear() === cur.getFullYear() &&
        x.date.getMonth() === cur.getMonth() &&
        x.date.getDate() === cur.getDate()
      );
      const value = dataPoint ? dataPoint[metric] : 0;
      const intensity = value / maxVal;
      week.push({ date: cur, value, intensity, isCurrentMonth: true });

      if (week.length === 7) {
        weeks.push([...week]);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  });

  calendarMaxVal = computed(() => {
    const metric = this.calMetric();
    const month  = this.calMonth();
    const monthData = this.allData().filter(d =>
      d.date.getFullYear() === month.getFullYear() && d.date.getMonth() === month.getMonth()
    );
    return Math.max(...monthData.map(d => d[metric]), 1);
  });

  calendarMonthTotal = computed(() => {
    const metric = this.calMetric();
    const month  = this.calMonth();
    return this.allData()
      .filter(d => d.date.getFullYear() === month.getFullYear() && d.date.getMonth() === month.getMonth())
      .reduce((acc, d) => acc + d[metric], 0);
  });

  hoveredCalDay = signal<{ date: Date; value: number } | null>(null);

  // ── Top productos (mock fijo escalado al período) ──────────────────────────
  topProductos = computed<TopProducto[]>(() => {
    const multiplier = this.periodoData().length / 7;
    const base: TopProducto[] = [
      { nombre: 'Cappuccino', emoji: '☕', cantidad: Math.round(38 * multiplier), total: Math.round(22800 * multiplier), porcentaje: 28 },
      { nombre: 'Medialunas x3', emoji: '🥐', cantidad: Math.round(29 * multiplier), total: Math.round(11600 * multiplier), porcentaje: 21 },
      { nombre: 'Tostado mixto', emoji: '🥪', cantidad: Math.round(22 * multiplier), total: Math.round(13200 * multiplier), porcentaje: 16 },
      { nombre: 'Smoothie mango', emoji: '🥭', cantidad: Math.round(18 * multiplier), total: Math.round(12600 * multiplier), porcentaje: 13 },
      { nombre: 'Café con leche', emoji: '🍵', cantidad: Math.round(17 * multiplier), total: Math.round(8500 * multiplier), porcentaje: 12 },
    ];
    const maxCant = Math.max(...base.map(p => p.cantidad));
    return base.map(p => ({ ...p, porcentaje: Math.round((p.cantidad / maxCant) * 100) }));
  });

  // ── Medios de pago ─────────────────────────────────────────────────────────
  pagoEfectivo = computed(() => Math.round(this.kpiRecaudado() * 0.38));
  pagoTarjeta  = computed(() => Math.round(this.kpiRecaudado() * 0.46));
  pagoApp      = computed(() => Math.round(this.kpiRecaudado() * 0.16));

  // ── Pedidos por estado ─────────────────────────────────────────────────────
  estadosPedido = computed<PedidoEstadoCount[]>(() => {
    const total = this.kpiPedidos();
    return [
      { estado: 'Entregados', count: Math.round(total * 0.72), color: 'text-green-700', bgColor: 'bg-green-500' },
      { estado: 'En preparación', count: Math.round(total * 0.15), color: 'text-blue-700', bgColor: 'bg-blue-500' },
      { estado: 'Pendientes', count: Math.round(total * 0.09), color: 'text-amber-700', bgColor: 'bg-amber-500' },
      { estado: 'Cancelados', count: Math.round(total * 0.04), color: 'text-red-700', bgColor: 'bg-red-400' },
    ];
  });

  estadoMaxCount = computed(() => Math.max(...this.estadosPedido().map(e => e.count), 1));

  // ── Horas pico ─────────────────────────────────────────────────────────────
  horasPico: HoraPico[] = [
    { hora: '7h', pedidos: 8, intensity: 0.15 },
    { hora: '8h', pedidos: 22, intensity: 0.42 },
    { hora: '9h', pedidos: 48, intensity: 0.91 },
    { hora: '10h', pedidos: 52, intensity: 1 },
    { hora: '11h', pedidos: 38, intensity: 0.73 },
    { hora: '12h', pedidos: 44, intensity: 0.85 },
    { hora: '13h', pedidos: 35, intensity: 0.67 },
    { hora: '14h', pedidos: 18, intensity: 0.35 },
    { hora: '15h', pedidos: 12, intensity: 0.23 },
    { hora: '16h', pedidos: 20, intensity: 0.38 },
    { hora: '17h', pedidos: 30, intensity: 0.58 },
    { hora: '18h', pedidos: 25, intensity: 0.48 },
    { hora: '19h', pedidos: 14, intensity: 0.27 },
    { hora: '20h', pedidos: 6, intensity: 0.12 },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    // TODO: reemplazar con servicio real
    // this.reportesService.getHistory(120).subscribe(data => this.allData.set(data));
  }

  // ── Range helpers ──────────────────────────────────────────────────────────
  getRange(): { from: Date; to: Date } {
    const preset = this.rangoPreset();
    const to   = new Date(); to.setHours(23, 59, 59, 999);
    const from = new Date(); from.setHours(0, 0, 0, 0);

    if (preset === '7d')  { from.setDate(from.getDate() - 6); return { from, to }; }
    if (preset === '30d') { from.setDate(from.getDate() - 29); return { from, to }; }
    if (preset === '90d') { from.setDate(from.getDate() - 89); return { from, to }; }

    // custom
    return {
      from: new Date(this.customFrom() + 'T00:00:00'),
      to:   new Date(this.customTo()   + 'T23:59:59'),
    };
  }

  setPreset(p: RangoPreset) { this.rangoPreset.set(p); }

  // ── Calendar nav ───────────────────────────────────────────────────────────
  prevMonth() {
    const m = this.calMonth();
    this.calMonth.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }
  nextMonth() {
    const m = this.calMonth();
    const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    if (next <= new Date()) this.calMonth.set(next);
  }
  canGoNext(): boolean {
    const next = new Date(this.calMonth().getFullYear(), this.calMonth().getMonth() + 1, 1);
    return next <= new Date();
  }

  // ── Chart hover ────────────────────────────────────────────────────────────
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
    const p = pts[idx];
    const H = 200, PAD = 10;
    const max = this.chartMax(), min = this.chartMin();
    const range = max - min || 1;
    return H - PAD - ((p.value - min) / range) * (H - PAD * 2);
  }

  // ── Formatters ─────────────────────────────────────────────────────────────
  formatPrice(v: number): string {
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000)     return '$' + (v / 1_000).toFixed(1) + 'K';
    return '$' + v.toLocaleString('es-AR');
  }

  formatPriceFull(v: number): string {
    return '$' + Math.round(v).toLocaleString('es-AR', { minimumFractionDigits: 0 });
  }

  formatVar(v: number): string {
    return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  }

  shortDate(d: Date): string {
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  calMonthLabel = computed(() =>
    this.calMonth().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  );

  getIntensityClass(intensity: number): string {
    const metric = this.calMetric();
    const palettes: Record<CalendarMetric, string[]> = {
      recaudado: ['bg-orange-50', 'bg-orange-100', 'bg-orange-200', 'bg-orange-300', 'bg-orange-400', 'bg-orange-500', 'bg-orange-600'],
      pedidos:   ['bg-blue-50',   'bg-blue-100',   'bg-blue-200',   'bg-blue-300',   'bg-blue-400',   'bg-blue-500',   'bg-blue-600'],
      clientes:  ['bg-green-50',  'bg-green-100',  'bg-green-200',  'bg-green-300',  'bg-green-400',  'bg-green-500',  'bg-green-600'],
    };
    const p = palettes[metric];
    const idx = Math.min(Math.floor(intensity * (p.length - 1)), p.length - 1);
    return p[intensity === 0 ? 0 : idx];
  }

  calMetricLabel(): string {
    return { recaudado: 'Recaudado', pedidos: 'Pedidos', clientes: 'Clientes' }[this.calMetric()];
  }

  chartMetricLabel(): string {
    return { recaudado: 'Recaudado', pedidos: 'Pedidos', clientes: 'Clientes nuevos' }[this.chartMetric()];
  }

  chartColor(): string {
    return { recaudado: '#f97316', pedidos: '#3b82f6', clientes: '#22c55e' }[this.chartMetric()];
  }

  chartColorLight(): string {
    return { recaudado: '#fff7ed', pedidos: '#eff6ff', clientes: '#f0fdf4' }[this.chartMetric()];
  }

  formatChartVal(v: number): string {
    const m = this.chartMetric();
    if (m === 'recaudado') return this.formatPrice(v);
    return v.toString();
  }

  isToday(date: Date): boolean {
    const t = new Date();
    return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
  }

  // ── KPI helpers ────────────────────────────────────────────────────────────
  private sum(data: DayData[], key: keyof Omit<DayData, 'date'>): number {
    return data.reduce((acc, d) => acc + d[key], 0);
  }
  private sumPrev(key: keyof Omit<DayData, 'date'>): number {
    return this.sum(this.periodoAnteriorData(), key);
  }
  private variacion(key: keyof Omit<DayData, 'date'>): number {
    const curr = this.sum(this.periodoData(), key);
    const prev = this.sumPrev(key);
    return prev > 0 ? ((curr - prev) / prev) * 100 : 0;
  }

  private daysAgo(n: number): Date {
    const d = new Date(); d.setDate(d.getDate() - n); return d;
  }
  private toInputDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  readonly DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  getPagosPct(val: number): number {
    const total = this.pagoEfectivo() + this.pagoTarjeta() + this.pagoApp();
    return total > 0 ? Math.round((val / total) * 100) : 0;
  }
}
