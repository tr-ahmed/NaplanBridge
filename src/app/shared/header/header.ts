import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  /**
   * Navigation menu items for the header
   */
  navigationItems = [
    { label: 'Home', route: '/', icon: 'home' },
    { label: 'About Us', route: '/about', icon: 'info' },
    { label: 'Plans', route: '/plans', icon: 'star' },
    { label: 'Courses', route: '/courses', icon: 'book' },
    { label: 'Blog', route: '/blog', icon: 'article' },
    { label: 'Contact', route: '/contact', icon: 'mail' }
  ];

  /**
   * Toggle mobile menu visibility
   */
  isMobileMenuOpen = false;

  /**
   * Authentication status
   */
  isLoggedIn = false;

  /**
   * Current user name
   */
  userName = '';

  private authSubscription: Subscription = new Subscription();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Subscribe to authentication status changes
    this.authSubscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.isLoggedIn = !!user;
        this.userName = user?.userName || '';
      })
    );

    // Also check initial auth status using signals
    this.isLoggedIn = this.authService.isAuthenticated();
    const currentUser = this.authService.currentUser();
    this.userName = currentUser?.userName || '';
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  /**
   * Handle logout
   */
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
}
