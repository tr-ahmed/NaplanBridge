import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import Hls from 'hls.js';

@Component({
  selector: 'app-preview-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" [class.show]="isOpen" (click)="close.emit()"></div>
    <div class="modal" [class.show]="isOpen" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg">
          <!-- Header -->
          <div class="modal-header border-bottom bg-gradient-to-r from-blue-50 to-indigo-50 py-4">
            <div class="w-100">
              <h5 class="modal-title text-2xl font-bold text-gray-900 mb-1">
                <i class="fas fa-eye me-2 text-blue-600"></i>
                {{ preview?.title || 'Lesson Preview' }}
              </h5>
              @if (preview?.status) {
                <div class="mt-2">
                  <span [ngClass]="getStatusBadgeClass(preview.status)" class="px-3 py-1 rounded-full text-xs font-semibold">
                    {{ preview.status }}
                  </span>
                </div>
              }
            </div>
            <button type="button" class="btn-close btn-close-black" (click)="close.emit()" aria-label="Close"></button>
          </div>

          <!-- Body -->
          <div class="modal-body p-0">
            @if (preview) {
              <div class="preview-content">
                <!-- Content Section with Poster on the Side -->
                <div class="p-6 space-y-6">
                  <!-- Header with Poster and Description -->
                  <div class="flex gap-6 items-start">
                    <!-- Poster Image (Left Side - Smaller) -->
                    @if (preview.posterUrl) {
                      <div class="flex-shrink-0 w-40 h-40 rounded-lg overflow-hidden shadow-lg bg-gray-200">
                        <img
                          [src]="preview.posterUrl"
                          class="w-full h-full object-cover"
                          alt="Lesson Poster">
                      </div>
                    }

                    <!-- Description (Right Side) -->
                    <div class="flex-grow">
                      @if (preview.description) {
                        <div class="border-l-4 border-blue-500 pl-4">
                          <h6 class="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Description</h6>
                          <p class="text-gray-600 leading-relaxed line-clamp-6">{{ preview.description }}</p>
                        </div>
                      } @else {
                        <div class="text-gray-400 text-sm">No description available</div>
                      }
                    </div>
                  </div>                  <!-- Video Player Section -->
                  @if (preview.videoUrl) {
                    <div class="space-y-3">
                      <div class="flex items-center gap-2">
                        <i class="fas fa-play-circle text-red-500 text-lg"></i>
                        <h6 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Lesson Video</h6>
                      </div>
                      <div class="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
                        <video
                          #videoElement
                          controls
                          class="w-full h-auto"
                          [poster]="preview.posterUrl"
                          controlsList="nodownload">
                          <source [src]="preview.videoUrl" type="application/x-mpegURL">
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  } @else {
                    <div class="bg-gray-100 rounded-lg p-8 text-center">
                      <i class="fas fa-video text-4xl text-gray-400 mb-3"></i>
                      <p class="text-gray-500 font-medium">No video attached to this lesson</p>
                    </div>
                  }

                  <!-- Resources Section -->
                  @if (preview.resources && preview.resources.length > 0) {
                    <div class="space-y-3 border-t pt-6">
                      <div class="flex items-center gap-2">
                        <i class="fas fa-paperclip text-green-500 text-lg"></i>
                        <h6 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Attached Resources ({{ preview.resources.length }})
                        </h6>
                      </div>
                      <div class="grid grid-cols-1 gap-3">
                        @for (resource of preview.resources; track resource.id) {
                          <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                            <div class="flex-shrink-0">
                              <i [class]="getResourceIcon(resource.fileType || resource.resourceType) + ' text-2xl'"></i>
                            </div>
                            <div class="flex-grow min-w-0">
                              <h6 class="font-semibold text-gray-900 text-sm truncate">{{ resource.title }}</h6>
                              @if (resource.description) {
                                <p class="text-xs text-gray-500 truncate">{{ resource.description }}</p>
                              }
                              @if (resource.fileType) {
                                <span class="inline-block mt-2 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded font-medium uppercase">
                                  {{ resource.fileType }}
                                </span>
                              } @else if (resource.resourceType) {
                                <span class="inline-block mt-2 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded font-medium uppercase">
                                  {{ resource.resourceType }}
                                </span>
                              }
                              @if (resource.fileSize) {
                                <span class="ml-2 text-xs text-gray-500">
                                  ({{ formatFileSize(resource.fileSize) }})
                                </span>
                              }
                            </div>
                            @if (resource.fileUrl || resource.resourceUrl) {
                              <div class="flex-shrink-0 flex gap-2">
                                <a
                                  [href]="resource.fileUrl || resource.resourceUrl"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm">
                                  <i class="fas fa-external-link-alt me-2"></i>
                                  View
                                </a>
                                <a
                                  [href]="resource.fileUrl || resource.resourceUrl"
                                  [download]="resource.title"
                                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm">
                                  <i class="fas fa-download me-2"></i>
                                  Download
                                </a>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <i class="fas fa-info-circle text-blue-500 text-lg mb-2"></i>
                      <p class="text-blue-700 text-sm font-medium">No resources attached to this lesson</p>
                    </div>
                  }

                  <!-- Additional Info -->
                  @if (preview.weekId || preview.subjectId || preview.termId) {
                    <div class="border-t pt-6 grid grid-cols-3 gap-4">
                      @if (preview.weekId) {
                        <div class="text-center">
                          <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Week</p>
                          <p class="text-lg font-bold text-gray-900">{{ preview.weekId }}</p>
                        </div>
                      }
                      @if (preview.subjectId) {
                        <div class="text-center">
                          <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Subject</p>
                          <p class="text-lg font-bold text-gray-900">{{ preview.subjectId }}</p>
                        </div>
                      }
                      @if (preview.termId) {
                        <div class="text-center">
                          <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Term</p>
                          <p class="text-lg font-bold text-gray-900">{{ preview.termId }}</p>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            } @else {
              <div class="p-12 text-center">
                <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg font-medium">No preview available</p>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="modal-footer border-top bg-gray-50">
            <button type="button" class="btn btn-secondary px-4" (click)="close.emit()">
              <i class="fas fa-times me-2"></i>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1040;

      &.show {
        display: block;
      }
    }

    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1050;
      overflow: auto;

      &.show {
        display: block;
      }
    }

    .modal-dialog {
      margin: 1.75rem auto;
    }

    .preview-content {
      /* Poster Image Styles */
      .w-40 {
        width: 10rem;
      }

      .h-40 {
        height: 10rem;
      }

      /* Description Styles */
      .line-clamp-6 {
        display: -webkit-box;
        -webkit-line-clamp: 6;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* Layout Utilities */
      .flex {
        display: flex;
      }

      .flex-shrink-0 {
        flex-shrink: 0;
      }

      .flex-grow {
        flex-grow: 1;
      }

      .items-start {
        align-items: flex-start;
      }

      .gap-6 {
        gap: 1.5rem;
      }

      img {
        max-width: 100%;
        height: auto;
      }

      video {
        max-height: 500px;
      }

      h6 {
        font-weight: 600;
        color: #333;
      }

      .list-group-item {
        border-left: 3px solid #007bff;
        transition: all 0.3s ease;

        &:hover {
          background-color: #f8f9fa;
          border-left-color: #0056b3;
        }
      }

      details {
        cursor: pointer;

        summary {
          user-select: none;

          &:hover {
            color: #007bff;
          }
        }
      }
    }

    .cursor-pointer {
      cursor: pointer;
    }
  `]
})
export class PreviewModalComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  @Input() isOpen: boolean = false;
  @Input() preview: any = null;

  @Output() close = new EventEmitter<void>();
  @Output() isOpenChange = new EventEmitter<boolean>();

  private hls?: Hls;

  ngAfterViewInit(): void {
    if (this.isOpen && this.preview?.videoUrl && this.videoElement) {
      this.initializeVideo();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-initialize video when preview changes
    if (changes['preview'] && !changes['preview'].firstChange) {
      setTimeout(() => {
        if (this.isOpen && this.preview?.videoUrl && this.videoElement) {
          this.cleanupVideo();
          this.initializeVideo();
        }
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.cleanupVideo();
  }

  /**
   * Cleanup video player
   */
  private cleanupVideo(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = undefined;
    }
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.src = '';
    }
  }

  /**
   * Initialize video player with HLS support
   */
  private initializeVideo(): void {
    const video = this.videoElement?.nativeElement;
    if (!video) return;

    const videoUrl = this.preview.videoUrl;

    // Check if browser supports HLS natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
    } else if (Hls.isSupported()) {
      // Use HLS.js for other browsers
      this.hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      this.hls.loadSource(videoUrl);
      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(err => console.warn('Auto-play prevented:', err));
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error:', data);
        }
      });
    } else {
      console.warn('HLS not supported');
      video.src = videoUrl;
    }
  }

  /**
   * Get icon class based on resource type or file type
   */
  getResourceIcon(resourceType: string): string {
    const type = resourceType?.toLowerCase() || '';
    
    // Check for common file extensions or types
    if (type.includes('pdf') || type === 'pdf') {
      return 'fas fa-file-pdf text-danger';
    } else if (type.includes('video') || type.includes('mp4') || type.includes('mov') || type.includes('avi')) {
      return 'fas fa-file-video text-primary';
    } else if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif')) {
      return 'fas fa-file-image text-success';
    } else if (type.includes('audio') || type.includes('mp3') || type.includes('wav')) {
      return 'fas fa-file-audio text-warning';
    } else if (type.includes('document') || type.includes('doc') || type.includes('docx') || type === 'word') {
      return 'fas fa-file-word text-info';
    } else if (type.includes('excel') || type.includes('xls') || type.includes('xlsx') || type === 'spreadsheet') {
      return 'fas fa-file-excel text-success';
    } else if (type.includes('powerpoint') || type.includes('ppt') || type.includes('pptx')) {
      return 'fas fa-file-powerpoint text-danger';
    } else if (type === 'link' || type.includes('url')) {
      return 'fas fa-link text-secondary';
    } else if (type.includes('zip') || type.includes('rar') || type.includes('archive')) {
      return 'fas fa-file-archive text-warning';
    } else if (type.includes('text') || type.includes('txt')) {
      return 'fas fa-file-alt text-secondary';
    }
    
    return 'fas fa-file text-muted';
  }

  /**
   * Get badge class based on status
   */
  getStatusBadgeClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'CREATED': 'bg-gray-500',
      'SUBMITTED': 'bg-blue-500',
      'PENDING': 'bg-yellow-500',
      'APPROVED': 'bg-green-500',
      'PUBLISHED': 'bg-indigo-600',
      'REJECTED': 'bg-red-600',
      'REVISION_REQUESTED': 'bg-orange-500'
    };
    return statusClasses[status] || 'bg-gray-500';
  }

  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
