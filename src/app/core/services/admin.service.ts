/**
 * Admin Service
 * Admin-only operations for managing users
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  /**
   * Activate a user account (Admin only)
   * PUT /api/Admin/activate-user/{userId}
   */
  activateUser(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/Admin/activate-user/${userId}`, {});
  }

  /**
   * Deactivate a user account (Admin only)
   * PUT /api/Admin/deactivate-user/{userId}
   */
  deactivateUser(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/Admin/deactivate-user/${userId}`, {});
  }
}
