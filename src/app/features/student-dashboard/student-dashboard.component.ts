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
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  StudentProgress,
  SubjectProgress,
  RecentActivity
} from '../../models/progress.models';
import { StudentSubscription } from '../../models/subscription.models';
import { ExamResult, StudentExamHistory } from '../../models/exam.models';

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
  imports: [CommonModule],
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

  // Data
  studentId: number = 0;
  progress = signal<StudentProgress | null>(null);
  subscriptions = signal<StudentSubscription[]>([]);
  recentExams = signal<ExamResult[]>([]);
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
    return this.subscriptions().filter(s => s.status === 'Active').length;
  });

  hasActiveSubscription = computed(() => this.activeSubsCount() > 0);

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.role === 'Student') {
      this.studentId = currentUser.id;
      this.loadDashboardData();
    } else {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Load all dashboard data
   */
  private loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Use comprehensive dashboard service
    this.dashboardService.getComprehensiveStudentDashboard(this.studentId).subscribe({
      next: (dashboardData) => {
        this.processDashboardData(dashboardData);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        // Fallback to individual API calls if comprehensive endpoint fails
        this.loadDashboardDataFallback();
      }
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
      // Mock recent exams for now
      this.recentExams.set([]);
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
      activeSubscriptions: data.activeSubscriptions || 0,
      upcomingExams: data.upcomingExams?.length || 0
    });
  }

  /**
   * Calculate dashboard stats
   */
  private calculateStats(): void {
    const prog = this.progress();
    const subs = this.subscriptions();
    const exams = this.recentExams();
    const upcoming = this.upcomingExams();

    const totalLessons = prog?.subjectProgress?.reduce((sum, sp) => sum + (sp.completedLessons || 0), 0) || 0;
    const totalExams = exams.length;
    const avgScore = exams.length > 0
      ? exams.reduce((sum, e) => sum + (e.percentage || 0), 0) / exams.length
      : 0;

    this.stats.set({
      totalLessonsCompleted: totalLessons,
      totalExamsTaken: totalExams,
      averageScore: Math.round(avgScore),
      currentStreak: 0, // Will be calculated from activities
      activeSubscriptions: subs.filter(s => s.status === 'Active').length,
      upcomingExams: upcoming.length
    });
  }

  /**
   * Navigate to lessons
   */
  goToLessons(): void {
    this.router.navigate(['/lessons']);
  }

  /**
   * Navigate to exams
   */
  goToExams(): void {
    this.router.navigate(['/exams']);
  }

  /**
   * Navigate to subscriptions
   */
  goToSubscriptions(): void {
    this.router.navigate(['/subscriptions']);
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
    this.router.navigate(['/exam', examId]);
  }

  /**
   * Navigate to exam result
   */
  viewExamResult(studentExamId: number): void {
    this.router.navigate(['/exam/result', studentExamId]);
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
      case 'LessonCompleted':
        return '📚';
      case 'ExamCompleted':
        return '📝';
      case 'SubscriptionActivated':
        return '🎯';
      case 'ProgressMilestone':
        return '🏆';
      default:
        return '📌';
    }
  }
}
