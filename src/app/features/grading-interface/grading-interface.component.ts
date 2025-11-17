/**
 * Grading Interface Component
 * Teacher interface for manually grading student exam submissions
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExamService } from '../../core/services/exam.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExamQuestion, QuestionType } from '../../models/exam.models';

interface GradingQuestion {
  id: number;
  questionText: string;
  questionType: QuestionType;
  marks: number;
  order: number;
  studentAnswer: string | string[];
  correctAnswer?: string | string[];
  isAutoGraded: boolean;
  scoreGiven: number;
  feedback: string;
}

interface GradingData {
  studentExamId: number;
  studentName: string;
  studentEmail: string;
  examTitle: string;
  examType: string;
  totalMarks: number;
  submittedAt: Date;
  questions: GradingQuestion[];
  autoGradedScore: number;
  manualScore: number;
  totalScore: number;
  feedback: string;
  status: 'Pending' | 'Grading' | 'Completed';
}

@Component({
  selector: 'app-grading-interface',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grading-interface.component.html',
  styleUrl: './grading-interface.component.scss'
})
export class GradingInterfaceComponent implements OnInit {
  // Services
  private examService = inject(ExamService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  currentQuestionIndex = signal<number>(0);

  // Data
  studentExamId: number = 0;
  gradingData = signal<GradingData | null>(null);

  // Computed
  currentQuestion = computed(() => {
    const data = this.gradingData();
    if (!data) return null;
    return data.questions[this.currentQuestionIndex()] || null;
  });

  totalQuestions = computed(() => this.gradingData()?.questions.length || 0);

  progress = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    const current = this.currentQuestionIndex() + 1;
    return Math.round((current / total) * 100);
  });

  totalScore = computed(() => {
    const data = this.gradingData();
    if (!data) return 0;
    return data.questions.reduce((sum, q) => sum + q.scoreGiven, 0);
  });

  canMoveNext = computed(() => this.currentQuestionIndex() < this.totalQuestions() - 1);
  canMovePrevious = computed(() => this.currentQuestionIndex() > 0);
  isLastQuestion = computed(() => this.currentQuestionIndex() === this.totalQuestions() - 1);

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.role === 'Teacher') {
      this.loadGradingData();
    } else {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Load grading data from route
   */
  private loadGradingData(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.studentExamId = +id;
        this.loadSubmission(this.studentExamId);
      } else {
        this.router.navigate(['/teacher/exams']);
      }
    });
  }

  /**
   * Load student submission
   */
  private loadSubmission(studentExamId: number): void {
    this.loading.set(true);

    // Mock data for now
    setTimeout(() => {
      const mockData: GradingData = {
        studentExamId: studentExamId,
        studentName: 'Ahmed Hassan',
        studentEmail: 'ahmed.hassan@example.com',
        examTitle: 'Math Week 3 - Algebra Quiz',
        examType: 'Lesson',
        totalMarks: 50,
        submittedAt: new Date('2025-10-24T14:30:00'),
        autoGradedScore: 35,
        manualScore: 0,
        totalScore: 0,
        feedback: '',
        status: 'Pending',
        questions: [
          {
            id: 1,
            questionText: 'Solve for x: 2x + 5 = 15',
            questionType: QuestionType.Text,
            marks: 10,
            order: 1,
            studentAnswer: 'x = 5',
            correctAnswer: 'x = 5',
            isAutoGraded: false,
            scoreGiven: 0,
            feedback: ''
          },
          {
            id: 2,
            questionText: 'Explain the concept of algebraic expressions in your own words.',
            questionType: QuestionType.Text,
            marks: 15,
            order: 2,
            studentAnswer: 'An algebraic expression is a mathematical phrase that contains variables, numbers, and operators. It represents a value that can change depending on the variables used. For example, 2x + 3 is an algebraic expression where x is a variable.',
            isAutoGraded: false,
            scoreGiven: 0,
            feedback: ''
          },
          {
            id: 3,
            questionText: 'What is 2 + 2?',
            questionType: QuestionType.MultipleChoice,
            marks: 5,
            order: 3,
            studentAnswer: '4',
            correctAnswer: '4',
            isAutoGraded: true,
            scoreGiven: 5,
            feedback: 'Correct answer'
          },
          {
            id: 4,
            questionText: 'Simplify: 3(x + 2) - 2x',
            questionType: QuestionType.Text,
            marks: 10,
            order: 4,
            studentAnswer: 'x + 6',
            correctAnswer: 'x + 6',
            isAutoGraded: false,
            scoreGiven: 0,
            feedback: ''
          },
          {
            id: 5,
            questionText: 'True or False: In algebra, variables can only be represented by the letter x.',
            questionType: QuestionType.TrueFalse,
            marks: 5,
            order: 5,
            studentAnswer: 'False',
            correctAnswer: 'False',
            isAutoGraded: true,
            scoreGiven: 5,
            feedback: 'Correct answer'
          },
          {
            id: 6,
            questionText: 'Write the steps to solve a linear equation.',
            questionType: QuestionType.Text,
            marks: 5,
            order: 6,
            studentAnswer: '1. Simplify both sides\n2. Isolate the variable\n3. Solve for the variable',
            isAutoGraded: false,
            scoreGiven: 0,
            feedback: ''
          }
        ]
      };

      this.gradingData.set(mockData);
      this.loading.set(false);
    }, 1000);
  }

  /**
   * Navigate to next question
   */
  nextQuestion(): void {
    if (this.canMoveNext()) {
      this.currentQuestionIndex.update(i => i + 1);
    }
  }

  /**
   * Navigate to previous question
   */
  previousQuestion(): void {
    if (this.canMovePrevious()) {
      this.currentQuestionIndex.update(i => i - 1);
    }
  }

  /**
   * Go to specific question
   */
  goToQuestion(index: number): void {
    if (index >= 0 && index < this.totalQuestions()) {
      this.currentQuestionIndex.set(index);
    }
  }

  /**
   * Update score for current question
   */
  updateScore(score: number): void {
    const data = this.gradingData();
    const currentQ = this.currentQuestion();
    if (!data || !currentQ) return;

    if (score < 0 || score > currentQ.marks) {
      this.toastService.showError(`Score must be between 0 and ${currentQ.marks}`);
      return;
    }

    this.gradingData.update(d => {
      if (!d) return d;
      const updatedQuestions = [...d.questions];
      updatedQuestions[this.currentQuestionIndex()] = {
        ...updatedQuestions[this.currentQuestionIndex()],
        scoreGiven: score
      };
      return { ...d, questions: updatedQuestions };
    });
  }

  /**
   * Update feedback for current question
   */
  updateFeedback(feedback: string): void {
    this.gradingData.update(d => {
      if (!d) return d;
      const updatedQuestions = [...d.questions];
      updatedQuestions[this.currentQuestionIndex()] = {
        ...updatedQuestions[this.currentQuestionIndex()],
        feedback: feedback
      };
      return { ...d, questions: updatedQuestions };
    });
  }

  /**
   * Award full marks
   */
  awardFullMarks(): void {
    const currentQ = this.currentQuestion();
    if (currentQ) {
      this.updateScore(currentQ.marks);
      this.toastService.showSuccess('Full marks awarded');
    }
  }

  /**
   * Award zero marks
   */
  awardZeroMarks(): void {
    this.updateScore(0);
    this.toastService.showSuccess('Zero marks awarded');
  }

  /**
   * Award half marks
   */
  awardHalfMarks(): void {
    const currentQ = this.currentQuestion();
    if (currentQ) {
      const halfMarks = Math.round(currentQ.marks / 2);
      this.updateScore(halfMarks);
      this.toastService.showSuccess('Half marks awarded');
    }
  }

  /**
   * Save and move to next
   */
  saveAndNext(): void {
    if (this.canMoveNext()) {
      this.nextQuestion();
      this.toastService.showSuccess('Score saved');
    }
  }

  /**
   * Save grading and finish
   */
  saveGrading(): void {
    const data = this.gradingData();
    if (!data) return;

    // Check if all questions are graded
    const ungradedCount = data.questions.filter(q =>
      !q.isAutoGraded && q.scoreGiven === 0 && q.marks > 0
    ).length;

    if (ungradedCount > 0) {
      if (!confirm(`${ungradedCount} question(s) have not been graded. Continue anyway?`)) {
        return;
      }
    }

    this.saving.set(true);

    // Mock save
    setTimeout(() => {
      this.saving.set(false);
      this.toastService.showSuccess('Grading saved successfully');
      this.router.navigate(['/teacher/exams']);
    }, 1000);
  }

  /**
   * Submit final grades
   */
  submitGrading(): void {
    const data = this.gradingData();
    if (!data) return;

    // Check if all questions are graded
    const ungradedQuestions = data.questions.filter(q =>
      !q.isAutoGraded && q.scoreGiven === 0 && q.marks > 0
    );

    if (ungradedQuestions.length > 0) {
      this.toastService.showError('Please grade all questions before submitting');
      return;
    }

    if (!confirm('Submit final grades? Student will be able to view their results.')) {
      return;
    }

    this.saving.set(true);

    // Mock submit
    setTimeout(() => {
      this.saving.set(false);
      this.toastService.showSuccess('Grades submitted successfully');
      this.router.navigate(['/teacher/exams']);
    }, 1000);
  }

  /**
   * Cancel grading
   */
  cancel(): void {
    if (confirm('Cancel grading? Any unsaved changes will be lost.')) {
      this.router.navigate(['/teacher/exams']);
    }
  }

  /**
   * Get question status
   */
  getQuestionStatus(question: GradingQuestion): 'graded' | 'partial' | 'ungraded' | 'auto' {
    if (question.isAutoGraded) return 'auto';
    if (question.scoreGiven === 0) return 'ungraded';
    if (question.scoreGiven === question.marks) return 'graded';
    return 'partial';
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'ungraded':
        return 'bg-red-100 text-red-800';
      case 'auto':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get percentage
   */
  getPercentage(): number {
    const data = this.gradingData();
    if (!data || data.totalMarks === 0) return 0;
    return Math.round((this.totalScore() / data.totalMarks) * 100);
  }

  /**
   * Get grade color
   */
  getGradeColor(): string {
    const percentage = this.getPercentage();
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }
}
