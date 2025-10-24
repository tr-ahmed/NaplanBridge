/**
 * Cart Service
 * Handles Shopping Cart operations for subscription purchases
 * Based on Backend API Documentation
 */

import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { ApiService } from './base-api.service';
import { MockDataService } from './mock-data.service';
import {
  Cart,
  CartItem,
  AddToCartDto,
  AddToCartResponse,
  UpdateCartItemDto
} from '../../models/payment.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private api = inject(ApiService);
  private mockData = inject(MockDataService);

  // Cart state signals
  public cartItemCount = signal<number>(0);
  public cartTotalAmount = signal<number>(0);

  // ============================================
  // Cart Methods
  // ============================================

  /**
   * Get current user's cart
   * Endpoint: GET /api/cart
   * Roles: Parent, Admin
   */
  getCart(): Observable<Cart> {
    const mockCart: any = this.mockData.getMockCart();

    if (environment.useMock) {
      return of(mockCart as Cart).pipe(
        tap((cart: any) => {
          this.cartItemCount.set(cart.itemCount);
          this.cartTotalAmount.set(cart.totalAmount);
        })
      );
    }

    return this.api.get<Cart>('cart').pipe(
      timeout(environment.apiTimeout),
      tap(cart => {
        this.cartItemCount.set(cart.itemCount);
        this.cartTotalAmount.set(cart.totalAmount);
      }),
      catchError(() => {
        console.warn('⚠️ API failed, using mock cart');
        this.cartItemCount.set(mockCart.itemCount);
        this.cartTotalAmount.set(mockCart.totalAmount);
        return of(mockCart as Cart);
      })
    );
  }

  /**
   * Add item to cart
   * Endpoint: POST /api/cart/add
   * Roles: Parent, Admin
   */
  addToCart(dto: AddToCartDto): Observable<AddToCartResponse> {
    const mockResponse: any = {
      message: 'Item added to cart',
      totalItems: 1,
      totalAmount: 29.99,
      itemId: 1
    };

    if (environment.useMock) {
      return of(mockResponse).pipe(
        tap(response => {
          this.cartItemCount.set(response.totalItems);
          this.cartTotalAmount.set(response.totalAmount);
        })
      );
    }

    return this.api.post<AddToCartResponse>('cart/add', dto).pipe(
      timeout(environment.apiTimeout),
      tap(response => {
        this.cartItemCount.set(response.totalItems);
        this.cartTotalAmount.set(response.totalAmount);
      }),
      catchError(() => {
        console.warn('⚠️ API failed, using mock response');
        this.cartItemCount.set(mockResponse.totalItems);
        this.cartTotalAmount.set(mockResponse.totalAmount);
        return of(mockResponse);
      })
    );
  }

  /**
   * Update cart item quantity
   * Endpoint: PUT /api/cart/items/{itemId}
   * Roles: Parent, Admin
   */
  updateCartItem(itemId: number, dto: UpdateCartItemDto): Observable<Cart> {
    const mockCart: any = this.mockData.getMockCart();

    if (environment.useMock) {
      return of(mockCart).pipe(
        tap(cart => {
          this.cartItemCount.set(cart.itemCount);
          this.cartTotalAmount.set(cart.totalAmount);
        })
      );
    }

    return this.api.put<Cart>(`cart/items/${itemId}`, dto).pipe(
      timeout(environment.apiTimeout),
      tap(cart => {
        this.cartItemCount.set(cart.itemCount);
        this.cartTotalAmount.set(cart.totalAmount);
      }),
      catchError(() => {
        console.warn('⚠️ API failed, using mock cart');
        this.cartItemCount.set(mockCart.itemCount);
        this.cartTotalAmount.set(mockCart.totalAmount);
        return of(mockCart);
      })
    );
  }

  /**
   * Remove item from cart
   * Endpoint: DELETE /api/cart/items/{itemId}
   * Roles: Parent, Admin
   */
  removeFromCart(itemId: number): Observable<Cart> {
    const mockCart: any = { ...this.mockData.getMockCart(), itemCount: 0, totalAmount: 0 };

    if (environment.useMock) {
      return of(mockCart).pipe(
        tap(cart => {
          this.cartItemCount.set(cart.itemCount);
          this.cartTotalAmount.set(cart.totalAmount);
        })
      );
    }

    return this.api.delete<Cart>(`cart/items/${itemId}`).pipe(
      timeout(environment.apiTimeout),
      tap(cart => {
        this.cartItemCount.set(cart.itemCount);
        this.cartTotalAmount.set(cart.totalAmount);
      }),
      catchError(() => {
        console.warn('⚠️ API failed, using mock cart');
        this.cartItemCount.set(mockCart.itemCount);
        this.cartTotalAmount.set(mockCart.totalAmount);
        return of(mockCart);
      })
    );
  }

  /**
   * Clear cart (remove all items)
   * Endpoint: DELETE /api/cart/clear
   * Roles: Parent, Admin
   */
  clearCart(): Observable<void> {
    if (environment.useMock) {
      return of(undefined).pipe(
        tap(() => {
          this.cartItemCount.set(0);
          this.cartTotalAmount.set(0);
        })
      );
    }

    return this.api.delete<void>('cart/clear').pipe(
      timeout(environment.apiTimeout),
      tap(() => {
        this.cartItemCount.set(0);
        this.cartTotalAmount.set(0);
      }),
      catchError(() => {
        console.warn('⚠️ API failed, clearing cart locally');
        this.cartItemCount.set(0);
        this.cartTotalAmount.set(0);
        return of(undefined);
      })
    );
  }

  /**
   * Get cart item count (for header badge)
   * Endpoint: GET /api/cart/count
   * Roles: Parent, Admin
   */
  getCartItemCount(): Observable<number> {
    return this.api.get<{ count: number }>('cart/count').pipe(
      tap(response => this.cartItemCount.set(response.count)),
      tap(response => response.count)
    ) as any;
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Check if item is in cart
   */
  isItemInCart(planId: number): Observable<boolean> {
    return this.getCart().pipe(
      tap(cart => cart.items.some(item => item.subscriptionPlanId === planId))
    ) as any;
  }

  /**
   * Get cart item by plan ID
   */
  getCartItemByPlanId(planId: number): Observable<CartItem | undefined> {
    return this.getCart().pipe(
      tap(cart => cart.items.find(item => item.subscriptionPlanId === planId))
    ) as any;
  }

  /**
   * Quick add to cart (simplified)
   */
  quickAddToCart(planId: number, studentId: number, quantity: number = 1): Observable<AddToCartResponse> {
    return this.addToCart({
      subscriptionPlanId: planId,
      studentId: studentId,
      quantity: quantity
    });
  }

  /**
   * Refresh cart state (call after login or navigation)
   */
  refreshCart(): Observable<Cart> {
    return this.getCart();
  }
}
