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
   * Initialize video player with multi-provider support
   * Supports: Mux (recommended), BunnyStream, BunnyStorage, Cloudinary
   */
  initializePlayer(config: VideoPlayerConfig, videoElement: HTMLVideoElement, lessonId?: number): void {
    this.destroyPlayer(); // Clean up existing player first

    this.videoElement = videoElement;
    this.currentLessonId = lessonId;

    console.log('🎥 VideoService: Initializing player', {
      provider: config.provider,
      videoUrl: config.videoUrl,
      isHLS: config.videoUrl?.includes('.m3u8'),
      lessonId
    });

    if (config.provider === 'Mux') {
      console.log('🎥 Using Mux player');
      this.initializeMuxPlayer(config);
    } else if (config.provider === 'BunnyStream') {
      console.log('🎥 Using BunnyStream player (HLS)');
      this.initializeBunnyStreamPlayer(config);
    } else {
      console.log('🎥 Using standard player');
      this.initializeStandardPlayer(config);
    }

    // ✅ Event listeners are now set up inside initializePlyr() after player creation
  }

  /**
   * Initialize Mux player (Recommended)
   * Uses Mux Player Web Component for best performance and features
   */
  private initializeMuxPlayer(config: VideoPlayerConfig): void {
    if (!this.videoElement || !config.muxPlaybackId) {
      console.error('Mux playback ID is required for Mux provider');
      return;
    }

    // Replace video element with mux-player component
    const container = this.videoElement.parentElement;
    if (!container) return;

    // Create mux-player element
    const muxPlayer = document.createElement('mux-player');
    muxPlayer.setAttribute('playback-id', config.muxPlaybackId);
    muxPlayer.setAttribute('accent-color', '#FF0000');
    muxPlayer.setAttribute('thumbnail-time', '0');

    if (config.metadataVideoTitle) {
      muxPlayer.setAttribute('metadata-video-title', config.metadataVideoTitle);
    }

    if (config.metadataViewerUserId) {
      muxPlayer.setAttribute('metadata-viewer-user-id', config.metadataViewerUserId);
    }

    if (config.autoplay) {
      muxPlayer.setAttribute('autoplay', 'true');
    }

    if (config.muted) {
      muxPlayer.setAttribute('muted', 'true');
    }

    if (config.startTime && config.startTime > 0) {
      muxPlayer.setAttribute('start-time', config.startTime.toString());
    }

    // Replace video element with mux-player
    container.replaceChild(muxPlayer, this.videoElement);
    this.videoElement = muxPlayer as any;

    // Note: Mux Player has built-in event handling
    // For progress tracking, we can listen to its events
    this.setupMuxEventListeners(muxPlayer);
  }

  /**
   * Setup Mux player event listeners
   */
  private setupMuxEventListeners(muxPlayer: HTMLElement): void {
    muxPlayer.addEventListener('play', () => {
      this.videoPlaying$.next();
    });

    muxPlayer.addEventListener('pause', () => {
      this.videoPaused$.next();
    });

    muxPlayer.addEventListener('ended', () => {
      this.videoEnded$.next();
    });

    muxPlayer.addEventListener('timeupdate', () => {
      const currentTime = (muxPlayer as any).currentTime || 0;
      const duration = (muxPlayer as any).duration || 0;

      this.videoProgress$.next({ currentTime, duration });

      // Auto-save progress every 10 seconds
      if (this.currentLessonId && currentTime % 10 < 1) {
        this.saveProgress();
      }
    });
  }

  /**
   * Initialize Bunny Stream player (HLS)
   */
  private initializeBunnyStreamPlayer(config: VideoPlayerConfig): void {
    if (!this.videoElement) {
      console.error('❌ BunnyStream: Video element is null!');
      return;
    }

    console.log('🎥 BunnyStream: Checking HLS support...', {
      'HLS.isSupported()': Hls.isSupported(),
      'Native HLS support': this.videoElement.canPlayType('application/vnd.apple.mpegurl'),
      'Video URL': config.videoUrl
    });

    if (Hls.isSupported()) {
      // HLS.js for browsers that don't natively support HLS
      console.log('✅ HLS.js is supported, initializing...');

      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      this.hls.loadSource(config.videoUrl);
      this.hls.attachMedia(this.videoElement);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS manifest parsed successfully');
        this.initializePlyr(config);
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS Error:', {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          event,
          data
        });

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('❌ Network error, trying to recover');
              this.hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('❌ Media error, trying to recover');
              this.hls?.recoverMediaError();
              break;
            default:
              console.error('❌ Fatal error, cannot recover');
              this.destroyPlayer();
              break;
          }
        }
      });
    } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      console.log('✅ Native HLS support detected (Safari)');
      this.videoElement.src = config.videoUrl;
      this.initializePlyr(config);
    } else {
      console.error('❌ No HLS support available!');
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

    console.log('🎥 Initializing Plyr player...');

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

    console.log('✅ Plyr player created, setting up event listeners...');

    // ✅ Setup event listeners AFTER player is created
    this.setupEventListeners();

    // Resume from last watched position
    if (config.startTime && config.startTime > 0 && this.player) {
      this.player.currentTime = config.startTime;
      console.log('⏯️ Resuming from:', config.startTime, 'seconds');
    }

    console.log('✅ Video player fully initialized!');
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
