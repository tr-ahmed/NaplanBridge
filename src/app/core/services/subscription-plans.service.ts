import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TermPlansResponse {
  subjectId: number;
  subjectName: string;
  termNumber: number;
  termName: string;
  availablePlans: PlanOption[];
}

export interface SubjectPlansResponse {
  subjectId: number;
  subjectName: string;
  subjectDescription: string;
  yearId: number;
  yearNumber: number;
  availablePlans: PlanOption[];
}

export interface PlanOption {
  planId: number;
  planName: string;
  planType: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  durationInMonths: number;
  features: string[];
  isActive: boolean;
  isRecommended: boolean;
  discountPercentage: number | null;
  originalPrice: number | null;
  saveAmount: number | null;
  termsIncluded: string;
  accessLevel: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionPlansService {
  private apiUrl = `${environment.apiBaseUrl}/SubscriptionPlans`;

  constructor(private http: HttpClient) {}

  /**
   * Get available subscription plans for a specific subject and term
   * @param subjectId The subject ID
   * @param termNumber The term number (1-4)
   * @returns Observable of TermPlansResponse
   */
  getAvailablePlansForTerm(
    subjectId: number,
    termNumber: number
  ): Observable<TermPlansResponse> {
    const url = `${this.apiUrl}/subject/${subjectId}/term/${termNumber}/available-plans`;
    return this.http.get<TermPlansResponse>(url);
  }

  /**
   * Get all available plans for a subject (without term filter)
   * NEW ENDPOINT: Implemented January 27, 2025
   * @param subjectId The subject ID
   * @returns Observable of SubjectPlansResponse containing all plans for the subject
   */
  getAvailablePlansForSubject(subjectId: number): Observable<SubjectPlansResponse> {
    const url = `${this.apiUrl}/subject/${subjectId}/available`;
    return this.http.get<SubjectPlansResponse>(url);
  }

  /**
   * Get all active subscription plans
   * @returns Observable of PlanOption array
   */
  getAllPlans(): Observable<PlanOption[]> {
    return this.http.get<PlanOption[]>(this.apiUrl);
  }
}
