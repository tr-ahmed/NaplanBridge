import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { signal } from '@angular/core';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface UserProfileResponse {
  userId: number;
  userName: string;
  firstName?: string;
  email: string;
  age?: number;
  phoneNumber?: string;
  avatarUrl?: string;
  createdAt: string;
  roles: string[];
  studentData?: any;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
})
export class AdminSidebarComponent implements OnInit {
  @Input() collapsed = false;
  profileHovered = signal(false);
  isOpen = signal(false);
  currentUser: any;
  fullProfile = signal<UserProfileResponse | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    // Check cache first
    const cachedProfile = localStorage.getItem('fullUserProfile');
    if (cachedProfile) {
      this.fullProfile.set(JSON.parse(cachedProfile));
    }

    // Fetch fresh data
    this.http.get<UserProfileResponse>(`${environment.apiBaseUrl}/User/profile`)
      .subscribe({
        next: (profile) => {
          this.fullProfile.set(profile);
          localStorage.setItem('fullUserProfile', JSON.stringify(profile));
        },
        error: (err) => {
          console.error('Failed to load user profile:', err);
        }
      });
  }

  get userAvatar(): string {
    const profile = this.fullProfile();
    return profile?.avatarUrl || 'https://i.pravatar.cc/48?img=11';
  }

  get userName(): string {
    const profile = this.fullProfile();
    return profile?.firstName || profile?.userName || 'Admin';
  }

  get userRole(): string {
    const profile = this.fullProfile();
    return profile?.roles?.[0] || 'Super Admin';
  }

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
