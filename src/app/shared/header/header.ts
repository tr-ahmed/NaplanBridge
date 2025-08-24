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
  navigationItems = [
    { id: 1, label: 'Home', route: '/', icon: 'home' },
    { id: 2, label: 'About Us', route: '/', icon: 'info', fragment: 'about', isAboutSection: true },
    { id: 3, label: 'Plans', route: '/plans', icon: 'star' },
    { id: 4, label: 'Courses', route: '/courses', icon: 'book' },
    { id: 5, label: 'Blog', route: '/blog', icon: 'article' },
    { id: 6, label: 'Contact', route: '/contact', icon: 'mail' }
  ];

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

        // Initialize services when user is logged in
        if (this.isLoggedIn) {
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

    // Subscribe to notification changes
    this.subscriptions.add(
      this.notificationService.getUnreadCount().subscribe(count => {
        this.unreadNotificationsCount = count;
      })
    );

    // Subscribe to notifications for dropdown preview
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(notifications => {
        // Get the 5 most recent notifications for dropdown preview
        this.recentNotifications = notifications
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
      })
    );

    // Load initial data
    this.notificationService.getNotifications().subscribe();
    this.notificationService.getNotificationStats().subscribe();
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

  navigateToAboutSection() {
    if (this.router.url === '/' || this.router.url.startsWith('/#')) {
      setTimeout(() => {
        const el = document.getElementById('about');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      this.router.navigate(['/'], { fragment: 'about' });
    }
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
  return this.router.url.startsWith('/admin/dashboard') 
      || this.router.url.startsWith('/admin/content')
       || this.router.url.startsWith('/admin/subscriptions');
      
}


}
