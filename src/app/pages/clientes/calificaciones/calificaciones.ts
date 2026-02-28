import { Component, signal, inject, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Calificacion, FiltrosCalificaciones } from '../../../core/interfaces/calificacion.model';
import { CalificacionService } from '../../../core/services/calificacion';
import { 
  LucideAngularModule, 
  Filter,
  X,
  Star,
  MessageSquare,
  Receipt,
  Search,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  User
} from 'lucide-angular';

@Component({
  selector: 'app-calificaciones',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './calificaciones.html',
  styleUrl: './calificaciones.css',
})
export class Calificaciones {
  private calificacionService = inject(CalificacionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Data
  calificaciones = this.calificacionService.calificaciones;
  loading = this.calificacionService.loading;
  loadingLista = this.calificacionService.loadingLista;
  error = this.calificacionService.error;
  success = this.calificacionService.success;

  // Stats
  totalCalificaciones = this.calificacionService.totalCalificaciones;
  promedioGeneral = this.calificacionService.promedioGeneral;
  calificacionesPorPuntuacion = this.calificacionService.calificacionesPorPuntuacion;
  conResena = this.calificacionService.conResena;

  // Filtros
  filtrosActivos = this.calificacionService.filtrosActivos;
  tieneFiltros = this.calificacionService.tieneFiltros;
  
  filtroPedidoId = signal<string | null>(null);
  filtroPuntuacion = signal<number | null>(null);
  searchTerm = signal('');

  // Info adicional para breadcrumbs
  numeroPedidoFiltrado = signal<string>('');

  ngOnInit() {
    // Leer queryParams y aplicar filtros
    this.route.queryParams.subscribe(params => {
      const filtros: FiltrosCalificaciones = {};

      if (params['pedido_id']) {
        this.filtroPedidoId.set(params['pedido_id']);
        filtros.pedido_id = params['pedido_id'];
        this.cargarNumeroPedido(params['pedido_id']);
      }

      if (params['puntuacion']) {
        this.filtroPuntuacion.set(parseInt(params['puntuacion']));
        filtros.puntuacion = parseInt(params['puntuacion']);
      }

      // Cargar calificaciones con filtros
      this.aplicarFiltros(filtros);
    });
  }

  private cargarNumeroPedido(pedidoId: string) {
    // Asumiendo que tienes acceso al servicio de pedidos
    this.numeroPedidoFiltrado.set(`Pedido ${pedidoId.slice(0, 8)}`);
  }

  aplicarFiltros(filtrosExtra?: FiltrosCalificaciones) {
    const filtros: FiltrosCalificaciones = {
      pedido_id: this.filtroPedidoId() || undefined,
      puntuacion: this.filtroPuntuacion() || undefined,
      search: this.searchTerm() || undefined,
      ...filtrosExtra
    };

    this.calificacionService.cargarCalificaciones(filtros);
  }

  cambiarFiltroPuntuacion(puntuacion: number | null) {
    this.filtroPuntuacion.set(puntuacion);
    this.updateQueryParams({ puntuacion: puntuacion ? puntuacion.toString() : null });
    this.aplicarFiltros();
  }

  limpiarFiltroPedido() {
    this.filtroPedidoId.set(null);
    this.numeroPedidoFiltrado.set('');
    this.updateQueryParams({ pedido_id: null });
    this.aplicarFiltros();
  }

  limpiarTodosFiltros() {
    this.filtroPedidoId.set(null);
    this.filtroPuntuacion.set(null);
    this.searchTerm.set('');
    this.numeroPedidoFiltrado.set('');
    
    this.router.navigate(['/clientes/calificaciones']);
    this.calificacionService.limpiarFiltros();
    this.aplicarFiltros();
  }

  private updateQueryParams(params: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }

  recargarCalificaciones() {
    this.aplicarFiltros();
  }

  // Navegar al pedido
  verPedido(calificacion: Calificacion) {
    this.router.navigate(['/clientes/pedidos'], {
      queryParams: { pedido_id: calificacion.pedido_id }
    });
  }

  // Generar array de estrellas para mostrar
  getEstrellas(puntuacion: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < puntuacion);
  }

  formatFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatHora(fecha: Date): string {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Helper para color según puntuación
    getColorPuntuacion(puntuacion: number): string {
    if (puntuacion >= 4) return 'green';
    if (puntuacion === 3) return 'yellow';
    return 'red';
  }

  // Icons
  readonly Filter = Filter;
  readonly X = X;
  readonly Star = Star;
  readonly MessageSquare = MessageSquare;
  readonly Receipt = Receipt;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly ExternalLink = ExternalLink;
  readonly TrendingUp = TrendingUp;
  readonly User = User;
}
