/**
 * Payment Cancel Component
 * Shown when user cancels payment or payment fails
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-cancel.component.html',
  styleUrl: './payment-cancel.component.scss'
})
export class PaymentCancelComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);

  cancellingSession = signal<boolean>(false);
  sessionCancelled = signal<boolean>(false);
  cancellationError = signal<string>('');
  paymentType = signal<string>('');

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const sessionId = params['session_id'];
      const type = params['type'];

      this.paymentType.set(type || 'cart');

      // If it's a session booking cancellation, call backend
      if (sessionId && type === 'session-booking') {
        console.log('🔄 Cancelling session booking:', sessionId);
        this.cancelSessionBooking(sessionId);
      }
    });
  }

  /**
   * Cancel session booking via backend API
   */
  private cancelSessionBooking(stripeSessionId: string): void {
    this.cancellingSession.set(true);
    this.cancellationError.set('');

    this.sessionService.cancelPayment(stripeSessionId).subscribe({
      next: (response) => {
        console.log('✅ Session booking cancelled:', response);
        this.cancellingSession.set(false);
        this.sessionCancelled.set(true);

        if (response.success) {
          this.toastService.showSuccess(
            response.message || 'Session booking cancelled successfully'
          );
        }
      },
      error: (error) => {
        console.error('❌ Failed to cancel session booking:', error);
        this.cancellingSession.set(false);
        this.cancellationError.set(
          error.error?.message || 'Failed to cancel session booking'
        );

        this.toastService.showError(
          'Failed to cancel session booking. Please contact support if the issue persists.'
        );
      }
    });
  }

  /**
   * Go back to cart
   */
  backToCart(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Try checkout again
   */
  tryAgain(): void {
    if (this.paymentType() === 'session-booking') {
      this.router.navigate(['/sessions/browse']);
    } else {
      this.router.navigate(['/checkout']);
    }
  }

  /**
   * Go to home
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Go to my bookings
   */
  goToBookings(): void {
    this.router.navigate(['/sessions/my-bookings']);
  }
}
