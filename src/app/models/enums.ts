/**
 * Shared Enums for NaplanBridge Platform
 * Centralized enum definitions to ensure consistency across the application
 */

// ============================================
// Subscription Plan Types
// ============================================

/**
 * Plan Type Enum - matches Backend C# enum
 * SingleTerm = 1, MultiTerm = 2, FullYear = 3, SubjectAnnual = 4
 */
export enum PlanType {
  SingleTerm = 1,      // اشتراك في ترم واحد فقط
  MultiTerm = 2,       // اشتراك في عدة terms (مثل Term 1 و Term 2)
  FullYear = 3,        // اشتراك في جميع المواد والـ terms للسنة الدراسية
  SubjectAnnual = 4    // اشتراك سنوي في مادة محددة (جميع الـ 4 terms)
}

/**
 * Plan Type Labels for UI Display
 */
export const PlanTypeLabels: Record<PlanType, string> = {
  [PlanType.SingleTerm]: 'Single Term',
  [PlanType.MultiTerm]: 'Multi Term',
  [PlanType.FullYear]: 'Full Year',
  [PlanType.SubjectAnnual]: 'Subject Annual'
};

/**
 * Plan Type Labels (Arabic) for UI Display
 */
export const PlanTypeLabelsAr: Record<PlanType, string> = {
  [PlanType.SingleTerm]: 'ترم واحد',
  [PlanType.MultiTerm]: 'عدة فصول',
  [PlanType.FullYear]: 'السنة الكاملة',
  [PlanType.SubjectAnnual]: 'مادة سنوية'
};

/**
 * Plan Type Descriptions
 */
export const PlanTypeDescriptions: Record<PlanType, string> = {
  [PlanType.SingleTerm]: 'Access to a single term only',
  [PlanType.MultiTerm]: 'Access to multiple selected terms',
  [PlanType.FullYear]: 'Access to all subjects and terms for the academic year',
  [PlanType.SubjectAnnual]: 'Full year access to a specific subject (all 4 terms)'
};

// ============================================
// Order Status
// ============================================

export enum OrderStatus {
  Pending = 1,
  Completed = 2,
  Cancelled = 3,
  Failed = 4
}

export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'Pending',
  [OrderStatus.Completed]: 'Completed',
  [OrderStatus.Cancelled]: 'Cancelled',
  [OrderStatus.Failed]: 'Failed'
};

export const OrderStatusColors: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'warning',
  [OrderStatus.Completed]: 'success',
  [OrderStatus.Cancelled]: 'secondary',
  [OrderStatus.Failed]: 'danger'
};

// ============================================
// Subscription Status
// ============================================

export enum SubscriptionStatus {
  Active = 0,
  Cancelled = 1,
  Expired = 2,
  Suspended = 3,
  PendingPayment = 4
}

export const SubscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.Active]: 'Active',
  [SubscriptionStatus.Cancelled]: 'Cancelled',
  [SubscriptionStatus.Expired]: 'Expired',
  [SubscriptionStatus.Suspended]: 'Suspended',
  [SubscriptionStatus.PendingPayment]: 'Pending Payment'
};

// ============================================
// Payment Status
// ============================================

export enum PaymentStatus {
  Pending = 0,
  Completed = 1,
  Failed = 2,
  Refunded = 3
}

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: 'Pending',
  [PaymentStatus.Completed]: 'Completed',
  [PaymentStatus.Failed]: 'Failed',
  [PaymentStatus.Refunded]: 'Refunded'
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get Plan Type label by value
 */
export function getPlanTypeLabel(planType: PlanType, arabic = false): string {
  return arabic ? PlanTypeLabelsAr[planType] : PlanTypeLabels[planType];
}

/**
 * Get Order Status label and color
 */
export function getOrderStatusInfo(status: OrderStatus): { label: string; color: string } {
  return {
    label: OrderStatusLabels[status],
    color: OrderStatusColors[status]
  };
}

/**
 * Validate if a number is a valid PlanType
 */
export function isValidPlanType(value: number): value is PlanType {
  return Object.values(PlanType).includes(value);
}

/**
 * Parse PlanType from string or number
 */
export function parsePlanType(value: string | number): PlanType | null {
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  return isValidPlanType(numValue) ? numValue : null;
}
