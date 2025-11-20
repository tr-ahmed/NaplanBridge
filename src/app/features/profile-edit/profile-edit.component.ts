import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ProfileService, UpdateProfileRequest } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css'],
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule]
})
export class ProfileEditComponent implements OnInit {
  private profileService = inject(ProfileService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  profileForm!: FormGroup;
  selectedFile: File | null = null;
  avatarPreview: string | null = null;
  isLoading = false;
  isSaving = false;
  currentUserData: any = null;

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentProfile();
  }

  /**
   * Initialize the form with validators
   */
  initializeForm(): void {
    this.profileForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      phoneNumber: ['', [Validators.required]],
      avatarUrl: ['']
    });
  }

  /**
   * Load current user profile data
   */
  loadCurrentProfile(): void {
    this.isLoading = true;

    // Try to get data from localStorage first
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        this.currentUserData = JSON.parse(storedUser);
        this.patchFormWithUserData(this.currentUserData);
        this.isLoading = false;
        return;
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
    }

    // Otherwise fetch from API
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.currentUserData = profile;
        this.patchFormWithUserData(profile);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.toastService.showError('Failed to load profile');
        this.isLoading = false;
      }
    });
  }

  /**
   * Patch form with user data
   */
  private patchFormWithUserData(userData: any): void {
    this.profileForm.patchValue({
      userName: userData.userName || '',
      email: userData.email || '',
      age: userData.age || '',
      phoneNumber: userData.phoneNumber || '',
      avatarUrl: userData.avatarUrl || userData.avatar || ''
    });

    // Set avatar preview
    if (userData.avatarUrl || userData.avatar) {
      this.avatarPreview = userData.avatarUrl || userData.avatar;
    }
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: any): void {
    const file: File = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select an image file'
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSizeInMB = 5;
    if (file.size > maxSizeInMB * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Image size must be less than ${maxSizeInMB}MB`
      });
      return;
    }

    this.selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.avatarPreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Cancel avatar selection
   */
  cancelAvatarSelection(): void {
    this.selectedFile = null;
    const currentAvatarUrl = this.profileForm.get('avatarUrl')?.value;
    if (currentAvatarUrl) {
      this.avatarPreview = currentAvatarUrl;
    } else if (this.currentUserData?.avatarUrl || this.currentUserData?.avatar) {
      this.avatarPreview = this.currentUserData.avatarUrl || this.currentUserData.avatar;
    }
  }

  /**
   * Update profile with or without new avatar
   */
  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    let avatarUrl: string | null = null;

    try {
      // Step 1: Upload avatar if a new file is selected
      if (this.selectedFile) {
        Swal.fire({
          title: 'Uploading',
          html: 'Please wait while uploading the image...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          const uploadResponse = await this.profileService
            .uploadAvatar(this.selectedFile)
            .toPromise();

          if (!uploadResponse?.success) {
            throw new Error('Failed to upload image');
          }

          avatarUrl = uploadResponse.url;
          Swal.close();
        } catch (error: any) {
          Swal.close();
          throw new Error(`Image upload failed: ${error.message}`);
        }
      }

      // Step 2: Update profile
      Swal.fire({
        title: 'Updating Profile',
        html: 'Please wait while updating your profile...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const profileData: UpdateProfileRequest = {
        userName: this.profileForm.get('userName')?.value,
        email: this.profileForm.get('email')?.value,
        age: this.profileForm.get('age')?.value,
        phoneNumber: this.profileForm.get('phoneNumber')?.value,
        avatarUrl: avatarUrl || this.profileForm.get('avatarUrl')?.value
      };

      const response = await this.profileService
        .updateProfile(profileData)
        .toPromise();

      if (response?.success) {
        // Update localStorage with new profile data
        const updatedUser = {
          ...(this.currentUserData || {}),
          ...profileData
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: response.message || 'Profile updated successfully',
          timer: 2000
        });

        // Reload profile data
        this.loadCurrentProfile();
        this.selectedFile = null;
      } else {
        throw new Error(response?.message || 'Profile update failed');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'An error occurred during update'
      });
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Reset form to current user data
   */
  resetForm(): void {
    if (this.currentUserData) {
      this.patchFormWithUserData(this.currentUserData);
      this.selectedFile = null;
      this.cancelAvatarSelection();
    }
  }

  /**
   * Get form control
   */
  get f() {
    return this.profileForm.controls;
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }
}
