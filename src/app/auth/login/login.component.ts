import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LoginRequest } from '../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Loading state signal
  isLoading = signal(false);

  // Email verification states
  showResendVerification = signal(false);
  unverifiedEmail = signal('');

  // Reactive form for login
  loginForm: FormGroup = this.fb.group({
    identifier: ['', [Validators.required]], // Can be email, username, or phone
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  ngOnInit(): void {
    // Load saved identifier if remember me was checked
    const savedIdentifier = localStorage.getItem('rememberedIdentifier');
    if (savedIdentifier) {
      this.loginForm.patchValue({
        identifier: savedIdentifier,
        rememberMe: true
      });
    }

    // Pre-fill email if coming from verify page
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    if (email) {
      this.loginForm.patchValue({ identifier: email });
    }
  }

  /**
   * Handle form submission
   */
onLogin(): void {
  if (this.loginForm.valid) {
    this.isLoading.set(true);
    this.showResendVerification.set(false);

    // Extract form data and prepare API request
    const formValue = this.loginForm.value;
    const loginData: LoginRequest = {
      identifier: formValue.identifier, // Updated to use identifier (email, username, or phone)
      password: formValue.password
    };

    // Call authentication service
    this.authService.login(loginData).subscribe({
      next: (result) => {
        this.isLoading.set(false);

        if (result.success) {
          const currentUser = this.authService.currentUser();
          this.toastService.showSuccess(`Welcome back, ${currentUser?.userName}!`);

          // Handle remember me functionality
          if (formValue.rememberMe) {
            localStorage.setItem('rememberedIdentifier', formValue.identifier);
          } else {
            localStorage.removeItem('rememberedIdentifier');
          }

          // Check if user needs to select a role (has multiple non-Member roles)
          const roles = this.authService.userRoles();
          const nonMemberRoles = roles.filter(role => role.toLowerCase() !== 'member');

          // If user has multiple roles and hasn't selected one yet, redirect to role selection
          if (nonMemberRoles.length > 1 && !this.authService.isRoleSelected()) {
            this.router.navigate(['/select-role']);
          }
          // Otherwise, determine where to navigate based on role selection or primary role
          else {
            // If user already selected a role, use that
            if (this.authService.isRoleSelected() && this.authService.selectedRole()) {
              this.authService.navigateToDashboard(this.authService.selectedRole()!);
            }
            // Otherwise, use primary role
            else {
              const primaryRole = this.authService.getPrimaryRole();
              if (primaryRole) {
                this.authService.navigateToDashboard(primaryRole.toLowerCase());
              } else {
                // Fallback for users with only Member role
                this.router.navigate(['/home']);
              }
            }
          }
        } else {
          // result.success is false, extract error message safely
          const errorMessage: string = ('message' in result && typeof result.message === 'string')
            ? result.message
            : (('error' in result && typeof result.error === 'string') ? result.error : 'Login failed');

          // ✅ Check if email verification is required
          if ('requiresVerification' in result && result.requiresVerification === true) {
            this.showResendVerification.set(true);

            // Extract email from result or use identifier if it's an email
            const errorEmail = ('email' in result && typeof result.email === 'string') ? result.email : undefined;
            const identifierIsEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValue.identifier);

            this.unverifiedEmail.set(errorEmail || (identifierIsEmail ? formValue.identifier : ''));

            // Show warning toast
            this.toastService.showWarning(
              errorMessage,
              10000
            );
          } else {
            // Handle other login errors
            this.handleLoginError(errorMessage);
          }
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Unexpected login error:', error);
        this.toastService.showError('An unexpected error occurred. Please try again.');
      }
    });
  } else {
    this.markFormGroupTouched();
    this.toastService.showWarning('Please fill in all required fields correctly.');
  }
}

  /**
   * Handle login errors and display validation messages
   */
  private handleLoginError(errorMessage: string): void {
    // Display the main error message
    this.toastService.showError(errorMessage);

    // Clear password field on error for security
    this.loginForm.patchValue({ password: '' });
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get error message for a specific field
   */
  getFieldError(fieldName: string): string {
    const control = this.loginForm.get(fieldName);

    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['serverError']) {
        return control.errors['serverError'];
      }
    }

    return '';
  }

  /**
   * Get display name for form fields
   */
  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'email': 'Email',
      'password': 'Password'
    };

    return displayNames[fieldName] || fieldName;
  }

  /**
   * Check if a field has errors and is touched
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  /**
   * Resend verification email
   */
  resendVerification(): void {
    let email = this.unverifiedEmail();

    // If email is empty, prompt the user to enter it
    if (!email) {
      const identifierValue = this.loginForm.get('identifier')?.value;
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifierValue);

      if (isEmail) {
        email = identifierValue;
      } else {
        this.toastService.showError('Please enter your email address in the login field to resend verification email');
        return;
      }
    }

    this.authService.resendVerificationEmail({ email }).subscribe({
      next: (response) => {
        this.toastService.showSuccess(
          response.message || 'Verification email sent! Please check your inbox.',
          8000
        );
        this.showResendVerification.set(false);
      },
      error: (error) => {
        this.toastService.showError('Failed to send verification email. Please make sure you entered the correct email address.');
      }
    });
  }
}
