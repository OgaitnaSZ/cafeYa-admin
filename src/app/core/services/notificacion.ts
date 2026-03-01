import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from './toast';

// Tipos públicos 

export type TipoNotifServidor =
  | 'pedido'   // Nuevo pedido
  | 'mesa'     // Nueva mesa ocupada
  | 'resena'   // Nueva reseña
  | 'pago'     // Nuevo pago registrado
  | 'mozo';    // Llamada al mozo

export type TipoNotifEstado =
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

/** Notificación de evento del servidor (websocket) — se muestra en el panel del header */
export interface NotificacionServidor {
  id: string;
  tipo: TipoNotifServidor;
  titulo: string;
  mensaje: string;
  /** Ruta a la que navega al hacer click */
  url: string;
  leida: boolean;
  created_at: Date;
}

/** Notificación de estado de una operación — se muestra en el header como historial */
export interface NotificacionEstado {
  id: string;
  tipo: TipoNotifEstado;
  titulo: string;
  mensaje: string;
  created_at: Date;
}

// Helpers─

export const NOTIF_SERVIDOR_META: Record<TipoNotifServidor, { emoji: string; bg: string }> = {
  pedido: { emoji: '📋', bg: 'bg-orange-100' },
  mesa: { emoji: '🪑', bg: 'bg-blue-100'   },
  resena: { emoji: '⭐', bg: 'bg-amber-100'  },
  pago: { emoji: '💳', bg: 'bg-green-100'  },
  mozo: { emoji: '🔔', bg: 'bg-red-100'    },
};

export const NOTIF_ESTADO_META: Record<TipoNotifEstado, { emoji: string; bg: string; text: string }> = {
  success: { emoji: '✅', bg: 'bg-green-100', text: 'text-green-700' },
  error: { emoji: '❌', bg: 'bg-red-100',   text: 'text-red-700'   },
  warning: { emoji: '⚠️', bg: 'bg-amber-100', text: 'text-amber-700' },
  info: { emoji: 'ℹ️', bg: 'bg-blue-100',  text: 'text-blue-700'  },
};

function formatTiempo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)   return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400)return `Hace ${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private router = inject(Router);
  private toastService = inject(ToastService);

  // Signals 
  /** Notificaciones de eventos del servidor (websocket). Máximo 20 en memoria. */
  readonly notificacionesServidor = signal<NotificacionServidor[]>([]);

  /** Historial de notificaciones de estado (operaciones del admin). Máximo 20. */
  readonly notificacionesEstado = signal<NotificacionEstado[]>([]);

  // Computed
  readonly servidorNoLeidas = computed(() =>
    this.notificacionesServidor().filter(n => !n.leida).length
  );

  readonly totalNoLeidas = computed(() => this.servidorNoLeidas());

  // API: notificaciones del servidor──

  /**
   * Agrega una notificación de servidor (llamado desde el websocket handler).
   * También dispara un toast para visibilidad inmediata.
   */
  agregarServidor(notif: Omit<NotificacionServidor, 'id' | 'leida' | 'created_at'>) {
    const nueva: NotificacionServidor = {
      ...notif,
      id: `srv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      leida: false,
      created_at: new Date(),
    };

    this.notificacionesServidor.update(list =>
      [nueva, ...list].slice(0, 20)
    );

    // Toast de visibilidad inmediata
    this.toastService.info(notif.titulo, notif.mensaje, 4000);
  }

  marcarLeidaServidor(id: string) {
    this.notificacionesServidor.update(list =>
      list.map(n => n.id === id ? { ...n, leida: true } : n)
    );
  }

  marcarTodasLeidasServidor() {
    this.notificacionesServidor.update(list =>
      list.map(n => ({ ...n, leida: true }))
    );
  }

  eliminarServidor(id: string) {
    this.notificacionesServidor.update(list => list.filter(n => n.id !== id));
  }

  clickServidor(notif: NotificacionServidor) {
    this.marcarLeidaServidor(notif.id);
    this.router.navigateByUrl(notif.url);
  }

  // API: notificaciones de estado
  private _toastActivo = new Map<string, ReturnType<typeof setTimeout>>();
  estado(tipo: TipoNotifEstado, titulo: string, mensaje?: string, duration?: number) {
    const nueva: NotificacionEstado = {
      id: `est-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tipo,
      titulo,
      mensaje: mensaje ?? '',
      created_at: new Date(),
    };

    this.notificacionesEstado.update(list => {
      const sinDuplicado = list.filter(
        n => !(n.tipo === tipo && n.titulo === titulo && n.mensaje === (mensaje ?? ''))
      );
      return [nueva, ...sinDuplicado].slice(0, 20);
    });

    // Solo dispara el toast si no hay uno activo con la misma clave
    const clave = `${tipo}|${titulo}|${mensaje ?? ''}`;
    if (!this._toastActivo.has(clave)) {
      this.toastService[tipo](titulo, mensaje, duration);

      // Bloquea nuevos toasts con esta clave hasta que expire el tiempo del toast
      const timer = setTimeout(() => {
        this._toastActivo.delete(clave);
      }, duration ?? 4000); // usa el mismo duration que el toast

      this._toastActivo.set(clave, timer);
    }
  }

  // Shortcuts
  success(titulo: string, mensaje?: string) { this.estado('success', titulo, mensaje); }
  error (titulo: string, mensaje?: string) { this.estado('error',   titulo, mensaje); }
  warning(titulo: string, mensaje?: string) { this.estado('warning', titulo, mensaje); }
  info (titulo: string, mensaje?: string) { this.estado('info',    titulo, mensaje); }

  eliminarEstado(id: string) {
    this.notificacionesEstado.update(list => list.filter(n => n.id !== id));
  }

  // Helper de formato (para el template)
  formatTiempo(date: Date): string { return formatTiempo(date); }
}