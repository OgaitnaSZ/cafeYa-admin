import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido, PedidoEstado } from '../../../../core/interfaces/pedido.model';
import { LucideAngularModule, X, User, Table2, Clock, CreditCard } from 'lucide-angular';

@Component({
  selector: 'app-pedido-detalle-modal',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './pedido-detalle-modal.html',
  styleUrl: './pedido-detalle-modal.css',
})
export class PedidoDetalleModal {
  @Input({ required: true }) pedido!: Pedido;
  @Output() close = new EventEmitter<void>();
  @Output() cambiarEstado = new EventEmitter<{ pedido: Pedido, estado: PedidoEstado }>();
  @Output() verPagos = new EventEmitter<Pedido>();

  readonly X = X;
  readonly User = User;
  readonly Table2 = Table2;
  readonly Clock = Clock;
  readonly CreditCard = CreditCard;

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  handleCambiarEstado(estado: PedidoEstado) {
    this.cambiarEstado.emit({ pedido: this.pedido, estado });
    this.close.emit();
  }

  handleVerPagos() {
    this.verPagos.emit(this.pedido);
    this.close.emit();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatFecha(fecha: Date): string {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
