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

  // Reactive form for login
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  ngOnInit(): void {
    // Load saved email if remember me was checked
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.loginForm.patchValue({
        email: savedEmail,
        rememberMe: true
      });
    }
  }

  /**
   * Handle form submission
   */
onLogin(): void {
  if (this.loginForm.valid) {
    this.isLoading.set(true);

    // Extract form data and prepare API request
    const formValue = this.loginForm.value;
    const loginData: LoginRequest = {
      email: formValue.email,
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
            localStorage.setItem('rememberedEmail', formValue.email);
          } else {
            localStorage.removeItem('rememberedEmail');
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
          this.handleLoginError(result.message || 'Login failed');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Login error:', error);
        this.toastService.showError('Login failed. Please try again.');
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
}