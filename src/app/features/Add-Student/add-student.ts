import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-student',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-student.html'
})
export class AddStudentComponent {
  addStudentForm: ReturnType<FormBuilder['group']>;
  loading = false;
  error: string | null = null;
  success = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.addStudentForm = this.fb.group({
      userName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      year: ['', [Validators.required]],
      age: ['', [Validators.required, Validators.min(1)]]
    });
  }

  onSubmit() {
    this.error = null;
    this.success = false;
    if (this.addStudentForm.invalid) {
      this.addStudentForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const payload = this.addStudentForm.value;

    // Get token from localStorage with correct key
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post(
      `${environment.apiBaseUrl}/Account/register-student`,
      payload,
      { headers }
    ).subscribe({
      next: () => {
        this.success = true;
        this.addStudentForm.reset();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to add student. Please try again.';
        this.loading = false;
      }
    });
  }
}
