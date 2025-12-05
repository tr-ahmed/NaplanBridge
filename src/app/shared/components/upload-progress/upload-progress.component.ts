import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadService, UploadProgress } from '../../../core/services/upload.service';
import { Subscription } from 'rxjs';

/**
 * Upload Progress Component
 * Displays upload progress with visual indicators
 * Can be used inline or as a global indicator
 */
@Component({
  selector: 'app-upload-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Inline Progress Bar (for specific uploads) -->
    @if (trackingKey && currentProgress) {
      <div class="upload-progress-container" [ngClass]="containerClass">
        <!-- Progress Info -->
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            @if (showFileName) {
              <span class="text-sm font-medium text-gray-700">{{ currentProgress.fileName }}</span>
            }
            @if (currentProgress.status === 'uploading') {
              <span class="text-xs text-blue-600 font-medium">Uploading...</span>
            }
            @if (currentProgress.status === 'completed') {
              <span class="text-xs text-green-600 font-medium flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Completed
              </span>
            }
            @if (currentProgress.status === 'error') {
              <span class="text-xs text-red-600 font-medium flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                Error
              </span>
            }
          </div>
          <span class="text-sm font-bold" [ngClass]="{
            'text-blue-600': currentProgress.status === 'uploading',
            'text-green-600': currentProgress.status === 'completed',
            'text-red-600': currentProgress.status === 'error',
            'text-gray-600': currentProgress.status === 'pending'
          }">
            {{ currentProgress.percentage }}%
          </span>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            class="h-full transition-all duration-300 rounded-full"
            [ngClass]="{
              'bg-blue-600': currentProgress.status === 'uploading',
              'bg-green-600': currentProgress.status === 'completed',
              'bg-red-600': currentProgress.status === 'error',
              'bg-gray-400': currentProgress.status === 'pending'
            }"
            [style.width.%]="currentProgress.percentage">
          </div>
        </div>

        <!-- Size Info -->
        @if (showSize && currentProgress.total > 0) {
          <div class="text-xs text-gray-500 mt-1">
            {{ formatBytes(currentProgress.loaded) }} / {{ formatBytes(currentProgress.total) }}
          </div>
        }

        <!-- Error Message -->
        @if (currentProgress.status === 'error' && currentProgress.error) {
          <div class="text-xs text-red-600 mt-1">
            {{ currentProgress.error }}
          </div>
        }
      </div>
    }

    <!-- Global Progress Indicator (for all uploads) -->
    @if (!trackingKey && allUploads.length > 0) {
      <div class="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        @for (upload of allUploads; track upload.fileName) {
          <div class="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <!-- Upload Info -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <!-- Icon -->
                <div class="flex-shrink-0">
                  @if (upload.status === 'uploading') {
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  }
                  @if (upload.status === 'completed') {
                    <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                  }
                  @if (upload.status === 'error') {
                    <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                  }
                </div>

                <!-- Filename -->
                <span class="text-sm font-medium text-gray-700 truncate">{{ upload.fileName }}</span>
              </div>

              <!-- Percentage -->
              <span class="text-sm font-bold ml-2" [ngClass]="{
                'text-blue-600': upload.status === 'uploading',
                'text-green-600': upload.status === 'completed',
                'text-red-600': upload.status === 'error'
              }">
                {{ upload.percentage }}%
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                class="h-full transition-all duration-300 rounded-full"
                [ngClass]="{
                  'bg-blue-600': upload.status === 'uploading',
                  'bg-green-600': upload.status === 'completed',
                  'bg-red-600': upload.status === 'error'
                }"
                [style.width.%]="upload.percentage">
              </div>
            </div>

            <!-- Size/Error Info -->
            @if (upload.status === 'uploading' && upload.total > 0) {
              <div class="text-xs text-gray-500 mt-1">
                {{ formatBytes(upload.loaded) }} / {{ formatBytes(upload.total) }}
              </div>
            }
            @if (upload.status === 'error' && upload.error) {
              <div class="text-xs text-red-600 mt-1">
                {{ upload.error }}
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .upload-progress-container {
      width: 100%;
    }
  `]
})
export class UploadProgressComponent implements OnInit, OnDestroy {
  /** Tracking key for specific upload (if provided, shows inline progress) */
  @Input() trackingKey?: string;

  /** Show filename in progress bar */
  @Input() showFileName = true;

  /** Show file size information */
  @Input() showSize = true;

  /** Additional CSS classes for container */
  @Input() containerClass = '';

  currentProgress: UploadProgress | null = null;
  allUploads: UploadProgress[] = [];
  private subscription?: Subscription;

  constructor(private uploadService: UploadService) {}

  ngOnInit(): void {
    // Subscribe to upload progress updates
    this.subscription = this.uploadService.uploadProgress$.subscribe(progressMap => {
      if (this.trackingKey) {
        // Show specific upload progress
        this.currentProgress = progressMap.get(this.trackingKey) || null;
      } else {
        // Show all uploads
        this.allUploads = Array.from(progressMap.values());
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  formatBytes(bytes: number): string {
    return this.uploadService.formatBytes(bytes);
  }
}
