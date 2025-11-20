import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExamApiService } from '../../../core/services/exam-api.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ExamSubmissionDto,
  SubmissionDetailDto,
  GradeSubmissionDto,
  QuestionGradeDto,
  QuestionType,
  getQuestionTypeLabel
} from '../../../models/exam-api.models';

@Component({
  selector: 'app-exam-grading',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-grading.component.html',
  styleUrls: ['./exam-grading.component.scss']
})
export class ExamGradingComponent implements OnInit {
  // Data
  examId = signal<number>(0);
  examTitle = signal<string>('');
  submissions = signal<ExamSubmissionDto[]>([]);
  selectedSubmission = signal<SubmissionDetailDto | null>(null);

  // Grading form
  questionGrades = signal<Map<number, { score: number; feedback: string }>>(new Map());
  generalFeedback = signal<string>('');

  // UI State
  loading = signal(false);
  grading = signal(false);
  selectedFilter = signal<string>('all');

  // Constants
  QuestionType = QuestionType;

  // Computed values
  pendingGradingCount = computed(() =>
    this.submissions().filter(s => !s.isGraded && s.isCompleted).length
  );

  manualGradingCount = computed(() =>
    this.submissions().filter(s => s.pendingManualGrading).length
  );

  gradedCount = computed(() =>
    this.submissions().filter(s => s.isGraded).length
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examApi: ExamApiService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.examId.set(+this.route.snapshot.params['id']);
    this.loadSubmissions();
  }

  /**
   * Load exam submissions
   */
  loadSubmissions() {
    this.loading.set(true);

    this.examApi.getExamSubmissions(this.examId()).subscribe({
      next: (response: any) => {
        this.submissions.set(response.data);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load submissions:', error);
        this.toast.showError('Failed to load student submissions');
        this.loading.set(false);
      }
    });
  }

  /**
   * View submission details
   */
  viewSubmission(studentExamId: number) {
    this.loading.set(true);

    this.examApi.getSubmissionDetail(studentExamId).subscribe({
      next: (response: any) => {
        const submission = response.data;
        this.selectedSubmission.set(submission);
        this.examTitle.set(submission.examTitle);

        // Initialize grading form
        const grades = new Map();
        submission.questions.forEach((q: any) => {
          grades.set(q.questionId, {
            score: q.earnedScore || 0,
            feedback: q.teacherFeedback || ''
          });
        });
        this.questionGrades.set(grades);
        this.generalFeedback.set(submission.generalFeedback || '');

        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load submission details:', error);
        this.toast.showError('Failed to load submission details');
        this.loading.set(false);
      }
    });
  }

  /**
   * Update question score
   */
  updateQuestionScore(questionId: number, score: number) {
    const grades = this.questionGrades();
    const current = grades.get(questionId) || { score: 0, feedback: '' };
    grades.set(questionId, { ...current, score });
    this.questionGrades.set(new Map(grades));
  }

  /**
   * Update question feedback
   */
  updateQuestionFeedback(questionId: number, feedback: string) {
    const grades = this.questionGrades();
    const current = grades.get(questionId) || { score: 0, feedback: '' };
    grades.set(questionId, { ...current, feedback });
    this.questionGrades.set(new Map(grades));
  }

  /**
   * Submit grading
   */
  submitGrading() {
    const submission = this.selectedSubmission();
    if (!submission) return;

    const questionGradesArray: QuestionGradeDto[] = [];
    this.questionGrades().forEach((grade, questionId) => {
      questionGradesArray.push({
        questionId,
        score: grade.score,
        feedback: grade.feedback
      });
    });

    const grading: GradeSubmissionDto = {
      questionGrades: questionGradesArray,
      generalFeedback: this.generalFeedback()
    };

    this.grading.set(true);

    this.examApi.gradeSubmission(submission.studentExamId, grading).subscribe({
      next: () => {
        this.toast.showSuccess('Grading saved successfully!');
        this.selectedSubmission.set(null);
        this.loadSubmissions();
        this.grading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to grade submission:', error);
        this.toast.showError('Failed to save grading');
        this.grading.set(false);
      }
    });
  }

  /**
   * Get filtered submissions
   */
  get filteredSubmissions(): ExamSubmissionDto[] {
    const filter = this.selectedFilter();
    const submissions = this.submissions();

    switch (filter) {
      case 'graded':
        return submissions.filter(s => s.isGraded);
      case 'pending':
        return submissions.filter(s => !s.isGraded && s.isCompleted);
      case 'manual':
        return submissions.filter(s => s.pendingManualGrading);
      default:
        return submissions;
    }
  }

  /**
   * Get total score
   */
  getTotalScore(): number {
    let total = 0;
    this.questionGrades().forEach(grade => {
      total += grade.score;
    });
    return total;
  }

  /**
   * Close detail view
   */
  closeDetailView() {
    this.selectedSubmission.set(null);
  }

  /**
   * Back to exams list
   */
  goBack() {
    this.router.navigate(['/teacher/exams']);
  }

  /**
   * Get question type label
   */
  getQuestionTypeLabel(type: QuestionType): string {
    return getQuestionTypeLabel(type);
  }
}
