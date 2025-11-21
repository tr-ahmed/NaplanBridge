import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StudentQuestionService } from '../../core/services/student-question.service';
import { SubjectService } from '../../core/services/subject.service';
import { TermService } from '../../core/services/term.service';
import {
  StudentQuestionDto,
  AnswerStudentQuestionDto,
  StudentQuestionFilters,
  PaginatedQuestionsResponse
} from '../../models/student-question.models';/**
 * Teacher dashboard for managing student questions
 * View, filter, and answer student questions
 */
@Component({
  selector: 'app-teacher-questions-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './teacher-questions-dashboard.component.html',
  styleUrls: ['./teacher-questions-dashboard.component.scss']
})
export class TeacherQuestionsDashboardComponent implements OnInit {
  private questionService = inject(StudentQuestionService);
  private subjectService = inject(SubjectService);
  private termService = inject(TermService);
  private fb = inject(FormBuilder);

  // State
  pendingQuestions = signal<StudentQuestionDto[]>([]);
  allQuestions = signal<StudentQuestionDto[]>([]);
  subjects = signal<any[]>([]);
  terms = signal<any[]>([]);

  loading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'pending' | 'all'>('pending');

  // Pagination for "all" tab
  currentPage = signal(1);
  pageSize = signal(20);
  totalCount = signal(0);
  totalPages = signal(0);

  // Filters
  selectedSubjectId = signal<number | null>(null);
  selectedTermId = signal<number | null>(null);
  showAnsweredOnly = signal(false);

  // Answer forms (keyed by question ID)
  answerForms: { [key: number]: FormGroup } = {};
  answeringQuestionId = signal<number | null>(null);

  // Computed
  hasPendingQuestions = computed(() => this.pendingQuestions().length > 0);
  pendingCount = computed(() => this.pendingQuestions().length);

  // Math for template
  Math = Math;

  ngOnInit(): void {
    this.loadSubjects();
    this.loadTerms();
    this.loadPendingQuestions();
  }

  /**
   * Load subjects for filter dropdown
   */
  loadSubjects(): void {
    this.subjectService.getSubjects({}).subscribe({
      next: (result: any) => this.subjects.set(result.data || result),
      error: (err: any) => console.error('Error loading subjects:', err)
    });
  }

  /**
   * Load terms for filter dropdown
   */
  loadTerms(): void {
    this.termService.getTerms().subscribe({
      next: (result: any) => this.terms.set(result.data || result),
      error: (err: any) => console.error('Error loading terms:', err)
    });
  }

  /**
   * Load pending questions
   */
  loadPendingQuestions(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: StudentQuestionFilters = {};
    if (this.selectedSubjectId()) filters.subjectId = this.selectedSubjectId()!;
    if (this.selectedTermId()) filters.termId = this.selectedTermId()!;

    this.questionService.getPendingQuestions(filters).subscribe({
      next: (questions: StudentQuestionDto[]) => {
        this.pendingQuestions.set(questions);

        // Initialize answer forms for each question
        questions.forEach((q: StudentQuestionDto) => {
          if (!this.answerForms[q.id]) {
            this.answerForms[q.id] = this.createAnswerForm();
          }
        });

        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading pending questions:', err);
        this.error.set('Failed to load questions. Please try again.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Load all questions with pagination
   */
  loadAllQuestions(page: number = 1): void {
    this.loading.set(true);
    this.error.set(null);
    this.currentPage.set(page);

    const filters: StudentQuestionFilters = {
      page,
      pageSize: this.pageSize()
    };

    if (this.selectedSubjectId()) filters.subjectId = this.selectedSubjectId()!;
    if (this.selectedTermId()) filters.termId = this.selectedTermId()!;
    if (this.showAnsweredOnly()) filters.isAnswered = true;

    this.questionService.getAllQuestions(filters).subscribe({
      next: (response: PaginatedQuestionsResponse) => {
        this.allQuestions.set(response.data);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);

        // Initialize answer forms for unanswered questions
        response.data.filter((q: StudentQuestionDto) => !q.isAnswered).forEach((q: StudentQuestionDto) => {
          if (!this.answerForms[q.id]) {
            this.answerForms[q.id] = this.createAnswerForm();
          }
        });

        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading all questions:', err);
        this.error.set('Failed to load questions. Please try again.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Create answer form
   */
  createAnswerForm(): FormGroup {
    return this.fb.group({
      answerText: ['', [
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
      this.loadPendingQuestions();
    } else {
      this.loadAllQuestions();
    }
  }

  /**
   * Handle subject filter change
   */
  onSubjectFilterChange(subjectId: string): void {
    this.selectedSubjectId.set(subjectId ? parseInt(subjectId) : null);
    this.refreshCurrentTab();
  }

  /**
   * Handle term filter change
   */
  onTermFilterChange(termId: string): void {
    this.selectedTermId.set(termId ? parseInt(termId) : null);
    this.refreshCurrentTab();
  }

  /**
   * Toggle answered filter
   */
  toggleAnsweredFilter(): void {
    this.showAnsweredOnly.update(v => !v);
    if (this.activeTab() === 'all') {
      this.loadAllQuestions(1);
    }
  }

  /**
   * Refresh current tab
   */
  refreshCurrentTab(): void {
    if (this.activeTab() === 'pending') {
      this.loadPendingQuestions();
    } else {
      this.loadAllQuestions(1);
    }
  }

  /**
   * Submit answer to question
   */
  submitAnswer(questionId: number): void {
    const form = this.answerForms[questionId];
    if (!form || !form.valid) return;

    this.answeringQuestionId.set(questionId);
    this.error.set(null);

    const dto: AnswerStudentQuestionDto = {
      answerText: form.value.answerText
    };

    this.questionService.answerQuestion(questionId, dto).subscribe({
      next: (updatedQuestion: StudentQuestionDto) => {
        // Remove from pending list
        this.pendingQuestions.update(questions =>
          questions.filter(q => q.id !== questionId)
        );

        // Update in all questions list
        this.allQuestions.update(questions =>
          questions.map(q => q.id === questionId ? updatedQuestion : q)
        );

        // Clear form
        form.reset();
        delete this.answerForms[questionId];

        this.answeringQuestionId.set(null);
      },
      error: (err: any) => {
        console.error('Error answering question:', err);
        this.error.set(err.error?.message || 'Failed to submit answer. Please try again.');
        this.answeringQuestionId.set(null);
      }
    });
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.loadAllQuestions(page);
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, -1, total);
      } else if (current >= total - 2) {
        pages.push(1, -1, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, -1, current - 1, current, current + 1, -1, total);
      }
    }

    return pages;
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
