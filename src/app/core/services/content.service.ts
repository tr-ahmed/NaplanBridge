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
}

export interface Lesson {
  id: number;
  title: string;
  posterUrl: string;
  videoUrl: string;
  description: string;
  weekId: number;
  subjectId: number;
}

export interface Resource {
  id: number;
  title: string;
  fileUrl: string;
  lessonId: number;
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
  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/Subjects`);
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
    yearId: number,
    subjectNameId: number,
    originalPrice: number,
    discountPercentage: number,
    level: string,
    duration: number,
    teacherId: number,
    startDate: string,
    posterFile?: File
  ): Observable<Subject> {
    const formData = new FormData();
    if (posterFile) {
      formData.append('PosterFile', posterFile);
    }

    const params = new HttpParams()
      .set('YearId', yearId.toString())
      .set('SubjectNameId', subjectNameId.toString())
      .set('OriginalPrice', originalPrice.toString())
      .set('DiscountPercentage', discountPercentage.toString())
      .set('Level', level)
      .set('Duration', duration.toString())
      .set('TeacherId', teacherId.toString())
      .set('StartDate', startDate);

    return this.http.put<Subject>(`${this.apiUrl}/Subjects/${id}`, formData, { params });
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Subjects/${id}`);
  }

  getSubjectsByCategory(categoryId: number): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/Subjects/by-category/${categoryId}`);
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
  getLessons(): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/Lessons`);
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
    if (posterFile) {
      formData.append('PosterFile', posterFile);
    }
    if (videoFile) {
      formData.append('VideoFile', videoFile);
    }

    const params = new HttpParams()
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
