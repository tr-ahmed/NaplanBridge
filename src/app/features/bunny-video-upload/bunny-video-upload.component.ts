/**
 * Bunny.net Video Upload Component
 * Allows teachers/admins to upload videos to Bunny.net Stream
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BunnyNetService, BunnyVideoMetadata } from '../../core/services/bunny-net.service';
import { ToastService } from '../../core/services/toast.service';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'waiting' | 'uploading' | 'processing' | 'completed' | 'error';
  videoId?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

@Component({
  selector: 'app-bunny-video-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto p-6 max-w-4xl">
      <h2 class="text-2xl font-bold mb-6">Upload Video to Bunny.net Stream</h2>

      <!-- Upload Form -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <form [formGroup]="uploadForm" (ngSubmit)="onSubmit()">
          <!-- Title -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Video Title *</label>
            <input type="text"
                   formControlName="title"
                   class="w-full border rounded px-3 py-2"
                   placeholder="e.g., Algebra Lesson 1: Introduction">
            @if (uploadForm.get('title')?.invalid && uploadForm.get('title')?.touched) {
              <small class="text-red-500">Title is required</small>
            }
          </div>

          <!-- File Upload -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Video File *</label>
            <input type="file"
                   accept="video/*"
                   (change)="onFileSelected($event)"
                   class="w-full border rounded px-3 py-2">

            @if (selectedFile()) {
              <div class="mt-2 text-sm text-gray-600">
                <p>Selected: {{ selectedFile()?.name }}</p>
                <p>Size: {{ formatFileSize(selectedFile()?.size || 0) }}</p>
              </div>
            }
          </div>

          <!-- Description (optional) -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea formControlName="description"
                      rows="3"
                      class="w-full border rounded px-3 py-2"
                      placeholder="Brief description of the video content">
            </textarea>
          </div>

          <!-- Upload Button -->
          <button type="submit"
                  [disabled]="uploadForm.invalid || !selectedFile() || uploading()"
                  class="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400">
            @if (uploading()) {
              <span>Uploading...</span>
            } @else {
              <span>Upload Video</span>
            }
          </button>
        </form>
      </div>

      <!-- Upload Progress -->
      @if (uploads().length > 0) {
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-xl font-semibold mb-4">Upload Progress</h3>

          @for (upload of uploads(); track $index) {
            <div class="mb-4 p-4 border rounded">
              <!-- File Info -->
              <div class="flex justify-between items-center mb-2">
                <span class="font-medium">{{ upload.file.name }}</span>
                <span class="text-sm px-2 py-1 rounded"
                      [class.bg-yellow-100]="upload.status === 'uploading'"
                      [class.bg-blue-100]="upload.status === 'processing'"
                      [class.bg-green-100]="upload.status === 'completed'"
                      [class.bg-red-100]="upload.status === 'error'">
                  {{ getStatusText(upload.status) }}
                </span>
              </div>

              <!-- Progress Bar -->
              @if (upload.status === 'uploading') {
                <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div class="bg-blue-600 h-2 rounded-full transition-all"
                       [style.width.%]="upload.progress">
                  </div>
                </div>
                <p class="text-sm text-gray-600">{{ upload.progress }}% uploaded</p>
              }

              <!-- Processing -->
              @if (upload.status === 'processing') {
                <div class="flex items-center text-sm text-gray-600">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span>Bunny.net is processing your video...</span>
                </div>
              }

              <!-- Completed -->
              @if (upload.status === 'completed' && upload.videoId) {
                <div class="mt-2 space-y-2">
                  <div class="text-sm">
                    <span class="font-medium">Video ID:</span>
                    <code class="ml-2 bg-gray-100 px-2 py-1 rounded">{{ upload.videoId }}</code>
                  </div>

                  @if (upload.playbackUrl) {
                    <div class="text-sm">
                      <span class="font-medium">Playback URL:</span>
                      <input type="text"
                             readonly
                             [value]="upload.playbackUrl"
                             class="w-full mt-1 border rounded px-2 py-1 text-xs bg-gray-50">
                    </div>
                  }

                  @if (upload.thumbnailUrl) {
                    <div class="text-sm">
                      <img [src]="upload.thumbnailUrl"
                           alt="Thumbnail"
                           class="w-32 h-auto rounded border">
                    </div>
                  }

                  <button (click)="copyToClipboard(upload.videoId!)"
                          class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                    Copy Video ID
                  </button>
                </div>
              }

              <!-- Error -->
              @if (upload.status === 'error' && upload.error) {
                <p class="text-sm text-red-600 mt-2">Error: {{ upload.error }}</p>
              }
            </div>
          }
        </div>
      }

      <!-- Info Box -->
      <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="font-semibold text-blue-900 mb-2">ℹ️ Important Notes</h4>
        <ul class="text-sm text-blue-800 space-y-1">
          <li>• Supported formats: MP4, MOV, AVI, MKV, WebM</li>
          <li>• Maximum file size: 5GB per video</li>
          <li>• Processing time depends on video length and size</li>
          <li>• After upload, copy the Video ID to use in lessons</li>
          <li>• Videos are automatically encoded to multiple qualities</li>
        </ul>
      </div>
    </div>
  `
})
export class BunnyVideoUploadComponent implements OnInit {
  private bunnyService = inject(BunnyNetService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // Form
  uploadForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: ['']
  });

  // State
  selectedFile = signal<File | null>(null);
  uploading = signal<boolean>(false);
  uploads = signal<UploadProgress[]>([]);

  ngOnInit(): void {}

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('video/')) {
        this.toastService.showError('Please select a valid video file');
        return;
      }

      // Validate file size (5GB max)
      const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
      if (file.size > maxSize) {
        this.toastService.showError('File size must be less than 5GB');
        return;
      }

      this.selectedFile.set(file);
    }
  }

  /**
   * Submit upload
   */
  async onSubmit(): Promise<void> {
    if (this.uploadForm.invalid || !this.selectedFile()) return;

    const file = this.selectedFile()!;
    const title = this.uploadForm.value.title;

    this.uploading.set(true);

    // Add to uploads list
    const uploadProgress: UploadProgress = {
      file,
      progress: 0,
      status: 'uploading'
    };
    this.uploads.update(arr => [...arr, uploadProgress]);

    try {
      // Step 1: Create video entry
      this.toastService.showInfo('Creating video entry...');
      const createResult = await this.bunnyService.createVideo(title).toPromise();

      if (!createResult || !createResult.guid) {
        throw new Error('Failed to create video entry');
      }

      uploadProgress.videoId = createResult.guid;

      // Step 2: Upload file
      this.toastService.showInfo('Uploading video...');
      await this.bunnyService.uploadVideo(
        createResult.guid,
        file,
        createResult.authorizationSignature,
        createResult.authorizationExpire
      ).toPromise();

      uploadProgress.progress = 100;
      uploadProgress.status = 'processing';

      // Step 3: Get video URLs
      uploadProgress.playbackUrl = this.bunnyService.getVideoPlaybackUrl(createResult.guid);
      uploadProgress.thumbnailUrl = this.bunnyService.getVideoThumbnail(createResult.guid);

      // Wait for processing (poll every 5 seconds)
      await this.waitForProcessing(createResult.guid, uploadProgress);

      uploadProgress.status = 'completed';
      this.toastService.showSuccess('Video uploaded successfully! 🎉');

      // Reset form
      this.uploadForm.reset();
      this.selectedFile.set(null);

    } catch (error: any) {
      uploadProgress.status = 'error';
      uploadProgress.error = error.message || 'Upload failed';
      this.toastService.showError('Failed to upload video');
      console.error('Upload error:', error);
    } finally {
      this.uploading.set(false);
    }
  }

  /**
   * Wait for video processing to complete
   */
  private async waitForProcessing(videoId: string, uploadProgress: UploadProgress): Promise<void> {
    const maxAttempts = 60; // Max 5 minutes (60 * 5 seconds)
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        this.bunnyService.getVideo(videoId).subscribe({
          next: (video) => {
            if (this.bunnyService.isVideoReady(video.status)) {
              resolve();
            } else if (video.status === 4) {
              reject(new Error('Video encoding failed'));
            } else {
              attempts++;
              if (attempts >= maxAttempts) {
                reject(new Error('Processing timeout'));
              } else {
                setTimeout(checkStatus, 5000); // Check again in 5 seconds
              }
            }
          },
          error: (err) => reject(err)
        });
      };

      checkStatus();
    });
  }

  /**
   * Copy text to clipboard
   */
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.showSuccess('Copied to clipboard!');
    });
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get status display text
   */
  getStatusText(status: UploadProgress['status']): string {
    const statusMap = {
      'waiting': 'Waiting',
      'uploading': 'Uploading',
      'processing': 'Processing',
      'completed': 'Completed',
      'error': 'Error'
    };
    return statusMap[status];
  }
}
