import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Notification, NotificationStats } from '../../models/notification.models';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State signals
  notifications = signal<Notification[]>([]);
  stats = signal<NotificationStats>({
    totalCount: 0,
    unreadCount: 0,
    todayCount: 0,
    weekCount: 0,
    typeBreakdown: {}
  });
  loading = signal(false);
  error = signal<string | null>(null);

  // Filter states
  selectedFilter = signal<string>('all');
  showOnlyUnread = signal(false);

  // Computed values
  filteredNotifications = computed(() => {
    const notifications = this.notifications();
    const filter = this.selectedFilter();
    const unreadOnly = this.showOnlyUnread();

    let filtered = notifications;

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(n => n.type === filter);
    }

    // Filter by read status
    if (unreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) =>
      new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
  });

  // Filter options
  filterOptions = [
    { value: 'all', label: 'All', icon: 'fas fa-list' },
    { value: 'course', label: 'Courses', icon: 'fas fa-book' },
    { value: 'success', label: 'Success', icon: 'fas fa-check-circle' },
    { value: 'warning', label: 'Warnings', icon: 'fas fa-exclamation-triangle' },
    { value: 'info', label: 'Info', icon: 'fas fa-info-circle' },
    { value: 'system', label: 'System', icon: 'fas fa-cog' }
  ];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadStats();

    // Subscribe to real-time updates
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications: any[]) => this.notifications.set(notifications));

    // Subscribe to loading state
    this.loading.set(this.notificationService.loading());
    this.error.set(this.notificationService.error());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load notifications
   */
  loadNotifications(): void {
    this.notificationService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  /**
   * Load notification statistics
   */
  loadStats(): void {
    // Stats are calculated from notifications array
    // No separate API call needed
  }

  /**
   * Mark notification as read
   */
  markAsRead(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: number): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.notificationService.deleteNotification(notificationId)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  /**
   * Handle notification click
   */
  onNotificationClick(notification: Notification): void {
    this.markAsRead(notification);

    if (notification.relatedEntityType && notification.relatedEntityId) {
      // Navigate based on entity type
      const routes: {[key: string]: string} = {
        'Order': `/orders/${notification.relatedEntityId}`,
        'Lesson': `/lesson/${notification.relatedEntityId}`,
        'Exam': `/exams/${notification.relatedEntityId}`,
        'LessonDiscussion': `/discussions/${notification.relatedEntityId}`
      };
      const route = routes[notification.relatedEntityType];
      if (route) {
        window.location.href = route;
      }
    }
  }

  /**
   * Change filter
   */
  onFilterChange(filter: string): void {
    this.selectedFilter.set(filter);
  }

  /**
   * Toggle unread filter
   */
  toggleUnreadFilter(): void {
    this.showOnlyUnread.set(!this.showOnlyUnread());
  }

  /**
   * Get relative time from ISO date string
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: string): string {
    const icons = {
      Info: 'fas fa-info-circle',
      Success: 'fas fa-check-circle',
      Warning: 'fas fa-exclamation-triangle',
      Error: 'fas fa-times-circle'
    };
    return icons[type as keyof typeof icons] || 'fas fa-bell';
  }

  /**
   * Get notification color based on type
   */
  getNotificationColor(type: string): string {
    const colors = {
      Info: 'text-blue-600',
      Success: 'text-green-600',
      Warning: 'text-yellow-600',
      Error: 'text-red-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  }

  /**
   * Get notification background color based on type
   */
  getNotificationBgColor(type: string): string {
    const colors = {
      course: 'bg-blue-50',
      success: 'bg-green-50',
      warning: 'bg-yellow-50',
      error: 'bg-red-50',
      info: 'bg-blue-50',
      system: 'bg-gray-50'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-50';
  }

  /**
   * Get priority badge class
   */
  getPriorityBadgeClass(priority: string): string {
    const classes = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return classes[priority as keyof typeof classes] || classes.low;
  }
}
