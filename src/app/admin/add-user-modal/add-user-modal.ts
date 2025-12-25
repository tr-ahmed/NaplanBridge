import { Component, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-user-modal.html'
})
export class AddUserModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() userCreated = new EventEmitter<any>();

  private authService = inject(AuthService);

  loading = false;
  error: string | null = null;
  validationErrors: { [key: string]: string[] } = {};

  // Validation loading states
  checkingUsername = signal(false);
  checkingEmail = signal(false);
  checkingPhone = signal(false);

  addUserForm: ReturnType<FormBuilder['group']>;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    // Custom username validator: must be at least 4 chars, not all numbers, only letters/numbers/underscores
    const usernameValidator = (control: any) => {
      const value = control.value || '';
      if (!value) return { required: true };
      if (value.length < 4) return { minlength: true };
      if (/^\d+$/.test(value)) return { numbersOnly: true };
      if (!/^[A-Za-z0-9_]+$/.test(value)) return { invalidChars: true };
      return null;
    };

    // Custom email validator: must match natural email syntax
    const emailValidator = (control: any) => {
      const value = control.value || '';
      if (!value) return { required: true };
      // RFC 5322 simple regex
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(value)) return { email: true };
      return null;
    };

    // Initialize the form after fb is available
    this.addUserForm = this.fb.group({
      userName: ['', [usernameValidator]],
      email: ['', [emailValidator]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phoneNumber: ['', Validators.required],
      age: [null, [Validators.required, Validators.min(18)]],
      priority: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      salary: [null, [Validators.min(0)]],
      iban: ['', [Validators.pattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/)]]
    });
  }

  ngOnInit(): void {
    this.setupRealTimeValidation();
  }

  /**
   * Setup real-time validation for username, email, and phone
   */
  private setupRealTimeValidation(): void {
    // Username availability check
    this.addUserForm.get('userName')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((username: string) => {
        const control = this.addUserForm.get('userName');
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
        const control = this.addUserForm.get('userName');
        if (!isAvailable) {
          control?.setErrors({ ...control.errors, usernameTaken: true });
        } else {
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
    this.addUserForm.get('email')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((email: string) => {
        const control = this.addUserForm.get('email');
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
        const control = this.addUserForm.get('email');
        if (!isAvailable) {
          control?.setErrors({ ...control.errors, emailTaken: true });
        } else {
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
    this.addUserForm.get('phoneNumber')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((phoneNumber: string) => {
        const control = this.addUserForm.get('phoneNumber');
        if (!phoneNumber) {
          this.checkingPhone.set(false);
          return [];
        }

        this.checkingPhone.set(true);
        return this.authService.checkPhoneNumber(phoneNumber);
      })
    ).subscribe({
      next: (isAvailable: boolean) => {
        this.checkingPhone.set(false);
        const control = this.addUserForm.get('phoneNumber');
        if (!isAvailable) {
          control?.setErrors({ ...control.errors, phoneTaken: true });
        } else {
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

  onSubmit() {
    this.error = null;
    this.validationErrors = {};

    if (this.addUserForm.invalid) {
      this.addUserForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload = this.addUserForm.value;
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post(`${environment.apiBaseUrl}/Account/register-teacher`, payload, { headers })
      .subscribe({
        next: (res) => {
          Swal.fire({ icon: 'success', title: 'Teacher added successfully!', timer: 1500, showConfirmButton: false });
          this.userCreated.emit(res);
          this.close.emit();
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;

          console.log('Error response:', err); // Debug log

          // Handle direct array of errors (ASP.NET Identity format)
          if (Array.isArray(err?.error)) {
            // Format: [{ code: "InvalidUserName", description: "..." }]
            const backendErrors = err.error;
            let errorMessages: string[] = [];

            backendErrors.forEach((error: any) => {
              const fieldName = this.mapErrorCodeToField(error.code);
              const message = error.description || error.message || 'Validation error';

              if (fieldName) {
                if (!this.validationErrors[fieldName]) {
                  this.validationErrors[fieldName] = [];
                }
                this.validationErrors[fieldName].push(message);
              }

              errorMessages.push(message);
            });

            // Show all errors in SweetAlert
            Swal.fire({
              icon: 'error',
              title: 'Validation Errors',
              html: '<ul style="text-align: left; margin: 0; padding-left: 20px;">' +
                    errorMessages.map(msg => `<li style="margin-bottom: 8px;">${msg}</li>`).join('') +
                    '</ul>',
              confirmButtonText: 'OK'
            });
          }
          // Handle ASP.NET Identity validation errors in object
          else if (err?.error?.errors && Array.isArray(err.error.errors)) {
            // Format: { errors: [{ code: "InvalidUserName", description: "..." }] }
            const backendErrors = err.error.errors;
            let errorMessages: string[] = [];

            backendErrors.forEach((error: any) => {
              const fieldName = this.mapErrorCodeToField(error.code);
              const message = error.description || error.message || 'Validation error';

              if (fieldName) {
                if (!this.validationErrors[fieldName]) {
                  this.validationErrors[fieldName] = [];
                }
                this.validationErrors[fieldName].push(message);
              }

              errorMessages.push(message);
            });

            // Show all errors in SweetAlert
            Swal.fire({
              icon: 'error',
              title: 'Validation Errors',
              html: '<ul style="text-align: left; margin: 0; padding-left: 20px;">' +
                    errorMessages.map(msg => `<li style="margin-bottom: 8px;">${msg}</li>`).join('') +
                    '</ul>',
              confirmButtonText: 'OK'
            });
          }
          // Handle standard error format { message: "...", errors: { field: ["error1"] } }
          else if (err?.error?.errors && typeof err.error.errors === 'object') {
            this.validationErrors = err.error.errors;

            const errorList = Object.entries(this.validationErrors)
              .map(([field, errors]) => `<strong>${field}:</strong> ${(errors as string[]).join(', ')}`)
              .join('<br>');

            Swal.fire({
              icon: 'error',
              title: 'Validation Errors',
              html: errorList,
              confirmButtonText: 'OK'
            });
          }
          // Generic error message
          else {
            this.error = err?.error?.message || err?.error?.title || 'Failed to add teacher.';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: this.error ?? 'Failed to add teacher.'
            });
          }
        }
      });
  }

  // Map ASP.NET Identity error codes to form field names
  private mapErrorCodeToField(errorCode: string): string | null {
    const errorMap: { [key: string]: string } = {
      'InvalidUserName': 'userName',
      'DuplicateUserName': 'userName',
      'InvalidEmail': 'email',
      'DuplicateEmail': 'email',
      'PasswordTooShort': 'password',
      'PasswordRequiresNonAlphanumeric': 'password',
      'PasswordRequiresDigit': 'password',
      'PasswordRequiresUpper': 'password',
      'PasswordRequiresLower': 'password',
      'InvalidPhoneNumber': 'phoneNumber',
      'DuplicatePhoneNumber': 'phoneNumber',
      'InvalidIBAN': 'iban',
      'InvalidSalary': 'salary'
    };

    return errorMap[errorCode] || null;
  }
}
