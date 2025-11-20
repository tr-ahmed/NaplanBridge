import { Component, Output, EventEmitter, Input, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeacherContentManagementService, ContentItem, TeacherSubject } from '../../services/teacher-content-management.service';
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
          <div class="flex items-center space-x-3">
            <h2 class="text-xl font-bold">➕ Create New Content</h2>
            <span *ngIf="loadingSubjects()" class="text-sm bg-blue-500 px-3 py-1 rounded-full animate-pulse">
              Loading data...
            </span>
          </div>
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
          <div *ngIf="currentStep === 2" [formGroup]="contentForm">
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
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          [disabled]="loadingSubjects()">
                    <option value="">
                      {{ loadingSubjects() ? 'Loading subjects...' : 'Select a subject' }}
                    </option>
                    <option *ngFor="let subject of subjects()" [value]="subject.subjectId">
                      {{ subject.subjectName }}
                    </option>
                  </select>
                  <p class="text-xs text-gray-500 mt-1">Choose from your available subjects</p>
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

          <!-- Step 3: Additional Details & Files -->
          <div *ngIf="currentStep === 3" [formGroup]="contentForm">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Additional Details & Media</h3>
            <div class="space-y-6">
              <!-- Poster Image (Required for Lessons) -->
              <div *ngIf="contentForm.get('itemType')?.value === 'Lesson'" class="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50">
                <input #posterInput
                       type="file"
                       accept="image/*"
                       (change)="onPosterSelected($event)"
                       style="display: none">
                <svg class="w-12 h-12 mx-auto text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="text-gray-700 font-medium">Lesson Poster Image *</p>
                <p class="text-sm text-gray-600 mt-2">Click to upload or drag and drop</p>
                <p class="text-xs text-gray-500 mt-1">PNG, JPG, GIF or WebP (max 10MB)</p>
                <button type="button"
                        (click)="posterInput.click()"
                        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Choose File
                </button>
                <p *ngIf="posterFile" class="text-green-600 text-sm mt-2">
                  ✓ {{ posterFile.name }}
                </p>
              </div>

              <!-- Video File (Required for Lessons) -->
              <div *ngIf="contentForm.get('itemType')?.value === 'Lesson'" class="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center bg-purple-50">
                <input #videoInput
                       type="file"
                       accept="video/*"
                       (change)="onVideoSelected($event)"
                       style="display: none">
                <svg class="w-12 h-12 mx-auto text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-gray-700 font-medium">Lesson Video File *</p>
                <p class="text-sm text-gray-600 mt-2">Click to upload or drag and drop</p>
                <p class="text-xs text-gray-500 mt-1">MP4, WebM, OGG or MKV (max 500MB)</p>
                <button type="button"
                        (click)="videoInput.click()"
                        class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                  Choose File
                </button>
                <p *ngIf="videoFile" class="text-green-600 text-sm mt-2">
                  ✓ {{ videoFile.name }}
                </p>
              </div>

              <div *ngIf="contentForm.get('itemType')?.value === 'Lesson'">
                <label class="block text-sm font-medium text-gray-700 mb-2">Week (Optional)</label>
                <input type="number"
                       formControlName="weekId"
                       placeholder="e.g., 1"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <p class="text-xs text-gray-500 mt-1">Specify which week this lesson belongs to</p>
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
export class ContentCreationWizardComponent implements OnInit {
  @Input() isOpen = signal(false);
  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<ContentItem>();

  private contentService = inject(TeacherContentManagementService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  currentStep = 1;
  steps = ['Type', 'Info', 'Details', 'Review'];
  loading = signal(false);
  posterFile: File | null = null;
  videoFile: File | null = null;

  // 📊 Data from API
  subjects = signal<TeacherSubject[]>([]);
  loadingSubjects = signal(false);

  contentTypes = [
    { value: 'Lesson', label: 'Lesson', icon: '📚', description: 'Create a lesson with videos and materials' },
    { value: 'Exam', label: 'Exam', icon: '📝', description: 'Create an exam with questions' },
    { value: 'Resource', label: 'Resource', icon: '📎', description: 'Upload a resource file' },
    { value: 'Question', label: 'Question', icon: '❓', description: 'Create a single question' },
    { value: 'Certificate', label: 'Certificate', icon: '🏆', description: 'Create a certificate' },
  ];

  contentForm: FormGroup = this.fb.group({
    itemType: ['', Validators.required],
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
    description: ['', Validators.maxLength(2000)],
    subjectId: ['', Validators.required],
    duration: [''],
    weekId: [''],
    posterFile: [null],
    videoFile: [null],
    questionCount: [''],
    objectives: ['', Validators.maxLength(1000)]
  });

  constructor() {
    // ✅ Load subjects when modal opens
    effect(() => {
      if (this.isOpen()) {
        console.log('🎯 Modal opened - triggering data load');
        this.loadSubjects();
      }
    });
  }

  /**
   * Load data from API on component init
   */
  ngOnInit(): void {
    console.log('🔄 Component initialized');
  }

  /**
   * Load subjects from API
   */
  private loadSubjects(): void {
    this.loadingSubjects.set(true);
    console.log('📡 Starting to load subjects from API...');
    this.contentService.getMySubjects()
      .subscribe({
        next: (subjects: TeacherSubject[]) => {
          console.log('✅ SUCCESS: Subjects loaded from API');
          console.log(`📊 Total subjects: ${subjects.length}`);
          console.log('📋 Subjects data:', subjects);
          this.subjects.set(subjects);
          this.loadingSubjects.set(false);
        },
        error: (error: any) => {
          console.error('❌ ERROR: Failed to load subjects from API');
          console.error('🔍 Error details:', error);
          console.error('📍 Error message:', error?.message);
          console.error('🌐 Error status:', error?.status);
          this.loadingSubjects.set(false);
        }
      });
  }

  selectContentType(type: any): void {
    this.contentForm.patchValue({ itemType: type.value });
  }

  onPosterSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.toastService.showError('❌ Poster file size exceeds 10MB limit');
      event.target.value = '';
      return;
    }

