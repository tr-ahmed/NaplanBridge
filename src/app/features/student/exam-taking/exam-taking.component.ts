import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { ExamApiService } from '../../../core/services/exam-api.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ExamDto,
  SubmitExamDto,
  ExamAnswerDto,
  QuestionType,
  getQuestionTypeLabel,
  getQuestionTypeIcon
} from '../../../models/exam-api.models';

@Component({
  selector: 'app-exam-taking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-taking.component.html',
  styleUrls: ['./exam-taking.component.scss']
})
export class ExamTakingComponent implements OnInit, OnDestroy {
  // Data
  studentExamId = signal<number>(0);
  exam = signal<ExamDto | null>(null);
  currentQuestionIndex = signal<number>(0);
  answers = signal<Map<number, ExamAnswerDto>>(new Map());

  // Timer
  timeRemaining = signal<number>(0);
  private timerSubscription?: Subscription;

  // UI State
  loading = signal(false);
  submitting = signal(false);
  showConfirmDialog = signal(false);

  // Constants
  QuestionType = QuestionType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examApi: ExamApiService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.studentExamId.set(+id);
    this.loadExamData();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  /**
   * Load exam data
   */
  loadExamData() {
    this.loading.set(true);

    // In a real scenario, you would get the exam ID from the start exam response
    // For now, we'll simulate it
    const examId = 1; // This should come from the start exam response

    this.examApi.getExamById(examId).subscribe({
      next: (exam) => {
        this.exam.set(exam);
        this.timeRemaining.set(exam.durationInMinutes * 60); // Convert to seconds
        this.startTimer();
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load exam:', error);
        this.toast.showError('فشل تحميل الامتحان');
        this.router.navigate(['/student/exams']);
      }
    });
  }

  /**
   * Start timer
   */
  startTimer() {
    this.timerSubscription = interval(1000).subscribe(() => {
      const remaining = this.timeRemaining();
      if (remaining > 0) {
        this.timeRemaining.set(remaining - 1);
      } else {
        this.autoSubmit();
      }
    });
  }

  /**
   * Stop timer
   */
  stopTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  /**
   * Get formatted time
   */
  getFormattedTime(): string {
    const seconds = this.timeRemaining();
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Navigate to question
   */
  goToQuestion(index: number) {
    this.currentQuestionIndex.set(index);
  }

  /**
   * Next question
   */
  nextQuestion() {
    const exam = this.exam();
    if (!exam) return;

    const current = this.currentQuestionIndex();
    if (current < exam.questions!.length - 1) {
      this.currentQuestionIndex.set(current + 1);
    }
  }

  /**
   * Previous question
   */
  previousQuestion() {
    const current = this.currentQuestionIndex();
    if (current > 0) {
      this.currentQuestionIndex.set(current - 1);
    }
  }

  /**
   * Save answer
   */
  saveAnswer(questionId: number, answer: ExamAnswerDto) {
    const answers = this.answers();
    answers.set(questionId, answer);
    this.answers.set(new Map(answers));
  }

  /**
   * Handle MCQ answer
   */
  handleMCQAnswer(questionId: number, optionId: number, questionType: QuestionType) {
    this.saveAnswer(questionId, {
      examQuestionId: questionId,
      questionType: questionType,
      selectedOptionId: optionId
    });
  }

  /**
   * Handle multiple select answer
   */
  handleMultipleSelectAnswer(questionId: number, optionId: number, questionType: QuestionType) {
    const answers = this.answers();
    const current = answers.get(questionId);

    let selectedIds = current?.selectedOptionIds || [];

    if (selectedIds.includes(optionId)) {
      selectedIds = selectedIds.filter(id => id !== optionId);
    } else {
      selectedIds = [...selectedIds, optionId];
    }

    this.saveAnswer(questionId, {
      examQuestionId: questionId,
      questionType: questionType,
      selectedOptionIds: selectedIds
    });
  }

  /**
   * Handle text answer
   */
  handleTextAnswer(questionId: number, text: string, questionType: QuestionType) {
    this.saveAnswer(questionId, {
      examQuestionId: questionId,
      questionType: questionType,
      answerText: text
    });
  }

  /**
   * Check if answer is selected
   */
  isAnswered(questionId: number): boolean {
    return this.answers().has(questionId);
  }

  /**
   * Get current question
   */
  getCurrentQuestion() {
    const exam = this.exam();
    if (!exam || !exam.questions) return null;

    return exam.questions[this.currentQuestionIndex()];
  }

  /**
   * Show submit confirmation
   */
  confirmSubmit() {
    const exam = this.exam();
    if (!exam) return;

    const totalQuestions = exam.questions?.length || 0;
    const answeredCount = this.answers().size;

    if (answeredCount < totalQuestions) {
      if (!confirm(`لقد أجبت على ${answeredCount} من ${totalQuestions} سؤال.\nهل تريد الإرسال؟`)) {
        return;
      }
    }

    this.showConfirmDialog.set(true);
  }

  /**
   * Submit exam
   */
  submitExam() {
    this.submitting.set(true);
    this.stopTimer();

    const answersArray: ExamAnswerDto[] = Array.from(this.answers().values());

    const submission: SubmitExamDto = {
      studentExamId: this.studentExamId(),
      answers: answersArray
    };

    this.examApi.submitExam(submission).subscribe({
      next: (response) => {
        this.toast.showSuccess(response.message);
        this.router.navigate(['/student/exam-result', response.studentExamId]);
      },
      error: (error: any) => {
        console.error('Failed to submit exam:', error);
        this.toast.showError('فشل إرسال الإجابات');
        this.submitting.set(false);
        this.startTimer();
      }
    });
  }

  /**
   * Auto submit when time runs out
   */
  autoSubmit() {
    this.stopTimer();
    this.toast.showWarning('انتهى الوقت! سيتم إرسال إجاباتك تلقائياً');

    setTimeout(() => {
      this.submitExam();
    }, 2000);
  }

  /**
   * Cancel submit
   */
  cancelSubmit() {
    this.showConfirmDialog.set(false);
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    const exam = this.exam();
    if (!exam || !exam.questions) return 0;

    return Math.round((this.answers().size / exam.questions.length) * 100);
  }

  /**
   * Get question type label
   */
  getQuestionTypeLabel(type: QuestionType): string {
    return getQuestionTypeLabel(type);
  }

  /**
   * Get question type icon
   */
  getQuestionTypeIcon(type: QuestionType): string {
    return getQuestionTypeIcon(type);
  }
}
