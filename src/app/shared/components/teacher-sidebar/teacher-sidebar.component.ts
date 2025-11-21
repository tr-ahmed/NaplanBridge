import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { signal } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-teacher-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './teacher-sidebar.component.html',
  styleUrls: ['./teacher-sidebar.component.scss']
})
export class TeacherSidebarComponent {
  @Input() collapsed = false;
  profileHovered = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

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
