/**
 * Lesson Questions Service (Student-Teacher Interaction)
 * Handles questions asked by students on lessons
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { ApiService } from './base-api.service';
import { environment } from '../../../environments/environment';

export interface LessonQuestion {
  id: number;
  lessonId: number;
  studentId: number;
  studentName?: string;
  questionText: string;
  answer?: string;
  isAnswered: boolean;
  isPending: boolean;
  createdAt: string | Date;
  answeredAt?: string | Date;
}

export interface CreateLessonQuestionDto {
  lessonId: number;
  questionText: string;
}

export interface AnswerQuestionDto {
  lessonQuestionId: number;
  answer: string;
}

@Injectable({
  providedIn: 'root'
})
export class LessonQuestionsService {
  private api = inject(ApiService);

  /**
   * Get all lesson questions
   * Endpoint: GET /api/LessonQuestions
   */
  getQuestions(): Observable<LessonQuestion[]> {
    return this.api.get<LessonQuestion[]>('LessonQuestions').pipe(timeout(environment.apiTimeout));
  }

  /**
   * Get questions for a specific lesson
   * Endpoint: GET /api/LessonQuestions/lesson/{lessonId}
   */
  getQuestionsByLesson(lessonId: number): Observable<LessonQuestion[]> {
    return this.api.get<LessonQuestion[]>(`LessonQuestions/lesson/${lessonId}`).pipe(timeout(environment.apiTimeout));
  }

  /**
   * Get question by ID
   * Endpoint: GET /api/LessonQuestions/{id}
   * (Note: This endpoint may not exist in swagger, using general get)
   */
  getQuestionById(id: number): Observable<LessonQuestion> {
    return this.api.get<LessonQuestion>(`LessonQuestions/${id}`).pipe(timeout(environment.apiTimeout));
  }

  /**
   * Create a new question (student asks teacher)
   * Endpoint: POST /api/LessonQuestions
   */
  createQuestion(dto: CreateLessonQuestionDto): Observable<LessonQuestion> {
    return this.api.post<LessonQuestion>('LessonQuestions', dto).pipe(timeout(environment.apiTimeout));
  }

  /**
   * Answer a question (teacher responds)
   * Endpoint: POST /api/LessonQuestions/answer
   */
  answerQuestion(dto: AnswerQuestionDto): Observable<LessonQuestion> {
    return this.api.post<LessonQuestion>('LessonQuestions/answer', dto).pipe(timeout(environment.apiTimeout));
  }

  /**
   * Update a question
   * Endpoint: PUT /api/LessonQuestions/{id}
   */
  updateQuestion(id: number, dto: Partial<CreateLessonQuestionDto>): Observable<LessonQuestion> {
    return this.api.put<LessonQuestion>(`LessonQuestions/${id}`, dto).pipe(timeout(environment.apiTimeout));
  }

  /**
   * Delete a question
   * Endpoint: DELETE /api/LessonQuestions/{id}
   */
  deleteQuestion(id: number): Observable<void> {
    return this.api.delete<void>(`LessonQuestions/${id}`).pipe(timeout(environment.apiTimeout));
  }
}