    // Validate file type (images only)
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      this.toastService.showError('❌ Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      event.target.value = '';
      return;
    }

    this.posterFile = file;
    this.contentForm.patchValue({ posterFile: file });
    console.log('✓ Poster selected:', file.name);
  }

  onVideoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      this.toastService.showError('❌ Video file size exceeds 500MB limit');
      event.target.value = '';
      return;
    }

    // Validate file type (videos only)
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/x-msvideo', 'video/x-matroska'];
    if (!validVideoTypes.includes(file.type)) {
      this.toastService.showError('❌ Please select a valid video file (MP4, WebM, OGG, or MKV)');
      event.target.value = '';
      return;
    }

    this.videoFile = file;
    this.contentForm.patchValue({ videoFile: file });
    console.log('✓ Video selected:', file.name);
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
        // For Lessons: poster and video files are required
        const itemType = this.contentForm.get('itemType')?.value;
        if (itemType === 'Lesson') {
          return this.posterFile !== null && this.videoFile !== null;
        }
        return true; // Other content types don't require files at this stage
      case 4:
        return true; // Review step
      default:
        return false;
    }
  }

  submit(): void {
    if (!this.contentForm.valid) {
      this.toastService.showError('❌ Please fill in all required fields');
      return;
    }

    // Additional validation for lessons
    const itemType = this.contentForm.get('itemType')?.value;
    if (itemType === 'Lesson') {
      if (!this.posterFile || !this.videoFile) {
        this.toastService.showError('❌ Please upload both poster image and video file for lessons');
        return;
      }
    }

    // Validate required fields
    const title = this.contentForm.get('title')?.value;
    const subjectId = this.contentForm.get('subjectId')?.value;

    if (!title || title.length < 3) {
      this.toastService.showError('❌ Title must be at least 3 characters');
      return;
    }

    if (!subjectId) {
      this.toastService.showError('❌ Please select a subject');
      return;
    }

    this.loading.set(true);

    // Prepare clean payload matching API requirements
    const formValue = this.contentForm.value;
    const payload: any = {
      itemType: formValue.itemType,
      title: formValue.title,
      subjectId: parseInt(formValue.subjectId, 10), // Convert to number
    };

    // Add optional fields only if they have values
    if (formValue.description) payload.description = formValue.description;
    if (formValue.duration) payload.duration = parseInt(formValue.duration, 10);
    if (formValue.weekId) payload.weekId = parseInt(formValue.weekId, 10);
    if (formValue.objectives) payload.objectives = formValue.objectives;
    if (formValue.questionCount) payload.questionCount = parseInt(formValue.questionCount, 10);

    console.log('📤 Sending payload to API:', payload);
    console.log('📋 Payload type check:', {
      itemType: typeof payload.itemType,
      title: typeof payload.title,
      subjectId: typeof payload.subjectId,
      subjectIdValue: payload.subjectId
    });

    this.contentService.createContent(payload)
      .subscribe({
        next: (content: ContentItem) => {
          console.log('✅ Content created successfully:', content);
          this.toastService.showSuccess('✨ Content created successfully! Awaiting admin approval.');
          this.onSubmit.emit(content);
          this.onClose.emit();
          this.resetForm();
          this.loading.set(false);
        },
        error: (error: any) => {
          console.error('❌ Error creating content:', error);
          console.error('🔍 Error details:', {
            status: error?.status,
            statusText: error?.statusText,
            message: error?.error?.message,
            errors: error?.error?.errors,
            title: error?.error?.title
          });

          let errorMessage = 'Failed to create content. Please try again.';

          // Extract validation errors if available
          if (error?.error?.errors) {
            const errors = Object.entries(error.error.errors)
              .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join(' | ');
            errorMessage = `Validation errors: ${errors}`;
          } else if (error?.error?.title) {
            errorMessage = error.error.title;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          this.toastService.showError(errorMessage);
          this.loading.set(false);
        }
      });
  }

  private resetForm(): void {
    this.currentStep = 1;
    this.contentForm.reset();
    this.posterFile = null;
    this.videoFile = null;
  }
}
