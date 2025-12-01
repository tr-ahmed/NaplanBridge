import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, finalize } from 'rxjs/operators';

/**
 * Upload Progress Interface
 */
export interface UploadProgress {
  fileName: string;
  percentage: number;
  loaded: number;
  total: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

/**
 * Upload Service - Handles file uploads with progress tracking
 * Provides reusable upload functionality with progress monitoring
 */
@Injectable({
  providedIn: 'root'
})
export class UploadService {
  // Observable for tracking upload progress
  private uploadProgressSubject = new BehaviorSubject<Map<string, UploadProgress>>(new Map());
  public uploadProgress$ = this.uploadProgressSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Upload a file with progress tracking
   * @param url API endpoint URL
   * @param formData FormData containing the file and other fields
   * @param trackingKey Unique key to track this upload (defaults to timestamp)
   * @returns Observable with upload progress and final response
   */
  uploadWithProgress<T>(
    url: string,
    formData: FormData,
    trackingKey?: string
  ): Observable<{ progress?: UploadProgress; response?: T }> {
    // Generate tracking key if not provided
    const key = trackingKey || `upload_${Date.now()}`;

    // Get filename from FormData (if available)
    let fileName = 'Unknown';
    const fileEntry = formData.get('file') || formData.get('File') || formData.get('PosterFile') || formData.get('VideoFile');
    if (fileEntry && fileEntry instanceof File) {
      fileName = fileEntry.name;
    }

    // Initialize progress
    this.updateProgress(key, {
      fileName,
      percentage: 0,
      loaded: 0,
      total: 0,
      status: 'pending'
    });

    return this.http.post<T>(url, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            // Upload progress event
            const percentDone = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
            const progress: UploadProgress = {
              fileName,
              percentage: percentDone,
              loaded: event.loaded,
              total: event.total || 0,
              status: 'uploading'
            };
            this.updateProgress(key, progress);
            return { progress };

          case HttpEventType.Response:
            // Upload complete
            const completedProgress: UploadProgress = {
              fileName,
              percentage: 100,
              loaded: event.body?.size || 0,
              total: event.body?.size || 0,
              status: 'completed'
            };
            this.updateProgress(key, completedProgress);
            return { progress: completedProgress, response: event.body };

          default:
            return {};
        }
      }),
      tap({
        error: (error) => {
          // Upload error
          const errorProgress: UploadProgress = {
            fileName,
            percentage: 0,
            loaded: 0,
            total: 0,
            status: 'error',
            error: error.message || 'Upload failed'
          };
          this.updateProgress(key, errorProgress);
        }
      }),
      finalize(() => {
        // Clean up after a delay
        setTimeout(() => {
          this.removeProgress(key);
        }, 5000);
      })
    );
  }

  /**
   * Upload file with PUT method (for updates)
   */
  uploadWithProgressPut<T>(
    url: string,
    formData: FormData,
    trackingKey?: string
  ): Observable<{ progress?: UploadProgress; response?: T }> {
    const key = trackingKey || `upload_${Date.now()}`;

    let fileName = 'Unknown';
    const fileEntry = formData.get('file') || formData.get('File') || formData.get('PosterFile') || formData.get('VideoFile');
    if (fileEntry && fileEntry instanceof File) {
      fileName = fileEntry.name;
    }

    this.updateProgress(key, {
      fileName,
      percentage: 0,
      loaded: 0,
      total: 0,
      status: 'pending'
    });

    return this.http.put<T>(url, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const percentDone = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
            const progress: UploadProgress = {
              fileName,
              percentage: percentDone,
              loaded: event.loaded,
              total: event.total || 0,
              status: 'uploading'
            };
            this.updateProgress(key, progress);
            return { progress };

          case HttpEventType.Response:
            const completedProgress: UploadProgress = {
              fileName,
              percentage: 100,
              loaded: event.body?.size || 0,
              total: event.body?.size || 0,
              status: 'completed'
            };
            this.updateProgress(key, completedProgress);
            return { progress: completedProgress, response: event.body };

          default:
            return {};
        }
      }),
      tap({
        error: (error) => {
          const errorProgress: UploadProgress = {
            fileName,
            percentage: 0,
            loaded: 0,
            total: 0,
            status: 'error',
            error: error.message || 'Upload failed'
          };
          this.updateProgress(key, errorProgress);
        }
      }),
      finalize(() => {
        setTimeout(() => {
          this.removeProgress(key);
        }, 5000);
      })
    );
  }

  /**
   * Get current progress for a specific upload
   */
  getProgress(key: string): UploadProgress | undefined {
    return this.uploadProgressSubject.value.get(key);
  }

  /**
   * Get all active uploads
   */
  getAllProgress(): UploadProgress[] {
    return Array.from(this.uploadProgressSubject.value.values());
  }

  /**
   * Update progress for a specific upload
   */
  private updateProgress(key: string, progress: UploadProgress): void {
    const currentMap = new Map(this.uploadProgressSubject.value);
    currentMap.set(key, progress);
    this.uploadProgressSubject.next(currentMap);
  }

  /**
   * Remove progress tracking for a specific upload
   */
  private removeProgress(key: string): void {
    const currentMap = new Map(this.uploadProgressSubject.value);
    currentMap.delete(key);
    this.uploadProgressSubject.next(currentMap);
  }

  /**
   * Clear all progress tracking
   */
  clearAllProgress(): void {
    this.uploadProgressSubject.next(new Map());
  }

  /**
   * Format bytes to human-readable size
   */
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
