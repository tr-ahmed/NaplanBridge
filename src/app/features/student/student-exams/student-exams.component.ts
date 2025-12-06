import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ExamApiService } from '../../../core/services/exam-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DashboardService } from '../../../core/services/dashboard.service';
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
  enrolledSubjectIds = signal<number[]>([]); // Store student's enrolled subject IDs
  enrolledSubjectNames = signal<string[]>([]); // Store student's enrolled subject names for filtering
  enrolledYearNames = signal<string[]>([]); // Store student's year names (e.g., "Year 7", "Year 8")

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
    const enrolledNames = this.enrolledSubjectNames();
    const enrolledYears = this.enrolledYearNames();

    // Filter by enrolled subject names (API returns 'subject' field as name, not subjectId)
    let filtered = enrolledNames.length > 0 
      ? exams.filter(exam => {
          const examSubject = exam.subject || exam.subjectName || '';
          const subjectMatch = enrolledNames.some(name => 
            examSubject.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(examSubject.toLowerCase())
          );
          
          // Also check if exam's subject contains student's year
          // (e.g., "Linear Algebra Year 8" should match "Year 8")
          const yearMatch = enrolledYears.length === 0 || enrolledYears.some(year => 
            examSubject.toLowerCase().includes(year.toLowerCase())
          );
          
          return subjectMatch && yearMatch;
        })
      : exams;

    // Then filter by selected subject if any
    if (subjectId) {
      filtered = filtered.filter(exam => exam.subjectId === subjectId);
    }

    return filtered;
  });

  // ✅ Computed: Check if any exam is currently available or in progress
  hasLiveExams = computed(() => {
    return this.upcomingExams().some(exam => this.isExamAvailable(exam) || exam.isInProgress);
  });

  // ✅ Computed: Count of live exams (available + in-progress)
  liveExamsCount = computed(() => {
    return this.upcomingExams().filter(exam => this.isExamAvailable(exam) || exam.isInProgress).length;
  });

  // ✅ Computed: Check if has upcoming exams but none are live
  hasUpcomingButNoLive = computed(() => {
    return this.upcomingExams().length > 0 && !this.hasLiveExams();
  });

  filteredHistory = computed(() => {
    const subjectId = this.selectedSubjectId();
    const history = this.allExamHistory();
    const enrolledNames = this.enrolledSubjectNames();
    const enrolledYears = this.enrolledYearNames();

    // Filter by enrolled subject names (API returns 'subject' field as name, not subjectId)
    let filtered = enrolledNames.length > 0 
      ? history.filter(exam => {
          const examSubject = exam.subject || exam.subjectName || exam.examSubject || '';
          const subjectMatch = enrolledNames.some(name => 
            examSubject.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(examSubject.toLowerCase())
          );
          
          // Also check if exam's subject contains student's year
          const yearMatch = enrolledYears.length === 0 || enrolledYears.some(year => 
            examSubject.toLowerCase().includes(year.toLowerCase())
          );
          
          return subjectMatch && yearMatch;
        })
      : history;

    // Then filter by selected subject if any
    if (subjectId) {
      filtered = filtered.filter(exam => exam.subjectId === subjectId);
    }

    return filtered;
  });

  constructor(
    private examApi: ExamApiService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
    private dashboardService: DashboardService
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
      // Load student's enrolled subjects first
      this.loadEnrolledSubjects(studentId);
      this.loadUpcomingExams(studentId);
      this.loadExamHistory(studentId);
    } else {
      // Fallback to userId if studentId not available
      const userId = this.auth.getUserId();
      if (userId) {
        console.warn('⚠️ Using userId instead of studentId');
        this.loadEnrolledSubjects(userId);
        this.loadUpcomingExams(userId);
        this.loadExamHistory(userId);
      } else {
        this.toast.showError('Student ID not found. Please login again.');
      }
    }
  }

  /**
   * Load student's enrolled subjects to filter exams
   */
  loadEnrolledSubjects(studentId: number) {
    this.dashboardService.getStudentSubscriptionsSummary(studentId).subscribe({
      next: (response: any) => {
        console.log('📚 Student Subscriptions:', response);
        
        // Extract subject IDs, names, and year names from subscriptions
        const subscriptions = response.subscriptions || [];
        const subjectIds = subscriptions.map((sub: any) => sub.subjectId).filter((id: number) => id);
        const subjectNames = subscriptions.map((sub: any) => sub.subjectName).filter((name: string) => name);
        const yearNames = [...new Set(subscriptions.map((sub: any) => sub.yearName).filter((name: string) => name))];
        
        this.enrolledSubjectIds.set(subjectIds);
        this.enrolledSubjectNames.set(subjectNames);
        this.enrolledYearNames.set(yearNames);
        console.log('✅ Enrolled Subjects:', { ids: subjectIds, names: subjectNames, years: yearNames });
        
        // ✅ Update displayed exams after loading enrolled subjects
        this.updateDisplayedExams();
      },
      error: (error) => {
        console.error('❌ Error loading enrolled subjects:', error);
        // Continue without filtering - show all exams as fallback
        this.toast.showError('Could not load your enrolled subjects.');
      }
    });
  }

  /**
   * Update displayed exams based on current filters
   */
  updateDisplayedExams() {
    this.upcomingExams.set(this.filteredUpcoming());
    this.examHistory.set(this.filteredHistory());
    
    console.log('🔄 Updated displayed exams:', {
      enrolledSubjects: this.enrolledSubjectIds().length,
      enrolledNames: this.enrolledSubjectNames(),
      enrolledYears: this.enrolledYearNames(),
      allUpcoming: this.allUpcomingExams().length,
      filteredUpcoming: this.upcomingExams().length,
      allHistory: this.allExamHistory().length,
      filteredHistory: this.examHistory().length
    });
  }

  /**
   * Load upcoming exams (including in-progress)
   */
  loadUpcomingExams(studentId: number) {
    this.loading.set(true);

    // ✅ Use /all endpoint to get both upcoming AND in-progress exams
    this.examApi.getAllStudentExams(studentId).subscribe({
      next: (response: any) => {
        console.log('📚 All Exams Data:', response.data);

        // Extract exams from response
        const exams = response.data?.exams || response.data || [];
        console.log('📚 Exams array:', exams);

        // ✅ Filter to show only:
        // 1. Exams that haven't been completed (no submittedAt)
        // 2. OR exams that are InProgress
        const now = new Date();
        const upcomingAndInProgress = exams.filter((exam: any) => {
          const startDate = new Date(exam.startDate || exam.startTime);
          const endDate = new Date(exam.endDate || exam.endTime);

          // Check if exam is InProgress (from student_exams table)
          const hasInProgressAttempt = exam.status === 'InProgress' || exam.studentExamStatus === 'InProgress';

          // Check if exam hasn't been submitted
          const notSubmitted = !exam.submittedAt && !exam.completedDate;

          // Check if exam is still within time window
          const withinTimeWindow = endDate > now;

          // Show if:
          // - Has in-progress attempt, OR
          // - Not submitted AND still within time window
          return hasInProgressAttempt || (notSubmitted && withinTimeWindow);
        });

        console.log('📚 Filtered upcoming + in-progress:', upcomingAndInProgress.length, 'exams');

        // Process exams and calculate availability
        const processedExams = upcomingAndInProgress.map((exam: any) => {
          const startDate = new Date(exam.startDate || exam.startTime);
          const endDate = new Date(exam.endDate || exam.endTime);

          // Calculate if available now
          const isAvailableNow = now >= startDate && now <= endDate;

          // Check if it's in progress
          const isInProgress = exam.status === 'InProgress' || exam.studentExamStatus === 'InProgress';

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
          console.log(`📋 Exam: ${exam.title || exam.examTitle}`);
          console.log(`🕐 Current Time: ${now.toLocaleString()}`);
          console.log(`📅 Start Time: ${startDate.toLocaleString()}`);
          console.log(`📅 End Time: ${endDate.toLocaleString()}`);
          console.log(`${isInProgress ? '🔄' : isAvailableNow ? '🟢' : '🔴'} Status: ${isInProgress ? 'In Progress' : isAvailableNow ? 'Available' : 'Not Started'}`);
          console.log(`⏱️  Remaining Time: ${remainingTime}`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

          return {
            ...exam,
            isAvailableNow,
            isInProgress,
            remainingTime
          };
        });

        this.allUpcomingExams.set(processedExams || []);
        // ✅ Update displayed exams after filtering
        this.updateDisplayedExams();
        this.loading.set(false);

        console.log('✅ Loaded upcoming exams:', {
          total: processedExams?.length || 0,
          enrolled: this.enrolledSubjectIds().length,
          filtered: this.upcomingExams().length,
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

        // ✅ FIX: Filter out exams that are still available (not actually completed)
        // Backend bug: Sometimes returns exams in history that haven't been taken yet
        // Also, InProgress exams should be in Upcoming, not History
        const now = new Date();
        const validHistory = history.filter((exam: any) => {
          // Check if exam has a valid completedDate that's in the past
          const completedDate = exam.completedDate ? new Date(exam.completedDate) : null;
          const endDate = exam.endDate ? new Date(exam.endDate) : null;

          // ❌ Exclude InProgress exams - they belong in Upcoming tab
          if (exam.status === 'InProgress') {
            console.log(`⚠️ Filtering out InProgress exam from history: "${exam.examTitle}" - should be in Upcoming`);
            return false;
          }

          // ✅ Check 1: If exam has submittedAt, it's definitely completed
          if (exam.submittedAt) {
            return true;
          }

          // ✅ Check 2: If status is 'Graded', 'Submitted', or 'Completed', show it
          if (exam.status === 'Graded' || exam.status === 'Submitted' || exam.status === 'Completed') {
            return true;
          }

          // ✅ Check 3: If score > 0 or correctAnswers > 0, student took the exam
          if ((exam.score && exam.score > 0) || (exam.correctAnswers && exam.correctAnswers > 0)) {
            return true;
          }

          // ✅ Check 4: If totalQuestions exists and correctAnswers is defined (even if 0), student took it
          if (exam.totalQuestions && exam.correctAnswers !== undefined && exam.correctAnswers !== null) {
            // But make sure it's not an active exam that was auto-started by backend bug
            if (endDate && endDate > now && exam.score === 0 && exam.correctAnswers === 0) {
              console.warn(`⚠️ Filtering out exam "${exam.examTitle}" - still available (ends ${endDate.toLocaleString()}) with 0 score`);
              return false;
            }
            return true;
          }

          // ❌ Check 5: If exam end date is in the future and score is 0, it's probably a backend bug
          if (endDate && endDate > now && exam.score === 0) {
            console.warn(`⚠️ Filtering out exam "${exam.examTitle}" - still available and not attempted`);
            return false;
          }

          // Default: include it
          return true;
        });

        console.log('📊 [HISTORY DEBUG] Valid history after filtering:', validHistory.length);

        // Log first item details if exists
        if (validHistory.length > 0) {
          console.log('📊 [HISTORY DEBUG] First exam details:', validHistory[0]);
          console.log('📊 [HISTORY DEBUG] First exam keys:', Object.keys(validHistory[0]));
        }

        this.allExamHistory.set(validHistory);
        // ✅ Update displayed exams after filtering
        this.updateDisplayedExams();
        this.historyLoading.set(false);

        console.log('✅ Loaded exam history:', {
          total: history.length,
          filtered: this.examHistory().length,
          enrolled: this.enrolledSubjectIds().length,
          subjectFilter: this.selectedSubjectId()
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
   * ✅ Continue an in-progress exam
   */
  continueExam(exam: any) {
    console.log('🔄 Continuing exam:', exam);

    // Navigate directly to the exam using studentExamId if available
    if (exam.studentExamId) {
      this.router.navigate(['/student/exam', exam.studentExamId]);
    } else {
      // Fallback: start the exam normally
      this.startExam(exam.id, exam.title || exam.examTitle);
    }
  }

  /**
   * ✅ NEW: Actually start the exam
   */
  private doStartExam(examId: number) {
    this.examApi.startExam(examId).subscribe({
      next: (response: any) => {
        console.log('✅ Exam started successfully:', response);
        console.log('📋 Full response structure:', JSON.stringify(response, null, 2));
        console.log('⏱️ Duration fields:', {
          durationMinutes: response.durationMinutes,
          durationInMinutes: response.durationInMinutes,
          duration: response.duration
        });
        console.log('📝 Questions:', response.questions?.length || 0);
        if (response.questions?.length > 0) {
          console.log('📋 First question:', JSON.stringify(response.questions[0], null, 2));
          if (response.questions[0].options?.length > 0) {
            console.log('🔘 First option:', JSON.stringify(response.questions[0].options[0], null, 2));
          }
        }

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
