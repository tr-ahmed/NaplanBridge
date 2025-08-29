import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface Year { id: number; number: number; }
export interface Subject {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  imageUrl: string;
  level: string;
  duration: number;
  teacherName: string;
  studentCount: number;
  weekNumber: number;
  termNumber: number;
  categoryName: string;
  categoryDescription: string;
  categoryId: number;
  teacherId: number;
  yearId: number;
  objectives?: string;
  color?: string;
}
export interface Term { id: number; number: number; yearSubjectId: number; }
export interface Week { id: number; number: number; termId: number; }

export interface Lesson {
  id?: number;
  title: string;
  description: string;
  weekId: number;
  duration?: number;
  objectives?: string;
  posterUrl?: string;
  videoUrl?: string;
}

export interface CreateLessonDto {
  title: string;
  description: string;
  weekId: number;
  posterFile: File;
  videoFile: File;
}

export interface UpdateLessonDto {
  title: string;
  description: string;
  weekId: number;
  posterFile?: File;
  videoFile?: File;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  color?: string;
}
export interface YearSubject {
  id: number;
  yearId: number;
  yearNumber: number;
  subject: Subject;
}
export interface Teacher { id: number; name: string; roles: string[]; }
export interface Resource {
  id?: number;
  title: string;
  fileUrl: string;
  lessonId: number; 
  description?: string;
  type?: string;
  fileSize?: string;
  isDownloadable?: boolean;
}

export interface CreateLessonDto {
  title: string;
  description: string;
  posterUrl: string;
  videoUrl: string;
  weekId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private apiBaseUrl = environment.apiBaseUrl || 'https://naplanbridge.runasp.net';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // If jsonContentType is false, do not set Content-Type (for FormData); otherwise, set to application/json
  private getHeaders(jsonContentType: boolean = true): HttpHeaders {
    const token = this.authService.getToken();
    const headersConfig: { [header: string]: string } = {
      'Authorization': `Bearer ${token}`
    };
    if (jsonContentType) {
      headersConfig['Content-Type'] = 'application/json';
    }
    return new HttpHeaders(headersConfig);
  }

  // Years
  getYears(): Observable<Year[]> {
    return this.http.get<Year[]>(`${this.apiBaseUrl}/Years`, { headers: this.getHeaders() });
  }

  addYear(year: { number: number }): Observable<Year> {
    return this.http.post<Year>(`${this.apiBaseUrl}/Years`, year, { headers: this.getHeaders() });
  }

