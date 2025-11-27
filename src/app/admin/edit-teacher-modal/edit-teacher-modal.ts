import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-edit-teacher-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-teacher-modal.html'
})
export class EditTeacherModalComponent implements OnInit {
  @Input() teacher: any;
  @Output() close = new EventEmitter<void>();
  @Output() teacherUpdated = new EventEmitter<any>();

  loading = false;
  error: string | null = null;
  validationErrors: { [key: string]: string[] } = {};

  editTeacherForm!: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() {
    // Initialize the form with teacher data
    this.editTeacherForm = this.fb.group({
      userName: [this.teacher?.userName || '', Validators.required],
      email: [this.teacher?.email || '', [Validators.required, Validators.email]],
      phoneNumber: [this.teacher?.phoneNumber || '', Validators.required],
      age: [this.teacher?.age || null, [Validators.required, Validators.min(18)]],
      salary: [this.teacher?.salary || null, [Validators.min(0)]],
      iban: [this.teacher?.iban || '', [Validators.pattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/)]]
    });
  }

  onSubmit() {
    this.error = null;
    this.validationErrors = {};

    if (this.editTeacherForm.invalid) {
      this.editTeacherForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload = this.editTeacherForm.value;
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Update teacher endpoint
    this.http.put(`${environment.apiBaseUrl}/Admin/update-teacher/${this.teacher.userName}`, payload, { headers })
      .subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: 'Teacher updated successfully!',
            timer: 1500,
            showConfirmButton: false
          });
          this.teacherUpdated.emit(res);
          this.close.emit();
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;

          console.log('Error response:', err);

          // Handle direct array of errors
          if (Array.isArray(err?.error)) {
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

            Swal.fire({
              icon: 'error',
              title: 'Validation Errors',
              html: '<ul style="text-align: left; margin: 0; padding-left: 20px;">' +
                    errorMessages.map(msg => `<li style="margin-bottom: 8px;">${msg}</li>`).join('') +
                    '</ul>',
              confirmButtonText: 'OK'
            });
          }
          // Handle object with errors array
          else if (err?.error?.errors && Array.isArray(err.error.errors)) {
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

            Swal.fire({
              icon: 'error',
              title: 'Validation Errors',
              html: '<ul style="text-align: left; margin: 0; padding-left: 20px;">' +
                    errorMessages.map(msg => `<li style="margin-bottom: 8px;">${msg}</li>`).join('') +
                    '</ul>',
              confirmButtonText: 'OK'
            });
          }
          // Handle standard error format
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
            this.error = err?.error?.message || err?.error?.title || 'Failed to update teacher.';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: this.error ?? 'Failed to update teacher.'
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
      'InvalidPhoneNumber': 'phoneNumber',
      'DuplicatePhoneNumber': 'phoneNumber',
      'InvalidIBAN': 'iban',
      'InvalidSalary': 'salary'
    };

    return errorMap[errorCode] || null;
  }
}
