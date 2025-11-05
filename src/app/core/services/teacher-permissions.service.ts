import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface TeacherPermission {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  subjectId: number;
  subjectName: string;
  yearId: number;
  yearName: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isActive: boolean;
  grantedBy: number;
  grantedByName: string;
  grantedAt: Date;
  notes?: string;
}

export interface PendingApproval {
  id: number;
  type: string;
  title: string;
  subjectName: string;
  weekNumber?: number;
  termNumber?: number;
  createdBy: string;
  createdByEmail: string;
  createdAt: Date;
  pendingDays: number;
  status: string;
}

export interface GrantPermissionDto {
  teacherId: number | null;
  subjectId: number | null;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  notes?: string;
}

export interface UpdatePermissionDto {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isActive: boolean;
  notes?: string;
}

export interface ApprovalActionDto {
  itemType: string;
  itemId: number;
  action: string;
  rejectionReason?: string;
}

export interface PendingCounts {
  Lesson: number;
  Week: number;
  Term: number;
  Resource: number;
  Total: number;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherPermissionsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/TeacherPermissions`;
  private contentApiUrl = `${environment.apiBaseUrl}/TeacherContent`;

  /**
   * Grant permission to teacher
   */
  grantPermission(dto: GrantPermissionDto): Observable<TeacherPermission> {
    return this.http.post<ApiResponse<TeacherPermission>>(`${this.apiUrl}/grant`, dto)
      .pipe(map(response => response.data));
  }

  /**
   * Get all teachers with their permissions
   */
  getAllTeachersWithPermissions(): Observable<TeacherPermission[]> {
    return this.http.get<ApiResponse<TeacherPermission[]>>(`${this.apiUrl}/all`)
      .pipe(map(response => response.data));
  }

  /**
   * Get teacher's permissions
   */
  getTeacherPermissions(teacherId: number): Observable<TeacherPermission[]> {
    return this.http.get<ApiResponse<TeacherPermission[]>>(`${this.apiUrl}/teacher/${teacherId}`)
      .pipe(map(response => response.data));
  }

  /**
   * Update permission
   */
  updatePermission(permissionId: number, dto: UpdatePermissionDto): Observable<TeacherPermission> {
    return this.http.put<ApiResponse<TeacherPermission>>(`${this.apiUrl}/${permissionId}`, dto)
      .pipe(map(response => response.data));
  }

  /**
   * Revoke permission
   */
  revokePermission(permissionId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${permissionId}/revoke`)
      .pipe(map(() => undefined));
  }

  /**
   * Check if teacher has permission
   */
  checkPermission(teacherId: number, subjectId: number, action: string): Observable<boolean> {
    return this.http.get<ApiResponse<boolean>>(
      `${this.apiUrl}/check?teacherId=${teacherId}&subjectId=${subjectId}&action=${action}`
    ).pipe(map(response => response.data));
  }

  /**
   * Get available teachers (those with Teacher role)
   */
  getAvailableTeachers(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/User/get-teachers`);
  }

  /**
   * Get available subjects
   */
  getAvailableSubjects(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/Subjects`);
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(itemType?: string): Observable<PendingApproval[]> {
    const url = itemType
      ? `${this.contentApiUrl}/pending-approvals?type=${itemType}`
      : `${this.contentApiUrl}/pending-approvals`;
    return this.http.get<ApiResponse<PendingApproval[]>>(url)
      .pipe(map(response => response.data));
  }

  /**
   * Get pending counts
   */
  getPendingCounts(): Observable<PendingCounts> {
    return this.http.get<ApiResponse<PendingCounts>>(`${this.contentApiUrl}/pending-counts`)
      .pipe(map(response => response.data));
  }

  /**
   * Approve or reject content
   */
  approveContent(dto: ApprovalActionDto): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.contentApiUrl}/approve`, dto)
      .pipe(map(() => undefined));
  }
}
