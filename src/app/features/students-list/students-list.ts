import { Component, OnInit, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AddStudentComponent } from "../Add-Student/add-student";
import Swal from 'sweetalert2';

interface Student {
  id: number;
  userName: string;
  age: number;
  year: number;
}

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './students-list.html',
})
export class StudentsListComponent implements OnInit {
  students: Student[] = [];
  loading = false;
  error: string | null = null;

  // Pagination signals
  pageSize = 4;
  currentPage = signal(1);
  router: any;
  pageNumbers: any;

  showAddStudentModal = false;

  get totalPages() {
    return Math.ceil(this.students.length / this.pageSize);
  }

  pagedStudents = computed(() =>
    this.students.slice(
      (this.currentPage() - 1) * this.pageSize,
      this.currentPage() * this.pageSize
    )
  );

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

    let parentId: number | undefined;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      parentId = Number(payload.nameid); // التحويل لرقم
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

    const url = `${environment.apiBaseUrl}/User/get-children/${parentId}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<Student[]>(url, { headers }).subscribe({
      next: (data) => {
        this.students = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.error = err?.error?.message || 'Failed to load students.';
        this.loading = false;
      }
    });

  }
  getAvatar(name: string) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e40af&color=fff&size=128`;
  }
  navigateToAddStudent() {
    this.router.navigate(['/add-student']);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }

  openAddStudentModal() {
    this.showAddStudentModal = true;
  }

  closeAddStudentModal() {
    this.showAddStudentModal = false;
  }

  /**
   * Delete a student by ID using the API
   * @param studentId Student's ID
   */
  async deleteStudent(studentId: number) {
    const confirm = await Swal.fire({
      title: 'Delete Student?',
      text: 'Are you sure you want to delete this student?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      const token = localStorage.getItem('authToken');
      if (!token) {
        Swal.fire('Error', 'Auth token not found.', 'error');
        return;
      }

      const url = `${environment.apiBaseUrl}/User/delete-student/${studentId}`;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      try {
        await this.http.delete(url, { headers }).toPromise();
        this.students = this.students.filter(s => s.id !== studentId);
        Swal.fire('Deleted', 'Student has been deleted successfully.', 'success');
      } catch (error: any) {
        const errorMsg =
          error?.error?.message ||
          error?.message ||
          'An error occurred while deleting the student.';
        Swal.fire('Error', errorMsg, 'error');
      }
    }
  }
}
