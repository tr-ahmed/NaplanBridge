/**
 * Bunny.net CDN & Stream Configuration
 *
 * Library ID: 525022
 * CDN Hostname: vz-9161a4ae-e6d.b-cdn.net
 * Pull Zone: vz-9161a4ae-e6d
 *
 * Documentation: https://docs.bunny.net/docs/stream
 */

export const BUNNY_NET_CONFIG = {
  // Stream Library Configuration
  LIBRARY_ID: '525022',
  CDN_HOSTNAME: 'vz-9161a4ae-e6d.b-cdn.net',
  PULL_ZONE: 'vz-9161a4ae-e6d',

  // API Configuration
  API_KEY: 'b05fbe57-f7de-4872-88cf5fd802cb-897e-48cf',
  API_BASE_URL: 'https://video.bunnycdn.com/library/525022',

  // CDN URLs
  getVideoUrl: (videoId: string) => {
    return `https://vz-9161a4ae-e6d.b-cdn.net/${videoId}/playlist.m3u8`;
  },

  getThumbnailUrl: (videoId: string, time: number = 0) => {
    return `https://vz-9161a4ae-e6d.b-cdn.net/${videoId}/thumbnail.jpg?time=${time}`;
  },

  getPreviewUrl: (videoId: string) => {
    return `https://vz-9161a4ae-e6d.b-cdn.net/${videoId}/preview.webp`;
  },

  // API Endpoints
  API_ENDPOINTS: {
    LIST_VIDEOS: '/videos',
    GET_VIDEO: (videoId: string) => `/videos/${videoId}`,
    UPLOAD_VIDEO: '/videos',
    UPDATE_VIDEO: (videoId: string) => `/videos/${videoId}`,
    DELETE_VIDEO: (videoId: string) => `/videos/${videoId}`,
    GET_STATISTICS: (videoId: string) => `/videos/${videoId}/statistics`
  }
};

/**
 * Helper Functions for Bunny.net Stream
 */
export class BunnyStreamHelper {

  /**
   * Get HLS playlist URL for video
   */
  static getPlaylistUrl(videoId: string): string {
    return `https://${BUNNY_NET_CONFIG.CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
  }

  /**
   * Get video thumbnail at specific time
   */
  static getThumbnail(videoId: string, timeInSeconds: number = 0): string {
    return `https://${BUNNY_NET_CONFIG.CDN_HOSTNAME}/${videoId}/thumbnail.jpg?time=${timeInSeconds}`;
  }

  /**
   * Get video preview sprite
   */
  static getPreviewSprite(videoId: string): string {
    return `https://${BUNNY_NET_CONFIG.CDN_HOSTNAME}/${videoId}/preview.webp`;
  }

  /**
   * Get MP4 direct link (if available)
   */
  static getDirectMp4Url(videoId: string, resolution: '240p' | '360p' | '480p' | '720p' | '1080p' = '720p'): string {
    return `https://${BUNNY_NET_CONFIG.CDN_HOSTNAME}/${videoId}/play_${resolution}.mp4`;
  }

  /**
   * Build API request headers
   */
  static getApiHeaders(): { [key: string]: string } {
    return {
      'AccessKey': BUNNY_NET_CONFIG.API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Build full API URL
   */
  static getApiUrl(endpoint: string): string {
    return `${BUNNY_NET_CONFIG.API_BASE_URL}${endpoint}`;
  }
}

/**
 * Video Quality Options for BunnyStream
 */
export const BUNNY_VIDEO_QUALITIES = [
  { value: '240p', label: '240p (Low)', bitrate: 400 },
  { value: '360p', label: '360p', bitrate: 800 },
  { value: '480p', label: '480p (SD)', bitrate: 1400 },
  { value: '720p', label: '720p (HD)', bitrate: 2800 },
  { value: '1080p', label: '1080p (Full HD)', bitrate: 5000 }
];

/**
 * Usage Examples:
 *
 * // Get video playlist URL
 * const videoUrl = BunnyStreamHelper.getPlaylistUrl('abc123xyz');
 * // Result: https://vz-9161a4ae-e6d.b-cdn.net/abc123xyz/playlist.m3u8
 *
 * // Get thumbnail at 30 seconds
 * const thumbnail = BunnyStreamHelper.getThumbnail('abc123xyz', 30);
 * // Result: https://vz-9161a4ae-e6d.b-cdn.net/abc123xyz/thumbnail.jpg?time=30
 *
 * // Get API headers for upload
 * const headers = BunnyStreamHelper.getApiHeaders();
 *
 * // Make API request
 * const url = BunnyStreamHelper.getApiUrl('/videos');
 * fetch(url, { headers: BunnyStreamHelper.getApiHeaders() })
 */
