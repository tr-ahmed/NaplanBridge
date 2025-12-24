/**
 * Subject Service
 * Handles Subject CRUD and related operations
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, timeout, delay, map } from 'rxjs/operators';
import { ApiService } from './base-api.service';
import { MockDataService } from './mock-data.service';
import { SubjectUtilsService } from './subject-utils.service';
import { PagedResult } from '../../models/common.models';
import {
  Subject,
  SubjectFilterParams,
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectEnrollment,
  SubjectName,
  CreateSubjectNameDto,
  UpdateSubjectNameDto
} from '../../models/subject.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private api = inject(ApiService);
  private mockData = inject(MockDataService);
  private subjectUtils = inject(SubjectUtilsService);

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
   * Get subjects by year (includes global subjects)
   * Endpoint: GET /api/subjects/by-year/{yearId}
   * Global subjects (isGlobal=true) are included for all years
   */
  getSubjectsByYear(yearId: number, includeGlobal: boolean = true): Observable<Subject[]> {
    const mockSubjects = this.mockData.getMockSubjects().filter((s: any) =>
      s.yearId === yearId || (includeGlobal && s.isGlobal)
    );

    if (environment.useMock) {
      return this.mockData.mockSuccess(mockSubjects as any);
    }

    return this.mockData.withMockFallback(
      this.api.get<Subject[]>(`subjects/by-year/${yearId}`).pipe(
        timeout(environment.apiTimeout || 10000),
        map(subjects => {
          // Backend already includes global subjects, but we sort them
          return includeGlobal
            ? this.subjectUtils.sortSubjectsYearFirst(subjects, yearId)
            : subjects.filter(s => !s.isGlobal);
        })
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

  // ============================================
  // SubjectNames Management (Admin Only)
  // ============================================

  /**
   * Get all subject names with isGlobal flag
   * Endpoint: GET /api/SubjectNames
   */
  getSubjectNames(): Observable<SubjectName[]> {
    return this.api.get<SubjectName[]>('SubjectNames').pipe(
      timeout(environment.apiTimeout || 10000)
    );
  }

  /**
   * Get subject name by ID
   * Endpoint: GET /api/SubjectNames/{id}
   */
  getSubjectNameById(id: number): Observable<SubjectName> {
    return this.api.get<SubjectName>(`SubjectNames/${id}`).pipe(
      timeout(environment.apiTimeout || 10000)
    );
  }

  /**
   * Create new subject name (can be global)
   * Endpoint: POST /api/SubjectNames
   * Requires: Admin role
   */
  createSubjectName(dto: CreateSubjectNameDto): Observable<SubjectName> {
    return this.api.post<SubjectName>('SubjectNames', dto).pipe(
      timeout(environment.apiTimeout || 10000)
    );
  }

  /**
   * Update subject name (e.g., toggle isGlobal)
   * Endpoint: PUT /api/SubjectNames/{id}
   * Requires: Admin role
   */
  updateSubjectName(id: number, dto: UpdateSubjectNameDto): Observable<SubjectName> {
    return this.api.put<SubjectName>(`SubjectNames/${id}`, dto).pipe(
      timeout(environment.apiTimeout || 10000)
    );
  }

  /**
   * Delete subject name
   * Endpoint: DELETE /api/SubjectNames/{id}
   * Requires: Admin role
   */
  deleteSubjectName(id: number): Observable<void> {
    return this.api.delete<void>(`SubjectNames/${id}`).pipe(
      timeout(environment.apiTimeout || 10000)
    );
  }

  /**
   * Get only global subjects
   * Helper method to filter global subjects
   */
  getGlobalSubjects(): Observable<Subject[]> {
    return this.getAllSubjects().pipe(
      map(response => response.items.filter(s => s.isGlobal))
    );
  }

  /**
   * Filter subjects by year including global subjects
   * Helper method using SubjectUtilsService
   */
  filterSubjectsByYear(subjects: Subject[], yearId: number): Subject[] {
    return this.subjectUtils.filterSubjectsByYear(subjects, yearId);
  }

  /**
   * Bulk update tutoring prices (Admin only)
   * Endpoint: PUT /api/Admin/Subjects/BulkUpdateTutoringPrices
   * Requires: Admin role
   */
  bulkUpdateTutoringPrices(updates: { id: number; tutoringPricePerHour: number | null }[]): Observable<any> {
    return this.api.put('Admin/Subjects/BulkUpdateTutoringPrices', { updates }).pipe(
      timeout(environment.apiTimeout || 10000),
      catchError(error => {
        console.error('Error updating tutoring prices:', error);
        throw error;
      })
    );
  }

  /**
   * Update single subject tutoring price
   * Endpoint: PATCH /api/Subjects/{id}/TutoringPrice
   * Requires: Admin role
   */
  updateTutoringPrice(subjectId: number, tutoringPricePerHour: number | null): Observable<any> {
    return this.api.patch(`Subjects/${subjectId}/TutoringPrice`, { tutoringPricePerHour }).pipe(
      timeout(environment.apiTimeout || 10000),
      catchError(error => {
        console.error('Error updating tutoring price:', error);
        throw error;
      })
    );
  }
}
