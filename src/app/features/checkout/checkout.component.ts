/**
 * Checkout Component
 * Payment processing with Stripe integration
 * Order creation and confirmation
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Cart } from '../../models/payment.models';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  // Services
  private cartService = inject(CartService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // State
  cart = signal<Cart | null>(null);
  loading = signal<boolean>(true);
  processing = signal<boolean>(false);
  error = signal<string | null>(null);

  // Payment method
  paymentMethod = signal<'stripe' | 'cash'>('stripe');

  // Stripe
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardElement: StripeCardElement | null = null;
  stripeReady = signal<boolean>(false);

  // Forms
  billingForm: FormGroup;

  // Computed values
  total = computed(() => {
    const cartData = this.cart();
    if (!cartData) return 0;
    const subtotal = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return subtotal; // Discount will be applied on backend
  });

  isEmpty = computed(() => !this.cart() || this.cart()!.items.length === 0);

  constructor() {
    this.billingForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      postalCode: ['']
    });
  }

  ngOnInit(): void {
    this.loadCart();
    this.initializeStripe();
    this.loadUserData();
    
    // Auto-redirect to Stripe after 2 seconds
    setTimeout(() => {
      if (!this.isEmpty() && !this.processing()) {
        console.log('🚀 Auto-redirecting to Stripe Checkout...');
        this.processPayment();
      }
    }, 2000);
  }

  /**
   * Load user data and fill form
   */
  private loadUserData(): void {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      console.log('👤 Loading user data for checkout:', currentUser);

      // Fill form with user data
      this.billingForm.patchValue({
        fullName: currentUser.userName || '',
        email: currentUser.email || '',
        phone: currentUser.phoneNumber || ''
      });

      console.log('✅ Form filled with user data');
    }
  }

  /**
   * Load cart
   */
  private loadCart(): void {
    this.loading.set(true);
    this.error.set(null);

    this.cartService.getCart().subscribe({
      next: (cart) => {
        if (!cart || cart.items.length === 0) {
          this.router.navigate(['/cart']);
          this.toastService.showWarning('Your cart is empty');
          return;
        }
        this.cart.set(cart);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load cart');
        this.loading.set(false);
        this.toastService.showError('Failed to load cart');
        console.error('Error loading cart:', err);
      }
    });
  }

  /**
   * Initialize Stripe
   */
  private async initializeStripe(): Promise<void> {
    try {
      this.stripe = await loadStripe(environment.stripePublishableKey);

      if (!this.stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      this.elements = this.stripe.elements();

      // Create card element
      this.cardElement = this.elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#32325d',
            fontFamily: '"Inter", sans-serif',
            '::placeholder': {
              color: '#aab7c4'
            }
          },
          invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
          }
        }
      });

      // Mount card element after a short delay
      setTimeout(() => {
        const cardElement = document.getElementById('card-element');
        if (cardElement && this.cardElement) {
          this.cardElement.mount('#card-element');
          this.stripeReady.set(true);
        }
      }, 500);

    } catch (error) {
      console.error('Stripe initialization error:', error);
      this.toastService.showError('Failed to initialize payment system');
    }
  }

  /**
   * Select payment method
   */
  selectPaymentMethod(method: 'stripe' | 'cash'): void {
    this.paymentMethod.set(method);
  }

  /**
   * Process payment
   */
  async processPayment(): Promise<void> {
    if (this.billingForm.invalid) {
      this.toastService.showWarning('Please fill in all required fields');
      this.billingForm.markAllAsTouched();
      return;
    }

    if (this.isEmpty()) {
      this.toastService.showWarning('Your cart is empty');
      return;
    }

    this.processing.set(true);

    try {
      // Process based on payment method
      if (this.paymentMethod() === 'stripe') {
        // Redirect to Stripe Checkout
        await this.redirectToStripeCheckout();
      } else {
        // Create order for cash payment
        const orderResponse = await this.createOrder();

        if (!orderResponse) {
          throw new Error('Failed to create order');
        }

        // Cash payment - navigate to success
        this.router.navigate(['/payment/success'], {
          queryParams: { orderId: orderResponse.orderId }
        });
      }

    } catch (error: any) {
      this.processing.set(false);
      this.toastService.showError(error.message || 'Payment failed');
      console.error('Payment error:', error);
    }
  }

  /**
   * Redirect to Stripe Checkout
   */
  private async redirectToStripeCheckout(): Promise<void> {
    console.log('💳 Creating order and Stripe Checkout Session...');

    // Step 1: Create order
    const orderResponse = await this.createOrder();

    if (!orderResponse || !orderResponse.orderId) {
      throw new Error('Failed to create order');
    }

    console.log('✅ Order created:', orderResponse.orderId);

    // Step 2: Create Stripe Checkout Session
    const checkoutDto = {
      orderId: orderResponse.orderId,
      successUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`
    };

    this.paymentService.createCheckoutSession(checkoutDto).subscribe({
      next: (response) => {
        console.log('✅ Checkout session response:', response);
        console.log('📊 Response details:', {
          hasSessionUrl: !!response.sessionUrl,
          sessionUrl: response.sessionUrl,
          sessionId: response.sessionId,
          orderId: response.orderId
        });

        // Redirect to Stripe hosted checkout page
        if (response.sessionUrl) {
          console.log('🔄 Redirecting to Stripe:', response.sessionUrl);

          // Force redirect
          window.location.href = response.sessionUrl;

          // Alternative if above doesn't work
          // window.open(response.sessionUrl, '_self');
        } else {
          console.error('❌ No sessionUrl in response:', response);
          this.processing.set(false);
          this.toastService.showError('No session URL returned from server');
        }
      },
      error: (err) => {
        this.processing.set(false);
        this.toastService.showError('Failed to create checkout session');
        console.error('❌ Checkout session error:', err);
        console.error('Error details:', {
          status: err.status,
          message: err.message,
          error: err.error
        });
      }
    });
  }

  /**
   * Create order from cart
   */
  private createOrder(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.paymentService.createOrderFromCart().subscribe({
        next: (order) => resolve(order),
        error: (err) => reject(err)
      });
    });
  }

  /**
   * Process Stripe payment
   */
  private async processStripePayment(orderId: number): Promise<void> {
    if (!this.stripe || !this.cardElement) {
      throw new Error('Stripe not initialized');
    }

    // Create Stripe checkout session
    this.paymentService.createCheckoutSession({
      orderId: orderId,
      successUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`
    }).subscribe({
      next: async (session) => {
        // Redirect to Stripe Checkout using the URL
        window.location.href = session.sessionUrl;
      },
      error: (err) => {
        this.processing.set(false);
        throw err;
      }
    });
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Back to cart
   */
  backToCart(): void {
    this.router.navigate(['/cart']);
  }
}
