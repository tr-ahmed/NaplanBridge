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

  const token = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxNiIsInVuaXF1ZV9uYW1lIjoiYWhtZWRoMzQzIiwicm9sZSI6WyJNZW1iZXIiLCJQYXJlbnQiXSwibmJmIjoxNzU1MDMzNTQxLCJleHAiOjE3NTU2MzgzNDEsImlhdCI6MTc1NTAzMzU0MX0.9o70xRFKo93i94QWgwU9UcnmBTC8zRLfs6031IBMIhwGsv2rSnsXdZRh4DSfoht649ANmwCEsCYjPnUb0ftHmg'; // التوكن اللي عندك

const headers = new HttpHeaders({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

const body = {
  userName: 'ahmed999',
  password: 'Aa246886',
  year: 9,
  age: 5
};

this.http.post('https://naplanbridge.runasp.net/api/Account/register-student', body, { headers })
  .subscribe(
    res => console.log('✅ Success:', res),
    err => console.error('❌ Error:', err)
  );

  }
}
