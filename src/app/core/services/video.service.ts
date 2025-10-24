/**
 * Video Service
 * Handles Bunny.net HLS video player integration
 * Based on Backend API Documentation - BUNNY_NET_INTEGRATION_GUIDE.md
 */

import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import Hls from 'hls.js';
import * as PlyrNamespace from 'plyr';
type Plyr = PlyrNamespace.default;
const Plyr = (PlyrNamespace as any).default || PlyrNamespace;
import { VideoPlayerConfig, VideoProvider } from '../../models/lesson.models';
import { ProgressService } from './progress.service';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private progressService = inject(ProgressService);

  private hls?: Hls;
  private player?: Plyr;
  private videoElement?: HTMLVideoElement;

  // Video events
  private videoPlaying$ = new Subject<void>();
  private videoPaused$ = new Subject<void>();
  private videoEnded$ = new Subject<void>();
  private videoProgress$ = new Subject<{ currentTime: number; duration: number }>();

  public onVideoPlaying = this.videoPlaying$.asObservable();
  public onVideoPaused = this.videoPaused$.asObservable();
  public onVideoEnded = this.videoEnded$.asObservable();
  public onVideoProgress = this.videoProgress$.asObservable();

  // Current lesson ID for progress tracking
  private currentLessonId?: number;

  // ============================================
  // Player Initialization
  // ============================================

  /**
   * Initialize video player with Bunny.net HLS support
   */
  initializePlayer(config: VideoPlayerConfig, videoElement: HTMLVideoElement, lessonId?: number): void {
    this.videoElement = videoElement;
    this.currentLessonId = lessonId;
    this.destroyPlayer(); // Clean up existing player

    if (config.provider === 'BunnyStream') {
      this.initializeBunnyStreamPlayer(config);
    } else {
      this.initializeStandardPlayer(config);
    }

    this.setupEventListeners();
  }

  /**
   * Initialize Bunny Stream player (HLS)
   */
  private initializeBunnyStreamPlayer(config: VideoPlayerConfig): void {
    if (!this.videoElement) return;

    if (Hls.isSupported()) {
      // HLS.js for browsers that don't natively support HLS
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      this.hls.loadSource(config.videoUrl);
      this.hls.attachMedia(this.videoElement);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.initializePlyr(config);
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error, trying to recover');
              this.hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error, trying to recover');
              this.hls?.recoverMediaError();
              break;
            default:
              console.error('Fatal error, cannot recover');
              this.destroyPlayer();
              break;
          }
        }
      });
    } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      this.videoElement.src = config.videoUrl;
      this.initializePlyr(config);
    }
  }

  /**
   * Initialize standard video player (Cloudinary/BunnyStorage)
   */
  private initializeStandardPlayer(config: VideoPlayerConfig): void {
    if (!this.videoElement) return;

    this.videoElement.src = config.videoUrl;
    if (config.posterUrl) {
      this.videoElement.poster = config.posterUrl;
    }

    this.initializePlyr(config);
  }

  /**
   * Initialize Plyr player UI
   */
  private initializePlyr(config: VideoPlayerConfig): void {
    if (!this.videoElement) return;

    const controls = config.controls || [
      'play-large',
      'play',
      'progress',
      'current-time',
      'mute',
      'volume',
      'settings',
      'pip',
      'airplay',
      'fullscreen'
    ];

    const settings = config.settings || ['quality', 'speed'];

    this.player = new Plyr(this.videoElement, {
      controls,
      settings,
      autoplay: config.autoplay || false,
      muted: config.muted || false,
      clickToPlay: true,
      keyboard: { focused: true, global: false },
      tooltips: { controls: true, seek: true },
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] }
    });

    // Resume from last watched position
    if (config.startTime && config.startTime > 0 && this.player) {
      this.player.currentTime = config.startTime;
    }
  }

  // ============================================
  // Player Controls
  // ============================================

  /**
   * Play video
   */
  playVideo(): void {
    this.player?.play();
  }

  /**
   * Pause video
   */
  pauseVideo(): void {
    this.player?.pause();
  }

  /**
   * Stop video
   */
  stopVideo(): void {
    this.player?.stop();
  }

  /**
   * Toggle play/pause
   */
  togglePlay(): void {
    this.player?.togglePlay();
  }

  /**
   * Get current time in seconds
   */
  getCurrentTime(): number {
    return this.player?.currentTime || 0;
  }

  /**
   * Set current time in seconds
   */
  setCurrentTime(time: number): void {
    if (this.player) {
      this.player.currentTime = time;
    }
  }

  /**
   * Get video duration in seconds
   */
  getVideoDuration(): number {
    return this.player?.duration || 0;
  }

  /**
   * Get volume (0-1)
   */
  getVolume(): number {
    return this.player?.volume || 1;
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.player) {
      this.player.volume = volume;
    }
  }

  /**
   * Mute video
   */
  mute(): void {
    if (this.player) {
      this.player.muted = true;
    }
  }

  /**
   * Unmute video
   */
  unmute(): void {
    if (this.player) {
      this.player.muted = false;
    }
  }

  /**
   * Enter fullscreen
   */
  enterFullscreen(): void {
    this.player?.fullscreen.enter();
  }

  /**
   * Exit fullscreen
   */
  exitFullscreen(): void {
    this.player?.fullscreen.exit();
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen(): void {
    this.player?.fullscreen.toggle();
  }

  // ============================================
  // Progress Tracking
  // ============================================

  /**
   * Setup event listeners for progress tracking
   */
  private setupEventListeners(): void {
    if (!this.player) return;

    this.player.on('play', () => {
      this.videoPlaying$.next();
    });

    this.player.on('pause', () => {
      this.videoPaused$.next();
      this.saveProgress();
    });

    this.player.on('ended', () => {
      this.videoEnded$.next();
      this.markAsCompleted();
    });

    this.player.on('timeupdate', () => {
      const currentTime = this.getCurrentTime();
      const duration = this.getVideoDuration();

      this.videoProgress$.next({ currentTime, duration });

      // Auto-save progress every 10 seconds
      if (Math.floor(currentTime) % 10 === 0) {
        this.saveProgress();
      }
    });

    this.player.on('seeked', () => {
      this.saveProgress();
    });
  }

  /**
   * Save video progress to backend
   */
  private saveProgress(): void {
    if (!this.currentLessonId) return;

    const currentTime = this.getCurrentTime();
    const duration = this.getVideoDuration();
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    this.progressService.updateLessonProgress({
      lessonId: this.currentLessonId,
      progress: Math.min(progress, 99), // Keep at 99% until completed
      lastWatchedPosition: currentTime
    }).subscribe({
      error: (err) => console.error('Failed to save progress:', err)
    });
  }

  /**
   * Mark lesson as completed (when video ends)
   */
  private markAsCompleted(): void {
    if (!this.currentLessonId) return;

    this.progressService.updateLessonProgress({
      lessonId: this.currentLessonId,
      progress: 100,
      completed: true,
      lastWatchedPosition: this.getVideoDuration()
    }).subscribe({
      next: () => console.log('Lesson marked as completed'),
      error: (err) => console.error('Failed to mark lesson as completed:', err)
    });
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * Destroy player and cleanup resources
   */
  destroyPlayer(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = undefined;
    }

    if (this.player) {
      this.player.destroy();
      this.player = undefined;
    }

    this.videoElement = undefined;
    this.currentLessonId = undefined;
  }

  /**
   * Check if HLS is supported
   */
  isHlsSupported(): boolean {
    return Hls.isSupported() ||
           (!!document.createElement('video').canPlayType('application/vnd.apple.mpegurl'));
  }

  /**
   * Get recommended video quality
   */
  getRecommendedQuality(): string {
    const connection = (navigator as any).connection;
    if (!connection) return 'auto';

    const effectiveType = connection.effectiveType;
    switch (effectiveType) {
      case '4g':
        return '1080p';
      case '3g':
        return '720p';
      case '2g':
        return '480p';
      default:
        return 'auto';
    }
  }
}
