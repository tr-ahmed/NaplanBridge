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
  activeTab = signal<'profile' | 'password'>('profile');

  // Forms
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // File upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadingAvatar = false;

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
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
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

    // Try to get profile from API
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
          console.error('❌ Error loading profile from API:', err);

          // Try to load profile from localStorage as fallback
          const storedProfile = this.createProfileFromLocalStorage();
          if (storedProfile) {
            console.log('✅ Using profile from localStorage:', storedProfile);
            this.profile.set(storedProfile);
            this.populateForm(storedProfile);
            this.loading.set(false);

            (Swal.fire as any)({
              icon: 'info',
              title: 'Using Cached Data',
              text: 'Profile loaded from cache. Some data might not be up-to-date.',
              confirmButtonColor: '#667eea'
            });
            return;
          }

          // If no fallback data available, show error
          this.loading.set(false);

          if (err.status === 401) {
            this.error.set('Session expired. Please login again.');
            this.router.navigate(['/login']);
          } else if (err.status === 404) {
            this.error.set('Profile not found');
          } else if (err.status === 0) {
            this.error.set('Unable to connect to server. Please check your internet connection.');
          } else {
            this.error.set('Failed to load profile. Please try again.');
          }

          (Swal.fire as any)({
            icon: 'error',
            title: 'Error Loading Profile',
            text: this.error() || 'Failed to load profile. Please try again.',
            confirmButtonColor: '#667eea'
          });
        }
      });
  }

  /**
   * Create profile from localStorage as fallback
   */
  private createProfileFromLocalStorage(): UserProfile | null {
    const userName = localStorage.getItem('userName');
    const email = localStorage.getItem('email');
    const firstName = localStorage.getItem('firstName');
    const userId = localStorage.getItem('userId');

    if (!userName || !email) {
      return null;
    }

    return {
      userId: parseInt(userId || '0'),
      userName: userName,
      firstName: firstName,
      email: email,
      age: 0,
      phoneNumber: null,
      createdAt: new Date().toISOString(),
      roles: [localStorage.getItem('userRole') || 'Parent'],
      studentData: null
    };
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
      const file = input.files[0];

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Only JPG, PNG, and GIF images are allowed',
          confirmButtonColor: '#667eea'
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Image must be less than 5MB',
          confirmButtonColor: '#667eea'
        });
        return;
      }

      this.selectedFile = file;

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);

      // Auto-upload the avatar immediately
      this.uploadAvatar();
    }
  }

  /**
   * Upload avatar using new backend API
   */
  uploadAvatar(): void {
    if (!this.selectedFile) {
      return;
    }

    this.uploadingAvatar = true;

    this.profileService.uploadAvatar(this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.uploadingAvatar = false;

          if (response.success && response.avatarUrl) {
            // Update profile with new avatar URL
            const currentProfile = this.profile();
            if (currentProfile) {
              this.profile.set({
                ...currentProfile,
                avatarUrl: response.avatarUrl,
                avatar: response.avatarUrl
              });
            }

            // Clear selected file
            this.selectedFile = null;
            this.imagePreview = null;

            Swal.fire({
              icon: 'success',
              title: 'Success!',
              text: response.message || 'Profile picture uploaded successfully',
              confirmButtonColor: '#667eea',
              timer: 2000
            });
          }
        },
        error: (err) => {
          this.uploadingAvatar = false;
          this.selectedFile = null;
          this.imagePreview = null;

          console.error('Error uploading avatar:', err);
          const errorMessage = err.error?.message || 'Failed to upload avatar. Please try again.';

          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: errorMessage,
            confirmButtonColor: '#667eea'
          });
        }
      });
  }

  /**
   * Delete avatar
   */
  deleteAvatar(): void {
    const currentProfile = this.profile();
    if (!currentProfile?.avatarUrl && !currentProfile?.avatar) {
      Swal.fire({
        icon: 'info',
        title: 'No Avatar',
        text: 'You don\'t have a profile picture to delete',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    Swal.fire({
      icon: 'warning',
      title: 'Delete Profile Picture',
      text: 'Are you sure you want to delete your profile picture?',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#667eea'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading.set(true);

        this.profileService.deleteAvatar()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.loading.set(false);

              // Update profile to remove avatar
              const currentProfile = this.profile();
              if (currentProfile) {
                this.profile.set({
                  ...currentProfile,
                  avatarUrl: undefined,
                  avatar: undefined
                });
              }

              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: response.message || 'Profile picture deleted successfully',
                confirmButtonColor: '#667eea',
                timer: 2000
              });
            },
            error: (err) => {
              this.loading.set(false);
              console.error('Error deleting avatar:', err);

              const errorMessage = err.error?.message || 'Failed to delete avatar. Please try again.';
              Swal.fire({
                icon: 'error',
                title: 'Delete Failed',
                text: errorMessage,
                confirmButtonColor: '#667eea'
              });
            }
          });
      }
    });
  }

  /**
   * Get avatar URL or default placeholder
   */
  getAvatarUrl(): string {
    const profile = this.profile();
    return profile ? this.profileService.getAvatarUrl(profile) : 'https://ui-avatars.com/api/?name=User&size=200&background=667eea&color=fff';
  }

  /**
   * Update profile information (without avatar - avatar is uploaded separately)
   */
  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const updateData = {
      userName: this.profileForm.value.userName,
      email: this.profileForm.value.email,
      age: this.profileForm.value.age,
      phoneNumber: this.profileForm.value.phoneNumber || null
    };

    // Call API to update profile
    this.http.put(`${environment.apiBaseUrl}/Account/update-profile`, updateData, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      })
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.loading.set(false);

        // Update local profile
        const currentProfile = this.profile();
        if (currentProfile) {
          this.profile.set({
            ...currentProfile,
            ...updateData
          });
        }

        // Update localStorage
        localStorage.setItem('userName', updateData.userName);
        localStorage.setItem('email', updateData.email);

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Profile updated successfully',
          confirmButtonColor: '#667eea',
          timer: 2000
        });
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error updating profile:', err);

        let errorMessage = 'Failed to update profile. Please try again.';
        if (err.status === 400) {
          errorMessage = err.error?.message || 'Invalid profile data';
        } else if (err.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          this.router.navigate(['/auth/login']);
          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonColor: '#667eea'
        });
      }
    });
  }  /**
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

    // Call API to change password
    this.http.post(`${environment.apiBaseUrl}/api/Account/change-password`, passwordData, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      })
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.loading.set(false);
        this.passwordForm.reset();

        Swal.fire({
          icon: 'success',
          title: 'Password Changed!',
          text: 'Your password has been updated successfully',
          confirmButtonColor: '#667eea',
          timer: 2000
        });
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error changing password:', err);

        let errorMessage = 'Failed to change password. Please try again.';
        if (err.status === 400) {
          errorMessage = err.error?.message || 'Invalid password data';
        } else if (err.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          this.router.navigate(['/auth/login']);
          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonColor: '#667eea'
        });
      }
    });
  }

  /**
   * Switch tab
   */
  switchTab(tab: 'profile' | 'password'): void {
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
}
