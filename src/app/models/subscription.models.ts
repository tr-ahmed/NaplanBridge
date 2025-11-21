/**
 * Subscription and Payment Models
 * Based on Backend API Documentation - PAYMENT_SUBSCRIPTION_GUIDE.md
 */

import { PlanType, OrderStatus, SubscriptionStatus as SubscriptionStatusEnum } from './enums';

// ============================================
// Plan Types (imported from enums.ts)
// ============================================
// PlanType enum is now centralized in enums.ts
// Values: SingleTerm = 1, MultiTerm = 2, FullYear = 3, SubjectAnnual = 4

// ============================================
// Subscription Status
// ============================================

export type SubscriptionStatus = 'Active' | 'Expired' | 'Pending' | 'Suspended' | 'Cancelled';

export const SubscriptionStatuses = {
  ACTIVE: 'Active' as SubscriptionStatus,
  EXPIRED: 'Expired' as SubscriptionStatus,
  PENDING: 'Pending' as SubscriptionStatus,
  SUSPENDED: 'Suspended' as SubscriptionStatus,
  CANCELLED: 'Cancelled' as SubscriptionStatus
};

// ============================================
// Subscription Plan Models
// ============================================

export interface SubscriptionPlan {
  id: number;
  planId?: number;  // Alternative ID field
  name: string;
  description: string;
  price: number;
  
  // ✅ Discount fields (calculated by backend)
  originalPrice?: number;           // Original price before discount
  discountPercentage?: number;      // Discount percentage (e.g., 10 for 10%)
  saveAmount?: number;              // Amount saved (originalPrice - price)
  
  planType: PlanType;

  // Relations
  subjectId?: number;
  subjectName?: string;
  termId?: number;
  termNumber?: number;
  yearId?: number;                  // ✅ Optional for all plan types

  // Duration
  durationInDays?: number;
  duration?: string;                // ✅ Human-readable (e.g., "3 months")

  // For MultiTerm plans
  includedTermIds?: string;         // e.g., "12,13" or "14,15"
  coverageDescription?: string;     // ✅ Coverage description field

  // Status
  isActive: boolean;
  isRecommended?: boolean;          // ✅ Highlight recommended plans

  // Features (optional)
  features?: string[];
  
  // Payment integration
  stripePriceId?: string;
  currency?: string;                // ✅ Currency code (e.g., "USD")

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// Available Plans for Student
// ============================================

export interface AvailablePlan {
  planId: number;
  name: string;
  description: string;
  price: number;
  planType: PlanType;
  coverageDescription: string; // e.g., "Algebra - Term 1" or "All Subjects - Grade 7"
  isActive: boolean;
  isPopular?: boolean;
  discount?: number;
}

// ============================================
// Student Subscription Models
// ============================================

export interface StudentSubscription {
  id: number;
  studentId: number;
  planId: number;

  // Plan Details
  planName: string;
  planType: PlanType;

  // Subject/Year Info
  subjectId?: number;
  subjectName?: string;
  yearId?: number;

  // Dates
  startDate: Date;
  endDate: Date;

  // Status
  status: SubscriptionStatus;
  isActive: boolean;

  // Payment
  amountPaid: number;
  paymentMethod?: string;

  // Metadata
  createdAt: Date;
  autoRenew?: boolean;
}

export interface StudentSubscriptionDetails extends StudentSubscription {
  accessibleSubjects?: AccessibleSubject[];
  accessibleTerms?: AccessibleTerm[];
  accessibleLessons?: AccessibleLesson[];
}

// ============================================
// Accessible Content Models
// ============================================

export interface AccessibleSubject {
  subjectId: number;
  subjectName: string;
  termIds: number[];
}

export interface AccessibleTerm {
  termId: number;
  termNumber: number;
  subjectId: number;
  subjectName: string;
}

export interface AccessibleLesson {
  lessonId: number;
  lessonTitle: string;
  weekId: number;
  termId: number;
  subjectId: number;
}

// ============================================
// Access Check Models
// ============================================

export interface AccessCheckResponse {
  hasAccess: boolean;
  reason?: string;
  requiresPlan?: AvailablePlan;
}

// ============================================
// Create/Update Subscription Plan DTOs
// ============================================

export interface CreateSubscriptionPlanDto {
  name: string;
  description: string;
  price: number;
  planType: PlanType;
  isActive?: boolean;        // افتراضي true
  subjectId?: number;        // ✅ Required for SingleTerm, MultiTerm, SubjectAnnual
  termId?: number;           // ✅ Required for SingleTerm only
  yearId?: number;           // ✅ Optional - mainly for FullYear plans
  includedTermIds?: string;  // ✅ Required for MultiTerm plans (e.g., "12,13")
  durationInDays?: number;   // ✅ Optional - calculated by backend if not provided
  features?: string[];       // ✅ Optional - plan features list
}

export interface UpdateSubscriptionPlanDto {
  name?: string;
  description?: string;
  price?: number;
  planType?: PlanType;
  subjectId?: number;
  termId?: number;
  yearId?: number;
  durationInDays?: number;
  includedTermIds?: string;
  isActive?: boolean;
  features?: string[];
}

// Legacy types for backward compatibility
export type SubscriptionType = 'terms_1_2' | 'terms_3_4' | 'full_year' | 'single_term' | 'single_subject';
export type PaymentType = 'one_time' | 'monthly' | 'quarterly' | 'yearly';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe' | 'cash' | 'apple_pay' | 'google_pay';

/**
 * معلومات الدفع
 * Payment Information
 */
export interface SubscriptionPayment {
  id: number;
  subscriptionId: number;
  studentId: number;
  planId: number;

