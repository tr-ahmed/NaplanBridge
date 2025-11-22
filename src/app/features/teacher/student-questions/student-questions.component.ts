import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StudentQuestionService } from '../../../core/services/student-question.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-student-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './student-questions.component.html',
  styleUrl: './student-questions.component.scss'
})
export class StudentQuestionsComponent implements OnInit {
  private questionService = inject(StudentQuestionService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // State
  questions = signal<any[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  filterStatus = signal<'all' | 'pending' | 'answered'>('pending');
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = signal(10);

  // Answer form
  answerForm!: FormGroup;
  selectedQuestionId = signal<number | null>(null);
  submitting = signal(false);

  // Computed values
  filteredQuestions = computed(() => {
    let filtered = this.questions();

    // Filter by status
    if (this.filterStatus() === 'pending') {
      filtered = filtered.filter(q => !q.isAnswered);
    } else if (this.filterStatus() === 'answered') {
      filtered = filtered.filter(q => q.isAnswered);
    }

    // Filter by search term
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(q =>
        q.title?.toLowerCase().includes(term) ||
        q.questionText?.toLowerCase().includes(term)
      );
    }

    return filtered;
  });

  pendingCount = computed(() => this.questions().filter(q => !q.isAnswered).length);
  answeredCount = computed(() => this.questions().filter(q => q.isAnswered).length);
  totalCount = computed(() => this.questions().length);

  ngOnInit(): void {
    this.initForm();
    this.loadQuestions();
  }

  private initForm(): void {
    this.answerForm = this.fb.group({
      answerText: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(5000)
      ]]
    });
  }

  /**
   * Load questions from API
   */
  loadQuestions(): void {
    this.loading.set(true);
    this.error.set(null);

    // Get both pending and all questions
    this.questionService.getPendingQuestions().subscribe({
      next: (pendingQuestions: any) => {
        this.questionService.getAllQuestions().subscribe({
          next: (response: any) => {
            const allQuestions = response.data || response || [];
            // Combine pending and all questions, removing duplicates
            const combined = [
              ...pendingQuestions,
              ...allQuestions.filter((q: any) => !pendingQuestions.find((p: any) => p.id === q.id))
            ];
            this.questions.set(combined);
            this.loading.set(false);
          },
          error: (err: any) => {
            console.error('Error loading all questions:', err);
            // If getAllQuestions fails, just use pending questions
            this.questions.set(pendingQuestions);
            this.loading.set(false);
          }
        });
      },
      error: (err: any) => {
        console.error('Error loading pending questions:', err);
        this.error.set('Failed to load questions. Please try again.');
        this.toastService.showError('Failed to load questions');
        this.loading.set(false);
      }
    });
  }

  /**
   * Select a question to answer
   */
  selectQuestion(questionId: number): void {
    this.selectedQuestionId.set(this.selectedQuestionId() === questionId ? null : questionId);
    this.answerForm.reset();
  }

  /**
   * Submit answer
   */
  submitAnswer(questionId: number): void {
    if (!this.answerForm.valid) {
      this.toastService.showWarning('Please fill in the answer field');
      return;
    }

    this.submitting.set(true);

    const answerDto = {
      answerText: this.answerForm.get('answerText')?.value
    };

    this.questionService.answerQuestion(questionId, answerDto).subscribe({
      next: () => {
        this.toastService.showSuccess('Answer submitted successfully');
        this.answerForm.reset();
        this.selectedQuestionId.set(null);
        this.submitting.set(false);
        this.loadQuestions(); // Reload to update status
      },
      error: (err: any) => {
        console.error('Error submitting answer:', err);
        this.toastService.showError('Failed to submit answer');
        this.submitting.set(false);
      }
    });
  }

  /**
   * Cancel answering
   */
  cancelAnswer(): void {
    this.selectedQuestionId.set(null);
    this.answerForm.reset();
  }

  /**
   * Format date
   */
  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Get status badge color
   */
  getStatusColor(isAnswered: boolean): string {
    return isAnswered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  }

  /**
   * Get status text
   */
  getStatusText(isAnswered: boolean): string {
    return isAnswered ? 'Answered' : 'Pending';
  }
}
