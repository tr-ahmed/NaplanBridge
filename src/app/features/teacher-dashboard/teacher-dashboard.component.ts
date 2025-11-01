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
  imports: [CommonModule, RouterLink],
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
    if (currentUser && currentUser.role === 'Teacher') {
      this.teacherId = currentUser.id;
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
          if (response && response.totalStudents !== undefined) {
            this.stats.set({
              totalStudents: response.totalStudents || 0,
              activeClasses: response.totalLessons || 0,
              pendingGrading: 0, // Will be calculated from pending grading tasks
              upcomingExams: response.upcomingSessions?.length || 0,
              completedExams: 0, // Not available in current API
              averageClassScore: 0 // Not available in current API
            });
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading teacher stats:', error);
          // Use mock data as fallback
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
   * Load teacher's classes
   */
  private loadClasses(): Promise<void> {
    return new Promise((resolve) => {
      // Mock data for now
      this.classes.set([
        {
          id: 1,
          name: 'Math Year 7 - Class A',
          subjectName: 'Mathematics',
          studentCount: 25,
          averageScore: 82,
          nextExam: {
            title: 'Week 3 Quiz',
            date: new Date('2025-10-30')
          }
        },
        {
          id: 2,
          name: 'Science Year 8 - Class B',
          subjectName: 'Science',
          studentCount: 22,
          averageScore: 75,
          nextExam: {
            title: 'Monthly Test',
            date: new Date('2025-11-05')
          }
        },
        {
          id: 3,
          name: 'English Year 9',
          subjectName: 'English',
          studentCount: 28,
          averageScore: 79
        }
      ]);
      resolve();
    });
  }

  /**
   * Load pending grading tasks
   */
  private loadPendingGrading(): Promise<void> {
    return new Promise((resolve) => {
      // Mock data for now
      this.pendingGrading.set([
        {
          studentExamId: 101,
          studentName: 'Ahmed Hassan',
          examTitle: 'Math Week 2 - Essay Questions',
          submittedAt: new Date('2025-10-23T14:30:00'),
          totalQuestions: 10,
          autoGradedScore: 65
        },
        {
          studentExamId: 102,
          studentName: 'Sara Mohamed',
          examTitle: 'Science Lab Report',
          submittedAt: new Date('2025-10-23T16:15:00'),
          totalQuestions: 5,
          autoGradedScore: 0
        },
        {
          studentExamId: 103,
          studentName: 'Omar Ali',
          examTitle: 'Math Week 2 - Essay Questions',
          submittedAt: new Date('2025-10-24T09:00:00'),
          totalQuestions: 10,
          autoGradedScore: 58
        }
      ]);
      resolve();
    });
  }

  /**
   * Load upcoming exams
   */
  private loadUpcomingExams(): Promise<void> {
    return new Promise((resolve) => {
      // Mock data for now
      this.upcomingExams.set([
        {
          id: 201,
          title: 'Math Week 3 Quiz',
          className: 'Math Year 7 - Class A',
          date: new Date('2025-10-30T10:00:00'),
          duration: 45,
          totalMarks: 50
        },
        {
          id: 202,
          title: 'Science Monthly Test',
          className: 'Science Year 8 - Class B',
          date: new Date('2025-11-05T11:00:00'),
          duration: 60,
          totalMarks: 100
        }
      ]);
      resolve();
    });
  }

  /**
   * Load recent activities
   */
  private loadRecentActivities(): Promise<void> {
    return new Promise((resolve) => {
      this.recentActivities.set([
        {
          id: 1,
          type: 'StudentSubmission',
          description: '3 students submitted Math Week 2 exam',
          timestamp: new Date('2025-10-24T09:30:00'),
          icon: '📝'
        },
        {
          id: 2,
          type: 'ExamCreated',
          description: 'Created Science Week 3 Quiz',
          timestamp: new Date('2025-10-23T15:00:00'),
          icon: '➕'
        },
        {
          id: 3,
          type: 'ExamGraded',
          description: 'Graded 15 English essays',
          timestamp: new Date('2025-10-23T11:30:00'),
          icon: '✅'
        },
        {
          id: 4,
          type: 'LessonAdded',
          description: 'Added new lesson: Algebra Basics',
          timestamp: new Date('2025-10-22T14:00:00'),
          icon: '📚'
        }
      ]);
      resolve();
    });
  }

  /**
   * Navigate to grading page
   */
  goToGrading(studentExamId: number): void {
    // TODO: Implement grading page
    this.toastService.showWarning('Grading page coming soon');
    console.log('Navigate to grade exam:', studentExamId);
  }

  /**
   * Navigate to exam management
   */
  goToExamManagement(): void {
    // TODO: Implement exam management page
    this.toastService.showWarning('Exam management page coming soon');
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
