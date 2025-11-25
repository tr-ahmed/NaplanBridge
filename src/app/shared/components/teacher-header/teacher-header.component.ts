import { Component, OnInit, signal, OnDestroy, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';

interface UserProfileResponse {
  userId: number;
  userName: string;
  firstName?: string;
  email: string;
  age?: number;
  phoneNumber?: string;
  avatarUrl?: string;
  createdAt: string;
  roles: string[];
  studentData?: any;
}

@Component({
  selector: 'app-teacher-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './teacher-header.component.html',
  styleUrls: ['./teacher-header.component.scss']
})
export class TeacherHeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  
  fullProfile = signal<UserProfileResponse | null>(null);

  // Notifications
  notifications = signal<any[]>([]);
  unreadCount = signal<number>(0);
  showNotifications = signal<boolean>(false);
  loadingNotifications = signal<boolean>(false);
  private notificationSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadNotifications();
    this.subscribeToNotifications();
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  private loadUserProfile(): void {
    // Check cache first
    const cachedProfile = localStorage.getItem('fullUserProfile');
    if (cachedProfile) {
      this.fullProfile.set(JSON.parse(cachedProfile));
    }

    // Fetch fresh data
    this.http.get<UserProfileResponse>(`${environment.apiBaseUrl}/User/profile`)
      .subscribe({
        next: (profile) => {
          this.fullProfile.set(profile);
          localStorage.setItem('fullUserProfile', JSON.stringify(profile));
        },
        error: (err) => {
          console.error('Failed to load user profile:', err);
        }
      });
  }

  get userAvatar(): string {
    const profile = this.fullProfile();
    return profile?.avatarUrl || 'https://i.pravatar.cc/48?img=5';
  }

  get userName(): string {
    const profile = this.fullProfile();
    return profile?.firstName || profile?.userName || 'Teacher';
  }

  get userRole(): string {
    const profile = this.fullProfile();
    const roles = profile?.roles || [];
    return roles.length > 0 ? roles[0] : 'Instructor';
  }

  get userEmail(): string {
    const profile = this.fullProfile();
    return profile?.email || '';
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  // Notifications Methods
  private loadNotifications(): void {
    this.loadingNotifications.set(true);

    // ✅ Wait for token to be properly stored before loading notifications
    setTimeout(() => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('🔔 Teacher Header - No auth token found, skipping notification load');
        this.loadingNotifications.set(false);
        return;
      }

      this.notificationService.getNotifications({ pageSize: 10, isRead: false }).subscribe({
        error: (err) => {
          console.error('Failed to load notifications:', err);
          this.loadingNotifications.set(false);
        }
      });

      this.notificationService.getUnreadCount().subscribe({
        next: (response) => this.unreadCount.set(response.count || 0),
        error: (err) => {
          console.error('Failed to load unread count:', err);
          this.loadingNotifications.set(false);
        }
      });
    }, 500);
  }

  private subscribeToNotifications(): void {
    this.notificationSubscription = this.notificationService.notifications$.subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        this.loadingNotifications.set(false);
      },
      error: (err) => {
        console.error('Notification subscription error:', err);
        this.loadingNotifications.set(false);
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    if (this.showNotifications()) {
      this.loadNotifications();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showNotifications.set(false);
    }
  }

  markAsRead(notificationId: number): void {
    this.http.post(`${environment.apiBaseUrl}/Notifications/${notificationId}/read`, {}).subscribe({
      next: () => {
        this.notifications.update(notifications =>
          notifications.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        this.unreadCount.update(count => Math.max(0, count - 1));
      },
      error: (err) => console.error('Failed to mark as read:', err)
    });
  }

  markAllAsRead(): void {
    this.http.post(`${environment.apiBaseUrl}/Notifications/mark-all-read`, {}).subscribe({
      next: () => {
        this.notifications.update(notifications =>
          notifications.map(n => ({ ...n, isRead: true }))
        );
        this.unreadCount.set(0);
      },
      error: (err) => console.error('Failed to mark all as read:', err)
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
}
