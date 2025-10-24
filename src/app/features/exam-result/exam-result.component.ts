/**
 * Exam Result Component
 * Displays exam results with detailed question-level feedback
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExamService } from '../../core/services/exam.service';
import { ToastService } from '../../core/services/toast.service';
import { ExamResult } from '../../models/exam.models';

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-result.component.html',
  styleUrl: './exam-result.component.scss'
})
export class ExamResultComponent implements OnInit {
  // Services
  private examService = inject(ExamService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // State
  result = signal<ExamResult | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  showAnswers = signal<boolean>(false);

  // Computed values
  gradeClass = computed(() => {
    const percentage = this.result()?.percentage || 0;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  });

  gradeColor = computed(() => {
    const percentage = this.result()?.percentage || 0;
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  });

  passStatus = computed(() => {
    return this.result()?.passed ? 'Passed' : 'Failed';
  });

  passStatusColor = computed(() => {
    return this.result()?.passed ? 'text-green-600' : 'text-red-600';
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const studentExamId = +params['id'];
      if (studentExamId) {
        this.loadResult(studentExamId);
      }
    });
  }

  /**
   * Load exam result
   */
  private loadResult(studentExamId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.examService.getExamResult(studentExamId).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load exam result');
        this.loading.set(false);
        this.toastService.showError('Failed to load exam result');
        console.error('Error loading result:', err);
      }
    });
  }

  /**
   * Toggle answers visibility
   */
  toggleAnswers(): void {
    this.showAnswers.update(v => !v);
  }

  /**
   * Go back to exams list
   */
  backToExams(): void {
    this.router.navigate(['/student/exams']);
  }
}
