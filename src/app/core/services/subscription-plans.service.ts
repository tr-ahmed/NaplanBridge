import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  SubscriptionPlan,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto
} from '../../models/subscription.models';
import { PlanType } from '../../models/enums';

// ==================== Response Interfaces ====================

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

// ==================== Validation ====================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionPlansService {
  private apiUrl = `${environment.apiBaseUrl}/SubscriptionPlans`;

  constructor(private http: HttpClient) {}

  // ==================== CRUD OPERATIONS ====================

  /**
   * Get all subscription plans
   * @returns Observable of SubscriptionPlan array
   */
  getAllPlans(): Observable<SubscriptionPlan[]> {
    console.log('🌐 API Call: GET', this.apiUrl);
    return this.http.get<SubscriptionPlan[]>(this.apiUrl).pipe(
      tap(plans => {
        console.log('📋 API Response - Loaded plans:', plans.length);
        if (plans.length > 0) {
          console.log('   - First plan (raw):', JSON.stringify(plans[0], null, 2));
        }
        
        // Convert planType from string to number enum
        plans.forEach((plan, index) => {
          const originalType = plan.planType;
          plan.planType = this.convertPlanTypeToEnum(plan.planType);
          
          if (index < 3) { // Log first 3 conversions for debugging
            console.log(`   Plan ${plan.planId}: "${originalType}" → ${plan.planType} (${PlanType[plan.planType]})`);
          }
        });
        
        console.log('✅ All planTypes converted to enum numbers');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Convert planType from string/number to PlanType enum
   */
  private convertPlanTypeToEnum(planType: any): PlanType {
    // If already a valid number, return it
    if (typeof planType === 'number' && planType in PlanType) {
      return planType as PlanType;
    }
    
    // If string, convert to enum
    if (typeof planType === 'string') {
      const typeMap: { [key: string]: PlanType } = {
        'SingleTerm': PlanType.SingleTerm,
        'MultiTerm': PlanType.MultiTerm,
        'FullYear': PlanType.FullYear,
        'SubjectAnnual': PlanType.SubjectAnnual,
        '1': PlanType.SingleTerm,
        '2': PlanType.MultiTerm,
        '3': PlanType.FullYear,
        '4': PlanType.SubjectAnnual
      };
      
      return typeMap[planType] || PlanType.SingleTerm;
    }
    
    // Default fallback
    return PlanType.SingleTerm;
  }

  /**
   * Get specific plan by ID
   * @param id Plan ID
   * @returns Observable of SubscriptionPlan
   */
  getPlanById(id: number): Observable<SubscriptionPlan> {
    return this.http.get<SubscriptionPlan>(`${this.apiUrl}/${id}`).pipe(
      tap(plan => {
        console.log('📄 Loaded plan:', plan.name);
        // Convert planType from string to enum number
        plan.planType = this.convertPlanTypeToEnum(plan.planType);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create new subscription plan
   * @param dto CreateSubscriptionPlanDto
   * @returns Observable of created SubscriptionPlan
   */
  createPlan(dto: CreateSubscriptionPlanDto): Observable<SubscriptionPlan> {
    // Validate before sending
    const validation = this.validatePlanDto(dto);
    if (!validation.isValid) {
      const errorMsg = validation.errors.map(e => e.message).join(', ');
      return throwError(() => new Error(errorMsg));
    }

    return this.http.post<SubscriptionPlan>(this.apiUrl, dto).pipe(
      tap(plan => console.log('✅ Plan created:', plan.name)),
      catchError(this.handleError)
    );
  }

  /**
   * Update existing subscription plan
   * @param id Plan ID
   * @param dto UpdateSubscriptionPlanDto
   * @returns Observable of updated SubscriptionPlan
   */
  updatePlan(id: number, dto: UpdateSubscriptionPlanDto): Observable<SubscriptionPlan> {
    return this.http.put<SubscriptionPlan>(`${this.apiUrl}/${id}`, dto).pipe(
      tap(plan => console.log('✅ Plan updated:', plan.name)),
      catchError(this.handleError)
    );
  }

  /**
   * Deactivate a subscription plan
   * @param id Plan ID
   * @returns Observable of void
   */
  deactivatePlan(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/deactivate-plan/${id}`, {}).pipe(
      tap(() => console.log('🚫 Plan deactivated:', id)),
      catchError(this.handleError)
    );
  }

  // ==================== QUERY OPERATIONS ====================

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
    return this.http.get<TermPlansResponse>(url).pipe(
      tap(response => console.log('📋 Plans for term:', response.availablePlans.length)),
      catchError(this.handleError)
    );
  }

  /**
   * Get all available plans for a subject (without term filter)
   * @param subjectId The subject ID
   * @returns Observable of SubjectPlansResponse containing all plans for the subject
   */
  getAvailablePlansForSubject(subjectId: number): Observable<SubjectPlansResponse> {
    const url = `${this.apiUrl}/subject/${subjectId}/available`;
    return this.http.get<SubjectPlansResponse>(url).pipe(
      tap(response => console.log('📋 Plans for subject:', response.availablePlans.length)),
      catchError(this.handleError)
    );
  }

  // ==================== VALIDATION ====================

  /**
   * Validate CreateSubscriptionPlanDto
   * @param dto CreateSubscriptionPlanDto
   * @returns ValidationResult
   */
  validatePlanDto(dto: CreateSubscriptionPlanDto): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields
    if (!dto.name || dto.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Plan name is required' });
    }

    if (!dto.description || dto.description.trim().length === 0) {
      errors.push({ field: 'description', message: 'Plan description is required' });
    }

    if (!dto.price || dto.price <= 0) {
      errors.push({ field: 'price', message: 'Price must be greater than 0' });
    }

    if (!dto.planType) {
      errors.push({ field: 'planType', message: 'Plan type is required' });
    }

    // Plan type specific validations
    if (dto.planType === PlanType.SingleTerm) {
      if (!dto.termId) {
        errors.push({ field: 'termId', message: 'termId is required for SingleTerm plans' });
      }
      if (!dto.subjectId) {
        errors.push({ field: 'subjectId', message: 'subjectId is required for SingleTerm plans' });
      }
    }

    if (dto.planType === PlanType.MultiTerm) {
      if (!dto.subjectId) {
        errors.push({ field: 'subjectId', message: 'subjectId is required for MultiTerm plans' });
      }
      if (!dto.includedTermIds || dto.includedTermIds.trim().length === 0) {
        errors.push({ field: 'includedTermIds', message: 'includedTermIds is required for MultiTerm plans (e.g., "1,2")' });
      }
    }

    if (dto.planType === PlanType.FullYear) {
      if (!dto.yearId) {
        errors.push({ field: 'yearId', message: 'yearId is required for FullYear plans' });
      }
    }

    if (dto.planType === PlanType.SubjectAnnual) {
      if (!dto.subjectId) {
        errors.push({ field: 'subjectId', message: 'subjectId is required for SubjectAnnual plans' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a plan is valid for display
   * @param plan SubscriptionPlan
   * @returns boolean
   */
  isValidPlan(plan: SubscriptionPlan): boolean {
    return !!(
      plan.name &&
      plan.name.trim() !== '' &&
      plan.planType &&
      plan.price !== null &&
      plan.price !== undefined
    );
  }

  // ==================== ERROR HANDLING ====================

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ SubscriptionPlansService Error Details:');
    console.error('   - Status:', error.status);
    console.error('   - Status Text:', error.statusText);
    console.error('   - URL:', error.url);
    console.error('   - Error:', error.error);
    
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (error.status === 404) {
        errorMessage = 'API endpoint not found. Please check the API URL.';
      } else if (error.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }

      if (error.error?.errors) {
        const validationErrors = Object.entries(error.error.errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n');
        errorMessage += `\nValidation Errors:\n${validationErrors}`;
      }
    }

    console.error('📝 Formatted error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
