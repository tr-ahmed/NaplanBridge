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
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load result:', error);
        this.toast.showError('فشل تحميل النتيجة');
        this.router.navigate(['/student/exams']);
      }
    });
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
