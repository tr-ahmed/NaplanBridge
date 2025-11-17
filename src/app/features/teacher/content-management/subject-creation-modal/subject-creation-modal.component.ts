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
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" *ngIf="isOpen()">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">

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
        <div class="p-6 space-y-4" [formGroup]="subjectForm">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Subject Name *</label>
            <input type="text"
                   formControlName="name"
                   placeholder="e.g., Mathematics, English"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
            <p class="text-xs text-gray-500 mt-1">Enter the name of the subject</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea formControlName="description"
                      placeholder="Brief description of the subject"
                      rows="3"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"></textarea>
          </div>

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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Subject Code</label>
            <input type="text"
                   formControlName="code"
                   placeholder="e.g., MATH101"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-blue-800">
              <strong>ℹ️ Note:</strong> Once created, you'll be assigned as the subject instructor with full permissions.
            </p>
          </div>
        </div>        <!-- Footer -->
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
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    yearId: ['', Validators.required],
    code: ['']
  });

  submit(): void {
    if (!this.subjectForm.valid) {
      this.toastService.showError('Please fill in all required fields');
      return;
    }

    this.loading.set(true);

    this.contentService.createSubject(this.subjectForm.value)
      .subscribe({
        next: (subject: any) => {
          this.toastService.showSuccess('Subject created successfully!');
          this.onSubmit.emit(subject);
          this.onClose.emit();
          this.subjectForm.reset();
          this.loading.set(false);
        },
        error: (error: any) => {
          console.error('Error creating subject:', error);
          this.toastService.showError('Failed to create subject. Please try again.');
          this.loading.set(false);
        }
      });
  }
}
