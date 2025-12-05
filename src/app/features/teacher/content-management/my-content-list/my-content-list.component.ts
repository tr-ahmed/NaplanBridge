import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentItem, TeacherContentManagementService } from '../../services/teacher-content-management.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-my-content-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">🔍 Filter Content</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select [(ngModel)]="selectedStatus" (change)="applyFilters()" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PUBLISHED">Published</option>
              <option value="REJECTED">Rejected</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
            </select>
          </div>

          <!-- Type Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <select [(ngModel)]="selectedType" (change)="applyFilters()" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">All Types</option>
              <option value="Lesson">Lesson</option>
              <option value="Exam">Exam</option>
              <option value="Resource">Resource</option>
              <option value="Question">Question</option>
            </select>
          </div>

          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input type="text"
                   [(ngModel)]="searchTerm"
                   (input)="applyFilters()"
                   placeholder="Search content..."
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg">
          </div>
        </div>
      </div>

      <!-- Content List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">
            📚 My Content
            <span class="ml-2 text-sm text-gray-500">({{ filteredContent().length }})</span>
          </h2>
        </div>

        <div *ngIf="filteredContent().length === 0" class="p-6 text-center">
          <p class="text-gray-500">No content found. Start creating!</p>
        </div>

        <div *ngIf="filteredContent().length > 0" class="divide-y">
          <div *ngFor="let item of filteredContent()"
               class="p-6 hover:bg-gray-50 transition-colors border-l-4"
               [ngClass]="getStatusBorderColor(item.status)">

            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-2xl">{{ getItemIcon(item.itemType) }}</span>
                  <h3 class="text-lg font-semibold text-gray-900">{{ item.title }}</h3>
                  <span [class]="'px-3 py-1 rounded-full text-xs font-medium ' + getStatusBadgeClass(item.status)">
                    {{ getStatusIcon(item.status) }} {{ formatStatus(item.status) }}
                  </span>
                </div>
                <p *ngIf="item.description" class="text-gray-600 text-sm mb-2">{{ item.description }}</p>
                <div class="flex gap-4 text-xs text-gray-500">
                  <span>Type: {{ item.itemType }}</span>
                  <span>Created: {{ item.createdAt | date:'d MMM yyyy' }}</span>
                  <span *ngIf="item.rejectionReason">Reason: {{ item.rejectionReason }}</span>
                </div>
              </div>

              <div class="ml-4 flex-shrink-0">
                <span class="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                  ID: {{ item.itemId }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 mt-4">
              <button *ngIf="canEdit(item)"
                      (click)="onEdit.emit(item)"
                      class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
                ✏️ Edit
              </button>

              <button *ngIf="canDelete(item)"
                      (click)="onDelete.emit(item)"
                      class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition">
                🗑️ Delete
              </button>

              <button *ngIf="canSubmit(item)"
                      (click)="onSubmit.emit(item)"
                      class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition">
                📤 Submit
              </button>

              <button (click)="onViewHistory.emit(item)"
                      class="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition">
                📋 History
              </button>
            </div>

            <!-- Revision Feedback -->
            <div *ngIf="item.revisionFeedback" class="mt-3 p-3 bg-purple-50 border border-purple-200 rounded text-sm">
              <p class="font-semibold text-purple-900 mb-1">🔄 Revision Feedback:</p>
              <p class="text-purple-800">{{ item.revisionFeedback }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class MyContentListComponent {
  @Input() content = signal<ContentItem[]>([]);
  @Output() onEdit = new EventEmitter<ContentItem>();
  @Output() onDelete = new EventEmitter<ContentItem>();
  @Output() onSubmit = new EventEmitter<ContentItem>();
  @Output() onViewHistory = new EventEmitter<ContentItem>();

  selectedStatus = '';
  selectedType = '';
  searchTerm = '';
  filteredContent = signal<ContentItem[]>([]);

  private toastService = inject(ToastService);

  ngOnChanges(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.content()];

    if (this.selectedStatus) {
      filtered = filtered.filter(c => c.status === this.selectedStatus);
    }

    if (this.selectedType) {
      filtered = filtered.filter(c => c.itemType === this.selectedType);
    }

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(search) ||
        c.description?.toLowerCase().includes(search)
      );
    }

    this.filteredContent.set(filtered);
  }

  canEdit(item: ContentItem): boolean {
    return ['PENDING', 'REVISION_REQUESTED', 'CREATED'].includes(item.status);
  }

  canDelete(item: ContentItem): boolean {
    return ['PENDING', 'REVISION_REQUESTED', 'CREATED', 'REJECTED'].includes(item.status);
  }

  canSubmit(item: ContentItem): boolean {
    return item.status === 'CREATED' || item.status === 'REVISION_REQUESTED';
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'CREATED': 'bg-gray-100 text-gray-800',
      'SUBMITTED': 'bg-blue-100 text-blue-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'PUBLISHED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'REVISION_REQUESTED': 'bg-purple-100 text-purple-800',
      'PENDING_REVISION': 'bg-orange-100 text-orange-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusBorderColor(status: string): string {
    const classes: { [key: string]: string } = {
      'CREATED': 'border-gray-400',
      'SUBMITTED': 'border-blue-400',
      'PENDING': 'border-yellow-400',
      'APPROVED': 'border-green-400',
      'PUBLISHED': 'border-green-400',
      'REJECTED': 'border-red-400',
      'REVISION_REQUESTED': 'border-purple-400',
      'PENDING_REVISION': 'border-orange-400'
    };
    return classes[status] || 'border-gray-400';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'CREATED': '✏️',
      'SUBMITTED': '📤',
      'PENDING': '⏳',
      'APPROVED': '✅',
      'PUBLISHED': '🔴',
      'REJECTED': '❌',
      'REVISION_REQUESTED': '🔄',
      'PENDING_REVISION': '⏳'
    };
    return icons[status] || '❓';
  }

  getItemIcon(itemType: string): string {
    const icons: { [key: string]: string } = {
      'Lesson': '📚',
      'Exam': '📝',
      'Question': '❓',
      'Resource': '📎',
      'Certificate': '🏆'
    };
    return icons[itemType] || '📄';
  }

  formatStatus(status: string): string {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
}
