import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherSubject, ContentItem } from '../../services/teacher-content-management.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Header Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Total Content -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-600 text-sm font-semibold">Total Content</p>
              <p class="text-3xl font-bold text-blue-900">{{ stats().totalContent }}</p>
            </div>
            <div class="text-4xl">📚</div>
          </div>
        </div>

        <!-- Approved -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-600 text-sm font-semibold">Approved</p>
              <p class="text-3xl font-bold text-green-900">{{ stats().approved }}</p>
            </div>
            <div class="text-4xl">✅</div>
          </div>
        </div>

        <!-- Pending -->
        <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-yellow-600 text-sm font-semibold">Pending</p>
              <p class="text-3xl font-bold text-yellow-900">{{ stats().pending }}</p>
            </div>
            <div class="text-4xl">⏳</div>
          </div>
        </div>

        <!-- Revision Requested -->
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-600 text-sm font-semibold">Revisions</p>
              <p class="text-3xl font-bold text-purple-900">{{ stats().revisionRequested }}</p>
            </div>
            <div class="text-4xl">🔄</div>
          </div>
        </div>

        <!-- Rejected -->
        <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-red-600 text-sm font-semibold">Rejected</p>
              <p class="text-3xl font-bold text-red-900">{{ stats().rejected }}</p>
            </div>
            <div class="text-4xl">❌</div>
          </div>
        </div>
      </div>

      <!-- Authorized Subjects -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">📖 Your Authorized Subjects</h2>

        <div *ngIf="subjects().length === 0" class="text-center py-8">
          <p class="text-gray-500">No subjects assigned yet. Contact an administrator.</p>
        </div>

        <div *ngIf="subjects().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let subject of subjects()"
               class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
               [class.border-blue-300]="isSelected(subject)"
               [class.bg-blue-50]="isSelected(subject)"
               (click)="onSelectSubject.emit(subject)">

            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="font-semibold text-gray-900">{{ subject.subjectName }}</h3>
                <p class="text-sm text-gray-500">{{ subject.yearName }}</p>
              </div>
              <span class="text-2xl">📚</span>
            </div>

            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="bg-gray-100 rounded px-2 py-1">
                <span class="text-gray-600">{{ subject.lessonsCount }}</span>
                <span class="text-gray-500 text-xs">Lessons</span>
              </div>
              <div class="bg-green-100 rounded px-2 py-1">
                <span class="text-green-700">{{ subject.termsCount }}</span>
                <span class="text-green-600 text-xs">Terms</span>
              </div>
              <div class="bg-yellow-100 rounded px-2 py-1">
                <span class="text-yellow-700">{{ subject.pendingCount }}</span>
                <span class="text-yellow-600 text-xs">Pending</span>
              </div>
              <div class="bg-blue-100 rounded px-2 py-1">
                <span class="text-blue-700">{{ subject.subjectId }}</span>
                <span class="text-blue-600 text-xs">ID</span>
              </div>
            </div>

            <!-- Permissions -->
            <div class="mt-3 flex gap-1 flex-wrap">
              <span *ngIf="subject.canCreate" class="inline-block bg-green-200 text-green-800 text-xs px-2 py-1 rounded">Can Create</span>
              <span *ngIf="subject.canEdit" class="inline-block bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded">Can Edit</span>
              <span *ngIf="subject.canDelete" class="inline-block bg-red-200 text-red-800 text-xs px-2 py-1 rounded">Can Delete</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">📊 Quick Stats</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <p class="text-3xl font-bold text-blue-600">{{ stats().totalSubjects }}</p>
            <p class="text-sm text-gray-600">Subjects</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-purple-600">{{ approvalRate() }}%</p>
            <p class="text-sm text-gray-600">Approval Rate</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-orange-600">{{ avgReviewTime() }}</p>
            <p class="text-sm text-gray-600">Avg Review Time</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-indigo-600">{{ recentSubmissions() }}</p>
            <p class="text-sm text-gray-600">This Month</p>
          </div>
        </div>
      </div>

      <!-- Guidelines -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="font-bold text-blue-900 mb-3">📋 Content Guidelines</h3>
        <ul class="space-y-2 text-sm text-blue-800">
          <li>✓ Content must be approved by admin before being published</li>
          <li>✓ You can only view and edit your own content</li>
          <li>✓ Once approved, content becomes available to students</li>
          <li>✓ If rejected, you can revise and resubmit</li>
          <li>✓ Changes to approved content require re-approval</li>
        </ul>
      </div>
    </div>
  `,
  styles: []
})
export class TeacherDashboardComponent {
  @Input() stats = signal({ totalContent: 0, approved: 0, pending: 0, rejected: 0, revisionRequested: 0, totalSubjects: 0 });
  @Input() subjects = signal<TeacherSubject[]>([]);
  @Input() selectedSubject = signal<TeacherSubject | null>(null);
  @Output() onSelectSubject = new EventEmitter<TeacherSubject>();

  approvalRate(): number {
    const total = this.stats().totalContent;
    return total === 0 ? 0 : Math.round((this.stats().approved / total) * 100);
  }

  avgReviewTime(): string {
    return '2-3 days'; // This would come from backend
  }

  recentSubmissions(): number {
    return 5; // This would come from backend
  }

  isSelected(subject: TeacherSubject): boolean {
    return this.selectedSubject()?.subjectId === subject.subjectId;
  }
}
