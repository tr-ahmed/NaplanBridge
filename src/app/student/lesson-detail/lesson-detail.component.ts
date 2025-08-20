import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LessonsService } from '../../core/services/lessons.service';
import { Lesson, LessonProgress } from '../../models/lesson.models';

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lesson-detail.component.html',
  styleUrls: ['./lesson-detail.component.scss']
})
export class LessonDetailComponent implements OnInit {
  lesson = signal<Lesson | null>(null);
  progress = signal<LessonProgress | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Expose Math for template
  Math = Math;

  // Video player state
  isPlaying = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  volume = signal(50);

  // Rating modal
  showRatingModal = signal(false);
  newRating = signal(0);
  newComment = signal('');

  // Progress tracking
  watchProgress = signal(0);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonsService: LessonsService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const lessonId = parseInt(params['id']);
      if (lessonId) {
        this.loadLesson(lessonId);
      }
    });
  }

  private loadLesson(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.lessonsService.getLessonById(id).subscribe({
      next: (lesson) => {
        if (lesson) {
          this.lesson.set(lesson);
          this.duration.set(lesson.duration * 60); // Convert minutes to seconds
          this.loadProgress(id);
        } else {
          this.error.set('الدرس غير موجود');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading lesson:', error);
        this.error.set('حدث خطأ في تحميل الدرس');
        this.loading.set(false);
      }
    });
  }

  private loadProgress(lessonId: number): void {
    // In a real app, this would load from the service
    // For now, we'll create mock progress
    const mockProgress: LessonProgress = {
      lessonId,
      studentId: 1,
      progress: Math.floor(Math.random() * 80),
      timeSpent: Math.floor(Math.random() * 30),
      currentPosition: Math.floor(Math.random() * 1800), // 30 minutes max
      isCompleted: false,
      attempts: 1
    };
    this.progress.set(mockProgress);
    this.currentTime.set(mockProgress.currentPosition || 0);
    this.watchProgress.set(mockProgress.progress);
  }

  // Video player controls
  togglePlay(): void {
    this.isPlaying.set(!this.isPlaying());
  }

  seekTo(percentage: number): void {
    const newTime = (this.duration() * percentage) / 100;
    this.currentTime.set(newTime);
    this.updateProgress();
  }

  setVolume(volume: number): void {
    this.volume.set(volume);
  }

  onTimeUpdate(currentTime: number): void {
    this.currentTime.set(currentTime);
    this.updateProgress();
  }

  private updateProgress(): void {
    if (this.duration() > 0) {
      const progressPercentage = (this.currentTime() / this.duration()) * 100;
      this.watchProgress.set(Math.min(progressPercentage, 100));

      // Update progress in service every 10 seconds
      if (Math.floor(this.currentTime()) % 10 === 0) {
        this.saveProgress();
      }
    }
  }

  private saveProgress(): void {
    const lesson = this.lesson();
    if (lesson) {
      this.lessonsService.updateProgress(
        lesson.id,
        1, // studentId
        this.watchProgress(),
        Math.floor(this.currentTime() / 60), // time spent in minutes
        this.currentTime()
      ).subscribe();
    }
  }

  markAsCompleted(): void {
    const lesson = this.lesson();
    if (lesson) {
      this.lessonsService.markAsCompleted(lesson.id, 1).subscribe({
        next: () => {
          this.watchProgress.set(100);
          const updatedProgress = this.progress();
          if (updatedProgress) {
            updatedProgress.isCompleted = true;
            updatedProgress.progress = 100;
            updatedProgress.completedAt = new Date();
            this.progress.set({ ...updatedProgress });
          }
        }
      });
    }
  }

  // Rating system
  openRatingModal(): void {
    this.showRatingModal.set(true);
    this.newRating.set(0);
    this.newComment.set('');
  }

  closeRatingModal(): void {
    this.showRatingModal.set(false);
  }

  setRating(rating: number): void {
    this.newRating.set(rating);
  }

  submitRating(): void {
    const lesson = this.lesson();
    if (lesson && this.newRating() > 0) {
      this.lessonsService.rateLesson(
        lesson.id,
        this.newRating(),
        this.newComment()
      ).subscribe({
        next: () => {
          // Update lesson rating locally
          lesson.rating = this.newRating();
          lesson.totalRatings += 1;
          this.lesson.set({ ...lesson });
          this.closeRatingModal();
        },
        error: (error) => {
          console.error('Error submitting rating:', error);
        }
      });
    }
  }

  // Navigation
  goToPreviousLesson(): void {
    const lesson = this.lesson();
    if (lesson && lesson.order > 1) {
      // Navigate to previous lesson (simplified logic)
      this.router.navigate(['/student/lessons', lesson.id - 1]);
    }
  }

  goToNextLesson(): void {
    const lesson = this.lesson();
    if (lesson) {
      // Navigate to next lesson (simplified logic)
      this.router.navigate(['/student/lessons', lesson.id + 1]);
    }
  }

  backToLessons(): void {
    this.router.navigate(['/student/lessons']);
  }

  // Utility methods
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  renderStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '☆';
    const emptyStars = 5 - Math.ceil(rating);
    stars += '☆'.repeat(emptyStars);
    return stars;
  }

  getRatingStars(rating: number): boolean[] {
    return Array(5).fill(false).map((_, index) => index < rating);
  }
}
