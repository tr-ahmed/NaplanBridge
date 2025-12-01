/**
 * Teacher Exam Management Component
 * Full exam management for teachers with permission-based access control
 * Similar to admin exam management but restricted to teacher's authorized subjects
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExamApiService } from '../../../core/services/exam-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { TeacherPermissionService, TeacherPermissionDto } from '../services/teacher-permission.service';
import { ExamDto, ExamType, TeacherExamDto } from '../../../models/exam-api.models';
import { SubjectService } from '../../../core/services/subject.service';
import { Subject } from '../../../models/subject.models';
import { TeacherSidebarComponent } from '../../../shared/components/teacher-sidebar/teacher-sidebar.component';
import { TeacherHeaderComponent } from '../../../shared/components/teacher-header/teacher-header.component';

interface ExamListItem {
  id: number;
  title: string;
  examType: ExamType;
  subjectId: number;
  subjectName: string;
  totalMarks: number;
  durationInMinutes: number;
  startTime?: Date;
  endTime?: Date;
  isPublished: boolean;
  totalSubmissions: number;
  pendingGrading: number;
  averageScore?: number;
  createdAt: Date;
  // Permission flags
  canEdit: boolean;
  canDelete: boolean;
}

interface FilterOptions {
  searchTerm: string;
  examType: ExamType | 'All';
  subjectId: number | 'All';
  status: 'All' | 'Published' | 'Draft' | 'Completed' | 'Upcoming';
  sortBy: 'newest' | 'oldest' | 'title' | 'submissions';
}

@Component({
  selector: 'app-teacher-exam-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './teacher-exam-management.component.html',
  styleUrl: './teacher-exam-management.component.scss'
})
export class TeacherExamManagementComponent implements OnInit {
  // Services
  private examApi = inject(ExamApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private permissionService = inject(TeacherPermissionService);
  private subjectService = inject(SubjectService);
  private router = inject(Router);

  // State
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Data
  teacherId: number = 0;
  allExams = signal<ExamListItem[]>([]);
  selectedExams = signal<Set<number>>(new Set());
  teacherPermissions = signal<TeacherPermissionDto[]>([]);
  authorizedSubjects = signal<number[]>([]);
  allSubjects = signal<Subject[]>([]); // Store all subjects for name lookup

  // Filters
  filters = signal<FilterOptions>({
    searchTerm: '',
    examType: 'All',
    subjectId: 'All',
    status: 'All',
    sortBy: 'newest'
  });

  // View mode
  viewMode = signal<'grid' | 'list'>('list');

  // Computed values
  filteredExams = computed(() => {
    let exams = [...this.allExams()];
    const filter = this.filters();

    // Search filter
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      exams = exams.filter(e =>
        e.title.toLowerCase().includes(term) ||
        e.subjectName.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filter.examType !== 'All') {
      exams = exams.filter(e => e.examType === filter.examType);
    }

    // Subject filter
    if (filter.subjectId !== 'All') {
      exams = exams.filter(e => e.subjectId === filter.subjectId);
    }

    // Status filter
    if (filter.status !== 'All') {
      const now = new Date();
      exams = exams.filter(e => {
        switch (filter.status) {
          case 'Published':
            return e.isPublished;
          case 'Draft':
            return !e.isPublished;
          case 'Upcoming':
            return e.startTime && new Date(e.startTime) > now;
          case 'Completed':
            return e.endTime && new Date(e.endTime) < now;
          default:
            return true;
        }
      });
    }

    // Sort
    exams.sort((a, b) => {
      switch (filter.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'submissions':
          return b.totalSubmissions - a.totalSubmissions;
        default:
          return 0;
      }
    });

    return exams;
  });

  totalExams = computed(() => this.allExams().length);
  publishedCount = computed(() => this.allExams().filter(e => e.isPublished).length);
  draftCount = computed(() => this.allExams().filter(e => !e.isPublished).length);
  pendingGradingCount = computed(() =>
    this.allExams().reduce((sum, e) => sum + e.pendingGrading, 0)
  );

  hasSelection = computed(() => this.selectedExams().size > 0);
  selectedCount = computed(() => this.selectedExams().size);

  // Get unique subjects from permissions
  availableSubjects = computed(() => {
    const permissions = this.teacherPermissions();
    const subjects = this.allSubjects();
    const subjectMap = new Map<number, string>();

    permissions.forEach(p => {
      if (!subjectMap.has(p.subjectId)) {
        // Try to get name from permission, fallback to subject list lookup
        let name = p.subjectName;
        if (!name || name === 'Unknown') {
          const subject = subjects.find(s => s.id === p.subjectId);
          if (subject) {
            name = subject.subjectName;
          }
        }
        subjectMap.set(p.subjectId, name || `Subject ${p.subjectId}`);
      }
    });
    return Array.from(subjectMap.entries()).map(([id, name]) => ({ id, name }));
  });

  // Check if teacher can create exams in any subject
  canCreateExams = computed(() => {
    return this.teacherPermissions().some(p => p.canCreate && p.isActive);
  });

  /**
   * Get subject name by ID
   */
  getSubjectName(subjectId: number | 'All'): string {
    if (subjectId === 'All') return 'All Subjects';
    const subject = this.availableSubjects().find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  }

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser?.userId) {
      this.teacherId = currentUser.userId;
      this.loadTeacherPermissions();
    } else {
      console.warn('⚠️ No authenticated user found, redirecting to login');
      this.router.navigate(['/login']);
    }
  }

  /**
   * Load teacher permissions first, then load exams
   */
  private loadTeacherPermissions(): void {
    console.log(`📋 Loading permissions for teacher ${this.teacherId}`);

    // Load all subjects first to ensure we have names
    this.subjectService.getAllSubjects().subscribe({
      next: (response) => {
        this.allSubjects.set(response.items);
        console.log(`✅ Loaded ${response.items.length} subjects for lookup`);

        // Then load permissions
        this.permissionService.getTeacherPermissions(this.teacherId).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const activePermissions = response.data.filter(p => p.isActive);

              // Populate missing subject names from loaded subjects
              const subjects = this.allSubjects();
              activePermissions.forEach(p => {
                if (!p.subjectName || p.subjectName === 'Unknown') {
                  const subject = subjects.find(s => s.id === p.subjectId);
                  if (subject) {
                    p.subjectName = subject.subjectName;
                  }
                }
              });

              this.teacherPermissions.set(activePermissions);

              // Extract authorized subject IDs
              const subjectIds = activePermissions.map(p => p.subjectId);
              this.authorizedSubjects.set(subjectIds);

              console.log(`✅ Loaded ${activePermissions.length} active permissions`);
              console.log(`✅ Authorized subjects:`, subjectIds);

              // Now load exams
              this.loadExams();
            } else {
              console.warn('⚠️ No permissions found for teacher');
              this.toastService.showWarning('You have no subject permissions. Contact an administrator.');
              this.loading.set(false);
            }
          },
          error: (error) => {
            console.error('❌ Failed to load permissions:', error);
            this.error.set('Failed to load permissions');
            this.toastService.showError('Failed to load permissions');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('❌ Failed to load subjects:', err);
        // Continue loading permissions even if subjects fail (will show IDs or Unknown)
        this.permissionService.getTeacherPermissions(this.teacherId).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const activePermissions = response.data.filter(p => p.isActive);
              this.teacherPermissions.set(activePermissions);
              const subjectIds = activePermissions.map(p => p.subjectId);
              this.authorizedSubjects.set(subjectIds);
              this.loadExams();
            } else {
              this.loading.set(false);
            }
          },
          error: (error) => {
            this.error.set('Failed to load permissions');
            this.loading.set(false);
          }
        });
      }
    });
  }

  /**
   * Load all exams for teacher (filtered by permissions)
   */
  /**
   * Convert numeric ExamType from API to string
   */
  private convertExamType(type: any): ExamType {
    // API returns: 0=Lesson, 1=Monthly, 2=Term, 3=Year
    if (typeof type === 'number') {
      switch (type) {
        case 0: return ExamType.Lesson;
        case 1: return ExamType.Monthly;
        case 2: return ExamType.Term;
        case 3: return ExamType.Year;
        default: return ExamType.Lesson;
      }
    }
    return type; // Already a string
  }

  private loadExams(): void {
    this.loading.set(true);
    this.error.set(null);

    this.examApi.getMyExams().subscribe({
      next: (response: any) => {
        const exams = response.data || [];
        console.log(`📚 Loaded ${exams.length} exams from API`);

        // Note: TeacherExamDto doesn't have subjectId, we'll need to get it from permissions or use exam data
        // For now, we'll show all teacher's exams and rely on backend filtering
        console.log(`✅ Loaded ${exams.length} exams (backend already filtered by teacher permissions)`);

        // Map to ExamListItem with permission flags
        const examList: ExamListItem[] = exams.map((exam: TeacherExamDto) => {
          // Try to find matching permission by subject name
          const permission = this.teacherPermissions().find(p =>
            p.subjectName === exam.subjectName && p.isActive
          );

          return {
            id: exam.id,
            title: exam.title,
            examType: this.convertExamType(exam.examType),
            subjectId: permission?.subjectId || 0,
            subjectName: exam.subjectName || 'Not Specified',
            totalMarks: exam.totalMarks,
            durationInMinutes: exam.durationInMinutes,
            startTime: exam.startTime ? new Date(exam.startTime) : undefined,
            endTime: exam.endTime ? new Date(exam.endTime) : undefined,
            isPublished: exam.isPublished,
            totalSubmissions: exam.totalSubmissions || 0,
            pendingGrading: exam.pendingGradingCount || 0,
            averageScore: exam.averageScore,
            createdAt: new Date(),
            canEdit: permission?.canEdit || false,
            canDelete: permission?.canDelete || false
          };
        });

        this.allExams.set(examList);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Failed to load exams:', error);
        this.error.set('Failed to load exams');
        this.toastService.showError('Failed to load exams');
        this.loading.set(false);
      }
    });
  }

  /**
   * Get permission for a specific subject
   */
  private getPermissionForSubject(subjectId: number): TeacherPermissionDto | undefined {
    return this.teacherPermissions().find(p => p.subjectId === subjectId && p.isActive);
  }

  /**
   * Check if teacher can edit an exam
   */
  canEdit(exam: ExamListItem): boolean {
    return exam.canEdit;
  }

  /**
   * Check if teacher can delete an exam
   */
  canDelete(exam: ExamListItem): boolean {
    return exam.canDelete;
  }

  /**
   * Update filter
   */
  updateFilter(key: keyof FilterOptions, value: any): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters.set({
      searchTerm: '',
      examType: 'All',
      subjectId: 'All',
      status: 'All',
      sortBy: 'newest'
    });
  }

  /**
   * Toggle view mode
   */
  toggleViewMode(): void {
    this.viewMode.update(mode => mode === 'grid' ? 'list' : 'grid');
  }

  /**
   * Select/deselect exam
   */
  toggleSelection(examId: number): void {
    this.selectedExams.update(selected => {
      const newSet = new Set(selected);
      if (newSet.has(examId)) {
        newSet.delete(examId);
      } else {
        newSet.add(examId);
      }
      return newSet;
    });
  }

  /**
   * Select all visible exams
   */
  selectAll(): void {
    const allIds = new Set(this.filteredExams().map(e => e.id));
    this.selectedExams.set(allIds);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedExams.set(new Set());
  }

  /**
   * Create new exam
   */
  createExam(): void {
    if (!this.canCreateExams()) {
      this.toastService.showWarning('You do not have permission to create exams');
      return;
    }
    console.log('🔵 Teacher - Create Exam clicked');
    this.router.navigate(['/teacher/exam/create']);
  }

  /**
   * Edit exam
   */
  editExam(exam: ExamListItem): void {
    if (!this.canEdit(exam)) {
      this.toastService.showWarning('You do not have permission to edit this exam');
      return;
    }
    console.log('🔵 Teacher - Edit Exam clicked:', exam.id);
    this.router.navigate(['/teacher/exam/edit', exam.id]);
  }

  /**
   * View exam details
   */
  /**
   * View exam details (Redirects to edit since we don't have a details page yet)
   */
  viewExam(examId: number): void {
    this.router.navigate(['/teacher/exam/edit', examId]);
  }

  /**
   * View exam submissions
   */
  viewSubmissions(examId: number): void {
    this.router.navigate(['/teacher/exams', examId, 'submissions']);
  }

  /**
   * Delete exam
   */
  deleteExam(exam: ExamListItem): void {
    if (!this.canDelete(exam)) {
      this.toastService.showWarning('You do not have permission to delete this exam');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${exam.title}"? This action cannot be undone.`)) {
      return;
    }

    this.examApi.deleteExam(exam.id).subscribe({
      next: () => {
        this.toastService.showSuccess('Exam deleted successfully');
        this.loadExams();
      },
      error: (error) => {
        console.error('Failed to delete exam:', error);
        this.toastService.showError('Failed to delete exam');
      }
    });
  }

  /**
   * Delete selected exams
   */
  deleteSelected(): void {
    const selectedIds = Array.from(this.selectedExams());
    const examsToDelete = this.allExams().filter(e => selectedIds.includes(e.id));

    // Check if user has permission to delete all selected exams
    const unauthorized = examsToDelete.filter(e => !this.canDelete(e));
    if (unauthorized.length > 0) {
      this.toastService.showWarning(`You don't have permission to delete ${unauthorized.length} of the selected exams`);
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} exams? This action cannot be undone.`)) {
      return;
    }

    // TODO: Implement bulk delete API
    this.toastService.showInfo('Bulk delete not yet implemented');
  }

  /**
   * Publish/unpublish exam
   */
  togglePublish(exam: ExamListItem): void {
    if (!this.canEdit(exam)) {
      this.toastService.showWarning('You do not have permission to modify this exam');
      return;
    }

    const newPublishStatus = !exam.isPublished;
    const action = newPublishStatus ? 'publish' : 'unpublish';

    // Update locally first for immediate UI feedback
    this.allExams.update(exams =>
      exams.map(e => e.id === exam.id ? { ...e, isPublished: newPublishStatus } : e)
    );

    // Convert ExamType to number for API
    let examTypeNumber = 0;
    switch (exam.examType) {
      case ExamType.Lesson: examTypeNumber = 0; break;
      case ExamType.Monthly: examTypeNumber = 1; break;
      case ExamType.Term: examTypeNumber = 2; break;
      case ExamType.Year: examTypeNumber = 3; break;
    }

    const updateData: any = {
      id: exam.id,
      title: exam.title,
      examType: examTypeNumber,
      subjectId: exam.subjectId || 0,
      durationInMinutes: exam.durationInMinutes,
      totalMarks: exam.totalMarks,
      passingMarks: exam.totalMarks * 0.5,
      startTime: exam.startTime?.toISOString() || null,
      endTime: exam.endTime?.toISOString() || null,
      isPublished: newPublishStatus
    };

    console.log(`📤 ${action}ing exam:`, updateData);

    this.examApi.updateExam(exam.id, updateData).subscribe({
      next: () => {
        console.log(`✅ Exam ${action}ed successfully`);
        this.toastService.showSuccess(`Exam ${action}ed successfully`);
        this.loadExams();
      },
      error: (error) => {
        console.error(`❌ Failed to ${action} exam:`, error);
        // Revert local change on error
        this.allExams.update(exams =>
          exams.map(e => e.id === exam.id ? { ...e, isPublished: !newPublishStatus } : e)
        );
        this.toastService.showError(`Failed to ${action} exam`);
      }
    });
  }

  /**
   * Get exam type label
   */
  getExamTypeLabel(type: ExamType): string {
    const labels: Partial<Record<ExamType, string>> = {
      [ExamType.Lesson]: 'Lesson Quiz',
      [ExamType.Monthly]: 'Monthly Test',
      [ExamType.Term]: 'Term Exam',
      [ExamType.Year]: 'Annual Exam'
    };
    return labels[type] || type;
  }

  /**
   * Get exam type icon
   */
  getExamTypeIcon(type: ExamType): string {
    const icons: Partial<Record<ExamType, string>> = {
      [ExamType.Lesson]: '📝',
      [ExamType.Monthly]: '📋',
      [ExamType.Term]: '📚',
      [ExamType.Year]: '🎓'
    };
    return icons[type] || '📄';
  }

  /**
   * Get status color
   */
  getStatusColor(exam: ExamListItem): string {
    if (!exam.isPublished) return 'text-gray-500';

    const now = new Date();
    if (exam.endTime && new Date(exam.endTime) < now) return 'text-blue-500';
    if (exam.startTime && new Date(exam.startTime) > now) return 'text-green-500';
    return 'text-orange-500';
  }

  /**
   * Get status label
   */
  getStatusLabel(exam: ExamListItem): string {
    if (!exam.isPublished) return 'Draft';

    const now = new Date();
    if (exam.endTime && new Date(exam.endTime) < now) return 'Completed';
    if (exam.startTime && new Date(exam.startTime) > now) return 'Upcoming';
    return 'Active';
  }

  /**
   * Get grading progress percentage
   */
  getGradingProgress(exam: ExamListItem): number {
    if (exam.totalSubmissions === 0) return 0;
    const graded = exam.totalSubmissions - exam.pendingGrading;
    return Math.round((graded / exam.totalSubmissions) * 100);
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadTeacherPermissions();
  }
}
