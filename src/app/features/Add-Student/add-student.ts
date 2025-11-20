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
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';

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
  private categoryService = inject(CategoryService);

  // Form
  addStudentForm!: FormGroup;

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  yearsLoading = signal(true); // Track loading state for years

  // Academic years data - Now loaded from API
  academicYears: AcademicYear[] = [];

  ngOnInit(): void {
    this.initializeForm();
    this.loadAcademicYears();
  }

  /**
   * Load academic years from database
   */
  private loadAcademicYears(): void {
    this.yearsLoading.set(true);
    this.categoryService.getYears().subscribe({
      next: (years) => {
        console.log('✅ Loaded academic years from database:', years);
        // Convert Year to AcademicYear format
        this.academicYears = years.map(year => ({
          id: year.id,
          name: `Year ${year.yearNumber}`,
          nameAr: `السنة ${year.yearNumber}`
        }));
        this.yearsLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load academic years:', err);
        // Fallback to default years if API fails
        this.academicYears = [
          { id: 7, name: 'Year 7', nameAr: 'السنة 7' },
          { id: 8, name: 'Year 8', nameAr: 'السنة 8' },
          { id: 9, name: 'Year 9', nameAr: 'السنة 9' },
          { id: 10, name: 'Year 10', nameAr: 'السنة 10' },
          { id: 11, name: 'Year 11', nameAr: 'السنة 11' },
          { id: 12, name: 'Year 12', nameAr: 'السنة 12' }
        ];
        this.yearsLoading.set(false);
      }
    });
  }

  /**
   * Initialize form with validation
   */
  private initializeForm(): void {
    this.addStudentForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]], // Required for login
      password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]], // API requires 4-8 chars
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

    // Get current user (parent) info from AuthService signal
    const currentUser = this.authService.currentUser();
    const parentId = currentUser?.userId;

    // Prepare payload according to API schema (StudentRegisterDto)
    // Only send fields that the backend expects
    const payload: any = {
      userName: formData.userName,
      password: formData.password,
      age: parseInt(formData.age),
      year: parseInt(formData.yearId)  // Now will be 7-12 for NAPLAN years
    };

    // Add optional fields if present (these might be stored separately or ignored by backend)
    if (formData.firstName) {
      payload.firstName = formData.firstName;
    }
    if (formData.email) {
      payload.email = formData.email;
    }
    if (formData.phoneNumber) {
      payload.phoneNumber = formData.phoneNumber;
    }
    if (parentId && typeof parentId === 'number') {
      payload.parentId = parentId;
    }

    console.log('Final payload (StudentRegisterDto):', payload);

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
  private registerStudentAPI(payload: any): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    console.log('Sending student registration payload:', payload);
    console.log('API URL:', `${environment.apiBaseUrl}/account/register-student`);

    this.http.post(
      `${environment.apiBaseUrl}/account/register-student`,
      payload,
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('Registration successful:', response);
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
    console.error('Full error object:', err);
    console.error('Error details:', err?.error);
    console.error('Validation errors:', err?.error?.errors);

    let errorMessage = 'Failed to add student. Please try again.';

    // Extract validation errors if available
    if (err?.error?.errors) {
      const validationErrors = err.error.errors;
      const errorMessages = Object.keys(validationErrors)
        .map(key => `${key}: ${validationErrors[key].join(', ')}`)
        .join('\n');
      errorMessage = `Validation errors:\n${errorMessages}`;
    } else if (err?.error?.title) {
      errorMessage = err.error.title;
    } else if (err?.error?.message) {
      errorMessage = err.error.message;
    }

    this.error.set(errorMessage);
    this.loading.set(false);

    Swal.fire({
      icon: 'error',
      title: 'Registration Failed',
      html: errorMessage.replace(/\n/g, '<br>'),
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
      errors.push('Password must be at least 4 characters');
    }
    if (this.addStudentForm.get('password')?.hasError('maxlength')) {
      errors.push('Password must not exceed 8 characters');
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
