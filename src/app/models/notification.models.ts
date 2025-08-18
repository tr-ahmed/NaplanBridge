/**
 * Interface for Notification data
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'course' | 'system';
  isRead: boolean;
  createdAt: Date;
  updatedAt?: Date;
  userId?: string;
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  metadata?: {
    courseId?: number;
    orderId?: string;
    userId?: string;
    [key: string]: any;
  };
}

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
