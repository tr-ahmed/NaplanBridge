import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Teacher Permission Management Service
 * Handles teacher assignment to subjects with permission management
 */

// ===== DTOs =====
export interface GrantPermissionDto {
  teacherId: number;
  subjectId: number;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  notes?: string;
}

export interface UpdatePermissionDto {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isActive?: boolean;
  notes?: string;
}

export interface TeacherPermissionDto {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherEmail?: string;
  subjectId: number;
  subjectName: string;
  yearId?: number;
  yearName: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isActive: boolean;
  grantedBy?: number;
  grantedByName?: string;
  grantedAt: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ===== Teacher & Subject DTOs for dropdowns =====
export interface TeacherDto {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export interface SubjectDto {
  id: number;
  name: string;
  yearId: number;
  yearName: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherPermissionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/teacherpermissions`;
  private usersUrl = `${environment.apiBaseUrl}/users`;
  private subjectsUrl = `${environment.apiBaseUrl}/content/subjects`;

  /**
   * Grant permission to a teacher for a subject
   */
  grantPermission(dto: GrantPermissionDto): Observable<ApiResponse<TeacherPermissionDto>> {
    console.log('📋 Granting permission:', dto);
    return this.http.post<ApiResponse<TeacherPermissionDto>>(`${this.apiUrl}/grant`, dto)
      .pipe(
        map(response => {
          console.log('✅ Permission granted:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error granting permission:', error);
          throw error;
        })
      );
  }

  /**
   * Get all permissions for a specific teacher
   */
  getTeacherPermissions(teacherId: number): Observable<ApiResponse<TeacherPermissionDto[]>> {
    console.log(`📚 Fetching permissions for teacher ${teacherId}`);
    return this.http.get<ApiResponse<TeacherPermissionDto[]>>(`${this.apiUrl}/teacher/${teacherId}`)
      .pipe(
        map(response => {
          console.log(`✅ Retrieved ${response.data.length} permissions`);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error fetching teacher permissions:', error);
          return of({ success: false, message: 'Error fetching permissions', data: [] });
        })
      );
  }

  /**
   * Get all permissions (Admin view)
   */
  getAllPermissions(): Observable<ApiResponse<TeacherPermissionDto[]>> {
    console.log('📚 Fetching all permissions');
    return this.http.get<ApiResponse<TeacherPermissionDto[]>>(`${this.apiUrl}/all`)
      .pipe(
        map(response => {
          console.log(`✅ Retrieved ${response.data.length} total permissions`);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error fetching all permissions:', error);
          return of({ success: false, message: 'Error fetching permissions', data: [] });
        })
      );
  }

  /**
   * Get permissions filtered by subject
   */
  getSubjectPermissions(subjectId: number): Observable<ApiResponse<TeacherPermissionDto[]>> {
    console.log(`📚 Fetching permissions for subject ${subjectId}`);
    return this.http.get<ApiResponse<TeacherPermissionDto[]>>(`${this.apiUrl}/subject/${subjectId}`)
      .pipe(
        map(response => {
          console.log(`✅ Retrieved ${response.data.length} permissions for subject`);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error fetching subject permissions:', error);
          return of({ success: false, message: 'Error fetching permissions', data: [] });
        })
      );
  }

  /**
   * Update existing permission
   */
  updatePermission(permissionId: number, dto: UpdatePermissionDto): Observable<ApiResponse<TeacherPermissionDto>> {
    console.log(`✏️ Updating permission ${permissionId}:`, dto);
    return this.http.put<ApiResponse<TeacherPermissionDto>>(`${this.apiUrl}/${permissionId}`, dto)
      .pipe(
        map(response => {
          console.log('✅ Permission updated:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error updating permission:', error);
          throw error;
        })
      );
  }

  /**
   * Revoke permission (soft delete - set isActive to false)
   */
  revokePermission(permissionId: number): Observable<ApiResponse<void>> {
    console.log(`🚫 Revoking permission ${permissionId}`);
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${permissionId}/revoke`)
      .pipe(
        map(response => {
          console.log('✅ Permission revoked:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error revoking permission:', error);
          throw error;
        })
      );
  }

  /**
   * Check if teacher has permission for action
   */
  checkPermission(
    teacherId: number,
    subjectId: number,
    action: 'create' | 'edit' | 'delete'
  ): Observable<ApiResponse<boolean>> {
    let params = new HttpParams()
      .set('teacherId', teacherId.toString())
      .set('subjectId', subjectId.toString())
      .set('action', action);

    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/check`, { params })
      .pipe(
        map(response => {
          console.log(`✅ Permission check for ${action}:`, response.data);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error checking permission:', error);
          return of({ success: false, message: 'Error checking permission', data: false });
        })
      );
  }

  /**
   * Get list of available teachers
   */
  getTeachers(): Observable<TeacherDto[]> {
    console.log('👨‍🏫 Fetching teachers list');
    // Get all users and filter by Teacher role
    return this.http.get<ApiResponse<any[]>>(`${this.usersUrl}`)
      .pipe(
        map(response => {
          // Filter users with Teacher role
          const teachers = (response.data || [])
            .filter((user: any) => user.roles?.includes('Teacher'))
            .map((user: any) => ({
              id: user.id,
              name: user.userName || user.name || 'Unknown',
              email: user.email || '',
              roles: user.roles || []
            }));
          console.log(`✅ Retrieved ${teachers.length} teachers`);
          return teachers;
        }),
        catchError(error => {
          console.error('❌ Error fetching teachers:', error);
          return of([]);
        })
      );
  }

  /**
   * Get list of available subjects
   */
  getSubjects(): Observable<SubjectDto[]> {
    console.log('📚 Fetching subjects list');
    return this.http.get<ApiResponse<SubjectDto[]>>(`${this.subjectsUrl}`)
      .pipe(
        map(response => {
          const subjects = response.data || [];
          console.log(`✅ Retrieved ${subjects.length} subjects`);
          return subjects;
        }),
        catchError(error => {
          console.error('❌ Error fetching subjects:', error);
          return of([]);
        })
      );
  }

  /**
   * Get unassigned teachers for a subject
   */
  getUnassignedTeachersForSubject(subjectId: number): Observable<TeacherDto[]> {
    console.log(`👨‍🏫 Fetching unassigned teachers for subject ${subjectId}`);
    return this.http.get<ApiResponse<TeacherDto[]>>(`${this.apiUrl}/subject/${subjectId}/unassigned`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('❌ Error fetching unassigned teachers:', error);
          return of([]);
        })
      );
  }

  /**
   * Bulk grant permissions
   */
  bulkGrantPermissions(dtos: GrantPermissionDto[]): Observable<ApiResponse<TeacherPermissionDto[]>> {
    console.log('📋 Bulk granting permissions:', dtos);
    return this.http.post<ApiResponse<TeacherPermissionDto[]>>(`${this.apiUrl}/bulk-grant`, dtos)
      .pipe(
        map(response => {
          console.log('✅ Bulk permissions granted:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error bulk granting permissions:', error);
          throw error;
        })
      );
  }

  /**
   * Export permissions to CSV
   */
  exportPermissions(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, { responseType: 'blob' });
  }
}
