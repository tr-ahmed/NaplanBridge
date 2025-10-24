/**
 * Base API Service
 * Handles all HTTP requests with proper error handling
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PagedResult, PaginationParams, ApiError } from '../../models/common.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly http = inject(HttpClient);

  /**
   * Standard GET request
   */
  get<T>(endpoint: string, params?: any): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    const httpParams = this.buildHttpParams(params);

    return this.http.get<T>(url, { params: httpParams }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * GET request with pagination
   */
  getPaginated<T>(endpoint: string, paginationParams: PaginationParams, additionalParams?: any): Observable<PagedResult<T>> {
    const params = {
      page: paginationParams.page,
      pageSize: paginationParams.pageSize,
      ...additionalParams
    };

    return this.get<PagedResult<T>>(endpoint, params);
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body: any, options?: { headers?: HttpHeaders }): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}`;

    return this.http.post<T>(url, body, options).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body: any, options?: { headers?: HttpHeaders }): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}`;

    return this.http.put<T>(url, body, options).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}`;

    return this.http.delete<T>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Upload file (multipart/form-data)
   */
  upload<T>(endpoint: string, formData: FormData): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}`;

    return this.http.post<T>(url, formData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Download file
   */
  downloadFile(endpoint: string): Observable<Blob> {
    const url = `${this.baseUrl}/${endpoint}`;

    return this.http.get(url, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Build HttpParams from object
   */
  private buildHttpParams(params?: any): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(item => {
              httpParams = httpParams.append(key, item.toString());
            });
          } else {
            httpParams = httpParams.append(key, value.toString());
          }
        }
      });
    }

    return httpParams;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: ApiError = {
      statusCode: error.status,
      message: 'An error occurred',
      traceId: '',
      timestamp: new Date().toISOString()
    };

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage.message = `Client Error: ${error.error.message}`;
      errorMessage.details = 'Network or client-side error occurred';
    } else {
      // Server-side error
      if (error.error && typeof error.error === 'object') {
        // Backend returned an ApiError structure
        errorMessage = {
          ...errorMessage,
          ...error.error
        };
      } else {
        errorMessage.message = `Server Error: ${error.status}`;
        errorMessage.details = error.message;
      }

      // Handle specific status codes
      switch (error.status) {
        case 400:
          errorMessage.message = 'Bad Request';
          break;
        case 401:
          errorMessage.message = 'Unauthorized - Please login';
          break;
        case 403:
          errorMessage.message = 'Forbidden - You do not have permission';
          break;
        case 404:
          errorMessage.message = 'Resource not found';
          break;
        case 429:
          errorMessage.message = 'Too many requests - Please try again later';
          if (error.error?.retryAfter) {
            errorMessage.details = `Retry after ${error.error.retryAfter} seconds`;
          }
          break;
        case 500:
          errorMessage.message = 'Internal Server Error';
          break;
        case 503:
          errorMessage.message = 'Service Unavailable';
          break;
        default:
          errorMessage.message = `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('API Error:', errorMessage);
    return throwError(() => errorMessage);
  }

  /**
   * Check API health
   */
  checkHealth(): Observable<any> {
    return this.get('health');
  }

  /**
   * Check API readiness
   */
  checkReadiness(): Observable<any> {
    return this.get('health/ready');
  }

  /**
   * Check API liveness
   */
  checkLiveness(): Observable<any> {
    return this.get('health/live');
  }
}
