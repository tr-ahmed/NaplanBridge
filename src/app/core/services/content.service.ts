import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UploadService } from './upload.service';

export interface Year {
  id: number;
  yearNumber: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  color?: string;
}

export interface SubjectName {
  id: number;
  name: string;
  categoryId: number;
  categoryName?: string;
}

export interface Subject {
  id: number;
  yearId: number;
  subjectNameId: number;
  subjectName: string;
  categoryId: number;
  categoryName: string;
  categoryDescription: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  posterUrl: string;
  level: string;
  duration: number;
  weekNumber: number;
  termNumber: number;
  studentCount: number;
  termIds: number[];
  weekIds: number[];
  teacherId?: number;
  startDate?: string;
}

export interface Term {
  id: number;
  termNumber: number;
  startDate: string;
  subjectId: number;
}

export interface Week {
  id: number;
  weekNumber: number;
  termId: number;
}

export interface Lesson {
  id?: number;
  title: string;
  posterUrl?: string;
  videoUrl?: string;
  description: string;
  weekId: number;
  subjectId: number;
  duration?: number;
  orderIndex?: number;
  isPublished?: boolean;
  createdAt?: string;
  status?: 'CREATED' | 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'REVISION_REQUESTED';
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface LessonDetailsDto {
  id: number;
  title: string;
  description: string;
  videoUrl?: string;
  posterUrl?: string;
  duration: number;
  orderIndex: number;
  isPublished: boolean;
  weekId: number;
  weekNumber: number;
  subjectId: number;
  subjectName: string;
  resourceCount: number;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Resource {
  id: number;
  title: string;
  fileUrl: string;
  lessonId: number;
  createdAt?: string;
  fileSize?: number;
  fileType?: string;
}

export interface Teacher {
  userName: string;
  email: string;
  id?: number;        // Make optional
  name?: string;      // Make optional
  roles?: string[];   // Make optional
}


export interface User {
  id: number;
  userName: string;
  email?: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private apiUrl = environment.apiBaseUrl;

  private http = inject(HttpClient);
  private uploadService = inject(UploadService);

  // ===== Years =====
  getYears(): Observable<Year[]> {
    return this.http.get<Year[]>(`${this.apiUrl}/Years`);
  }

  getYear(id: number): Observable<Year> {
    return this.http.get<Year>(`${this.apiUrl}/Years/${id}`);
  }

  addYear(year: { yearNumber: number }): Observable<Year> {
    return this.http.post<Year>(`${this.apiUrl}/Years`, year);
  }

  updateYear(id: number, year: { yearNumber: number }): Observable<Year> {
    return this.http.put<Year>(`${this.apiUrl}/Years/${id}`, year);
  }

  deleteYear(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Years/${id}`);
  }

  // ===== Categories =====
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/Categories`);
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/Categories/${id}`);
  }

  addCategory(category: { name: string; description: string; color?: string }): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/Categories`, category);
  }

