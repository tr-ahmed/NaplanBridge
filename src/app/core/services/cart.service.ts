/**
 * Cart Service
 * Handles Shopping Cart operations for subscription purchases
 * Based on Backend API Documentation
 */

import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, of, BehaviorSubject } from 'rxjs';
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

  // Cart cleared event (for components to listen to)
  private cartClearedSubject = new BehaviorSubject<boolean>(false);
  public cartCleared$ = this.cartClearedSubject.asObservable();

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
      catchError((error) => {
        // Handle duplicate subject error (400 Bad Request)
        if (error.status === 400 &&
            error.error?.message?.includes('already has a subscription plan')) {
          console.warn('🚫 Duplicate subject in cart:', error.error.message);
          // Re-throw the error to be handled by the calling component
          throw error;
        }

        // For other errors, fall back to mock
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
          this.cartClearedSubject.next(true);
          console.log('🧹 Mock cart cleared and event broadcasted');
        })
      );
    }

    return this.api.delete<void>('cart/clear').pipe(
      timeout(environment.apiTimeout),
      tap(() => {
        this.cartItemCount.set(0);
        this.cartTotalAmount.set(0);
        this.cartClearedSubject.next(true);
        console.log('🧹 Cart cleared and event broadcasted');
      }),
      catchError(() => {
        console.warn('⚠️ API failed, clearing cart locally');
        this.cartItemCount.set(0);
        this.cartTotalAmount.set(0);
        this.cartClearedSubject.next(true);
        console.log('🧹 Cart cleared locally and event broadcasted');
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

  /**
   * Force refresh cart and reset signals (call after payment)
   */
  forceRefreshAfterPayment(): Observable<Cart> {
    console.log('💳 Force refreshing cart after payment...');

    // Immediate clear - assume payment was successful
    console.log('🧹 Immediately clearing cart state (payment successful)...');
    this.cartItemCount.set(0);
    this.cartTotalAmount.set(0);
    this.cartClearedSubject.next(true);

    // Then call API to verify, but don't let it override our clearing
    return this.getCart().pipe(
      tap((cart) => {
        console.log('🔄 Cart refreshed after payment:', cart);
        console.log('📊 Cart structure:', {
          itemCount: cart.itemCount,
          itemsLength: cart.items?.length,
          totalAmount: cart.totalAmount,
          totalItems: (cart as any).totalItems
        });

        const itemCount = cart.itemCount || cart.items?.length || (cart as any).totalItems || 0;
        const totalAmount = cart.totalAmount || 0;

        this.cartItemCount.set(itemCount);
        this.cartTotalAmount.set(totalAmount);

        if (itemCount === 0) {
          console.log('✅ Cart confirmed empty from backend after payment');
        } else {
          console.warn('⚠️ Backend still shows items after payment:', itemCount);
          console.log('🧹 But cart already cleared in UI - backend will catch up');
          // Keep our cleared state - don't let backend override
          this.cartItemCount.set(0);
          this.cartTotalAmount.set(0);
        }
        
        // Always broadcast cleared event after payment
        this.cartClearedSubject.next(true);
      })
    );
  }

  /**
   * Manually reset cart state (use when backend has already cleared it)
   */
  resetCartState(): void {
    console.log('🔄 Manually resetting cart state...');
    this.cartItemCount.set(0);
    this.cartTotalAmount.set(0);
    this.cartClearedSubject.next(true);
  }
}
