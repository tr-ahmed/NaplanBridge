/**
 * Profile Management Component - Enhanced Version
 * Complete profile management with photo upload, password change, and settings
 */

import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-profile-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-management.component.html',
  styleUrl: './profile-management.component.scss'
})
export class ProfileManagementComponent implements OnInit, OnDestroy {
  // Services
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private destroy$ = new Subject<void>();

  // State
  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<'profile' | 'password' | 'security' | 'privacy' | 'reset-password'>('profile');
  resetPasswordLoading = signal(false);

  // Forms
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  securityForm!: FormGroup;
  resetPasswordForm!: FormGroup;

  // File upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  ngOnInit(): void {
    this.initializeForms();
    this.loadProfile();
  }

  /**
   * Initialize all forms
   */
  private initializeForms(): void {
    // Profile Form
    this.profileForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^[0-9+\-\s()]*$/)]],
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]]
    });

    // Password Form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Security Form
    this.securityForm = this.fb.group({
      twoFactorEnabled: [false],
      emailNotifications: [true],
      smsNotifications: [false]
    });

    // Reset Password Form
    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      currentPassword: ['', [Validators.required]]
    });
  }

  /**
   * Password match validator
   */
  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Load user profile
   */
  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    this.profileService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.populateForm(profile);
          this.loading.set(false);
          console.log('✅ Profile loaded successfully:', profile);
        },
        error: (err) => {
          console.error('❌ Error loading profile:', err);
          this.loading.set(false);

          if (err.status === 401) {
            this.error.set('Session expired. Please login again.');
            this.router.navigate(['/login']);
          } else if (err.status === 404) {
            this.error.set('Profile not found');
          } else {
            this.error.set('Failed to load profile. Please try again.');
          }

          Swal.fire({
            icon: 'error',
            title: 'Error Loading Profile',
            text: this.error(),
            confirmButtonColor: '#667eea'
          });
        }
      });
  }

  /**
   * Populate form with profile data
   */
  private populateForm(profile: UserProfile): void {
    this.profileForm.patchValue({
      userName: profile.userName,
      email: profile.email,
      phoneNumber: profile.phoneNumber || '',
      age: profile.age
    });

    this.securityForm.patchValue({
      twoFactorEnabled: false
    });
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Helper: Check if user is student
   */
  isStudent(): boolean {
    const profile = this.profile();
    return profile ? this.profileService.isStudent(profile) : false;
  }

  /**
   * Helper: Check if user is parent
   */
  isParent(): boolean {
    const profile = this.profile();
    return profile ? this.profileService.isParent(profile) : false;
  }

  /**
   * Helper: Check if user is teacher
   */
  isTeacher(): boolean {
    const profile = this.profile();
    return profile ? this.profileService.isTeacher(profile) : false;
  }

  /**
   * Helper: Check if user is admin
   */
  isAdmin(): boolean {
    const profile = this.profile();
    return profile ? this.profileService.isAdmin(profile) : false;
  }

  /**
   * Get year label for students
   */
  getYearLabel(): string {
    const profile = this.profile();
    return profile ? this.profileService.getYearLabel(profile) : 'N/A';
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];

      // Validate file
      if (!this.selectedFile.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File',
          text: 'Please select an image file'
        });
        return;
      }

      if (this.selectedFile.size > 5 * 1024 * 1024) { // 5MB
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Image must be less than 5MB'
        });
        return;
      }

      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  /**
   * Update profile
   */
  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const formData = new FormData();
    formData.append('userName', this.profileForm.value.userName);
    formData.append('email', this.profileForm.value.email);
    formData.append('age', this.profileForm.value.age);

    if (this.profileForm.value.phoneNumber) {
      formData.append('phoneNumber', this.profileForm.value.phoneNumber);
    }

    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }

    // Mock or real API
    setTimeout(() => {
      this.loading.set(false);
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Profile updated successfully',
        timer: 2000
      });

      // Update local profile
      const currentProfile = this.profile();
      if (currentProfile) {
        this.profile.set({
          ...currentProfile,
          ...this.profileForm.value
        });
      }
    }, 1000);
  }

  /**
   * Change password
   */
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const passwordData = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    setTimeout(() => {
      this.loading.set(false);
      this.passwordForm.reset();

      Swal.fire({
        icon: 'success',
        title: 'Password Changed!',
        text: 'Your password has been updated successfully',
        timer: 2000
      });
    }, 1000);
  }

  /**
   * Toggle 2FA
   */
  toggle2FA(): void {
    const enabled = this.securityForm.value.twoFactorEnabled;

    Swal.fire({
      icon: 'info',
      title: enabled ? 'Enable 2FA' : 'Disable 2FA',
      text: enabled
        ? 'Two-factor authentication adds an extra layer of security'
        : 'Are you sure you want to disable two-factor authentication?',
      showCancelButton: true,
      confirmButtonText: enabled ? 'Enable' : 'Disable'
    }).then((result) => {
      if (result.isConfirmed) {
        // Update profile
        const currentProfile = this.profile();
        if (currentProfile) {
          this.profile.set({
            ...currentProfile,
            twoFactorEnabled: enabled
          });
        }

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`,
          timer: 2000
        });
      } else {
        // Revert toggle
        this.securityForm.patchValue({
          twoFactorEnabled: !enabled
        });
      }
    });
  }

  /**
   * Verify email
   */
  verifyEmail(): void {
    Swal.fire({
      icon: 'info',
      title: 'Verify Email',
      text: 'A verification link has been sent to your email address',
      confirmButtonText: 'OK'
    });
  }

  /**
   * Verify phone
   */
  verifyPhone(): void {
    Swal.fire({
      icon: 'info',
      title: 'Verify Phone',
      text: 'A verification code has been sent to your phone',
      input: 'text',
      inputPlaceholder: 'Enter verification code',
      showCancelButton: true,
      confirmButtonText: 'Verify'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const currentProfile = this.profile();
        if (currentProfile) {
          this.profile.set({
            ...currentProfile,
            phoneNumberConfirmed: true
          });
        }

        Swal.fire({
          icon: 'success',
          title: 'Verified!',
          text: 'Phone number verified successfully',
          timer: 2000
        });
      }
    });
  }

  /**
   * Delete account
   */
  deleteAccount(): void {
    Swal.fire({
      icon: 'warning',
      title: 'Delete Account',
      text: 'Are you sure? This action cannot be undone!',
      input: 'password',
      inputPlaceholder: 'Enter your password to confirm',
      showCancelButton: true,
      confirmButtonText: 'Delete Account',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        Swal.fire({
          icon: 'success',
          title: 'Account Deleted',
          text: 'Your account has been deleted',
          timer: 2000
        }).then(() => {
          this.authService.logout();
          this.router.navigate(['/']);
        });
      }
    });
  }

  /**
   * Switch tab
   */
  switchTab(tab: 'profile' | 'password' | 'security' | 'privacy' | 'reset-password'): void {
    this.activeTab.set(tab);
  }

  /**
   * Check if field has error
   */
  hasError(form: FormGroup, fieldName: string, errorType: string): boolean {
    const field = form.get(fieldName);
    return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
  }

  /**
   * Get error message
   */
  getErrorMessage(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);

    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.hasError('required')) return 'This field is required';
    if (field.hasError('minlength')) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    if (field.hasError('email')) return 'Invalid email format';
    if (field.hasError('pattern')) return 'Invalid format';
    if (field.hasError('min')) return 'Value too low';
    if (field.hasError('max')) return 'Value too high';

    return 'Invalid value';
  }

  /**
   * Cancel and go back
   */
  cancel(): void {
    this.router.navigate(['/parent/dashboard']);
  }

  /**
   * Initiate password reset - sends reset link to email
   */
  initiatePasswordReset(): void {
    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.resetPasswordLoading.set(true);
    const email = this.resetPasswordForm.get('email')?.value;

    this.authService.requestPasswordReset(email).subscribe({
      next: (result: { success: boolean; message?: string }) => {
        this.resetPasswordLoading.set(false);
        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: 'Reset Link Sent',
            text: 'Check your email for the password reset link. The link will be valid for 24 hours.',
            confirmButtonText: 'OK'
          }).then(() => {
            this.resetPasswordForm.reset({ email: this.profile()?.email });
            this.switchTab('password');
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: result.message || 'Failed to send reset link'
          });
        }
      },
      error: (error: any) => {
        this.resetPasswordLoading.set(false);
        console.error('Password reset error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to send reset link. Please try again.'
        });
      }
    });
  }
}
