// user-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';   // ✅ استدعاء Router
import { environment } from '../../../environments/environment.prod';

interface User {
  id: number;
  userName: string;
  normalizedUserName: string;
  email: string;
  normalizedEmail: string;
  emailConfirmed: boolean;
  passwordHash: string;
  securityStamp: string;
  concurrencyStamp: string;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnd: Date | null;
  lockoutEnabled: boolean;
  accessFailedCount: number;
  age: number;
  createdAt: string;
  student: any | null;
  students: any[];
  notifications: any[];
  userRoles: any[];
  teachings: any[];
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [ CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss']
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  loading = true;
  error = false;
  userId: number;

  isEditOpen = false;
  editData = {
    userName: '',
    email: '',
    age: 0,
    phoneNumber: ''
  };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.fetchUserData();
  }

  fetchUserData(): void {
    this.loading = true;
    this.error = false;

    this.http.get<User>(environment.apiBaseUrl + `/User/${this.userId}`)
      .subscribe({
        next: (data) => {
          this.user = data;
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

  this.http.put<User>(
    `${environment.apiBaseUrl}/User/${this.user.id}`,
    this.editData
  ).subscribe({
    next: (updated) => {
      this.user = updated;
      this.isEditOpen = false;
      console.log('User updated successfully:', updated);

      // Route لصفحة البروفايل
      this.router.navigate([`/user/${this.user.id}`]).then(() => {
        // ✅ بعد ما يدخل البروفايل هات البيانات تاني
        this.fetchUserData();
      });
    },
    error: (err) => {
      console.error('Error updating user:', err);
    }
  });
}


  openEditForm() {
    if (!this.user) return;
    this.editData = {
      userName: this.user.userName,
      email: this.user.email,
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
}
