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
  ValidationError,
  PasswordResetRequest,
  PasswordResetConfirmation,
  VerifyEmailDto,
  ResendVerificationDto,
  ApiResponse
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

    // Add header to skip toast notification in interceptor
    const headers = { 'X-Skip-Toast': 'true' };

    return this.http.post<AuthResponse>(url, loginData, { headers }).pipe(
      map((response: AuthResponse) => {
        return {
          success: true as const,
          data: response
        };
      }),
      catchError((error) => {
        // ✅ Handle 401 Email Not Verified - Pass it to component for special handling
        const isEmailNotVerified = error.status === 401 &&
            (error.error?.requiresVerification === true || error.error?.error === 'Email not verified');

        if (isEmailNotVerified) {
          return of({
            success: false as const,
            error: error.error?.message || 'Please verify your email address before logging in.',
            requiresVerification: true,
            email: error.error?.email,
            statusCode: 401
          });
        }

        // ✅ Handle 403 Forbidden - Account Deactivated
        if (error.status === 403) {
          const deactivatedMessage = error.error?.message ||
                                     'Your account has been deactivated. Please contact support.';
          return of({
            success: false as const,
            error: deactivatedMessage,
            statusCode: 403
          });
        }

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

    // Use common fields when present
    if (typeof errorResponse === 'string') {
      return { message: errorResponse };
    }
    if (errorResponse?.message) {
      return { message: errorResponse.message };
    }
    if (errorResponse?.error) {
      return { message: errorResponse.error };
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

  /**
   * Request password reset - sends reset instructions to user's email
   * @param email User's email address
   * @returns Observable with API result
   */
  requestPasswordReset(email: string): Observable<ApiResult<any>> {
    const url = `${this.baseUrl}/Account/forgot-password`;
    const payload: PasswordResetRequest = { email };

    console.log('🔍 Password Reset Request - Email:', email);

    return this.http.post<any>(url, payload).pipe(
      map((response: any) => {
        console.log('✅ Password Reset Email Sent');
        return {
          success: true as const,
          data: response
        };
      }),
      catchError((error) => {
        console.error('❌ Password Reset Request Error:', error);
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
   * Reset password with token and new password
   * @param email User's email
   * @param newPassword New password
   * @param token Reset token from email link
   * @returns Observable with API result
   */
  resetPassword(email: string, newPassword: string, token: string): Observable<ApiResult<any>> {
    const url = `${this.baseUrl}/Account/reset-password`;
    const payload: PasswordResetConfirmation = {
      email,
      password: newPassword,
      token
    };

    console.log('🔍 Password Reset Confirmation - Email:', email);

    return this.http.post<any>(url, payload).pipe(
      map((response: any) => {
        console.log('✅ Password Reset Successful');
        return {
          success: true as const,
          data: response
        };
      }),
      catchError((error) => {
        console.error('❌ Password Reset Error:', error);
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
   * Verify email with token
   * @param dto Email verification data (email and token)
   * @returns Observable with API result
   */
  verifyEmail(dto: VerifyEmailDto): Observable<ApiResponse<boolean>> {
    const url = `${this.baseUrl}/Account/verify-email`;

    console.log('🔍 Email Verification Request:', { email: dto.email });

    return this.http.post<ApiResponse<boolean>>(url, dto).pipe(
      map((response: ApiResponse<boolean>) => {
        console.log('✅ Email Verified Successfully');
        return response;
      }),
      catchError((error) => {
        console.error('❌ Email Verification Error:', error);
        throw error;
      })
    );
  }

  /**
   * Resend verification email
   * @param dto Resend verification data (email)
   * @returns Observable with API result
   */
  resendVerificationEmail(dto: ResendVerificationDto): Observable<ApiResponse<boolean>> {
    const url = `${this.baseUrl}/Account/resend-verification-email`;

    console.log('🔍 Resend Verification Email Request:', { email: dto.email });

    return this.http.post<ApiResponse<boolean>>(url, dto).pipe(
      map((response: ApiResponse<boolean>) => {
        console.log('✅ Verification Email Sent');
        return response;
      }),
      catchError((error) => {
        console.error('❌ Resend Verification Email Error:', error);
        throw error;
      })
    );
  }
}
