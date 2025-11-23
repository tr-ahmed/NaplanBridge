/**
 * User Service
 * Handles user-related API calls
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './base-api.service';
import { ActiveSubscription, ActiveSubscriptionsResponse } from '../../models/payment.models';

export interface ChildDto {
  id: number;
  userName: string;
  email: string;
  age: number;
  year: number;
}

export interface User {
  id: number;
  userName: string;
  email?: string;
  age?: number;
  phoneNumber?: string;
  year?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private api = inject(ApiService);

  /**
   * Get parent's children
   * Endpoint: GET /api/User/get-children/{id}
   */
  getChildren(parentId: number): Observable<ChildDto[]> {
    return this.api.get<ChildDto[]>(`User/get-children/${parentId}`);
  }

  /**
   * Get all users
   * Endpoint: GET /api/User
   */
  getUsers(): Observable<User[]> {
    return this.api.get<User[]>('User');
  }

  /**
   * Get user by ID
   * Endpoint: GET /api/User/{id}
   */
  getUserById(userId: number): Observable<User> {
    return this.api.get<User>(`User/${userId}`);
  }

  /**
   * Get my students (for teachers/parents)
   * Endpoint: GET /api/User/my-students
   */
  getMyStudents(): Observable<ChildDto[]> {
    return this.api.get<ChildDto[]>('User/my-students');
  }

  /**
   * Delete student
   * Endpoint: DELETE /api/User/delete-student/{id}
   */
  deleteStudent(studentId: number): Observable<void> {
    return this.api.delete<void>(`User/delete-student/${studentId}`);
  }

  /**
   * Get student's active subscriptions
   * Endpoint: GET /api/subscriptions/student/{studentId}/active
   * Note: Backend needs to create this endpoint
   */
  getStudentActiveSubscriptions(studentId: number): Observable<ActiveSubscriptionsResponse> {
    return this.api.get<ActiveSubscriptionsResponse>(`subscriptions/student/${studentId}/active`);
  }
}
