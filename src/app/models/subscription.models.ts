/**
 * نماذج بيانات نظام الاشتراكات التعليمية
 * Educational Subscription System Models
 */

/**
 * نوع الباقة التعليمية
 * Educational Package Type
 */
export type SubscriptionType = 'terms_1_2' | 'terms_3_4' | 'full_year' | 'single_term' | 'single_subject';

/**
 * نوع الدفع
 * Payment Type
 */
export type PaymentType = 'one_time' | 'monthly' | 'quarterly' | 'yearly';

/**
 * حالة الاشتراك
 * Subscription Status
 */
export type SubscriptionStatus = 'active' | 'expired' | 'pending' | 'suspended' | 'cancelled';

/**
 * طرق الدفع المتاحة
 * Available Payment Methods
 */
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'paypal' | 'apple_pay' | 'google_pay' | 'cash';

/**
 * هيكل التسعير حسب السنة الدراسية
 * Year-based pricing structure
 */
export interface YearPricing {
  yearId: number;
  yearName: string; // "Year 3", "Year 4", etc.
  yearNameAr: string; // "السنة الثالثة", "السنة الرابعة", etc.
  price: number;
  originalPrice: number;
  discountPercentage: number;
}

/**
 * باقة الاشتراك التعليمية
 * Educational Subscription Plan
 */
export interface SubscriptionPlan {
  id: number;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  type: SubscriptionType;

  // معلومات السعر - متغيرة حسب السنة
  // Price information - varies by year
  yearPricing: YearPricing[];
  currency: string;
  paymentType: PaymentType;

  // معلومات التواريخ
  validityPeriod: number; // بالأشهر
  startDate?: Date;
  endDate?: Date;

  // النطاق التعليمي
  yearId?: number;
  termIds: number[]; // الفصول المشمولة
  subjectIds: number[]; // المواد المشمولة
  weekIds: number[]; // الأسابيع المشمولة

  // الميزات المتاحة
  features: string[];
  featuresAr: string[];

  // إعدادات إضافية
  maxStudents: number; // عدد الطلاب المسموح
  isActive: boolean;
  isPopular: boolean; // الباقة الأكثر شعبية
  sortOrder: number;  // معلومات تقنية
  createdAt: Date;
  updatedAt: Date;
}

/**
 * اشتراك الطالب
 * Student Subscription
 */
export interface StudentSubscription {
  id: number;
  subscriptionId: string; // معرف فريد للاشتراك
  studentId: number;
  parentId?: number;
  planId: number;

  // معلومات الاشتراك
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;

  // معلومات الدفع
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'partial' | 'pending' | 'failed';

  // التقدم والإحصائيات
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessDate?: Date;

  // معلومات إضافية
  notes?: string;
  metadata?: Record<string, any>;

  // معلومات تقنية
  createdAt: Date;
  updatedAt: Date;
}

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
