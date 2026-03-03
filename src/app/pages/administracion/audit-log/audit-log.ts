import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditAccion, Log } from '../../../core/interfaces/audit.model';
import {
  LucideAngularModule,
  Search, Filter, X, ChevronDown, ChevronRight,
  Plus, Pencil, Trash2, User, Shield, Clock, RefreshCw,
  FileText, Activity
} from 'lucide-angular';
import { LogsService } from '../../../core/services/logs';

@Component({
  selector: 'app-audit-log',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './audit-log.html',
  styleUrl: './audit-log.css',
})
export class AuditLog implements OnInit {
  logService = inject(LogsService);

  private readonly allLogs = this.logService.auditLogs;
  loading = this.logService.loading;
  busqueda      = signal('');
  filtroAccion  = signal<AuditAccion | 'todas'>('todas');
  filtroEntidad = signal<string>('todas');
  expandido     = signal<number | null>(null); // Int autoincrement

  logs = computed(() => {
    const q       = this.busqueda().toLowerCase();
    const accion  = this.filtroAccion();
    const entidad = this.filtroEntidad();

    return this.allLogs().filter(l =>
      (accion  === 'todas' || l.accion  === accion)  &&
      (entidad === 'todas' || l.entidad === entidad) &&
      (!q || (l.descripcion ?? '').toLowerCase().includes(q)
          || (l.nombre_usuario ?? '').toLowerCase().includes(q)
          || l.entidad.toLowerCase().includes(q))
    );
  });

  entidades = computed(() =>
    ['todas', ...new Set(this.allLogs().map(l => l.entidad))]
  );

  hayFiltros = computed(() =>
    this.busqueda() !== '' || this.filtroAccion() !== 'todas' || this.filtroEntidad() !== 'todas'
  );

  ngOnInit() {
    this.logService.cargarAuditLog();
  }

  toggleExpand(id: number) {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  limpiarFiltros() {
    this.busqueda.set('');
    this.filtroAccion.set('todas');
    this.filtroEntidad.set('todas');
  }

  getAccionStyles(accion: AuditAccion): { bg: string; text: string; icon: any; label: string } {
    return {
      CREATE: { bg: 'bg-green-100', text: 'text-green-700', icon: this.Plus,   label: 'CREATE' },
      UPDATE: { bg: 'bg-blue-100',  text: 'text-blue-700',  icon: this.Pencil, label: 'UPDATE' },
      DELETE: { bg: 'bg-red-100',   text: 'text-red-700',   icon: this.Trash2, label: 'DELETE' },
    }[accion];
  }

  getRolStyles(rol: string | null): string {
    return {
      encargado: 'bg-purple-100 text-purple-700',
      cajero:    'bg-amber-100  text-amber-700',
      mozo:      'bg-blue-100   text-blue-700',
    }[rol ?? ''] ?? 'bg-gray-100 text-gray-500';
  }

  getDiffEntries(log: Log): { key: string; antes: unknown; despues: unknown }[] {
    if (!log.cambios) return [];

    if (log.accion === 'CREATE' && log.cambios.despues) {
      return Object.entries(log.cambios.despues).map(([key, despues]) => ({
        key, antes: null, despues,
      }));
    }

    if (log.accion === 'DELETE' && log.cambios.antes) {
      return Object.entries(log.cambios.antes).map(([key, antes]) => ({
        key, antes, despues: null,
      }));
    }

    if (log.accion === 'UPDATE' && log.cambios.antes && log.cambios.despues) {
      return Object.keys(log.cambios.despues).map(key => ({
        key,
        antes:   log.cambios!.antes![key]   ?? null,
        despues: log.cambios!.despues![key] ?? null,
      }));
    }

    return [];
  }

  formatVal(v: unknown): string {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (typeof v === 'number') return v.toLocaleString('es-AR');
    return String(v);
  }

  formatFecha(d: Date): string {
    return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatHora(d: Date): string {
    return new Date(d).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  formatTiempo(d: Date): string {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60)    return 'Hace un momento';
    if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
  }

  readonly Search       = Search;
  readonly Filter       = Filter;
  readonly X            = X;
  readonly ChevronDown  = ChevronDown;
  readonly ChevronRight = ChevronRight;
  readonly Plus         = Plus;
  readonly Pencil       = Pencil;
  readonly Trash2       = Trash2;
  readonly User         = User;
  readonly Shield       = Shield;
  readonly Clock        = Clock;
  readonly RefreshCw    = RefreshCw;
  readonly FileText     = FileText;
  readonly Activity     = Activity;
}