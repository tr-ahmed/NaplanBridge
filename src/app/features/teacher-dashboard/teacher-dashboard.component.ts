/**
 * Teacher Dashboard Component
 * Main dashboard for teacher with overview of classes, students, exams, and grading
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ExamService } from '../../core/services/exam.service';
import { SubjectService } from '../../core/services/subject.service';
import { ToastService } from '../../core/services/toast.service';
import { DashboardService, TeacherDashboardData } from '../../core/services/dashboard.service';
import { TeacherSidebarComponent } from '../../shared/components/teacher-sidebar/teacher-sidebar.component';
import { TeacherHeaderComponent } from '../../shared/components/teacher-header/teacher-header.component';

interface TeacherStats {
  totalStudents: number;
  activeClasses: number;
  pendingGrading: number;
  upcomingExams: number;
  completedExams: number;
  averageClassScore: number;
}

interface ClassOverview {
  id: number;
  name: string;
  subjectName: string;
  studentCount: number;
  averageScore: number;
  nextExam?: {
    title: string;
    date: Date;
  };
}

interface PendingGrading {
  studentExamId: number;
  studentName: string;
  examTitle: string;
  submittedAt: Date;
  totalQuestions: number;
  autoGradedScore: number;
}

interface RecentActivity {
  id: number;
  type: 'ExamCreated' | 'ExamGraded' | 'LessonAdded' | 'StudentSubmission';
  description: string;
  timestamp: Date;
  icon: string;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink
  ],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.scss'
})
export class TeacherDashboardComponent implements OnInit {
  // Services
  private examService = inject(ExamService);
  private subjectService = inject(SubjectService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private dashboardService = inject(DashboardService);

  // State
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  sidebarOpen = signal<boolean>(false);

  // Data
  teacherId: number = 0;
  stats = signal<TeacherStats>({
    totalStudents: 0,
    activeClasses: 0,
    pendingGrading: 0,
    upcomingExams: 0,
    completedExams: 0,
    averageClassScore: 0
  });

  classes = signal<ClassOverview[]>([]);
  pendingGrading = signal<PendingGrading[]>([]);
  upcomingExams = signal<any[]>([]);
  recentActivities = signal<RecentActivity[]>([]);

  // Computed values
  hasPendingGrading = computed(() => this.pendingGrading().length > 0);
  hasUpcomingExams = computed(() => this.upcomingExams().length > 0);

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && Array.isArray(currentUser.role) && currentUser.role.includes('Teacher')) {
      this.teacherId = parseInt(currentUser.id);
      this.loadDashboardData();
    } else {
      console.warn('⚠️ Not authorized to access Teacher Dashboard');
      this.router.navigate(['/']);
    }
  }

  /**
   * Load all dashboard data
   */
  private loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load data in parallel
    Promise.all([
      this.loadTeacherStats(),
      this.loadClasses(),
      this.loadPendingGrading(),
      this.loadUpcomingExams(),
      this.loadRecentActivities()
    ]).then(() => {
      this.loading.set(false);
    }).catch(err => {
      this.error.set('Failed to load dashboard data');
      this.loading.set(false);
      this.toastService.showError('Failed to load dashboard');
      console.error('Dashboard error:', err);
    });
  }

  /**
   * Load teacher statistics from API
   */
  private loadTeacherStats(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dashboardService.getTeacherDashboard().subscribe({
        next: (response) => {
          if (response) {
            // Map the new API response to our stats
            this.stats.set({
              totalStudents: response.studentProgress?.totalStudents || 0,
              activeClasses: response.teacherInfo?.subjects?.length || 0,
              pendingGrading: response.pendingQuestions?.unansweredCount || 0,
              upcomingExams: response.upcomingSessions?.length || 0,
              completedExams: response.sessionStats?.totalCompleted || 0,
              averageClassScore: response.studentProgress?.averageProgress || 0
            });

            // Store the raw data for other uses
            if (response.upcomingSessions) {
              this.upcomingExams.set(response.upcomingSessions.map((session: any) => ({
                id: session.id,
                title: `Session with ${session.studentName}`,
                className: session.subjectName || 'Private Session',
                date: new Date(session.scheduledDateTime),
                duration: session.duration || 60,
                totalMarks: 0
              })));
            }
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading teacher stats:', error);
          // Use empty data as fallback
          this.stats.set({
            totalStudents: 0,
            activeClasses: 0,
            pendingGrading: 0,
            upcomingExams: 0,
            completedExams: 0,
            averageClassScore: 0
          });
          resolve(); // Don't reject to allow other data to load
        }
      });
    });
  }

  /**
   * Load teacher's classes (subjects)
   */
  private loadClasses(): Promise<void> {
    return new Promise((resolve) => {
      // Get teacher's subjects from the teachings endpoint
      this.subjectService.getSubjects().subscribe({
        next: (response) => {
          if (response && response.items) {
            // Map subjects to class overview format
            this.classes.set(response.items.slice(0, 5).map((subject: any) => ({
              id: subject.id,
              name: subject.name,
              subjectName: subject.subjectName?.name || 'N/A',
              studentCount: subject.enrollmentCount || 0,
              averageScore: 0, // Will need specific endpoint for this
              nextExam: undefined
            })));
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading classes:', error);
          this.classes.set([]);
          resolve();
        }
      });
    });
  }

  /**
   * Load pending grading tasks (pending questions)
   */
  private loadPendingGrading(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getTeacherDashboard().subscribe({
        next: (response) => {
          if (response && response.pendingQuestions?.recentQuestions) {
            // Map pending questions to pending grading format
            this.pendingGrading.set(response.pendingQuestions.recentQuestions.map((q: any) => ({
              studentExamId: q.id || 0,
              studentName: q.studentName || 'Unknown Student',
              examTitle: q.lessonName || 'Question',
              submittedAt: new Date(q.askedAt || Date.now()),
              totalQuestions: 1,
              autoGradedScore: 0
            })));
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading pending questions:', error);
          this.pendingGrading.set([]);
          resolve();
        }
      });
    });
  }

  /**
   * Load upcoming exams (private sessions)
   * This data is already loaded in loadTeacherStats
   */
  private loadUpcomingExams(): Promise<void> {
    // Data already populated in loadTeacherStats
    return Promise.resolve();
  }

  /**
   * Load recent activities (from reviews and questions)
   */
  private loadRecentActivities(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getTeacherDashboard().subscribe({
        next: (response) => {
          const activities: RecentActivity[] = [];

          // Add recent reviews as activities
          if (response && response.recentReviews) {
            response.recentReviews.forEach((review: any, index: number) => {
              activities.push({
                id: index + 1,
                type: 'StudentSubmission',
                description: `${review.parentName || 'Parent'} left a review: "${review.comment?.substring(0, 50)}..."`,
                timestamp: new Date(review.createdAt || Date.now()),
                icon: '⭐'
              });
            });
          }

          // Add pending questions as activities
          if (response && response.pendingQuestions?.recentQuestions) {
            response.pendingQuestions.recentQuestions.forEach((q: any, index: number) => {
              activities.push({
                id: activities.length + index + 1,
                type: 'StudentSubmission',
                description: `${q.studentName || 'Student'} asked a question in ${q.lessonName || 'lesson'}`,
                timestamp: new Date(q.askedAt || Date.now()),
                icon: '❓'
              });
            });
          }

          // Sort by timestamp descending and take top 10
          this.recentActivities.set(
            activities
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .slice(0, 10)
          );
          resolve();
        },
        error: (error) => {
          console.error('Error loading recent activities:', error);
          this.recentActivities.set([]);
          resolve();
        }
      });
    });
  }

  /**
   * Navigate to answer question
   */
  goToGrading(questionId: number): void {
    // Navigate to discussions/questions page
    this.toastService.showInfo('Redirecting to answer student question...');
    console.log('Navigate to answer question:', questionId);
    // TODO: Implement when questions page is ready
  }

  /**
   * Navigate to questions management
   */
  goToExamManagement(): void {
    // Navigate to pending questions
    this.toastService.showInfo('Questions management coming soon');
    // TODO: Implement questions management page
  }

  /**
   * Navigate to class details
   */
  viewClass(classId: number): void {
    // TODO: Implement class details page
    this.toastService.showWarning('Class details page coming soon');
    console.log('Navigate to class:', classId);
  }

  /**
   * Navigate to create exam
   */
  createExam(): void {
    // TODO: Implement exam creation page
    this.toastService.showWarning('Exam creation page coming soon');
  }

  /**
   * Navigate to students
   */
  viewStudents(): void {
    // TODO: Implement students list page
    this.toastService.showWarning('Students page coming soon');
  }

  /**
   * Toggle sidebar visibility on mobile
   */
  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
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
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Format time
   */
  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Time ago helper
   */
  timeAgo(date: Date): string {
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
   * Get score class
   */
  getScoreClass(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * Get score badge class
   */
  getScoreBadgeClass(score: number): string {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }
}
