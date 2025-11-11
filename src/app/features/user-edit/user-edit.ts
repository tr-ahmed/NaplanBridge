import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

export interface User {
  id: number;
  userName: string;
  email: string;
  age: number;
  phoneNumber: string;
}

@Component({
  selector: 'app-user-edit',
  standalone: true,
  templateUrl: './user-edit.html',
  styleUrls: ['./user-edit.scss'],
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
})
export class UserEditComponent implements OnInit {
  userForm!: FormGroup;
  userId!: number;
  isSubmitting = false;
  private toastService = inject(ToastService);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      phoneNumber: ['', Validators.required],
    });

    const navState = history.state;
    if (navState && navState.user) {
      this.userId = navState.user.id;
      this.userForm.patchValue(navState.user);
    } else {
      this.userId = this.route.snapshot.params['id'];
      if (this.userId) {
        this.loadUserData(this.userId);
      }
    }
  }

  get f() {
    return this.userForm.controls;
  }

  loadUserData(id: number): void {
    const token = this.authService.getToken();
    this.http
      .get<User>(`/api/User/${id}`, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      })
      .subscribe({
        next: (user) => {
          this.userForm.patchValue(user);
        },
        error: (error) => {
          console.error('Error loading user data:', error);
        },
      });
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;

    this.isSubmitting = true;
    const token = this.authService.getToken();
    const updatedUser = this.userForm.value;

    this.http
      .put(`/api/User/${this.userId}`, updatedUser, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastService.showSuccess('User updated successfully');
          this.router.navigate(['/user/profile']);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error updating user:', error);
        },
      });
  }

  navigateToUsers(): void {
    this.router.navigate(['/user/profile']);
  }
}
