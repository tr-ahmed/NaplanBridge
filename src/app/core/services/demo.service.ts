import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';

/**
 * Demo service to test the toast notifications
 */
@Injectable({
  providedIn: 'root'
})
export class DemoService {
  constructor(private toastService: ToastService) {}

  /**
   * Test all toast types
   */
  testToasts(): void {
    this.toastService.showSuccess('Registration successful!');
    setTimeout(() => this.toastService.showError('Password validation failed'), 1000);
    setTimeout(() => this.toastService.showWarning('Please check your input'), 2000);
    setTimeout(() => this.toastService.showInfo('Processing your request...'), 3000);
  }
}
