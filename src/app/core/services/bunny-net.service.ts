/**
 * Bunny.net Stream Service
 * Handles video upload, management, and retrieval from Bunny.net Stream API
 *
 * API Documentation: https://docs.bunny.net/reference/video_getvideoheatmap
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BUNNY_NET_CONFIG, BunnyStreamHelper } from '../constants/bunny-net.constants';

// ============================================
// Interfaces
// ============================================

export interface BunnyVideoMetadata {
  videoLibraryId: number;
  guid: string;
  title: string;
  dateUploaded: string;
  views: number;
  isPublic: boolean;
  length: number; // duration in seconds
  status: number; // 0=Queued, 1=Processing, 2=Encoding, 3=Finished, 4=Error
  framerate: number;
  width: number;
  height: number;
  availableResolutions: string;
  thumbnailCount: number;
  thumbnailFileName: string;
  averageWatchTime: number;
  totalWatchTime: number;
  category: string;
  chapters: any[];
  moments: any[];
  metaTags: any[];
  transcodingMessages: any[];
}

export interface BunnyVideoUploadResponse {
  success: boolean;
  message: string;
  statusCode: number;
  guid?: string; // Video ID
}

export interface BunnyVideoListResponse {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  items: BunnyVideoMetadata[];
}

// ============================================
// Service
// ============================================

@Injectable({
  providedIn: 'root'
})
export class BunnyNetService {
  private http = inject(HttpClient);

  private readonly apiHeaders = new HttpHeaders(BunnyStreamHelper.getApiHeaders());

  // ============================================
  // Video Management
  // ============================================

  /**
   * Get list of videos from library
   */
  getVideoList(page: number = 1, itemsPerPage: number = 100, search?: string): Observable<BunnyVideoListResponse> {
    let url = BunnyStreamHelper.getApiUrl(`/videos?page=${page}&itemsPerPage=${itemsPerPage}`);

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    return this.http.get<BunnyVideoListResponse>(url, { headers: this.apiHeaders });
  }

  /**
   * Get video details by ID
   */
  getVideo(videoId: string): Observable<BunnyVideoMetadata> {
    const url = BunnyStreamHelper.getApiUrl(`/videos/${videoId}`);
    return this.http.get<BunnyVideoMetadata>(url, { headers: this.apiHeaders });
  }

  /**
   * Create video (get upload URL)
   * Step 1: Create video entry and get upload URL
   */
  createVideo(title: string): Observable<{ guid: string; authorizationSignature: string; authorizationExpire: number }> {
    const url = BunnyStreamHelper.getApiUrl('/videos');
    const body = { title };

    return this.http.post<any>(url, body, { headers: this.apiHeaders });
  }

  /**
   * Upload video file
   * Step 2: Upload the actual video file
   */
  uploadVideo(videoId: string, file: File, authSignature: string, authExpire: number): Observable<any> {
    const url = `https://video.bunnycdn.com/library/${BUNNY_NET_CONFIG.LIBRARY_ID}/videos/${videoId}`;

    const headers = new HttpHeaders({
      'AuthorizationSignature': authSignature,
      'AuthorizationExpire': authExpire.toString(),
      'VideoId': videoId,
      'LibraryId': BUNNY_NET_CONFIG.LIBRARY_ID
    });

    return this.http.put(url, file, { headers });
  }

  /**
   * Update video metadata
   */
  updateVideo(videoId: string, updates: Partial<BunnyVideoMetadata>): Observable<any> {
    const url = BunnyStreamHelper.getApiUrl(`/videos/${videoId}`);
    return this.http.post(url, updates, { headers: this.apiHeaders });
  }

  /**
   * Delete video
   */
  deleteVideo(videoId: string): Observable<any> {
    const url = BunnyStreamHelper.getApiUrl(`/videos/${videoId}`);
    return this.http.delete(url, { headers: this.apiHeaders });
  }

  /**
   * Set video thumbnail
   */
  setThumbnail(videoId: string, thumbnailUrl: string): Observable<any> {
    const url = BunnyStreamHelper.getApiUrl(`/videos/${videoId}/thumbnail`);
    const body = { thumbnailUrl };
    return this.http.post(url, body, { headers: this.apiHeaders });
  }

  // ============================================
  // Video URLs
  // ============================================

  /**
   * Get HLS playlist URL for video playback
   */
  getVideoPlaybackUrl(videoId: string): string {
    return BunnyStreamHelper.getPlaylistUrl(videoId);
  }

  /**
   * Get video thumbnail URL
   */
  getVideoThumbnail(videoId: string, timeInSeconds: number = 0): string {
    return BunnyStreamHelper.getThumbnail(videoId, timeInSeconds);
  }

  /**
   * Get video preview sprite
   */
  getVideoPreview(videoId: string): string {
    return BunnyStreamHelper.getPreviewSprite(videoId);
  }

  // ============================================
  // Statistics
  // ============================================

  /**
   * Get video statistics
   */
  getVideoStatistics(videoId: string): Observable<any> {
    const url = BunnyStreamHelper.getApiUrl(`/videos/${videoId}/statistics`);
    return this.http.get(url, { headers: this.apiHeaders });
  }

  /**
   * Get video heatmap (viewing patterns)
   */
  getVideoHeatmap(videoId: string): Observable<any> {
    const url = BunnyStreamHelper.getApiUrl(`/videos/${videoId}/heatmap`);
    return this.http.get(url, { headers: this.apiHeaders });
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Check if video is ready for playback
   */
  isVideoReady(status: number): boolean {
    return status === 3; // Status 3 = Finished encoding
  }

  /**
   * Get video status text
   */
  getVideoStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Queued',
      1: 'Processing',
      2: 'Encoding',
      3: 'Ready',
      4: 'Error'
    };
    return statusMap[status] || 'Unknown';
  }

  /**
   * Format video duration
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Usage Example:
 *
 * constructor(private bunnyService: BunnyNetService) {}
 *
 * // Upload video
 * async uploadLesson(file: File, title: string) {
 *   // Step 1: Create video entry
 *   const createResult = await this.bunnyService.createVideo(title).toPromise();
 *   const videoId = createResult.guid;
 *
 *   // Step 2: Upload file
 *   await this.bunnyService.uploadVideo(
 *     videoId,
 *     file,
 *     createResult.authorizationSignature,
 *     createResult.authorizationExpire
 *   ).toPromise();
 *
 *   // Step 3: Get playback URL
 *   const playbackUrl = this.bunnyService.getVideoPlaybackUrl(videoId);
 *
 *   return { videoId, playbackUrl };
 * }
 *
 * // Get video for playback
 * playVideo(videoId: string) {
 *   const videoUrl = this.bunnyService.getVideoPlaybackUrl(videoId);
 *   const thumbnail = this.bunnyService.getVideoThumbnail(videoId);
 *
 *   // Use with VideoService
 *   this.videoService.initializePlayer({
 *     videoUrl: videoUrl,
 *     posterUrl: thumbnail,
 *     provider: 'BunnyStream'
 *   }, videoElement);
 * }
 */
