/**
 * Subject Service
 * Handles Subject CRUD and related operations
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, timeout, delay } from 'rxjs/operators';
import { ApiService } from './base-api.service';
import { MockDataService } from './mock-data.service';
import { PagedResult } from '../../models/common.models';
import {
  Subject,
  SubjectFilterParams,
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectEnrollment
} from '../../models/subject.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private api = inject(ApiService);
  private mockData = inject(MockDataService);

  /**
   * Get subjects with pagination and filters
   * Endpoint: GET /api/subjects
   * Query params: page, pageSize, categoryId, yearId
   */
  getSubjects(params?: SubjectFilterParams): Observable<PagedResult<Subject>> {
    // Mock data
    const mockSubjects = this.mockData.getMockSubjects();
    const mockResult: PagedResult<any> = {
      items: mockSubjects as any,
      totalCount: mockSubjects.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      totalPages: Math.ceil(mockSubjects.length / (params?.pageSize || 10)),
      hasPrevious: (params?.page || 1) > 1,
      hasNext: (params?.page || 1) < Math.ceil(mockSubjects.length / (params?.pageSize || 10))
    };

    // If mock mode enabled
    if (environment.useMock) {
      return of(mockResult as any).pipe(delay(500));
    }

    // API call with fallback
    const paginationParams = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 10
    };

    const additionalParams: any = {};
    if (params?.categoryId) additionalParams.categoryId = params.categoryId;
    if (params?.yearId) additionalParams.yearId = params.yearId;
    if (params?.searchTerm) additionalParams.searchTerm = params.searchTerm;

    return this.mockData.withMockFallback(
      this.api.getPaginated<Subject>('subjects', paginationParams, additionalParams).pipe(
        timeout(environment.apiTimeout || 10000)
      ),
      mockResult
    );
  }

  /**
   * Get all subjects without pagination (for dropdowns, forms, etc.)
   * Endpoint: GET /api/subjects?pageSize=-1
   * Use this when you need all subjects at once
   */
  getAllSubjects(params?: { categoryId?: number; yearId?: number; searchTerm?: string }): Observable<PagedResult<Subject>> {
    // Mock data
    const mockSubjects = this.mockData.getMockSubjects();
    const mockResult: PagedResult<any> = {
      items: mockSubjects as any,
      totalCount: mockSubjects.length,
      page: 1,
      pageSize: -1,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false
    };

    // If mock mode enabled
    if (environment.useMock) {
      return of(mockResult as any).pipe(delay(500));
    }

    // API call with pageSize=1000 to get all items (safer than -1)
    const paginationParams = {
      page: 1,
      pageSize: 1000
    };

    const additionalParams: any = {};
    if (params?.categoryId) additionalParams.categoryId = params.categoryId;
    if (params?.yearId) additionalParams.yearId = params.yearId;
    if (params?.searchTerm) additionalParams.searchTerm = params.searchTerm;

    return this.mockData.withMockFallback(
      this.api.getPaginated<Subject>('subjects', paginationParams, additionalParams).pipe(
        timeout(environment.apiTimeout || 10000)
      ),
      mockResult
    );
  }

  /**
   * Get subject by ID
   * Endpoint: GET /api/subjects/{id}
   */
  getSubjectById(id: number): Observable<Subject> {
    const mockSubject: any = this.mockData.getMockSubjects().find(s => s.id === id) || this.mockData.getMockSubjects()[0];

    if (environment.useMock) {
      return this.mockData.mockSuccess(mockSubject as Subject);
    }

    return this.mockData.withMockFallback(
      this.api.get<Subject>(`subjects/${id}`).pipe(
        timeout(environment.apiTimeout || 10000)
      ),
      mockSubject as Subject
    );
  }

  /**
   * Get subjects by category
   * Endpoint: GET /api/subjects/by-category/{categoryId}
   */
  getSubjectsByCategory(categoryId: number): Observable<Subject[]> {
    const mockSubjects = this.mockData.getMockSubjects().filter((s: any) => s.categoryId === categoryId);

    if (environment.useMock) {
      return this.mockData.mockSuccess(mockSubjects as any);
    }

    return this.mockData.withMockFallback(
      this.api.get<Subject[]>(`subjects/by-category/${categoryId}`).pipe(
        timeout(environment.apiTimeout || 10000)
      ),
      mockSubjects as any
    );
  }

  /**
   * Get subjects by year
   * Endpoint: GET /api/subjects/by-year/{yearId}
   */
  getSubjectsByYear(yearId: number): Observable<Subject[]> {
    const mockSubjects = this.mockData.getMockSubjects().filter((s: any) => s.yearId === yearId);

    if (environment.useMock) {
      return this.mockData.mockSuccess(mockSubjects as any);
    }

    return this.mockData.withMockFallback(
      this.api.get<Subject[]>(`subjects/by-year/${yearId}`).pipe(
        timeout(environment.apiTimeout || 10000)
      ),
      mockSubjects as any
    );
  }

  /**
   * Get subjects by term
   * Endpoint: GET /api/subjects/by-term/{termId}
   */
  getSubjectsByTerm(termId: number): Observable<Subject[]> {
    const mockSubjects = this.mockData.getMockSubjects();

    if (environment.useMock) {
      return this.mockData.mockSuccess(mockSubjects as any);
    }

    return this.mockData.withMockFallback(
      this.api.get<Subject[]>(`subjects/by-term/${termId}`).pipe(
        timeout(environment.apiTimeout || 10000)
      ),
      mockSubjects as any
    );
  }

  /**
   * Get subjects by week
   * Endpoint: GET /api/subjects/by-week/{weekId}
   */
  getSubjectsByWeek(weekId: number): Observable<Subject[]> {
    const mockSubjects = this.mockData.getMockSubjects();

    if (environment.useMock) {
      return this.mockData.mockSuccess(mockSubjects as any);
    }

    return this.mockData.withMockFallback(
      this.api.get<Subject[]>(`subjects/by-week/${weekId}`).pipe(
        timeout(environment.apiTimeout || 10000)
      ),
      mockSubjects as any
    );
  }

  /**
   * Create new subject
   * Endpoint: POST /api/subjects
   * Content-Type: multipart/form-data
   * Roles: Admin
   */
  createSubject(dto: CreateSubjectDto): Observable<Subject> {
    const formData = this.buildSubjectFormData(dto);
    return this.api.upload<Subject>('subjects', formData);
  }

  /**
   * Update subject
   * Endpoint: PUT /api/subjects/{id}
   * Content-Type: multipart/form-data
   * Roles: Admin
   */
  updateSubject(id: number, dto: UpdateSubjectDto): Observable<Subject> {
    const formData = this.buildSubjectFormData(dto);
    return this.api.upload<Subject>(`subjects/${id}`, formData);
  }

  /**
   * Delete subject
   * Endpoint: DELETE /api/subjects/{id}
   * Roles: Admin
   */
  deleteSubject(id: number): Observable<void> {
    return this.api.delete<void>(`subjects/${id}`);
  }

  /**
   * Get subject enrollment statistics
   * Endpoint: GET /api/subjects/{id}/enrollment
   */
  getSubjectEnrollment(id: number): Observable<SubjectEnrollment> {
    return this.api.get<SubjectEnrollment>(`subjects/${id}/enrollment`);
  }

  /**
   * Build FormData for subject creation/update
   */
  private buildSubjectFormData(dto: CreateSubjectDto | UpdateSubjectDto): FormData {
    const formData = new FormData();

    if ('yearId' in dto && dto.yearId) {
      formData.append('yearId', dto.yearId.toString());
    }
    if ('subjectNameId' in dto && dto.subjectNameId) {
      formData.append('subjectNameId', dto.subjectNameId.toString());
    }
    if ('teacherId' in dto && dto.teacherId) {
      formData.append('teacherId', dto.teacherId.toString());
    }
    if (dto.originalPrice !== undefined) {
      formData.append('originalPrice', dto.originalPrice.toString());
    }
    if (dto.discountPercentage !== undefined) {
      formData.append('discountPercentage', dto.discountPercentage.toString());
    }
    if (dto.level) {
      formData.append('level', dto.level);
    }
    if (dto.duration !== undefined) {
      formData.append('duration', dto.duration.toString());
    }
    if (dto.posterFile) {
      formData.append('posterFile', dto.posterFile);
    }

    return formData;
  }
}
