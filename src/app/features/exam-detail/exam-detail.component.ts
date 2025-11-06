/**
 * Exam Detail Component
 * Shows details about a specific exam before taking it
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ExamService } from '../../core/services/exam.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="container mx-auto px-4 max-w-4xl">
        @if (loading()) {
          <div class="flex items-center justify-center py-12">
            <div class="text-center">
              <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p class="mt-4 text-gray-600">Loading exam details...</p>
            </div>
          </div>
        }

        @if (!loading() && exam()) {
          <div class="bg-white rounded-lg shadow-sm p-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ exam()!.title }}</h1>

            @if (exam()!.description) {
              <p class="text-gray-600 mb-6">{{ exam()!.description }}</p>
            }

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div class="flex items-center">
                <svg class="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p class="text-sm text-gray-500">Duration</p>
                  <p class="font-semibold">{{ exam()!.durationInMinutes }} minutes</p>
                </div>
              </div>

              <div class="flex items-center">
                <svg class="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p class="text-sm text-gray-500">Questions</p>
                  <p class="font-semibold">{{ exam()!.totalQuestions || 'TBD' }}</p>
                </div>
              </div>
            </div>

            <div class="flex gap-4">
              <button
                routerLink="/student/exams"
                class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Back to Exams
              </button>
              <button
                (click)="startExam()"
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Start Exam
              </button>
            </div>
          </div>
        }

        @if (!loading() && !exam()) {
          <div class="bg-white rounded-lg shadow-sm p-8 text-center">
            <p class="text-gray-500">Exam not found</p>
            <button
              routerLink="/student/exams"
              class="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Exams
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class ExamDetailComponent implements OnInit {
  private examService = inject(ExamService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  examId: number = 0;
  loading = signal<boolean>(true);
  exam = signal<any>(null);

  ngOnInit(): void {
    this.examId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.examId) {
      this.loadExam();
    } else {
      this.router.navigate(['/student/exams']);
    }
  }

  private loadExam(): void {
    this.loading.set(true);
    this.examService.getExamById(this.examId).subscribe({
      next: (exam) => {
        this.exam.set(exam);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading exam:', err);
        this.toastService.showError('Failed to load exam');
        this.loading.set(false);
      }
    });
  }

  startExam(): void {
    this.router.navigate(['/student/exam', this.examId, 'start']);
  }
}
