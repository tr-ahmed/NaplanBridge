import { Component, Input, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StudentQuestionService } from '../../../core/services/student-question.service';
import { AuthService } from '../../../core/services/auth.service';
import { StudentQuestionDto, CreateStudentQuestionDto, UpdateStudentQuestionDto } from '../../../models/student-question.models';

/**
 * Component for student-teacher Q&A in lesson detail page
 * Allows students to ask questions and view teacher answers
 */
@Component({
  selector: 'app-lesson-qa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lesson-qa.component.html',
  styleUrls: ['./lesson-qa.component.scss']
})
export class LessonQaComponent implements OnInit {
  @Input({ required: true }) lessonId!: number;

  private questionService = inject(StudentQuestionService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // State signals
  questions = signal<StudentQuestionDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  isAskingQuestion = signal(false);
  editingQuestionId = signal<number | null>(null);

  // Forms
  questionForm: FormGroup;
  editForm: FormGroup;

  // Computed
  unansweredQuestions = computed(() =>
    this.questions().filter(q => !q.isAnswered)
  );

  answeredQuestions = computed(() =>
    this.questions().filter(q => q.isAnswered)
  );

  myQuestions = computed(() => {
    const userId = this.authService.getUserId();
    return this.questions().filter(q => q.studentId === userId);
  });

  hasQuestions = computed(() => this.questions().length > 0);

  isStudent = computed(() => this.authService.hasRole('student'));

  constructor() {
    this.questionForm = this.fb.group({
      questionText: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000)
      ]]
    });

    this.editForm = this.fb.group({
      questionText: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000)
      ]]
    });
  }

  ngOnInit(): void {
    this.loadQuestions();
  }

  /**
   * Load all questions for this lesson
   */
  loadQuestions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.questionService.getQuestionsByLesson(this.lessonId)
      .subscribe({
        next: (questions) => {
          this.questions.set(questions);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading questions:', err);
          this.error.set('Failed to load questions. Please try again.');
          this.loading.set(false);
        }
      });
  }

  /**
   * Student submits a new question
   */
  submitQuestion(): void {
    if (!this.questionForm.valid) return;

    this.isAskingQuestion.set(true);
    this.error.set(null);

    const dto: CreateStudentQuestionDto = {
      lessonId: this.lessonId,
      questionText: this.questionForm.value.questionText
    };

    this.questionService.createQuestion(dto)
      .subscribe({
        next: (newQuestion) => {
          // Add new question to the list
          this.questions.update(q => [newQuestion, ...q]);
          this.questionForm.reset();
          this.isAskingQuestion.set(false);
        },
        error: (err) => {
          console.error('Error creating question:', err);
          this.error.set(err.error?.message || 'Failed to submit question. Please try again.');
          this.isAskingQuestion.set(false);
        }
      });
  }

  /**
   * Start editing a question
   */
  startEdit(question: StudentQuestionDto): void {
    if (question.isAnswered) return; // Cannot edit answered questions

    this.editingQuestionId.set(question.id);
    this.editForm.patchValue({
      questionText: question.questionText
    });
  }

  /**
   * Cancel editing
   */
  cancelEdit(): void {
    this.editingQuestionId.set(null);
    this.editForm.reset();
  }

  /**
   * Save edited question
   */
  saveEdit(questionId: number): void {
    if (!this.editForm.valid) return;

    this.loading.set(true);

    const dto: UpdateStudentQuestionDto = {
      questionText: this.editForm.value.questionText
    };

    this.questionService.updateQuestion(questionId, dto)
      .subscribe({
        next: () => {
          // Update the question in the list
          this.questions.update(questions =>
            questions.map(q =>
              q.id === questionId
                ? { ...q, questionText: dto.questionText }
                : q
            )
          );
          this.editingQuestionId.set(null);
          this.editForm.reset();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error updating question:', err);
          this.error.set('Failed to update question. Please try again.');
          this.loading.set(false);
        }
      });
  }

  /**
   * Delete a question
   */
  deleteQuestion(questionId: number): void {
    if (!confirm('Are you sure you want to delete this question?')) return;

    this.loading.set(true);

    this.questionService.deleteQuestion(questionId)
      .subscribe({
        next: () => {
          // Remove from list
          this.questions.update(q => q.filter(question => question.id !== questionId));
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error deleting question:', err);
          this.error.set('Failed to delete question. Please try again.');
          this.loading.set(false);
        }
      });
  }

  /**
   * Check if current user owns the question
   */
  canEditQuestion(question: StudentQuestionDto): boolean {
    const userId = this.authService.getUserId();
    return question.studentId === userId && !question.isAnswered;
  }

  /**
   * Check if current user can delete the question
   */
  canDeleteQuestion(question: StudentQuestionDto): boolean {
    const userId = this.authService.getUserId();
    const isOwner = question.studentId === userId && !question.isAnswered;
    const isAdmin = this.authService.hasRole('admin');
    return isOwner || isAdmin;
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
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
