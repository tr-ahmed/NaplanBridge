import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../core/services/toast.service';

/**
 * Toast notification component for displaying user feedback messages
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      @for (toast of toasts(); track toast.id) {
        <div
          [class]="getToastClasses(toast.type)"
          class="max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div [class]="getIconClasses(toast.type)" class="mr-3">
                @switch (toast.type) {
                  @case ('success') { ✓ }
                  @case ('error') { ✗ }
                  @case ('warning') { ⚠ }
                  @case ('info') { ℹ }
                }
              </div>
              <p class="text-sm font-medium">{{ toast.message }}</p>
            </div>
            <button
              (click)="removeToast(toast.id)"
              class="ml-4 text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-enter {
      opacity: 0;
      transform: translateX(100%);
    }

    .toast-enter-active {
      opacity: 1;
      transform: translateX(0);
      transition: all 0.3s ease-in-out;
    }

    .toast-leave-active {
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease-in-out;
    }
  `]
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);

  // Use computed signal to get reactive toast list
  toasts = computed(() => this.toastService.toasts());

  /**
   * Remove a toast by ID
   */
  removeToast(id: number): void {
    this.toastService.removeToast(id);
  }

  /**
   * Get CSS classes for toast based on type
   */
  getToastClasses(type: ToastMessage['type']): string {
    const baseClasses = 'border-l-4';

    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-600 border-green-800 text-white`;
      case 'error':
        return `${baseClasses} bg-red-600 border-red-800 text-white`;
      case 'warning':
        return `${baseClasses} bg-yellow-600 border-yellow-800 text-white`;
      case 'info':
        return `${baseClasses} bg-blue-600 border-blue-800 text-white`;
      default:
        return `${baseClasses} bg-gray-600 border-gray-800 text-white`;
    }
  }

  /**
   * Get CSS classes for icon based on type
   */
  getIconClasses(type: ToastMessage['type']): string {
    const baseClasses = 'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold';

    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-800 text-green-200`;
      case 'error':
        return `${baseClasses} bg-red-800 text-red-200`;
      case 'warning':
        return `${baseClasses} bg-yellow-800 text-yellow-200`;
      case 'info':
        return `${baseClasses} bg-blue-800 text-blue-200`;
      default:
        return `${baseClasses} bg-gray-800 text-gray-200`;
    }
  }
}
