import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss']
})
export class AdminHeaderComponent {
  constructor(private authService: AuthService) {}

  get userAvatar(): string {
    const profile = this.authService.getUserProfile();
    return profile?.avatarUrl || 'https://i.pravatar.cc/48?img=11';
  }

  get userName(): string {
    const profile = this.authService.getUserProfile();
    return profile?.fullName || 'Admin';
  }

  get userRole(): string {
    const profile = this.authService.getUserProfile();
    return profile?.role || 'Administrator';
  }

  get userEmail(): string {
    const profile = this.authService.getUserProfile();
    return profile?.email || '';
  }
}
