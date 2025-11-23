import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { signal } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
})
export class AdminSidebarComponent {
  @Input() collapsed = false;
  profileHovered = signal(false);
  isOpen = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleSidebar(): void {
    this.isOpen.set(!this.isOpen());
  }

  closeSidebar(): void {
    this.isOpen.set(false);
  }

  handleLogout(): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
