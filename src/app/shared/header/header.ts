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

  private subscriptions = new Subscription();

  constructor(public authService: AuthService, public router: Router) {}

  ngOnInit(): void {
    // ✅ Subscribe to auth state
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.isLoggedIn = !!user;
        this.userName = user?.userName || '';
        this.userRole = this.authService.getPrimaryRole();
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  handleLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }

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
}