  updateCategory(id: number, category: { name: string; description: string; color?: string }): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/Categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Categories/${id}`);
  }

  // ===== Subject Names =====
  getSubjectNames(): Observable<SubjectName[]> {
    return this.http.get<SubjectName[]>(`${this.apiUrl}/SubjectNames`);
  }

  getSubjectName(id: number): Observable<SubjectName> {
    return this.http.get<SubjectName>(`${this.apiUrl}/SubjectNames/${id}`);
  }

  addSubjectName(subjectName: { name: string; categoryId: number }): Observable<SubjectName> {
    return this.http.post<SubjectName>(`${this.apiUrl}/SubjectNames`, subjectName);
  }

  updateSubjectName(id: number, subjectName: { name: string; categoryId: number }): Observable<SubjectName> {
    return this.http.put<SubjectName>(`${this.apiUrl}/SubjectNames/${id}`, subjectName);
  }

  deleteSubjectName(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/SubjectNames/${id}`);
  }

  // ===== Subjects =====
  getSubjects(page: number = 1, pageSize: number = 1000): Observable<any> {
    const params = new HttpParams()
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());
    return this.http.get<any>(`${this.apiUrl}/Subjects`, { params });
  }

  getSubject(id: number): Observable<Subject> {
    return this.http.get<Subject>(`${this.apiUrl}/Subjects/${id}`);
  }

  addSubject(
    yearId: number,
    subjectNameId: number,
    originalPrice: number,
    discountPercentage: number,
    level: string,
    duration: number,
    teacherId: number,
    startDate: string,
    posterFile: File
  ): Observable<Subject> {
    const formData = new FormData();
    formData.append('PosterFile', posterFile);

    const params = new HttpParams()
      .set('YearId', yearId.toString())
      .set('SubjectNameId', subjectNameId.toString())
      .set('OriginalPrice', originalPrice.toString())
      .set('DiscountPercentage', discountPercentage.toString())
      .set('Level', level)
      .set('Duration', duration.toString())
      .set('TeacherId', teacherId.toString())
      .set('StartDate', startDate);

    // Use upload service with progress tracking
    const url = `${this.apiUrl}/Subjects?${params.toString()}`;
    return this.uploadService.uploadWithProgress<Subject>(url, formData, 'subject_upload').pipe(
      filter(event => event.response !== undefined),
      map(event => event.response!)
    );
  }

  /**
   * Get subject upload progress
   */
  getSubjectUploadProgress() {
    return this.uploadService.getProgress('subject_upload');
  }

  updateSubject(
    id: number,
    originalPrice: number,
    discountPercentage: number,
    level: string,
    duration: number,
    teacherId: number,
    posterFile?: File
  ): Observable<Subject> {
    const formData = new FormData();

    // Always append PosterFile, even if empty (some backends require it)
    if (posterFile) {
      formData.append('PosterFile', posterFile);
    } else {
      // Append empty blob to satisfy multipart/form-data requirement
      formData.append('PosterFile', new Blob(), '');
    }

    const params = new HttpParams()
      .set('OriginalPrice', originalPrice.toString())
      .set('DiscountPercentage', discountPercentage.toString())
      .set('Level', level)
      .set('Duration', duration.toString())
      .set('TeacherId', teacherId.toString());

    return this.http.put<Subject>(`${this.apiUrl}/Subjects/${id}`, formData, { params });
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Subjects/${id}`);
  }

  getSubjectsByCategory(categoryId: number): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/Subjects/by-category/${categoryId}`);
  }

  getSubjectsByYear(yearId: number): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/Subjects/by-year/${yearId}`);
  }

  getSubjectsByTerm(termId: number): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/Subjects/by-term/${termId}`);
  }

  getSubjectsByWeek(weekId: number): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/Subjects/by-week/${weekId}`);
  }

  // ===== Terms =====
  getTerms(): Observable<Term[]> {
    return this.http.get<Term[]>(`${this.apiUrl}/Terms`);
  }

  getTerm(id: number): Observable<Term> {
    return this.http.get<Term>(`${this.apiUrl}/Terms/${id}`);
  }

  addTerm(term: { subjectId: number; termNumber: number; startDate: string }): Observable<Term> {
    return this.http.post<Term>(`${this.apiUrl}/Terms`, term);
  }

  updateTerm(id: number, term: { subjectId: number; termNumber: number; startDate: string }): Observable<Term> {
    return this.http.put<Term>(`${this.apiUrl}/Terms/${id}`, term);
  }

  deleteTerm(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Terms/${id}`);
  }

  getTermsBySubject(subjectId: number): Observable<Term[]> {
    return this.http.get<Term[]>(`${this.apiUrl}/Terms/by-subject/${subjectId}`);
  }

  // ===== Weeks =====
  getWeeks(): Observable<Week[]> {
    return this.http.get<Week[]>(`${this.apiUrl}/Weeks`);
  }

  getWeek(id: number): Observable<Week> {
    return this.http.get<Week>(`${this.apiUrl}/Weeks/${id}`);
  }

  addWeek(week: { termId: number; weekNumber: number }): Observable<Week> {
    return this.http.post<Week>(`${this.apiUrl}/Weeks`, week);
  }

  updateWeek(id: number, week: { termId: number; weekNumber: number }): Observable<Week> {
    return this.http.put<Week>(`${this.apiUrl}/Weeks/${id}`, week);
  }

  deleteWeek(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Weeks/${id}`);
  }

  getWeeksByTerm(termId: number): Observable<Week[]> {
    return this.http.get<Week[]>(`${this.apiUrl}/Weeks/by-term/${termId}`);
  }

  // ===== Lessons =====
  getLessons(
    pageNumber?: number,
    pageSize?: number,
    filters?: {
      searchTerm?: string;
      weekId?: number;
      subjectId?: number;
      termId?: number;
    }
  ): Observable<Lesson[] | PaginatedResult<LessonDetailsDto>> {
    let params = new HttpParams();

    if (pageNumber) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize) params = params.set('pageSize', pageSize.toString());
    if (filters?.searchTerm) params = params.set('searchTerm', filters.searchTerm);
    if (filters?.weekId) params = params.set('weekId', filters.weekId.toString());
    if (filters?.subjectId) params = params.set('subjectId', filters.subjectId.toString());
    if (filters?.termId) params = params.set('termId', filters.termId.toString());

    return this.http.get<Lesson[] | PaginatedResult<LessonDetailsDto>>(
      `${this.apiUrl}/Lessons`,
      { params }
    );
  }

  getLessonsByWeek(weekId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/Lessons/week/${weekId}`);
  }

  getLessonsByTerm(termId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/Lessons/term/${termId}`);
  }

  getLessonsBySubject(subjectId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/Lessons/subject/${subjectId}`);
  }

  getLesson(id: number): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/Lessons/${id}`);
  }

  addLesson(
    title: string,
    description: string,
    weekId: number,
    subjectId: number,
    posterFile: File,
    videoFile: File,
    duration?: number,
    orderIndex?: number
  ): Observable<Lesson> {
    // Validate files
    if (!posterFile || posterFile.size === 0) {
      console.error('❌ PosterFile is missing or empty');
      throw new Error('Poster file is required');
    }

    if (!videoFile || videoFile.size === 0) {
      console.error('❌ VideoFile is missing or empty');
      throw new Error('Video file is required');
    }

    console.log('📤 Adding lesson with files:', {
      title,
      description,
      weekId,
      subjectId,
      duration,
      orderIndex,
      posterFile: { name: posterFile.name, size: posterFile.size, type: posterFile.type },
      videoFile: { name: videoFile.name, size: videoFile.size, type: videoFile.type }
    });

    const formData = new FormData();
    formData.append('PosterFile', posterFile, posterFile.name);
    formData.append('VideoFile', videoFile, videoFile.name);

    // According to API documentation: Title, Description, WeekId, SubjectId are required
    // Duration and OrderIndex are optional
    let params = new HttpParams()
      .set('Title', title)
      .set('Description', description)
      .set('WeekId', weekId.toString())
      .set('SubjectId', subjectId.toString());

    if (duration !== undefined && duration !== null) {
      params = params.set('Duration', duration.toString());
    }

    if (orderIndex !== undefined && orderIndex !== null) {
      params = params.set('OrderIndex', orderIndex.toString());
    }

    // Use upload service with progress tracking
    const url = `${this.apiUrl}/Lessons?${params.toString()}`;
    return this.uploadService.uploadWithProgress<Lesson>(url, formData, 'lesson_upload').pipe(
      filter(event => event.response !== undefined),
      map(event => event.response!)
    );
  }

  /**
   * Get lesson upload progress
   */
  getLessonUploadProgress() {
    return this.uploadService.getProgress('lesson_upload');
  }

  updateLesson(
    id: number,
    title: string,
    description: string,
    weekId: number,
    subjectId: number,
    posterFile?: File,
    videoFile?: File,
    duration?: number,
    orderIndex?: number
  ): Observable<Lesson> {
    const formData = new FormData();

    // Only append files if they are provided
    if (posterFile && posterFile instanceof File) {
      formData.append('PosterFile', posterFile, posterFile.name);
    }

    if (videoFile && videoFile instanceof File) {
      formData.append('VideoFile', videoFile, videoFile.name);
    }

    let params = new HttpParams()
      .set('Title', title)
      .set('Description', description)
      .set('WeekId', weekId.toString())
      .set('SubjectId', subjectId.toString());

    if (duration !== undefined && duration !== null) {
      params = params.set('Duration', duration.toString());
    }

    if (orderIndex !== undefined && orderIndex !== null) {
      params = params.set('OrderIndex', orderIndex.toString());
    }

    // Use upload service with progress tracking for updates
    const url = `${this.apiUrl}/Lessons/${id}?${params.toString()}`;
    return this.uploadService.uploadWithProgressPut<Lesson>(url, formData, 'lesson_update').pipe(
      filter(event => event.response !== undefined),
      map(event => event.response!)
    );
  }

  /**
   * Get lesson update progress
   */
  getLessonUpdateProgress() {
    return this.uploadService.getProgress('lesson_update');
  }

  deleteLesson(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Lessons/${id}`);
  }

  getLessonResources(lessonId: number): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.apiUrl}/Lessons/${lessonId}/resources`);
  }

  // ===== Resources =====
  addResource(title: string, lessonId: number, file: File): Observable<Resource> {
    console.log('🔵 addResource called with:', { title, lessonId, file: { name: file.name, size: file.size, type: file.type } });

    const formData = new FormData();
    formData.append('File', file, file.name);

    const params = new HttpParams()
      .set('Title', title)
      .set('LessonId', lessonId.toString());

    console.log('📦 FormData entries:');
    formData.forEach((value, key) => {
      console.log(`  ${key}:`, value);
    });
    console.log('📦 Params:', params.toString());

    // Use upload service with progress tracking
    const url = `${this.apiUrl}/Resources?${params.toString()}`;
    return this.uploadService.uploadWithProgress<Resource>(url, formData, 'resource_upload').pipe(
      filter(event => event.response !== undefined),
      map(event => event.response!)
    );
  }

  /**
   * Get resource upload progress
   */
  getResourceUploadProgress() {
    return this.uploadService.getProgress('resource_upload');
  }

  deleteResource(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Resources/${id}`);
  }

  // ===== Lesson Questions (Quiz) =====
  getLessonQuestions(lessonId: number): Observable<any[]> {
    console.log('🔵 Getting questions for lesson:', lessonId);
    return this.http.get<any[]>(`${this.apiUrl}/LessonQuestions/lesson/${lessonId}`);
  }

  addLessonQuestion(lessonId: number, questionText: string, isMultipleChoice: boolean, points: number, options: any[], explanation?: string, incorrectAnswerMessage?: string): Observable<any> {
    // API expects: { lessonId, questionText, isMultipleChoice, videoMinute, explanation, incorrectAnswerMessage, options: [{ text, isCorrect }] }
    const body = {
      lessonId,
      questionText,
      isMultipleChoice,  // true = single answer, false = multiple answers
      videoMinute: 0, // Default, can be enhanced later
      explanation: explanation || null,
      incorrectAnswerMessage: incorrectAnswerMessage || null,
      options: options.map(opt => ({
        text: opt.optionText || opt.text,
        isCorrect: opt.isCorrect || false
      }))
    };

    console.log('🔵 Creating question:', body);
    return this.http.post<any>(`${this.apiUrl}/LessonQuestions`, body);
  }

  updateLessonQuestion(id: number, questionText: string, isMultipleChoice: boolean, points: number, options: any[], explanation?: string, incorrectAnswerMessage?: string): Observable<any> {
    // API expects: { questionText, isMultipleChoice, videoMinute, explanation, incorrectAnswerMessage, options: [{ text, isCorrect }] }
    const body = {
      questionText,
      isMultipleChoice,  // true = single answer, false = multiple answers
      videoMinute: 0,
      explanation: explanation || null,
      incorrectAnswerMessage: incorrectAnswerMessage || null,
      options: options.map(opt => ({
        text: opt.optionText || opt.text,
        isCorrect: opt.isCorrect || false
      }))
    };

    console.log('🔵 Updating question:', id, body);
    return this.http.put<any>(`${this.apiUrl}/LessonQuestions/${id}`, body);
  }

  deleteLessonQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/LessonQuestions/${id}`);
  }

  // ===== Lesson Discussions =====
  getLessonDiscussions(lessonId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Discussions/lessons/${lessonId}`);
  }

  addLessonDiscussion(lessonId: number, question: string, videoTimestamp?: number): Observable<any> {
    const body = {
      question,
      videoTimestamp: videoTimestamp || null
    };
    return this.http.post<any>(`${this.apiUrl}/Discussions/lessons/${lessonId}`, body);
  }

  deleteLessonDiscussion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Discussions/${id}`);
  }

  addDiscussionReply(discussionId: number, reply: string): Observable<any> {
    const body = { reply };
    return this.http.post<any>(`${this.apiUrl}/Discussions/${discussionId}/replies`, body);
  }

  // ===== Lesson Resources =====
  addLessonResource(lessonId: number, title: string, description: string, resourceType: string, file: File): Observable<any> {
    console.log('🔵 addLessonResource called with:', { lessonId, title, fileName: file?.name, fileSize: file?.size, fileType: file?.type });

    if (!file) {
      console.error('🔴 ERROR: File is null or undefined!');
      throw new Error('File is required but was not provided');
    }

    if (!(file instanceof File)) {
      console.error('🔴 ERROR: file is not an instance of File!', typeof file, file);
      throw new Error('Invalid file object provided');
    }

    const formData = new FormData();
    // IMPORTANT: The parameter name MUST be 'File' (capital F) to match backend expectation
    formData.append('File', file, file.name);

    // Debug: Log FormData contents
    console.log('🔵 FormData entries:');
    formData.forEach((value, key) => {
      console.log(`  ${key}:`, value);
    });

    // API only accepts Title and LessonId as query params (based on Swagger)
    const params = new HttpParams()
      .set('Title', title)
      .set('LessonId', lessonId.toString());

    console.log('🔵 Request URL:', `${this.apiUrl}/Resources`);
    console.log('🔵 Query Params:', params.toString());
    console.log('🔵 FormData File:', file.name, 'Type:', file.type, 'Size:', file.size);
    console.log('⚠️ NOTE: If you see 500 error, this is a known backend issue. See: backend_inquiry_resources_upload_500_error_2025-11-04.md');

    return this.http.post<any>(`${this.apiUrl}/Resources`, formData, { params });
  }

  deleteLessonResource(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Resources/${id}`);
  }

  // ===== Notes Management =====
  getLessonNotes(lessonId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Notes`, {
      params: { lessonId: lessonId.toString() }
    });
  }

  addNote(lessonId: number, title: string, content: string): Observable<any> {
    const body = {
      lessonId,
      title,
      content
    };
    return this.http.post<any>(`${this.apiUrl}/Notes`, body);
  }

  updateNote(id: number, title: string, content: string): Observable<any> {
    const body = {
      title,
      content
    };
    return this.http.put<any>(`${this.apiUrl}/Notes/${id}`, body);
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Notes/${id}`);
  }

  toggleNoteFavorite(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Notes/${id}/favorite`, {});
  }

  // ===== Exams Management =====
  getLessonExams(lessonId: number): Observable<any[]> {
    // Note: This endpoint might need adjustment based on your API
    return this.http.get<any[]>(`${this.apiUrl}/Exam`);
  }

  addExam(lessonId: number, title: string, description: string, duration: number, totalMarks: number, passingMarks: number, examDate: string): Observable<any> {
    const body = {
      lessonId,
      title,
      description,
      duration,
      totalMarks,
      passingMarks,
      examDate
    };
    return this.http.post<any>(`${this.apiUrl}/Exam`, body);
  }

  updateExam(id: number, title: string, description: string, duration: number, totalMarks: number, passingMarks: number, examDate: string): Observable<any> {
    const body = {
      title,
      description,
      duration,
      totalMarks,
      passingMarks,
      examDate
    };
    return this.http.put<any>(`${this.apiUrl}/Exam/${id}`, body);
  }

  deleteExam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Exam/${id}`);
  }

  // ===== Video Chapters Management =====
  getLessonChapters(lessonId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/VideoChapters/lesson/${lessonId}`);
  }

  addChapter(lessonId: number, title: string, description: string, startTime: string, endTime: string, orderIndex: number): Observable<any> {
    // Convert time string (HH:MM:SS) to seconds timestamp
    const timestamp = this.convertTimeToSeconds(startTime);

    const body = {
      lessonId,
      title,
      description: description || null,
      timestamp, // Required: time in seconds
      order: orderIndex
    };

    console.log('🔵 Creating VideoChapter:', body);
    return this.http.post<any>(`${this.apiUrl}/VideoChapters`, body);
  }

  updateChapter(id: number, title: string, description: string, startTime: string, endTime: string, orderIndex: number): Observable<any> {
    const body = {
      title,
      description: description || null,
      timestamp: this.convertTimeToSeconds(startTime),
      order: orderIndex
    };

    console.log('🔵 Updating VideoChapter:', id, body);
    return this.http.put<any>(`${this.apiUrl}/VideoChapters/${id}`, body);
  }

  deleteChapter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/VideoChapters/${id}`);
  }

  // Helper method to convert HH:MM:SS to seconds
  private convertTimeToSeconds(timeString: string): number {
    if (!timeString) return 0;

    const parts = timeString.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      return (hours * 3600) + (minutes * 60) + seconds;
    }
    return 0;
  }

  // ===== Update Lesson Resource =====
  updateLessonResource(id: number, title: string, description: string, resourceType: string, file: File | null): Observable<any> {
    const formData = new FormData();
    if (file) {
      formData.append('File', file);
    }

    const params = new HttpParams()
      .set('Title', title)
      .set('Description', description || '')
      .set('ResourceType', resourceType);

    return this.http.put<any>(`${this.apiUrl}/Resources/${id}`, formData, { params });
  }

  // ===== Users =====
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/User`);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/User/${id}`);
  }

// In content.service.ts
getTeachers(): Observable<User[]> {
  return this.http.get<User[]>(`${this.apiUrl}/Admin/users-with-roles`);
}

  updateUser(id: number, userData: any): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/User/${id}`, userData);
  }

  deleteStudent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/User/delete-student/${id}`);
  }

  // ===== Teachings =====
  getTeachings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Teachings`);
  }

  getTeaching(subjectId: number, teacherId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Teachings/${subjectId}/${teacherId}`);
  }

  getTeachingsByTeacher(teacherId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Teachings/by-teacher/${teacherId}`);
  }

  getTeachingsBySubject(subjectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Teachings/by-subject/${subjectId}`);
  }
}
