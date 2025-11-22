/**
 * Notification Template Models
 * For Admin Template Management System
 */

// ============================================
// TEMPLATE MODELS
// ============================================

export interface NotificationTemplateDto {
  id: number;
  systemEventId: number;
  eventKey: string;
  eventName: string;
  eventCategory?: string;
  eventDescription?: string;
  sendInApp: boolean;
  sendEmail: boolean;
  sendSMS: boolean;
  sendPush: boolean;
  inAppTitle?: string;
  inAppMessage?: string;
  emailSubject?: string;
  emailBody?: string;
  smsMessage?: string;
  pushTitle?: string;
  pushBody?: string;
  targetRoles?: string;
  delayMinutes?: number | null;
  isActive: boolean;
  availableVariables?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EventTemplateDto {
  eventKey: string;
  eventName: string;
  eventCategory: string;
  eventDescription: string;
  template: NotificationTemplateDto;
  availableVariables: string[];
}

// ============================================
// UPDATE DTOs
// ============================================

export interface UpdateNotificationTemplateDto {
  inAppTitle?: string;
  inAppMessage?: string;
  emailSubject?: string;
  emailBody?: string;
  smsMessage?: string;
  pushTitle?: string;
  pushBody?: string;
  sendInApp?: boolean;
  sendEmail?: boolean;
  sendSMS?: boolean;
  sendPush?: boolean;
  isActive?: boolean;
  delayMinutes?: number | null;
}

export interface BulkUpdateEventTemplatesDto {
  template: UpdateNotificationTemplateDto;
}

// ============================================
// PREVIEW & DEMO
// ============================================

export interface TemplatePreviewDto {
  originalTemplate: string;
  previewText: string;
  subject?: string;
  usedVariables: { [key: string]: string };
  missingVariables: string[];
}

export interface PreviewTemplateDto {
  sampleVariables: { [key: string]: string };
}

// ============================================
// TEST SEND
// ============================================

export interface TestSendNotificationDto {
  recipientUserId: number;
  sampleVariables: { [key: string]: string };
  testEmail?: string;
  testPhoneNumber?: string;
}

// ============================================
// HISTORY & AUDIT
// ============================================

export interface TemplateHistoryDto {
  id: number;
  templateId: number;
  changedBy: string;
  changedByUserId: number;
  changedAt: string;
  fieldChanged: string;
  oldValue?: string;
  newValue?: string;
  action: 'Created' | 'Updated' | 'Reset' | 'Activated' | 'Deactivated';
}

// ============================================
// FILTERS & COUNTS
// ============================================

export interface TemplateFilterParams {
  eventKey?: string;
  channel?: 'Email' | 'SMS' | 'InApp' | 'Push';
  isActive?: boolean;
  category?: string;
}

export interface TemplateCounts {
  totalTemplates: number;
  activeTemplates: number;
  inactiveTemplates: number;
  pendingReview?: number;
  byCategory: { [category: string]: number };
  byChannel: {
    email: number;
    sms: number;
    inApp: number;
    push: number;
  };
}

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ============================================
// EVENT CATEGORIES
// ============================================

export type EventCategory =
  | 'Student'
  | 'Discussion'
  | 'Content'
  | 'Registration'
  | 'Exam'
  | 'Payment'
  | 'Refund'
  | 'System';

export const EVENT_CATEGORIES: EventCategory[] = [
  'Student',
  'Discussion',
  'Content',
  'Registration',
  'Exam',
  'Payment',
  'Refund',
  'System'
];

// ============================================
// NOTIFICATION CHANNELS
// ============================================

export type NotificationChannel = 'Email' | 'SMS' | 'InApp' | 'Push';

export const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  'Email',
  'SMS',
  'InApp',
  'Push'
];

// ============================================
// EVENT KEYS (All 16 Active Events)
// ============================================

export const NOTIFICATION_EVENTS = {
  // Student Events (4)
  STUDENT_PROFILE_UPDATED: 'STUDENT_PROFILE_UPDATED',
  STUDENT_PASSWORD_CHANGED: 'STUDENT_PASSWORD_CHANGED',
  LESSON_STARTED: 'LESSON_STARTED',
  NEW_LESSON_AVAILABLE: 'NEW_LESSON_AVAILABLE',

  // Discussion Events (2)
  DISCUSSION_REPLY: 'DISCUSSION_REPLY',
  QUESTION_MARKED_HELPFUL: 'QUESTION_MARKED_HELPFUL',

  // Content Events (4)
  CONTENT_SUBMITTED: 'CONTENT_SUBMITTED',
  CONTENT_APPROVED: 'CONTENT_APPROVED',
  CONTENT_REJECTED: 'CONTENT_REJECTED',
  CONTENT_PENDING_REVIEW: 'CONTENT_PENDING_REVIEW',

  // Registration (1)
  NEW_USER_REGISTERED: 'NEW_USER_REGISTERED',

  // Exam (1)
  EXAM_AVAILABLE: 'EXAM_AVAILABLE',

  // Payment (2)
  HIGH_VALUE_PAYMENT: 'HIGH_VALUE_PAYMENT',
  SESSION_PAYMENT_RECEIVED: 'SESSION_PAYMENT_RECEIVED',

  // Refund (1)
  REFUND_REQUESTED: 'REFUND_REQUESTED',

  // System (1)
  SYSTEM_ERROR: 'SYSTEM_ERROR'
} as const;

