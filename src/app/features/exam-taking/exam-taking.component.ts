/**
 * Exam Taking Component
 * Full exam system with timer, all question types, and auto-submit
 * Supports: Text, MCQ, MultiSelect, TrueFalse questions
 */

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { ExamService } from '../../core/services/exam.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  ExamDetails,
  ExamQuestion,
  QuestionType,
  StudentExamSession,
  ExamSubmission,
  ExamAnswer
} from '../../models/exam.models';

@Component({
  selector: 'app-exam-taking',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './exam-taking.component.html',
  styleUrl: './exam-taking.component.scss'
})
export class ExamTakingComponent implements OnInit, OnDestroy {
  // Services
  private examService = inject(ExamService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  router = inject(Router); // public for template access
  private fb = inject(FormBuilder);

  // State signals
  exam = signal<ExamDetails | null>(null);
  examSession = signal<StudentExamSession | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  submitting = signal<boolean>(false);

  // Exam state
  examId: number = 0;
  studentId: number = 0;
  currentQuestionIndex = signal<number>(0);
  answers = new Map<number, ExamAnswer>();
  examStarted = signal<boolean>(false);
  examCompleted = signal<boolean>(false);

  // Timer
  timeRemaining = signal<number>(0); // in seconds
  timerSubscription?: Subscription;

  // Computed values
  currentQuestion = computed(() => {
    const examData = this.exam();
    const index = this.currentQuestionIndex();
    return examData?.questions?.[index] || null;
  });

  totalQuestions = computed(() => this.exam()?.questions?.length || 0);
  answeredCount = computed(() => this.answers.size);
  progressPercentage = computed(() => {
    const total = this.totalQuestions();
    const answered = this.answeredCount();
    return total > 0 ? Math.round((answered / total) * 100) : 0;
  });

  timeRemainingFormatted = computed(() => {
    const seconds = this.timeRemaining();
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  timeWarning = computed(() => {
    const seconds = this.timeRemaining();
    const examData = this.exam();
    if (!examData) return false;
    const totalSeconds = examData.durationInMinutes * 60;
    return seconds <= totalSeconds * 0.1; // Warning when 10% time left
  });

  // Question Types for template access
  readonly QuestionTypeEnum = {
    TEXT: 'Text' as QuestionType,
    MULTIPLE_CHOICE: 'MultipleChoice' as QuestionType,
    MULTIPLE_SELECT: 'MultipleSelect' as QuestionType,
    TRUE_FALSE: 'TrueFalse' as QuestionType
  };

  ngOnInit(): void {
    // Get exam ID from route
    this.route.params.subscribe(params => {
      this.examId = +params['id'];
      if (this.examId) {
        this.loadExam();
      }
    });

    // Get current user (student)
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.studentId = currentUser.id;
    }
  }

  ngOnDestroy(): void {
    // Stop timer
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  /**
   * Load exam details
   */
  private loadExam(): void {
    this.loading.set(true);
    this.error.set(null);

    this.examService.getExamById(this.examId).subscribe({
      next: (exam) => {
        this.exam.set(exam);
        this.loading.set(false);

        // Check if exam is published
        if (!exam.isPublished) {
          this.error.set('This exam is not available yet');
          this.toastService.showError('This exam is not available yet');
        }
      },
      error: (err) => {
        this.error.set('Failed to load exam');
        this.loading.set(false);
        this.toastService.showError('Failed to load exam');
        console.error('Error loading exam:', err);
      }
    });
  }

  /**
   * Start the exam
   */
  startExam(): void {
    if (!this.studentId || !this.examId) return;

    this.loading.set(true);

    this.examService.startExam(this.examId).subscribe({
      next: (session) => {
        this.examSession.set(session);
        this.examStarted.set(true);
        this.loading.set(false);

        // Initialize timer
        const examData = this.exam();
        if (examData) {
          this.timeRemaining.set(examData.durationInMinutes * 60);
          this.startTimer();
        }

        this.toastService.showSuccess('Exam started! Good luck! 🍀');
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.showError('Failed to start exam');
        console.error('Error starting exam:', err);
      }
    });
  }

  /**
   * Start countdown timer
   */
  private startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      const remaining = this.timeRemaining();

      if (remaining <= 0) {
        // Time's up! Auto-submit
        this.autoSubmitExam();
        this.timerSubscription?.unsubscribe();
      } else {
        this.timeRemaining.set(remaining - 1);

        // Warning at 5 minutes
        if (remaining === 300) {
          this.toastService.showWarning('5 minutes remaining!');
        }

        // Warning at 1 minute
        if (remaining === 60) {
          this.toastService.showWarning('1 minute remaining!');
        }
      }
    });
  }

