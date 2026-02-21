import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast } from '../../../core/services/toast';
import { Check, CircleAlert, Info, LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-toast-item',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './toast-item.html',
  styleUrl: './toast-item.css',
})
export class ToastItem {
  @Input({ required: true }) toast!: Toast;
  @Output() close = new EventEmitter<void>();
  
  isClosing = signal(false);
  progressWidth = signal(100);
  progressTransition = signal('none');
  
  ngOnInit() {
    // Trigger CSS transition después del render inicial
    if (this.toast.duration && this.toast.duration > 0) {
      // Esperar al siguiente frame para que el browser renderice el estado inicial
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Configurar transición
          this.progressTransition.set(`width ${this.toast.duration}ms linear`);
          // Iniciar animación a 0%
          this.progressWidth.set(0);
        });
      });
    }
  }
  
  onClose() {
    // Animación de salida
    this.isClosing.set(true);
    
    // Esperar a que termine la animación
    setTimeout(() => {
      this.close.emit();
    }, 250);
  }

  // Icons
  readonly X = X;
  readonly Check = Check;
  readonly CircleAlert = CircleAlert;
  readonly Info = Info;
}
