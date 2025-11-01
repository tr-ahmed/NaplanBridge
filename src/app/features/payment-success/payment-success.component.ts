/**
 * Payment Success Component
 * Order confirmation page after successful payment
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PaymentService } from '../../core/services/payment.service';
import { ToastService } from '../../core/services/toast.service';

interface PaymentResponse {
  success: boolean;
  message: string;
  sessionId: string;
}

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.scss'
})
export class PaymentSuccessComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

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
   * Verify Stripe payment with new backend API
   */
  private verifyStripePayment(sessionId: string): void {
    console.log('🔍 Verifying payment with session ID:', sessionId);

    // Call new backend endpoint: GET /api/Payment/success?session_id={sessionId}
    this.http.get<PaymentResponse>(`${this.apiBaseUrl}/Payment/success?session_id=${sessionId}`)
      .subscribe({
        next: (response: PaymentResponse) => {
          console.log('✅ Payment verification response:', response);
          
          this.loading.set(false);
          
          if (response.success) {
            // Payment successful
            this.toastService.showSuccess(response.message);
            this.orderId.set(1); // Set a default order ID for display
            this.loadOrderDetails(1);
            
            // Refresh cart (should be empty now)
            this.refreshCart();
            
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 3000);
          } else {
            // Payment failed
            this.toastService.showError(response.message || 'Payment verification failed');
          }
        },
        error: (error: any) => {
          console.error('❌ Payment verification error:', error);
          this.loading.set(false);
          this.toastService.showError(
            error.error?.message || 'Payment verification failed. Please contact support.'
          );
        }
      });
  }

  /**
   * Refresh cart after successful payment
   */
  private refreshCart(): void {
    // Call cart API to refresh (should be empty now)
    this.http.get(`${this.apiBaseUrl}/Cart`).subscribe({
      next: () => {
        console.log('✅ Cart refreshed after payment');
      },
      error: (err: any) => {
        console.warn('⚠️ Could not refresh cart:', err);
      }
    });
  }

  /**
   * Get API base URL from environment or fallback
   */
  private get apiBaseUrl(): string {
    return 'https://naplan2.runasp.net/api'; // Using production API
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
