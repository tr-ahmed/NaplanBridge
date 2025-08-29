import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LessonsService } from '../../core/services/lessons.service';
import { MessagesService } from '../../core/services/messages.service';
import { Lesson, LessonProgress, LessonMessage } from '../../models/lesson.models';

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
  messages = signal<LessonMessage[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Student data
  student = {
    id: 1,
    name: 'أحمد محمد'
  };

  // Expose Math for template
  Math = Math;

  // Video player state
  isPlaying = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  volume = signal(50);

  // Messages
  newMessage = signal('');
  showMessagesPanel = signal(false);

  // Progress tracking
  watchProgress = signal(0);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonsService: LessonsService,
    private messagesService: MessagesService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const lessonId = parseInt(params['id']);
      if (lessonId) {
        this.loadLesson(lessonId);
        this.loadMessages(lessonId);
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
      studentId: this.student.id,
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

  private loadMessages(lessonId: number): void {
    this.messagesService.getLessonMessages(lessonId).subscribe({
      next: (messages) => {
        this.messages.set(messages);
        // Mark messages as read
        this.messagesService.markMessagesAsRead(lessonId, this.student.id).subscribe();
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
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
        this.student.id,
        this.watchProgress(),
        Math.floor(this.currentTime() / 60), // time spent in minutes
        this.currentTime()
      ).subscribe();
    }
  }

  markAsCompleted(): void {
    const lesson = this.lesson();
    if (lesson) {
      this.lessonsService.markAsCompleted(lesson.id, this.student.id).subscribe({
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

  // Messages system
  toggleMessagesPanel(): void {
    this.showMessagesPanel.set(!this.showMessagesPanel());
  }

  sendMessage(): void {
    const message = this.newMessage().trim();
    const lesson = this.lesson();

    if (message && lesson) {
      this.messagesService.sendMessage(
        lesson.id,
        this.student.id,
        this.student.name,
        'student',
        message
      ).subscribe({
        next: (newMessage) => {
          const currentMessages = this.messages();
          this.messages.set([...currentMessages, newMessage]);
          this.newMessage.set('');
        },
        error: (error) => {
          console.error('Error sending message:', error);
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

  formatMessageTime(date: Date): string {
    return new Intl.DateTimeFormat('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  }
}
