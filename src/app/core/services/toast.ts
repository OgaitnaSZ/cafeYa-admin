import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  
  // Lectura pública
  readonly toasts$ = this.toasts.asReadonly();

  // Mostrar toast de éxito
  success(title: string, message?: string, duration = 3000) {
    this.show({
      type: 'success',
      title,
      message,
      duration
    });
  }

  // Mostrar toast de error
  error(title: string, message?: string, duration = 4000) {
    this.show({
      type: 'error',
      title,
      message,
      duration
    });
  }

  // Mostrar toast de advertencia
  warning(title: string, message?: string, duration = 3500) {
    this.show({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  // Mostrar toast de info
  info(title: string, message?: string, duration = 3000) {
    this.show({
      type: 'info',
      title,
      message,
      duration
    });
  }

  // Mostrar toast genérico
  private show(toast: Omit<Toast, 'id' | 'dismissible'>) {
    const newToast: Toast = {
      ...toast,
      id: this.generateId(),
      dismissible: true
    };

    // Agregar al stack
    this.toasts.update(toasts => [...toasts, newToast]);

    // Auto-dismiss
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.dismiss(newToast.id);
      }, toast.duration);
    }
  }

  //Cerrar toast
  dismiss(id: string) {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  // Cerrar todos los toasts
  dismissAll() {
    this.toasts.set([]);
  }

  // Generar ID único
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
