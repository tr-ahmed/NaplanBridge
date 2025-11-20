import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ExamApiService } from '../../../core/services/exam-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  UpcomingExamDto,
  ExamHistoryDto,
  ExamType,
  getExamTypeLabel,
  getExamTypeIcon,
  getGradeColor
} from '../../../models/exam-api.models';

@Component({
  selector: 'app-student-exams',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-exams.component.html',
  styleUrls: ['./student-exams.component.scss']
})
export class StudentExamsComponent implements OnInit {
  // Data
  upcomingExams = signal<UpcomingExamDto[]>([]);
  examHistory = signal<ExamHistoryDto[]>([]);

  // UI State
  loading = signal(false);
  historyLoading = signal(false);
  activeTab = signal<'upcoming' | 'history'>('upcoming');

  constructor(
    private examApi: ExamApiService,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const user = this.auth.currentUser();
    const userId = user?.userId;
    if (userId) {
      this.loadUpcomingExams(userId);
      this.loadExamHistory(userId);
    }
  }

  /**
   * Load upcoming exams
   */
  loadUpcomingExams(studentId: number) {
    this.loading.set(true);

    this.examApi.getUpcomingExams(studentId).subscribe({
      next: (response: any) => {
        this.upcomingExams.set(response.data.exams);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load upcoming exams:', error);
        this.toast.showError('فشل تحميل الامتحانات القادمة');
        this.loading.set(false);
      }
    });
  }

  /**
   * Load exam history
   */
  loadExamHistory(studentId: number) {
    this.historyLoading.set(true);

    this.examApi.getExamHistory(studentId).subscribe({
      next: (response: any) => {
        this.examHistory.set(response.data);
        this.historyLoading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load exam history:', error);
        this.toast.showError('فشل تحميل سجل الامتحانات');
        this.historyLoading.set(false);
      }
    });
  }

  /**
   * Start exam
   */
  startExam(examId: number, title: string) {
    // Check if there's a saved state for this exam
    const savedStateKey = `exam_state_`;
    let hasExistingExam = false;

    // Search for existing exam state in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(savedStateKey)) {
        try {
          const state = JSON.parse(localStorage.getItem(key) || '{}');
          if (state.exam?.id === examId) {
            hasExistingExam = true;

            // Ask if user wants to continue
            if (confirm(`لديك امتحان "${title}" غير مكتمل.\nهل تريد المتابعة من حيث توقفت؟`)) {
              // Navigate directly to exam with existing state
              const studentExamId = state.studentExamId;
              this.router.navigate(['/student/exam', studentExamId]);
              return;
            } else {
              // Clear old state and start fresh
              localStorage.removeItem(key);
              break;
            }
          }
        } catch (e) {
          // Invalid state, ignore
        }
      }
    }

    // Start new exam
    if (!hasExistingExam) {
      if (!confirm(`هل تريد بدء امتحان "${title}"؟\nسيبدأ العد التنازلي فوراً.`)) {
        return;
      }
    }

    this.examApi.startExam(examId).subscribe({
      next: (response: any) => {
        this.toast.showSuccess('تم بدء الامتحان بنجاح');
        this.router.navigate(['/student/exam', response.studentExamId]);
      },
      error: (error: any) => {
        console.error('Failed to start exam:', error);
        if (error.error?.existingStudentExamId) {
          // Already started, navigate to it
          this.router.navigate(['/student/exam', error.error.existingStudentExamId]);
        } else {
          this.toast.showError('فشل بدء الامتحان');
        }
      }
    });
  }

  /**
   * View exam result
   */
  viewResult(studentExamId: number) {
    this.router.navigate(['/student/exam-result', studentExamId]);
  }

  /**
   * Switch tab
   */
  switchTab(tab: 'upcoming' | 'history') {
    this.activeTab.set(tab);
  }

  /**
   * Get exam type label
   */
  getExamTypeLabel(type: ExamType): string {
    return getExamTypeLabel(type);
  }

  /**
   * Get exam type icon
   */
  getExamTypeIcon(type: ExamType): string {
    return getExamTypeIcon(type);
  }

  /**
   * Get grade color
   */
  getGradeColor(grade?: string): string {
    return getGradeColor(grade);
  }

  /**
   * Check if exam is available now
   */
  isExamAvailable(exam: UpcomingExamDto): boolean {
    return exam.isAvailableNow;
  }

  /**
   * Get status badge class
   */
  getStatusClass(exam: ExamHistoryDto): string {
    if (!exam.isCompleted) return 'in-progress';
    if (!exam.isGraded) return 'pending';
    return exam.isPassed ? 'passed' : 'failed';
  }

  /**
   * Get status text
   */
  getStatusText(exam: ExamHistoryDto): string {
    if (!exam.isCompleted) return 'لم يكتمل';
    if (!exam.isGraded) return 'قيد التصحيح';
    return exam.isPassed ? 'ناجح' : 'راسب';
  }
}
