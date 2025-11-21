import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateStudentQuestionDto,
  UpdateStudentQuestionDto,
  AnswerStudentQuestionDto,
  StudentQuestionDto,
  PaginatedQuestionsResponse,
  StudentQuestionFilters
} from '../../models/student-question.models';

/**
 * Service for managing student questions to teachers
 * Handles student Q&A functionality in lessons
 */
@Injectable({
  providedIn: 'root'
})
export class StudentQuestionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/StudentQuestions`;

  /**
   * Student creates a new question about a lesson
   * @param dto Question data (lessonId, questionText)
   * @returns Created question
   */
  createQuestion(dto: CreateStudentQuestionDto): Observable<StudentQuestionDto> {
    return this.http.post<StudentQuestionDto>(this.apiUrl, dto);
  }

  /**
   * Get all questions submitted by the current student
   * @param filters Optional filters (lessonId, isAnswered)
   * @returns Array of student's questions
   */
  getMyQuestions(filters?: StudentQuestionFilters): Observable<StudentQuestionDto[]> {
    let params = new HttpParams();

    if (filters?.lessonId) {
      params = params.append('lessonId', filters.lessonId.toString());
    }
    if (filters?.isAnswered !== undefined) {
      params = params.append('isAnswered', filters.isAnswered.toString());
    }

    return this.http.get<StudentQuestionDto[]>(`${this.apiUrl}/my-questions`, { params });
  }

  /**
   * Get questions for a specific lesson (accessible by all authenticated users)
   * @param lessonId Lesson ID
   * @param includeAnswered Include answered questions (default: true)
   * @returns Array of questions for the lesson
   */
  getQuestionsByLesson(lessonId: number, includeAnswered: boolean = true): Observable<StudentQuestionDto[]> {
    const params = new HttpParams().set('includeAnswered', includeAnswered.toString());
    return this.http.get<StudentQuestionDto[]>(`${this.apiUrl}/lesson/${lessonId}`, { params });
  }

  /**
   * Get a specific question by ID
   * @param id Question ID
   * @returns Question details
   */
  getQuestionById(id: number): Observable<StudentQuestionDto> {
    return this.http.get<StudentQuestionDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update an unanswered question (student only)
   * @param id Question ID
   * @param dto Updated question text
   * @returns void
   */
  updateQuestion(id: number, dto: UpdateStudentQuestionDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Delete an unanswered question (student owner or admin)
   * @param id Question ID
   * @returns void
   */
  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ============== TEACHER ENDPOINTS ==============

  /**
   * Get all pending (unanswered) questions for teacher's lessons
   * @param filters Optional filters (lessonId, subjectId, termId)
   * @returns Array of pending questions
   */
  getPendingQuestions(filters?: StudentQuestionFilters): Observable<StudentQuestionDto[]> {
    let params = new HttpParams();

    if (filters?.lessonId) {
      params = params.append('lessonId', filters.lessonId.toString());
    }
    if (filters?.subjectId) {
      params = params.append('subjectId', filters.subjectId.toString());
    }
    if (filters?.termId) {
      params = params.append('termId', filters.termId.toString());
    }

    return this.http.get<StudentQuestionDto[]>(`${this.apiUrl}/teacher/pending`, { params });
  }

  /**
   * Get all questions (answered and unanswered) with pagination
   * @param filters Filters and pagination options
   * @returns Paginated response
   */
  getAllQuestions(filters?: StudentQuestionFilters): Observable<PaginatedQuestionsResponse> {
    let params = new HttpParams();

    if (filters?.isAnswered !== undefined) {
      params = params.append('isAnswered', filters.isAnswered.toString());
    }
    if (filters?.lessonId) {
      params = params.append('lessonId', filters.lessonId.toString());
    }
    if (filters?.subjectId) {
      params = params.append('subjectId', filters.subjectId.toString());
    }
    if (filters?.termId) {
      params = params.append('termId', filters.termId.toString());
    }
    if (filters?.page) {
      params = params.append('page', filters.page.toString());
    }
    if (filters?.pageSize) {
      params = params.append('pageSize', filters.pageSize.toString());
    }

    return this.http.get<PaginatedQuestionsResponse>(`${this.apiUrl}/teacher/all`, { params });
  }

  /**
   * Teacher answers a student question
   * @param questionId Question ID
   * @param dto Answer text
   * @returns Updated question with answer
   */
  answerQuestion(questionId: number, dto: AnswerStudentQuestionDto): Observable<StudentQuestionDto> {
    return this.http.post<StudentQuestionDto>(`${this.apiUrl}/${questionId}/answer`, dto);
  }

  /**
   * Convenience method - answer question with string directly
   * @param questionId Question ID
   * @param answerText Answer text
   * @returns Updated question
   */
  answerQuestionSimple(questionId: number, answerText: string): Observable<StudentQuestionDto> {
    return this.answerQuestion(questionId, { answerText });
  }
}