export type NotificationEventKey = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS];

// ============================================
// UI HELPERS
// ============================================

export interface TemplateVariable {
  name: string;
  description?: string;
  example?: string;
}

export interface CategoryIcon {
  category: EventCategory;
  icon: string;
  color: string;
}

export const CATEGORY_ICONS: CategoryIcon[] = [
  { category: 'Student', icon: 'fa-user-graduate', color: '#3b82f6' },
  { category: 'Discussion', icon: 'fa-comments', color: '#8b5cf6' },
  { category: 'Content', icon: 'fa-file-alt', color: '#10b981' },
  { category: 'Registration', icon: 'fa-user-plus', color: '#f59e0b' },
  { category: 'Exam', icon: 'fa-clipboard-check', color: '#ef4444' },
  { category: 'Payment', icon: 'fa-credit-card', color: '#06b6d4' },
  { category: 'Refund', icon: 'fa-undo', color: '#f97316' },
  { category: 'System', icon: 'fa-cog', color: '#6b7280' }
];

export const CHANNEL_ICONS = {
  Email: { icon: 'fa-envelope', color: '#3b82f6' },
  SMS: { icon: 'fa-sms', color: '#10b981' },
  InApp: { icon: 'fa-bell', color: '#8b5cf6' },
  Push: { icon: 'fa-mobile-alt', color: '#f59e0b' }
};

// ============================================
// ARABIC TO ENGLISH TRANSLATION MAP
// ============================================

export const ARABIC_TO_ENGLISH_MAP = {
  // Event Names
  'تسجيل طالب جديد': 'Student Registered',
  'إكمال درس': 'Lesson Completed',
  'تقييم الامتحان': 'Exam Graded',
  'تم تقييم امتحانك': 'Your Exam Has Been Graded',
  'تم تقييم امتحان ابنك': 'Your Child\'s Exam Has Been Graded',
  'درس جديد متاح': 'New Lesson Available',
  'بدء الدرس': 'Lesson Started',
  'بدء الامتحان': 'Exam Started',
  'انتهاء الامتحان': 'Exam Ended',
  'دفع ناجح': 'Payment Successful',
  'استرجاع الأموال معالج': 'Refund Processed',
  'تحديث الملف الشخصي': 'Profile Updated',
  'تغيير كلمة المرور': 'Password Changed',
  'رسالة جديدة': 'New Message',
  'تعليق جديد': 'New Comment',
  'إشعار النظام': 'System Notification',
  'سؤال جديد من طالب': 'New Student Question',
  'تمت الموافقة على المحتوى': 'Content Approved',
  'تم رفض المحتوى': 'Content Rejected',
  'المحتوى في الانتظار': 'Content Pending Review',
  'محتوى جديد للمراجعة': 'New Content for Review',

  // Event Categories
  'الطلاب': 'Student',
  'الطالب': 'Student',
  'المناقشات': 'Discussion',
  'المناقشة': 'Discussion',
  'المحتوى': 'Content',
  'التسجيل': 'Registration',
  'الامتحانات': 'Exam',
  'الامتحان': 'Exam',
  'الدفع': 'Payment',
  'المدفوعات': 'Payment',
  'استرجاع الأموال': 'Refund',
  'الاسترجاع': 'Refund',
  'النظام': 'System',

  // Other common terms
  'جديد': 'New',
  'نشط': 'Active',
  'غير نشط': 'Inactive',
  'معلق': 'Pending',
  'مكتمل': 'Completed',
  'مرفوض': 'Rejected',
  'موافق': 'Approved',
  'خطأ': 'Error',
  'تنبيه': 'Alert',
  'إخطار': 'Notification'
};

export function translateFromArabic(text: string): string {
  if (!text) return text;
  return ARABIC_TO_ENGLISH_MAP[text as keyof typeof ARABIC_TO_ENGLISH_MAP] || text;
}
