/**
 * Payment Success Component
 * Order confirmation page after successful payment
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PaymentService } from '../../core/services/payment.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';

interface PaymentResponse {
  message: string;
  sessionId: string;
  success?: boolean; // Optional, some backend responses may not include this
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
  private cartService = inject(CartService);
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
    
    // Check if user is authenticated
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('🔑 Auth token present:', !!token);
    console.log('🌐 API URL:', `${this.apiBaseUrl}/Payment/success?session_id=${sessionId}`);

    // Call new backend endpoint: GET /api/Payment/success?session_id={sessionId}
    // Auth interceptor will automatically add Authorization header
    this.http.get<PaymentResponse>(`${this.apiBaseUrl}/Payment/success?session_id=${sessionId}`)
      .subscribe({
        next: (response: PaymentResponse) => {
          console.log('✅ Payment verification response:', response);

          this.loading.set(false);

            // Check if payment is successful (backend returns message on success)
          if (response.message && response.message.includes('successful')) {
            // Payment successful
            this.toastService.showSuccess(response.message);
            this.orderId.set(1); // Set a default order ID for display
            this.loadOrderDetails(1);

            // Multiple approaches to ensure cart is cleared
            console.log('💳 Payment successful! Clearing cart with multiple approaches...');

            // Approach 1: Force clear cart via API immediately (don't wait)
            this.cartService.clearCart().subscribe({
              next: () => {
                console.log('🧹 Cart cleared via API immediately');
              },
              error: () => {
                console.log('🔄 API clear failed, using reset');
                this.cartService.resetCartState();
              }
            });

            // Approach 2: Force reset cart state immediately as backup
            this.cartService.resetCartState();

            // Approach 3: Refresh cart from backend (to verify)
            setTimeout(() => this.refreshCart(), 500);            // Force clear cart as fallback after 2 seconds if backend didn't clear it
            setTimeout(() => {
              console.log('🔄 Double-checking cart is cleared...');
              const currentCartCount = this.cartService.cartItemCount();
              console.log('📊 Current cart count:', currentCartCount);

              if (currentCartCount > 0) {
                console.warn('⚠️ Cart still has items, force clearing...');
                this.cartService.clearCart().subscribe({
                  next: () => {
                    console.log('✅ Cart API cleared successfully');
                    this.toastService.showSuccess('Cart cleared successfully!');
                  },
                  error: (err) => {
                    console.error('❌ Failed to clear cart via API, using manual reset:', err);
                    // Manual reset as last resort
                    this.cartService.resetCartState();
                    this.toastService.showSuccess('Cart cleared manually!');
                  }
                });
              } else {
                console.log('✅ Cart is already empty');
              }
            }, 2000);

            // Redirect to dashboard after 4 seconds (give time for cart clearing)
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 4000);
          } else {
            // Payment status unclear - show as warning instead of error
            console.warn('⚠️ Payment response unclear:', response);
            this.toastService.showWarning(response.message || 'Payment status could not be verified');

            // Still try to refresh cart in case payment was actually successful
            this.refreshCart();
          }
        },
        error: (error: any) => {
          console.error('❌ Payment verification error:', error);
          console.error('📊 Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.error?.message,
            url: error.url
          });
          
          this.loading.set(false);
          
          if (error.status === 401) {
            console.error('🚫 Unauthorized - Missing or invalid token');
            this.toastService.showError('Session expired. Please login again.');
            // Could redirect to login here
            // this.router.navigate(['/auth/login']);
          } else {
            this.toastService.showError(
              error.error?.message || 'Payment verification failed. Please contact support.'
            );
          }
        }
      });
  }

  /**
   * Refresh cart after successful payment
   */
  private refreshCart(): void {
    console.log('🔄 Refreshing cart after successful payment...');

    // Use CartService force refresh method for payment scenarios
    this.cartService.forceRefreshAfterPayment().subscribe({
      next: (cart) => {
        console.log('✅ Cart refreshed after payment:', cart);
        console.log('📊 Cart items count:', cart.itemCount || cart.items?.length || 0);
        console.log('💰 Cart total:', cart.totalAmount || 0);

        // Verify cart is empty
        if ((cart.itemCount || cart.items?.length || 0) === 0) {
          console.log('🎉 Cart is now empty - payment processing successful!');
          this.toastService.showSuccess('Payment completed! Your cart has been cleared and subscriptions activated.');
        } else {
          console.warn('⚠️ Cart still has items after payment - this may indicate an issue');
          // Try to clear it manually
          this.cartService.clearCart().subscribe({
            next: () => {
              console.log('🧹 Cart cleared manually after payment');
              this.toastService.showSuccess('Cart cleared successfully!');
            },
            error: (clearErr) => {
              console.error('❌ Failed to clear cart manually:', clearErr);
            }
          });
        }
      },
      error: (err: any) => {
        console.warn('⚠️ Could not refresh cart:', err);
        // Try to force clear cart anyway
        this.cartService.clearCart().subscribe({
          next: () => {
            console.log('🧹 Cart force-cleared due to refresh error');
          },
          error: (clearErr) => {
            console.error('❌ Failed to force clear cart:', clearErr);
          }
        });
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
