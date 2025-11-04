import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-content-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <!-- Modal Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" (click)="onBackdropClick($event)">
        <!-- Modal Content -->
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 class="text-2xl font-bold text-gray-900">
              {{ mode === 'add' ? 'Add New' : 'Edit' }} {{ getEntityTitle() }}
            </h2>
            <button 
              type="button"
              (click)="onCancel()"
              class="text-gray-400 hover:text-gray-600 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6">
            <form #contentForm="ngForm">
              
              <!-- Year Form -->
              @if (entityType === 'year') {
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Year Number <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="yearNumber"
                      [(ngModel)]="formData.yearNumber"
                      required
                      min="1"
                      max="12"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter year number (1-12)">
                  </div>
                </div>
              }

              <!-- Category Form -->
              @if (entityType === 'category') {
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Category Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      [(ngModel)]="formData.name"
                      required
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter category name">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      [(ngModel)]="formData.description"
                      rows="3"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter category description"></textarea>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <input
                      type="color"
                      name="color"
                      [(ngModel)]="formData.color"
                      class="w-full h-10 px-2 border border-gray-300 rounded-lg">
                  </div>
                </div>
              }

              <!-- Subject Name Form -->
              @if (entityType === 'subjectName') {
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Subject Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      [(ngModel)]="formData.name"
                      required
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter subject name">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Category <span class="text-red-500">*</span>
                    </label>
                    <select
                      name="categoryId"
                      [(ngModel)]="formData.categoryId"
                      required
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select Category</option>
                      <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
                    </select>
                  </div>
                </div>
              }

              <!-- Subject Form -->
              @if (entityType === 'subject') {
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Year <span class="text-red-500">*</span>
                      </label>
                      <select
                        name="yearId"
                        [(ngModel)]="formData.yearId"
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select Year</option>
                        <option *ngFor="let year of years" [value]="year.id">Year {{ year.yearNumber }}</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Subject Name <span class="text-red-500">*</span>
                      </label>
                      <select
                        name="subjectNameId"
                        [(ngModel)]="formData.subjectNameId"
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select Subject</option>
                        <option *ngFor="let subj of subjectNames" [value]="subj.id">{{ subj.name }}</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Original Price <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="originalPrice"
                        [(ngModel)]="formData.originalPrice"
                        required
                        min="0"
                        step="0.01"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00">
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Discount %
                      </label>
                      <input
                        type="number"
                        name="discountPercentage"
                        [(ngModel)]="formData.discountPercentage"
                        min="0"
                        max="100"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0">
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Level <span class="text-red-500">*</span>
                      </label>
                      <select
                        name="level"
                        [(ngModel)]="formData.level"
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select Level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Duration (hours)
                      </label>
                      <input
                        type="number"
                        name="duration"
                        [(ngModel)]="formData.duration"
                        min="0"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0">
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Teacher <span class="text-red-500">*</span>
                    </label>
                    <select
                      name="teacherId"
                      [(ngModel)]="formData.teacherId"
                      required
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select Teacher</option>
                      <option *ngFor="let teacher of teachers" [value]="teacher.id">{{ teacher.userName || teacher.name }}</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      [(ngModel)]="formData.startDate"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Poster Image <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      name="posterFile"
                      (change)="onFileChange($event, 'posterFile')"
                      accept="image/*"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    @if (formData.posterUrl && mode === 'edit') {
                      <img [src]="formData.posterUrl" class="mt-2 h-20 rounded" alt="Poster">
                    }
                  </div>
                </div>
              }

              <!-- Term Form -->
              @if (entityType === 'term') {
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Subject <span class="text-red-500">*</span>
                    </label>
                    <select
                      name="subjectId"
                      [(ngModel)]="formData.subjectId"
                      required
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select Subject</option>
                      <option *ngFor="let subj of subjects" [value]="subj.id">{{ subj.subjectName }}</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Term Number <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="termNumber"
                      [(ngModel)]="formData.termNumber"
                      required
                      min="1"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter term number">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Start Date <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      [(ngModel)]="formData.startDate"
                      required
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>
                </div>
              }

              <!-- Week Form -->
              @if (entityType === 'week') {
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Term <span class="text-red-500">*</span>
                    </label>
                    <select
                      name="termId"
                      [(ngModel)]="formData.termId"
                      required
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select Term</option>
                      <option *ngFor="let term of terms" [value]="term.id">Term {{ term.termNumber }}</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Week Number <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="weekNumber"
                      [(ngModel)]="formData.weekNumber"
                      required
                      min="1"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter week number">
                  </div>
                </div>
              }

              <!-- Lesson Form -->
              @if (entityType === 'lesson') {
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Title <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      [(ngModel)]="formData.title"
                      required
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter lesson title">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Description <span class="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      [(ngModel)]="formData.description"
                      required
                      rows="3"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter lesson description"></textarea>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Subject <span class="text-red-500">*</span>
                      </label>
                      <select
                        name="subjectId"
                        [(ngModel)]="formData.subjectId"
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select Subject</option>
                        <option *ngFor="let subj of subjects" [value]="subj.id">{{ subj.subjectName }}</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Week <span class="text-red-500">*</span>
                      </label>
                      <select
                        name="weekId"
                        [(ngModel)]="formData.weekId"
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select Week</option>
                        <option *ngFor="let week of weeks" [value]="week.id">Week {{ week.weekNumber }}</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        name="duration"
                        [(ngModel)]="formData.duration"
                        min="0"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0">
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Order Index
                      </label>
                      <input
                        type="number"
                        name="orderIndex"
                        [(ngModel)]="formData.orderIndex"
                        min="0"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0">
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Poster Image <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      name="posterFile"
                      (change)="onFileChange($event, 'posterFile')"
                      accept="image/*"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    @if (formData.posterUrl && mode === 'edit') {
                      <img [src]="formData.posterUrl" class="mt-2 h-20 rounded" alt="Poster">
                    }
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Video File <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      name="videoFile"
                      (change)="onFileChange($event, 'videoFile')"
                      accept="video/*"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    @if (formData.videoUrl && mode === 'edit') {
                      <p class="mt-2 text-sm text-gray-600">
                        <i class="fas fa-video mr-1"></i>
                        Video uploaded
                      </p>
                    }
                  </div>
                </div>
              }

            </form>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              (click)="onCancel()"
              class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
              Cancel
            </button>
            <button
              type="button"
              (click)="onSave()"
              [disabled]="!contentForm.valid"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-300 disabled:cursor-not-allowed">
              {{ mode === 'add' ? 'Create' : 'Update' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ContentModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() entityType: string = '';
  @Input() formData: any = {};
  @Input() years: any[] = [];
  @Input() categories: any[] = [];
  @Input() subjectNames: any[] = [];
  @Input() subjects: any[] = [];
  @Input() terms: any[] = [];
  @Input() weeks: any[] = [];
  @Input() teachers: any[] = [];

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else if (changes['isOpen'] && !this.isOpen) {
      // Restore body scroll when modal is closed
      document.body.style.overflow = '';
    }
  }

  getEntityTitle(): string {
    const titles: { [key: string]: string } = {
      'year': 'Year',
      'category': 'Category',
      'subjectName': 'Subject Name',
      'subject': 'Subject',
      'term': 'Term',
      'week': 'Week',
      'lesson': 'Lesson'
    };
    return titles[this.entityType] || 'Item';
  }

  onFileChange(event: any, fieldName: string): void {
    const file = event.target.files[0];
    if (file) {
      this.formData[fieldName] = file;
    }
  }

  onBackdropClick(event: MouseEvent): void {
    // Close modal when clicking backdrop
    this.onCancel();
  }

  onCancel(): void {
    document.body.style.overflow = '';
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.cancel.emit();
  }

  onSave(): void {
    this.save.emit(this.formData);
  }
}
