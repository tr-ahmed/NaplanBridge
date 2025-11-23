/**
 * Dashboard Service
 * Handles dashboard data for all user roles
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { ApiService } from './base-api.service';
import { ExamHistory, RecentActivity, ApiResponse } from '../../models/dashboard.models';

export interface StudentDashboardData {
  totalLessonsCompleted: number;
  totalExamsCompleted: number;
  averageScore: number;
  activeSubscriptions: number;
  certificatesEarned: number;
  upcomingExams: any[];
  recentProgress: any[];
  achievements: any[];
}

export interface ParentDashboardData {
  children: any[];
  totalChildren: number;
  overallProgress: number;
  recentActivities: any[];
}

export interface TeacherDashboardData {
  teacherInfo: {
    id: number;
    name: string;
    subjects: string[];
    rating: number;
    totalSessions: number;
  };
  upcomingSessions: any[];
  sessionStats: {
    thisWeek: number;
    thisMonth: number;
    totalCompleted: number;
    totalEarnings: number;
  };
  pendingQuestions: {
    unansweredCount: number;
    recentQuestions: any[];
  };
  studentProgress: {
    totalStudents: number;
    averageProgress: number;
  };
  recentReviews: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private api = inject(ApiService);

  /**
   * Get Student Dashboard Data
   * Endpoint: GET /api/Dashboard/student
   */
  getStudentDashboard(): Observable<StudentDashboardData> {
    return this.api.get<StudentDashboardData>('Dashboard/student');
  }

  /**
   * Get Parent Dashboard Data
   * Endpoint: GET /api/Dashboard/parent
   */
  getParentDashboard(): Observable<ParentDashboardData> {
    return this.api.get<ParentDashboardData>('Dashboard/parent');
  }

  /**
   * Get Teacher Dashboard Data
   * Endpoint: GET /api/Dashboard/teacher
   */
  getTeacherDashboard(): Observable<TeacherDashboardData> {
    return this.api.get<TeacherDashboardData>('Dashboard/teacher');
  }

  /**
   * Get Comprehensive Student Dashboard Data
   * Combines multiple endpoints for complete dashboard
   */
  getComprehensiveStudentDashboard(studentId: number): Observable<any> {
    return forkJoin({
      dashboard: this.getStudentDashboard(),
      progress: this.api.get(`Progress/by-student/${studentId}`),
      subscriptions: this.api.get(`StudentSubjects/student/${studentId}/subscriptions-summary`),
      certificates: this.api.get(`Certificates/student/${studentId}`),
      achievements: this.api.get(`Achievements/student/${studentId}`)
    }).pipe(
      map(data => ({
        ...data.dashboard,
        detailedProgress: data.progress,
        subscriptionDetails: data.subscriptions,
        certificates: data.certificates,
        achievements: data.achievements
      }))
    );
  }

  /**
   * Get Student Progress by Subject
   * Endpoint: GET /api/Progress/by-student/{id}
   */
  getStudentProgress(studentId: number): Observable<any> {
    return this.api.get(`Progress/by-student/${studentId}`);
  }

  /**
   * Get Student Subscriptions Summary
   * ✅ UPDATED: Use Parent endpoint with full payment and usage data
   * Endpoint: GET /api/Parent/student/{studentId}/subscriptions
   */
  getStudentSubscriptionsSummary(studentId: number): Observable<any> {
    return this.api.get(`Parent/student/${studentId}/subscriptions`).pipe(
      map((response: any) => {
        // ✅ Extract data from { success: true, data: {...} } structure
        if (response && response.data) {
          return {
            subscriptions: response.data.active || [],
            totalActiveSubscriptions: response.data.totalActive || 0
          };
        }
        return response || [];
      }),
      catchError(error => {
        console.warn('Subscriptions endpoint error:', error);
        return of({ subscriptions: [], totalActiveSubscriptions: 0 });
      })
    );
  }

  /**
   * Get Student Certificates
   * Endpoint: GET /api/Certificates/student/{studentId}
   */
  getStudentCertificates(studentId: number): Observable<any> {
    return this.api.get(`Certificates/student/${studentId}`);
  }

  /**
   * Get Student Achievements
   * Endpoint: GET /api/Achievements/student/{studentId}
   */
  getStudentAchievements(studentId: number): Observable<any> {
    return this.api.get(`Achievements/student/${studentId}`).pipe(
      map(response => response || []),
      catchError((error: any) => {
        console.warn('Achievements endpoint error:', error);
        return of([]);
      })
    );
  }

  /**
   * Get Student Achievement Points
   * Endpoint: GET /api/Achievements/student/{studentId}/points
   */
  getStudentAchievementPoints(studentId: number): Observable<any> {
    return this.api.get(`Achievements/student/${studentId}/points`);
  }

  /**
   * Get Available Subjects for Student
   * Endpoint: GET /api/StudentSubjects/student/{studentId}/available-subjects
   */
  getAvailableSubjects(studentId: number): Observable<any> {
    return this.api.get(`StudentSubjects/student/${studentId}/available-subjects`);
  }

  /**
   * Check if student has access to subject
   * Endpoint: GET /api/StudentSubjects/student/{studentId}/has-access/subject/{subjectId}
   */
  hasSubjectAccess(studentId: number, subjectId: number): Observable<boolean> {
    return this.api.get<boolean>(`StudentSubjects/student/${studentId}/has-access/subject/${subjectId}`);
  }

  /**
   * Check if student has access to lesson
   * Endpoint: GET /api/StudentSubjects/student/{studentId}/has-access/lesson/{lessonId}
   */
  hasLessonAccess(studentId: number, lessonId: number): Observable<boolean> {
    return this.api.get<boolean>(`StudentSubjects/student/${studentId}/has-access/lesson/${lessonId}`);
  }

  /**
   * Check if student has access to exam
   * Endpoint: GET /api/StudentSubjects/student/{studentId}/has-access/exam/{examId}
   */
  hasExamAccess(studentId: number, examId: number): Observable<boolean> {
    return this.api.get<boolean>(`StudentSubjects/student/${studentId}/has-access/exam/${examId}`);
  }

  /**
   * Get Student Exam History - NEW BACKEND ENDPOINT
   * Endpoint: GET /api/Exam/student/{studentId}/history
   */
  getStudentExamHistory(studentId: number): Observable<ApiResponse<ExamHistory[]>> {
    return this.api.get<ApiResponse<ExamHistory[]>>(`Exam/student/${studentId}/history`).pipe(
      catchError((error: any) => {
        console.warn('Exam history endpoint error:', error);
        return of({ success: false, data: [] as ExamHistory[] } as ApiResponse<ExamHistory[]>);
      })
    );
  }

  /**
   * Get Student Recent Activities - NEW BACKEND ENDPOINT
   * Endpoint: GET /api/Student/{studentId}/recent-activities
   */
  getStudentRecentActivities(studentId: number): Observable<ApiResponse<RecentActivity[]>> {
    return this.api.get<ApiResponse<RecentActivity[]>>(`Student/${studentId}/recent-activities`).pipe(
      catchError((error: any) => {
        console.warn('Recent activities endpoint error:', error);
        return of({ success: false, data: [] as RecentActivity[] } as ApiResponse<RecentActivity[]>);
      })
    );
  }

  /**
   * Get Enhanced Student Dashboard with Real API Calls
   * Uses the new backend endpoints implemented
   */
  getEnhancedStudentDashboard(studentId: number): Observable<any> {
    return forkJoin({
      dashboard: this.getStudentDashboard(),
      progress: this.getStudentProgress(studentId),
      subscriptions: this.getStudentSubscriptionsSummary(studentId),
      certificates: this.getStudentCertificates(studentId),
      achievements: this.getStudentAchievements(studentId),
      examHistory: this.getStudentExamHistory(studentId),
      recentActivities: this.getStudentRecentActivities(studentId)
    }).pipe(
      map(data => ({
        ...data.dashboard,
        detailedProgress: data.progress,
        subscriptionDetails: data.subscriptions,
        certificates: data.certificates,
        achievements: data.achievements,
        examHistory: data.examHistory.data,
        recentActivities: data.recentActivities.data
      }))
    );
  }

  /**
   * Get Safe Student Dashboard - Only uses confirmed working endpoints
   * Fallback method for when some endpoints are not available
   */
  getSafeStudentDashboard(studentId: number): Observable<any> {
    // Only use endpoints that are confirmed to exist and work
    return forkJoin({
      // Use only the endpoints that are available according to swagger
      subscriptions: this.getStudentSubscriptionsSummary(studentId),
      achievements: this.getStudentAchievements(studentId),
      achievementPoints: this.getStudentAchievementPoints(studentId)
    }).pipe(
      map(data => ({
        subscriptionDetails: data.subscriptions,
        achievements: data.achievements,
        achievementPoints: data.achievementPoints,
        examHistory: [], // Will be populated when endpoint is fixed
        recentActivities: [] // Will be populated when endpoint is fixed
      })),
      catchError((error: any) => {
        console.warn('Safe dashboard load failed:', error);
        return of({
          subscriptionDetails: [],
          achievements: [],
          achievementPoints: 0,
          examHistory: [],
          recentActivities: []
        });
      })
    );
  }
}
