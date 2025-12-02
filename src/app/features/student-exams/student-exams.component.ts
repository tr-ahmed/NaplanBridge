/**
 * Student Exams Component
 * Displays available exams for the logged-in student
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ExamApiService } from '../../core/services/exam-api.service';  // ✅ Updated import
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UpcomingExamDto } from '../../models/exam-api.models';  // ✅ Added import

@Component({
  selector: 'app-student-exams',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-exams.component.html',
  styleUrl: './student-exams.component.scss'
})
export class StudentExamsComponent implements OnInit {
  private examApi = inject(ExamApiService);  // ✅ Updated to ExamApiService
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  studentId: number = 0;
  loading = signal<boolean>(true);

  // ✅ Updated data structure
  allExams = signal<UpcomingExamDto[]>([]);
  upcomingExams = signal<UpcomingExamDto[]>([]);
  completedExams = signal<any[]>([]);
  totalCount = signal<number>(0);
  upcomingCount = signal<number>(0);

  selectedExam = signal<any>(null);
  showExamModal = signal<boolean>(false);
  activeTab = signal<'upcoming' | 'all' | 'completed'>('upcoming');

  // ✅ Computed values for filtering
  filteredExams = computed(() => {
    const tab = this.activeTab();
    const now = new Date();

    switch (tab) {
      case 'upcoming':
        return this.upcomingExams();
      case 'all':
        return this.allExams();
      case 'completed':
        return this.completedExams();
      default:
        return this.upcomingExams();
    }
  });

  // ✅ Computed average score
  averageScore = computed(() => {
    const completed = this.completedExams();
    if (completed.length === 0) return '0.0';

    const total = completed.reduce((sum, exam) => sum + (exam.scorePercentage || 0), 0);
    return (total / completed.length).toFixed(1);
  });

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
      this.loadAllExams(),        // ✅ NEW: Load all exams
      this.loadUpcomingExams(),   // ✅ Load upcoming exams
      this.loadExamHistory()
    ]).then(() => {
      this.loading.set(false);
    }).catch(err => {
      console.error('Error loading exams:', err);
      this.loading.set(false);
      this.toastService.showError('Failed to load exams');
    });
  }

  /**
   * ✅ Load all published exams using new endpoint
   * GET /api/exam/student/{studentId}/all
   */
  private loadAllExams(): Promise<void> {
    return new Promise((resolve) => {
      this.examApi.getAllPublishedExams(this.studentId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.allExams.set(response.data.exams);
            this.totalCount.set(response.data.totalCount);
          } else {
            this.allExams.set([]);
            this.totalCount.set(0);
          }
          resolve();
        },
        error: (err) => {
          console.error('Error loading all exams:', err);
          this.allExams.set([]);
          this.totalCount.set(0);
          resolve();
        }
      });
    });
  }

  /**
   * ✅ Load upcoming exams using existing endpoint
   * GET /api/exam/student/{studentId}/upcoming
   */
  private loadUpcomingExams(): Promise<void> {
    return new Promise((resolve) => {
      this.examApi.getUpcomingExams(this.studentId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.upcomingExams.set(response.data.exams);
            this.upcomingCount.set(response.data.upcomingCount);
          } else {
            this.upcomingExams.set([]);
            this.upcomingCount.set(0);
          }
          resolve();
        },
        error: (err) => {
          console.error('Error loading upcoming exams:', err);
          this.toastService.showError('Failed to load upcoming exams');
          this.upcomingExams.set([]);
          this.upcomingCount.set(0);
          resolve();
        }
      });
    });
  }  private loadExamHistory(): Promise<void> {
    return new Promise((resolve) => {
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
    const exam = this.allExams().find(e => e.id === examId) ||
                 this.upcomingExams().find(e => e.id === examId);
    if (exam) {
      this.selectedExam.set(exam);
      this.showExamModal.set(true);
    }
  }

  /**
   * ✅ NEW: Switch between tabs
   */
  setActiveTab(tab: 'upcoming' | 'all' | 'completed'): void {
    this.activeTab.set(tab);
  }

  /**
   * ✅ Check if exam is past
   */
  isPast(exam: UpcomingExamDto): boolean {
    return new Date(exam.endDate) < new Date();
  }

  /**
   * ✅ Check if exam is in progress (available to take now)
   */
  isInProgress(exam: UpcomingExamDto): boolean {
    const now = new Date();
    return new Date(exam.startDate) <= now && new Date(exam.endDate) >= now;
  }

  /**
   * ✅ Check if exam is upcoming (not started yet)
   */
  isUpcoming(exam: UpcomingExamDto): boolean {
    return new Date(exam.startDate) > new Date();
  }

  /**
   * ✅ Get exam status text
   */
  getExamStatus(exam: UpcomingExamDto): string {
    if (this.isInProgress(exam)) return 'Available Now';
    if (this.isUpcoming(exam)) return 'Upcoming';
    if (this.isPast(exam)) return 'Ended';
    return 'Unknown';
  }

  /**
   * ✅ Get time until exam starts or ends
   */
  getTimeInfo(exam: UpcomingExamDto): string {
    const now = new Date();
    const start = new Date(exam.startDate);
    const end = new Date(exam.endDate);

    if (this.isInProgress(exam)) {
      const hoursLeft = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60));
      const minutesLeft = Math.floor(((end.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
      return `Ends in ${hoursLeft}h ${minutesLeft}m`;
    }

    if (this.isUpcoming(exam)) {
      const hoursUntil = Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60));
      const minutesUntil = Math.floor(((start.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
      if (hoursUntil > 24) {
        const days = Math.floor(hoursUntil / 24);
        return `Starts in ${days} day${days > 1 ? 's' : ''}`;
      }
      return `Starts in ${hoursUntil}h ${minutesUntil}m`;
    }

    return 'Ended';
  }

  /**
   * ✅ NEW: Get exam type badge class
   */
  getTypeClass(examType: string): string {
    return `badge-${examType.toLowerCase()}`;
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
