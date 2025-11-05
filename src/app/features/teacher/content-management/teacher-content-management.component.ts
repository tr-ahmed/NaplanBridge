import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

// Temporary interfaces until services are properly configured
export interface TeacherSubject {
  subjectId: number;
  subjectName: string;
  yearId: number;
  yearName: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  termsCount: number;
  lessonsCount: number;
  pendingCount: number;
}

export interface ContentItem {
  id: number;
  title?: string;
  description?: string;
  approvalStatus: string;
  createdAt?: Date;
  approvedAt?: Date;
  rejectionReason?: string;
  weekId?: number;
  duration?: number;
  objectives?: string[];
  order?: number;
  videoUrl?: string;
}

export interface PendingApproval {
  id: number;
  type: string;
  title: string;
  subjectName: string;
  createdBy: string;
  createdAt: Date;
  pendingDays: number;
}

interface Tab {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-teacher-content-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-content-management.component.html',
  styleUrls: ['./teacher-content-management.component.scss']
})
// Temporary service
class MockTeacherContentService {
  getMySubjects() {
    return { subscribe: (callbacks: any) => {
      setTimeout(() => callbacks.next([1, 2, 3]), 500);
    }};
  }

  getSubjectContent(subjectId: any, filter: any) {
    return { subscribe: (callbacks: any) => {
      setTimeout(() => callbacks.next({ lessons: [], weeks: [], terms: [], resources: [], statistics: {} }), 500);
    }};
  }

  createLesson(form: any) {
    return { subscribe: (callbacks: any) => {
      setTimeout(() => callbacks.next({}), 500);
    }};
  }

  updateLesson(id: any, form: any) {
    return { subscribe: (callbacks: any) => {
      setTimeout(() => callbacks.next({}), 500);
    }};
  }

  deleteContent(type: any, id: any) {
    return { subscribe: (callbacks: any) => {
      setTimeout(() => callbacks.next({}), 500);
    }};
  }
}

export class TeacherContentManagementComponent implements OnInit {
  private toastService = inject(ToastService);
  private contentService = new MockTeacherContentService();

  // State
  loading = signal(false);
  sidebarOpen = signal(true);
  activeTab = signal<string>('overview');

  // Data
  authorizedSubjects = signal<TeacherSubject[]>([]);
  selectedSubject = signal<TeacherSubject | null>(null);
  selectedSubjectContent = signal<any>(null);

  // Content Lists
  lessons = signal<ContentItem[]>([]);
  weeks = signal<ContentItem[]>([]);
  terms = signal<ContentItem[]>([]);
  resources = signal<ContentItem[]>([]);

  // Filters
  approvalFilter = signal<string>('all'); // all, approved, pending, rejected
  searchQuery = signal<string>('');

