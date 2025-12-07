import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

/**
 * Toast notification service for displaying messages to users
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastId = 0;

  // Using Angular Signals for reactive toast management
  toasts = signal<ToastMessage[]>([]);

  /**
   * Show a success toast message
   */
  showSuccess(message: string, duration = 5000): void {
    this.addToast(message, 'success', duration);
  }

  /**
   * Show an error toast message
   */
  showError(message: string, duration = 7000): void {
    this.addToast(message, 'error', duration);
  }

  /**
   * Show a warning toast message
   */
  showWarning(message: string, duration = 5000): void {
    this.addToast(message, 'warning', duration);
  }

  /**
   * Show an info toast message
   */
  showInfo(message: string, duration = 4000): void {
    this.addToast(message, 'info', duration);
  }

  /**
   * Remove a toast by ID
   */
  removeToast(id: number): void {
    this.toasts.update(toasts => toasts.filter(toast => toast.id !== id));
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.toasts.set([]);
  }

  /**
   * Add a new toast to the list
   */
  private addToast(message: string, type: ToastMessage['type'], duration: number): void {
    // ✅ Prevent duplicate toasts with same message
    const existingToast = this.toasts().find(t => t.message === message && t.type === type);
    if (existingToast) {
      return; // Silently skip duplicate
    }

    const id = ++this.toastId;
    const toast: ToastMessage = { id, message, type, duration };

    this.toasts.update(toasts => [...toasts, toast]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }
  }
}
