/**
 * Student Dashboard Component
 * Main dashboard for student with overview of progress, subscriptions, exams, and activities
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { ExamService } from '../../core/services/exam.service';
import { LessonService } from '../../core/services/lesson.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  StudentProgress,
  SubjectProgress
} from '../../models/progress.models';
import { StudentSubscription } from '../../models/subscription.models';
import { ExamHistory, RecentActivity } from '../../models/dashboard.models';

interface DashboardStats {
  totalLessonsCompleted: number;
  totalExamsTaken: number;
  averageScore: number;
  currentStreak: number;
  activeSubscriptions: number;
  upcomingExams: number;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss'
})
export class StudentDashboardComponent implements OnInit {
  // Services
  private progressService = inject(ProgressService);
  private subscriptionService = inject(SubscriptionService);
  private examService = inject(ExamService);
  private lessonService = inject(LessonService);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  studentUsername = signal<string>('Student');  // ✅ Username signal

  // Data
  studentId: number = 0;
  progress = signal<StudentProgress | null>(null);
  progressSummary = signal<any>({
    studentId: 0,
    overallProgress: 0,
    completedLessons: 0,
    totalLessons: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    lastActivityDate: null
  }); // ✅ Progress summary from backend API
  subscriptions = signal<StudentSubscription[]>([]);
  examHistory = signal<ExamHistory[]>([]);
  recentActivities = signal<RecentActivity[]>([]);
  upcomingExams = signal<any[]>([]);
  enrolledSubjects = signal<any[]>([]); // المواد المشترك فيها
  inProgressLessons = signal<any[]>([]); // الدروس قيد التقدم

  // Stats
  stats = signal<DashboardStats>({
    totalLessonsCompleted: 0,
    totalExamsTaken: 0,
    averageScore: 0,
    currentStreak: 0,
    activeSubscriptions: 0,
    upcomingExams: 0
  });

  // Computed values
  overallProgress = computed(() => {
    const summary = this.progressSummary();
    return Math.round(summary?.overallProgress || 0);
  });

  completedLessons = computed(() => {
    const summary = this.progressSummary();
    return summary?.completedLessons || 0;
  });

  totalLessons = computed(() => {
    const summary = this.progressSummary();
    return summary?.totalLessons || 0;
  });

  activeSubsCount = computed(() => {
    const subs = this.subscriptions();

    if (!Array.isArray(subs) || subs.length === 0) {
      return 0;
    }

    // Handle different subscription formats:
    // Backend may return subscriptions with different property names
    const activeCount = subs.filter(s => {
      // Check for 'status' property
      if (s.status) {
        return s.status === 'Active';
      }

      // Check for 'isActive' property
      if (s.hasOwnProperty('isActive')) {
        return s.isActive === true;
      }

      // Check date-based active status
      if (s.endDate) {
        const endDate = new Date(s.endDate);
        const now = new Date();
        return endDate > now;
      }

      // Default: consider all subscriptions as active if no status indicator
      return true;
    }).length;

    return activeCount;
  });

  hasActiveSubscription = computed(() => this.activeSubsCount() > 0);

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();

    // ✅ Get student username for welcome message
    if (currentUser && currentUser.userName) {
      this.studentUsername.set(currentUser.userName);
    }

    if (currentUser && this.authService.hasRole('Student')) {
      // ✅ CRITICAL: Use studentId (Student.Id) NOT userId (User.Id)
      // studentId is from Students table and required for API calls
      const studentId = this.authService.getStudentId();
      if (studentId) {
        this.studentId = studentId;
        console.log('🎓 Loading dashboard for Student.Id:', studentId);
        this.loadDashboardData();
      } else {
        // Fallback: try using userId if studentId is not in token
        const userId = this.authService.getUserId();
        if (userId) {
          console.warn('⚠️ studentId not found in token, using userId (may cause issues)');
          this.studentId = userId;
          this.loadDashboardData();
        } else {
          this.error.set('Unable to get student ID');
          this.toastService.showError('Student ID not found. Please re-login.');
          this.router.navigate(['/auth/login']);
        }
      }
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Load all dashboard data
   */
  private loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load data using individual working endpoints with error handling
    this.loadAvailableEndpoints();
  }

  /**
   * Load data from available endpoints individually with fallbacks
   */
  private loadAvailableEndpoints(): void {
    const loadPromises = [
      this.safeLoadProgressSummary(),
      this.safeLoadSubscriptions(),
      this.safeLoadEnrolledSubjects(),
      this.safeLoadAchievements(),
      this.safeLoadExamHistory(),
      this.safeLoadRecentActivities(),
      this.safeLoadUpcomingExams(),
      this.safeLoadInProgressLessons()
    ];

    Promise.allSettled(loadPromises).then((results) => {
      console.log('📊 Dashboard load results:', results);

      // Check how many succeeded
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`✅ Loaded: ${succeeded}/${results.length} sections`);
      if (failed > 0) {
        console.warn(`⚠️ Failed: ${failed} sections (backend not deployed yet)`);
      }

      this.calculateStatsFromAvailableData();
      this.loading.set(false);

      if (failed > 0) {
        this.toastService.showWarning(`Dashboard loaded (${succeeded}/${results.length} sections available)`);
      } else {
        this.toastService.showSuccess('Dashboard loaded successfully');
      }
    });
  }

  /**
   * Safely load progress summary with fallback
   */
  private safeLoadProgressSummary(): Promise<any> {
    return new Promise((resolve) => {
      this.progressService.getStudentProgressSummary(this.studentId).subscribe({
        next: (summary) => {
          console.log('📊 [STUDENT DASHBOARD] Progress Summary:', summary);
          this.progressSummary.set(summary);
          resolve(summary);
        },
        error: (err) => {
          console.error('⚠️ [STUDENT DASHBOARD] Progress summary endpoint failed:', err);
          this.progressSummary.set({
            studentId: this.studentId,
            overallProgress: 0,
            completedLessons: 0,
            totalLessons: 0,
            averageScore: 0,
            totalTimeSpent: 0,
            lastActivityDate: null
          });
          resolve(null);
        }
      });
    });
  }

  /**
   * Safely load subscriptions with fallback
   */
  private safeLoadSubscriptions(): Promise<any> {
    return new Promise((resolve) => {
      this.dashboardService.getStudentSubscriptionsSummary(this.studentId).subscribe({
        next: (response) => {
          console.log('📦 [STUDENT DASHBOARD] Raw subscriptions response:', response);

          let subsArray: any[] = [];

          if (response) {
            // Response comes as { subscriptions: [...], totalActiveSubscriptions: X }
            if (response.subscriptions && Array.isArray(response.subscriptions)) {
              subsArray = response.subscriptions;
            } else if (Array.isArray(response)) {
              subsArray = response;
            } else if (typeof response === 'object' && !response.subscriptions) {
              // Single subscription object
              subsArray = [response];
            }
          }

          console.log(`✅ [STUDENT DASHBOARD] Loaded ${subsArray.length} subscription(s):`, subsArray);
          console.log(`📊 [STUDENT DASHBOARD] Setting subscriptions signal with:`, subsArray);
          this.subscriptions.set(subsArray);

          resolve(subsArray);
        },
        error: (err) => {
          console.error('⚠️ [STUDENT DASHBOARD] Subscriptions endpoint failed:', err);
          this.subscriptions.set([]);
          resolve([]);
        }
      });
    });
  }

  /**
   * Safely load enrolled subjects with progress
   */
  private safeLoadEnrolledSubjects(): Promise<any> {
    return new Promise((resolve) => {
      this.dashboardService.getStudentSubscriptionsSummary(this.studentId).subscribe({
        next: (response) => {
          console.log('📚 Subscriptions response:', response);

          // Now load progress for each subject
          this.progressService.getStudentProgress(this.studentId).subscribe({
            next: (progressData: any) => {
              console.log('📊 Progress data:', progressData);

              let subsArray: any[] = [];
              if (response) {
                if (Array.isArray(response)) {
                  subsArray = response;
                } else if (response.subscriptions && Array.isArray(response.subscriptions)) {
                  subsArray = response.subscriptions;
                } else if (typeof response === 'object') {
                  subsArray = [response];
                }
              }

              // Map subscriptions to subjects with progress
              const subjectsMap = new Map<number, any>();

              subsArray.forEach(sub => {
                const subjectId = sub.subjectId;
                const subjectName = sub.subjectName || sub.subject || 'Unknown Subject';

                if (!subjectsMap.has(subjectId)) {
                  // Filter progress for this subject
                  let subjectProgress: any[] = [];
                  if (Array.isArray(progressData)) {
                    subjectProgress = progressData.filter((p: any) => p.subjectId === subjectId);
                  }

                  const completedLessons = subjectProgress.filter((p: any) => p.isCompleted).length;
                  const totalLessons = subjectProgress.length;
                  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                  subjectsMap.set(subjectId, {
                    subjectId,
                    subjectName,
                    progress: progressPercentage,
                    completedLessons,
                    totalLessons,
                    isActive: sub.isActive !== false,
                    expiryDate: sub.expiryDate || sub.endDate
                  });
                }
              });

              const enrolledSubjectsArray = Array.from(subjectsMap.values());
              console.log(`✅ Loaded ${enrolledSubjectsArray.length} enrolled subject(s) with progress`);
              this.enrolledSubjects.set(enrolledSubjectsArray);
              resolve(enrolledSubjectsArray);
            },
            error: (err) => {
              console.warn('⚠️ Progress data unavailable:', err);
              this.enrolledSubjects.set([]);
              resolve([]);
            }
          });
        },
        error: (err) => {
          console.warn('⚠️ Enrolled subjects endpoint failed:', err);
          this.enrolledSubjects.set([]);
          resolve([]);
        }
      });
    });
  }

  /**
   * Safely load achievements with fallback
   */
  private safeLoadAchievements(): Promise<any> {
    return new Promise((resolve) => {
      this.dashboardService.getStudentAchievements(this.studentId).subscribe({
        next: (achievements) => {
          // Process achievements
          resolve(achievements);
        },
        error: (err) => {
          console.warn('Achievements endpoint failed:', err);
          resolve([]);
        }
      });
    });
  }

  /**
   * Safely load exam history with fallback
   */
  private safeLoadExamHistory(): Promise<any> {
    return new Promise((resolve) => {
      this.dashboardService.getStudentExamHistory(this.studentId).subscribe({
        next: (response) => {
          if (response && response.data) {
            console.log('🔍 RAW Exam History from API:', response.data);

            // ✅ FIX (Dec 6, 2025): ALWAYS calculate percentage from correctAnswers/totalQuestions
            const normalizedData = response.data.map((exam: any) => {
              let calculatedScore = 0;

              // Calculate percentage from answers (most reliable method)
              if (exam.totalQuestions > 0) {
                calculatedScore = Math.round((exam.correctAnswers / exam.totalQuestions) * 100);
                console.log(`📊 Exam "${exam.examTitle}": ${exam.correctAnswers}/${exam.totalQuestions} = ${calculatedScore}% (backend sent: ${exam.score})`);
              }

              return {
                ...exam,
                score: calculatedScore
              };
            });

            this.examHistory.set(normalizedData);
            console.log('✅ Exam history loaded:', normalizedData.length, 'exams with corrected scores');
            resolve(normalizedData);
          } else {
            this.examHistory.set([]);
            resolve([]);
          }
        },
        error: (err) => {
          if (err.status === 500) {
            console.error('❌ Backend 500 Error: Exam history endpoint not fixed yet');
            console.error('📋 Check: /reports/backend_changes/backend_change_dashboard_500_errors_fixed_2025-11-01.md');
          } else {
            console.warn('⚠️ Exam history endpoint failed:', err);
          }
          this.examHistory.set([]);
          resolve([]);
        }
      });
    });
  }

  /**
   * Safely load recent activities with fallback
   */
  private safeLoadRecentActivities(): Promise<any> {
    return new Promise((resolve) => {
      console.log('🔄 Loading recent activities for studentId:', this.studentId);
      this.dashboardService.getStudentRecentActivities(this.studentId).subscribe({
        next: (response) => {
          console.log('📥 Recent activities response:', response);
          if (response && response.data) {
            this.recentActivities.set(response.data);
            console.log('✅ Recent activities loaded:', response.data.length, 'activities');
            console.log('📊 Activities breakdown:', {
              total: response.data.length,
              lessons: response.data.filter((a: any) => a.type === 'LessonProgress' || a.type === 'LessonCompleted').length,
              exams: response.data.filter((a: any) => a.type === 'ExamTaken').length,
              achievements: response.data.filter((a: any) => a.type === 'AchievementUnlocked').length,
              certificates: response.data.filter((a: any) => a.type === 'CertificateEarned').length
            });
            resolve(response.data);
          } else {
            console.warn('⚠️ Recent activities response is empty or invalid');
            this.recentActivities.set([]);
            resolve([]);
          }
        },
        error: (err) => {
          if (err.status === 500) {
            console.error('❌ Backend 500 Error: Recent activities endpoint failed');
            console.error('📋 Error details:', err.error || err.message);
          } else if (err.status === 404) {
            console.error('❌ 404: Recent activities endpoint not found');
          } else {
            console.warn('⚠️ Recent activities endpoint failed:', err);
          }
          this.recentActivities.set([]);
          resolve([]);
        }
      });
    });
  }

  /**
   * Safely load upcoming exams with fallback
   */
  private safeLoadUpcomingExams(): Promise<any> {
    return new Promise((resolve) => {
      this.examService.getUpcomingExams(this.studentId).subscribe({
        next: (response: any) => {
          if (response && Array.isArray(response)) {
            this.upcomingExams.set(response);
            console.log('✅ Upcoming exams loaded:', response.length, 'exams');
            resolve(response);
          } else if (response && response.data) {
            this.upcomingExams.set(response.data);
            console.log('✅ Upcoming exams loaded:', response.data.length, 'exams');
            resolve(response.data);
          } else {
            this.upcomingExams.set([]);
            resolve([]);
          }
        },
        error: (err) => {
          console.warn('⚠️ Upcoming exams endpoint failed:', err);
          this.upcomingExams.set([]);
          resolve([]);
        }
      });
    });
  }

  /**
   * Safely load in-progress lessons
   * Uses new backend endpoint: GET /api/Lessons/student/{studentId}/in-progress
   */
  private safeLoadInProgressLessons(): Promise<any> {
    return new Promise((resolve) => {
      this.lessonService.getInProgressLessons(this.studentId).subscribe({
        next: (response) => {
          if (response && response.data) {
            this.inProgressLessons.set(response.data);
            console.log('✅ In-progress lessons loaded:', response.data.length, 'lessons');
            resolve(response.data);
          } else if (Array.isArray(response)) {
            this.inProgressLessons.set(response);
            console.log('✅ In-progress lessons loaded:', response.length, 'lessons');
            resolve(response);
          } else {
            this.inProgressLessons.set([]);
            resolve([]);
          }
        },
        error: (err) => {
          console.warn('⚠️ In-progress lessons endpoint failed:', err);
          this.inProgressLessons.set([]);
          resolve([]);
        }
      });
    });
  }

  /**
   * Calculate stats from available data only
   */
  private calculateStatsFromAvailableData(): void {
    const subs = this.subscriptions();
    const examHist = this.examHistory();
    const upcoming = this.upcomingExams();

    // Calculate stats from available data
    const totalExams = Array.isArray(examHist) ? examHist.length : 0;
    const avgScore = Array.isArray(examHist) && examHist.length > 0
      ? Math.round(examHist.reduce((sum: number, exam: any) => sum + (exam.score || 0), 0) / examHist.length)
      : 0;

    // Use the activeSubsCount computed property for accurate count
    const activeSubs = this.activeSubsCount();
    const upcomingCount = Array.isArray(upcoming) ? upcoming.length : 0;

    console.log('📊 Calculating stats - Active Subscriptions:', activeSubs);
    console.log('📊 Calculating stats - Upcoming Exams:', upcomingCount);

    this.stats.set({
      totalLessonsCompleted: 0, // Will be updated when progress API is available
      totalExamsTaken: totalExams,
      averageScore: avgScore,
      currentStreak: 0,
      activeSubscriptions: activeSubs,
      upcomingExams: upcomingCount
    });

    console.log('✅ Stats updated:', this.stats());
  }

  /**
   * Process real dashboard data from backend
   */
  private processRealDashboardData(data: any): void {
    // Set progress data
    if (data.detailedProgress) {
      this.progress.set(data.detailedProgress);
    }

    // Set subscriptions
    if (data.subscriptionDetails) {
      this.subscriptions.set(data.subscriptionDetails);
    }

    // Set exam history
    if (data.examHistory) {
      // ✅ FIX (Dec 6, 2025): Normalize scores before setting
      const normalizedExams = data.examHistory.map((exam: any) => {
        let calculatedScore = 0;

        if (exam.totalQuestions > 0) {
          calculatedScore = Math.round((exam.correctAnswers / exam.totalQuestions) * 100);
          console.log(`📊 [processRealDashboardData] Exam "${exam.examTitle}": ${exam.correctAnswers}/${exam.totalQuestions} = ${calculatedScore}%`);
        }

        return {
          ...exam,
          score: calculatedScore
        };
      });

      this.examHistory.set(normalizedExams);
    }

    // Set recent activities
    if (data.recentActivities) {
      this.recentActivities.set(data.recentActivities);
    }

    // Calculate stats from real data
    this.calculateStatsFromRealData(data);
  }

  /**
   * Calculate stats from real backend data
   */
  private calculateStatsFromRealData(data: any): void {
    const prog = this.progress();
    const examHist = this.examHistory();

    // Calculate total exams taken
    const totalExams = Array.isArray(examHist) ? examHist.length : 0;

    // Calculate average score from exam history
    const avgScore = Array.isArray(examHist) && examHist.length > 0
      ? examHist.reduce((sum: number, exam: ExamHistory) => sum + exam.score, 0) / examHist.length
      : 0;

    // Use the activeSubsCount computed property for accurate count
    const activeSubs = this.activeSubsCount();

    this.stats.set({
      totalLessonsCompleted: prog?.completedLessons || data.totalLessonsCompleted || 0,
      totalExamsTaken: totalExams || data.totalExamsCompleted || 0,
      averageScore: Math.round(avgScore) || data.averageScore || 0,
      currentStreak: 0, // Calculate from activities if needed
      activeSubscriptions: activeSubs,
      upcomingExams: Array.isArray(data.upcomingExams) ? data.upcomingExams.length : 0
    });
  }

  /**
   * Navigate to lessons
   */
  goToLessons(): void {
    this.router.navigate(['/lessons']);
  }

  /**
   * Navigate to student exams
   */
  goToExams(): void {
    this.router.navigate(['/student/exams']);
  }

  /**
   * Navigate to student subscriptions
   */
  goToSubscriptions(): void {
    this.router.navigate(['/student/subscriptions']);
  }

  /**
   * Navigate to My Subjects page
   */
  goToMySubjects(): void {
    this.router.navigate(['/student/subjects']);
  }

  /**
   * Navigate to specific lesson
   */
  viewLesson(lessonId: number): void {
    this.router.navigate(['/lesson', lessonId]);
  }

  /**
   * Navigate to specific exam
   */
  viewExam(examId: number): void {
    this.router.navigate(['/student/exam', examId]);
  }

  /**
   * Navigate to exam result
   */
  viewExamResult(studentExamId: number): void {
    this.router.navigate(['/student/exam/result', studentExamId]);
  }

  /**
   * Refresh dashboard
   */
  refresh(): void {
    this.loadDashboardData();
    this.toastService.showSuccess('Dashboard refreshed');
  }

  /**
   * Get progress bar color based on percentage
   */
  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (progress >= 60) return 'bg-gradient-to-r from-blue-500 to-blue-600';
    if (progress >= 40) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  }

  /**
   * Format date
   */
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Calculate duration in days between two dates
   */
  calculateDuration(startDate: string | Date, endDate: string | Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Format time ago
   */
  timeAgo(date: string | Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return this.formatDate(date);
  }

  /**
   * Get grade class
   */
  getGradeClass(percentage: number): string {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Get activity icon
   */
  getActivityIcon(type: string): string {
    switch (type) {
      case 'ExamTaken':
        return '📝';
      case 'LessonProgress':
        return '📚';
      case 'CertificateEarned':
        return '🏆';
      case 'AchievementUnlocked':
        return '�️';
      case 'LessonCompleted':
        return '✅';
      case 'SubscriptionActivated':
        return '🎉';
      default:
        return '📌';
    }
  }

  /**
   * View lessons for a specific subject
   */
  viewSubjectLessons(subjectId: number): void {
    this.router.navigate(['/lessons'], { queryParams: { subjectId: subjectId } });
  }

  /**
   * View exams for a specific subject
   */
  viewSubjectExams(subjectId: number): void {
    // Navigate with both subjectId and studentId to ensure proper filtering
    this.router.navigate(['/student/exams'], {
      queryParams: {
        subjectId: subjectId,
        studentId: this.studentId
      }
    });
  }

  /**
   * Get recent lessons from in-progress lessons (new endpoint)
   */
  getRecentLessons(): any[] {
    return this.inProgressLessons().slice(0, 4);
  }

  /**
   * Resume a specific lesson using in-progress lessons data
   */
  resumeLesson(lesson: any): void {
    if (lesson && lesson.lessonId) {
      this.router.navigate(['/lesson', lesson.lessonId]);
      this.toastService.showSuccess(`Resuming: ${lesson.title}`);
    } else {
      this.toastService.showError('Lesson ID not available');
    }
  }

  /**
   * Handle activity click with proper navigation
   */
  handleActivityClick(activity: RecentActivity): void {
    if (!activity) return;

    switch (activity.type) {
      case 'LessonProgress':
      case 'LessonCompleted':
        if (activity.lessonId) {
          this.router.navigate(['/lesson', activity.lessonId]);
        } else {
          this.toastService.showWarning('Lesson not available');
        }
        break;

      case 'ExamTaken':
        if (activity.examId) {
          this.router.navigate(['/student/exam', activity.examId]);
        } else {
          this.toastService.showWarning('Exam not available');
        }
        break;

      case 'AchievementUnlocked':
        this.toastService.showSuccess(`Achievement: ${activity.title}`);
        break;

      case 'CertificateEarned':
        this.toastService.showSuccess(`Certificate: ${activity.title}`);
        break;

      default:
        console.log('Activity clicked:', activity);
    }
  }
}
