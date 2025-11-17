import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ParentRegisterRequest } from '../../models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Loading state signal
  isLoading = signal(false);

  // Reactive form for parent registration
  registerForm: FormGroup = this.fb.group({
    userName: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern(/^[a-zA-Z0-9]+$/) // Only letters and digits, no spaces or special chars
    ]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z]).{4,8}$/) // Must contain uppercase and lowercase
    ]],
    confirmPassword: ['', [Validators.required]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0-9]{9}$/)]],
    age: ['', [Validators.required, Validators.min(18), Validators.max(100)]],
    termsAccepted: [false, [Validators.requiredTrue]]
  }, {
    validators: this.passwordMatchValidator
  });

  /**
   * Custom validator to check if passwords match
   */
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    if (confirmPassword?.hasError('mismatch')) {
      const errors = { ...confirmPassword.errors };
      delete errors['mismatch'];
      confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
    }

    return null;
  }

  /**
   * Handle form submission
   */
  onRegister(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);

      // Extract form data and prepare API request
      const formValue = this.registerForm.value;
      const registerData: ParentRegisterRequest = {
        userName: formValue.userName,
        email: formValue.email,
        password: formValue.password,
        phoneNumber: formValue.phoneNumber,
        age: parseInt(formValue.age)
      };

      // Call authentication service
      this.authService.register(registerData).subscribe({
        next: (result) => {
          this.isLoading.set(false);

          if (result.success) {
            const currentUser = this.authService.currentUser();
            this.toastService.showSuccess('Registration successful! Welcome to NaplanBridge.');

            // Navigate to appropriate dashboard
            this.authService.navigateToUserDashboard();
          } else {
            this.handleRegistrationError(result.message || 'Registration failed', undefined);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Registration error:', error);

          // Handle validation errors from backend
          if (error.status === 400 && error.error) {
            // Check if error.error is an array of validation errors
            if (Array.isArray(error.error)) {
              // Process each error
              error.error.forEach((err: any, index: number) => {
                if (err.description) {
                  // Show each error message in a separate toast with a small delay
                  setTimeout(() => {
                    this.toastService.showError(err.description);
                  }, index * 100); // Delay each toast by 100ms

                  // Map errors to specific form fields
                  const fieldName = this.mapErrorCodeToField(err.code);
                  if (fieldName) {
                    const control = this.registerForm.get(fieldName);
                    if (control) {
                      control.setErrors({ serverError: err.description });
                      control.markAsTouched();
                    }
                  }
                }
              });
            } else if (typeof error.error === 'string') {
              this.toastService.showError(error.error);
            } else {
              this.toastService.showError('Registration failed. Please check your input and try again.');
            }
          } else {
            this.toastService.showError('Registration failed. Please try again.');
          }
        }
      });
    } else {
      this.markFormGroupTouched();
      this.toastService.showWarning('Please fill in all required fields correctly.');
    }
  }

  /**
   * Handle registration errors and display validation messages
   */
  private handleRegistrationError(errorMessage: string, validationErrors?: any[]): void {
    // Display the main error message
    this.toastService.showError(errorMessage);

    // Apply validation errors to form fields
    if (validationErrors) {
      validationErrors.forEach(error => {
        const fieldName = this.mapApiFieldToFormField(error.field);
        const formControl = this.registerForm.get(fieldName);

        if (formControl) {
          formControl.setErrors({
            serverError: error.messages.join(', ')
          });
        }
      });
    }
  }

  /**
   * Map API field names to form field names
   */
  private mapApiFieldToFormField(apiField: string): string {
    const fieldMap: { [key: string]: string } = {
      'password': 'password',
      'email': 'email',
      'username': 'userName',
      'phonenumber': 'phoneNumber',
      'age': 'age'
    };

    return fieldMap[apiField.toLowerCase()] || apiField;
  }

  /**
   * Map error codes from backend to form field names
   */
  private mapErrorCodeToField(errorCode: string): string | null {
    const codeMap: { [key: string]: string } = {
      'PasswordRequiresLower': 'password',
      'PasswordRequiresUpper': 'password',
      'PasswordRequiresDigit': 'password',
      'PasswordRequiresNonAlphanumeric': 'password',
      'PasswordTooShort': 'password',
      'InvalidUserName': 'userName',
      'DuplicateUserName': 'userName',
      'InvalidEmail': 'email',
      'DuplicateEmail': 'email'
    };

    return codeMap[errorCode] || null;
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get error message for a specific field
   */
  getFieldError(fieldName: string): string {
    const control = this.registerForm.get(fieldName);

    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
      if (control.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be no more than ${control.errors['maxlength'].requiredLength} characters`;
      }
      if (control.errors['pattern']) {
        if (fieldName === 'password') {
          return 'Password must contain uppercase and lowercase letters';
        }
        if (fieldName === 'userName') {
          return 'Username can only contain letters and digits (no spaces or special characters)';
        }
        return 'Please enter a valid phone number';
      }
      if (control.errors['min']) {
        return `Age must be at least ${control.errors['min'].min}`;
      }
      if (control.errors['max']) {
        return `Age must be no more than ${control.errors['max'].max}`;
      }
      if (control.errors['mismatch']) {
        return 'Passwords do not match';
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
      'userName': 'Username',
      'email': 'Email',
      'password': 'Password',
      'confirmPassword': 'Confirm Password',
      'phoneNumber': 'Phone Number',
      'age': 'Age'
    };

    return displayNames[fieldName] || fieldName;
  }

  /**
   * Check if a field has errors and is touched
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }
}