  /**
   * Navigate to question
   */
  goToQuestion(index: number): void {
    if (index >= 0 && index < this.totalQuestions()) {
      this.currentQuestionIndex.set(index);
    }
  }

  /**
   * Go to next question
   */
  nextQuestion(): void {
    const nextIndex = this.currentQuestionIndex() + 1;
    if (nextIndex < this.totalQuestions()) {
      this.currentQuestionIndex.set(nextIndex);
    }
  }

  /**
   * Go to previous question
   */
  previousQuestion(): void {
    const prevIndex = this.currentQuestionIndex() - 1;
    if (prevIndex >= 0) {
      this.currentQuestionIndex.set(prevIndex);
    }
  }

  /**
   * Check if question is answered
   */
  isQuestionAnswered(questionId: number): boolean {
    return this.answers.has(questionId);
  }

  /**
   * Get answer for question
   */
  getAnswer(questionId: number): ExamAnswer | undefined {
    return this.answers.get(questionId);
  }

  /**
   * Handle text answer
   */
  onTextAnswer(questionId: number, event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    const answer: ExamAnswer = {
      questionId: questionId,
      textAnswer: input.value
    };
    this.answers.set(questionId, answer);
  }

  /**
   * Handle MCQ answer (single choice)
   */
  onMCQAnswer(questionId: number, optionId: number): void {
    const answer: ExamAnswer = {
      questionId: questionId,
      selectedOptionId: optionId
    };
    this.answers.set(questionId, answer);
  }

  /**
   * Handle MultiSelect answer
   */
  onMultiSelectAnswer(questionId: number, optionId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const existingAnswer = this.answers.get(questionId);

    let selectedIds: number[] = existingAnswer?.selectedOptionIds || [];

    if (checkbox.checked) {
      // Add option
      if (!selectedIds.includes(optionId)) {
        selectedIds.push(optionId);
      }
    } else {
      // Remove option
      selectedIds = selectedIds.filter(id => id !== optionId);
    }

    const answer: ExamAnswer = {
      questionId: questionId,
      selectedOptionIds: selectedIds
    };

    this.answers.set(questionId, answer);
  }

  /**
   * Handle True/False answer
   */
  onTrueFalseAnswer(questionId: number, optionId: number): void {
    const answer: ExamAnswer = {
      questionId: questionId,
      selectedOptionId: optionId
    };
    this.answers.set(questionId, answer);
  }

  /**
   * Check if MCQ option is selected
   */
  isMCQSelected(questionId: number, optionId: number): boolean {
    const answer = this.answers.get(questionId);
    return answer?.selectedOptionId === optionId;
  }

  /**
   * Check if MultiSelect option is selected
   */
  isMultiSelectSelected(questionId: number, optionId: number): boolean {
    const answer = this.answers.get(questionId);
    return answer?.selectedOptionIds?.includes(optionId) || false;
  }

  /**
   * Get True/False answer
   */
  getTrueFalseAnswer(questionId: number): number | undefined {
    const answer = this.answers.get(questionId);
    return answer?.selectedOptionId;
  }

  /**
   * Submit exam
   */
  submitExam(): void {
    // Confirm submission
    if (!confirm('Are you sure you want to submit the exam? You cannot change your answers after submission.')) {
      return;
    }

    this.performSubmission();
  }

  /**
   * Auto-submit when time runs out
   */
  private autoSubmitExam(): void {
    this.toastService.showWarning("Time's up! Submitting your exam...");
    this.performSubmission();
  }

  /**
   * Perform exam submission
   */
  private performSubmission(): void {
    const examData = this.exam();
    const sessionData = this.examSession();

    if (!examData || !sessionData) return;

    this.submitting.set(true);

    // Convert answers Map to array
    const answersArray: ExamAnswer[] = Array.from(this.answers.values());

    const submission: ExamSubmission = {
      studentExamId: sessionData.studentExamId,
      answers: answersArray
    };

    this.examService.submitExam(this.examId, submission).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.examCompleted.set(true);

        // Stop timer
        if (this.timerSubscription) {
          this.timerSubscription.unsubscribe();
        }

        this.toastService.showSuccess('Exam submitted successfully! 🎉');

        // Navigate to results page
        setTimeout(() => {
          this.router.navigate(['/exam/result', result.studentExamId]);
        }, 2000);
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.showError('Failed to submit exam. Please try again.');
        console.error('Error submitting exam:', err);
      }
    });
  }

  /**
   * Flag question for review
   */
  flagQuestion(questionId: number): void {
    // TODO: Implement flag/bookmark functionality
    this.toastService.showInfo('Question flagged for review');
  }

  /**
   * Cancel exam
   */
  cancelExam(): void {
    if (confirm('Are you sure you want to exit? Your progress will not be saved.')) {
      this.router.navigate(['/student/exams']);
    }
  }
}
