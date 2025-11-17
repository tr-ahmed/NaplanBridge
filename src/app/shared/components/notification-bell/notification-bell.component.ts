import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../models/notification.models';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  notifications: Notification[] = [];
  isDropdownOpen = false;
  isLoading = false;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    // Start polling
    this.notificationService.startPolling();

    // Subscribe to unread count
    this.notificationService.unreadCount$.subscribe((count: number) => {
      this.unreadCount = count;
    });

    // Subscribe to latest notifications
    this.notificationService.notifications$.subscribe((notifications: Notification[]) => {
      this.notifications = notifications;
    });
  }

  ngOnDestroy() {
    // Stop polling
    this.notificationService.stopPolling();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  async markAsRead(notification: Notification, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (notification.isRead) return;

    try {
      await this.notificationService.markAsRead(notification.id).toPromise();
      notification.isRead = true;

      // Navigate to related entity if exists
      if (notification.relatedEntityType && notification.relatedEntityId) {
        this.navigateToEntity(notification);
      }

      this.isDropdownOpen = false;
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async markAllAsRead() {
    try {
      this.isLoading = true;
      await this.notificationService.markAllAsRead().toPromise();

      // Update local state
      this.notifications.forEach(n => n.isRead = true);
      this.unreadCount = 0;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteNotification(notification: Notification, event: Event) {
    event.stopPropagation();

    try {
      await this.notificationService.deleteNotification(notification.id).toPromise();

      // Remove from local array
      this.notifications = this.notifications.filter(n => n.id !== notification.id);

      if (!notification.isRead) {
        this.unreadCount--;
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  viewAllNotifications() {
    this.router.navigate(['/notifications']);
    this.isDropdownOpen = false;
  }

  private navigateToEntity(notification: Notification) {
    const { relatedEntityType, relatedEntityId } = notification;

    switch (relatedEntityType) {
      case 'LessonDiscussion':
        this.router.navigate(['/discussions', relatedEntityId]);
        break;
      case 'Order':
        this.router.navigate(['/orders', relatedEntityId]);
        break;
      case 'Exam':
        this.router.navigate(['/exams', relatedEntityId]);
        break;
      case 'Lesson':
        this.router.navigate(['/lesson', relatedEntityId]);
        break;
      default:
        break;
    }
  }

  getNotificationIcon(type: string): string {
    const icons: {[key: string]: string} = {
      'Info': 'fa-info-circle',
      'Success': 'fa-check-circle',
      'Warning': 'fa-exclamation-triangle',
      'Error': 'fa-times-circle'
    };
    return icons[type] || 'fa-bell';
  }
}
