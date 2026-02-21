import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastItem } from '../toast-item/toast-item';
import { ToastService } from '../../../../core/services/toast';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule, ToastItem],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainer {
  private toastService = inject(ToastService);
  
  toasts = this.toastService.toasts$;
  
  onClose(id: string) {
    this.toastService.dismiss(id);
  }
}
