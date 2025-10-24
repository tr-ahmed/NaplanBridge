/**
 * Payment Service
 * Handles Order creation, Stripe payment integration, and payment history
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './base-api.service';
import {
  Order,
  CreateOrderFromCartResponse,
  CreateCheckoutSessionDto,
  CheckoutSessionResponse,
  PaymentTransaction,
  PaymentHistory,
  Invoice,
  Coupon,
  ApplyCouponDto,
  CouponAppliedResponse,
  RefundRequest,
  RefundResponse
} from '../../models/payment.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private api = inject(ApiService);

  // ============================================
  // Order Methods
  // ============================================

  /**
   * Create order from cart
   * Endpoint: POST /api/order/create-from-cart
   * Roles: Parent, Admin
   */
  createOrderFromCart(): Observable<CreateOrderFromCartResponse> {
    return this.api.post<CreateOrderFromCartResponse>('order/create-from-cart', {});
  }

  /**
   * Get order by ID
   * Endpoint: GET /api/order/{orderId}
   * Roles: Parent, Admin
   */
  getOrderById(orderId: number): Observable<Order> {
    return this.api.get<Order>(`order/${orderId}`);
  }

  /**
   * Get user's order history
   * Endpoint: GET /api/order/user/{userId}/history
   * Roles: Parent, Admin
   */
  getOrderHistory(userId: number): Observable<Order[]> {
    return this.api.get<Order[]>(`order/user/${userId}/history`);
  }

  /**
   * Get pending orders
   * Endpoint: GET /api/order/user/{userId}/pending
   * Roles: Parent, Admin
   */
  getPendingOrders(userId: number): Observable<Order[]> {
    return this.api.get<Order[]>(`order/user/${userId}/pending`);
  }

  /**
   * Cancel order
   * Endpoint: POST /api/order/{orderId}/cancel
   * Roles: Parent, Admin
   */
  cancelOrder(orderId: number): Observable<void> {
    return this.api.post<void>(`order/${orderId}/cancel`, {});
  }

  // ============================================
  // Stripe Payment Methods
  // ============================================

  /**
   * Create Stripe checkout session
   * Endpoint: POST /api/payment/create-checkout-session
   * Roles: Parent, Admin
   */
  createCheckoutSession(dto: CreateCheckoutSessionDto): Observable<CheckoutSessionResponse> {
    return this.api.post<CheckoutSessionResponse>('payment/create-checkout-session', dto);
  }

  /**
   * Verify payment status
   * Endpoint: GET /api/payment/verify/{sessionId}
   */
  verifyPayment(sessionId: string): Observable<{ status: string; orderId: number }> {
    return this.api.get<{ status: string; orderId: number }>(`payment/verify/${sessionId}`);
  }

  /**
   * Handle successful payment (called after Stripe redirect)
   * Endpoint: POST /api/payment/success
   */
  handlePaymentSuccess(sessionId: string): Observable<Order> {
    return this.api.post<Order>('payment/success', { sessionId });
  }

  /**
   * Handle failed payment
   * Endpoint: POST /api/payment/failed
   */
  handlePaymentFailed(sessionId: string, reason: string): Observable<void> {
    return this.api.post<void>('payment/failed', { sessionId, reason });
  }

  // ============================================
  // Payment History Methods
  // ============================================

  /**
   * Get payment history for user
   * Endpoint: GET /api/payment/user/{userId}/history
   * Roles: Parent, Admin
   */
  getPaymentHistory(userId: number): Observable<PaymentHistory> {
    return this.api.get<PaymentHistory>(`payment/user/${userId}/history`);
  }

  /**
   * Get payment transaction by ID
   * Endpoint: GET /api/payment/transaction/{transactionId}
   * Roles: Parent, Admin
   */
  getTransactionById(transactionId: number): Observable<PaymentTransaction> {
    return this.api.get<PaymentTransaction>(`payment/transaction/${transactionId}`);
  }

  // ============================================
  // Invoice Methods
  // ============================================

  /**
   * Get invoice for order
   * Endpoint: GET /api/invoice/order/{orderId}
   * Roles: Parent, Admin
   */
  getInvoice(orderId: number): Observable<Invoice> {
    return this.api.get<Invoice>(`invoice/order/${orderId}`);
  }

  /**
   * Download invoice PDF
   * Endpoint: GET /api/invoice/{invoiceId}/download
   * Roles: Parent, Admin
   */
  downloadInvoice(invoiceId: number): Observable<Blob> {
    return this.api.downloadFile(`invoice/${invoiceId}/download`);
  }

  /**
   * Get user invoices
   * Endpoint: GET /api/invoice/user/{userId}
   * Roles: Parent, Admin
   */
  getUserInvoices(userId: number): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`invoice/user/${userId}`);
  }

  // ============================================
  // Coupon/Discount Methods
  // ============================================

  /**
   * Apply coupon to cart
   * Endpoint: POST /api/coupon/apply
   * Roles: Parent, Admin
   */
  applyCoupon(dto: ApplyCouponDto): Observable<CouponAppliedResponse> {
    return this.api.post<CouponAppliedResponse>('coupon/apply', dto);
  }

  /**
   * Remove coupon from cart
   * Endpoint: POST /api/coupon/remove
   * Roles: Parent, Admin
   */
  removeCoupon(cartId: number): Observable<void> {
    return this.api.post<void>('coupon/remove', { cartId });
  }

  /**
   * Validate coupon code
   * Endpoint: GET /api/coupon/validate/{code}
   */
  validateCoupon(code: string): Observable<Coupon> {
    return this.api.get<Coupon>(`coupon/validate/${code}`);
  }

  // ============================================
  // Refund Methods
  // ============================================

  /**
   * Request refund for order
   * Endpoint: POST /api/refund/request
   * Roles: Parent, Admin
   */
  requestRefund(dto: RefundRequest): Observable<RefundResponse> {
    return this.api.post<RefundResponse>('refund/request', dto);
  }

  /**
   * Get refund status
   * Endpoint: GET /api/refund/{refundId}
   * Roles: Parent, Admin
   */
  getRefundStatus(refundId: string): Observable<RefundResponse> {
    return this.api.get<RefundResponse>(`refund/${refundId}`);
  }

  /**
   * Get user's refund history
   * Endpoint: GET /api/refund/user/{userId}
   * Roles: Parent, Admin
   */
  getRefundHistory(userId: number): Observable<RefundResponse[]> {
    return this.api.get<RefundResponse[]>(`refund/user/${userId}`);
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Calculate total with tax (if needed)
   */
  calculateTotal(subtotal: number, taxRate: number = 0): number {
    return subtotal + (subtotal * taxRate);
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}
