import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  SubscriptionPlanDisplay,
  SubscriptionFilter,
  SubscriptionType,
  PaymentType
} from '../../models/subscription.models';
import { SubscriptionService } from '../../core/services/subscription.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-plans.component.html',
  styleUrls: ['./subscription-plans.component.scss']
})
export class SubscriptionPlansComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State signals
  plans = signal<SubscriptionPlanDisplay[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedFilter = signal<SubscriptionType | 'all'>('all');
  selectedPaymentType = signal<PaymentType | 'all'>('all');
  selectedYear = signal<number>(4); // Default to Year 4

  // Computed signals
  filteredPlans = computed(() => {
    const allPlans = this.plans();
    const filter = this.selectedFilter();
    const paymentType = this.selectedPaymentType();

    return allPlans.filter(plan => {
      if (filter !== 'all' && plan.type !== filter) return false;
      if (paymentType !== 'all' && plan.paymentType !== paymentType) return false;
      return true;
    }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  });

  // Filter options
  filterOptions = [
    { value: 'all', label: 'All Plans', labelAr: 'All Plans' },
    { value: 'terms_1_2', label: 'Terms 1 & 2', labelAr: 'Terms 1 & 2' },
    { value: 'terms_3_4', label: 'Terms 3 & 4', labelAr: 'Terms 3 & 4' },
    { value: 'full_year', label: 'Full Year', labelAr: 'Full Year' }
  ];

  paymentTypeOptions = [
    { value: 'all', label: 'All Payment Types', labelAr: 'All Payment Types' },
    { value: 'one_time', label: 'One Time', labelAr: 'One Time' },
    { value: 'monthly', label: 'Monthly', labelAr: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly', labelAr: 'Quarterly' },
    { value: 'yearly', label: 'Yearly', labelAr: 'Yearly' }
  ];

  yearOptions = [
    { value: 1, label: 'Year 1', labelAr: 'Year 1' },
    { value: 2, label: 'Year 2', labelAr: 'Year 2' },
    { value: 3, label: 'Year 3', labelAr: 'Year 3' },
    { value: 4, label: 'Year 4', labelAr: 'Year 4' },
    { value: 5, label: 'Year 5', labelAr: 'Year 5' },
    { value: 6, label: 'Year 6', labelAr: 'Year 6' },
    { value: 7, label: 'Year 7', labelAr: 'Year 7' }
  ];

  constructor(
    private route: ActivatedRoute,
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check for query parameters to pre-select filters
    this.route.queryParams.subscribe((params: any) => {
      if (params['filter']) {
        this.selectedFilter.set(params['filter']);
      }
      if (params['paymentType']) {
        this.selectedPaymentType.set(params['paymentType']);
      }
    });

    this.loadPlans();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

    /**
   * Load available plans
   * Load available plans
   */
  private loadPlans(): void {
    this.loading.set(true);
    this.error.set(null);

    const filter: SubscriptionFilter = {};

    this.subscriptionService.getDisplayPlans(filter, this.selectedYear())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (plans) => {
          this.plans.set(plans);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading plans:', error);
          this.error.set('Failed to load subscription plans. Please try again.');
          this.loading.set(false);
        }
      });
  }

  /**
   * Apply filters
   * Apply filters
   */
  onFilterChange(filter: SubscriptionType | 'all'): void {
    this.selectedFilter.set(filter);
  }

  onPaymentTypeChange(paymentType: PaymentType | 'all'): void {
    this.selectedPaymentType.set(paymentType);
  }

  /**
   * Select plan for purchase
   * Select plan for purchase
   */
  selectPlan(plan: SubscriptionPlanDisplay): void {
    if (!this.authService.isAuthenticated()) {
      // Redirect to login page
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/subscription/checkout/${plan.id}?yearId=${this.selectedYear()}` }
      });
      return;
    }

    // Navigate to checkout page with selected year
    this.router.navigate(['/subscription/checkout', plan.id], {
      queryParams: { yearId: this.selectedYear() }
    });
  }

  /**
   * View plan details
   * View plan details
   */
  viewPlanDetails(plan: SubscriptionPlanDisplay): void {
    this.router.navigate(['/courses', plan.id]);
  }

  /**
   * Get plan type display text
   * Get plan type display text
   */
  getPlanTypeDisplay(type: SubscriptionType | string | undefined): string {
    const typeMap: any = {
      'terms_1_2': 'Terms 1 & 2',
      'terms_3_4': 'Terms 3 & 4',
      'full_year': 'Full Academic Year',
      'single_term': 'Single Term',
      'single_subject': 'Single Subject',
      'subject': 'Subject Plan'
    };
    return typeMap[type as string] || type || 'Plan';
  }

  /**
   * Get payment type display text
   * Get payment type display text
   */
  getPaymentTypeDisplay(paymentType: PaymentType | string | undefined): string {
    const typeMap: any = {
      'one_time': 'One-time Payment',
      'monthly': 'Monthly Billing',
      'quarterly': 'Quarterly Billing',
      'yearly': 'Annual Billing'
    };
    return typeMap[paymentType as string] || paymentType || 'Monthly';
  }

  /**
   * Get CSS class for plan card
   * Get CSS class for plan card
   */
  getPlanCardClass(plan: SubscriptionPlanDisplay): string {
    const baseClass = 'plan-card';
    if (plan.mostPopular) return `${baseClass} most-popular`;
    if (plan.recommended) return `${baseClass} recommended`;
    return baseClass;
  }

  /**
   * Format price
   * Format price
   */
  formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  /**
   * Calculate savings
   * Calculate savings
   */
  calculateTotalSavings(plan: SubscriptionPlanDisplay): number {
    return plan.currentOriginalPrice - plan.currentPrice;
  }

  /**
   * Check if plan has discount
   * Check if plan has discount
   */
  hasDiscount(plan: SubscriptionPlanDisplay): boolean {
    return plan.currentDiscountPercentage > 0;
  }

  /**
   * Change selected year
   * Change selected year
   */
  onYearChange(yearId: number): void {
    this.selectedYear.set(yearId);
    this.loadPlans(); // Reload plans with new year
  }

  /**
   * Get selected year name
   * Get selected year name
   */
  getSelectedYearName(): string {
    const yearOption = this.yearOptions.find(y => y.value === this.selectedYear());
    return yearOption ? yearOption.label : 'Year 4';
  }

  /**
   * Get validity description
   * Get validity description
   */
  getValidityDescription(plan: SubscriptionPlanDisplay): string {
    if (plan.paymentType === 'monthly') {
      return 'Monthly subscription';
    } else if (plan.paymentType === 'yearly') {
      return 'Annual subscription';
    } else {
      return `Valid for ${plan.validityPeriod} months`;
    }
  }

  /**
   * Reload plans
   * Reload plans
   */
  reloadPlans(): void {
    this.loadPlans();
  }
}
