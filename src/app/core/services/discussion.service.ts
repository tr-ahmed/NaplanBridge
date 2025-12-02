import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ============================================
// TypeScript Interfaces
// ============================================

/**
 * Discussion DTO
 */
export interface DiscussionDto {
  id: number;
  lessonId: number;
  lessonTitle: string;
  studentId: number;
  studentName: string;
  studentAvatar: string;
  question: string;
  videoTimestamp?: number;
  createdAt: string;
  isAnswered: boolean;
  isHelpful: boolean;
  helpfulCount: number;
  repliesCount: number;
  replies: DiscussionReplyDto[];
}

/**
 * Discussion Reply DTO
 */
export interface DiscussionReplyDto {
  id: number;
  discussionId: number;
  userId: number;
  userName: string;
  userRole: string;
  userAvatar: string;
  reply: string;
  createdAt: string;
  isTeacherReply: boolean;
}

/**
 * Create Discussion DTO
 */
export interface CreateDiscussionDto {
  question: string;
  videoTimestamp?: number;
}

/**
 * Create Reply DTO
 */
export interface CreateReplyDto {
  reply: string;
}

/**
 * Discussion Filter Parameters
 */
export interface DiscussionFilterParams {
  page?: number;
  pageSize?: number;
  isAnswered?: boolean;
  isHelpful?: boolean;
  sortBy?: 'CreatedAt' | 'RepliesCount' | 'HelpfulCount';
  sortOrder?: 'Asc' | 'Desc';
}

/**
 * Paginated Discussion Response
 */
export interface PagedDiscussionDto {
  items: DiscussionDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * Discussion Service
 * Handles all discussion-related API calls
 */
@Injectable({
  providedIn: 'root'
})
export class DiscussionService {
  private apiUrl = `${environment.apiBaseUrl}/Discussions`;

  constructor(private http: HttpClient) {}

  // ============================================
  // Create Discussion (Student Only)
  // ============================================

  /**
   * Create a new discussion/question on a specific lesson
   * @param lessonId - The ID of the lesson
   * @param data - The discussion data (question and optional video timestamp)
   * @returns Observable<DiscussionDto>
   */
  createDiscussion(lessonId: number, data: CreateDiscussionDto): Observable<DiscussionDto> {
    return this.http.post<DiscussionDto>(
      `${this.apiUrl}/lessons/${lessonId}`,
      data
    );
  }

  // ============================================
  // Get Discussion by ID
  // ============================================

  /**
   * Get details of a specific discussion including all replies
   * @param discussionId - The ID of the discussion
   * @returns Observable<DiscussionDto>
   */
  getDiscussion(discussionId: number): Observable<DiscussionDto> {
    return this.http.get<DiscussionDto>(
      `${this.apiUrl}/${discussionId}`
    );
  }

  // ============================================
  // Get Lesson Discussions (Paginated)
  // ============================================

  /**
   * Get all discussions for a specific lesson with pagination and filtering
   * @param lessonId - The ID of the lesson
   * @param params - Filter and pagination parameters
   * @returns Observable<PagedDiscussionDto>
   */
  getLessonDiscussions(
    lessonId: number,
    params: DiscussionFilterParams = {}
  ): Observable<PagedDiscussionDto> {
    let httpParams = this.buildHttpParams(params);

    return this.http.get<PagedDiscussionDto>(
      `${this.apiUrl}/lessons/${lessonId}`,
      { params: httpParams }
    );
  }

  /**
   * Get all discussions for a specific lesson (without pagination)
   * @param lessonId - The ID of the lesson
   * @returns Observable<DiscussionDto[]>
   */
  getDiscussionsForLesson(lessonId: number): Observable<DiscussionDto[]> {
    // Use paginated endpoint with large page size to get all discussions
    const params = { page: 1, pageSize: 1000 };
    const httpParams = this.buildHttpParams(params);

    return this.http.get<PagedDiscussionDto>(
      `${this.apiUrl}/lessons/${lessonId}`,
      { params: httpParams }
    ).pipe(
      map(response => response.items)
    );
  }

