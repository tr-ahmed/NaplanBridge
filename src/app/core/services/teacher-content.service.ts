import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Interfaces
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
  title?: string;
  name?: string;
  description?: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  createdBy?: number;
  createdByName?: string;
  createdAt?: Date;
  approvedBy?: number;
  approvedByName?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  weekId?: number;
  termId?: number;
  order?: number;
  videoUrl?: string;
  duration?: number;
  objectives?: string[];
}

export interface SubjectContent {
  subject: {
    id: number;
    name: string;
    yearName: string;
  };
  terms: ContentItem[];
  weeks: ContentItem[];
  lessons: ContentItem[];
  resources: ContentItem[];
  statistics: {
    totalLessons: number;
    approvedLessons: number;
    pendingLessons: number;
    rejectedLessons: number;
  };
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
}

export interface CreateLessonDto {
  title: string;
  description: string;
  weekId: number | null;
  order: number;
  videoUrl: string;
  duration: number;
  objectives: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TeacherContentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/TeacherContent`;

  /**
   * Get teacher's authorized subject IDs
   */
  getMySubjects(): Observable<number[]> {
    return this.http.get<ApiResponse<number[]>>(`${this.apiUrl}/my-subjects`)
      .pipe(map(response => response.data));
  }

  /**
   * Check if teacher can manage a subject
   */
  canManageSubject(subjectId: number): Observable<SubjectPermissions> {
    return this.http.get<ApiResponse<SubjectPermissions>>(`${this.apiUrl}/can-manage/${subjectId}`)
      .pipe(map(response => response.data));
  }

  /**
   * Get teacher's content with filters
   */
  getMyContent(filters?: { subjectId?: number; status?: string }): Observable<ContentItem[]> {
    let params = new HttpParams();
    if (filters?.subjectId) {
      params = params.set('subjectId', filters.subjectId.toString());
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<ApiResponse<ContentItem[]>>(`${this.apiUrl}/my-content`, { params })
      .pipe(map(response => response.data));
  }

  /**
   * Get content for a specific subject (legacy - for compatibility)
   */
  getSubjectContent(subjectId: number, includeStatus: string = 'all'): Observable<SubjectContent> {
    const params = new HttpParams().set('includeStatus', includeStatus);
    return this.http.get<SubjectContent>(`${this.apiUrl}/subject/${subjectId}`, { params });
  }

  /**
   * Create a new lesson
   */
  createLesson(lessonData: CreateLessonDto): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/Lessons`, lessonData);
  }

  /**
   * Update an existing lesson
   */
  updateLesson(lessonId: number, lessonData: CreateLessonDto): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/Lessons/${lessonId}`, lessonData);
  }

  /**
   * Delete content item
   */
  deleteContent(itemType: string, itemId: number): Observable<any> {
    const endpoint = `${environment.apiBaseUrl}/${itemType}s/${itemId}`;
    return this.http.delete(endpoint);
  }

  /**
   * Get teacher's notifications (placeholder - implement when backend ready)
   */
  getNotifications(): Observable<any[]> {
    // TODO: Implement when backend notification system is ready
    return this.http.get<any[]>(`${this.apiUrl}/notifications`);
  }

  /**
   * Mark notification as read (placeholder - implement when backend ready)
   */
  markNotificationRead(notificationId: number): Observable<any> {
    // TODO: Implement when backend notification system is ready
    return this.http.put(`${this.apiUrl}/notifications/${notificationId}/read`, {});
  }
}
