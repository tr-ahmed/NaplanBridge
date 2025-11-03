/**
 * Payment, Cart, and Order Models
 * Based on Backend API Documentation
 */

// ============================================
// Order Status
// ============================================

export type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled' | 'Failed' | 'Refunded';

export const OrderStatuses = {
  PENDING: 'Pending' as OrderStatus,
  PROCESSING: 'Processing' as OrderStatus,
  COMPLETED: 'Completed' as OrderStatus,
  CANCELLED: 'Cancelled' as OrderStatus,
  FAILED: 'Failed' as OrderStatus,
  REFUNDED: 'Refunded' as OrderStatus
};

// ============================================
// Payment Status
// ============================================

export type PaymentStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Refunded' | 'Cancelled';

export const PaymentStatuses = {
  PENDING: 'Pending' as PaymentStatus,
  SUCCEEDED: 'Succeeded' as PaymentStatus,
  FAILED: 'Failed' as PaymentStatus,
  REFUNDED: 'Refunded' as PaymentStatus,
  CANCELLED: 'Cancelled' as PaymentStatus
};

// ============================================
// Payment Methods
// ============================================

export type PaymentMethod = 'Stripe' | 'CreditCard' | 'DebitCard' | 'PayPal' | 'Cash' | 'BankTransfer';

export const PaymentMethods = {
  STRIPE: 'Stripe' as PaymentMethod,
  CREDIT_CARD: 'CreditCard' as PaymentMethod,
  DEBIT_CARD: 'DebitCard' as PaymentMethod,
  PAYPAL: 'PayPal' as PaymentMethod,
  CASH: 'Cash' as PaymentMethod,
  BANK_TRANSFER: 'BankTransfer' as PaymentMethod
};

// ============================================
// Cart Models
// ============================================

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: number;
  cartId: number;
  subscriptionPlanId: number;
  subscriptionPlanName: string;

  // Plan Details
  planType: string;
  price: number;
  durationInDays: number;

  // Subject/Year Info
  subjectId?: number;
  subjectName?: string;
  yearId?: number;

  // Quantity & Total
  quantity: number;
  totalPrice: number;

  // Metadata
  addedAt: Date;
}

// ============================================
// Add to Cart DTO
// ============================================

export interface AddToCartDto {
  subscriptionPlanId: number;
  studentId: number;
  quantity?: number;
}

export interface AddToCartResponse {
  message: string;
  cartId: number;
  itemId: number;
  totalItems: number;
  totalAmount: number;
}

// ============================================
// Update Cart Item DTO
// ============================================

export interface UpdateCartItemDto {
  quantity: number;
}

// ============================================
// Order Models
// ============================================

export interface Order {
  id: number;
  userId: number;
  orderNumber?: string;

  // Amounts
  totalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  finalAmount: number;

  // Status
  orderStatus: OrderStatus;

  // Items
  items: OrderItem[];
  itemCount: number;

  // Payment
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  subscriptionPlanId: number;
  subscriptionPlanName: string;

  // Plan Details
  planType: string;
  studentId: number;

  // Pricing
  quantity: number;
  unitPrice: number;
  totalPrice: number;

  // Subject/Year Info
  subjectId?: number;
  subjectName?: string;
  yearId?: number;
}

// ============================================
// Create Order DTO
// ============================================

export interface CreateOrderFromCartResponse {
  orderId: number;
  sessionUrl: string;     // Stripe checkout URL
  sessionId: string;      // Stripe session ID
  totalAmount: number;
  currency: string;       // e.g., "aud"
}

// Legacy interface for backward compatibility
export interface CreateOrderFromCartResponseLegacy {
  id: number;
  userId: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  items: OrderItem[];
  createdAt: Date;
}

// ============================================
// Payment Models (Stripe Integration)
// ============================================

export interface CreateCheckoutSessionDto {
  orderId: number;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  sessionUrl: string;
  orderId: number;
  totalAmount: number;
  currency: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

// ============================================
// Payment History
// ============================================

export interface PaymentTransaction {
  id: number;
  orderId: number;
  userId: number;

  // Amounts
  amount: number;
  currency: string;

  // Payment Details
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  // Stripe Info
  stripePaymentIntentId?: string;
  stripeSessionId?: string;

  // Transaction Details
  transactionId?: string;
  errorMessage?: string;

  // Timestamps
  createdAt: Date;
  processedAt?: Date;
}

export interface PaymentHistory {
  transactions: PaymentTransaction[];
  totalSpent: number;
  successfulPayments: number;
  failedPayments: number;
}

// ============================================
// Invoice Models
// ============================================

export interface Invoice {
  id: number;
  orderId: number;
  invoiceNumber: string;

  // User Info
  userId: number;
  userName: string;
  userEmail: string;

  // Amounts
  subtotal: number;
  tax: number;
  discount: number;
  total: number;

  // Status
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';

  // Items
  items: InvoiceItem[];

  // Dates
  issueDate: Date;
  dueDate?: Date;
  paidDate?: Date;

  // Payment
  paymentMethod?: PaymentMethod;

  // URLs
  pdfUrl?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ============================================
// Discount/Coupon Models
// ============================================

export interface Coupon {
  id: number;
  code: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number;

  // Validity
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;

  // Usage
  maxUsage?: number;
  usedCount: number;

  // Restrictions
  minPurchaseAmount?: number;
  applicableToPlans?: number[];
}

export interface ApplyCouponDto {
  couponCode: string;
  cartId: number;
}

export interface CouponAppliedResponse {
  valid: boolean;
  discountAmount: number;
  newTotal: number;
  message?: string;
}

// ============================================
// Refund Models
// ============================================

export interface RefundRequest {
  orderId: number;
  reason: string;
  amount?: number; // Partial refund amount (optional)
}

export interface RefundResponse {
  refundId: string;
  orderId: number;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Processed';
  processedAt?: Date;
}