  updateYear(id: number, year: Year): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/Years/${id}`, year, { headers: this.getHeaders() });
  }

  deleteYear(id: number): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/Years/${id}`, { headers: this.getHeaders() });
  }

  // Subjects
  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiBaseUrl}/Subjects`, { headers: this.getHeaders() });
  }

  addSubject(subject: any): Observable<Subject> {
    return this.http.post<Subject>(`${this.apiBaseUrl}/Subjects`, subject, { headers: this.getHeaders() });
  }

  updateSubject(id: number, subject: Subject): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/Subjects/${id}`, subject, { headers: this.getHeaders() });
  }

  deleteSubject(id: number): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/Subjects/${id}`, { headers: this.getHeaders() });
  }

  getSubjectsByCategory(categoryId: number): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiBaseUrl}/Subjects/by-category/${categoryId}`, { headers: this.getHeaders() });
  }

  getSubjectResources(subjectId: number): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.apiBaseUrl}/Subjects/${subjectId}/resources`, { headers: this.getHeaders() });
  }

  addResource(resource: any): Observable<Resource> {
    return this.http.post<Resource>(`${this.apiBaseUrl}/Resources`, resource, { headers: this.getHeaders() });
  }

  updateResource(id: number, resource: Partial<Resource>): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/Resources/${id}`, resource, { headers: this.getHeaders() });
  }
  deleteResource(id: number): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/Resources/${id}`, { headers: this.getHeaders() });
  }

  // Teachers
  getTeachers(): Observable<{ id: number; userName: string; roles: string[] }[]> {
    return this.http.get<{ id: number; userName: string; roles: string[] }[]>(
      `${this.apiBaseUrl}/Admin/users-with-roles`,
      { headers: this.getHeaders() }
    );
  }
// Lessons Service

getLessons(): Observable<Lesson[]> {
  return this.http.get<Lesson[]>(`${this.apiBaseUrl}/Lessons`, { headers: this.getHeaders() });
}

addLesson(title: string, description: string, weekId: number, posterFile: File, videoFile: File): Observable<Lesson> {
  const formData = new FormData();
  formData.append('Title', title);
  formData.append('Description', description);
  formData.append('WeekId', weekId.toString());
  formData.append('PosterFile', posterFile, posterFile.name);
  formData.append('VideoFile', videoFile, videoFile.name);

  return this.http.post<Lesson>(
    `${this.apiBaseUrl}/Lessons`,
    formData,
    { headers: this.getHeaders(false) } 
  );
}

updateLesson(id: number, title: string, description: string, weekId: number, posterFile?: File, videoFile?: File): Observable<any> {
  const formData = new FormData();
  formData.append('Title', title);
  formData.append('Description', description);
  formData.append('WeekId', weekId.toString());

  if (posterFile) {
    formData.append('PosterFile', posterFile, posterFile.name);
  }
  if (videoFile) {
    formData.append('VideoFile', videoFile, videoFile.name);
  }

  return this.http.put(
    `${this.apiBaseUrl}/Lessons/${id}`,
    formData,
    { headers: this.getHeaders(false) }
  );
}

deleteLesson(id: number): Observable<any> {
  return this.http.delete(`${this.apiBaseUrl}/Lessons/${id}`, { headers: this.getHeaders() });
}


  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiBaseUrl}/Categories`, { headers: this.getHeaders() });
  }

  addCategory(category: any): Observable<Category> {
    return this.http.post<Category>(`${this.apiBaseUrl}/Categories`, category, { headers: this.getHeaders() });
  }

  updateCategory(id: number, category: Category): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/Categories/${id}`, category, { headers: this.getHeaders() });
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/Categories/${id}`, { headers: this.getHeaders() });
  }

  // YearSubjects
  getYearSubjectsByYear(yearId: number): Observable<YearSubject[]> {
    return this.http.get<YearSubject[]>(`${this.apiBaseUrl}/YearSubjects/by-year/${yearId}`, { headers: this.getHeaders() });
  }

  // Terms
  getTermsByYearSubject(yearSubjectId: number): Observable<Term[]> {
    return this.http.get<Term[]>(`${this.apiBaseUrl}/Terms/by-yearsubject/${yearSubjectId}`, { headers: this.getHeaders() });
  }

  addTerm(term: any): Observable<Term> {
    return this.http.post<Term>(`${this.apiBaseUrl}/Terms`, term, { headers: this.getHeaders() });
  }

  updateTerm(id: number, term: Term): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/Terms/${id}`, term, { headers: this.getHeaders() });
  }

  deleteTerm(id: number): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/Terms/${id}`, { headers: this.getHeaders() });
  }

  // Weeks
  getWeeksByTerm(termId: number): Observable<Week[]> {
    return this.http.get<Week[]>(`${this.apiBaseUrl}/Weeks/by-term/${termId}`, { headers: this.getHeaders() });
  }

  addWeek(week: any): Observable<Week> {
    return this.http.post<Week>(`${this.apiBaseUrl}/Weeks`, week, { headers: this.getHeaders() });
  }

  updateWeek(id: number, week: Week): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/Weeks/${id}`, week, { headers: this.getHeaders() });
  }

  deleteWeek(id: number): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/Weeks/${id}`, { headers: this.getHeaders() });
  }

getLessonResources(lessonId: number): Observable<Resource[]> {
  return this.http.get<Resource[]>(`${this.apiBaseUrl}/Lessons/${lessonId}/resources`, { 
    headers: this.getHeaders() 
  });
}

getLesson(id: number): Observable<Lesson> {
  return this.http.get<Lesson>(`${this.apiBaseUrl}/Lessons/${id}`, { 
    headers: this.getHeaders() 
  });
}

}