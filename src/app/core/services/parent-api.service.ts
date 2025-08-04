import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ParentRegisterRequest,
  LoginRequest,
  AuthResponse,
  ApiResult,
  ApiErrorResponse,
  ValidationError
} from '../../models/auth.models';

/**
 * API service for handling parent registration and authentication
 */
@Injectable({
  providedIn: 'root'
})
export class ParentApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Register a new parent account
   * @param registerData Parent registration data
   * @returns Observable with API result
   */
  registerParent(registerData: ParentRegisterRequest): Observable<ApiResult<AuthResponse>> {
    const url = `${this.baseUrl}/Account/register-parent`;

    return this.http.post<AuthResponse>(url, registerData).pipe(
      map((response: AuthResponse) => ({
        success: true as const,
        data: response
      })),
      catchError((error) => {
        // Parse error response for better error handling
        const errorResult = this.parseErrorResponse(error.error);
        return of({
          success: false as const,
          error: errorResult.message,
          validationErrors: errorResult.validationErrors
        });
      })
    );
  }

  /**
   * Login user with email and password
   * @param loginData Login credentials
   * @returns Observable with API result
   */
  login(loginData: LoginRequest): Observable<ApiResult<AuthResponse>> {
    const url = `${this.baseUrl}/Account/login`;

    return this.http.post<AuthResponse>(url, loginData).pipe(
      map((response: AuthResponse) => ({
        success: true as const,
        data: response
      })),
      catchError((error) => {
        // Parse error response for better error handling
        const errorResult = this.parseErrorResponse(error.error);
        return of({
          success: false as const,
          error: errorResult.message,
          validationErrors: errorResult.validationErrors
        });
      })
    );
  }

  /**
   * Parse API error response to extract validation errors
   * @param errorResponse Raw error response from API
   * @returns Parsed error information
   */
  private parseErrorResponse(errorResponse: any): {
    message: string;
    validationErrors?: ValidationError[]
  } {
    if (errorResponse?.errors) {
      // Extract validation errors from API response
      const validationErrors: ValidationError[] = Object.entries(errorResponse.errors)
        .map(([field, messages]) => ({
          field: field.toLowerCase(), // Convert to lowercase for easier matching
          messages: Array.isArray(messages) ? messages : [messages as string]
        }));

      // Create a user-friendly error message
      const errorMessages = validationErrors
        .flatMap(error => error.messages)
        .join(', ');

      return {
        message: errorMessages || 'Validation errors occurred',
        validationErrors
      };
    }

    // Handle other error types
    if (errorResponse?.title) {
      return { message: errorResponse.title };
    }

    return { message: 'An unexpected error occurred' };
  }

  /**
   * Validate password according to API requirements
   * @param password Password to validate
   * @returns Validation result
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 4) {
      errors.push('Password must be at least 4 characters long');
    }

    if (password.length > 8) {
      errors.push('Password must be no more than 8 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
