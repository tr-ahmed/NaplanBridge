import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'https://api.naplanbridge.com/api';

export interface AcademicTerm {
  id?: number;
  name: string;
  termNumber: number;
  startDate: string;
  endDate: string;
  academicYear: number;
  isActive: boolean;
}

export interface AcademicTermResponse {
  id: number;
  name: string;
  termNumber: number;
  startDate: string;
  endDate: string;
  academicYear: number;
  isActive: boolean;
}

export interface DatabaseSetupResult {
  success: boolean;
  message: string;
  termsCreated?: number;
  termsLinked?: number;
  errors?: string[];
}

export interface TermVerificationResult {
  academicTermsCount: number;
  termsLinkedCount: number;
  termsUnlinkedCount: number;
  subjectTerms: Array<{
    subjectId: number;
    subjectName: string;
    termId: number;
    termNumber: number;
    academicTermId: number | null;
    academicTermName: string | null;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AcademicTermsService {
  private apiUrl = `${API_BASE_URL}/AcademicTerms`;

  constructor(private http: HttpClient) {}

  /**
   * Get all academic terms for a specific year
   */
  getAcademicTerms(year?: number): Observable<AcademicTermResponse[]> {
    const url = year
      ? `${this.apiUrl}?academicYear=${year}`
      : this.apiUrl;
    return this.http.get<AcademicTermResponse[]>(url);
  }

  /**
   * Get a specific academic term by ID
   */
  getAcademicTerm(id: number): Observable<AcademicTermResponse> {
    return this.http.get<AcademicTermResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new academic term
   */
  createAcademicTerm(term: AcademicTerm): Observable<AcademicTermResponse> {
    return this.http.post<AcademicTermResponse>(this.apiUrl, term);
  }

  /**
   * Update an existing academic term
   */
  updateAcademicTerm(id: number, term: AcademicTerm): Observable<AcademicTermResponse> {
    return this.http.put<AcademicTermResponse>(`${this.apiUrl}/${id}`, term);
  }

  /**
   * Delete an academic term
   */
  deleteAcademicTerm(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Initialize database with academic terms for a specific year
   */
  initializeDatabase(year: number, terms: AcademicTerm[]): Observable<DatabaseSetupResult> {
    return this.http.post<DatabaseSetupResult>(`${this.apiUrl}/initialize`, {
      year,
      terms
    });
  }

  /**
   * Link existing subject terms to academic terms
   */
  linkSubjectTerms(year: number): Observable<DatabaseSetupResult> {
    return this.http.post<DatabaseSetupResult>(`${this.apiUrl}/link-terms`, { year });
  }

  /**
   * Verify database setup and term linkage
   */
  verifyDatabase(year: number): Observable<TermVerificationResult> {
    return this.http.get<TermVerificationResult>(`${this.apiUrl}/verify/${year}`);
  }

  /**
   * Get the current academic year
   */
  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Generate default terms for a year
   */
  generateDefaultTerms(year: number): AcademicTerm[] {
    return [
      {
        name: 'Term 1',
        termNumber: 1,
        startDate: `${year}-01-27`,
        endDate: `${year}-03-28`,
        academicYear: year,
        isActive: true
      },
      {
        name: 'Term 2',
        termNumber: 2,
        startDate: `${year}-04-14`,
        endDate: `${year}-06-27`,
        academicYear: year,
        isActive: true
      },
      {
        name: 'Term 3',
        termNumber: 3,
        startDate: `${year}-07-14`,
        endDate: `${year}-09-19`,
        academicYear: year,
        isActive: true
      },
      {
        name: 'Term 4',
        termNumber: 4,
        startDate: `${year}-10-06`,
        endDate: `${year}-12-19`,
        academicYear: year,
        isActive: true
      }
    ];
  }
}
