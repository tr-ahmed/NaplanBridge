/**
 * Parent Student Service
 * Handles API calls for parent viewing/managing student information
 * Backend Endpoints: /api/Parent/student/{studentId}/*
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './base-api.service';
import {
  StudentDetailsResponse,
  StudentSubscriptionsResponse,
  UpdateStudentProfileRequest,
  UpdateProfileResponse,
  StudentProgressBySubjectResponse
} from '../../models/student-details.models';

@Injectable({
  providedIn: 'root'
})
export class ParentStudentService {
  private api = inject(ApiService);

  /**
   * Get detailed information about a student
   * Endpoint: GET /api/Parent/student/{studentId}/details
   * Role: Parent only
   * Returns: Complete student overview with progress, subscriptions, exams, activities
   */
  getStudentDetails(studentId: number): Observable<StudentDetailsResponse> {
    return this.api.get<StudentDetailsResponse>(`Parent/student/${studentId}/details`);
  }

  /**
   * Get student's subscriptions (active and optionally expired)
   * Endpoint: GET /api/Parent/student/{studentId}/subscriptions
   * Role: Parent only
   * @param includeExpired - Include expired subscriptions in response (default: false)
   */
  getStudentSubscriptions(
    studentId: number,
    includeExpired: boolean = false
  ): Observable<StudentSubscriptionsResponse> {
    const params = new HttpParams().set('includeExpired', includeExpired.toString());

    return this.api.get<StudentSubscriptionsResponse>(
      `Parent/student/${studentId}/subscriptions`,
      params
    );
  }

  /**
   * Update student's profile information
   * Endpoint: PUT /api/Parent/student/{studentId}/profile
   * Role: Parent only
   * Updates: userName, email, age, yearId (all optional)
   */
  updateStudentProfile(
    studentId: number,
    data: UpdateStudentProfileRequest
  ): Observable<UpdateProfileResponse> {
    return this.api.put<UpdateProfileResponse>(
      `Parent/student/${studentId}/profile`,
      data
    );
  }

  /**
   * Get student's progress for a specific subject
   * Endpoint: GET /api/Parent/student/{studentId}/progress/{subjectId}
   * Role: Parent only
   * Returns: Lessons, exams, and stats for the subject
   */
  getStudentProgressBySubject(
    studentId: number,
    subjectId: number
  ): Observable<StudentProgressBySubjectResponse> {
    return this.api.get<StudentProgressBySubjectResponse>(
      `Parent/student/${studentId}/progress/${subjectId}`
    );
  }
}
