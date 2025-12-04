import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CoursesService } from '../../core/services/courses.service';
import { NotificationService } from '../../core/services/notification.service';
import { ClickOutsideDirective } from '../directives/click-outside.directive';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, ClickOutsideDirective],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  navigationItems: any[] = [];

  isMobileMenuOpen = false;
  isLoggedIn = false;
  userName = '';
  userRole: string | null = null;
  isLoginPage = false;

  // Cart and notifications
  cartItemCount = 0;
  unreadNotificationsCount = 0;
  showNotificationsDropdown = false;
  recentNotifications: any[] = []; // Store recent notifications for dropdown

  private subscriptions = new Subscription();

  constructor(
    public authService: AuthService,
    public router: Router,
    private coursesService: CoursesService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // ✅ Subscribe to auth state
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.isLoggedIn = !!user;
        this.userName = user?.userName || '';
        this.userRole = this.authService.getPrimaryRole();

        // Update navigation items based on user role
        this.updateNavigationItems();

        // Initialize services when user is logged in AND not on login page
        if (this.isLoggedIn && !this.isLoginPage) {
          this.initializeCartAndNotifications();
        }
      })
    );

    // ✅ Subscribe to route changes
    this.subscriptions.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          this.isLoginPage = event.url.includes('/auth/login');
        })
    );

    // ✅ Initial value for isLoginPage
    this.isLoginPage = this.router.url.includes('/auth/login');

    // Set initial navigation items
    this.updateNavigationItems();
  }

  /**
   * Update navigation items based on user role
   * Shows Subjects for everyone except Students
   */
  private updateNavigationItems(): void {
    const baseItems = [
      { id: 1, label: 'Home', route: '/', icon: 'home' },
      { id: 2, label: 'About Us', route: '/about', icon: 'info', isAboutSection: true }
    ];

    // Add Subjects for everyone except Students
    if (this.userRole !== 'Student') {
      baseItems.push({ id: 3, label: 'Subjects', route: '/courses', icon: 'book' });
    }

    // Add Contact
    baseItems.push({ id: 7, label: 'Contact', route: '/contact', icon: 'mail' });

    this.navigationItems = baseItems;
  }

  /**
   * Initialize cart and notifications when user is logged in
   */
  private initializeCartAndNotifications(): void {
    // Subscribe to cart changes
    this.subscriptions.add(
      this.coursesService.cart$.subscribe(cart => {
        this.cartItemCount = cart.totalItems;
      })
    );

    // ✅ Wait for token to be properly stored before loading notifications
    // This prevents 401 errors when authentication is still being processed
    setTimeout(() => {
      const token = localStorage.getItem('authToken');

      // Only load notifications if token exists
      if (!token) {
        console.warn('🔔 Header - No auth token found, skipping notification load');
        return;
      }

      // Subscribe to notification changes
      this.subscriptions.add(
        this.notificationService.getUnreadCount().subscribe({
          next: (count) => {
            this.unreadNotificationsCount = count.count || 0;
          },
          error: (err) => {
            console.error('❌ Header - Failed to load unread count:', err);
            // Don't show error to user, just log it
          }
        })
      );

      // Subscribe to notifications for dropdown preview
      this.subscriptions.add(
        this.notificationService.notifications$.subscribe(notifications => {
          // Get the 5 most recent notifications for dropdown preview
          if (notifications && Array.isArray(notifications)) {
            this.recentNotifications = notifications
              .sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
              .slice(0, 5);
          } else {
            this.recentNotifications = [];
          }
        })
      );

      // Load initial notifications data
      this.notificationService.getNotifications().subscribe({
        next: (data) => {}, // Silent success
        error: (err) => {
          console.error('❌ Header - Failed to load notifications:', err);
          // Don't show error to user, just log it
        }
      });
    }, 500); // Wait 500ms for auth token to be properly stored
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  handleLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }

  /**
   * Toggle mobile menu visibility
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /**
   * Close mobile menu if it's open (for dropdown items)
   */
  closeMobileMenuIfOpen(): void {
    if (this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  navigateToAboutSection() {
    this.router.navigate(['/about']);
  }

  /**
   * Navigate to cart page
   */
  navigateToCart(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Navigate to notifications page
   */
  navigateToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  /**
   * Toggle notifications dropdown
   */
  toggleNotificationsDropdown(): void {
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
  }

  /**
   * Close notifications dropdown
   */
  closeNotificationsDropdown(): void {
    this.showNotificationsDropdown = false;
  }

  /**
   * Navigate to courses with subject filter
   */
  navigateToCoursesWithFilter(subject: string): void {
    this.router.navigate(['/courses'], {
      queryParams: { subject: subject }
    });
  }

  /**
   * Navigate to courses page (main subjects page)
   */
  navigateToCourses(): void {
    this.router.navigate(['/courses']);
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
   * Handle notification click in dropdown
   */
  onDropdownNotificationClick(notification: any): void {
    // Mark as read if unread
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    // Navigate if has action URL
    if (notification.actionUrl) {
      this.closeNotificationsDropdown();
      this.router.navigate([notification.actionUrl]);
    }
  }

isAdminDashboard(): boolean {
  return this.router.url.startsWith('/admin/users')
      || this.router.url.startsWith('/admin/content')
       || this.router.url.startsWith('/admin/subscriptions');
}

/**
 * Navigate to Teacher Dashboard
 */
navigateToTeacherDashboard(): void {
  this.router.navigate(['/teacher/content-management']);
}

/**
 * Navigate to Profile Page
 */
navigateToProfile(): void {
  this.router.navigate(['/profile']);
}

}
