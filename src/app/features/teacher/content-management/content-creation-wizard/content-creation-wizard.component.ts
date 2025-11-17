import { Component, Output, EventEmitter, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeacherContentManagementService, ContentItem } from '../../services/teacher-content-management.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-content-creation-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" *ngIf="isOpen()">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">

        <!-- Header -->
        <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
          <h2 class="text-xl font-bold">➕ Create New Content</h2>
          <button (click)="onClose.emit()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Steps Indicator -->
        <div class="bg-gray-100 px-6 py-4">
          <div class="flex justify-between mb-2">
            <span *ngFor="let step of steps; let i = index"
                  class="text-sm font-medium"
                  [class.text-blue-600]="currentStep === (i + 1)"
                  [class.text-gray-500]="currentStep !== (i + 1)">
              {{ step }}
            </span>
          </div>
          <div class="w-full bg-gray-300 rounded-full h-1">
            <div class="bg-blue-600 h-1 rounded-full transition-all duration-300"
                 [style.width.%]="(currentStep / steps.length) * 100"></div>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 py-6 space-y-6">
          <!-- Step 1: Content Type -->
          <div *ngIf="currentStep === 1">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Select Content Type</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button *ngFor="let type of contentTypes"
                      (click)="selectContentType(type)"
                      class="p-4 border-2 rounded-lg transition-all"
                      [class.border-blue-600]="contentForm.get('itemType')?.value === type.value"
                      [class.bg-blue-50]="contentForm.get('itemType')?.value === type.value"
                      [class.border-gray-300]="contentForm.get('itemType')?.value !== type.value"
                      [class.hover:border-blue-300]="contentForm.get('itemType')?.value !== type.value">
                <div class="text-3xl mb-2">{{ type.icon }}</div>
                <div class="font-semibold text-gray-900">{{ type.label }}</div>
                <div class="text-sm text-gray-600">{{ type.description }}</div>
              </button>
            </div>
          </div>

          <!-- Step 2: Basic Information -->
          <div *ngIf="currentStep === 2">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Content Information</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input type="text"
                       formControlName="title"
                       placeholder="Enter content title"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <p class="text-xs text-gray-500 mt-1">Be clear and descriptive</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea formControlName="description"
                          placeholder="Describe your content..."
                          rows="4"
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                <p class="text-xs text-gray-500 mt-1">Help students understand what they'll learn</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select formControlName="subjectId"
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select a subject</option>
                    <!-- Options would come from subjects -->
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <input type="number"
                         formControlName="duration"
                         placeholder="e.g., 45"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Additional Details -->
          <div *ngIf="currentStep === 3">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Additional Details</h3>
            <div class="space-y-4">
              <div *ngIf="contentForm.get('itemType')?.value === 'Lesson'">
                <label class="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                <input type="url"
                       formControlName="videoUrl"
                       placeholder="https://youtu.be/..."
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg">
              </div>

              <div *ngIf="contentForm.get('itemType')?.value === 'Exam'">
                <label class="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                <input type="number"
                       formControlName="questionCount"
                       placeholder="e.g., 20"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Learning Objectives</label>
                <textarea placeholder="What will students learn?"
                          rows="3"
                          formControlName="objectives"
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
                <p class="text-xs text-gray-500 mt-1">Separate multiple objectives with line breaks</p>
              </div>
            </div>
          </div>

          <!-- Step 4: Review -->
          <div *ngIf="currentStep === 4">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Review Your Content</h3>
            <div class="space-y-4">
              <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span class="text-sm text-gray-600">Content Type:</span>
                  <p class="font-semibold text-gray-900">{{ contentForm.get('itemType')?.value }}</p>
                </div>
                <div>
                  <span class="text-sm text-gray-600">Title:</span>
                  <p class="font-semibold text-gray-900">{{ contentForm.get('title')?.value }}</p>
                </div>
                <div *ngIf="contentForm.get('description')?.value">
                  <span class="text-sm text-gray-600">Description:</span>
                  <p class="text-gray-700">{{ contentForm.get('description')?.value }}</p>
                </div>
              </div>

              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm text-blue-800">
                  <strong>📝 Note:</strong> This content will be submitted for admin approval and won't be visible to students until approved.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="sticky bottom-0 bg-gray-100 px-6 py-4 flex justify-between items-center">
          <button (click)="previousStep()"
                  *ngIf="currentStep > 1"
                  class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            ← Back
          </button>

          <div class="flex gap-2 ml-auto">
            <button (click)="onClose.emit()"
                    class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>

            <button *ngIf="currentStep < 4"
                    (click)="nextStep()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    [disabled]="!isStepValid()">
              Next →
            </button>

            <button *ngIf="currentStep === 4"
                    (click)="submit()"
                    [disabled]="loading()"
                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {{ loading() ? 'Creating...' : '✓ Create Content' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ContentCreationWizardComponent {
  @Input() isOpen = signal(false);
  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<ContentItem>();

  private contentService = inject(TeacherContentManagementService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  currentStep = 1;
  steps = ['Type', 'Info', 'Details', 'Review'];
  loading = signal(false);

  contentTypes = [
    { value: 'Lesson', label: 'Lesson', icon: '📚', description: 'Create a lesson with videos and materials' },
    { value: 'Exam', label: 'Exam', icon: '📝', description: 'Create an exam with questions' },
    { value: 'Resource', label: 'Resource', icon: '📎', description: 'Upload a resource file' },
    { value: 'Question', label: 'Question', icon: '❓', description: 'Create a single question' },
    { value: 'Certificate', label: 'Certificate', icon: '🏆', description: 'Create a certificate' },
  ];

  contentForm: FormGroup = this.fb.group({
    itemType: ['', Validators.required],
    title: ['', Validators.required],
    description: [''],
    subjectId: [''],
    duration: [''],
    videoUrl: [''],
    questionCount: [''],
    objectives: ['']
  });

  selectContentType(type: any): void {
    this.contentForm.patchValue({ itemType: type.value });
  }

  nextStep(): void {
    if (this.isStepValid() && this.currentStep < this.steps.length) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!this.contentForm.get('itemType')?.value;
      case 2:
        return !!this.contentForm.get('title')?.value;
      case 3:
        return true; // Optional details
      case 4:
        return true; // Review step
      default:
        return false;
    }
  }

  submit(): void {
    if (!this.contentForm.valid) {
      this.toastService.showError('Please fill in all required fields');
      return;
    }

    this.loading.set(true);

    this.contentService.createContent(this.contentForm.value)
      .subscribe({
        next: (content: ContentItem) => {
          this.toastService.showSuccess('Content created successfully! Awaiting admin approval.');
          this.onSubmit.emit(content);
          this.onClose.emit();
          this.resetForm();
          this.loading.set(false);
        },
        error: (error: any) => {
          console.error('Error creating content:', error);
          this.toastService.showError('Failed to create content. Please try again.');
          this.loading.set(false);
        }
      });
  }

  private resetForm(): void {
    this.currentStep = 1;
    this.contentForm.reset();
  }
}
