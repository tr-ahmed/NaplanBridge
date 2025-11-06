import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Interfaces
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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Real Teacher Content Service
class TeacherContentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/TeacherContent`;
  private baseApiUrl = environment.apiBaseUrl;

  getMySubjects(): Observable<number[]> {
    return this.http.get<ApiResponse<number[]>>(`${this.apiUrl}/my-subjects`)
      .pipe(map(response => response.data));
  }

  canManageSubject(subjectId: number): Observable<{ canCreate: boolean; canEdit: boolean; canDelete: boolean }> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/can-manage/${subjectId}`)
      .pipe(map(response => response.data));
  }

  getMyContent(filters?: { subjectId?: number; status?: string }): Observable<any[]> {
    let params: any = {};
    if (filters?.subjectId) params.subjectId = filters.subjectId;
    if (filters?.status) params.status = filters.status;

    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/my-content`, { params })
      .pipe(map(response => response.data));
  }

  createLesson(form: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}/Lessons`, form);
  }

  updateLesson(id: number, form: any): Observable<any> {
    return this.http.put<any>(`${this.baseApiUrl}/Lessons/${id}`, form);
  }

  deleteContent(type: string, id: number): Observable<any> {
    const endpoints: any = {
      'lesson': 'Lessons',
      'week': 'Weeks',
      'term': 'Terms',
      'resource': 'Resources'
    };
    const endpoint = endpoints[type.toLowerCase()] || 'Lessons';
    return this.http.delete(`${this.baseApiUrl}/${endpoint}/${id}`);
  }
}

@Component({
  selector: 'app-teacher-content-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-content-management.component.html',
  styleUrls: ['./teacher-content-management.component.scss']
})
export class TeacherContentManagementComponent implements OnInit {
  private toastService = inject(ToastService);
  private contentService = new TeacherContentService();

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
        if (subjectIds.length === 0) {
          this.toastService.showWarning('You do not have permission to manage any subjects yet. Please contact an administrator.');
          this.loading.set(false);
          return;
        }

        // Fetch subject details from Subjects API
        const http = inject(HttpClient);
        const subjectRequests = subjectIds.map(id =>
          http.get<any>(`${environment.apiBaseUrl}/Subjects/${id}`)
        );

        // Use forkJoin to wait for all subjects to load
        import('rxjs').then(({ forkJoin }) => {
          forkJoin(subjectRequests).subscribe({
            next: (subjects: any[]) => {
              // Get permissions for each subject
              const permissionRequests = subjectIds.map(id =>
                this.contentService.canManageSubject(id)
              );

              forkJoin(permissionRequests).subscribe({
                next: (permissions: any[]) => {
                  // Combine subject data with permissions
                  const teacherSubjects: TeacherSubject[] = subjects.map((subject, index) => ({
                    subjectId: subject.id,
                    subjectName: subject.name,
                    yearId: subject.yearId,
                    yearName: subject.yearName || `Year ${subject.yearId}`,
                    canCreate: permissions[index].canCreate,
                    canEdit: permissions[index].canEdit,
                    canDelete: permissions[index].canDelete,
                    termsCount: subject.termsCount || 0,
                    lessonsCount: 0,
                    pendingCount: 0
                  }));

                  this.authorizedSubjects.set(teacherSubjects);
                  this.stats.update(s => ({ ...s, totalSubjects: teacherSubjects.length }));

                  // Auto-select first subject
                  if (teacherSubjects.length > 0 && !this.selectedSubject()) {
                    this.selectSubject(teacherSubjects[0]);
                  }

                  this.loading.set(false);
                },
                error: (error: any) => {
                  console.error('Error loading permissions:', error);
                  this.toastService.showError('Failed to load permissions.');
                  this.loading.set(false);
                }
              });
            },
            error: (error: any) => {
              console.error('Error loading subjects:', error);
              this.toastService.showError('Failed to load subject details.');
              this.loading.set(false);
            }
          });
        });
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

    const filters = {
      subjectId: subjectId,
      status: this.approvalFilter() === 'all' ? undefined : this.approvalFilter()
    };

    this.contentService.getMyContent(filters).subscribe({
      next: (content: any[]) => {
        // Separate content by type
        const lessons = content.filter(c => c.type === 'Lesson');
        const weeks = content.filter(c => c.type === 'Week');
        const terms = content.filter(c => c.type === 'Term');
        const resources = content.filter(c => c.type === 'Resource');

        this.lessons.set(lessons);
        this.weeks.set(weeks);
        this.terms.set(terms);
        this.resources.set(resources);

        // Calculate stats
        const totalLessons = lessons.length;
        const approvedLessons = lessons.filter(l => l.status === 'Approved').length;
        const pendingLessons = lessons.filter(l => l.status === 'Pending').length;
        const rejectedLessons = lessons.filter(l => l.status === 'Rejected').length;

        this.stats.update(s => ({
          ...s,
          totalLessons,
          approvedLessons,
          pendingLessons,
          rejectedLessons
        }));

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