  // ============================================
  // Get Teacher Pending Discussions
  // ============================================

  /**
   * Get all unanswered discussions for subjects taught by the current teacher
   * @returns Observable<DiscussionDto[]>
   */
  getTeacherPendingDiscussions(): Observable<DiscussionDto[]> {
    return this.http.get<DiscussionDto[]>(
      `${this.apiUrl}/teacher/pending`
    );
  }

  // ============================================
  // Get Student's Own Discussions
  // ============================================

  /**
   * Get all discussions created by the current student
   * @param params - Filter and pagination parameters
   * @returns Observable<PagedDiscussionDto>
   */
  getMyDiscussions(params: DiscussionFilterParams = {}): Observable<PagedDiscussionDto> {
    let httpParams = this.buildHttpParams(params);

    return this.http.get<PagedDiscussionDto>(
      `${this.apiUrl}/student/my-discussions`,
      { params: httpParams }
    );
  }

  // ============================================
  // Get Discussions by Subject (Admin/Teacher)
  // ============================================

  /**
   * Get all discussions in a specific subject (for admins and teachers)
   * @param subjectId - The ID of the subject
   * @param params - Filter and pagination parameters
   * @returns Observable<PagedDiscussionDto>
   */
  getDiscussionsBySubject(
    subjectId: number,
    params: DiscussionFilterParams = {}
  ): Observable<PagedDiscussionDto> {
    let httpParams = this.buildHttpParams(params);

    return this.http.get<PagedDiscussionDto>(
      `${this.apiUrl}/subject/${subjectId}`,
      { params: httpParams }
    );
  }

  // ============================================
  // Add Reply to Discussion
  // ============================================

  /**
   * Add a reply to a discussion
   * If a teacher replies, the discussion is automatically marked as answered
   * @param discussionId - The ID of the discussion
   * @param data - The reply data
   * @returns Observable<DiscussionReplyDto>
   */
  addReply(discussionId: number, data: CreateReplyDto): Observable<DiscussionReplyDto> {
    return this.http.post<DiscussionReplyDto>(
      `${this.apiUrl}/${discussionId}/replies`,
      data
    );
  }

  // ============================================
  // Mark Discussion as Helpful
  // ============================================

  /**
   * Mark a discussion as helpful (increases helpful count)
   * @param discussionId - The ID of the discussion
   * @returns Observable<any>
   */
  markAsHelpful(discussionId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${discussionId}/mark-helpful`,
      {}
    );
  }

  // ============================================
  // Unmark Discussion as Helpful
  // ============================================

  /**
   * Remove helpful mark from a discussion (decreases helpful count)
   * @param discussionId - The ID of the discussion
   * @returns Observable<any>
   */
  unmarkAsHelpful(discussionId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${discussionId}/unmark-helpful`,
      {}
    );
  }

  // ============================================
  // Delete Discussion (Admin Only)
  // ============================================

  /**
   * Delete a discussion (Admin only)
   * @param discussionId - The ID of the discussion
   * @returns Observable<any>
   */
  deleteDiscussion(discussionId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${discussionId}`
    );
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Build HttpParams from DiscussionFilterParams
   * @param params - Filter parameters
   * @returns HttpParams
   */
  private buildHttpParams(params: DiscussionFilterParams): HttpParams {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.pageSize !== undefined) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params.isAnswered !== undefined) {
      httpParams = httpParams.set('isAnswered', params.isAnswered.toString());
    }
    if (params.isHelpful !== undefined) {
      httpParams = httpParams.set('isHelpful', params.isHelpful.toString());
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return httpParams;
  }

  /**
   * Format video timestamp (seconds) to MM:SS
   * @param seconds - Video timestamp in seconds
   * @returns Formatted time string
   */
  formatVideoTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
