/**
 * Student Details Modal Component
 * Shows detailed information and analytics for a student
 */

import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentListEnhancementService, StudentDetails } from '../../core/services/student-list-enhancement.service';

@Component({
  selector: 'app-student-details-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Modal Overlay -->
    @if (isOpen) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" (click)="close()">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <img
                  [src]="student?.avatar || 'https://ui-avatars.com/api/?name=' + student?.userName"
                  alt="Student"
                  class="w-20 h-20 rounded-full border-4 border-white"
                />
                <div>
                  <h2 class="text-2xl font-bold">{{ student?.userName }}</h2>
                  <p class="text-indigo-100">{{ student?.yearName }} • {{ student?.email }}</p>
                </div>
              </div>
              <button
                (click)="close()"
                class="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                <span class="text-2xl">×</span>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-blue-50 rounded-lg p-4">
                <p class="text-sm text-blue-600 font-medium">Progress</p>
                <p class="text-2xl font-bold text-blue-900">{{ student?.performance.overallProgress }}%</p>
              </div>
              <div class="bg-green-50 rounded-lg p-4">
                <p class="text-sm text-green-600 font-medium">Avg Score</p>
                <p class="text-2xl font-bold text-green-900">{{ student?.performance.averageExamScore }}%</p>
              </div>
              <div class="bg-purple-50 rounded-lg p-4">
                <p class="text-sm text-purple-600 font-medium">Lessons</p>
                <p class="text-2xl font-bold text-purple-900">{{ student?.performance.completedLessons }}/{{ student?.performance.totalLessons }}</p>
              </div>
              <div class="bg-orange-50 rounded-lg p-4">
                <p class="text-sm text-orange-600 font-medium">Study Time</p>
                <p class="text-2xl font-bold text-orange-900">{{ (student?.performance.studyTime || 0) / 60 | number:'1.0-0' }}h</p>
              </div>
            </div>

            <!-- Details Sections -->
            <div class="space-y-6">

              <!-- Personal Info -->
              <div class="border rounded-lg p-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600">Age</p>
                    <p class="font-medium">{{ student?.age }} years</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Status</p>
                    <span [class]="student?.status === 'active' ? 'px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium' : 'px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-medium'">
                      {{ student?.status }}
                    </span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Enrollment Date</p>
                    <p class="font-medium">{{ student?.enrollmentDate | date:'MMM d, yyyy' }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Last Active</p>
                    <p class="font-medium">{{ student?.performance.lastActive | date:'MMM d, yyyy' }}</p>
                  </div>
                </div>
              </div>

              <!-- Subscription Info -->
              @if (student?.subscription) {
                <div class="border rounded-lg p-4">
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Subscription</h3>
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <p class="text-sm text-gray-600">Plan</p>
                      <p class="font-medium">{{ student?.subscription.planName }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Status</p>
                      <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                        {{ student?.subscription.status }}
                      </span>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Expires</p>
                      <p class="font-medium">{{ student?.subscription.expiryDate | date:'MMM d, yyyy' }}</p>
                    </div>
                  </div>
                </div>
              }

              <!-- Performance -->
              <div class="border rounded-lg p-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">Performance Metrics</h3>
                <div class="space-y-3">
                  <div>
                    <div class="flex justify-between mb-1">
                      <span class="text-sm text-gray-600">Course Progress</span>
                      <span class="text-sm font-medium">{{ student?.performance.overallProgress }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-blue-600 h-2 rounded-full transition-all"
                        [style.width.%]="student?.performance.overallProgress">
                      </div>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p class="text-sm text-gray-600">Exams Completed</p>
                      <p class="font-medium">{{ student?.performance.examsCompleted }}/{{ student?.performance.totalExams }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Average Score</p>
                      <p class="font-medium text-green-600">{{ student?.performance.averageExamScore }}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 mt-6">
              <button
                class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                View Full Profile
              </button>
              <button
                class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                Message Parent
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class StudentDetailsModalComponent implements OnInit {
  @Input() studentId: number | null = null;
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();

  private enhancementService = inject(StudentListEnhancementService);
  student: StudentDetails | null = null;

  ngOnInit(): void {
    if (this.studentId) {
      this.loadStudentDetails();
    }
  }

  ngOnChanges(): void {
    if (this.studentId && this.isOpen) {
      this.loadStudentDetails();
    }
  }

  private loadStudentDetails(): void {
    if (!this.studentId) return;

    this.enhancementService.getStudentDetails(this.studentId)
      .subscribe(student => {
        this.student = student;
      });
  }

  close(): void {
    this.closeModal.emit();
  }
}
