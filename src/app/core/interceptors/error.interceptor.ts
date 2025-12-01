/**
 * Error Interceptor
 * Global error handling for HTTP requests
 * Shows user-friendly error messages via toast notifications
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip error handling for blob responses (file downloads)
      // These are handled by the component directly
      if (error.error instanceof Blob) {
        console.log('⚠️ Blob response detected in error handler, passing through...');
        return throwError(() => error);
      }

      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Network Error: ${error.error.message}`;
        console.error('Client-side error:', error.error);
      } else {
        // Backend returned an error response
        console.error(`Backend error ${error.status}:`, error.error);

        // Handle specific error status codes
        switch (error.status) {
          case 0:
            errorMessage = 'Unable to connect to server. Please check your internet connection.';
            break;

          case 400:
            // Bad Request - Show validation errors if available
            if (error.error?.errors) {
              const validationErrors = Object.values(error.error.errors).flat();
              errorMessage = validationErrors.join('\n');
            } else {
              errorMessage = error.error?.message || 'Invalid request. Please check your input.';
            }
            break;

          case 401:
            // Check if this is an email verification error
            const isEmailVerificationError =
              error.error?.requiresVerification === true ||
              error.error?.error === 'Email not verified';

            if (isEmailVerificationError) {
              // Don't show toast for email verification - let component handle it
              errorMessage = error.error?.message || 'Please verify your email address.';
            } else {
              // Other 401 errors - handled by auth interceptor
              errorMessage = 'Unauthorized. Please login again.';
            }
            break;

          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;

          case 404:
            // Log to console only, don't show toast for 404
            console.warn('404 Resource not found:', error.url);
            errorMessage = error.error?.message || 'Resource not found.';
            break;

          case 409:
            errorMessage = error.error?.message || 'Conflict: Resource already exists.';
            break;

          case 429:
            // Rate limiting
            const retryAfter = error.error?.retryAfter || 60;
            errorMessage = `Too many requests. Please try again in ${retryAfter} seconds.`;
            break;

          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;

          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;

          default:
            errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
        }
      }

      // Show error toast notification (except for specific cases when explicitly skipped)
      const skipToast = req.headers.has('X-Skip-Toast');
      const isEmailVerificationError = error.status === 401 &&
        (error.error?.requiresVerification === true || error.error?.error === 'Email not verified');

      // Skip toast for: 401 (except email verification which is shown by component), 403, 404
      if (error.status !== 403 && error.status !== 404 && !skipToast && !isEmailVerificationError) {
        // For 401, only show toast if it's NOT an email verification error
        if (error.status === 401) {
          if (!isEmailVerificationError) {
            toastService.showError(errorMessage);
          }
        } else {
          toastService.showError(errorMessage);
        }
      }

      // If skipToast is true, just pass the error through without re-throwing
      // This allows the service to handle it with catchError
      if (skipToast) {
        return throwError(() => error);
      }

      // Re-throw the error for further handling
      return throwError(() => ({
        ...error,
        userMessage: errorMessage
      }));
    })
  );
};
