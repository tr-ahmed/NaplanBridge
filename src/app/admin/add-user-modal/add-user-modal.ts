import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-user-modal.html'
})
export class AddUserModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() userCreated = new EventEmitter<any>();

  loading = false;
  error: string | null = null;
  validationErrors: { [key: string]: string[] } = {};

  addUserForm: ReturnType<FormBuilder['group']>;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    // Initialize the form after fb is available
    this.addUserForm = this.fb.group({
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: ['', Validators.required],
      age: [null, [Validators.required, Validators.min(18)]],
      salary: [null, [Validators.min(0)]],
      iban: ['', [Validators.pattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/)]]
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

          // Handle ASP.NET Identity validation errors
          if (err?.error?.errors && Array.isArray(err.error.errors)) {
            // Format: [{ code: "InvalidUserName", description: "..." }]
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
              html: '<ul style="text-align: left;">' +
                    errorMessages.map(msg => `<li>${msg}</li>`).join('') +
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
