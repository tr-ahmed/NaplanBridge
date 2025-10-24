/**
 * Payment Success Component
 * Order confirmation page after successful payment
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.scss'
})
export class PaymentSuccessComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  orderId = signal<number | null>(null);
  loading = signal<boolean>(true);
  orderDetails = signal<any>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const orderId = params['orderId'];
      const sessionId = params['session_id']; // From Stripe redirect

      if (orderId) {
        this.orderId.set(+orderId);
        this.loadOrderDetails(+orderId);
      } else if (sessionId) {
        this.verifyStripePayment(sessionId);
      } else {
        this.loading.set(false);
      }
    });
  }

  /**
   * Load order details
   */
  private loadOrderDetails(orderId: number): void {
    // Mock order details
    const mockOrder: any = {
      id: orderId,
      total: 99.99,
      items: [],
      status: 'Completed',
      createdAt: new Date()
    };

    this.orderDetails.set(mockOrder);
    this.loading.set(false);
  }

  /**
   * Verify Stripe payment
   */
  private verifyStripePayment(sessionId: string): void {
    this.paymentService.verifyPayment(sessionId).subscribe({
      next: (result: any) => {
        this.orderId.set(result.orderId || 1);
        this.loadOrderDetails(result.orderId || 1);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toastService.showError('Payment verification failed');
        console.error('Verification error:', err);
      }
    });
  }

  /**
   * Go to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * View order history
   */
  viewOrders(): void {
    this.router.navigate(['/orders']);
  }
}
