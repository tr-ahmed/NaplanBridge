import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-teacher-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './teacher-header.component.html',
  styleUrls: ['./teacher-header.component.scss']
})
export class TeacherHeaderComponent {
  constructor(private authService: AuthService) {}

  get userAvatar(): string {
    const profile = this.authService.getUserProfile();
    return profile?.avatarUrl || 'https://i.pravatar.cc/48?img=5';
  }

  get userName(): string {
    const profile = this.authService.getUserProfile();
    return profile?.fullName || 'Teacher';
  }

  get userRole(): string {
    const profile = this.authService.getUserProfile();
    return profile?.role || 'Instructor';
  }

  get userEmail(): string {
    const profile = this.authService.getUserProfile();
    return profile?.email || '';
  }
}
