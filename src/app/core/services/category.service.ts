/**
 * Category Service
 * Handles Categories, Years, and Subject Names
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './base-api.service';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  Year,
  CreateYearDto,
  UpdateYearDto,
  SubjectName,
  CreateSubjectNameDto,
  UpdateSubjectNameDto
} from '../../models/category.models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private api = inject(ApiService);

  // ============================================
  // Category Methods
  // ============================================

  /**
   * Get all categories
   * Endpoint: GET /api/categories
   * Cache: 24 hours
   */
  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('categories');
  }

  /**
   * Get category by ID
   * Endpoint: GET /api/categories/{id}
   */
  getCategoryById(id: number): Observable<Category> {
    return this.api.get<Category>(`categories/${id}`);
  }

  /**
   * Create new category
   * Endpoint: POST /api/categories
   * Roles: Admin
   */
  createCategory(dto: CreateCategoryDto): Observable<Category> {
    return this.api.post<Category>('categories', dto);
  }

  /**
   * Update category
   * Endpoint: PUT /api/categories/{id}
   * Roles: Admin
   */
  updateCategory(id: number, dto: UpdateCategoryDto): Observable<Category> {
    return this.api.put<Category>(`categories/${id}`, dto);
  }

  /**
   * Delete category
   * Endpoint: DELETE /api/categories/{id}
   * Roles: Admin
   */
  deleteCategory(id: number): Observable<void> {
    return this.api.delete<void>(`categories/${id}`);
  }

  // ============================================
  // Year Methods
  // ============================================

  /**
   * Get all years
   * Endpoint: GET /api/years
   * Cache: 24 hours
   */
  getYears(): Observable<Year[]> {
    return this.api.get<Year[]>('years');
  }

  /**
   * Get year by ID
   * Endpoint: GET /api/years/{id}
   */
  getYearById(id: number): Observable<Year> {
    return this.api.get<Year>(`years/${id}`);
  }

  /**
   * Create new year
   * Endpoint: POST /api/years
   * Roles: Admin
   */
  createYear(dto: CreateYearDto): Observable<Year> {
    return this.api.post<Year>('years', dto);
  }

  /**
   * Update year
   * Endpoint: PUT /api/years/{id}
   * Roles: Admin
   */
  updateYear(id: number, dto: UpdateYearDto): Observable<Year> {
    return this.api.put<Year>(`years/${id}`, dto);
  }

  /**
   * Delete year
   * Endpoint: DELETE /api/years/{id}
   * Roles: Admin
   */
  deleteYear(id: number): Observable<void> {
    return this.api.delete<void>(`years/${id}`);
  }

  // ============================================
  // Subject Name Methods
  // ============================================

  /**
   * Get all subject names
   * Endpoint: GET /api/subjectnames
   */
  getSubjectNames(): Observable<SubjectName[]> {
    return this.api.get<SubjectName[]>('subjectnames');
  }

  /**
   * Get subject names by category
   * Endpoint: GET /api/subjectnames/by-category/{categoryId}
   */
  getSubjectNamesByCategory(categoryId: number): Observable<SubjectName[]> {
    return this.api.get<SubjectName[]>(`subjectnames/by-category/${categoryId}`);
  }

  /**
   * Get subject name by ID
   * Endpoint: GET /api/subjectnames/{id}
   */
  getSubjectNameById(id: number): Observable<SubjectName> {
    return this.api.get<SubjectName>(`subjectnames/${id}`);
  }

  /**
   * Create new subject name
   * Endpoint: POST /api/subjectnames
   * Roles: Admin
   */
  createSubjectName(dto: CreateSubjectNameDto): Observable<SubjectName> {
    return this.api.post<SubjectName>('subjectnames', dto);
  }

  /**
   * Update subject name
   * Endpoint: PUT /api/subjectnames/{id}
   * Roles: Admin
   */
  updateSubjectName(id: number, dto: UpdateSubjectNameDto): Observable<SubjectName> {
    return this.api.put<SubjectName>(`subjectnames/${id}`, dto);
  }

  /**
   * Delete subject name
   * Endpoint: DELETE /api/subjectnames/{id}
   * Roles: Admin
   */
  deleteSubjectName(id: number): Observable<void> {
    return this.api.delete<void>(`subjectnames/${id}`);
  }
}
