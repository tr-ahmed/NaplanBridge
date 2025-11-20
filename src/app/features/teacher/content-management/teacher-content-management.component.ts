import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { ToastService } from '../../../core/services/toast.service';
import {
  TeacherContentManagementService,
  TeacherSubject,
  ContentItem,
  ContentFilterDto
} from '../services/teacher-content-management.service';
import { TeacherPermissionService, TeacherPermissionDto } from '../services/teacher-permission.service';
import { TeacherDashboardComponent } from './teacher-dashboard/teacher-dashboard.component';
import { MyContentListComponent } from './my-content-list/my-content-list.component';
import { ContentCreationWizardComponent } from './content-creation-wizard/content-creation-wizard.component';
import { ApprovalHistoryComponent } from './approval-history/approval-history.component';

interface TeacherTab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-teacher-content-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TeacherDashboardComponent,
    MyContentListComponent,
    ContentCreationWizardComponent,
    ApprovalHistoryComponent
  ],
  templateUrl: './teacher-content-management.component.html',
  styleUrls: ['./teacher-content-management.component.scss']
})
export class TeacherContentManagementComponent implements OnInit, OnDestroy {
  private contentService = inject(TeacherContentManagementService);
  private permissionService = inject(TeacherPermissionService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  // ===== State Management =====
  loading = signal(false);
  sidebarOpen = signal(true);
  activeTab = signal<string>('dashboard');
  mobileMenuOpen = signal(false);

  // ===== Data =====
  authorizedSubjects = signal<TeacherSubject[]>([]);
  selectedSubject = signal<TeacherSubject | null>(null);
  allContent = signal<ContentItem[]>([]);
  myPermissions = signal<TeacherPermissionDto[]>([]);

  // ===== Statistics =====
  stats = signal({
    totalContent: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    revisionRequested: 0,
    totalSubjects: 0
  });

  // ===== Tabs =====
  tabs: TeacherTab[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'my-content', label: 'My Content', icon: '📚' },
    { id: 'create', label: 'Create Content', icon: '➕' },
    { id: 'history', label: 'Approval History', icon: '📋' }
  ];

  // ===== Modals & Forms =====
  showCreateModal = signal(false);
  selectedContentForHistory = signal<ContentItem | null>(null);
  showHistoryModal = signal(false);

