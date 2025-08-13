import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Student {
  id: number;
  userName: string;
  age: number;
  year: number;
}

@Component({
  selector: 'app-students-list',
  standalone: true,
  templateUrl: './students-list.html'
})
export class StudentsListComponent implements OnInit {
  students: Student[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchStudents();
  }

  fetchStudents() {
    this.loading = true;
    this.error = null;
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.error = 'Auth token not found.';
      this.loading = false;
      return;
    }

    let parentId: string | undefined;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));      parentId = payload.parentId || payload.id || payload.userId;
    } catch (e) {
      this.error = 'Invalid token format.';
      this.loading = false;
      return;
    }

    if (!parentId) {
      this.error = 'Parent ID not found in token.';
      this.loading = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<Student[]>(`${environment.apiBaseUrl}/User/get-children/${parentId}`, { headers })
      .subscribe({
        next: (data) => {
          this.students = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to load students.';
          this.loading = false;
        }
      });
  }
}
