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
            // Handled by auth interceptor
            errorMessage = 'Unauthorized. Please login again.';
            break;

          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;

          case 404:
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

      // Show error toast notification (except for 401/403 which are handled by auth interceptor)
      if (error.status !== 401 && error.status !== 403) {
        toastService.showError(errorMessage);
      }

      // Re-throw the error for further handling
      return throwError(() => ({
        ...error,
        userMessage: errorMessage
      }));
    })
  );
};
