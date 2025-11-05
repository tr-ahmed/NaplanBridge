import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  SubscriptionPlanDisplay,
  SubscriptionDiscount,
  SubscriptionPurchase,
  PaymentMethod
} from '../../models/subscription.models';
import { SubscriptionService } from '../../core/services/subscription.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-subscription-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subscription-checkout.component.html',
  styleUrls: ['./subscription-checkout.component.scss']
})
export class SubscriptionCheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State signals
  plan = signal<SubscriptionPlanDisplay | null>(null);
  discount = signal<SubscriptionDiscount | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  processing = signal(false);

  // Form signals
  currentStep = signal(1);
  selectedPaymentMethod = signal<PaymentMethod>('credit_card');

  // Forms
  studentForm!: FormGroup;
  paymentForm!: FormGroup;
  discountForm!: FormGroup;

  // Computed values
  totalSteps = 3;
  finalPrice = computed(() => {
    const planPrice = this.plan()?.currentPrice || 0;
    const discountValue = this.calculateDiscountAmount();
    return Math.max(0, planPrice - discountValue);
  });

  // Payment methods
  paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'credit_card', label: 'Credit/Debit Card', icon: '💳' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
    { value: 'paypal', label: 'PayPal', icon: '💰' },
    { value: 'apple_pay', label: 'Apple Pay', icon: '🍎' },
    { value: 'google_pay', label: 'Google Pay', icon: '🔍' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private subscriptionService: SubscriptionService,
    private authService: AuthService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    // Get plan ID and year ID from route
    const planId = this.route.snapshot.paramMap.get('planId');
    const yearIdParam = this.route.snapshot.queryParamMap.get('yearId');
    const yearId = yearIdParam ? parseInt(yearIdParam, 10) : 5; // Default to Year 5

    if (planId) {
      this.loadPlan(parseInt(planId), yearId);
    } else {
      this.router.navigate(['/subscription/plans']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    // Student form
    this.studentForm = this.fb.group({
      studentId: ['', Validators.required]
    });

    // Discount form
    this.discountForm = this.fb.group({
      code: ['']
    });

    // Payment form
    this.paymentForm = this.fb.group({
      // Credit card fields
      cardNumber: [''],
      cardholderName: [''],
      expiryMonth: [''],
      expiryYear: [''],
      cvv: [''],

      // Bank transfer fields
      bankName: [''],
      accountNumber: [''],
      transferReference: [''],

      // Billing address
      street: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: ['USA'],

      // Agreements
      termsAccepted: [false, Validators.requiredTrue],
      privacyAccepted: [false, Validators.requiredTrue],
      marketingAccepted: [false]
    });

    // Update validators based on payment method
    this.updatePaymentValidators();
  }

  /**
   * تحميل تفاصيل الباقة
   * Load plan details
   */
  private loadPlan(planId: number, yearId: number = 5): void {
    this.loading.set(true);
    this.error.set(null);

    this.subscriptionService.getPlanById(planId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (planData) => {
          if (planData) {
            // Convert to display plan with specified year
            this.subscriptionService.getDisplayPlans(undefined, yearId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (displayPlans) => {
                  const displayPlan = displayPlans.find(p => p.id === planId);
                  if (displayPlan) {
                    this.plan.set(displayPlan);
                  }
                  this.loading.set(false);
                },
                error: () => {
                  this.error.set('Failed to load plan details');
                  this.loading.set(false);
                }
              });
          } else {
            this.error.set('Plan not found');
            this.loading.set(false);
          }
        },
        error: () => {
          this.error.set('Failed to load plan');
          this.loading.set(false);
        }
      });
  }

  /**
   * الانتقال للخطوة التالية
   * Go to next step
   */
  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      if (this.validateCurrentStep()) {
        this.currentStep.set(this.currentStep() + 1);
      }
    }
  }

  /**
   * الرجوع للخطوة السابقة
   * Go to previous step
   */
  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  /**
   * اختيار طريقة الدفع
   * Select payment method
   */
  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod.set(method);
    this.updatePaymentValidators();
  }

  /**
   * تطبيق كود الخصم
   * Apply discount code
   */
  applyDiscount(): void {
    const code = this.discountForm.get('code')?.value;
    const planId = this.plan()?.id;

    if (!code || !planId) return;

    this.loading.set(true);
    this.subscriptionService.validateDiscountCode(code, planId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (discount) => {
          if (discount) {
            this.discount.set(discount);
            this.discountForm.get('code')?.setErrors(null);
          } else {
            this.discountForm.get('code')?.setErrors({ invalid: true });
          }
          this.loading.set(false);
        },
        error: () => {
          this.discountForm.get('code')?.setErrors({ invalid: true });
          this.loading.set(false);
        }
      });
  }

  /**
   * إزالة الخصم
   * Remove discount
   */
  removeDiscount(): void {
    this.discount.set(null);
    this.discountForm.get('code')?.setValue('');
  }

  /**
   * إتمام عملية الشراء
   * Complete purchase
   */
  completePurchase(): void {
    if (!this.validateAllForms()) return;

    this.processing.set(true);
    this.error.set(null);

    const purchase: SubscriptionPurchase = {
      planId: this.plan()!.id,
      studentId: this.studentForm.get('studentId')?.value,
      paymentMethod: this.selectedPaymentMethod(),
      discountCode: this.discount()?.code,
      termsAccepted: this.paymentForm.get('termsAccepted')?.value,
      privacyAccepted: this.paymentForm.get('privacyAccepted')?.value,
      marketingAccepted: this.paymentForm.get('marketingAccepted')?.value
    };

    // Add payment method specific details
    if (this.selectedPaymentMethod() === 'credit_card') {
      purchase.cardDetails = {
        cardNumber: this.paymentForm.get('cardNumber')?.value,
        expiryMonth: parseInt(this.paymentForm.get('expiryMonth')?.value),
        expiryYear: parseInt(this.paymentForm.get('expiryYear')?.value),
        cvv: this.paymentForm.get('cvv')?.value,
        cardholderName: this.paymentForm.get('cardholderName')?.value
      };
    } else if (this.selectedPaymentMethod() === 'bank_transfer') {
      purchase.bankTransferDetails = {
        bankName: this.paymentForm.get('bankName')?.value,
        accountNumber: this.paymentForm.get('accountNumber')?.value,
        transferReference: this.paymentForm.get('transferReference')?.value,
        transferDate: new Date()
      };
    }

    // Add billing address
    purchase.billingAddress = {
      street: this.paymentForm.get('street')?.value,
      city: this.paymentForm.get('city')?.value,
      state: this.paymentForm.get('state')?.value,
      zipCode: this.paymentForm.get('zipCode')?.value,
      country: this.paymentForm.get('country')?.value
    };

    this.subscriptionService.createSubscription(purchase)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.processing.set(false);
          if (response.success) {
            // Redirect to success page
            this.router.navigate(['/subscription/success'], {
              queryParams: { subscriptionId: response.subscriptionId }
            });
          } else {
            this.error.set(response.message);
          }
        },
        error: (error) => {
          this.processing.set(false);
          this.error.set('Purchase failed. Please try again.');
          console.error('Purchase error:', error);
        }
      });
  }

  /**
   * حساب مبلغ الخصم
   * Calculate discount amount
   */
  calculateDiscountAmount(): number {
    const discount = this.discount();
    const plan = this.plan();

    if (!discount || !plan) return 0;

    if (discount.type === 'percentage') {
      const discountAmount = (plan.currentPrice * discount.value) / 100;
      return discount.maxDiscount ? Math.min(discountAmount, discount.maxDiscount) : discountAmount;
    } else {
      return discount.value;
    }
  }

  /**
   * التحقق من صحة الخطوة الحالية
   * Validate current step
   */
  validateCurrentStep(): boolean {
    switch (this.currentStep()) {
      case 1:
        return this.studentForm.valid;
      case 2:
        return true; // Discount is optional
      case 3:
        return this.paymentForm.valid;
      default:
        return false;
    }
  }

  /**
   * التحقق من صحة جميع النماذج
   * Validate all forms
   */
  validateAllForms(): boolean {
    return this.studentForm.valid && this.paymentForm.valid;
  }

  /**
   * تحديث validators حسب طريقة الدفع
   * Update validators based on payment method
   */
  private updatePaymentValidators(): void {
    const method = this.selectedPaymentMethod();

    // Clear all validators first
    Object.keys(this.paymentForm.controls).forEach(key => {
      if (['termsAccepted', 'privacyAccepted', 'marketingAccepted'].includes(key)) return;
      this.paymentForm.get(key)?.clearValidators();
      this.paymentForm.get(key)?.updateValueAndValidity();
    });

    // Add validators based on payment method
    if (method === 'credit_card') {
      this.paymentForm.get('cardNumber')?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
      this.paymentForm.get('cardholderName')?.setValidators([Validators.required]);
      this.paymentForm.get('expiryMonth')?.setValidators([Validators.required, Validators.min(1), Validators.max(12)]);
      this.paymentForm.get('expiryYear')?.setValidators([Validators.required, Validators.min(new Date().getFullYear())]);
      this.paymentForm.get('cvv')?.setValidators([Validators.required, Validators.pattern(/^\d{3,4}$/)]);
    } else if (method === 'bank_transfer') {
      this.paymentForm.get('bankName')?.setValidators([Validators.required]);
      this.paymentForm.get('accountNumber')?.setValidators([Validators.required]);
      this.paymentForm.get('transferReference')?.setValidators([Validators.required]);
    }

    // Update all controls
    Object.keys(this.paymentForm.controls).forEach(key => {
      this.paymentForm.get(key)?.updateValueAndValidity();
    });
  }

  /**
   * تنسيق السعر
   * Format price
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  /**
   * الحصول على أشهر انتهاء البطاقة
   * Get expiry months
   */
  getExpiryMonths(): number[] {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }

  /**
   * الحصول على سنوات انتهاء البطاقة
   * Get expiry years
   */
  getExpiryYears(): number[] {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 20 }, (_, i) => currentYear + i);
  }

  /**
   * الرجوع لصفحة الباقات
   * Go back to plans
   */
  goBackToPlans(): void {
    this.router.navigate(['/subscription/plans']);
  }
}
