import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
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
  SavedAnswerDto,
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
  examStartTime = signal<Date | null>(null);
  private timerSubscription?: Subscription;
  private autoSaveSubscription?: Subscription;
  private serverAutoSaveSubscription?: Subscription; // ✅ NEW: Server auto-save

  // UI State
  loading = signal(false);
  submitting = signal(false);
  showConfirmDialog = signal(false);
  isSubmitted = signal(false); // Track if exam has been submitted

  // Constants
  QuestionType = QuestionType;

  // Storage keys
  private get storageKey(): string {
    return `exam_state_${this.studentExamId()}`;
  }

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
    this.stopAutoSave();
    this.stopServerAutoSave(); // ✅ NEW
    this.saveExamState(); // Save state before leaving
    this.saveAnswersToServer(); // ✅ NEW: Save to server on exit
  }

  /**
   * Warn user before leaving page
   */
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (!this.submitting() && this.exam()) {
      $event.returnValue = 'You have an exam in progress. Are you sure you want to leave?';
      this.saveExamState(); // Save before user potentially leaves
    }
  }

  /**
   * Load exam data
   */
  loadExamData() {
    this.loading.set(true);

    // ✅ STEP 1: Try to restore from localStorage first
    const savedState = this.loadExamState();
    if (savedState) {
      console.log('📦 Found saved state in localStorage, verifying with backend...');
      this.verifyAndRestoreFromBackend(savedState);
      return;
    }

    // ✅ STEP 2: Try to get exam data from navigation state (fresh start)
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    console.log('📍 Navigation state:', state);

    if (state && state.examData && state.fromStart) {
      console.log('✅ Using exam data from navigation state (fresh start)');
      this.initializeFromNavigationState(state.examData);
      return;
    }

    // ✅ STEP 3: No local state, no navigation state - check backend for in-progress exam
    console.log('🔍 Checking backend for in-progress exam...');
    this.checkBackendForInProgressExam();
  }

  /**
   * ✅ NEW: Verify saved state with backend before restoring
   */
  private verifyAndRestoreFromBackend(savedState: any) {
    const studentExamId = savedState.studentExamId;

    this.examApi.getStudentExamStatus(studentExamId).subscribe({
      next: (response) => {
        const status = response.data;
        console.log('📊 Backend status:', status);

        if (status.canContinue && status.status === 'InProgress') {
          // ✅ Can continue - use backend data for time, restore local answers
          console.log('✅ Exam can be continued, restoring with backend time...');

          // Use exam data from backend if available, otherwise from local state
          if (status.examData) {
            this.initializeFromBackendResume(status, savedState);
          } else {
            this.restoreExamState(savedState);
          }
        } else if (status.status === 'Completed') {
          // ❌ Already submitted - redirect to result
          console.log('⚠️ Exam already completed, redirecting to result...');
          this.clearExamState();
          this.toast.showInfo('This exam has already been submitted');
          this.router.navigate(['/student/exam-result', studentExamId]);
        } else if (status.status === 'Expired') {
          // ❌ Time expired - redirect to result
          console.log('⚠️ Exam time expired, redirecting to result...');
          this.clearExamState();
          this.toast.showWarning('Exam time has expired. Your answers were auto-submitted.');
          this.router.navigate(['/student/exam-result', studentExamId]);
        } else {
          // Unknown status - fallback to local restore
          console.warn('⚠️ Unknown status, falling back to local restore');
          this.restoreExamState(savedState);
        }
      },
      error: (error) => {
        console.error('❌ Error checking exam status:', error);

        if (error.status === 404) {
          // Exam not found - clear state and redirect
          this.clearExamState();
          this.toast.showError('Exam not found');
          this.router.navigate(['/student/exams']);
        } else {
          // Network error - try local restore
          console.warn('⚠️ Network error, falling back to local restore');
          this.restoreExamState(savedState);
        }
      }
    });
  }

  /**
   * ✅ NEW: Initialize exam from backend resume data
   */
  private initializeFromBackendResume(status: any, savedState: any) {
    const examData = status.examData;

    // Convert backend data to ExamDto format
    const exam: ExamDto = {
      id: status.examId,
      title: examData.examTitle,
      description: '',
      examType: 'Lesson' as any,
      subjectId: 0,
      durationInMinutes: examData.durationInMinutes,
      totalMarks: examData.totalMarks,
      passingMarks: 0,
      startTime: status.startedAt,
      endTime: '',
      isPublished: true,
      questions: examData.questions?.map((q: any) => ({
        id: q.questionId,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        order: 0,
        isMultipleSelect: q.isMultipleSelect,
        options: q.options?.map((o: any) => ({
          id: o.optionId,
          optionText: o.optionText,
          isCorrect: false,
          order: 0
        })) || []
      })) || []
    };

    this.exam.set(exam);
    this.examStartTime.set(new Date(status.startedAt));
    this.timeRemaining.set(status.remainingTimeSeconds);

    // Restore answers - prefer backend saved answers, fallback to local
    const answersMap = new Map<number, ExamAnswerDto>();

    // First, load from backend
    if (status.savedAnswers && status.savedAnswers.length > 0) {
      status.savedAnswers.forEach((sa: SavedAnswerDto) => {
        answersMap.set(sa.questionId, {
          examQuestionId: sa.questionId,
          questionType: QuestionType.MultipleChoice, // Will be updated
          selectedOptionIds: sa.selectedOptionIds,
          answerText: sa.answerText
        });
      });
    }

    // Then, merge with local answers (local takes precedence for recent changes)
    if (savedState.answers && Array.isArray(savedState.answers)) {
      savedState.answers.forEach(([key, value]: [number, ExamAnswerDto]) => {
        answersMap.set(key, value);
      });
    }

    this.answers.set(answersMap);
    this.currentQuestionIndex.set(savedState.currentQuestionIndex || 0);

    this.startTimer();
    this.startAutoSave();
    this.startServerAutoSave(); // ✅ NEW: Also save to server
    this.loading.set(false);

    this.toast.showInfo('Exam resumed successfully');
  }

  /**
   * ✅ NEW: Check backend for in-progress exam (page refresh without local state)
   */
  private checkBackendForInProgressExam() {
    const studentExamId = this.studentExamId();

    this.examApi.getStudentExamStatus(studentExamId).subscribe({
      next: (response) => {
        const status = response.data;
        console.log('📊 Backend status (no local state):', status);

        if (status.canContinue && status.status === 'InProgress' && status.examData) {
          console.log('✅ Found in-progress exam on backend, resuming...');
          this.initializeFromBackendOnly(status);
        } else if (status.status === 'Completed') {
          console.log('⚠️ Exam already completed');
          this.toast.showInfo('This exam has already been submitted');
          this.router.navigate(['/student/exam-result', studentExamId]);
        } else if (status.status === 'Expired') {
          console.log('⚠️ Exam time expired');
          this.toast.showWarning('Exam time has expired');
          this.router.navigate(['/student/exam-result', studentExamId]);
        } else {
          // No exam found or can't continue
          console.error('❌ Cannot continue exam');
          this.loading.set(false);
          this.toast.showError('Unable to load exam. Please start from the exams list.');
          setTimeout(() => {
            this.router.navigate(['/student/exams']);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('❌ Error checking backend:', error);
        this.loading.set(false);
        this.toast.showError('Unable to load exam. Please start from the exams list.');
        setTimeout(() => {
          this.router.navigate(['/student/exams']);
        }, 2000);
      }
    });
  }

  /**
   * ✅ NEW: Initialize exam from backend data only (no local state)
   */
  private initializeFromBackendOnly(status: any) {
    const examData = status.examData;

    const exam: ExamDto = {
      id: status.examId,
      title: examData.examTitle,
      description: '',
      examType: 'Lesson' as any,
      subjectId: 0,
      durationInMinutes: examData.durationInMinutes,
      totalMarks: examData.totalMarks,
      passingMarks: 0,
      startTime: status.startedAt,
      endTime: '',
      isPublished: true,
      questions: examData.questions?.map((q: any) => ({
        id: q.questionId,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        order: 0,
        isMultipleSelect: q.isMultipleSelect,
        options: q.options?.map((o: any) => ({
          id: o.optionId,
          optionText: o.optionText,
          isCorrect: false,
          order: 0
        })) || []
      })) || []
    };

    this.exam.set(exam);
    this.examStartTime.set(new Date(status.startedAt));
    this.timeRemaining.set(status.remainingTimeSeconds);

    // Load saved answers from backend
    const answersMap = new Map<number, ExamAnswerDto>();
    if (status.savedAnswers && status.savedAnswers.length > 0) {
      status.savedAnswers.forEach((sa: SavedAnswerDto) => {
        answersMap.set(sa.questionId, {
          examQuestionId: sa.questionId,
          questionType: QuestionType.MultipleChoice,
          selectedOptionIds: sa.selectedOptionIds,
          answerText: sa.answerText
        });
      });
    }
    this.answers.set(answersMap);

    this.startTimer();
    this.startAutoSave();
    this.startServerAutoSave();
    this.loading.set(false);

    this.toast.showInfo('Exam resumed from server');
  }

  /**
   * ✅ NEW: Initialize from navigation state (fresh exam start)
   */
  private initializeFromNavigationState(examData: any) {
    const exam: ExamDto = {
      id: examData.examId,
      title: examData.examTitle || examData.title,
      description: examData.description || '',
      examType: examData.examType || 'Lesson',
      subjectId: examData.subjectId || 0,
      subjectName: examData.subjectName || '',
      termId: examData.termId,
      lessonId: examData.lessonId,
      weekId: examData.weekId,
      yearId: examData.yearId,
      durationInMinutes: examData.durationInMinutes,
      totalMarks: examData.totalMarks,
      passingMarks: examData.passingMarks || 0,
      startTime: examData.startedAt || new Date().toISOString(),
      endTime: examData.endTime || new Date().toISOString(),
      isPublished: true,
      questions: examData.questions || []
    };

    console.log('📚 Exam loaded from navigation:', exam);
    console.log('📝 Questions count:', exam.questions?.length || 0);

    if (!exam.questions || exam.questions.length === 0) {
      console.error('❌ No questions in exam data!');
      this.loading.set(false);
      this.toast.showError('Exam has no questions. Please contact support.');
      setTimeout(() => {
        this.router.navigate(['/student/exams']);
      }, 2000);
      return;
    }

    this.exam.set(exam);
    this.examStartTime.set(new Date());
    this.timeRemaining.set(exam.durationInMinutes * 60);
    this.startTimer();
    this.startAutoSave();
    this.startServerAutoSave(); // ✅ NEW: Also save to server
    this.saveExamState();
    this.loading.set(false);
  }

  /**
   * Start timer
   */
  startTimer() {
    this.stopTimer(); // Stop any existing timer
    this.timerSubscription = interval(1000).subscribe(() => {
      // Don't run timer if exam already submitted
      if (this.isSubmitted()) {
        console.log('⏹️ Timer stopped: Exam already submitted');
        this.stopTimer();
        return;
      }

      const remaining = this.timeRemaining();
      if (remaining > 0) {
        this.timeRemaining.set(remaining - 1);

        // Save state every 10 seconds
        if (remaining % 10 === 0) {
          this.saveExamState();
        }
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
      this.timerSubscription = undefined;
    }
  }

  /**
   * Start auto-save
   */
  startAutoSave() {
    this.stopAutoSave(); // Stop any existing auto-save
    // Auto-save every 30 seconds
    this.autoSaveSubscription = interval(30000).subscribe(() => {
      this.saveExamState();
    });
  }

  /**
   * Stop auto-save
   */
  stopAutoSave() {
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
      this.autoSaveSubscription = undefined;
    }
  }

  // ============================================
  // ✅ NEW: SERVER AUTO-SAVE METHODS
  // ============================================

  /**
   * Start server auto-save (every 30 seconds)
   */
  startServerAutoSave() {
    this.stopServerAutoSave();
    this.serverAutoSaveSubscription = interval(30000).subscribe(() => {
      this.saveAnswersToServer();
    });
  }

  /**
   * Stop server auto-save
   */
  stopServerAutoSave() {
    if (this.serverAutoSaveSubscription) {
      this.serverAutoSaveSubscription.unsubscribe();
      this.serverAutoSaveSubscription = undefined;
    }
  }

  /**
   * Save answers to server
   */
  saveAnswersToServer() {
    if (this.isSubmitted() || this.submitting()) {
      return;
    }

    const answers = this.answers();
    if (answers.size === 0) {
      return;
    }

    // Convert to SavedAnswerDto format
    const savedAnswers: SavedAnswerDto[] = Array.from(answers.entries()).map(([questionId, answer]) => ({
      questionId: questionId,
      selectedOptionIds: answer.selectedOptionIds || (answer.selectedOptionId ? [answer.selectedOptionId] : undefined),
      answerText: answer.answerText
    }));

    this.examApi.saveAnswers(this.studentExamId(), savedAnswers).subscribe({
      next: (response) => {
        console.log('💾 Answers saved to server:', response.data.savedAt);
        // Update remaining time from server (more accurate)
        if (response.data.remainingTimeSeconds !== undefined) {
          this.timeRemaining.set(response.data.remainingTimeSeconds);
        }
      },
      error: (error) => {
        console.error('❌ Failed to save answers to server:', error);

        // Check if exam expired
        if (error.error?.errors?.includes('EXAM_EXPIRED')) {
          this.stopTimer();
          this.stopAutoSave();
          this.stopServerAutoSave();
          this.toast.showWarning('Exam time has expired. Your answers were auto-submitted.');
          this.router.navigate(['/student/exam-result', this.studentExamId()]);
        }
      }
    });
  }

  /**
   * Save exam state to localStorage
   */
  saveExamState() {
    // Don't save if exam already submitted
    if (this.isSubmitted()) {
      return;
    }

    try {
      const state = {
        studentExamId: this.studentExamId(),
        exam: this.exam(),
        currentQuestionIndex: this.currentQuestionIndex(),
        answers: Array.from(this.answers().entries()),
        timeRemaining: this.timeRemaining(),
        examStartTime: this.examStartTime(),
        savedAt: new Date().toISOString()
      };

      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save exam state:', error);
    }
  }

  /**
   * Load exam state from localStorage
   */
  loadExamState(): any | null {
    try {
      const stateStr = localStorage.getItem(this.storageKey);
      if (!stateStr) return null;

      const state = JSON.parse(stateStr);

      // Check if state is not too old (e.g., more than 24 hours)
      const savedAt = new Date(state.savedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        localStorage.removeItem(this.storageKey);
        return null;
      }

      return state;
    } catch (error) {
      console.error('Failed to load exam state:', error);
      return null;
    }
  }

  /**
   * Restore exam state
   */
  restoreExamState(state: any) {
    try {
      // First, check if this exam was already submitted by calling the API
      this.examApi.getExamById(state.exam.id).subscribe({
        next: (exam) => {
          // If exam is loaded successfully, continue with restoration
          this.exam.set(state.exam);
          this.currentQuestionIndex.set(state.currentQuestionIndex || 0);
          this.examStartTime.set(state.examStartTime ? new Date(state.examStartTime) : new Date());

          // Restore answers
          const answersMap = new Map<number, ExamAnswerDto>();
          if (state.answers && Array.isArray(state.answers)) {
            state.answers.forEach(([key, value]: [number, ExamAnswerDto]) => {
              answersMap.set(key, value);
            });
          }
          this.answers.set(answersMap);

          // Calculate actual time remaining based on elapsed time
          const savedAt = new Date(state.savedAt);
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - savedAt.getTime()) / 1000);
          const adjustedTimeRemaining = Math.max(0, state.timeRemaining - elapsedSeconds);

          this.timeRemaining.set(adjustedTimeRemaining);

          // If time has run out, auto-submit
          if (adjustedTimeRemaining <= 0) {
            this.loading.set(false);
            this.autoSubmit();
            return;
          }

          this.startTimer();
          this.startAutoSave();
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading exam:', error);
          // If there's an error (maybe exam already submitted), clear state and redirect
          if (error.status === 409 || error.status === 404) {
            this.clearExamState();
            this.router.navigate(['/student/exams']);
            this.toast.showError('This exam is no longer available');
          } else {
            this.loading.set(false);
            this.toast.showError('Failed to load exam');
          }
        }
      });

      this.toast.showInfo('Previous exam state restored');
    } catch (error) {
      console.error('Failed to restore exam state:', error);
      this.toast.showError('Failed to restore exam state');
      this.router.navigate(['/student/exams']);
    }
  }

  /**
   * Clear exam state from localStorage
   */
  clearExamState() {
    try {
      // Mark as submitted to prevent further actions
      this.isSubmitted.set(true);

      // Stop all timers
      this.stopTimer();
      this.stopAutoSave();

      // Clear localStorage
      localStorage.removeItem(this.storageKey);

      console.log('✅ Exam state cleared successfully');
    } catch (error) {
      console.error('Failed to clear exam state:', error);
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

    // Auto-save state when answer changes
    this.saveExamState();
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
      if (!confirm(`You have answered ${answeredCount} out of ${totalQuestions} questions.\nDo you want to submit?`)) {
        return;
      }
    }

    this.showConfirmDialog.set(true);
  }

  /**
   * Submit exam
   */
  submitExam() {
    // Prevent duplicate submissions
    if (this.isSubmitted()) {
      console.log('⚠️ Submit blocked: Exam already submitted');
      return;
    }

    if (this.submitting()) {
      console.log('⚠️ Submit blocked: Already submitting');
      return;
    }

    this.submitting.set(true);
    this.stopTimer();
    this.stopAutoSave();

    const answersArray: ExamAnswerDto[] = Array.from(this.answers().values());

    const submission: SubmitExamDto = {
      studentExamId: this.studentExamId(),
      answers: answersArray
    };

    this.examApi.submitExam(submission).subscribe({
      next: (response) => {
        this.clearExamState(); // Clear saved state after successful submission
        this.toast.showSuccess(response.message);
        this.router.navigate(['/student/exam-result', response.studentExamId]);
      },
      error: (error: any) => {
        console.error('Failed to submit exam:', error);

        // Check if exam was already submitted (409 Conflict)
        if (error.status === 409 && error.error?.studentExamId) {
          console.log('Exam already submitted, redirecting to result...');
          this.clearExamState();
          this.router.navigate(['/student/exam-result', error.error.studentExamId]);
          return;
        }

        this.toast.showError('Failed to submit answers');
        this.submitting.set(false);
        this.startTimer();
        this.startAutoSave();
      }
    });
  }

  /**
   * Auto submit when time runs out
   */
  autoSubmit() {
    // Check if exam already submitted
    if (this.isSubmitted()) {
      console.log('⚠️ Auto-submit aborted: Exam already submitted');
      return;
    }

    this.stopTimer();
    this.toast.showWarning("Time's up! Your answers will be submitted automatically");

    setTimeout(() => {
      // Double-check before submitting
      if (!this.isSubmitted()) {
        this.submitExam();
      } else {
        console.log('⚠️ Auto-submit prevented: Exam was submitted during countdown');
      }
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
