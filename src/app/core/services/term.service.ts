/**
 * Term Service
 * Handles Term, Week, and Term Instructor operations
 * Based on Backend API Documentation - TERM_LEVEL_DATA_GUIDE.md
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './base-api.service';
import {
  Term,
  TermDetails,
  Week,
  CreateTermDto,
  UpdateTermDto,
  CreateWeekDto,
  UpdateWeekDto,
  TermInstructor,
  CreateTermInstructorDto,
  UpdateTermInstructorDto,
  TeacherTermInfo
} from '../../models/term.models';

@Injectable({
  providedIn: 'root'
})
export class TermService {
  private api = inject(ApiService);

  // ============================================
  // Term Methods
  // ============================================

  /**
   * Get all terms
   * Endpoint: GET /api/terms
   */
  getTerms(): Observable<Term[]> {
    return this.api.get<Term[]>('terms');
  }

  /**
   * Get term by ID with full details (including instructors)
   * Endpoint: GET /api/terms/{id}
   */
  getTermById(id: number): Observable<TermDetails> {
    return this.api.get<TermDetails>(`terms/${id}`);
  }

  /**
   * Get terms by subject
   * Endpoint: GET /api/terms/by-subject/{subjectId}
   */
  getTermsBySubject(subjectId: number): Observable<Term[]> {
    return this.api.get<Term[]>(`terms/by-subject/${subjectId}`);
  }

  /**
   * Create new term
   * Endpoint: POST /api/terms
   * Roles: Admin
   */
  createTerm(dto: CreateTermDto): Observable<Term> {
    return this.api.post<Term>('terms', dto);
  }

  /**
   * Update term
   * Endpoint: PUT /api/terms/{id}
   * Roles: Admin
   */
  updateTerm(id: number, dto: UpdateTermDto): Observable<Term> {
    return this.api.put<Term>(`terms/${id}`, dto);
  }

  /**
   * Delete term
   * Endpoint: DELETE /api/terms/{id}
   * Roles: Admin
   */
  deleteTerm(id: number): Observable<void> {
    return this.api.delete<void>(`terms/${id}`);
  }

  // ============================================
  // Term Instructor Methods (NEW - from TERM_LEVEL_DATA_GUIDE.md)
  // ============================================

  /**
   * Get instructors for a term
   * Endpoint: GET /api/terms/{termId}/instructors
   */
  getTermInstructors(termId: number): Observable<TermInstructor[]> {
    return this.api.get<TermInstructor[]>(`terms/${termId}/instructors`);
  }

  /**
   * Get terms assigned to a teacher
   * Endpoint: GET /api/teachers/{teacherId}/terms
   * Roles: Teacher, Admin
   */
  getTeacherTerms(teacherId: number): Observable<TeacherTermInfo[]> {
    return this.api.get<TeacherTermInfo[]>(`teachers/${teacherId}/terms`);
  }

  /**
   * Assign instructor to term
   * Endpoint: POST /api/terms/{termId}/instructors
   * Roles: Admin
   */
  assignInstructor(termId: number, dto: CreateTermInstructorDto): Observable<void> {
    return this.api.post<void>(`terms/${termId}/instructors`, dto);
  }

  /**
   * Remove instructor from term
   * Endpoint: DELETE /api/terms/{termId}/instructors/{instructorId}
   * Roles: Admin
   */
  removeInstructor(termId: number, instructorId: number): Observable<void> {
    return this.api.delete<void>(`terms/${termId}/instructors/${instructorId}`);
  }

  /**
   * Update instructor role (Primary/Assistant)
   * Endpoint: PUT /api/terms/{termId}/instructors/{instructorId}
   * Roles: Admin
   */
  updateInstructorRole(termId: number, instructorId: number, dto: UpdateTermInstructorDto): Observable<void> {
    return this.api.put<void>(`terms/${termId}/instructors/${instructorId}`, dto);
  }

  // ============================================
  // Week Methods
  // ============================================

  /**
   * Get all weeks
   * Endpoint: GET /api/weeks
   */
  getWeeks(): Observable<Week[]> {
    return this.api.get<Week[]>('weeks');
  }

  /**
   * Get week by ID
   * Endpoint: GET /api/weeks/{id}
   */
  getWeekById(id: number): Observable<Week> {
    return this.api.get<Week>(`weeks/${id}`);
  }

  /**
   * Get weeks by term
   * Endpoint: GET /api/weeks/by-term/{termId}
   */
  getWeeksByTerm(termId: number): Observable<Week[]> {
    return this.api.get<Week[]>(`weeks/by-term/${termId}`);
  }

  /**
   * Create new week
   * Endpoint: POST /api/weeks
   * Roles: Admin
   */
  createWeek(dto: CreateWeekDto): Observable<Week> {
    return this.api.post<Week>('weeks', dto);
  }

  /**
   * Update week
   * Endpoint: PUT /api/weeks/{id}
   * Roles: Admin
   */
  updateWeek(id: number, dto: UpdateWeekDto): Observable<Week> {
    return this.api.put<Week>(`weeks/${id}`, dto);
  }

  /**
   * Delete week
   * Endpoint: DELETE /api/weeks/{id}
   * Roles: Admin
   */
  deleteWeek(id: number): Observable<void> {
    return this.api.delete<void>(`weeks/${id}`);
  }
}
