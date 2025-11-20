import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Form states
  resetStep = signal<'request' | 'reset'>('request'); // 'request' = enter email, 'reset' = enter new password
  isLoading = signal(false);
  email = signal<string>('');
  resetToken = signal<string>('');

  // Request form (step 1: enter email)
  requestForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // Reset form (step 2: enter new password)
  resetForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  ngOnInit(): void {
    // Check if token is provided in URL (when user clicks reset link from email)
    this.route.queryParams.subscribe(params => {
      if (params['token'] && params['email']) {
        this.resetToken.set(params['token']);
        this.email.set(params['email']);
        this.resetStep.set('reset');
      }
    });
  }

  /**
   * Password match validator
   */
  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Request password reset (step 1)
   */
  requestReset(): void {
    if (this.requestForm.invalid) {
      this.markFormGroupTouched(this.requestForm);
      return;
    }

    this.isLoading.set(true);
    const formValue = this.requestForm.value;

    this.authService.requestPasswordReset(formValue.email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.email.set(formValue.email);
        this.toastService.showSuccess(
          'Reset instructions sent! Check your email for the reset link.'
        );
        // Optionally, you could auto-advance to reset step if needed
        // this.resetStep.set('reset');
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Password reset request error:', error);
        const errorMsg = error?.error?.message || 'Failed to send reset instructions';
        this.toastService.showError(errorMsg);
        this.requestForm.get('email')?.setErrors({ serverError: errorMsg });
      }
    });
  }

  /**
   * Reset password (step 2)
   */
  submitResetPassword(): void {
    if (this.resetForm.invalid) {
      this.markFormGroupTouched(this.resetForm);
      return;
    }

    // Validate token and email are available
    if (!this.resetToken() || !this.email()) {
      this.toastService.showError('Invalid reset link. Please request a new one.');
      this.router.navigate(['/auth/reset-password']);
      return;
    }

    this.isLoading.set(true);
    const formValue = this.resetForm.value;

    this.authService.resetPassword(
      this.email(),
      formValue.newPassword,
      this.resetToken()
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.showSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Password reset error:', error);
        const errorMsg = error?.error?.message || 'Failed to reset password';
        this.toastService.showError(errorMsg);

        // If token is invalid, redirect back to request step
        if (error?.status === 400 || error?.error?.message?.includes('invalid')) {
          setTimeout(() => {
            this.resetStep.set('request');
            this.resetToken.set('');
            this.requestForm.reset();
          }, 2000);
        }
      }
    });
  }

  /**
   * Go back to request step
   */
  backToRequest(): void {
    this.resetStep.set('request');
    this.resetToken.set('');
    this.resetForm.reset();
  }

  /**
   * Check if field has error
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.requestForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  /**
   * Check if field has error (reset form)
   */
  hasFieldErrorReset(fieldName: string): boolean {
    const control = this.resetForm.get(fieldName);
    if (fieldName === 'confirmPassword') {
      return !!(control?.errors && control.touched) || !!(this.resetForm.errors?.['passwordMismatch'] && control?.touched);
    }
    return !!(control?.errors && control.touched);
  }

  /**
   * Get error message for a specific field
   */
  getFieldError(fieldName: string): string {
    const control = this.requestForm.get(fieldName);

    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Email is required';
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
   * Get error message for reset form
   */
  getFieldErrorReset(fieldName: string): string {
    const control = this.resetForm.get(fieldName);

    if (fieldName === 'confirmPassword' && this.resetForm.errors?.['passwordMismatch'] && control?.touched) {
      return 'Passwords do not match';
    }

    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return fieldName === 'newPassword' ? 'New password is required' : 'Please confirm your password';
      }
      if (control.errors['minlength']) {
        return 'Password must be at least 8 characters';
      }
    }

    return '';
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
