import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DiscussionService, DiscussionDto, CreateReplyDto, DiscussionFilterParams } from '../../../core/services/discussion.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Teacher dashboard for managing lesson discussions
 * View, filter, and answer student discussions/questions
 */
@Component({
  selector: 'app-teacher-discussions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './teacher-discussions.component.html',
  styleUrls: ['./teacher-discussions.component.scss']
})
export class TeacherDiscussionsComponent implements OnInit {
  private discussionService = inject(DiscussionService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // State
  pendingDiscussions = signal<DiscussionDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Answer forms (keyed by discussion ID)
  answerForms: { [key: number]: FormGroup } = {};
  replyingToId = signal<number | null>(null);

  // Computed
  hasPendingDiscussions = computed(() => this.pendingDiscussions().length > 0);
  pendingCount = computed(() => this.pendingDiscussions().length);

  // Math for template
  Math = Math;

  ngOnInit(): void {
    this.loadPendingDiscussions();
  }

  /**
   * Load pending (unanswered) discussions
   */
  loadPendingDiscussions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.discussionService.getTeacherPendingDiscussions().subscribe({
      next: (discussions) => {
        this.pendingDiscussions.set(discussions);

        // Initialize reply forms for each discussion
        discussions.forEach((discussion) => {
          if (!this.answerForms[discussion.id]) {
            this.answerForms[discussion.id] = this.createReplyForm();
          }
        });

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading pending discussions:', err);
        this.error.set('Failed to load discussions. Please try again.');
        this.toastService.showError('Failed to load discussions');
        this.loading.set(false);
      }
    });
  }

  /**
   * Create reply form
   */
  createReplyForm(): FormGroup {
    return this.fb.group({
      reply: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5000)
      ]]
    });
  }

  /**
   * Submit reply to discussion
   */
  submitReply(discussionId: number): void {
    const form = this.answerForms[discussionId];
    if (!form || !form.valid) return;

    this.replyingToId.set(discussionId);
    this.error.set(null);

    const dto: CreateReplyDto = {
      reply: form.value.reply
    };

    this.discussionService.addReply(discussionId, dto).subscribe({
      next: (reply) => {
        // Remove from pending list (discussion is now answered)
        this.pendingDiscussions.update(discussions =>
          discussions.filter(d => d.id !== discussionId)
        );

        // Clear form
        form.reset();
        delete this.answerForms[discussionId];

        this.replyingToId.set(null);
        this.toastService.showSuccess('Reply sent successfully! Student will be notified.');
      },
      error: (err) => {
        console.error('Error submitting reply:', err);
        this.error.set(err.error?.message || 'Failed to submit reply. Please try again.');
        this.toastService.showError('Failed to submit reply');
        this.replyingToId.set(null);
      }
    });
  }

  /**
   * Refresh discussions
   */
  refresh(): void {
    this.loadPendingDiscussions();
  }

  /**
   * Format video timestamp (seconds) to MM:SS
   */
  formatVideoTimestamp(seconds?: number): string {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}
