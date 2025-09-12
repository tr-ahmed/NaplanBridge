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
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
      .subscribe(notifications => this.notifications.set(notifications));

    this.notificationService.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => this.stats.set(stats));

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
    this.notificationService.getNotificationStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
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
   * Delete notification
   */
  deleteNotification(notificationId: string): void {
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

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
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
   * Get notification icon based on type
   */
  getNotificationIcon(type: string): string {
    const icons = {
      course: 'fas fa-book',
      success: 'fas fa-check-circle',
      warning: 'fas fa-exclamation-triangle',
      error: 'fas fa-times-circle',
      info: 'fas fa-info-circle',
      system: 'fas fa-cog'
    };
    return icons[type as keyof typeof icons] || 'fas fa-bell';
  }

  /**
   * Get notification color based on type
   */
  getNotificationColor(type: string): string {
    const colors = {
      course: 'text-blue-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      info: 'text-blue-500',
      system: 'text-gray-600'
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
   * Get relative time string
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
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
