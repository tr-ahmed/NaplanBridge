import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject, interval, timer } from 'rxjs';
import { catchError, map, tap, switchMap, startWith } from 'rxjs/operators';
import {
  Notification,
  PaginatedNotifications,
  NotificationQueryParams,
  NotificationPreference,
  PreferencesResponse,
  UpdatePreferenceDto,
  RefundRequestDto,
  RefundResponse
} from '../../models/notification.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Notifications`;
  private readonly ordersUrl = `${environment.apiBaseUrl}/Orders`;

  // Observable streams
  public unreadCount$ = new BehaviorSubject<number>(0);
  public notifications$ = new BehaviorSubject<Notification[]>([]);
  public isPolling$ = new BehaviorSubject<boolean>(false);

  // Loading states
  public loading = signal(false);
  public error = signal<string | null>(null);

  // Real-time updates
  private readonly pollingInterval = 30000; // 30 seconds
  private pollingSubscription: any;

  constructor(private http: HttpClient) {}

  /**
   * Get notifications with pagination and filters
   */
  getNotifications(params?: NotificationQueryParams): Observable<any> {
    this.loading.set(true);
    this.error.set(null);

    let httpParams = new HttpParams();

    if (params) {
      if (params.isRead !== undefined) {
        httpParams = httpParams.set('isRead', params.isRead.toString());
      }
      if (params.type) {
        httpParams = httpParams.set('type', params.type);
      }
      if (params.pageNumber) {
        httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
      }
      if (params.pageSize) {
        httpParams = httpParams.set('pageSize', params.pageSize.toString());
      }
    }

    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      tap(response => {
        console.log('🔔 Service received:', response);
        // Handle both array and paginated response
        if (Array.isArray(response)) {
          // Direct array response
          this.notifications$.next(response);
          this.loading.set(false);
        } else if (response && response.data) {
          // Paginated response
          this.notifications$.next(response.data);
          this.loading.set(false);
        } else {
          this.notifications$.next([]);
          this.loading.set(false);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to load notifications:', error);
        this.error.set('Failed to load notifications');
        this.loading.set(false);
        this.notifications$.next([]);
        return of([]);
      })
    );
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<{count: number}> {
    return this.http.get<{count: number}>(`${this.apiUrl}/unread-count`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to get unread count:', error);
        return of({ count: 0 });
      })
    );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Update local state
        const current = this.notifications$.value;
        const updated = current.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        this.notifications$.next(updated);

        // Update unread count
        const unreadCount = updated.filter(n => !n.isRead).length;
        this.unreadCount$.next(unreadCount);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to mark as read:', error);
        return of(null);
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => {
        // Update local state
        const current = this.notifications$.value;
        const updated = current.map(n => ({ ...n, isRead: true }));
        this.notifications$.next(updated);
        this.unreadCount$.next(0);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to mark all as read:', error);
        return of(null);
      })
    );
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${notificationId}`).pipe(
      tap(() => {
        // Update local state
        const current = this.notifications$.value;
        const updated = current.filter(n => n.id !== notificationId);
        this.notifications$.next(updated);

        // Update unread count
        const unreadCount = updated.filter(n => !n.isRead).length;
        this.unreadCount$.next(unreadCount);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to delete notification:', error);
        return of(null);
      })
    );
  }

  /**
   * Get user's notification preferences
   */
  getPreferences(): Observable<PreferencesResponse> {
    return this.http.get<PreferencesResponse>(`${this.apiUrl}/preferences`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to load preferences:', error);
        return of({ preferences: [] });
      })
    );
  }

  /**
   * Update notification preference
   */
  updatePreference(dto: UpdatePreferenceDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/preferences`, dto).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to update preference:', error);
        throw error;
      })
    );
  }

  /**
   * Request refund for an order
   */
  requestRefund(orderId: number, dto: RefundRequestDto): Observable<RefundResponse> {
    return this.http.post<RefundResponse>(
      `${this.ordersUrl}/${orderId}/request-refund`,
      dto
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to request refund:', error);
        throw error;
      })
    );
  }

  /**
   * Start auto-polling for notifications
   */
  startPolling(): void {
    if (this.isPolling$.value) return;

    this.isPolling$.next(true);

    // ✅ Add initial delay to ensure auth token is stored
    // This prevents 401 errors immediately after login
    const initialDelay = 1000; // 1 second delay

    // Poll for unread count
    this.pollingSubscription = interval(this.pollingInterval)
      .pipe(
        startWith(0),
        // ✅ Skip first emission and use timer instead for initial delay
        switchMap((index) =>
          index === 0
            ? timer(initialDelay).pipe(switchMap(() => this.getUnreadCount()))
            : this.getUnreadCount()
        )
      )
      .subscribe({
        next: (response) => {
          this.unreadCount$.next(response.count);
        },
        error: (error) => {
          console.error('Polling error:', error);
          // Don't stop polling on error, just log it
        }
      });

    // Also load latest notifications periodically
    interval(this.pollingInterval)
      .pipe(
        startWith(0),
        // ✅ Skip first emission and use timer instead for initial delay
        switchMap((index) =>
          index === 0
            ? timer(initialDelay).pipe(switchMap(() => this.getNotifications({ pageSize: 10 })))
            : this.getNotifications({ pageSize: 10 })
        )
      )
      .subscribe({
        next: (response) => {
          this.notifications$.next(response.data);
        },
        error: (error) => {
          console.error('Failed to load notifications:', error);
          // Don't stop polling on error, just log it
        }
      });
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    this.isPolling$.next(false);
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    this.stopPolling();
  }
}
