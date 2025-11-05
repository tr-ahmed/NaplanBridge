/**
 * Progress Service
 * Handles student progress tracking, dashboard statistics, and analytics
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './base-api.service';
import {
  StudentProgress,
  SubjectProgress,
  TermProgress,
  WeekProgress,
  LessonProgress,
  UpdateLessonProgressDto,
  DashboardStats,
  StudentDashboardStats,
  TeacherDashboardStats,
  ParentDashboardStats,
  AdminDashboardStats,
  LessonAnalytics,
  ExamAnalytics,
  ProgressReport,
  Leaderboard
} from '../../models/progress.models';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private api = inject(ApiService);

  // ============================================
  // Student Progress Methods
  // ============================================

  /**
   * Get overall student progress
   * Endpoint: GET /api/Progress/by-student/{studentId}
   * Roles: Student, Parent, Teacher, Admin
   */
  getStudentProgress(studentId: number): Observable<StudentProgress> {
    return this.api.get<StudentProgress>(`Progress/by-student/${studentId}`);
  }

  /**
   * Get subject progress for student
   * Note: Use getStudentProgress and filter by subject on frontend
   * The backend doesn't have a specific subject progress endpoint
   */
  getSubjectProgress(studentId: number, subjectId: number): Observable<SubjectProgress> {
    // Fallback: get all progress and filter
    return this.getStudentProgress(studentId).pipe(
      map((progressData: any) => {
        const emptyResponse: SubjectProgress = {
          subjectId,
          subjectName: '',
          progress: 0,
          completedLessons: 0,
          totalLessons: 0
        };

        if (Array.isArray(progressData)) {
          const subjectProgress = progressData.filter((p: any) => p.subjectId === subjectId);
          return {
            ...emptyResponse,
            completedLessons: subjectProgress.filter((p: any) => p.isCompleted).length,
            totalLessons: subjectProgress.length,
            progress: subjectProgress.length > 0
              ? (subjectProgress.filter((p: any) => p.isCompleted).length / subjectProgress.length) * 100
              : 0
          };
        }
        return emptyResponse;
      }),
      catchError(() => of({
        subjectId,
        subjectName: '',
        progress: 0,
        completedLessons: 0,
        totalLessons: 0
      }))
    );
  }

  /**
   * Get term progress for student
   * Note: Use getStudentProgress and filter by term on frontend
   */
  getTermProgress(studentId: number, termId: number): Observable<TermProgress> {
    return this.getStudentProgress(studentId).pipe(
      map((progressData: any) => {
        const emptyResponse: TermProgress = {
          termId,
          termNumber: 0,
          subjectId: 0,
          subjectName: '',
          progress: 0,
          completedLessons: 0,
          totalLessons: 0,
          completedExams: 0,
          totalExams: 0
        };

        if (Array.isArray(progressData)) {
          const termProgress = progressData.filter((p: any) => p.termId === termId);
          return {
            ...emptyResponse,
            completedLessons: termProgress.filter((p: any) => p.isCompleted).length,
            totalLessons: termProgress.length,
            progress: termProgress.length > 0
              ? (termProgress.filter((p: any) => p.isCompleted).length / termProgress.length) * 100
              : 0
          };
        }
        return emptyResponse;
      }),
      catchError(() => of({
        termId,
        termNumber: 0,
        subjectId: 0,
        subjectName: '',
        progress: 0,
        completedLessons: 0,
        totalLessons: 0,
        completedExams: 0,
        totalExams: 0
      }))
    );
  }

  /**
   * Get week progress for student
   * Note: Use getStudentProgress and filter by week on frontend
   */
  getWeekProgress(studentId: number, weekId: number): Observable<WeekProgress> {
    return this.getStudentProgress(studentId).pipe(
      map((progressData: any) => {
        const emptyResponse: WeekProgress = {
          weekId,
          weekNumber: 0,
          termId: 0,
          progress: 0,
          completedLessons: 0,
          totalLessons: 0
        };

        if (Array.isArray(progressData)) {
          const weekProgress = progressData.filter((p: any) => p.weekId === weekId);
          return {
            ...emptyResponse,
            completedLessons: weekProgress.filter((p: any) => p.isCompleted).length,
            totalLessons: weekProgress.length,
            progress: weekProgress.length > 0
              ? (weekProgress.filter((p: any) => p.isCompleted).length / weekProgress.length) * 100
              : 0
          };
        }
        return emptyResponse;
      }),
      catchError(() => of({
        weekId,
        weekNumber: 0,
        termId: 0,
        progress: 0,
        completedLessons: 0,
        totalLessons: 0
      }))
    );
  }

  // ============================================
  // Lesson Progress Methods
  // ============================================

  /**
   * Get lesson progress for student
   * Endpoint: GET /api/Progress/students/{studentId}/lessons/{lessonId}
   * Roles: Student, Parent, Teacher, Admin
   */
  getLessonProgress(studentId: number, lessonId: number): Observable<LessonProgress> {
    return this.api.get<LessonProgress>(`Progress/students/${studentId}/lessons/${lessonId}`);
  }

  /**
   * Update lesson progress (video position, completion)
   * Endpoint: POST /api/progress/lesson/update
   * Roles: Student
   */
  updateLessonProgress(dto: UpdateLessonProgressDto): Observable<LessonProgress> {
    return this.api.post<LessonProgress>('progress/lesson/update', dto);
  }

  /**
   * Mark lesson as completed
   * Endpoint: POST /api/progress/lesson/{lessonId}/complete
   * Roles: Student
   */
  markLessonCompleted(lessonId: number): Observable<void> {
    return this.api.post<void>(`progress/lesson/${lessonId}/complete`, {});
  }

  /**
   * Save video watch position
   * Endpoint: POST /api/progress/lesson/{lessonId}/position
   * Roles: Student
   */
  saveVideoPosition(lessonId: number, position: number): Observable<void> {
    return this.api.post<void>(`progress/lesson/${lessonId}/position`, { position });
  }

  // ============================================
  // Dashboard Statistics Methods
  // ============================================

  /**
   * Get student dashboard statistics
   * Endpoint: GET /api/dashboard/student/{studentId}
   * Roles: Student
   */
  getStudentDashboardStats(studentId: number): Observable<StudentDashboardStats> {
    return this.api.get<StudentDashboardStats>(`dashboard/student/${studentId}`);
  }

  /**
   * Get teacher dashboard statistics
   * Endpoint: GET /api/dashboard/teacher/{teacherId}
   * Roles: Teacher
   */
  getTeacherDashboardStats(teacherId: number): Observable<TeacherDashboardStats> {
    return this.api.get<TeacherDashboardStats>(`dashboard/teacher/${teacherId}`);
  }

  /**
   * Get parent dashboard statistics
   * Endpoint: GET /api/dashboard/parent/{parentId}
   * Roles: Parent
   */
  getParentDashboardStats(parentId: number): Observable<ParentDashboardStats> {
    return this.api.get<ParentDashboardStats>(`dashboard/parent/${parentId}`);
  }

  /**
   * Get admin dashboard statistics
   * Endpoint: GET /api/dashboard/admin
   * Roles: Admin
   */
  getAdminDashboardStats(): Observable<AdminDashboardStats> {
    return this.api.get<AdminDashboardStats>('dashboard/admin');
  }

  // ============================================
  // Analytics Methods
  // ============================================

  /**
   * Get lesson analytics
   * Endpoint: GET /api/analytics/lesson/{lessonId}
   * Roles: Teacher, Admin
   */
  getLessonAnalytics(lessonId: number): Observable<LessonAnalytics> {
    return this.api.get<LessonAnalytics>(`analytics/lesson/${lessonId}`);
  }

  /**
   * Get exam analytics
   * Endpoint: GET /api/analytics/exam/{examId}
   * Roles: Teacher, Admin
   */
  getExamAnalytics(examId: number): Observable<ExamAnalytics> {
    return this.api.get<ExamAnalytics>(`analytics/exam/${examId}`);
  }

  /**
   * Get subject analytics
   * Endpoint: GET /api/analytics/subject/{subjectId}
   * Roles: Teacher, Admin
   */
  getSubjectAnalytics(subjectId: number): Observable<any> {
    return this.api.get<any>(`analytics/subject/${subjectId}`);
  }

  // ============================================
  // Progress Report Methods
  // ============================================

  /**
   * Generate progress report for student
   * Endpoint: POST /api/reports/student/{studentId}/progress
   * Roles: Student, Parent, Teacher, Admin
   */
  generateProgressReport(
    studentId: number,
    startDate: Date,
    endDate: Date
  ): Observable<ProgressReport> {
    return this.api.post<ProgressReport>(`reports/student/${studentId}/progress`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  }

  /**
   * Download progress report PDF
   * Endpoint: GET /api/reports/student/{studentId}/progress/download
   * Roles: Student, Parent, Teacher, Admin
   */
  downloadProgressReport(studentId: number, startDate: Date, endDate: Date): Observable<Blob> {
    return this.api.downloadFile(
      `reports/student/${studentId}/progress/download?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
  }

  // ============================================
  // Leaderboard Methods
  // ============================================

  /**
   * Get leaderboard
   * Endpoint: GET /api/leaderboard
   * Query params: period, category
   */
  getLeaderboard(
    period: 'Daily' | 'Weekly' | 'Monthly' | 'AllTime' = 'Weekly',
    category: 'OverallScore' | 'LessonsCompleted' | 'ExamsPassed' | 'StudyTime' = 'OverallScore'
  ): Observable<Leaderboard> {
    return this.api.get<Leaderboard>('leaderboard', { period, category });
  }

  /**
   * Get student rank
   * Endpoint: GET /api/leaderboard/student/{studentId}/rank
   */
  getStudentRank(studentId: number): Observable<{ rank: number; score: number }> {
    return this.api.get<{ rank: number; score: number }>(`leaderboard/student/${studentId}/rank`);
  }

  // ============================================
  // Study Time Tracking
  // ============================================

  /**
   * Track study time for lesson
   * Endpoint: POST /api/progress/study-time
   * Roles: Student
   */
  trackStudyTime(lessonId: number, minutes: number): Observable<void> {
    return this.api.post<void>('progress/study-time', {
      lessonId,
      minutes
    });
  }

  /**
   * Get total study time for student
   * Endpoint: GET /api/progress/student/{studentId}/study-time
   * Roles: Student, Parent, Teacher, Admin
   */
  getTotalStudyTime(studentId: number): Observable<{ totalMinutes: number }> {
    return this.api.get<{ totalMinutes: number }>(`progress/student/${studentId}/study-time`);
  }

  // ============================================
  // Achievement Methods
  // ============================================

  /**
   * Get student achievements
   * Endpoint: GET /api/achievements/student/{studentId}
   * Roles: Student, Parent, Teacher, Admin
   */
  getStudentAchievements(studentId: number): Observable<any[]> {
    return this.api.get<any[]>(`achievements/student/${studentId}`);
  }

  /**
   * Unlock achievement
   * Endpoint: POST /api/achievements/unlock
   * Roles: System (auto-triggered)
   */
  unlockAchievement(studentId: number, achievementId: number): Observable<void> {
    return this.api.post<void>('achievements/unlock', {
      studentId,
      achievementId
    });
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Calculate progress percentage
   */
  calculateProgressPercentage(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }

  /**
   * Format study time (minutes to hours/minutes)
   */
  formatStudyTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  /**
   * Get progress status color
   */
  getProgressStatusColor(percentage: number): 'success' | 'warning' | 'danger' {
    if (percentage >= 70) return 'success';
    if (percentage >= 40) return 'warning';
    return 'danger';
  }
}
