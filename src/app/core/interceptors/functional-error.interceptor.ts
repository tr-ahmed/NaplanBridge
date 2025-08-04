import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

/**
 * Functional HTTP error interceptor for handling API errors globally
 */
export const functionalErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService: ToastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      // Handle different types of HTTP errors
      switch (error.status) {
        case 400:
          // Bad Request - usually validation errors
          if (error.error?.errors) {
            const validationErrors = error.error.errors;
            const messages = Object.values(validationErrors).flat() as string[];
            errorMessage = messages.join(', ');
          } else {
            errorMessage = error.error?.title || 'Invalid request';
          }
          break;

        case 401:
          errorMessage = 'Unauthorized access. Please log in.';
          break;

        case 403:
          errorMessage = 'Access forbidden. You don\'t have permission.';
          break;

        case 404:
          errorMessage = 'Resource not found';
          break;

        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;

        case 0:
          // Network error or CORS issue
          if (error.error instanceof ProgressEvent) {
            errorMessage = 'Network error or CORS issue. Please check your connection or contact support.';
          } else {
            errorMessage = 'Network error. Please check your connection.';
          }
          break;

        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }

      // Show error toast notification
      toastService.showError(errorMessage);

      // Re-throw the error so components can handle it if needed
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error
      }));
    })
  );
};
