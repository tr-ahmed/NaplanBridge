import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamApiService } from '../../../core/services/exam-api.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ExamResultDto,
  QuestionType,
  getGradeColor,
  getGradeFromPercentage
} from '../../../models/exam-api.models';

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-result.component.html',
  styleUrls: ['./exam-result.component.scss']
})
export class ExamResultComponent implements OnInit {
  // Data
  result = signal<ExamResultDto | null>(null);

  // UI State
  loading = signal(false);
  showAnswers = signal(false);

  // Constants
  QuestionType = QuestionType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examApi: ExamApiService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const studentExamId = +this.route.snapshot.params['id'];
    this.loadResult(studentExamId);
  }

  /**
   * Load exam result
   */
  loadResult(studentExamId: number) {
    this.loading.set(true);

    this.examApi.getExamResult(studentExamId).subscribe({
      next: (response: any) => {
        console.log('📊 Raw Backend Response:', response);

        // ✅ Transform backend response to frontend format
        const backendData = response.data || response;
        console.log('📊 Backend Data:', backendData);

        // Calculate correct/wrong answers count
        const correctCount = backendData.questionResults?.filter((q: any) => q.isCorrect === true).length || 0;
        const totalQuestions = backendData.questionResults?.length || 0;
        const wrongCount = totalQuestions - correctCount;

        // Calculate percentage
        const scorePercentage = backendData.totalMarks > 0
          ? (backendData.score / backendData.totalMarks) * 100
          : 0;

        // Transform question results
        const transformedQuestions = backendData.questionResults?.map((q: any) => ({
          questionId: q.questionId,
          questionText: q.questionText,
          questionType: q.questionType || QuestionType.MultipleChoice,
          marks: q.maxMarks || q.marks || 0,
          earnedScore: q.awardedMarks || q.earnedScore || 0,
          studentAnswer: q.selectedOptions?.join(', ') || q.studentAnswer || 'Not Answered',
          correctAnswer: q.correctOptions?.join(', ') || q.correctAnswer || '',
          isCorrect: q.isCorrect,
          feedback: q.feedback || q.teacherFeedback
        })) || [];

        // Build complete result object
        const result: ExamResultDto = {
          studentExamId: backendData.studentExamId,
          examId: backendData.examId,
          examTitle: backendData.examTitle,
          subjectName: backendData.subjectName || 'Subject',
          submittedAt: backendData.submittedAt || new Date().toISOString(),
          gradedAt: backendData.gradedAt,
          totalScore: backendData.score || 0,
          totalMarks: backendData.totalMarks || 0,
          scorePercentage: scorePercentage,
          passingMarks: backendData.passingMarks || 0,
          isPassed: backendData.isPassed ?? (scorePercentage >= 50),
          grade: this.calculateGrade(scorePercentage),
          correctAnswersCount: correctCount,
          wrongAnswersCount: wrongCount,
          generalFeedback: backendData.generalFeedback,
          questionResults: transformedQuestions
        };

        console.log('✅ Transformed Result:', result);
        console.log('📝 Question Results:', result.questionResults);

        this.result.set(result);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load result:', error);
        this.toast.showError('Failed to load result');
        this.router.navigate(['/student/exams']);
      }
    });
  }

  /**
   * Calculate grade from percentage
   */
  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'C+';
    if (percentage >= 65) return 'C';
    if (percentage >= 60) return 'D+';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  /**
   * Toggle show answers
   */
  toggleAnswers() {
    this.showAnswers.set(!this.showAnswers());
  }

  /**
   * Back to exams
   */
  backToExams() {
    this.router.navigate(['/student/exams']);
  }

  /**
   * Get grade color
   */
  getGradeColor(grade?: string): string {
    return getGradeColor(grade);
  }

  /**
   * Get grade from percentage
   */
  getGrade(percentage: number): string {
    return getGradeFromPercentage(percentage);
  }

  /**
   * Get question icon class
   */
  getQuestionIconClass(isCorrect?: boolean | null): string {
    if (isCorrect === null || isCorrect === undefined) return 'fa-minus-circle neutral';
    return isCorrect ? 'fa-check-circle correct' : 'fa-times-circle incorrect';
  }

  /**
   * Get question status class
   */
  getQuestionStatusClass(isCorrect?: boolean | null): string {
    if (isCorrect === null || isCorrect === undefined) return 'manual';
    return isCorrect ? 'correct' : 'incorrect';
  }
}
