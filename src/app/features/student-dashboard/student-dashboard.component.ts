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
import { MockDashboardService } from '../../core/services/mock-dashboard.service';
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
  private mockDashboardService = inject(MockDashboardService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Data
  studentId: number = 0;
  progress = signal<StudentProgress | null>(null);
  subscriptions = signal<StudentSubscription[]>([]);
  examHistory = signal<ExamHistory[]>([]);
  recentActivities = signal<RecentActivity[]>([]);
  upcomingExams = signal<any[]>([]);

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
    const prog = this.progress();
    if (!prog) return 0;
    return Math.round(prog.overallProgress || 0);
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
      this.safeLoadSubscriptions(),
      this.safeLoadAchievements(),
      this.safeLoadExamHistory(),
      this.safeLoadRecentActivities(),
      this.safeLoadUpcomingExams()
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
   * Safely load subscriptions with fallback
   */
  private safeLoadSubscriptions(): Promise<any> {
    return new Promise((resolve) => {
      this.dashboardService.getStudentSubscriptionsSummary(this.studentId).subscribe({
        next: (response) => {
          // Handle different response formats:
          // 1. If response is an object with 'subscriptions' array
          // 2. If response is directly an array
          // 3. If response is null/undefined
          let subsArray: any[] = [];

          if (response) {
            if (Array.isArray(response)) {
              // Response is directly an array
              subsArray = response;
            } else if (response.subscriptions && Array.isArray(response.subscriptions)) {
              // Response is an object with subscriptions property
              subsArray = response.subscriptions;
            } else if (typeof response === 'object') {
              // Response might be a single subscription object
              subsArray = [response];
            }
          }

          console.log(`✅ Loaded ${subsArray.length} subscription(s)`);
          this.subscriptions.set(subsArray);
          resolve(subsArray);
        },
        error: (err) => {
          console.warn('⚠️ Subscriptions endpoint failed:', err);
          this.subscriptions.set([]);
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
            this.examHistory.set(response.data);
            console.log('✅ Exam history loaded:', response.data.length, 'exams');
            resolve(response.data);
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
      this.dashboardService.getStudentRecentActivities(this.studentId).subscribe({
        next: (response) => {
          if (response && response.data) {
            this.recentActivities.set(response.data);
            console.log('✅ Recent activities loaded:', response.data.length, 'activities');
            resolve(response.data);
          } else {
            this.recentActivities.set([]);
            resolve([]);
          }
        },
        error: (err) => {
          if (err.status === 500) {
            console.error('❌ Backend 500 Error: Recent activities endpoint not fixed yet');
            console.error('📋 Check: /reports/backend_changes/backend_change_dashboard_500_errors_fixed_2025-11-01.md');
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
      this.examHistory.set(data.examHistory);
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
  }  /**
   * Load mock dashboard data for development
   */
  private loadMockDashboardData(): void {
    Promise.all([
      this.loadMockProgress(),
      this.loadMockSubscriptions(),
      this.loadMockCertificates(),
      this.loadMockAchievements()
    ]).then(() => {
      this.calculateMockStats();
      this.loading.set(false);
      this.toastService.showSuccess('Dashboard loaded successfully (mock data)');
    }).catch(err => {
      this.error.set('Failed to load dashboard data');
      this.loading.set(false);
      this.toastService.showError('Failed to load dashboard');
      console.error('Mock Dashboard error:', err);
    });
  }

  /**
   * Load mock progress data
   */
  private loadMockProgress(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.mockDashboardService.getMockStudentProgress().subscribe({
        next: (progress) => {
          this.progress.set(progress);
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  /**
   * Load mock subscriptions
   */
  private loadMockSubscriptions(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.mockDashboardService.getMockSubscriptionsSummary().subscribe({
        next: (subs) => {
          this.subscriptions.set(subs);
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  /**
   * Load mock certificates
   */
  private loadMockCertificates(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.mockDashboardService.getMockCertificates().subscribe({
        next: (certs) => {
          // Store certificates for display
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  /**
   * Load mock achievements
   */
  private loadMockAchievements(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.mockDashboardService.getMockAchievements().subscribe({
        next: (achievements) => {
          // Store achievements for display
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  /**
   * Calculate stats from mock data
   */
  private calculateMockStats(): void {
    const prog = this.progress();

    this.stats.set({
      totalLessonsCompleted: prog?.completedLessons || 45,
      totalExamsTaken: prog?.examsCompleted || 12,
      averageScore: prog?.averageExamScore || 87,
      currentStreak: 7, // Mock streak
      activeSubscriptions: this.activeSubsCount() || 2,
      upcomingExams: 2 // Mock upcoming exams
    });
  }

  /**
   * Process dashboard data from comprehensive endpoint
   */
  private processDashboardData(data: any): void {
    // Set progress data
    if (data.detailedProgress) {
      this.progress.set(data.detailedProgress);
    }

    // Set subscriptions
    if (data.subscriptionDetails) {
      this.subscriptions.set(data.subscriptionDetails);
    }

    // Set certificates and achievements
    if (data.certificates) {
      // Process certificates data
    }

    if (data.achievements) {
      // Process achievements data
    }

    // Calculate stats from the data
    this.calculateStatsFromData(data);
  }

  /**
   * Fallback method using individual API calls
   */
  private loadDashboardDataFallback(): void {
    Promise.all([
      this.loadProgress(),
      this.loadSubscriptions(),
      this.loadRecentExams(),
      this.loadRecentActivities(),
      this.loadUpcomingExams(),
      this.loadCertificates(),
      this.loadAchievements()
    ]).then(() => {
      this.calculateStats();
      this.loading.set(false);
    }).catch(err => {
      this.error.set('Failed to load dashboard data');
      this.loading.set(false);
      this.toastService.showError('Failed to load dashboard');
      console.error('Dashboard error:', err);
    });
  }

  /**
   * Load student progress
   */
  private loadProgress(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.progressService.getStudentProgress(this.studentId).subscribe({
        next: (progress) => {
          this.progress.set(progress);
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  /**
   * Load active subscriptions
   */
  private loadSubscriptions(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.subscriptionService.getStudentSubscriptions(this.studentId).subscribe({
        next: (subs) => {
          this.subscriptions.set(subs);
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  /**
   * Load recent exam results
   */
  private loadRecentExams(): Promise<void> {
    return new Promise((resolve) => {
      // Use exam history instead of separate recent exams
      this.examHistory.set([]);
      resolve();
    });
  }

  /**
   * Load student certificates
   */
  private loadCertificates(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dashboardService.getStudentCertificates(this.studentId).subscribe({
        next: (certificates) => {
          // Process certificates
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  /**
   * Load student achievements
   */
  private loadAchievements(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dashboardService.getStudentAchievements(this.studentId).subscribe({
        next: (achievements) => {
          // Process achievements
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  /**
   * Load recent activities
   */
  private loadRecentActivities(): Promise<void> {
    return new Promise((resolve) => {
      // Mock activities for now
      this.recentActivities.set([]);
      resolve();
    });
  }

  /**
   * Load upcoming exams
   */
  private loadUpcomingExams(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.examService.getUpcomingExams(this.studentId).subscribe({
        next: (exams) => {
          this.upcomingExams.set(exams);
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  /**
   * Calculate stats from comprehensive dashboard data
   */
  private calculateStatsFromData(data: any): void {
    this.stats.set({
      totalLessonsCompleted: data.totalLessonsCompleted || 0,
      totalExamsTaken: data.totalExamsCompleted || 0,
      averageScore: data.averageScore || 0,
      currentStreak: 0, // Will be calculated from activities
      activeSubscriptions: this.activeSubsCount() || data.activeSubscriptions || 0,
      upcomingExams: data.upcomingExams?.length || 0
    });
  }

  /**
   * Calculate dashboard stats (fallback method for mock data)
   */
  private calculateStats(): void {
    const prog = this.progress();
    const subs = this.subscriptions();
    const exams = this.examHistory();
    const upcoming = this.upcomingExams();

    const totalLessons = prog?.subjectProgress?.reduce((sum: number, sp: any) => sum + (sp.completedLessons || 0), 0) || 0;
    const totalExams = Array.isArray(exams) ? exams.length : 0;
    const avgScore = Array.isArray(exams) && exams.length > 0
      ? exams.reduce((sum: number, e: ExamHistory) => sum + (e.score || 0), 0) / exams.length
      : 0;

    // Use the activeSubsCount computed property for accurate count
    const activeSubs = this.activeSubsCount();

    this.stats.set({
      totalLessonsCompleted: totalLessons,
      totalExamsTaken: totalExams,
      averageScore: Math.round(avgScore),
      currentStreak: 0, // Will be calculated from activities
      activeSubscriptions: activeSubs,
      upcomingExams: Array.isArray(upcoming) ? upcoming.length : 0
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
    this.router.navigate(['/student/exams'], { queryParams: { subjectId: subjectId } });
  }

  /**
   * Resume a specific lesson
   */
  resumeLesson(lessonTitle: string): void {
    // Find lesson by title and navigate to it
    const lesson = this.recentActivities().find(a => a.title === lessonTitle && a.type === 'LessonProgress');
    if (lesson) {
      // Extract lesson ID from description or use a fallback approach
      this.router.navigate(['/lessons']);
      this.toastService.showSuccess(`Resuming: ${lessonTitle}`);
    } else {
      this.toastService.showInfo('Lesson details not available');
    }
  }
}
