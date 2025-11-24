// user-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.prod';

interface UserProfileResponse {
  userId: number;
  userName: string;
  firstName?: string;
  email: string;
  age: number;
  phoneNumber?: string;
  avatarUrl?: string;
  createdAt: string;
  roles: string[];
  studentData?: any;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss']
})
export class UserProfileComponent implements OnInit {
  user: UserProfileResponse | null = null;
  loading = true;
  error = false;
  userId: number;

  isEditOpen = false;
  editData = {
    firstName: '',
    age: 0,
    phoneNumber: ''
  };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.userId = idParam ? Number(idParam) : 0;
  }

  ngOnInit(): void {
    this.fetchUserData();
  }

  fetchUserData(): void {
    this.loading = true;
    this.error = false;

    // إذا كان هناك userId في الـ route، نجيب بيانات المستخدم المحدد
    // وإلا نجيب بيانات المستخدم الحالي
    const endpoint = this.userId 
      ? `${environment.apiBaseUrl}/User/${this.userId}`
      : `${environment.apiBaseUrl}/User/profile`;

    this.http.get<UserProfileResponse>(endpoint)
      .subscribe({
        next: (data) => {
          this.user = data;
          this.editData = {
            firstName: data.firstName || '',
            age: data.age || 0,
            phoneNumber: data.phoneNumber || ''
          };
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching user data:', err);
          this.error = true;
          this.loading = false;
        }
      });
  }

  saveUserProfile() {
    if (!this.user) return;

    this.http.put<UserProfileResponse>(
      `${environment.apiBaseUrl}/User/profile`,
      this.editData
    ).subscribe({
      next: (updated) => {
        this.user = updated;
        this.isEditOpen = false;
        console.log('Profile updated successfully:', updated);
        this.fetchUserData();
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        alert('Failed to update profile');
      }
    });
  }

  openEditForm() {
    if (!this.user) return;
    this.editData = {
      firstName: this.user.firstName || '',
      age: this.user.age,
      phoneNumber: this.user.phoneNumber ?? ''
    };
    this.isEditOpen = true;
  }

  closeEditForm() {
    this.isEditOpen = false;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  }

  getAccountAge(): string {
    if (!this.user?.createdAt) return '';
    const created = new Date(this.user.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  }

  get defaultAvatar(): string {
    return 'https://ui-avatars.com/api/?name=' + (this.user?.userName || 'User') + '&background=random&size=200';
  }

  get userAvatar(): string {
    return this.user?.avatarUrl || this.defaultAvatar;
  }

  getRoleBadgeClass(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'teacher':
        return 'bg-green-100 text-green-800';
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'parent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