  ngOnInit(): void {
    this.loadAuthorizedSubjects();
    this.loadDashboardStats();
    this.loadAllContent();
    this.loadMyPermissions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load teacher's permissions
   */
  private loadMyPermissions(): void {
    const currentUser = this.getCurrentUserId();
    if (!currentUser) {
      console.warn('No user ID found');
      return;
    }

    this.permissionService.getTeacherPermissions(currentUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.myPermissions.set(response.data);
          console.log('✅ Permissions loaded:', response.data.length);
        },
        error: (error: any) => {
          console.error('Error loading permissions:', error);
        }
      });
  }

  /**
   * Get current user ID (from localStorage or service)
   */
  private getCurrentUserId(): number {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.id || 0;
  }

  /**
   * Load subjects that teacher has permission to manage
   */
  private loadAuthorizedSubjects(): void {
    this.loading.set(true);

    this.contentService.getMySubjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (subjects: TeacherSubject[]) => {
          this.authorizedSubjects.set(subjects);
          this.stats.update(s => ({ ...s, totalSubjects: subjects.length }));

          if (subjects.length === 0) {
            this.toastService.showWarning('You do not have permission to manage any subjects yet.');
          } else if (!this.selectedSubject()) {
            // Auto-select first subject
            this.selectSubject(subjects[0]);
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
   * Load all teacher content
   */
  private loadAllContent(): void {
    this.contentService.getMyContent()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (content: ContentItem[]) => {
          this.allContent.set(content);
          this.updateStats(content);
        },
        error: (error: any) => {
          console.error('Error loading content:', error);
        }
      });
  }

  /**
   * Load dashboard statistics
   */
  private loadDashboardStats(): void {
    this.contentService.getTeacherDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dashboardStats: any) => {
          if (dashboardStats) {
            this.stats.set(dashboardStats);
          }
        },
        error: (error: any) => {
          console.error('Error loading stats:', error);
        }
      });
  }

  /**
   * Update statistics from content list
   */
  private updateStats(content: ContentItem[]): void {
    const stats = {
      totalContent: content.length,
      approved: content.filter(c => c.status === 'APPROVED' || c.status === 'PUBLISHED').length,
      pending: content.filter(c => c.status === 'PENDING' || c.status === 'SUBMITTED').length,
      rejected: content.filter(c => c.status === 'REJECTED').length,
      revisionRequested: content.filter(c => c.status === 'REVISION_REQUESTED').length,
      totalSubjects: this.authorizedSubjects().length
    };

    this.stats.set(stats);
  }

  /**
   * Select a subject to filter content
   */
  selectSubject(subject: TeacherSubject): void {
    this.selectedSubject.set(subject);
  }

  /**
   * Switch active tab
   */
  switchTab(tabId: string): void {
    this.activeTab.set(tabId);
    this.mobileMenuOpen.set(false);
  }

  /**
   * Refresh content
   */
  refreshContent(): void {
    this.loading.set(true);
    this.loadAllContent();
    this.loadDashboardStats();

    setTimeout(() => {
      this.loading.set(false);
      this.toastService.showSuccess('Content refreshed');
    }, 1000);
  }

  /**
   * Handle content creation completion
   */
  onContentCreated(content: ContentItem): void {
    this.toastService.showSuccess('Content created successfully! Awaiting admin approval.');
    this.showCreateModal.set(false);
    this.loadAllContent();
    this.switchTab('my-content');
  }

  /**
   * Show content approval history
   */
  showContentHistory(content: ContentItem): void {
    this.selectedContentForHistory.set(content);
    this.showHistoryModal.set(true);
  }

  /**
   * Handle content deletion
   */
  onContentDeleted(): void {
    this.toastService.showSuccess('Content deleted successfully');
    this.loadAllContent();
  }

  /**
   * Handle content submission for approval
   */
  onContentSubmitted(): void {
    this.toastService.showSuccess('Content submitted for approval. You will be notified when reviewed.');
    this.loadAllContent();
  }

  /**
   * Toggle mobile sidebar
   */
  toggleMobileSidebar(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  /**
   * Toggle desktop sidebar
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

  closeHistoryModal(): void {
    this.showHistoryModal.set(false);
    this.selectedContentForHistory.set(null);
  }

  /**
   * Get status badge color
   */
  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'CREATED': 'bg-gray-100 text-gray-800',
      'SUBMITTED': 'bg-blue-100 text-blue-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'PUBLISHED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'REVISION_REQUESTED': 'bg-purple-100 text-purple-800',
      'PENDING_REVISION': 'bg-orange-100 text-orange-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'CREATED': '✏️',
      'SUBMITTED': '📤',
      'PENDING': '⏳',
      'APPROVED': '✅',
      'PUBLISHED': '🔴',
      'REJECTED': '❌',
      'REVISION_REQUESTED': '🔄',
      'PENDING_REVISION': '⏳'
    };
    return statusIcons[status] || '❓';
  }

  /**
   * Check if teacher has permission to perform action on subject
   */
  hasPermission(subjectId: number, action: 'create' | 'edit' | 'delete'): boolean {
    const permission = this.myPermissions().find(p => p.subjectId === subjectId);
    if (!permission) return false;

    switch (action) {
      case 'create':
        return permission.canCreate;
      case 'edit':
        return permission.canEdit;
      case 'delete':
        return permission.canDelete;
      default:
        return false;
    }
  }

  /**
   * Get permission details for subject
   */
  getSubjectPermission(subjectId: number): TeacherPermissionDto | undefined {
    return this.myPermissions().find(p => p.subjectId === subjectId);
  }

  /**
   * Check if teacher can access content management
   */
  canAccessContentManagement(): boolean {
    return this.myPermissions().length > 0;
  }
}

