import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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
  allUpcomingExams = signal<UpcomingExamDto[]>([]); // Store all exams
  allExamHistory = signal<ExamHistoryDto[]>([]); // Store all history

  // UI State
  loading = signal(false);
  historyLoading = signal(false);
  activeTab = signal<'upcoming' | 'history'>('upcoming');
  selectedSubjectId = signal<number | null>(null);

  // Computed filtered lists
  filteredUpcoming = computed(() => {
    const subjectId = this.selectedSubjectId();
    const exams = this.allUpcomingExams();
    if (!subjectId) return exams;
    return exams.filter(exam => exam.subjectId === subjectId);
  });

  filteredHistory = computed(() => {
    const subjectId = this.selectedSubjectId();
    const history = this.allExamHistory();
    if (!subjectId) return history;
    return history.filter(exam => exam.subjectId === subjectId);
  });

  constructor(
    private examApi: ExamApiService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // Get subjectId from query params
    this.route.queryParams.subscribe(params => {
      if (params['subjectId']) {
        this.selectedSubjectId.set(parseInt(params['subjectId'], 10));
      }
    });

    // Use correct studentId from AuthService
    const studentId = this.auth.getStudentId();
    if (studentId) {
      this.loadUpcomingExams(studentId);
      this.loadExamHistory(studentId);
    } else {
      // Fallback to userId if studentId not available
      const userId = this.auth.getUserId();
      if (userId) {
        console.warn('⚠️ Using userId instead of studentId');
        this.loadUpcomingExams(userId);
        this.loadExamHistory(userId);
      } else {
        this.toast.showError('Student ID not found. Please login again.');
      }
    }
  }

  /**
   * Load upcoming exams
   */
  loadUpcomingExams(studentId: number) {
    this.loading.set(true);

    this.examApi.getUpcomingExams(studentId).subscribe({
      next: (response: any) => {
        console.log('📚 Upcoming Exams Data:', response.data.exams);

        // Process exams and calculate availability
        const processedExams = response.data.exams?.map((exam: any) => {
          const now = new Date();
          const startDate = new Date(exam.startDate);
          const endDate = new Date(exam.endDate);

          // Calculate if available now
          const isAvailableNow = now >= startDate && now <= endDate;

          // Calculate remaining time
          let remainingTime = '';
          if (now < startDate) {
            // Exam hasn't started yet
            const diffMs = startDate.getTime() - now.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            if (diffDays > 0) {
              remainingTime = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
            } else if (diffHours > 0) {
              remainingTime = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
            } else {
              remainingTime = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
            }
          } else if (isAvailableNow) {
            // Exam is running
            const diffMs = endDate.getTime() - now.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            if (diffHours > 0) {
              remainingTime = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
            } else {
              remainingTime = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
            }
          }

          console.log(`Exam: ${exam.title}`);
          console.log(`  Start: ${exam.startDate}`);
          console.log(`  End: ${exam.endDate}`);
          console.log(`  Available Now: ${isAvailableNow}`);
          console.log(`  Remaining Time: ${remainingTime}`);

          return {
            ...exam,
            isAvailableNow,
            remainingTime
          };
        });

        this.allUpcomingExams.set(processedExams || []);
        this.upcomingExams.set(this.filteredUpcoming());
        this.loading.set(false);

        console.log('✅ Loaded upcoming exams:', {
          total: processedExams?.length || 0,
          filtered: this.filteredUpcoming().length,
          subjectFilter: this.selectedSubjectId()
        });
      },
      error: (error: any) => {
        console.error('Failed to load upcoming exams:', error);
        this.toast.showError('Failed to load upcoming exams');
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
        console.log('📊 Exam History Data:', response.data?.examHistory);
        const history = response.data?.examHistory || response.data || [];
        this.allExamHistory.set(history);
        this.examHistory.set(this.filteredHistory());
        this.historyLoading.set(false);

        console.log('✅ Loaded exam history:', {
          total: history.length,
          filtered: this.filteredHistory().length,
          subjectFilter: this.selectedSubjectId()
        });
      },
      error: (error: any) => {
        console.error('Failed to load exam history:', error);
        this.toast.showError('Failed to load exam history');
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
            if (confirm(`You have an incomplete exam "${title}".\nDo you want to continue from where you left off?`)) {
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
      if (!confirm(`Do you want to start the exam "${title}"?\nThe timer will start immediately.`)) {
        return;
      }
    }

    this.examApi.startExam(examId).subscribe({
      next: (response: any) => {
        this.toast.showSuccess('Exam started successfully');
        this.router.navigate(['/student/exam', response.studentExamId]);
      },
      error: (error: any) => {
        console.error('Failed to start exam:', error);
        if (error.error?.existingStudentExamId) {
          // Already started, navigate to it
          this.router.navigate(['/student/exam', error.error.existingStudentExamId]);
        } else {
          this.toast.showError('Failed to start exam');
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
   * Clear subject filter
   */
  clearSubjectFilter() {
    this.selectedSubjectId.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { subjectId: null },
      queryParamsHandling: 'merge'
    });
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
    // The exam object now has isAvailableNow calculated in loadUpcomingExams
    return exam.isAvailableNow === true;
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
