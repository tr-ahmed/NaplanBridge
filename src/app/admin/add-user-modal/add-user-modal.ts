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
          this.error = err?.error?.message || 'Failed to add teacher.';
          Swal.fire({ icon: 'error', title: 'Error', text: this.error ?? 'Failed to add teacher.' });
          this.loading = false;
        }
      });
  }
}
