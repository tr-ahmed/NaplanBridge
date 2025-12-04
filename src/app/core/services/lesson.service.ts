/**
 * Lesson Service
 * Handles Lesson, Resource, and Lesson Question operations
 * Supports Bunny.net video integration
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { ApiService } from './base-api.service';
import { MockDataService } from './mock-data.service';
import {
  Lesson,
  LessonDetails,
  CreateLessonDto,
  UpdateLessonDto,
  LessonQuestion,
  CreateLessonQuestionDto,
  UpdateLessonQuestionDto,
  Resource,
  CreateResourceDto,
  UpdateResourceDto,
  VideoUploadResponse,
  VideoProvider,
  LessonQuestionAnswer
} from '../../models/lesson.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private api = inject(ApiService);
  private mockData = inject(MockDataService);

  // ============================================
  // Lesson Methods
  // ============================================

  /**
   * Get all lessons
   * Endpoint: GET /api/lessons
   */
  getLessons(): Observable<Lesson[]> {
    const mockLessons: any = this.mockData.getMockLessons(1);

    if (environment.useMock) {
      return this.mockData.mockSuccess(mockLessons as Lesson[]);
    }

    return this.mockData.withMockFallback(
      this.api.get<Lesson[]>('lessons').pipe(timeout(environment.apiTimeout)),
      mockLessons as Lesson[]
    );
  }  /**
   * Get lesson by ID with full details
   * Endpoint: GET /api/lessons/{id}
   */
  getLessonById(id: number): Observable<LessonDetails> {
    const mockLesson = this.mockData.getMockLessons(1).find(l => l.id === id) || this.mockData.getMockLessons(1)[0];
    const mockDetails: any = { ...mockLesson, questions: [], resources: [] };

    if (environment.useMock) {
      return this.mockData.mockSuccess(mockDetails);
    }

    return this.mockData.withMockFallback(
      this.api.get<LessonDetails>(`lessons/${id}`).pipe(timeout(environment.apiTimeout)),
      mockDetails
    );
  }

  /**
   * Get lessons by week
   * Endpoint: GET /api/lessons/by-week/{weekId}
   */
  getLessonsByWeek(weekId: number): Observable<Lesson[]> {
    return this.api.get<Lesson[]>(`lessons/by-week/${weekId}`);
  }

  /**
   * Get lessons by term
   * Endpoint: GET /api/lessons/by-term/{termId}
   */
  getLessonsByTerm(termId: number): Observable<Lesson[]> {
    return this.api.get<Lesson[]>(`lessons/by-term/${termId}`);
  }

  /**
   * Get lessons by subject
   * Endpoint: GET /api/lessons/by-subject/{subjectId}
   */
  getLessonsBySubject(subjectId: number): Observable<Lesson[]> {
    return this.api.get<Lesson[]>(`lessons/by-subject/${subjectId}`);
  }

  /**
   * Get in-progress lessons for student
   * Endpoint: GET /api/Lessons/student/{studentId}/in-progress
   * Returns lessons with 0 < progress < 100
   */
  getInProgressLessons(studentId: number): Observable<any> {
    return this.api.get(`Lessons/student/${studentId}/in-progress`);
  }

  /**
   * Create new lesson
   * Endpoint: POST /api/lessons
   * Content-Type: multipart/form-data
   * Roles: Admin, Teacher
   */
  createLesson(dto: CreateLessonDto): Observable<Lesson> {
    const formData = this.buildLessonFormData(dto);
    return this.api.upload<Lesson>('lessons', formData);
  }

  /**
   * Update lesson
   * Endpoint: PUT /api/lessons/{id}
   * Content-Type: multipart/form-data
   * Roles: Admin, Teacher
   */
  updateLesson(id: number, dto: UpdateLessonDto): Observable<Lesson> {
    const formData = this.buildLessonFormData(dto);
    return this.api.upload<Lesson>(`lessons/${id}`, formData);
  }

  /**
   * Delete lesson
   * Endpoint: DELETE /api/lessons/{id}
   * Roles: Admin, Teacher
   */
  deleteLesson(id: number): Observable<void> {
    return this.api.delete<void>(`lessons/${id}`);
  }

  // ============================================
  // Video Upload Methods (Bunny.net Support)
  // ============================================

  /**
   * Upload video for lesson
   * Endpoint: POST /api/lessons/upload-video
   * Content-Type: multipart/form-data
   * Roles: Admin, Teacher
   */
  uploadVideo(videoFile: File, provider: VideoProvider = 'BunnyStream'): Observable<VideoUploadResponse> {
    const formData = new FormData();
    formData.append('videoFile', videoFile);
    formData.append('provider', provider);

    return this.api.upload<VideoUploadResponse>('lessons/upload-video', formData);
  }

  // ============================================
  // Lesson Question Methods
  // ============================================

  /**
   * Get questions for a lesson
   * Endpoint: GET /api/lessons/{lessonId}/questions
   */
  getLessonQuestions(lessonId: number): Observable<LessonQuestion[]> {
    return this.api.get<LessonQuestion[]>(`lessons/${lessonId}/questions`);
  }

  /**
   * Create lesson question
   * Endpoint: POST /api/lessonquestions
   * Roles: Admin, Teacher
   */
  createLessonQuestion(dto: CreateLessonQuestionDto): Observable<LessonQuestion> {
    return this.api.post<LessonQuestion>('lessonquestions', dto);
  }

  /**
   * Update lesson question
   * Endpoint: PUT /api/lessonquestions/{id}
   * Roles: Admin, Teacher
   */
  updateLessonQuestion(id: number, dto: UpdateLessonQuestionDto): Observable<LessonQuestion> {
    return this.api.put<LessonQuestion>(`lessonquestions/${id}`, dto);
  }

  /**
   * Delete lesson question
   * Endpoint: DELETE /api/lessonquestions/{id}
   * Roles: Admin, Teacher
   */
  deleteLessonQuestion(id: number): Observable<void> {
    return this.api.delete<void>(`lessonquestions/${id}`);
  }

  /**
   * Submit answers for lesson questions (quiz)
   * Endpoint: POST /api/lessons/{lessonId}/submit-answers
   * Roles: Student
   */
  submitLessonAnswers(lessonId: number, answers: LessonQuestionAnswer[]): Observable<any> {
    return this.api.post(`lessons/${lessonId}/submit-answers`, { answers });
  }

  // ============================================
  // Resource Methods
  // ============================================

  /**
   * Get resources for a lesson
   * Endpoint: GET /api/lessons/{lessonId}/resources
   */
  getLessonResources(lessonId: number): Observable<Resource[]> {
    return this.api.get<Resource[]>(`lessons/${lessonId}/resources`);
  }

  /**
   * Create lesson resource
   * Endpoint: POST /api/resources
   * Content-Type: multipart/form-data
   * Roles: Admin, Teacher
   */
  createResource(dto: CreateResourceDto): Observable<Resource> {
    const formData = this.buildResourceFormData(dto);
    return this.api.upload<Resource>('resources', formData);
  }

  /**
   * Update resource
   * Endpoint: PUT /api/resources/{id}
   * Content-Type: multipart/form-data
   * Roles: Admin, Teacher
   */
  updateResource(id: number, dto: UpdateResourceDto): Observable<Resource> {
    const formData = this.buildResourceFormData(dto);
    return this.api.upload<Resource>(`resources/${id}`, formData);
  }

  /**
   * Delete resource
   * Endpoint: DELETE /api/resources/{id}
   * Roles: Admin, Teacher
   */
  deleteResource(id: number): Observable<void> {
    return this.api.delete<void>(`resources/${id}`);
  }

  /**
   * Download resource
   * Endpoint: GET /api/resources/{id}/download
   */
  downloadResource(id: number): Observable<Blob> {
    return this.api.downloadFile(`resources/${id}/download`);
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private buildLessonFormData(dto: CreateLessonDto | UpdateLessonDto): FormData {
    const formData = new FormData();

    if ('weekId' in dto && dto.weekId) {
      formData.append('weekId', dto.weekId.toString());
    }
    if (dto.title) {
      formData.append('title', dto.title);
    }
    if (dto.description) {
      formData.append('description', dto.description);
    }
    if ('order' in dto && dto.order !== undefined) {
      formData.append('order', dto.order.toString());
    }
    if (dto.videoFile) {
      formData.append('videoFile', dto.videoFile);
    }
    if ('videoProvider' in dto && dto.videoProvider) {
      formData.append('videoProvider', dto.videoProvider);
    }

    return formData;
  }

  private buildResourceFormData(dto: CreateResourceDto | UpdateResourceDto): FormData {
    const formData = new FormData();

    if ('lessonId' in dto && dto.lessonId) {
      formData.append('lessonId', dto.lessonId.toString());
    }
    if (dto.title) {
      formData.append('title', dto.title);
    }
    if (dto.description) {
      formData.append('description', dto.description);
    }
    if (dto.resourceType) {
      formData.append('resourceType', dto.resourceType);
    }
    if (dto.resourceFile) {
      formData.append('resourceFile', dto.resourceFile);
    }
    if ('resourceUrl' in dto && dto.resourceUrl) {
      formData.append('resourceUrl', dto.resourceUrl);
    }

    return formData;
  }
}
