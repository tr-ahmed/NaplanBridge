import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-add-student',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-student.html',
  styleUrl: './add-student.scss'
})
export class AddStudentComponent {
  addStudentForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.addStudentForm = this.fb.group({
      studentName: ['', Validators.required],
      birthDate: ['', Validators.required],
      schoolYear: ['', Validators.required]
    });
  }

  onSubmit() {
    this.error = null;
    this.success = false;
    if (this.addStudentForm.invalid) return;

    this.loading = true;
    const data = this.addStudentForm.value;

    this.http.post('/api/Account/add-student', data).subscribe({
      next: () => {
        this.success = true;
        this.addStudentForm.reset();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'An error occurred while adding the student';
        this.loading = false;
      }
    });
  }
}