  // معلومات الدفع
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded';

  // معلومات المعاملة
  transactionId?: string;
  invoiceNumber: string;
  receiptUrl?: string;

  // التواريخ
  paymentDate: Date;
  dueDate?: Date;

  // معلومات إضافية
  description?: string;
  failureReason?: string;
  refundReason?: string;

  // معلومات تقنية
  createdAt: Date;
  updatedAt: Date;
}

/**
 * خصم أو كوبون
 * Discount/Coupon
 */
export interface SubscriptionDiscount {
  id: number;
  code: string;
  name: string;
  nameAr: string;

  // نوع الخصم
  type: 'percentage' | 'fixed_amount';
  value: number;
  maxDiscount?: number; // أقصى مبلغ خصم للنسبة المئوية

  // الصلاحية
  validFrom: Date;
  validTo: Date;
  maxUses: number;
  usedCount: number;

  // القيود
  applicablePlans: number[]; // الباقات المطبقة عليها
  minOrderAmount?: number;
  newCustomersOnly: boolean;

  // الحالة
  isActive: boolean;

  // معلومات تقنية
  createdAt: Date;
  updatedAt: Date;
}

/**
 * فلتر البحث عن الباقات
 * Subscription Plans Filter
 */
export interface SubscriptionFilter {
  type?: SubscriptionType;
  paymentType?: PaymentType;
  minPrice?: number;
  maxPrice?: number;
  yearId?: number;
  termIds?: number[];
  subjectIds?: number[];
  isActive?: boolean;
}

/**
 * إحصائيات الاشتراك
 * Subscription Statistics
 */
export interface SubscriptionStats {
  totalActiveSubscriptions: number;
  totalRevenue: number;
  averageSubscriptionValue: number;
  popularPlan: SubscriptionPlan;
  monthlyGrowth: number;
  conversionRate: number;
  churnRate: number;
}

/**
 * بيانات عملية الشراء
 * Purchase Data
 */
export interface SubscriptionPurchase {
  planId: number;
  studentId: number;
  parentId?: number;
  paymentMethod: PaymentMethod;
  discountCode?: string;

  // بيانات الدفع
  cardDetails?: {
    cardNumber: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    cardholderName: string;
  };

  // بيانات التحويل البنكي
  bankTransferDetails?: {
    bankName: string;
    accountNumber: string;
    transferReference: string;
    transferDate: Date;
  };

  // معلومات إضافية
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  // اتفاقية الشروط
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingAccepted: boolean;
}

/**
 * استجابة عملية الشراء
 * Purchase Response
 */
export interface SubscriptionPurchaseResponse {
  success: boolean;
  subscriptionId?: string;
  paymentId?: number;
  message: string;
  errors?: string[];
  redirectUrl?: string; // للدفع الخارجي
}

/**
 * معلومات الباقة للعرض
 * Plan Display Information
 */
export interface SubscriptionPlanDisplay extends SubscriptionPlan {
  // معلومات محسوبة للعرض - خاصة بسنة معينة
  selectedYearId: number;
  currentPrice: number;
  currentOriginalPrice: number;
  currentDiscountPercentage: number;
  monthlyPrice: number;
  totalSubjects: number;
  totalLessons: number;
  estimatedHours: number;

  // معلومات التفاصيل
  includedSubjects: string[];
  includedTerms: string[];
  benefits: string[];
  benefitsAr: string[];
  features?: string[];

  // Additional properties
  nameAr?: string;
  type?: string;
  paymentType?: string;
  sortOrder?: number;
  validityPeriod?: number;

  // مقارنة مع الباقات الأخرى
  savings?: number;
  mostPopular?: boolean;
  recommended?: boolean;
}/**
 * حالة تقدم الطالب في الاشتراك
 * Student Progress in Subscription
 */
export interface SubscriptionProgress {
  subscriptionId: number;
  studentId: number;

  // التقدم العام
  overallProgress: number;

  // التقدم لكل مادة
  subjectProgress: {
    subjectId: number;
    subjectName: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
    timeSpent: number; // بالدقائق
  }[];

  // التقدم لكل فصل
  termProgress: {
    termId: number;
    termName: string;
    progress: number;
    startDate: Date;
    endDate: Date;
    isCurrentTerm: boolean;
  }[];

  // الإنجازات
  achievements: {
    id: number;
    name: string;
    description: string;
    earnedDate: Date;
    iconUrl: string;
  }[];

  // الإحصائيات
  totalTimeSpent: number;
  averageScore: number;
  streakDays: number;
  lastActivityDate: Date;
}
