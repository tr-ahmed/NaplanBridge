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
  examHistory = signal<any[]>([]); // ✅ Changed to any[] to support actual API response
  allUpcomingExams = signal<UpcomingExamDto[]>([]); // Store all exams
  allExamHistory = signal<any[]>([]); // ✅ Changed to any[] to support actual API response

  // UI State
  loading = signal(false);
  historyLoading = signal(false);
  activeTab = signal<'upcoming' | 'history'>('upcoming');
  selectedSubjectId = signal<number | null>(null);
  startingExam = signal(false); // ✅ Prevent double-click on start exam

  // Computed filtered lists
  filteredUpcoming = computed(() => {
    const subjectId = this.selectedSubjectId();
    const exams = this.allUpcomingExams();
    if (!subjectId) return exams;
    // Note: We can't filter by subjectId since the API doesn't return it
    // The filtering would need to be done on the backend or we need subject names
    return exams;
  });

  // ✅ Computed: Check if any exam is currently available
  hasLiveExams = computed(() => {
    return this.upcomingExams().some(exam => this.isExamAvailable(exam));
  });

  // ✅ Computed: Count of live exams
  liveExamsCount = computed(() => {
    return this.upcomingExams().filter(exam => this.isExamAvailable(exam)).length;
  });

  // ✅ Computed: Check if has upcoming exams but none are live
  hasUpcomingButNoLive = computed(() => {
    return this.upcomingExams().length > 0 && !this.hasLiveExams();
  });

  filteredHistory = computed(() => {
    const subjectId = this.selectedSubjectId();
    const history = this.allExamHistory();
    if (!subjectId) return history;
    // Note: We can't filter by subjectId since the API doesn't return it
    // The filtering would need to be done on the backend or we need subject names
    return history;
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

          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`📋 Exam: ${exam.title}`);
          console.log(`🕐 Current Time: ${now.toLocaleString()}`);
          console.log(`📅 Start Time: ${startDate.toLocaleString()}`);
          console.log(`📅 End Time: ${endDate.toLocaleString()}`);
          console.log(`${isAvailableNow ? '🟢' : '🔴'} Available Now: ${isAvailableNow}`);
          console.log(`⏱️  Remaining Time: ${remainingTime}`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

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
        console.log('📊 [HISTORY DEBUG] Full Response:', response);
        console.log('📊 [HISTORY DEBUG] Response.data:', response.data);
        console.log('📊 [HISTORY DEBUG] Response.data.examHistory:', response.data?.examHistory);

        // Try different possible response structures
        let history = [];
        if (response.data?.examHistory) {
          history = response.data.examHistory;
        } else if (response.data && Array.isArray(response.data)) {
          history = response.data;
        } else if (response.examHistory) {
          history = response.examHistory;
        } else if (Array.isArray(response)) {
          history = response;
        }

        console.log('📊 [HISTORY DEBUG] Parsed history array:', history);
        console.log('📊 [HISTORY DEBUG] History length:', history.length);

        // Log first item details if exists
        if (history.length > 0) {
          console.log('📊 [HISTORY DEBUG] First exam details:', history[0]);
          console.log('📊 [HISTORY DEBUG] First exam keys:', Object.keys(history[0]));

          // ⚠️ Check if backend bug exists
          if (history[0].score === 0 && history[0].status === 'Completed') {
            console.error('🐛 [BACKEND BUG DETECTED] Score is 0 but exam is completed!');
            console.error('🐛 Backend endpoint /api/exam/student/{studentId}/history is broken');
            console.error('🐛 See BACKEND_REPORT_EXAM_HISTORY_WRONG_SCORE.md for fix');
          }
        }

        this.allExamHistory.set(history);
        this.examHistory.set(this.filteredHistory());
        this.historyLoading.set(false);        console.log('✅ Loaded exam history:', {
          total: history.length,
          filtered: this.filteredHistory().length,
          subjectFilter: this.selectedSubjectId(),
          examHistorySignal: this.examHistory()
        });
      },
      error: (error: any) => {
        console.error('❌ Failed to load exam history:', error);
        console.error('❌ Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        this.toast.showError('Failed to load exam history');
        this.historyLoading.set(false);
      }
    });
  }

  /**
   * Start exam - ✅ UPDATED: Now checks backend for in-progress exam first
   * ✅ Added double-click protection
   */
  startExam(examId: number, title: string) {
    // ✅ Prevent double-click
    if (this.startingExam()) {
      console.log('⚠️ Already starting exam, ignoring duplicate click');
      return;
    }
    this.startingExam.set(true);

    // ✅ STEP 1: Check backend for in-progress exam
    this.examApi.checkInProgressExam(examId).subscribe({
      next: (response) => {
        const data = response.data;
        console.log('📋 Check in-progress response:', data);

        if (data.hasInProgressExam && data.studentExamId) {
          // ✅ Found in-progress exam on backend
          console.log('✅ Found in-progress exam:', data.studentExamId);
          this.startingExam.set(false);

          if (confirm(`You have an incomplete exam "${title}" (${data.answeredQuestions || 0}/${data.totalQuestions || 0} questions answered).\n\nRemaining time: ${Math.floor((data.remainingTimeSeconds || 0) / 60)} minutes\n\nDo you want to continue?`)) {
            // Navigate to resume exam
            this.router.navigate(['/student/exam', data.studentExamId]);
          }
          return;
        }

        if (data.previousAttemptExpired && data.studentExamId) {
          // ❌ Previous attempt expired
          console.log('⚠️ Previous attempt expired');
          this.startingExam.set(false);
          this.toast.showWarning('Your previous attempt has expired and was auto-submitted.');
          this.router.navigate(['/student/exam-result', data.studentExamId]);
          return;
        }

        // ✅ No in-progress exam - check localStorage as backup
        this.checkLocalStorageAndStart(examId, title);
      },
      error: (error) => {
        console.error('❌ Error checking in-progress exam:', error);
        // Fallback to localStorage check
        this.checkLocalStorageAndStart(examId, title);
      }
    });
  }

  /**
   * ✅ NEW: Check localStorage and start exam
   */
  private checkLocalStorageAndStart(examId: number, title: string) {
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
            this.startingExam.set(false);

            // Ask if user wants to continue
            if (confirm(`You have an incomplete exam "${title}".\nDo you want to continue from where you left off?`)) {
              const studentExamId = state.studentExamId;
              this.router.navigate(['/student/exam', studentExamId]);
              return;
            } else {
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
        this.startingExam.set(false);
        return;
      }
    }

    this.doStartExam(examId);
  }

  /**
   * ✅ NEW: Actually start the exam
   */
  private doStartExam(examId: number) {
    this.examApi.startExam(examId).subscribe({
      next: (response: any) => {
        console.log('✅ Exam started successfully:', response);
        this.startingExam.set(false);

        if (response.questions && response.questions.length > 0) {
          console.log('✅ Questions received:', response.questions.length);

          this.router.navigate(['/student/exam', response.studentExamId], {
            state: {
              examData: response,
              fromStart: true
            }
          });
        } else {
          console.warn('⚠️ No questions in response');
          this.router.navigate(['/student/exam', response.studentExamId]);
          this.toast.showWarning('Exam started but questions data is missing. Please contact support.');
        }

        this.toast.showSuccess('Exam started successfully');
      },
      error: (error: any) => {
        console.error('Failed to start exam:', error);
        this.startingExam.set(false);

        // ✅ Better error handling
        if (error.status === 400) {
          const errorMessage = error.error?.message || error.error?.Message || 'Cannot start exam';
          console.log('📋 400 Error details:', error.error);

          // Check for existing exam
          if (error.error?.existingStudentExamId) {
            this.toast.showInfo('You already have an exam in progress');
            this.router.navigate(['/student/exam', error.error.existingStudentExamId]);
            return;
          }

          // Check for completed exam
          if (errorMessage.toLowerCase().includes('already completed') || errorMessage.toLowerCase().includes('already submitted')) {
            this.toast.showWarning('You have already completed this exam');
            return;
          }

          // Check for time issues
          if (errorMessage.toLowerCase().includes('not started') || errorMessage.toLowerCase().includes('not yet')) {
            this.toast.showWarning('This exam has not started yet');
            return;
          }

          if (errorMessage.toLowerCase().includes('ended') || errorMessage.toLowerCase().includes('expired')) {
            this.toast.showWarning('This exam has already ended');
            return;
          }

          this.toast.showError(errorMessage);
        } else {
          this.toast.showError('Failed to start exam. Please try again.');
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
  getExamTypeLabel(type: ExamType | string): string {
    // Convert string to ExamType enum if needed
    const examType = typeof type === 'string' ? (type as ExamType) : type;
    return getExamTypeLabel(examType);
  }

  /**
   * Get exam type icon
   */
  getExamTypeIcon(type: ExamType | string): string {
    // Convert string to ExamType enum if needed
    const examType = typeof type === 'string' ? (type as ExamType) : type;
    return getExamTypeIcon(examType);
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
   * ✅ Calculate score percentage from exam history
   * Backend returns decimal (0.75 for 75%), convert to percentage
   */
  getScorePercentage(exam: any): number {
    // Backend now returns score as decimal (0.75 for 75%)
    // Multiply by 100 to get percentage
    return (exam.score || 0) * 100;
  }

  /**
   * ✅ Get grade letter based on percentage
   */
  getGradeLetter(exam: any): string {
    const percentage = this.getScorePercentage(exam);
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  /**
   * Check if there are exams with zero score
   */
  hasZeroScoreExams(): boolean {
    return this.examHistory().some(e => e.score === 0 && e.status === 'Completed');
  }

  /**
   * Get status badge class
   */
  getStatusClass(exam: ExamHistoryDto): string {
    if (exam.status === 'Pending') return 'pending';
    if (exam.status === 'In Progress') return 'in-progress';
    const percentage = (exam.score / exam.totalMarks) * 100;
    return percentage >= 50 ? 'passed' : 'failed';
  }

  /**
   * Get status text
   */
  getStatusText(exam: ExamHistoryDto): string {
    if (exam.status === 'Pending') return 'قيد التصحيح';
    if (exam.status === 'In Progress') return 'لم يكتمل';
    const percentage = (exam.score / exam.totalMarks) * 100;
    return percentage >= 50 ? 'ناجح' : 'راسب';
  }
}
