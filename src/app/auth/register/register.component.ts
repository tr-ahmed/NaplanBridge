import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ParentRegisterRequest } from '../../models/auth.models';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

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

  // Validation loading states
  checkingUsername = signal(false);
  checkingEmail = signal(false);
  checkingPhone = signal(false);

  // Reactive form for parent registration
  registerForm: FormGroup = this.fb.group({
    userName: ['', [
      (control: any) => {
        const value = control.value || '';
        if (!value) return { required: true };
        if (value.length < 4) return { minlength: true };
        if (/^\d+$/.test(value)) return { numbersOnly: true };
        if (!/^[A-Za-z0-9_]+$/.test(value)) return { invalidChars: true };
        return null;
      }
    ]],
    email: ['', [
      (control: any) => {
        const value = control.value || '';
        if (!value) return { required: true };
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(value)) return { email: true };
        return null;
      }
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(8)
    ]],
    confirmPassword: ['', [Validators.required]],
    // Allow international formats with optional leading + and 9-15 digits
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{9,15}$/)]],
    age: ['', [Validators.required, Validators.min(18), Validators.max(100)]],
    termsAccepted: [false, [Validators.requiredTrue]]
  }, {
    validators: this.passwordMatchValidator
  });

  ngOnInit(): void {
    this.setupRealTimeValidation();
  }

  /**
   * Setup real-time validation for username, email, and phone
   */
  private setupRealTimeValidation(): void {
    // Username availability check
    this.registerForm.get('userName')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((username: string) => {
        // Only check if username passes basic validation
        const control = this.registerForm.get('userName');
        if (!username || username.length < 4 || control?.hasError('numbersOnly') || control?.hasError('invalidChars')) {
          this.checkingUsername.set(false);
          return [];
        }

        this.checkingUsername.set(true);
        return this.authService.checkUsername(username);
      })
    ).subscribe({
      next: (isAvailable: boolean) => {
        this.checkingUsername.set(false);
        const control = this.registerForm.get('userName');
        if (!isAvailable) {
          control?.setErrors({ ...control.errors, usernameTaken: true });
        } else {
          // Remove usernameTaken error if exists
          if (control?.hasError('usernameTaken')) {
            const errors = { ...control.errors };
            delete errors['usernameTaken'];
            control.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
      },
      error: () => this.checkingUsername.set(false)
    });

    // Email availability check
    this.registerForm.get('email')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((email: string) => {
        // Only check if email passes basic validation
        const control = this.registerForm.get('email');
        if (!email || control?.hasError('email')) {
          this.checkingEmail.set(false);
          return [];
        }

        this.checkingEmail.set(true);
        return this.authService.checkEmail(email);
      })
    ).subscribe({
      next: (isAvailable: boolean) => {
        this.checkingEmail.set(false);
        const control = this.registerForm.get('email');
        if (!isAvailable) {
          control?.setErrors({ ...control.errors, emailTaken: true });
        } else {
          // Remove emailTaken error if exists
          if (control?.hasError('emailTaken')) {
            const errors = { ...control.errors };
            delete errors['emailTaken'];
            control.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
      },
      error: () => this.checkingEmail.set(false)
    });

    // Phone number availability check
    this.registerForm.get('phoneNumber')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((phoneNumber: string) => {
        // Only check if phone passes basic validation
        const control = this.registerForm.get('phoneNumber');
        if (!phoneNumber || control?.hasError('pattern')) {
          this.checkingPhone.set(false);
          return [];
        }

        this.checkingPhone.set(true);
        return this.authService.checkPhoneNumber(phoneNumber);
      })
    ).subscribe({
      next: (isAvailable: boolean) => {
        this.checkingPhone.set(false);
        const control = this.registerForm.get('phoneNumber');
        if (!isAvailable) {
          control?.setErrors({ ...control.errors, phoneTaken: true });
        } else {
          // Remove phoneTaken error if exists
          if (control?.hasError('phoneTaken')) {
            const errors = { ...control.errors };
            delete errors['phoneTaken'];
            control.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
      },
      error: () => this.checkingPhone.set(false)
    });
  }

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
            // ✅ NEW: Show verification message instead of auto-login
            this.toastService.showSuccess(
              'Registration successful! Please check your email to verify your account.',
              8000
            );

            // Show additional info message
            this.toastService.showInfo(
              `We've sent a verification link to ${formValue.email}. Click the link in the email to verify your account.`,
              10000
            );

            // Redirect to login after 5 seconds
            setTimeout(() => {
              this.router.navigate(['/auth/login'], {
                queryParams: { email: formValue.email }
              });
            }, 5000);
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
      if (control.errors['usernameTaken']) {
        return 'This username is already taken. Please choose another one.';
      }
      if (control.errors['emailTaken']) {
        return 'This email is already registered. Please use another email or login.';
      }
      if (control.errors['phoneTaken']) {
        return 'This phone number is already registered. Please use another number.';
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
