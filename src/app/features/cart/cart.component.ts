import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Cart, CartItem } from '../../models/course.models';
import { CoursesService } from '../../core/services/courses.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PaymentService } from '../../core/services/payment.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cart = signal<Cart>({ items: [], totalAmount: 0, totalItems: 0 });
  loading = signal(false);

  // User role detection
  isStudent = signal<boolean>(false);
  currentUserRole = signal<string>('');

  constructor(
    private coursesService: CoursesService,
    private cartService: CartService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.coursesService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => this.cart.set(cart));

    // Listen for cart cleared events (from payment success)
    this.cartService.cartCleared$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cleared => {
        if (cleared) {
          console.log('🔔 Cart cleared event received, reloading cart...');
          this.reloadCart();
        }
      });

    // Check user role (this will call loadStudents if needed)
    this.checkUserRole();

    // Load cart from backend
    this.loadCartFromBackend();
  }

  /**
   * Load cart from backend API
   */
  private loadCartFromBackend(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      console.warn('⚠️ No user logged in, skipping cart load');
      return;
    }

    console.log('📥 Loading cart from backend...');
    this.loading.set(true);

    this.coursesService.loadCartFromBackend(currentUser.studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          console.log('✅ Cart loaded successfully:', cart);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('❌ Failed to load cart:', error);
          this.loading.set(false);
        }
      });
  }

  /**
   * Public method to reload cart (called from other components)
   */
  public reloadCart(): void {
    console.log('🔄 Reloading cart...');
    this.loadCartFromBackend();
  }

  /**
   * Check if current user is a Student
   */
  private checkUserRole(): void {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      // Handle role as array or string
      let userRole = currentUser.role;

      // If role is an array, get the first role or check if 'Student' exists
      if (Array.isArray(userRole)) {
        // Check if 'Student' role exists in array
        const hasStudentRole = userRole.some(r =>
          typeof r === 'string' && r?.toLowerCase() === 'student'
        );
        this.isStudent.set(hasStudentRole);
        this.currentUserRole.set(userRole.join(', '));
      } else if (typeof userRole === 'string') {
        // Handle single role as string
        this.currentUserRole.set(userRole);
        this.isStudent.set(userRole.toLowerCase() === 'student');
      }

      console.log('🔍 Cart - User Role Check:', {
        roles: currentUser.role,
        isStudent: this.isStudent(),
        userId: currentUser.id,
        studentId: currentUser.studentId
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update item quantity
   */
  updateQuantity(courseId: number, quantity: number): void {
    this.coursesService.updateCartItemQuantity(courseId, quantity);
  }

  /**
   * Remove item from cart
   */
  removeItem(cartItemId: number | undefined): void {
    if (!cartItemId) {
      console.error('❌ No cart item ID provided');
      return;
    }

    this.coursesService.removeFromCart(cartItemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }  /**
   * Clear entire cart
   */
  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.coursesService.clearCart();
    }
  }

  /**
   * Proceed to Stripe Checkout directly
   */
  enrollInAll(): void {
    // Check if cart is empty
    if (this.cart().items.length === 0) {
      this.toastService.showWarning('Your cart is empty!');
      return;
    }

    // ✅ No need to check student selection - studentId is already in cart items!
    console.log('💳 Redirecting directly to Stripe:', {
      totalAmount: this.cart().totalAmount,
      itemsCount: this.cart().items.length
    });

    this.loading.set(true);
    this.redirectToStripeCheckout();
  }

  /**
   * Redirect to Stripe Checkout
   */
  private redirectToStripeCheckout(): void {
    console.log('💳 Creating order and Stripe Checkout Session...');

    // Single endpoint that creates order + Stripe session
    this.paymentService.createOrderFromCart().subscribe({
      next: (response: any) => {
        console.log('✅ Checkout response:', response);

        // Support both sessionUrl and checkoutUrl (backend may use either)
        const redirectUrl = response.sessionUrl || response.checkoutUrl;

        console.log('📊 Response structure:', {
          hasSessionUrl: !!response.sessionUrl,
          hasCheckoutUrl: !!response.checkoutUrl,
          hasSessionId: !!response.sessionId,
          hasOrderId: !!response.orderId,
          redirectUrl: redirectUrl,
          sessionId: response.sessionId,
          orderId: response.orderId,
          fullResponse: response
        });

        // Redirect to Stripe checkout page
        if (redirectUrl) {
          console.log('🔄 Redirecting to Stripe:', redirectUrl);
          window.location.href = redirectUrl;
        } else {
          console.error('❌ No checkout URL in response!');
          console.error('❌ Response received:', response);
          this.loading.set(false);
          this.toastService.showError('Checkout URL not received from backend');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.showError('Failed to create checkout session');
        console.error('❌ Checkout error:', err);
      }
    });
  }

  /**
   * Get discount percentage
   */
  getDiscountPercentage(originalPrice: number, currentPrice: number): number {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  /**
   * Extract subject name only (without year and term)
   * Example: "Reading Comprehension Year 7 - Term 3" -> "Reading Comprehension"
   */
  getSubjectNameOnly(fullName: string): string {
    if (!fullName) return '';

    // Split by " Year " and take the first part
    const parts = fullName.split(/\s+Year\s+/i);
    return parts[0].trim();
  }

  /**
   * Get poster URL with fallback to default image
   * Handles null/undefined posterUrl from backend
   */
  getPosterUrl(item: CartItem): string {
    // Try to get posterUrl from different sources
    const posterUrl = (item as any).posterUrl ||
                     item.course?.posterUrl ||
                     (item as any).imageUrl ||
                     (item as any).subjectPosterUrl ||
                     '';

    // If no posterUrl, return default image instead of placeholder
    if (!posterUrl) {
      return 'assets/images/default-subject.svg';
    }

    return posterUrl;
  }

  /**
   * Handle image loading error
   * Fallback to default image when poster fails to load
   */
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-subject.svg';
  }  /**
   * Extract year and term info
   * Example: "Reading Comprehension Year 7 - Term 3" -> "Year 7 - Term 3"
   */
  getYearAndTerm(fullName: string): string {
    if (!fullName) return '';

    // Find "Year X" and everything after it
    const match = fullName.match(/Year\s+\d+[\s\S]*/i);
    return match ? match[0] : '';
  }

  /**
   * Handle duplicate subject error when adding to cart
   */
  handleDuplicateSubjectError(error: any): void {
    if (error.status === 400 &&
        error.error?.message?.includes('already has a subscription plan')) {

      this.toastService.showWarning(
        '⚠️ Plan Already in Cart: You already have a plan for this subject. Remove the existing plan first or proceed to checkout.'
      );

      // Auto-scroll to show the cart
      setTimeout(() => {
        const cartSection = document.querySelector('.cart-container');
        if (cartSection) {
          cartSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 1000);

    } else {
      // Generic error
      this.toastService.showError(
        `❌ Add to Cart Failed: ${error.error?.message || 'Could not add item to cart. Please try again.'}`
      );
    }
  }
}
