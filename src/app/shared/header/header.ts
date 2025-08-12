import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  navigationItems = [
    { label: 'Home', route: '/', icon: 'home' },
    { label: 'About Us', route: '/about', icon: 'info' },
    { label: 'Plans', route: '/plans', icon: 'star' },
    { label: 'Courses', route: '/courses', icon: 'book' },
    { label: 'Blog', route: '/blog', icon: 'article' },
    { label: 'Contact', route: '/contact', icon: 'mail' }
  ];

  isMobileMenuOpen = false;
  isLoggedIn = false;
  userName = '';
  isLoginPage = false;

  private authSubscription: Subscription = new Subscription();
  private routeSubscription: Subscription = new Subscription();

  constructor(public authService: AuthService, public router: Router) {}

  ngOnInit(): void {
    // ✅ Subscribe to auth state
    this.authSubscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.isLoggedIn = !!user;
        this.userName = user?.userName || '';
      })
    );

    // ✅ Initial auth check
    this.isLoggedIn = this.authService.isAuthenticated();
    const currentUser = this.authService.currentUser();
    this.userName = currentUser?.userName || '';

    // ✅ Subscribe to route changes
    this.routeSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isLoginPage = event.url.includes('/auth/login');
      });

    // ✅ Set initial value for isLoginPage
    this.isLoginPage = this.router.url.includes('/auth/login');
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
  }

  handleLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  navigateToAddStudent() {
    this.router.navigate(['/add-student']);
  }
}
