import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
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

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
