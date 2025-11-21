import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Teacher Content Management Service
 * Handles all operations related to teacher content creation, editing, and approval tracking
 */

// ===== Enums =====
export enum ApprovalStatus {
  Created = 0,
  Pending = 1,
  Approved = 2,
  Published = 3,
  Rejected = 4,
  RevisionRequested = 5
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ===== Teacher Interfaces =====
export interface TeacherSubject {
  subjectId: number;
  subjectName: string;
  yearId: number;
  yearName: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  termsCount: number;
  lessonsCount: number;
  pendingCount: number;
}

export interface SubjectPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface ContentItem {
  id: number;
  itemId: number;
  itemType: 'Lesson' | 'Exam' | 'Question' | 'Resource' | 'Certificate';
  title: string;
  description?: string;
  status: 'CREATED' | 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'REVISION_REQUESTED' | 'PENDING_REVISION';
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  revisionFeedback?: string;
  subjectId?: number;
  weekId?: number;
  termId?: number;
  videoUrl?: string;
  duration?: number;
}

export interface PendingApprovalDto {
  id: number;
  itemType: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  teacherName: string;
  submittedAt?: Date;
  rejectionReason?: string;
  revisionFeedback?: string;
  teacherId: number;
}

export interface ContentFilterDto {
  status?: string;
  itemType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
  subjectId?: number;
}

export interface ApprovalHistoryDto {
  id: number;
  action: string;
  actionBy: string;
  actionDate: Date;
  remarks?: string;
  newStatus: string;
  previousStatus?: string;
}

export interface ContentPreviewDto {
  id: number;
  title: string;
  description: string;
  content: string;
  contentType: string;
  createdBy: string;
  createdAt: Date;
  previewUrl?: string;
  attachments?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TeacherContentManagementService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/TeacherContent`;
  private baseApiUrl = environment.apiBaseUrl;

  /**
   * Get teacher's authorized subjects
   */
  getMySubjects(): Observable<TeacherSubject[]> {
    const endpoint = `${this.apiUrl}/my-subjects`;
    console.log(`🔗 API Endpoint: ${endpoint}`);
    console.log('📡 Calling API to fetch teacher subjects...');
    
    return this.http.get<ApiResponse<TeacherSubject[]>>(endpoint)
      .pipe(
        map(response => {
          console.log('✅ API Response received:', response);
          console.log(`📦 Data payload: ${response.data.length} subjects`);
          return response.data;
        }),
        catchError(error => {
          console.error('❌ API Error - Failed to fetch authorized subjects:', error);
          console.error('🔍 Error details:', {
            status: error?.status,
            statusText: error?.statusText,
            message: error?.message,
            url: error?.url
          });
          return of([]);
        })
      );
  }

  /**
   * Check permissions for a specific subject
   */
  canManageSubject(subjectId: number): Observable<SubjectPermissions> {
    return this.http.get<ApiResponse<SubjectPermissions>>(`${this.apiUrl}/can-manage/${subjectId}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error checking permissions:', error);
          return of({ canCreate: false, canEdit: false, canDelete: false });
        })
      );
  }

  /**
   * Get teacher's content with filters
   * Only shows content created by the teacher or assigned to them
   */
  getMyContent(filters?: ContentFilterDto): Observable<ContentItem[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.subjectId) params = params.set('subjectId', filters.subjectId.toString());
      if (filters.status) params = params.set('status', filters.status);
      if (filters.itemType) params = params.set('itemType', filters.itemType);
      if (filters.searchTerm) params = params.set('searchTerm', filters.searchTerm);
      if (filters.pageNumber) params = params.set('pageNumber', filters.pageNumber.toString());
      if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
    }

    return this.http.get<ApiResponse<ContentItem[]>>(`${this.apiUrl}/my-content`, { params })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching teacher content:', error);
          return of([]);
        })
      );
  }

  /**
   * Get content details by ID and type
   */
  getContentDetail(itemType: string, itemId: number): Observable<ContentItem> {
    return this.http.get<ApiResponse<ContentItem>>(`${this.apiUrl}/content/${itemType}/${itemId}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching content detail:', error);
          throw error;
        })
      );
  }

  /**
   * Create new content
   * Content will start in CREATED status and needs to be submitted
   */
  createContent(contentData: any): Observable<ContentItem> {
    return this.http.post<ApiResponse<ContentItem>>(`${this.apiUrl}/create`, contentData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error creating content:', error);
          throw error;
        })
      );
  }

  /**
   * Create new lesson (shortcut)
   * Supports multipart/form-data with files
   */
  createLesson(lessonData: any): Observable<any> {
    console.log('📝 Creating lesson:', lessonData);
    
    // Create FormData for multipart/form-data
    const formData = new FormData();
    
    // Add required query parameters as form fields
    if (lessonData.title) {
      formData.append('Title', lessonData.title);
    }
    if (lessonData.description) {
      formData.append('Description', lessonData.description);
    }
    
    // Add optional query parameters
    if (lessonData.weekId) {
      formData.append('WeekId', lessonData.weekId.toString());
    }
    
    // Add file attachments
    if (lessonData.posterFile) {
      formData.append('PosterFile', lessonData.posterFile);
    }
    if (lessonData.videoFile) {
      formData.append('VideoFile', lessonData.videoFile);
    }
    
    return this.http.post<any>(`${this.baseApiUrl}/Lessons`, formData)
      .pipe(
        catchError(error => {
          console.error('❌ Error creating lesson:', error);
          throw error;
        })
      );
  }

  /**
   * Update existing content
   * Can only edit if status is PENDING or REVISION_REQUESTED
   */
  updateContent(itemType: string, itemId: number, contentData: any): Observable<ContentItem> {
    return this.http.put<ApiResponse<ContentItem>>(`${this.apiUrl}/update/${itemType}/${itemId}`, contentData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error updating content:', error);
          throw error;
        })
      );
  }

  /**
   * Update lesson (shortcut)
   * Supports multipart/form-data with optional files
   */
  updateLesson(lessonId: number, lessonData: any): Observable<any> {
    console.log('✏️ Updating lesson:', { lessonId, data: lessonData });
    
    // Create FormData for multipart/form-data
    const formData = new FormData();
    
    // Add optional query parameters as form fields
    if (lessonData.title) {
      formData.append('Title', lessonData.title);
    }
    if (lessonData.description) {
      formData.append('Description', lessonData.description);
    }
    if (lessonData.weekId) {
      formData.append('WeekId', lessonData.weekId.toString());
    }
    
    // Add optional file attachments
    if (lessonData.posterFile) {
      formData.append('PosterFile', lessonData.posterFile);
    }
    if (lessonData.videoFile) {
      formData.append('VideoFile', lessonData.videoFile);
    }
    
    return this.http.put<any>(`${this.baseApiUrl}/Lessons/${lessonId}`, formData)
      .pipe(
        catchError(error => {
          console.error('❌ Error updating lesson:', error);
          throw error;
        })
      );
  }

  /**
   * Submit content for approval
   * Moves content from CREATED to SUBMITTED/PENDING status
   */
  submitContent(itemType: string, itemId: number): Observable<ContentItem> {
    return this.http.post<ApiResponse<ContentItem>>(`${this.apiUrl}/submit/${itemType}/${itemId}`, {})
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error submitting content:', error);
          throw error;
        })
      );
  }

  /**
   * Delete content
   * Can only delete if status is PENDING or REVISION_REQUESTED
   */
  deleteContent(itemType: string, itemId: number): Observable<void> {
    const endpoint = `${this.baseApiUrl}/${itemType}s/${itemId}`;
    return this.http.delete<void>(endpoint)
      .pipe(
        catchError(error => {
          console.error('Error deleting content:', error);
          throw error;
        })
      );
  }

  /**
   * Delete lesson (shortcut)
   */
  deleteLesson(lessonId: number): Observable<void> {
    console.log('🗑️ Deleting lesson:', lessonId);
    return this.http.delete<void>(`${this.baseApiUrl}/Lessons/${lessonId}`)
      .pipe(
        catchError(error => {
          console.error('❌ Error deleting lesson:', error);
          throw error;
        })
      );
  }

  /**
   * Get approval history for a content item
   */
  getApprovalHistory(itemType: string, itemId: number): Observable<ApprovalHistoryDto[]> {
    return this.http.get<ApiResponse<ApprovalHistoryDto[]>>(`${this.apiUrl}/history/${itemType}/${itemId}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching approval history:', error);
          return of([]);
        })
      );
  }

  /**
   * Get content preview
   */
  getContentPreview(itemType: string, itemId: number): Observable<ContentPreviewDto> {
    return this.http.get<ApiResponse<ContentPreviewDto>>(`${this.apiUrl}/preview/${itemType}/${itemId}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching preview:', error);
          throw error;
        })
      );
  }

  /**
   * Get revision feedback from admin
   */
  getRevisionFeedback(itemType: string, itemId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/revision-feedback/${itemType}/${itemId}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching revision feedback:', error);
          return of(null);
        })
      );
  }

  /**
   * Resubmit content after revision
   */
  resubmitAfterRevision(itemType: string, itemId: number, contentData: any): Observable<ContentItem> {
    return this.http.post<ApiResponse<ContentItem>>(`${this.apiUrl}/resubmit/${itemType}/${itemId}`, contentData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error resubmitting content:', error);
          throw error;
        })
      );
  }

  /**
   * Get teacher notifications (pending approvals, rejections, etc.)
   */
  getNotifications(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/notifications`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching notifications:', error);
          return of([]);
        })
      );
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/notifications/${notificationId}/read`, {})
      .pipe(
        catchError(error => {
          console.error('Error marking notification as read:', error);
          return of();
        })
      );
  }

  /**
   * Create a new subject
   * ⚠️ Note: User must have Admin role or create_subject permission
   * Supports multipart/form-data with required PosterFile
   */
  createSubject(subjectData: any): Observable<any> {
    console.log('📝 Creating subject:', subjectData);
    
    // Create FormData for multipart/form-data
    const formData = new FormData();
    
    // Add required query parameters
    if (subjectData.yearId) {
      formData.append('YearId', subjectData.yearId.toString());
    }
    if (subjectData.subjectNameId) {
      formData.append('SubjectNameId', subjectData.subjectNameId.toString());
    }
    
    // Add optional query parameters
    if (subjectData.originalPrice !== undefined && subjectData.originalPrice !== null) {
      formData.append('OriginalPrice', subjectData.originalPrice.toString());
    }
    if (subjectData.discountPercentage !== undefined && subjectData.discountPercentage !== null) {
      formData.append('DiscountPercentage', subjectData.discountPercentage.toString());
    }
    if (subjectData.level) {
      formData.append('Level', subjectData.level);
    }
    if (subjectData.duration !== undefined && subjectData.duration !== null) {
      formData.append('Duration', subjectData.duration.toString());
    }
    if (subjectData.teacherId) {
      formData.append('TeacherId', subjectData.teacherId.toString());
    }
    if (subjectData.startDate) {
      formData.append('StartDate', subjectData.startDate);
    }
    
    // Add required file (PosterFile)
    if (subjectData.posterFile) {
      formData.append('PosterFile', subjectData.posterFile);
    }
    
    return this.http.post<ApiResponse<any>>(`${this.baseApiUrl}/Subjects`, formData)
      .pipe(
        map(response => {
          console.log('✅ Subject created successfully:', response.data);
          return response.data;
        }),
        catchError(error => {
          console.error('❌ Error creating subject:', {
            status: error.status,
            message: error.message,
            error: error.error
          });
          
          // Better error message based on status code
          let errorMessage = 'Failed to create subject';
          if (error.status === 403) {
            errorMessage = '🔒 Permission Denied: Only Admin users or teachers with special permission can create subjects. Please contact your administrator to grant you the "create_subject" permission.';
          } else if (error.status === 400) {
            errorMessage = '⚠️ Invalid subject data. Please check your inputs and ensure PosterFile is provided.';
          } else if (error.status === 401) {
            errorMessage = '🔐 Your session has expired. Please log in again.';
          } else if (error.status === 409) {
            errorMessage = '⚠️ A subject with this name already exists.';
          }
          
          throw new Error(errorMessage);
        })
      );
  }

  /**
   * Get all available subjects for assignment
   */
  getAllSubjects(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseApiUrl}/Subjects`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching all subjects:', error);
          return of([]);
        })
      );
  }

  /**
   * Assign subject to teacher
   */
  assignSubjectToTeacher(teacherId: number, subjectId: number): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.baseApiUrl}/TeacherPermissions/grant`, {
      teacherId,
      subjectId,
      canCreate: true,
      canEdit: true,
      canDelete: false
    })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error assigning subject:', error);
          throw error;
        })
      );
  }

  /**
   * Get subject by ID
   */
  getSubjectById(subjectId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.baseApiUrl}/Subjects/${subjectId}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching subject:', error);
          throw error;
        })
      );
  }

  /**
   * Update subject
   */
  updateSubject(subjectId: number, subjectData: any): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.baseApiUrl}/Subjects/${subjectId}`, subjectData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error updating subject:', error);
          throw error;
        })
      );
  }

  /**
   * Delete subject
   */
  deleteSubject(subjectId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/Subjects/${subjectId}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting subject:', error);
          throw error;
        })
      );
  }

  /**
   * Get pending counts by type (Admin only)
   */
  getPendingCounts(): Observable<{ [key: string]: number }> {
    return this.http.get<ApiResponse<{ [key: string]: number }>>(`${this.apiUrl}/pending-counts`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching pending counts:', error);
          return of({});
        })
      );
  }

  /**
   * Bulk approve multiple items (Admin only)
   */
  bulkApproveContent(bulkApprovalData: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/bulk-approve`, bulkApprovalData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error bulk approving content:', error);
          throw error;
        })
      );
  }

  /**
   * Get teacher dashboard statistics
   */
  getTeacherDashboard(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.baseApiUrl}/Dashboard/teacher`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching teacher dashboard:', error);
          return of(null);
        })
      );
  }

  /**
   * Get all teacher permissions (Admin only)
   */
  getAllPermissions(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseApiUrl}/TeacherPermissions/all`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching all permissions:', error);
          return of([]);
        })
      );
  }

  /**
   * Update teacher permission (Admin only)
   */
  updatePermission(permissionId: number, updateData: any): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.baseApiUrl}/TeacherPermissions/${permissionId}`, updateData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error updating permission:', error);
          throw error;
        })
      );
  }

  /**
   * Revoke teacher permission (Admin only)
   */
  revokePermission(permissionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/TeacherPermissions/${permissionId}/revoke`)
      .pipe(
        catchError(error => {
          console.error('Error revoking permission:', error);
          throw error;
        })
      );
  }

  /**
   * Check if teacher has specific permission
   */
  checkPermission(teacherId: number, subjectId: number, action: string): Observable<boolean> {
    let params = new HttpParams()
      .set('teacherId', teacherId)
      .set('subjectId', subjectId)
      .set('action', action);

    return this.http.get<ApiResponse<boolean>>(`${this.baseApiUrl}/TeacherPermissions/check`, { params })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error checking permission:', error);
          return of(false);
        })
      );
  }
}


