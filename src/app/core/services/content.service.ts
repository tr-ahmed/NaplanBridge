import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) { }

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

    return this.http.post<Subject>(`${this.apiUrl}/Subjects`, formData, { params });
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
    posterFile: File,
    videoFile: File
  ): Observable<Lesson> {
    const formData = new FormData();
    formData.append('PosterFile', posterFile);
    formData.append('VideoFile', videoFile);

    // According to Swagger API: Title, Description, WeekId as query parameters
    // SubjectId and TermId are automatically calculated by backend
    const params = new HttpParams()
      .set('Title', title)
      .set('Description', description)
      .set('WeekId', weekId.toString());

    return this.http.post<Lesson>(`${this.apiUrl}/Lessons`, formData, { params });
  }

  updateLesson(
    id: number,
    title: string,
    description: string,
    weekId: number,
    posterFile?: File,
    videoFile?: File
  ): Observable<Lesson> {
    const formData = new FormData();
    
    // Always append files, even if empty (some backends require it)
    if (posterFile) {
      formData.append('PosterFile', posterFile);
    } else {
      formData.append('PosterFile', new Blob(), '');
    }
    
    if (videoFile) {
      formData.append('VideoFile', videoFile);
    } else {
      formData.append('VideoFile', new Blob(), '');
    }

    let params = new HttpParams()
      .set('Title', title)
      .set('Description', description)
      .set('WeekId', weekId.toString());

    return this.http.put<Lesson>(`${this.apiUrl}/Lessons/${id}`, formData, { params });
  }

  deleteLesson(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Lessons/${id}`);
  }

  getLessonResources(lessonId: number): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.apiUrl}/Lessons/${lessonId}/resources`);
  }

  // ===== Resources =====
  addResource(title: string, lessonId: number, file: File): Observable<Resource> {
    const formData = new FormData();
    formData.append('File', file);

    const params = new HttpParams()
      .set('Title', title)
      .set('LessonId', lessonId.toString());

    return this.http.post<Resource>(`${this.apiUrl}/Resources`, formData, { params });
  }

  deleteResource(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Resources/${id}`);
  }

  // ===== Lesson Questions (Quiz) =====
  getLessonQuestions(lessonId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/LessonQuestions/lesson/${lessonId}`);
  }

  addLessonQuestion(lessonId: number, questionText: string, questionType: string, points: number, options: any[]): Observable<any> {
    const body = {
      lessonId,
      questionText,
      questionType,
      points,
      options
    };
    return this.http.post<any>(`${this.apiUrl}/LessonQuestions`, body);
  }

  updateLessonQuestion(id: number, questionText: string, questionType: string, points: number, options: any[]): Observable<any> {
    const body = {
      questionText,
      questionType,
      points,
      options
    };
    return this.http.put<any>(`${this.apiUrl}/LessonQuestions/${id}`, body);
  }

  deleteLessonQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/LessonQuestions/${id}`);
  }

  // ===== Lesson Discussions =====
  getLessonDiscussions(lessonId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Discussions/lessons/${lessonId}`);
  }

  addLessonDiscussion(lessonId: number, question: string, details: string): Observable<any> {
    const body = {
      lessonId,
      question,
      details
    };
    return this.http.post<any>(`${this.apiUrl}/Discussions/lessons/${lessonId}`, body);
  }

  deleteLessonDiscussion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Discussions/${id}`);
  }

  // ===== Lesson Resources =====
  addLessonResource(lessonId: number, title: string, description: string, resourceType: string, file: File): Observable<any> {
    console.log('addLessonResource called with:', { lessonId, title, fileName: file.name, fileSize: file.size });
    
    const formData = new FormData();
    formData.append('File', file);

    // API only accepts Title and LessonId as query params (based on Swagger)
    const params = new HttpParams()
      .set('Title', title)
      .set('LessonId', lessonId.toString());

    console.log('Request URL:', `${this.apiUrl}/Resources`);
    console.log('Query Params:', params.toString());
    console.log('FormData File:', file.name);

    return this.http.post<any>(`${this.apiUrl}/Resources`, formData, { params });
  }

  deleteLessonResource(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Resources/${id}`);
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