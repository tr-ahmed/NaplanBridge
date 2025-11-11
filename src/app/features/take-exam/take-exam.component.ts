/**
 * Take Exam Component
 * Interface for students to take exams
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-take-exam',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="container mx-auto px-4 max-w-4xl">
        <div class="bg-white rounded-lg shadow-sm p-8 text-center">
          <svg class="w-16 h-16 mx-auto text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h1 class="text-2xl font-bold text-gray-900 mb-4">Take Exam</h1>
          <p class="text-gray-600 mb-6">This feature is under development</p>
          <p class="text-sm text-gray-500 mb-8">The exam taking interface will be available soon with full question display, timer, and submission functionality.</p>
          <button
            (click)="goBack()"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Exams
          </button>
        </div>
      </div>
    </div>
  `
})
export class TakeExamComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  examId: number = 0;

  ngOnInit(): void {
    this.examId = Number(this.route.snapshot.paramMap.get('id'));
    this.toastService.showInfo('Exam taking feature is under development');
  }

  goBack(): void {
    this.router.navigate(['/student/exams']);
  }
}
