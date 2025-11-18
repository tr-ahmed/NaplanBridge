import { Component, Output, EventEmitter, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeacherContentManagementService } from '../../services/teacher-content-management.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-subject-creation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" *ngIf="isOpen()">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8">

        <!-- Header -->
        <div class="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h2 class="text-xl font-bold">🎓 Create New Subject</h2>
          <button (click)="onClose.emit()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4 max-h-96 overflow-y-auto" [formGroup]="subjectForm">
          
          <!-- Subject Name ID (Required) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Subject Name *</label>
            <select formControlName="subjectNameId"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">Select Subject</option>
              <option value="1">English</option>
              <option value="2">Mathematics</option>
              <option value="3">Science</option>
              <option value="4">History</option>
              <option value="5">Geography</option>
              <option value="6">Art</option>
              <option value="7">Physical Education</option>
              <option value="8">Computer Science</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Select the subject name</p>
          </div>

          <!-- Year Level (Required) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Year Level *</label>
            <select formControlName="yearId"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">Select Year Level</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
              <option value="5">Year 5</option>
              <option value="6">Year 6</option>
              <option value="7">Year 7</option>
              <option value="8">Year 8</option>
              <option value="9">Year 9</option>
              <option value="10">Year 10</option>
              <option value="11">Year 11</option>
              <option value="12">Year 12</option>
            </select>
          </div>

          <!-- Pricing Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Original Price</label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-gray-500">$</span>
                <input type="number" 
                       step="0.01"
                       formControlName="originalPrice"
                       placeholder="0.00"
                       class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Discount Percentage</label>
              <div class="relative">
                <input type="number" 
                       step="0.01"
                       min="0"
                       max="100"
                       formControlName="discountPercentage"
                       placeholder="0"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <span class="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>
          </div>

          <!-- Duration and Level -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
              <input type="number" 
                     formControlName="duration"
                     placeholder="e.g., 120"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select formControlName="level"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option value="">Select Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>

          <!-- Start Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input type="date" 
                   formControlName="startDate"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
          </div>

          <!-- Poster File (Required) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Subject Poster *</label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 transition"
                 (click)="fileInput.click()">
              <svg *ngIf="!subjectForm.get('posterFile')?.value" 
                   class="mx-auto h-12 w-12 text-gray-400" 
                   stroke="currentColor" 
                   fill="none" 
                   viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-14-8l-4-4m0 0l-4 4m4-4v16m8-8h-4m4 0h-4"/>
              </svg>
              <p *ngIf="!subjectForm.get('posterFile')?.value" class="mt-2">
                <span class="font-medium text-green-600">Click to upload</span> or drag and drop
              </p>
              <p *ngIf="subjectForm.get('posterFile')?.value" class="mt-2 text-green-600 font-medium">
                ✓ {{ subjectForm.get('posterFile')?.value?.name }}
              </p>
              <p class="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
            </div>
            <input #fileInput 
                   type="file" 
                   accept="image/*" 
                   (change)="onFileSelected($event)" 
                   style="display: none">
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-blue-800">
              <strong>ℹ️ Note:</strong> Once created, you'll be assigned as the subject instructor with full permissions.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-100 flex justify-end gap-2 rounded-b-lg">
          <button (click)="onClose.emit()"
                  class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button (click)="submit()"
                  [disabled]="!subjectForm.valid || loading()"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {{ loading() ? 'Creating...' : '✓ Create Subject' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SubjectCreationModalComponent {
  @Input() isOpen = signal(false);
  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<any>();

  private contentService = inject(TeacherContentManagementService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  loading = signal(false);

  subjectForm: FormGroup = this.fb.group({
    subjectNameId: ['', Validators.required],      // معرف اسم المادة (مطلوب)
    yearId: ['', Validators.required],              // معرف السنة (مطلوب)
    originalPrice: [''],                            // السعر الأصلي (اختياري)
    discountPercentage: [''],                       // نسبة الخصم (اختياري)
    level: [''],                                    // المستوى (اختياري)
    duration: [''],                                 // المدة (اختياري)
    startDate: [''],                                // تاريخ البداية (اختياري)
    posterFile: [null, Validators.required]         // صورة الغلاف (مطلوب)
  });

  submit(): void {
    if (!this.subjectForm.valid) {
      this.toastService.showError('❌ Please fill in all required fields');
      return;
    }

    this.loading.set(true);

    this.contentService.createSubject(this.subjectForm.value)
      .subscribe({
        next: (subject: any) => {
          console.log('✅ Subject created successfully:', subject);
          this.toastService.showSuccess('✨ Subject created successfully!');
          this.onSubmit.emit(subject);
          this.onClose.emit();
          this.subjectForm.reset();
          this.loading.set(false);
        },
        error: (error: any) => {
          console.error('❌ Error creating subject:', error);
          
          // Display meaningful error message from service or generic message
          const errorMessage = error?.message || 'Failed to create subject. Please try again.';
          this.toastService.showError(errorMessage);
          this.loading.set(false);
        }
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.toastService.showError('❌ File size exceeds 10MB limit');
      // Reset file input
      event.target.value = '';
      return;
    }

    // Validate file type (images only)
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      this.toastService.showError('❌ Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      // Reset file input
      event.target.value = '';
      return;
    }

    // Patch the form with the file
    this.subjectForm.patchValue({ posterFile: file });
    console.log('✓ File selected:', file.name);
  }
}
