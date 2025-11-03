/**
 * Lesson Player Component
 * Video player with Bunny.net HLS support
 * Progress tracking and quiz questions
 */

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LessonService } from '../../core/services/lesson.service';
import { VideoService } from '../../core/services/video.service';
import { ProgressService } from '../../core/services/progress.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LessonDetails, Resource, LessonQuestion } from '../../models/lesson.models';
import { LessonProgress } from '../../models/progress.models';

@Component({
  selector: 'app-lesson-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson-player.component.html',
  styleUrl: './lesson-player.component.scss'
})
export class LessonPlayerComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer', { static: false }) videoPlayerRef!: ElementRef<HTMLVideoElement>;

  // Services
  private lessonService = inject(LessonService);
  private videoService = inject(VideoService);
  private progressService = inject(ProgressService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // State signals
  lesson = signal<LessonDetails | null>(null);
  progress = signal<LessonProgress | null>(null);
  resources = signal<Resource[]>([]);
  questions = signal<LessonQuestion[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // UI state
  showResources = signal<boolean>(false);
  showQuestions = signal<boolean>(false);
  currentTab = signal<'video' | 'resources' | 'questions'>('video');

  // Lesson ID
  lessonId: number = 0;
  studentId: number = 0;

  ngOnInit(): void {
    // Get lesson ID from route
    this.route.params.subscribe(params => {
      this.lessonId = +params['id'];
      if (this.lessonId) {
        this.loadLesson();
        this.loadProgress();
      }
    });

    // Get current user (student)
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.studentId = currentUser.id;
    }
  }

  ngOnDestroy(): void {
    // Clean up video player
    this.videoService.destroyPlayer();
  }

  /**
   * Load lesson details
   */
  loadLesson(): void {
    this.loading.set(true);
    this.error.set(null);

    this.lessonService.getLessonById(this.lessonId).subscribe({
      next: (lesson) => {
        this.lesson.set(lesson);
        this.resources.set(lesson.resources || []);
        this.questions.set(lesson.questions || []);
        this.loading.set(false);

        // Initialize video player after view is ready
        setTimeout(() => this.initializeVideoPlayer(), 100);
      },
      error: (err) => {
        this.error.set('Failed to load lesson');
        this.loading.set(false);
        this.toastService.showError('Failed to load lesson');
        console.error('Error loading lesson:', err);
      }
    });
  }

  /**
   * Load student progress for this lesson
   */
  private loadProgress(): void {
    if (!this.studentId) return;

    this.progressService.getLessonProgress(this.studentId, this.lessonId).subscribe({
      next: (progress) => {
        this.progress.set(progress);
      },
      error: (err) => {
        console.error('Error loading progress:', err);
      }
    });
  }

  /**
   * Initialize video player with multi-provider support
   * Supports: Mux (recommended), BunnyStream, BunnyStorage, Cloudinary
   */
  private initializeVideoPlayer(): void {
    const lessonData = this.lesson();
    if (!lessonData || !this.videoPlayerRef) return;

    const progressData = this.progress();
    const startTime = progressData?.lastWatchedPosition || 0;
    const currentUser = this.authService.getCurrentUser();

    // Build player configuration based on provider
    const playerConfig: any = {
      videoUrl: lessonData.videoUrl || '',
      posterUrl: lessonData.posterUrl,
      provider: lessonData.videoProvider || 'BunnyStream',
      startTime: startTime,
      autoplay: false,
      muted: false
    };

    // Add Mux-specific configuration
    if (lessonData.videoProvider === 'Mux' && lessonData.muxPlaybackId) {
      playerConfig.muxPlaybackId = lessonData.muxPlaybackId;
      playerConfig.metadataVideoTitle = lessonData.title;
      playerConfig.metadataViewerUserId = currentUser?.id?.toString() || 'anonymous';
    }

    this.videoService.initializePlayer(
      playerConfig,
      this.videoPlayerRef.nativeElement,
      this.lessonId
    );

    // Listen to video events
    this.videoService.onVideoEnded.subscribe(() => {
      this.toastService.showSuccess('Lesson completed! 🎉');
      this.handleLessonCompleted();
    });
  }

  /**
   * Handle lesson completion
   */
  private handleLessonCompleted(): void {
    // Show questions if available
    if (this.questions().length > 0) {
      this.currentTab.set('questions');
      this.showQuestions.set(true);
    } else {
      // Navigate to next lesson or back to course
      this.navigateToNextLesson();
    }
  }

  /**
   * Navigate to next lesson
   */
  private navigateToNextLesson(): void {
    // TODO: Get next lesson ID from backend
    this.toastService.showInfo('No more lessons. Returning to course.');
    this.router.navigate(['/student/courses']);
  }

  /**
   * Toggle resources panel
   */
  toggleResources(): void {
    this.showResources.update(v => !v);
  }

  /**
   * Toggle questions panel
   */
  toggleQuestions(): void {
    this.showQuestions.update(v => !v);
  }

  /**
   * Download resource
   */
  downloadResource(resource: Resource): void {
    this.lessonService.downloadResource(resource.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = resource.title;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.showSuccess('Resource downloaded');
      },
      error: (err) => {
        this.toastService.showError('Failed to download resource');
        console.error('Download error:', err);
      }
    });
  }

  /**
   * Switch tab
   */
  switchTab(tab: 'video' | 'resources' | 'questions'): void {
    this.currentTab.set(tab);
  }

  /**
   * Play video
   */
  playVideo(): void {
    this.videoService.playVideo();
  }

  /**
   * Pause video
   */
  pauseVideo(): void {
    this.videoService.pauseVideo();
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen(): void {
    this.videoService.toggleFullscreen();
  }
}
