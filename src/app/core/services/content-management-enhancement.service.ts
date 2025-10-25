/**
 * Content Management Enhancements
 * Additional features for content management
 */

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface VideoUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}

export interface BunnyNetConfig {
  libraryId: string;
  apiKey: string;
  cdnHostname: string;
  storageZone: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContentManagementEnhancementService {
  // Signals for state management
  uploadProgress = signal<VideoUploadProgress[]>([]);
  isUploading = signal(false);

  // Bunny.net configuration (mock for now)
  private bunnyConfig: BunnyNetConfig = {
    libraryId: 'your-library-id',
    apiKey: 'your-api-key',
    cdnHostname: 'your-cdn.b-cdn.net',
    storageZone: 'your-storage-zone'
  };

  constructor(private http: HttpClient) {}

  /**
   * Upload video to Bunny.net
   */
  uploadVideoToBunny(file: File, lessonId: number): Observable<any> {
    this.isUploading.set(true);

    // Create progress entry
    const progress: VideoUploadProgress = {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    };

    const currentProgress = this.uploadProgress();
    this.uploadProgress.set([...currentProgress, progress]);

    // Simulate upload (replace with real Bunny.net API)
    return new Observable(observer => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;

        // Update progress
        const updatedProgress = this.uploadProgress().map(p =>
          p.fileName === file.name
            ? { ...p, progress: currentProgress }
            : p
        );
        this.uploadProgress.set(updatedProgress);

        if (currentProgress >= 100) {
          clearInterval(interval);

          // Mark as processing
          const processingProgress = this.uploadProgress().map(p =>
            p.fileName === file.name
              ? { ...p, status: 'processing' as const }
              : p
          );
          this.uploadProgress.set(processingProgress);

          // Complete after processing
          setTimeout(() => {
            const completedProgress = this.uploadProgress().map(p =>
              p.fileName === file.name
                ? { ...p, status: 'completed' as const, progress: 100 }
                : p
            );
            this.uploadProgress.set(completedProgress);
            this.isUploading.set(false);

            observer.next({
              success: true,
              videoUrl: `https://${this.bunnyConfig.cdnHostname}/video-${Date.now()}.mp4`,
              videoId: Date.now()
            });
            observer.complete();
          }, 2000);
        }
      }, 300);
    });
  }

  /**
   * Upload resource (PDF, exercise)
   */
  uploadResource(file: File, lessonId: number, type: 'pdf' | 'exercise'): Observable<any> {
    // Mock upload
    return of({
      success: true,
      resourceUrl: `https://example.com/resource-${Date.now()}.${type}`,
      resourceId: Date.now()
    });
  }

  /**
   * Export lessons to CSV
   */
  exportToCSV(lessons: any[]): void {
    const headers = ['ID', 'Title', 'Subject', 'Term', 'Week', 'Status', 'Created'];
    const rows = lessons.map(lesson => [
      lesson.id,
      lesson.title,
      lesson.subjectName || '',
      lesson.termName || '',
      lesson.weekName || '',
      lesson.status || 'draft',
      new Date(lesson.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lessons-export-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Bulk publish lessons
   */
  bulkPublish(lessonIds: number[]): Observable<any> {
    // Mock bulk operation
    return of({
      success: true,
      published: lessonIds.length
    });
  }

  /**
   * Bulk unpublish lessons
   */
  bulkUnpublish(lessonIds: number[]): Observable<any> {
    // Mock bulk operation
    return of({
      success: true,
      unpublished: lessonIds.length
    });
  }

  /**
   * Clear upload progress
   */
  clearUploadProgress(): void {
    this.uploadProgress.set([]);
  }
}
