/**
 * Add Student Component - Enhanced Version
 * Allows parents to register their children with full details
 * Supports parent-student linking and academic year selection
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';
import { AuthService } from '../../auth/auth.service';

// Interfaces
interface AcademicYear {
  id: number;
  name: string;
  nameAr?: string;
}

interface StudentFormData {
  userName: string;
  firstName: string; // Required - Student's first name
  email: string; // Required for login
  password: string;
  age: number;
  yearId: number;
  phoneNumber?: string;
  parentId?: number;
}

@Component({
  selector: 'app-add-student',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-student.html'
})
export class AddStudentComponent implements OnInit {
  // Services
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Form
  addStudentForm!: FormGroup;

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  // Academic years data
  academicYears: AcademicYear[] = [
    { id: 1, name: 'Year 1' },
    { id: 2, name: 'Year 2' },
    { id: 3, name: 'Year 3' },
    { id: 4, name: 'Year 4' },
    { id: 5, name: 'Year 5' },
    { id: 6, name: 'Year 6' },
    { id: 7, name: 'Year 7' },
    { id: 8, name: 'Year 8' },
    { id: 9, name: 'Year 9' },
    { id: 10, name: 'Year 10' },
    { id: 11, name: 'Year 11' },
    { id: 12, name: 'Year 12' }
  ];

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize form with validation
   */
  private initializeForm(): void {
    this.addStudentForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]], // Required for login
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      age: ['', [Validators.required, Validators.min(5), Validators.max(18)]],
      yearId: ['', [Validators.required]],
      phoneNumber: ['', [Validators.pattern(/^[0-9+\-\s()]*$/)]] // Optional
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Password match validator
   */
  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    this.error.set(null);
    this.success.set(false);

    if (this.addStudentForm.invalid) {
      this.addStudentForm.markAllAsTouched();
      this.showValidationErrors();
      return;
    }

    this.loading.set(true);
    const formData = this.addStudentForm.value;

    // Get current user (parent) info
    const currentUser = this.authService.getCurrentUser();
    const parentId = currentUser?.id;

    // Prepare payload
    const payload: StudentFormData = {
      userName: formData.userName,
      firstName: formData.firstName,
      email: formData.email, // Required for login
      password: formData.password,
      age: parseInt(formData.age),
      yearId: parseInt(formData.yearId),
      parentId: parentId
    };

    // Add optional fields
    if (formData.phoneNumber) {
      payload.phoneNumber = formData.phoneNumber;
    }

    // Check if using mock mode
    if (environment.useMock) {
      this.handleMockRegistration(payload);
      return;
    }

    // Real API call
    this.registerStudentAPI(payload);
  }

  /**
   * Register student via API
   */
  private registerStudentAPI(payload: StudentFormData): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post(
      `${environment.apiBaseUrl}/api/account/register-student`,
      payload,
      { headers }
    ).subscribe({
      next: (response: any) => {
        this.handleSuccess(payload.userName);
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  /**
   * Handle mock registration (for development)
   */
  private handleMockRegistration(payload: StudentFormData): void {
    // Simulate API delay
    setTimeout(() => {
      this.handleSuccess(payload.userName);
    }, 1000);
  }

  /**
   * Handle successful registration
   */
  private handleSuccess(studentName: string): void {
    this.success.set(true);
    this.addStudentForm.reset();
    this.loading.set(false);

    Swal.fire({
      icon: 'success',
      title: 'Student Added Successfully!',
      text: `${studentName} has been registered and linked to your account.`,
      confirmButtonText: 'Go to Dashboard',
      showCancelButton: true,
      cancelButtonText: 'Add Another'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/parent/dashboard']);
      } else {
        // Reset for adding another student
        this.initializeForm();
      }
    });
  }

  /**
   * Handle registration error
   */
  private handleError(err: any): void {
    const errorMessage = err?.error?.message
      || err?.error?.title
      || 'Failed to add student. Please try again.';

    this.error.set(errorMessage);
    this.loading.set(false);

    Swal.fire({
      icon: 'error',
      title: 'Registration Failed',
      text: errorMessage,
      confirmButtonText: 'Try Again'
    });
  }

  /**
   * Show validation errors
   */
  private showValidationErrors(): void {
    const errors: string[] = [];

    if (this.addStudentForm.get('userName')?.hasError('required')) {
      errors.push('Username is required');
    }
    if (this.addStudentForm.get('firstName')?.hasError('required')) {
      errors.push('First name is required');
    }
    if (this.addStudentForm.get('firstName')?.hasError('minlength')) {
      errors.push('First name must be at least 2 characters');
    }
    if (this.addStudentForm.get('email')?.hasError('required')) {
      errors.push('Email is required for login');
    }
    if (this.addStudentForm.get('email')?.hasError('email')) {
      errors.push('Invalid email format');
    }
    if (this.addStudentForm.get('password')?.hasError('required')) {
      errors.push('Password is required');
    }
    if (this.addStudentForm.get('password')?.hasError('minlength')) {
      errors.push('Password must be at least 6 characters');
    }
    if (this.addStudentForm.hasError('passwordMismatch')) {
      errors.push('Passwords do not match');
    }
    if (this.addStudentForm.get('age')?.hasError('required')) {
      errors.push('Age is required');
    }
    if (this.addStudentForm.get('yearId')?.hasError('required')) {
      errors.push('Academic year is required');
    }

    if (errors.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Please fix the following errors:',
        html: '<ul style="text-align: left;">' +
              errors.map(e => `<li>${e}</li>`).join('') +
              '</ul>',
        confirmButtonText: 'OK'
      });
    }
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.addStudentForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.addStudentForm.get(fieldName);

    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.hasError('required')) {
      return 'This field is required';
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Minimum length is ${minLength} characters`;
    }
    if (field.hasError('min')) {
      return 'Value is too low';
    }
    if (field.hasError('max')) {
      return 'Value is too high';
    }
    if (field.hasError('email')) {
      return 'Invalid email format';
    }
    if (field.hasError('pattern')) {
      return 'Invalid format';
    }

    return 'Invalid value';
  }

  /**
   * Cancel and go back
   */
  cancel(): void {
    this.router.navigate(['/parent/dashboard']);
  }
}
