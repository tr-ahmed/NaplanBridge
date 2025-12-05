import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherContentManagementService, ContentItem, ApprovalHistoryDto } from '../../services/teacher-content-management.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-approval-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" *ngIf="isOpen()">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">

        <!-- Header -->
        <div class="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 class="text-xl font-bold">📋 Approval History</h2>
            <p *ngIf="content()" class="text-sm text-purple-100 mt-1">{{ content()!.title }}</p>
          </div>
          <button (click)="onClose.emit()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-6">
          <!-- Content Info -->
          <div *ngIf="content()" class="mb-6 p-4 bg-gray-50 rounded-lg">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-xs text-gray-600">Type</p>
                <p class="font-semibold text-gray-900">{{ content()!.itemType }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-600">Status</p>
                <p class="font-semibold" [ngClass]="getStatusColor(content()!.status)">
                  {{ formatStatus(content()!.status) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-600">Created</p>
                <p class="font-semibold text-gray-900">{{ content()!.createdAt | date:'d MMM yyyy' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-600">By</p>
                <p class="font-semibold text-gray-900">{{ content()!.createdBy }}</p>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div *ngIf="history().length > 0" class="space-y-4">
            <h3 class="text-sm font-bold text-gray-700 uppercase">History Timeline</h3>

            <div class="relative">
              <!-- Timeline line -->
              <div class="absolute left-4 top-0 bottom-0 w-1 bg-gray-300"></div>

              <!-- Timeline items -->
              <div *ngFor="let item of history(); let first = first; let last = last"
                   class="relative pl-16 pb-6"
                   [class.pb-0]="last">

                <!-- Timeline dot -->
                <div class="absolute left-0 top-1 w-9 h-9 rounded-full flex items-center justify-center"
                     [ngClass]="getActionBgColor(item.action)">
                  <span class="text-lg">{{ getActionIcon(item.action) }}</span>
                </div>

                <!-- Content -->
                <div class="bg-white border rounded-lg p-4">
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold text-gray-900">{{ item.action }}</h4>
                    <span class="text-xs text-gray-500">{{ item.actionDate | date:'d MMM yyyy' }}</span>
                  </div>

                  <p class="text-sm text-gray-600 mb-2">By: <strong>{{ item.actionBy }}</strong></p>

                  <div class="flex gap-2 items-center mb-2">
                    <span class="text-xs" [ngClass]="getStatusBadgeClass(item.previousStatus)">
                      {{ formatStatus(item.previousStatus || 'START') }}
                    </span>
                    <span class="text-gray-400">→</span>
                    <span class="text-xs" [ngClass]="getStatusBadgeClass(item.newStatus)">
                      {{ formatStatus(item.newStatus) }}
                    </span>
                  </div>

                  <p *ngIf="item.remarks" class="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-2">
                    <strong>Remarks:</strong> {{ item.remarks }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- No History -->
          <div *ngIf="history().length === 0 && !loading()" class="text-center py-8">
            <p class="text-gray-500">No history available yet</p>
          </div>

          <!-- Loading -->
          <div *ngIf="loading()" class="text-center py-8">
            <p class="text-gray-500">Loading history...</p>
          </div>

          <!-- Current Status Info -->
          <div *ngIf="content()" class="mt-6 p-4 rounded-lg"
               [ngClass]="'bg-' + getStatusBgColor(content()!.status) + '-50'">
            <h3 class="font-semibold mb-2" [ngClass]="'text-' + getStatusBgColor(content()!.status) + '-900'">
              Current Status: {{ formatStatus(content()!.status) }}
            </h3>

            <p *ngIf="content()!.status === 'REVISION_REQUESTED'"
               class="text-sm text-purple-800">
              ⚠️ Your content needs revision. Please review the feedback above and resubmit.
            </p>

            <p *ngIf="content()!.status === 'REJECTED'"
               class="text-sm text-red-800">
              ❌ Your content was rejected. You can edit it and resubmit.
            </p>

            <p *ngIf="content()!.status === 'PENDING' || content()!.status === 'SUBMITTED'"
               class="text-sm text-yellow-800">
              ⏳ Your content is awaiting admin review. Please wait for feedback.
            </p>

            <p *ngIf="content()!.status === 'APPROVED' || content()!.status === 'PUBLISHED'"
               class="text-sm text-green-800">
              ✅ Your content has been approved and is available to students.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="sticky bottom-0 bg-gray-100 px-6 py-4 flex justify-end gap-2">
          <button (click)="onClose.emit()"
                  class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ApprovalHistoryComponent implements OnInit {
  @Input() isOpen = signal(false);
  @Input() content = signal<ContentItem | null>(null);
  @Output() onClose = new EventEmitter<void>();

  private contentService = inject(TeacherContentManagementService);
  private toastService = inject(ToastService);

  history = signal<ApprovalHistoryDto[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadHistory();
  }

  ngOnChanges(): void {
    if (this.isOpen() && this.content()) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    const item = this.content();
    if (!item) return;

    this.loading.set(true);

    this.contentService.getApprovalHistory(item.itemType, item.itemId)
      .subscribe({
        next: (history: ApprovalHistoryDto[]) => {
          this.history.set(history);
          this.loading.set(false);
        },
        error: (error: any) => {
          console.error('Error loading history:', error);
          this.toastService.showError('Failed to load history');
          this.loading.set(false);
        }
      });
  }

  getActionIcon(action: string): string {
    const icons: { [key: string]: string } = {
      'Submitted': '📤',
      'Approved': '✅',
      'Rejected': '❌',
      'RequestRevision': '🔄',
      'Resubmitted': '🔄'
    };
    return icons[action] || '📝';
  }

  getActionBgColor(action: string): string {
    const colors: { [key: string]: string } = {
      'Submitted': 'bg-blue-500',
      'Approved': 'bg-green-500',
      'Rejected': 'bg-red-500',
      'RequestRevision': 'bg-purple-500',
      'Resubmitted': 'bg-blue-500'
    };
    return colors[action] || 'bg-gray-500';
  }

  getStatusBadgeClass(status: string | undefined): string {
    if (!status) return 'bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs';

    const classes: { [key: string]: string } = {
      'CREATED': 'bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs',
      'SUBMITTED': 'bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs',
      'PENDING': 'bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs',
      'APPROVED': 'bg-green-200 text-green-800 px-2 py-1 rounded text-xs',
      'PUBLISHED': 'bg-green-200 text-green-800 px-2 py-1 rounded text-xs',
      'REJECTED': 'bg-red-200 text-red-800 px-2 py-1 rounded text-xs',
      'REVISION_REQUESTED': 'bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs',
      'PENDING_REVISION': 'bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs'
    };
    return classes[status] || 'bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'CREATED': 'text-gray-800',
      'SUBMITTED': 'text-blue-800',
      'PENDING': 'text-yellow-800',
      'APPROVED': 'text-green-800',
      'PUBLISHED': 'text-green-800',
      'REJECTED': 'text-red-800',
      'REVISION_REQUESTED': 'text-purple-800',
      'PENDING_REVISION': 'text-orange-800'
    };
    return colors[status] || 'text-gray-800';
  }

  getStatusBgColor(status: string): string {
    const colors: { [key: string]: string } = {
      'CREATED': 'gray',
      'SUBMITTED': 'blue',
      'PENDING': 'yellow',
      'APPROVED': 'green',
      'PUBLISHED': 'green',
      'REJECTED': 'red',
      'REVISION_REQUESTED': 'purple',
      'PENDING_REVISION': 'orange'
    };
    return colors[status] || 'gray';
  }

  formatStatus(status: string | undefined): string {
    if (!status) return 'START';
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
}
