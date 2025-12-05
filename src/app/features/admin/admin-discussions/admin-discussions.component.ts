import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DiscussionService, DiscussionDto, CreateReplyDto, DiscussionFilterParams, PagedDiscussionDto } from '../../../core/services/discussion.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Admin dashboard for managing all lesson discussions
 * View, filter, answer, and delete discussions
 */
@Component({
  selector: 'app-admin-discussions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-discussions.component.html',
  styleUrls: ['./admin-discussions.component.scss']
})
export class AdminDiscussionsComponent implements OnInit {
  private discussionService = inject(DiscussionService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // State
  discussions = signal<DiscussionDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'pending' | 'all'>('pending');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalCount = signal(0);
  totalPages = signal(0);

  // Filters
  showAnsweredOnly = signal(false);
  sortBy = signal<'CreatedAt' | 'RepliesCount' | 'HelpfulCount'>('CreatedAt');
  sortOrder = signal<'Asc' | 'Desc'>('Desc');

  // Answer forms (keyed by discussion ID)
  answerForms: { [key: number]: FormGroup } = {};
  replyingToId = signal<number | null>(null);
  deletingId = signal<number | null>(null);

  // Computed
  hasDiscussions = computed(() => this.discussions().length > 0);
  pendingCount = computed(() => this.discussions().filter(d => !d.isAnswered).length);

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
        this.discussions.set(discussions);

        // Initialize reply forms
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
   * Switch tabs
   */
  switchTab(tab: 'pending' | 'all'): void {
    this.activeTab.set(tab);
    if (tab === 'pending') {
      this.loadPendingDiscussions();
    }
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
        // Update discussion in list
        this.discussions.update(discussions =>
          discussions.map(d => {
            if (d.id === discussionId) {
              return {
                ...d,
                isAnswered: true,
                repliesCount: d.repliesCount + 1,
                replies: [...d.replies, reply]
              };
            }
            return d;
          })
        );

        // Clear form
        form.reset();
        delete this.answerForms[discussionId];

        this.replyingToId.set(null);
        this.toastService.showSuccess('Reply sent successfully!');
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
   * Delete discussion (Admin only)
   */
  deleteDiscussion(discussionId: number): void {
    if (!confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
      return;
    }

    this.deletingId.set(discussionId);

    this.discussionService.deleteDiscussion(discussionId).subscribe({
      next: () => {
        // Remove from list
        this.discussions.update(discussions =>
          discussions.filter(d => d.id !== discussionId)
        );

        this.deletingId.set(null);
        this.toastService.showSuccess('Discussion deleted successfully');
      },
      error: (err) => {
        console.error('Error deleting discussion:', err);
        this.toastService.showError('Failed to delete discussion');
        this.deletingId.set(null);
      }
    });
  }

  /**
   * Refresh discussions
   */
  refresh(): void {
    if (this.activeTab() === 'pending') {
      this.loadPendingDiscussions();
    }
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
