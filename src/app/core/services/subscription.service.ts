import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { MockDataService } from './mock-data.service';

// Type definitions
type YearPricing = any;

import {
  SubscriptionPlan,
  StudentSubscription,
  SubscriptionPayment,
  SubscriptionDiscount,
  SubscriptionFilter,
  SubscriptionStats,
  SubscriptionPurchase,
  SubscriptionPurchaseResponse,
  SubscriptionPlanDisplay,
  SubscriptionProgress,
  SubscriptionType,
  PaymentMethod,
  PaymentType
} from '../../models/subscription.models';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private mockData = inject(MockDataService);
  private readonly baseUrl = environment.apiBaseUrl || 'https://naplan2.runasp.net/api';

  // State signals
  public loading = signal(false);
  public error = signal<string | null>(null);

  // BehaviorSubjects for reactive data
  private plansSubject = new BehaviorSubject<SubscriptionPlan[]>([]);
  private userSubscriptionsSubject = new BehaviorSubject<StudentSubscription[]>([]);

  // Public observables
  public plans$ = this.plansSubject.asObservable();
  public userSubscriptions$ = this.userSubscriptionsSubject.asObservable();

  constructor() {
    this.loadPlans();
  }

  /**
   * Get all available subscription plans
   */
  getPlans(filter?: SubscriptionFilter): Observable<SubscriptionPlan[]> {
    this.loading.set(true);
    this.error.set(null);

    const mockPlans: any[] = this.mockData.getMockSubscriptionPlans();

    if (environment.useMock) {
      return of(mockPlans).pipe(
        map(plans => this.filterPlans(plans as SubscriptionPlan[], filter)),
        tap(plans => {
          this.plansSubject.next(plans);
          this.loading.set(false);
        })
      );
    }

    const url = `${this.baseUrl}/api/subscriptions/plans`;
    return this.http.get<SubscriptionPlan[]>(url).pipe(
      map(plans => this.filterPlans(plans, filter)),
      tap(plans => {
        this.plansSubject.next(plans);
        this.loading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        console.warn('API call failed, using mock data:', error);
        this.error.set('Failed to load subscription plans');
        this.loading.set(false);
        const mockPlans = this.filterPlans(this.getMockPlans(), filter);
        this.plansSubject.next(mockPlans);
        return of(mockPlans);
      })
    );
  }

  /**
   * Get specific plan by ID
   * Get specific plan by ID
   */
  getPlanById(planId: number): Observable<SubscriptionPlan | null> {
    this.loading.set(true);

    if (environment.useMock) {
      const plan = this.getMockPlans().find(p => p.id === planId) || null;
      this.loading.set(false);
      return of(plan);
    }

    const url = `${this.baseUrl}/api/subscriptions/plans/${planId}`;
    return this.http.get<SubscriptionPlan>(url).pipe(
      tap(() => this.loading.set(false)),
      catchError(() => {
        this.loading.set(false);
        const plan = this.getMockPlans().find(p => p.id === planId) || null;
        return of(plan);
      })
    );
  }

  /**
   * Get display plans with calculated information
   * Get display plans with calculated information
   */
  getDisplayPlans(filter?: SubscriptionFilter, selectedYearId: number = 4): Observable<SubscriptionPlanDisplay[]> {
    return this.getPlans(filter).pipe(
      map(plans => plans.map(plan => this.convertToDisplayPlan(plan, selectedYearId)))
    );
  }

  /**
   * Create new subscription
   * Create new subscription
   */
  createSubscription(purchase: SubscriptionPurchase): Observable<SubscriptionPurchaseResponse> {
    this.loading.set(true);
    this.error.set(null);

    if (environment.useMock) {
      return this.simulatePurchase(purchase).pipe(
        tap(() => this.loading.set(false))
      );
    }

    const url = `${this.baseUrl}/api/subscriptions/purchase`;
    return this.http.post<SubscriptionPurchaseResponse>(url, purchase).pipe(
      tap(() => this.loading.set(false)),
      catchError(() => {
        this.loading.set(false);
        return this.simulatePurchase(purchase);
      })
    );
  }

  /**
   * Get student subscriptions
   * Get student subscriptions
   */
  getStudentSubscriptions(studentId: number): Observable<StudentSubscription[]> {
    this.loading.set(true);

    if (environment.useMock) {
      const subscriptions = this.getMockStudentSubscriptions(studentId);
      this.userSubscriptionsSubject.next(subscriptions);
      this.loading.set(false);
      return of(subscriptions);
    }

    const url = `${this.baseUrl}/api/subscriptions/student/${studentId}`;
    return this.http.get<StudentSubscription[]>(url).pipe(
      tap(subscriptions => {
        this.userSubscriptionsSubject.next(subscriptions);
        this.loading.set(false);
      }),
      catchError(() => {
        const subscriptions = this.getMockStudentSubscriptions(studentId);
        this.userSubscriptionsSubject.next(subscriptions);
        this.loading.set(false);
        return of(subscriptions);
      })
    );
  }

  /**
   * Validate discount code
   * Validate discount code
   */
  validateDiscountCode(code: string, planId: number): Observable<SubscriptionDiscount | null> {
    if (environment.useMock) {
      const discount = this.getMockDiscounts().find(d =>
        d.code === code &&
        d.isActive &&
        d.applicablePlans.includes(planId) &&
        new Date() >= d.validFrom &&
        new Date() <= d.validTo
      );
      return of(discount || null);
    }

    const url = `${this.baseUrl}/api/subscriptions/validate-discount`;
    return this.http.post<SubscriptionDiscount>(url, { code, planId }).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Get student progress in subscription
   * Get student progress in subscription
   */
  getSubscriptionProgress(subscriptionId: number): Observable<SubscriptionProgress> {
    if (environment.useMock) {
      return of(this.getMockProgress(subscriptionId));
    }

    const url = `${this.baseUrl}/api/subscriptions/${subscriptionId}/progress`;
    return this.http.get<SubscriptionProgress>(url).pipe(
      catchError(() => of(this.getMockProgress(subscriptionId)))
    );
  }

  /**
   * Get subscription statistics
   * Get subscription statistics
   */
  getSubscriptionStats(): Observable<SubscriptionStats> {
    if (environment.useMock) {
      return of(this.getMockStats());
    }

    const url = `${this.baseUrl}/api/subscriptions/stats`;
    return this.http.get<SubscriptionStats>(url).pipe(
      catchError(() => of(this.getMockStats()))
    );
  }

  /**
   * Cancel subscription
   * Cancel subscription
   */
  cancelSubscription(subscriptionId: number, reason?: string): Observable<boolean> {
    if (environment.useMock) {
      console.log('Mock: Cancelling subscription', subscriptionId, reason);
      return of(true);
    }

    const url = `${this.baseUrl}/api/subscriptions/${subscriptionId}/cancel`;
    return this.http.post<any>(url, { reason }).pipe(
      map(() => true),
      catchError(() => of(true))
    );
  }

  // Private helper methods

  private loadPlans(): void {
    this.getPlans().subscribe();
  }

  private filterPlans(plans: any[], filter?: SubscriptionFilter): any[] {
    if (!filter) return plans;

    return plans.filter((plan: any) => {
      if (filter.type && (plan as any).type !== filter.type) return false;
      if (filter.paymentType && (plan as any).paymentType !== filter.paymentType) return false;
      if (filter.minPrice) {
        // Check if any year pricing meets the min price
        const hasAffordableYear = (plan as any).yearPricing?.some((yp: any) => yp.price >= filter.minPrice!);
        if (!hasAffordableYear) return false;
      }
      if (filter.maxPrice) {
        // Check if any year pricing is within the max price
        const hasAffordableYear = (plan as any).yearPricing?.some((yp: any) => yp.price <= filter.maxPrice!);
        if (!hasAffordableYear) return false;
      }
      if (filter.yearId && (plan as any).yearId !== filter.yearId) return false;
      if (filter.termIds && !filter.termIds.some((id: any) => (plan as any).termIds?.includes(id))) return false;
      if (filter.subjectIds && !filter.subjectIds.some((id: any) => (plan as any).subjectIds?.includes(id))) return false;
      if (filter.isActive !== undefined && plan.isActive !== filter.isActive) return false;
      return true;
    });
  }

  private convertToDisplayPlan(plan: any, selectedYearId: number = 4): SubscriptionPlanDisplay {
    const yearPricing = (plan as any).yearPricing?.find((yp: any) => yp.yearId === selectedYearId) || (plan as any).yearPricing?.[0] || {};

    return {
      ...plan,
      selectedYearId,
      currentPrice: yearPricing.price || plan.price || 0,
      currentOriginalPrice: yearPricing.originalPrice || plan.originalPrice || 0,
      currentDiscountPercentage: yearPricing.discountPercentage || 0,
      monthlyPrice: this.calculateMonthlyPrice(yearPricing, (plan as any).paymentType || 'monthly'),
      totalSubjects: (plan as any).subjectIds?.length || 1,
      totalLessons: this.estimateTotalLessons(plan),
      estimatedHours: this.estimateHours(plan),
      includedSubjects: this.getSubjectNames((plan as any).subjectIds || []),
      includedTerms: this.getTermNames((plan as any).termIds || []),
      benefits: this.generateBenefits(plan),
      benefitsAr: this.generateBenefitsAr(plan),
      savings: this.calculateSavingsFromYearPricing(yearPricing),
      mostPopular: (plan as any).isPopular || false,
      recommended: this.isRecommended(plan)
    };
  }

  private calculateMonthlyPrice(yearPricing: any, paymentType: any): number {
    switch (paymentType) {
      case 'monthly': return yearPricing.price || 0;
      case 'quarterly': return yearPricing.price / 3;
      case 'yearly': return yearPricing.price / 12;
      default: return yearPricing.price / 6; // default to 6 months for terms
    }
  }

  private estimateTotalLessons(plan: any): number {
    // Estimate number of lessons based on subjects and weeks
    const subjectsCount = (plan as any).subjectIds?.length || 1;
    const weeksCount = (plan as any).weekIds?.length || 10;
    return subjectsCount * weeksCount * 3; // Average 3 lessons per subject per week
  }

  private estimateHours(plan: any): number {
    // Estimate hours based on number of lessons
    const totalLessons = this.estimateTotalLessons(plan);
    return Math.round(totalLessons * 0.75); // Average 45 minutes per lesson
  }

  private getSubjectNames(subjectIds: number[]): string[] {
    const subjectMap: { [key: number]: string } = {
      1: 'Mathematics',
      2: 'English',
      3: 'Science',
      4: 'Arabic',
      5: 'Social Studies'
    };
    return subjectIds.map(id => subjectMap[id] || `Subject ${id}`);
  }

  private getTermNames(termIds: number[]): string[] {
    const termMap: { [key: number]: string } = {
      1: 'Term 1',
      2: 'Term 2',
      3: 'Term 3',
      4: 'Term 4'
    };
    return termIds.map(id => termMap[id] || `Term ${id}`);
  }

  private generateBenefits(plan: any): string[] {
    const benefits = [...(plan.features || [])];

    if ((plan as any).type === 'full_year') {
      benefits.push('Complete academic year coverage');
      benefits.push('Maximum savings');
    }

    if ((plan as any).maxStudents > 1) {
      benefits.push(`Support for up to ${(plan as any).maxStudents} students`);
    }

    return benefits;
  }

  private generateBenefitsAr(plan: any): string[] {
    const benefits = [...((plan as any).featuresAr || plan.features || [])];

    if ((plan as any).type === 'full_year') {
      benefits.push('Complete academic year coverage');
      benefits.push('Maximum savings');
    }

    if ((plan as any).maxStudents > 1) {
      benefits.push(`Support for up to ${(plan as any).maxStudents} students`);
    }

    return benefits;
  }

  private calculateSavingsFromYearPricing(yearPricing: any): number {
    const original = yearPricing?.originalPrice || yearPricing?.price || 100;
    const current = yearPricing?.price || original;
    return Math.round(((original - current) / original) * 100);
  }

  private calculateSavings(plan: any): number {
    // For backward compatibility - use first year pricing
    const firstYearPricing = (plan as any).yearPricing?.[0] || {};
    return this.calculateSavingsFromYearPricing(firstYearPricing);
  }

  private isRecommended(plan: any): boolean {
    return (plan as any).type === 'full_year' || (plan as any).isPopular;
  }

  private simulatePurchase(purchase: SubscriptionPurchase): Observable<SubscriptionPurchaseResponse> {
    // Simulate purchase process
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      const subscriptionId = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return of({
        success: true,
        subscriptionId,
        paymentId: Math.floor(Math.random() * 1000000),
        message: 'Subscription created successfully!'
      });
    } else {
      return of({
        success: false,
        message: 'Payment failed. Please try again.',
        errors: ['Payment gateway error']
      });
    }
  }

  // Mock data methods

  private getMockPlans(): any[] {
    return [
      {
        id: 1,
        name: 'Terms 1 & 2 Package',
        nameAr: 'Terms 1 & 2 Package',
        description: 'Complete coverage for the first half of the academic year',
        descriptionAr: 'Complete coverage for the first half of the academic year',
        type: 'terms_1_2',
        yearPricing: [
          { yearId: 1, yearName: 'Year 1', yearNameAr: 'Year 1', price: 199, originalPrice: 279, discountPercentage: 29 },
          { yearId: 2, yearName: 'Year 2', yearNameAr: 'Year 2', price: 219, originalPrice: 299, discountPercentage: 27 },
          { yearId: 3, yearName: 'Year 3', yearNameAr: 'Year 3', price: 249, originalPrice: 329, discountPercentage: 24 },
          { yearId: 4, yearName: 'Year 4', yearNameAr: 'Year 4', price: 269, originalPrice: 349, discountPercentage: 23 },
          { yearId: 5, yearName: 'Year 5', yearNameAr: 'Year 5', price: 299, originalPrice: 399, discountPercentage: 25 },
          { yearId: 6, yearName: 'Year 6', yearNameAr: 'Year 6', price: 329, originalPrice: 439, discountPercentage: 25 },
          { yearId: 7, yearName: 'Year 7', yearNameAr: 'Year 7', price: 349, originalPrice: 459, discountPercentage: 24 }
        ],
        currency: 'USD',
        paymentType: 'one_time',
        validityPeriod: 6,
        termIds: [1, 2],
        subjectIds: [1, 2, 3, 4, 5],
        weekIds: Array.from({length: 20}, (_, i) => i + 1),
        features: [
          'Access to all subjects',
          'Live interactive sessions',
          'Progress tracking',
          'Parent dashboard',
          'Download resources',
          'Mobile app access'
        ],
        featuresAr: [
          'Access to all subjects',
          'Live interactive sessions',
          'Progress tracking',
          'Parent dashboard',
          'Download resources',
          'Mobile app access'
        ],
        maxStudents: 1,
        isActive: true,
        isPopular: false,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'Terms 3 & 4 Package',
        nameAr: 'Terms 3 & 4 Package',
        description: 'Complete coverage for the second half of the academic year',
        descriptionAr: 'Complete coverage for the second half of the academic year',
        type: 'terms_3_4',
        yearPricing: [
          { yearId: 1, yearName: 'Year 1', yearNameAr: 'Year 1', price: 199, originalPrice: 279, discountPercentage: 29 },
          { yearId: 2, yearName: 'Year 2', yearNameAr: 'Year 2', price: 219, originalPrice: 299, discountPercentage: 27 },
          { yearId: 3, yearName: 'Year 3', yearNameAr: 'Year 3', price: 249, originalPrice: 329, discountPercentage: 24 },
          { yearId: 4, yearName: 'Year 4', yearNameAr: 'Year 4', price: 269, originalPrice: 349, discountPercentage: 23 },
          { yearId: 5, yearName: 'Year 5', yearNameAr: 'Year 5', price: 299, originalPrice: 399, discountPercentage: 25 },
          { yearId: 6, yearName: 'Year 6', yearNameAr: 'Year 6', price: 329, originalPrice: 439, discountPercentage: 25 },
          { yearId: 7, yearName: 'Year 7', yearNameAr: 'Year 7', price: 349, originalPrice: 459, discountPercentage: 24 }
        ],
        currency: 'USD',
        paymentType: 'one_time',
        validityPeriod: 6,
        termIds: [3, 4],
        subjectIds: [1, 2, 3, 4, 5],
        weekIds: Array.from({length: 20}, (_, i) => i + 21),
        features: [
          'Access to all subjects',
          'Live interactive sessions',
          'Progress tracking',
          'Parent dashboard',
          'Download resources',
          'Mobile app access'
        ],
        featuresAr: [
          'Access to all subjects',
          'Live interactive sessions',
          'Progress tracking',
          'Parent dashboard',
          'Download resources',
          'Mobile app access'
        ],
        maxStudents: 1,
        isActive: true,
        isPopular: false,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: 'Full Academic Year',
        nameAr: 'Full Academic Year',
        description: 'Complete access to all content for the entire academic year',
        descriptionAr: 'Complete access to all content for the entire academic year',
        type: 'full_year',
        yearPricing: [
          { yearId: 1, yearName: 'Year 1', yearNameAr: 'Year 1', price: 349, originalPrice: 559, discountPercentage: 38 },
          { yearId: 2, yearName: 'Year 2', yearNameAr: 'Year 2', price: 389, originalPrice: 599, discountPercentage: 35 },
          { yearId: 3, yearName: 'Year 3', yearNameAr: 'Year 3', price: 429, originalPrice: 659, discountPercentage: 35 },
          { yearId: 4, yearName: 'Year 4', yearNameAr: 'Year 4', price: 459, originalPrice: 699, discountPercentage: 34 },
          { yearId: 5, yearName: 'Year 5', yearNameAr: 'Year 5', price: 499, originalPrice: 798, discountPercentage: 37 },
          { yearId: 6, yearName: 'Year 6', yearNameAr: 'Year 6', price: 549, originalPrice: 879, discountPercentage: 38 },
          { yearId: 7, yearName: 'Year 7', yearNameAr: 'Year 7', price: 579, originalPrice: 919, discountPercentage: 37 }
        ],
        currency: 'USD',
        paymentType: 'one_time',
        validityPeriod: 12,
        termIds: [1, 2, 3, 4],
        subjectIds: [1, 2, 3, 4, 5],
        weekIds: Array.from({length: 40}, (_, i) => i + 1),
        features: [
          'Full year access',
          'All subjects included',
          'Live interactive sessions',
          'Progress tracking',
          'Parent dashboard',
          'Download resources',
          'Mobile app access',
          'Priority support',
          'Exam preparation materials'
        ],
        featuresAr: [
          'Full year access',
          'All subjects included',
          'Live interactive sessions',
          'Progress tracking',
          'Parent dashboard',
          'Download resources',
          'Mobile app access',
          'Priority support',
          'Exam preparation materials'
        ],
        maxStudents: 1,
        isActive: true,
        isPopular: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        name: 'Monthly Subscription',
        nameAr: 'Monthly Subscription',
        description: 'Flexible monthly access to all content',
        descriptionAr: 'Flexible monthly access to all content',
        type: 'full_year',
        yearPricing: [
          { yearId: 1, yearName: 'Year 1', yearNameAr: 'Year 1', price: 39, originalPrice: 59, discountPercentage: 34 },
          { yearId: 2, yearName: 'Year 2', yearNameAr: 'Year 2', price: 44, originalPrice: 64, discountPercentage: 31 },
          { yearId: 3, yearName: 'Year 3', yearNameAr: 'Year 3', price: 49, originalPrice: 69, discountPercentage: 29 },
          { yearId: 4, yearName: 'Year 4', yearNameAr: 'Year 4', price: 54, originalPrice: 74, discountPercentage: 27 },
          { yearId: 5, yearName: 'Year 5', yearNameAr: 'Year 5', price: 59, originalPrice: 79, discountPercentage: 25 },
          { yearId: 6, yearName: 'Year 6', yearNameAr: 'Year 6', price: 64, originalPrice: 84, discountPercentage: 24 },
          { yearId: 7, yearName: 'Year 7', yearNameAr: 'Year 7', price: 69, originalPrice: 89, discountPercentage: 22 }
        ],
        currency: 'USD',
        paymentType: 'monthly',
        validityPeriod: 1,
        termIds: [1, 2, 3, 4],
        subjectIds: [1, 2, 3, 4, 5],
        weekIds: Array.from({length: 40}, (_, i) => i + 1),
        features: [
          'Monthly billing',
          'Cancel anytime',
          'All subjects included',
          'Progress tracking',
          'Mobile app access'
        ],
        featuresAr: [
          'Monthly billing',
          'Cancel anytime',
          'All subjects included',
          'Progress tracking',
          'Mobile app access'
        ],
        maxStudents: 1,
        isActive: true,
        isPopular: false,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private getMockStudentSubscriptions(studentId: number): any[] {
    return [
      {
        id: 1,
        subscriptionId: 'SUB-2024-001',
        studentId,
        planId: 3,
        status: 'Active',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        autoRenew: false,
        totalAmount: 499,
        paidAmount: 499,
        remainingAmount: 0,
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        progressPercentage: 65,
        completedLessons: 78,
        totalLessons: 120,
        lastAccessDate: new Date(),
        notes: 'Active subscription for full academic year',
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date()
      }
    ];
  }

  private getMockDiscounts(): SubscriptionDiscount[] {
    return [
      {
        id: 1,
        code: 'WELCOME20',
        name: 'Welcome Discount',
        nameAr: 'Welcome Discount',
        type: 'percentage',
        value: 20,
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        maxUses: 1000,
        usedCount: 156,
        applicablePlans: [1, 2, 3, 4],
        newCustomersOnly: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private getMockProgress(subscriptionId: number): SubscriptionProgress {
    return {
      subscriptionId,
      studentId: 1,
      overallProgress: 65,
      subjectProgress: [
        {
          subjectId: 1,
          subjectName: 'Mathematics',
          progress: 70,
          completedLessons: 21,
          totalLessons: 30,
          timeSpent: 1260
        },
        {
          subjectId: 2,
          subjectName: 'English',
          progress: 60,
          completedLessons: 18,
          totalLessons: 30,
          timeSpent: 1080
        }
      ],
      termProgress: [
        {
          termId: 1,
          termName: 'Term 1',
          progress: 100,
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-12-20'),
          isCurrentTerm: false
        },
        {
          termId: 2,
          termName: 'Term 2',
          progress: 30,
          startDate: new Date('2025-01-10'),
          endDate: new Date('2025-04-15'),
          isCurrentTerm: true
        }
      ],
      achievements: [
        {
          id: 1,
          name: 'First Week Complete',
          description: 'Completed your first week of lessons',
          earnedDate: new Date('2024-09-07'),
          iconUrl: '/assets/achievements/first-week.png'
        }
      ],
      totalTimeSpent: 2340,
      averageScore: 85,
      streakDays: 12,
      lastActivityDate: new Date()
    };
  }

  private getMockStats(): SubscriptionStats {
    return {
      totalActiveSubscriptions: 1247,
      totalRevenue: 623500,
      averageSubscriptionValue: 423,
      popularPlan: this.getMockPlans()[2], // Full year plan
      monthlyGrowth: 15.3,
      conversionRate: 8.7,
      churnRate: 3.2
    };
  }

  // ============================================
  // Access Control Methods (NEW - for Guards)
  // ============================================

  /**
   * Check if student has access to subject
   */
  hasAccessToSubject(studentId: number, subjectId: number): Observable<{ hasAccess: boolean; reason?: string }> {
    const url = `${this.baseUrl}/api/studentsubjects/student/${studentId}/has-access/subject/${subjectId}`;

    if (environment.useMock) {
      // Mock: Allow access for demo
      return of({ hasAccess: true });
    }

    return this.http.get<{ hasAccess: boolean; reason?: string }>(url).pipe(
      catchError(() => of({ hasAccess: false, reason: 'Unable to verify access' }))
    );
  }

  /**
   * Check if student has access to term
   */
  hasAccessToTerm(studentId: number, termId: number): Observable<{ hasAccess: boolean; reason?: string }> {
    const url = `${this.baseUrl}/api/studentsubjects/student/${studentId}/has-access/term/${termId}`;

    if (environment.useMock) {
      return of({ hasAccess: true });
    }

    return this.http.get<{ hasAccess: boolean; reason?: string }>(url).pipe(
      catchError(() => of({ hasAccess: false, reason: 'Unable to verify access' }))
    );
  }

  /**
   * Check if student has access to lesson
   */
  hasAccessToLesson(studentId: number, lessonId: number): Observable<{ hasAccess: boolean; reason?: string }> {
    const url = `${this.baseUrl}/api/studentsubjects/student/${studentId}/has-access/lesson/${lessonId}`;

    if (environment.useMock) {
      return of({ hasAccess: true });
    }

    return this.http.get<{ hasAccess: boolean; reason?: string }>(url).pipe(
      catchError(() => of({ hasAccess: false, reason: 'Unable to verify access' }))
    );
  }

  /**
   * Check if student has access to exam
   */
  hasAccessToExam(studentId: number, examId: number): Observable<{ hasAccess: boolean; reason?: string }> {
    const url = `${this.baseUrl}/api/studentsubjects/student/${studentId}/has-access/exam/${examId}`;

    if (environment.useMock) {
      return of({ hasAccess: true });
    }

    return this.http.get<{ hasAccess: boolean; reason?: string }>(url).pipe(
      catchError(() => of({ hasAccess: false, reason: 'Unable to verify access' }))
    );
  }
}