  // Tabs
  tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'lessons', label: 'Lessons', icon: '📚' },
    { id: 'weeks', label: 'Weeks', icon: '📅' },
    { id: 'terms', label: 'Terms', icon: '🗓️' },
    { id: 'resources', label: 'Resources', icon: '📎' }
  ];

  // Statistics
  stats = signal({
    totalLessons: 0,
    approvedLessons: 0,
    pendingLessons: 0,
    rejectedLessons: 0,
    totalSubjects: 0
  });

  // Modals
  showCreateModal = signal(false);
  showEditModal = signal(false);
  editingItem = signal<ContentItem | null>(null);

  // Form data for creating/editing
  lessonForm = {
    title: '',
    description: '',
    weekId: null as number | null,
    order: 1,
    videoUrl: '',
    duration: 0,
    objectives: [] as string[]
  };

  ngOnInit(): void {
    this.loadAuthorizedSubjects();
  }

  /**
   * Load subjects that teacher has permission to manage
   */
  loadAuthorizedSubjects(): void {
    this.loading.set(true);

    this.contentService.getMySubjects().subscribe({
      next: (subjectIds: number[]) => {
        // For now, create mock TeacherSubject objects from IDs
        // In a real implementation, you'd fetch subject details from another API
        const mockSubjects: TeacherSubject[] = subjectIds.map(id => ({
          subjectId: id,
          subjectName: `Subject ${id}`,
          yearId: 1,
          yearName: 'Year 7',
          canCreate: true,
          canEdit: true,
          canDelete: false,
          termsCount: 4,
          lessonsCount: 12,
          pendingCount: 2
        }));

        this.authorizedSubjects.set(mockSubjects);

        // Calculate total stats
        const totalStats = mockSubjects.reduce((acc: any, subject: TeacherSubject) => ({
          totalLessons: acc.totalLessons + (subject.lessonsCount || 0),
          approvedLessons: acc.approvedLessons + (subject.lessonsCount || 0) - (subject.pendingCount || 0),
          pendingLessons: acc.pendingLessons + (subject.pendingCount || 0),
          rejectedLessons: acc.rejectedLessons,
          totalSubjects: acc.totalSubjects + 1
        }), {
          totalLessons: 0,
          approvedLessons: 0,
          pendingLessons: 0,
          rejectedLessons: 0,
          totalSubjects: 0
        });

        this.stats.set(totalStats);

        // Auto-select first subject if available
        if (mockSubjects.length > 0 && !this.selectedSubject()) {
          this.selectSubject(mockSubjects[0]);
        }

        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading authorized subjects:', error);
        this.toastService.showError('Failed to load your subjects. Please try again.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Select a subject to view/manage its content
   */
  selectSubject(subject: TeacherSubject): void {
    this.selectedSubject.set(subject);
    this.loadSubjectContent(subject.subjectId);
  }

  /**
   * Load all content for selected subject
   */
  loadSubjectContent(subjectId: number): void {
    this.loading.set(true);

    this.contentService.getSubjectContent(subjectId, this.approvalFilter()).subscribe({
      next: (content: any) => {
        this.selectedSubjectContent.set(content);
        this.lessons.set(content.lessons || []);
        this.weeks.set(content.weeks || []);
        this.terms.set(content.terms || []);
        this.resources.set(content.resources || []);

        // Update stats
        if (content.statistics) {
          this.stats.update(s => ({
            ...s,
            totalLessons: content.statistics.totalLessons,
            approvedLessons: content.statistics.approvedLessons,
            pendingLessons: content.statistics.pendingLessons,
            rejectedLessons: content.statistics.rejectedLessons
          }));
        }

        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading subject content:', error);
        this.toastService.showError('Failed to load content. Please try again.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Change approval filter
   */
  changeApprovalFilter(filter: string): void {
    this.approvalFilter.set(filter);
    if (this.selectedSubject()) {
      this.loadSubjectContent(this.selectedSubject()!.subjectId);
    }
  }

  /**
   * Switch tab
   */
  switchTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  /**
   * Open create modal
   */
  openCreateModal(): void {
    this.lessonForm = {
      title: '',
      description: '',
      weekId: null,
      order: 1,
      videoUrl: '',
      duration: 0,
      objectives: []
    };
    this.showCreateModal.set(true);
  }

  /**
   * Create new lesson
   */
  createLesson(): void {
    if (!this.selectedSubject()) {
      this.toastService.showWarning('Please select a subject first');
      return;
    }

    if (!this.lessonForm.title || !this.lessonForm.weekId) {
      this.toastService.showWarning('Please fill in all required fields');
      return;
    }

    this.loading.set(true);

    this.contentService.createLesson(this.lessonForm).subscribe({
      next: (response: any) => {
        this.toastService.showSuccess('Lesson created successfully! Awaiting admin approval.');
        this.showCreateModal.set(false);
        this.loadSubjectContent(this.selectedSubject()!.subjectId);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error creating lesson:', error);
        this.toastService.showError('Failed to create lesson. Please try again.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Open edit modal
   */
  openEditModal(item: ContentItem): void {
    this.editingItem.set(item);
    this.lessonForm = {
      title: item.title || '',
      description: item.description || '',
      weekId: item.weekId || null,
      order: item.order || 1,
      videoUrl: item.videoUrl || '',
      duration: item.duration || 0,
      objectives: item.objectives || []
    };
    this.showEditModal.set(true);
  }

  /**
   * Update lesson
   */
  updateLesson(): void {
    const item = this.editingItem();
    if (!item) return;

    this.loading.set(true);

    this.contentService.updateLesson(item.id, this.lessonForm).subscribe({
      next: (response: any) => {
        this.toastService.showSuccess('Lesson updated successfully! Awaiting admin re-approval.');
        this.showEditModal.set(false);
        this.editingItem.set(null);
        this.loadSubjectContent(this.selectedSubject()!.subjectId);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error updating lesson:', error);
        this.toastService.showError('Failed to update lesson. Please try again.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Delete content item
   */
  deleteItem(itemType: string, itemId: number): void {
    if (!confirm(`Are you sure you want to delete this ${itemType}?`)) {
      return;
    }

    this.loading.set(true);

    this.contentService.deleteContent(itemType, itemId).subscribe({
      next: () => {
        this.toastService.showSuccess(`${itemType} deleted successfully`);
        this.loadSubjectContent(this.selectedSubject()!.subjectId);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error deleting item:', error);
        this.toastService.showError('Failed to delete item. Please try again.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Get approval status badge class
   */
  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get approval status icon
   */
  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
        return '✅';
      case 'pending':
        return '⏳';
      case 'rejected':
        return '❌';
      default:
        return '❓';
    }
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  /**
   * Close modals
   */
  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingItem.set(null);
  }

  /**
   * Filter lessons by search query
   */
  get filteredLessons() {
    const query = this.searchQuery().toLowerCase();
    return this.lessons().filter(lesson =>
      lesson.title?.toLowerCase().includes(query) ||
      lesson.description?.toLowerCase().includes(query)
    );
  }
}
