import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject, interval } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import {
  Notification,
  NotificationFilter,
  NotificationStats,
  NotificationSettings,
  BulkNotificationAction
} from '../../models/notification.models';
import { ApiNodes } from '../api/api-nodes';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly baseUrl = environment.apiBaseUrl || 'http://localhost:5000';
  private useMock = true; // Set to true for development with mock data

  // Notifications state
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private statsSubject = new BehaviorSubject<NotificationStats>({
    totalCount: 0,
    unreadCount: 0,
    todayCount: 0,
    weekCount: 0,
    typeBreakdown: {}
  });

  public notifications$ = this.notificationsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  // Loading states
  public loading = signal(false);
  public error = signal<string | null>(null);

  // Real-time updates
  private pollingInterval = 30000; // 30 seconds
  private pollingSubscription: any;

  constructor(private http: HttpClient) {
    this.startRealTimeUpdates();
  }

  /**
   * Get all notifications with optional filtering
   */
  getNotifications(filter?: NotificationFilter): Observable<Notification[]> {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = ApiNodes.getNotifications;
    const url = `${this.baseUrl}${endpoint.url}`;

    if (this.useMock) {
      const notifications = this.filterNotifications(endpoint.mockData, filter);
      this.notificationsSubject.next(notifications);
      this.loading.set(false);
      return of(notifications);
    }

    return this.http.get<Notification[]>(url).pipe(
      map(notifications => this.filterNotifications(notifications, filter)),
      tap(notifications => {
        this.notificationsSubject.next(notifications);
        this.loading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        console.warn('API call failed, using mock data:', error);
        this.error.set('Failed to load notifications');
        const notifications = this.filterNotifications(endpoint.mockData, filter);
        this.notificationsSubject.next(notifications);
        this.loading.set(false);
        return of(notifications);
      })
    );
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): Observable<NotificationStats> {
    const endpoint = ApiNodes.getNotificationStats;
    const url = `${this.baseUrl}${endpoint.url}`;

    if (this.useMock) {
      this.statsSubject.next(endpoint.mockData);
      return of(endpoint.mockData);
    }

    return this.http.get<NotificationStats>(url).pipe(
      tap(stats => this.statsSubject.next(stats)),
      catchError((error: HttpErrorResponse) => {
        console.warn('API call failed, using mock data:', error);
        this.statsSubject.next(endpoint.mockData);
        return of(endpoint.mockData);
      })
    );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Observable<boolean> {
    const endpoint = ApiNodes.markNotificationAsRead;
    const url = `${this.baseUrl}${endpoint.url.replace(':id', notificationId)}`;

    // Update local state
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    this.notificationsSubject.next(updatedNotifications);
    this.updateStats();

    if (this.useMock) {
      return of(true);
    }

    return this.http.put<any>(url, {}).pipe(
      map(() => true),
      catchError(() => of(true))
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<boolean> {
    const endpoint = ApiNodes.markAllNotificationsAsRead;
    const url = `${this.baseUrl}${endpoint.url}`;

    // Update local state
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(n => ({ ...n, isRead: true }));
    this.notificationsSubject.next(updatedNotifications);
    this.updateStats();

    if (this.useMock) {
      return of(true);
    }

    return this.http.put<any>(url, {}).pipe(
      map(() => true),
      catchError(() => of(true))
    );
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): Observable<boolean> {
    const endpoint = ApiNodes.deleteNotification;
    const url = `${this.baseUrl}${endpoint.url.replace(':id', notificationId)}`;

    // Update local state
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(updatedNotifications);
    this.updateStats();

    if (this.useMock) {
      return of(true);
    }

    return this.http.delete<any>(url).pipe(
      map(() => true),
      catchError(() => of(true))
    );
  }

  /**
   * Get notification settings
   */
  getNotificationSettings(): Observable<NotificationSettings> {
    const endpoint = ApiNodes.getNotificationSettings;
    const url = `${this.baseUrl}${endpoint.url}`;

    if (this.useMock) {
      return of(endpoint.mockData);
    }

    return this.http.get<NotificationSettings>(url).pipe(
      catchError(() => of(endpoint.mockData))
    );
  }

  /**
   * Update notification settings
   */
  updateNotificationSettings(settings: Partial<NotificationSettings>): Observable<boolean> {
    const endpoint = ApiNodes.updateNotificationSettings;
    const url = `${this.baseUrl}${endpoint.url}`;

    if (this.useMock) {
      return of(true);
    }

    return this.http.put<any>(url, settings).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): Observable<number> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.isRead).length)
    );
  }

  /**
   * Add new notification (for real-time updates simulation)
   */
  addNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...currentNotifications]);
    this.updateStats();
  }

  /**
   * Perform bulk actions on notifications
   */
  performBulkAction(action: BulkNotificationAction): Observable<boolean> {
    const currentNotifications = this.notificationsSubject.value;
    let updatedNotifications = [...currentNotifications];

    switch (action.action) {
      case 'markAsRead':
        updatedNotifications = currentNotifications.map(n =>
          action.notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        );
        break;
      case 'markAsUnread':
        updatedNotifications = currentNotifications.map(n =>
          action.notificationIds.includes(n.id) ? { ...n, isRead: false } : n
        );
        break;
      case 'delete':
        updatedNotifications = currentNotifications.filter(n =>
          !action.notificationIds.includes(n.id)
        );
        break;
    }

    this.notificationsSubject.next(updatedNotifications);
    this.updateStats();
    return of(true);
  }

  /**
   * Start real-time updates
   */
  private startRealTimeUpdates(): void {
    this.pollingSubscription = interval(this.pollingInterval)
      .pipe(
        switchMap(() => this.getNotificationStats())
      )
      .subscribe();
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  /**
   * Filter notifications based on criteria
   */
  private filterNotifications(notifications: Notification[], filter?: NotificationFilter): Notification[] {
    if (!filter) return notifications;

    return notifications.filter(notification => {
      if (filter.type && notification.type !== filter.type) return false;
      if (filter.isRead !== undefined && notification.isRead !== filter.isRead) return false;
      if (filter.priority && notification.priority !== filter.priority) return false;
      if (filter.category && notification.category !== filter.category) return false;
      if (filter.dateRange) {
        const notificationDate = new Date(notification.createdAt);
        if (notificationDate < filter.dateRange.start || notificationDate > filter.dateRange.end) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Update statistics based on current notifications
   */
  private updateStats(): void {
    const notifications = this.notificationsSubject.value;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats: NotificationStats = {
      totalCount: notifications.length,
      unreadCount: notifications.filter(n => !n.isRead).length,
      todayCount: notifications.filter(n => new Date(n.createdAt) >= todayStart).length,
      weekCount: notifications.filter(n => new Date(n.createdAt) >= weekStart).length,
      typeBreakdown: notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number })
    };

    this.statsSubject.next(stats);
  }

  /**
   * Set mock mode for development
   */
  setUseMock(useMock: boolean): void {
    this.useMock = useMock;
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    this.stopRealTimeUpdates();
  }
}
