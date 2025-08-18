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
  styleUrls: ['./header.scss']   // ✅ تصحيح
})
export class HeaderComponent implements OnInit, OnDestroy {
  navigationItems = [
    { label: 'Home', route: '/', icon: 'home' },
    { label: 'About Us', route: '/', icon: 'info', fragment: 'about', isAboutSection: true },
    { label: 'Plans', route: '/plans', icon: 'star' },
    { label: 'Courses', route: '/courses', icon: 'book' },
    { label: 'Blog', route: '/blog', icon: 'article' },
    { label: 'Contact', route: '/contact', icon: 'mail' }
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
}
