/**
 * Exam Service
 * Handles Exam, Questions, Student Sessions, Grading, and Statistics
 * Based on Backend API Documentation - PAYMENT_EXAMS_UPDATE_REPORT.md
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { ApiService } from './base-api.service';
import { MockDataService } from './mock-data.service';
import {
  Exam,
  ExamDetails,
  CreateExamDto,
  UpdateExamDto,
  StudentExamSession,
  ExamSubmission,
  ExamResult,
  StudentExamHistory,
  ExamStatistics,
  GradeTextAnswerDto,
  BulkGradeDto
} from '../../models/exam.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private api = inject(ApiService);
  private mockData = inject(MockDataService);

  // ============================================
  // Exam CRUD Methods
  // ============================================

  /**
   * Get all exams
   * Endpoint: GET /api/exam
   */
  getExams(): Observable<Exam[]> {
    const mockExams: any = this.mockData.getMockExams();

    if (environment.useMock) {
      return this.mockData.mockSuccess(mockExams as Exam[]);
    }

    return this.mockData.withMockFallback(
      this.api.get<Exam[]>('exam').pipe(timeout(environment.apiTimeout)),
      mockExams as Exam[]
    );
  }  /**
   * Get exam by ID with full details
   * Endpoint: GET /api/exam/{id}
   */
  getExamById(id: number): Observable<ExamDetails> {
    const mockExam = this.mockData.getMockExams().find(e => e.id === id) || this.mockData.getMockExams()[0];
    const mockQuestions = this.mockData.getMockExamQuestions(id);
    const mockDetails: any = { ...mockExam, questions: mockQuestions };

    if (environment.useMock) {
      return this.mockData.mockSuccess(mockDetails);
    }

    return this.mockData.withMockFallback(
      this.api.get<ExamDetails>(`exam/${id}`).pipe(timeout(environment.apiTimeout)),
      mockDetails
    );
  }

  /**
   * Get exams by type
   * Endpoint: GET /api/exam/by-type/{examType}
   * ExamType: Lesson, Monthly, Term, Year
   */
  getExamsByType(examType: string): Observable<Exam[]> {
    return this.api.get<Exam[]>(`exam/by-type/${examType}`);
  }

  /**
   * Get exams by subject
   * Endpoint: GET /api/exam/by-subject/{subjectId}
   */
  getExamsBySubject(subjectId: number): Observable<Exam[]> {
    return this.api.get<Exam[]>(`exam/by-subject/${subjectId}`);
  }

  /**
   * Get exams by term
   * Endpoint: GET /api/exam/by-term/{termId}
   */
  getExamsByTerm(termId: number): Observable<Exam[]> {
    return this.api.get<Exam[]>(`exam/by-term/${termId}`);
  }

  /**
   * Get exams by lesson
   * Endpoint: GET /api/exam/by-lesson/{lessonId}
   */
  getExamsByLesson(lessonId: number): Observable<Exam[]> {
    return this.api.get<Exam[]>(`exam/by-lesson/${lessonId}`);
  }

  /**
   * Create new exam with questions
   * Endpoint: POST /api/exam
   * Roles: Admin, Teacher
   */
  createExam(dto: CreateExamDto): Observable<Exam> {
    return this.api.post<Exam>('exam', dto);
  }

  /**
   * Update exam
   * Endpoint: PUT /api/exam/{id}
   * Roles: Admin, Teacher
   */
  updateExam(id: number, dto: UpdateExamDto): Observable<Exam> {
    return this.api.put<Exam>(`exam/${id}`, dto);
  }

  /**
   * Delete exam
   * Endpoint: DELETE /api/exam/{id}
   * Roles: Admin, Teacher
   */
  deleteExam(id: number): Observable<void> {
    return this.api.delete<void>(`exam/${id}`);
  }

  /**
   * Publish/Unpublish exam
   * Endpoint: PUT /api/exam/{id}/publish
   * Roles: Admin, Teacher
   */
  toggleExamPublish(id: number, isPublished: boolean): Observable<void> {
    return this.api.put<void>(`exam/${id}/publish`, { isPublished });
  }

  // ============================================
  // Student Exam Session Methods
  // ============================================

  /**
   * Start exam (create student exam session)
   * Endpoint: POST /api/exam/{examId}/start
   * Roles: Student
   */
  startExam(examId: number): Observable<StudentExamSession> {
    return this.api.post<StudentExamSession>(`exam/${examId}/start`, {});
  }

  /**
   * Submit exam answers
   * Endpoint: POST /api/exam/{examId}/submit
   * Roles: Student
   */
  submitExam(examId: number, submission: ExamSubmission): Observable<ExamResult> {
    return this.api.post<ExamResult>(`exam/${examId}/submit`, submission);
  }

  /**
   * Get exam result
   * Endpoint: GET /api/exam/result/{studentExamId}
   * Roles: Student, Teacher, Admin
   */
  getExamResult(studentExamId: number): Observable<ExamResult> {
    return this.api.get<ExamResult>(`exam/result/${studentExamId}`);
  }

  /**
   * Get student exam history for specific exam
   * Endpoint: GET /api/exam/{examId}/history/{studentId}
   * Roles: Student, Teacher, Admin
   */
  getStudentExamHistory(examId: number, studentId: number): Observable<StudentExamHistory> {
    return this.api.get<StudentExamHistory>(`exam/${examId}/history/${studentId}`);
  }

  /**
   * Get all student exam results
   * Endpoint: GET /api/exam/student/{studentId}/results
   * Roles: Student, Parent, Teacher, Admin
   */
  getStudentResults(studentId: number): Observable<ExamResult[]> {
    return this.api.get<ExamResult[]>(`exam/student/${studentId}/results`);
  }

  // ============================================
  // Teacher Grading Methods
  // ============================================

  /**
   * Grade text answer manually
   * Endpoint: POST /api/exam/grade-text-answer
   * Roles: Teacher, Admin
   */
  gradeTextAnswer(dto: GradeTextAnswerDto): Observable<void> {
    return this.api.post<void>('exam/grade-text-answer', dto);
  }

  /**
   * Bulk grade multiple text answers
   * Endpoint: POST /api/exam/bulk-grade
   * Roles: Teacher, Admin
   */
  bulkGrade(dto: BulkGradeDto): Observable<void> {
    return this.api.post<void>('exam/bulk-grade', dto);
  }

  /**
   * Get pending grading (text answers requiring manual grading)
   * Endpoint: GET /api/exam/pending-grading/{teacherId}
   * Roles: Teacher, Admin
   */
  getPendingGrading(teacherId: number): Observable<ExamResult[]> {
    return this.api.get<ExamResult[]>(`exam/pending-grading/${teacherId}`);
  }

  /**
   * Get all submissions for an exam
   * Endpoint: GET /api/exam/{examId}/submissions
   * Roles: Teacher, Admin
   */
  getExamSubmissions(examId: number): Observable<ExamResult[]> {
    return this.api.get<ExamResult[]>(`exam/${examId}/submissions`);
  }

  // ============================================
  // Statistics & Analytics Methods
  // ============================================

  /**
   * Get exam statistics
   * Endpoint: GET /api/exam/{examId}/statistics
   * Roles: Teacher, Admin
   */
  getExamStatistics(examId: number): Observable<ExamStatistics> {
    return this.api.get<ExamStatistics>(`exam/${examId}/statistics`);
  }

  /**
   * Get average score for exam
   * Endpoint: GET /api/exam/{examId}/average-score
   * Roles: Teacher, Admin
   */
  getExamAverageScore(examId: number): Observable<{ averageScore: number }> {
    return this.api.get<{ averageScore: number }>(`exam/${examId}/average-score`);
  }

  /**
   * Get pass rate for exam
   * Endpoint: GET /api/exam/{examId}/pass-rate
   * Roles: Teacher, Admin
   */
  getExamPassRate(examId: number): Observable<{ passRate: number }> {
    return this.api.get<{ passRate: number }>(`exam/${examId}/pass-rate`);
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Check if student can take exam
   */
  canTakeExam(examId: number, studentId: number): Observable<{ canTake: boolean; reason?: string }> {
    return this.api.get<{ canTake: boolean; reason?: string }>(
      `exam/${examId}/can-take/${studentId}`
    );
  }

  /**
   * Get upcoming exams for student
   * Endpoint: GET /api/exam/student/{studentId}/upcoming
   * Roles: Student
   */
  getUpcomingExams(studentId: number): Observable<Exam[]> {
    return this.api.get<Exam[]>(`exam/student/${studentId}/upcoming`);
  }

  /**
   * Get exam time remaining
   */
  getTimeRemaining(studentExamId: number): Observable<{ remainingMinutes: number }> {
    return this.api.get<{ remainingMinutes: number }>(
      `exam/session/${studentExamId}/time-remaining`
    );
  }
}
