import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from '../../models/course.models';
import { SubjectsService } from '../../core/services/subjects.service';
import { MessagesService } from '../../core/services/messages.service';
import { LessonMessage } from '../../models/lesson.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  // Student data
  student = {
    id: 1,
    fullName: 'أحمد محمد',
    grade: 'الصف الثالث الثانوي',
    avatar: '/assets/img/default-avatar.png'
  };

  // Signals for reactive data
  subjects = signal<Subject[]>([]);
  stats = signal<any>(null);
  recentMessages = signal<LessonMessage[]>([]);
  unreadMessagesCount = signal<number>(0);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private subjectsService: SubjectsService,
    private messagesService: MessagesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load enrolled subjects
    this.subjectsService.getEnrolledSubjects(this.student.id).subscribe({
      next: (subjects) => {
        this.subjects.set(subjects);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
        this.error.set('حدث خطأ في تحميل المواد');
        this.loading.set(false);
      }
    });

    // Load statistics
    this.subjectsService.getSubjectsStats(this.student.id).subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });

    // Load recent messages
    this.messagesService.getRecentMessages(this.student.id).subscribe({
      next: (messages) => {
        this.recentMessages.set(messages);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });

    // Load unread messages count
    this.messagesService.getUnreadMessagesCount(this.student.id).subscribe({
      next: (count) => {
        this.unreadMessagesCount.set(count);
      },
      error: (error) => {
        console.error('Error loading unread messages count:', error);
      }
    });
  }

  /**
   * Navigate to subject and start from last lesson
   */
  enterSubject(subject: Subject): void {
    if (subject.lastLessonId) {
      // Continue from last lesson
      this.router.navigate(['/student/lessons', subject.lastLessonId]);
    } else {
      // Start from first lesson
      this.router.navigate(['/student/lessons'], {
        queryParams: { subjectId: subject.id, startFromFirst: true }
      });
    }
  }

  /**
   * View all lessons for a subject
   */
  viewSubjectLessons(subject: Subject): void {
    this.router.navigate(['/student/lessons'], {
      queryParams: { subjectId: subject.id }
    });
  }

  /**
   * Get progress color based on percentage
   */
  getProgressColor(percentage: number): string {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  /**
   * Format time ago for messages
   */
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`;
    } else if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`;
    } else {
      return `منذ ${diffInDays} يوم`;
    }
  }

  /**
   * Navigate to messages
   */
  viewAllMessages(): void {
    this.router.navigate(['/student/messages']);
  }
}
