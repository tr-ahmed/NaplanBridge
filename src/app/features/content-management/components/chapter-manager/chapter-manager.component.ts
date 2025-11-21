import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../../../core/services/content.service';
import Swal from 'sweetalert2';

interface Chapter {
  id: number;
  lessonId: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  orderIndex: number;
}

@Component({
  selector: 'app-chapter-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-gray-900">
          <i class="fas fa-list mr-2 text-blue-600"></i>
          Video Chapters
        </h4>
        <button
          type="button"
          (click)="toggleAddForm()"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <i class="fas" [class.fa-plus]="!showAddForm()" [class.fa-times]="showAddForm()"></i>
          {{ showAddForm() ? 'Cancel' : 'Add Chapter' }}
        </button>
      </div>

      <!-- Add/Edit Form -->
      @if (showAddForm()) {
        <div class="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
          <h5 class="font-medium text-blue-900 mb-3">
            {{ editingChapter() ? 'Edit Chapter' : 'New Chapter' }}
          </h5>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Title <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="chapterForm.title"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chapter title">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                [(ngModel)]="chapterForm.description"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Start Time (mm:ss) <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="chapterForm.startTime"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="00:00">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                End Time (mm:ss) <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="chapterForm.endTime"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="00:00">
            </div>
          </div>
          <div class="flex items-center gap-2 mt-4">
            <button
              type="button"
              (click)="saveChapter()"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <i class="fas fa-save mr-2"></i>
              {{ editingChapter() ? 'Update' : 'Save' }} Chapter
            </button>
            <button
              type="button"
              (click)="cancelEdit()"
              class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm">
              Cancel
            </button>
          </div>
        </div>
      }

      <!-- Chapters List -->
      @if (loading()) {
        <div class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
          <p class="text-gray-600 mt-2">Loading chapters...</p>
        </div>
      } @else if (chapters().length === 0) {
        <div class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <i class="fas fa-list text-4xl text-gray-400 mb-2"></i>
          <p class="text-gray-600">No chapters added yet</p>
          <p class="text-sm text-gray-500 mt-1">Add chapters to organize your video content</p>
        </div>
      } @else {
        <div class="space-y-2">
          @for (chapter of chapters(); track chapter.id) {
            <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-1">
                    <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                      {{ chapter.startTime }} - {{ chapter.endTime }}
                    </span>
                    <h5 class="font-semibold text-gray-900">{{ chapter.title }}</h5>
                  </div>
                  @if (chapter.description) {
                    <p class="text-sm text-gray-600 mt-1">{{ chapter.description }}</p>
                  }
                </div>
                <div class="flex items-center gap-2 ml-4">
                  <button
                    type="button"
                    (click)="editChapter(chapter)"
                    class="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition-colors"
                    title="Edit chapter">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    type="button"
                    (click)="deleteChapter(chapter)"
                    class="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition-colors"
                    title="Delete chapter">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ChapterManagerComponent implements OnInit {
  @Input() lessonId!: number;

  chapters = signal<Chapter[]>([]);
  loading = signal(false);
  showAddForm = signal(false);
  editingChapter = signal<Chapter | null>(null);

  chapterForm = {
    title: '',
    description: '',
    startTime: '',
    endTime: ''
  };

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    if (this.lessonId) {
      this.loadChapters();
    }
  }

  loadChapters(): void {
    this.loading.set(true);
    this.contentService.getLessonChapters(this.lessonId).subscribe({
      next: (chapters) => {
        this.chapters.set(chapters);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading chapters:', error);
        this.loading.set(false);
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm.update(v => !v);
    if (!this.showAddForm()) {
      this.resetForm();
    }
  }

  editChapter(chapter: Chapter): void {
    this.editingChapter.set(chapter);
    this.chapterForm = {
      title: chapter.title,
      description: chapter.description,
      startTime: chapter.startTime,
      endTime: chapter.endTime
    };
    this.showAddForm.set(true);
  }

  cancelEdit(): void {
    this.editingChapter.set(null);
    this.showAddForm.set(false);
    this.resetForm();
  }

  saveChapter(): void {
    // Validation
    if (!this.chapterForm.title || !this.chapterForm.startTime || !this.chapterForm.endTime) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields (Title, Start Time, End Time)'
      });
      return;
    }

    const editing = this.editingChapter();
    const orderIndex = editing ? editing.orderIndex : this.chapters().length + 1;

    if (editing) {
      // Update existing chapter
      this.contentService.updateChapter(
        editing.id,
        this.chapterForm.title,
        this.chapterForm.description,
        this.chapterForm.startTime,
        this.chapterForm.endTime,
        orderIndex
      ).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Chapter updated successfully',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadChapters();
          this.cancelEdit();
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update chapter: ' + (error.error?.message || error.message)
          });
        }
      });
    } else {
      // Create new chapter
      this.contentService.addChapter(
        this.lessonId,
        this.chapterForm.title,
        this.chapterForm.description,
        this.chapterForm.startTime,
        this.chapterForm.endTime,
        orderIndex
      ).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Created!',
            text: 'Chapter created successfully',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadChapters();
          this.cancelEdit();
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to create chapter: ' + (error.error?.message || error.message)
          });
        }
      });
    }
  }

  deleteChapter(chapter: Chapter): void {
    Swal.fire({
      title: 'Delete Chapter?',
      text: `Are you sure you want to delete "${chapter.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.contentService.deleteChapter(chapter.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Chapter deleted successfully',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadChapters();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete chapter: ' + (error.error?.message || error.message)
            });
          }
        });
      }
    });
  }

  resetForm(): void {
    this.chapterForm = {
      title: '',
      description: '',
      startTime: '',
      endTime: ''
    };
    this.editingChapter.set(null);
  }
}
