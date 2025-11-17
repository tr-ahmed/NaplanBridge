/**
 * Interface for Notification data (Updated to match Backend API)
 */
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'Info' | 'Success' | 'Warning' | 'Error';
  isRead: boolean;
  sentAt: string; // ISO 8601 date string
  relatedEntityType?: string;
  relatedEntityId?: number;
  userId?: number;
}

/**
 * Interface for Paginated Notifications Response
 */
export interface PaginatedNotifications {
  data: Notification[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

/**
 * Interface for Notification Query Parameters
 */
export interface NotificationQueryParams {
  isRead?: boolean;
  type?: string;
  pageNumber?: number;
  pageSize?: number;
}

/**
 * Interface for Notification Preference
 */
export interface NotificationPreference {
  id?: number;
  eventKey: string;
  eventName: string;
  category: string;
  description: string;
  enableEmail: boolean;
  enableInApp: boolean;
  enableSMS: boolean;
  enablePush: boolean;
}

/**
 * Interface for Preferences Response
 */
export interface PreferencesResponse {
  preferences: NotificationPreference[];
}

/**
 * Interface for Update Preference DTO
 */
export interface UpdatePreferenceDto {
  eventKey: string;
  enableEmail: boolean;
  enableInApp: boolean;
  enableSMS: boolean;
  enablePush: boolean;
}

/**
 * Notification Event Keys (All 16 Active Events)
 */
export type NotificationEventKey =
  // Student Events
  | 'STUDENT_PROFILE_UPDATED'
  | 'STUDENT_PASSWORD_CHANGED'
  | 'LESSON_STARTED'
  | 'NEW_LESSON_AVAILABLE'
  // Discussion Events
  | 'DISCUSSION_REPLY'
  | 'QUESTION_MARKED_HELPFUL'
  // Content Events
  | 'CONTENT_SUBMITTED'
  | 'CONTENT_APPROVED'
  | 'CONTENT_REJECTED'
  | 'CONTENT_PENDING_REVIEW'
  // Registration
  | 'NEW_USER_REGISTERED'
  // Exam
  | 'EXAM_AVAILABLE'
  // Payment
  | 'HIGH_VALUE_PAYMENT'
  | 'SESSION_PAYMENT_RECEIVED'
  // Refund
  | 'REFUND_REQUESTED'
  // System
  | 'SYSTEM_ERROR';

/**
 * Interface for Refund Request DTO
 */
export interface RefundRequestDto {
  reason: string;
  details?: string;
}

/**
 * Interface for Refund Response
 */
export interface RefundResponse {
  success: boolean;
  message: string;
  refundId: number;
}

// ============================================
// LEGACY INTERFACES (Keep for backward compatibility)
// ============================================

/**
 * Interface for Notification Filter options
 */
export interface NotificationFilter {
  type?: string;
  isRead?: boolean;
  priority?: string;
  category?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Interface for Notification Settings
 */
export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  courseUpdates: boolean;
  systemAlerts: boolean;
  marketingEmails: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

/**
 * Interface for Notification Statistics
 */
export interface NotificationStats {
  totalCount: number;
  unreadCount: number;
  todayCount: number;
  weekCount: number;
  typeBreakdown: {
    [key: string]: number;
  };
}

/**
 * Interface for Bulk Notification Actions
 */
export interface BulkNotificationAction {
  action: 'markAsRead' | 'markAsUnread' | 'delete' | 'archive';
  notificationIds: string[];
}

/**
 * Interface for Real-time Notification Event
 */
export interface NotificationEvent {
  type: 'new' | 'updated' | 'deleted';
  notification: Notification;
  timestamp: Date;
}
