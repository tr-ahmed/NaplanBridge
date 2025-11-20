/**
 * Student Exams Component
 * Displays available exams for the logged-in student
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ExamService } from '../../core/services/exam.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-student-exams',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-exams.component.html',
  styleUrl: './student-exams.component.scss'
})
export class StudentExamsComponent implements OnInit {
  private examService = inject(ExamService);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  studentId: number = 0;
  loading = signal<boolean>(true);
  upcomingExams = signal<any[]>([]);
  completedExams = signal<any[]>([]);
  availableExams = signal<any[]>([]);
  selectedExam = signal<any>(null);
  showExamModal = signal<boolean>(false);

  ngOnInit(): void {
    const studentId = this.authService.getStudentId();
    if (studentId) {
      this.studentId = studentId;
      this.loadExams();
    } else {
      this.toastService.showError('Student ID not found');
      this.router.navigate(['/student/dashboard']);
    }
  }

  private loadExams(): void {
    this.loading.set(true);

    Promise.all([
      this.loadUpcomingExams(),
      this.loadExamHistory()
    ]).then(() => {
      this.loading.set(false);
    }).catch(err => {
      console.error('Error loading exams:', err);
      this.loading.set(false);
      this.toastService.showError('Failed to load exams');
    });
  }

  private loadUpcomingExams(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.examService.getUpcomingExams(this.studentId).subscribe({
        next: (response: any) => {
          if (Array.isArray(response)) {
            this.upcomingExams.set(response);
          } else if (response && response.data) {
            this.upcomingExams.set(response.data);
          }
          resolve();
        },
        error: (err) => {
          console.error('Error loading upcoming exams:', err);
          resolve();
        }
      });
    });
  }

  private loadExamHistory(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dashboardService.getStudentExamHistory(this.studentId).subscribe({
        next: (response: any) => {
          if (response && response.data && Array.isArray(response.data)) {
            this.completedExams.set(response.data);
          } else if (Array.isArray(response)) {
            this.completedExams.set(response);
          } else {
            this.completedExams.set([]);
          }
          resolve();
        },
        error: (err) => {
          console.error('Error loading exam history:', err);
          this.completedExams.set([]);
          resolve();
        }
      });
    });
  }

  viewExam(examId: number): void {
    const exam = this.upcomingExams().find(e => e.id === examId);
    if (exam) {
      this.selectedExam.set(exam);
      this.showExamModal.set(true);
    }
  }

  closeExamModal(): void {
    this.showExamModal.set(false);
    this.selectedExam.set(null);
  }

  proceedToExam(): void {
    if (this.selectedExam()) {
      this.startExam(this.selectedExam().id);
      this.closeExamModal();
    }
  }

  /**
   * Start exam - navigate to exam taking page
   */
  startExam(examId: number): void {
    this.router.navigate(['/student/exam', examId]);
  }

  /**
   * View exam result - navigate to results page
   */
  viewResult(studentExamId: number): void {
    this.router.navigate(['/student/exam-result', studentExamId]);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  }
}
