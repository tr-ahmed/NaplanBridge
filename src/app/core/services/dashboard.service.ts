/**
 * Dashboard Service
 * Handles dashboard data for all user roles
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
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
  totalStudents: number;
  totalLessons: number;
  upcomingSessions: any[];
  recentActivities: any[];
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
   * Endpoint: GET /api/StudentSubjects/student/{studentId}/subscriptions-summary
   */
  getStudentSubscriptionsSummary(studentId: number): Observable<any> {
    return this.api.get(`StudentSubjects/student/${studentId}/subscriptions-summary`);
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
    return this.api.get(`Achievements/student/${studentId}`);
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
    return this.api.get<ApiResponse<ExamHistory[]>>(`Exam/student/${studentId}/history`);
  }

  /**
   * Get Student Recent Activities - NEW BACKEND ENDPOINT
   * Endpoint: GET /api/Student/{studentId}/recent-activities
   */
  getStudentRecentActivities(studentId: number): Observable<ApiResponse<RecentActivity[]>> {
    return this.api.get<ApiResponse<RecentActivity[]>>(`Student/${studentId}/recent-activities`);
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
}
