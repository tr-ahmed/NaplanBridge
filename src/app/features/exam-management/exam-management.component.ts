/**
 * Exam Management Component
 * Teacher interface for creating, editing, viewing, and managing exams
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExamApiService } from '../../core/services/exam-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExamDto, ExamType } from '../../models/exam-api.models';

interface ExamListItem {
  id: number;
  title: string;
  examType: ExamType;
  subjectName: string;
  className?: string;
  totalMarks: number;
  durationInMinutes: number;
  startTime?: Date;
  endTime?: Date;
  isPublished: boolean;
  totalSubmissions: number;
  pendingGrading: number;
  averageScore?: number;
  createdAt: Date;
}

interface FilterOptions {
  searchTerm: string;
  examType: ExamType | 'All';
  status: 'All' | 'Published' | 'Draft' | 'Completed' | 'Upcoming';
  sortBy: 'newest' | 'oldest' | 'title' | 'submissions';
}

@Component({
  selector: 'app-exam-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-management.component.html',
  styleUrl: './exam-management.component.scss'
})
export class ExamManagementComponent implements OnInit {
  // Services
  private examApi = inject(ExamApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Data
  teacherId: number = 0;
  allExams = signal<ExamListItem[]>([]);
  selectedExams = signal<Set<number>>(new Set());

  // Filters
  filters = signal<FilterOptions>({
    searchTerm: '',
    examType: 'All',
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
        e.subjectName.toLowerCase().includes(term) ||
        e.className?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filter.examType !== 'All') {
      exams = exams.filter(e => e.examType === filter.examType);
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

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser?.userId) {
      this.teacherId = currentUser.userId;
      this.loadExams();
    } else {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Load all exams for teacher
   */
  private loadExams(): void {
    this.loading.set(true);
    this.error.set(null);

    this.examApi.getAllExams().subscribe({
      next: (exams: ExamDto[]) => {
        const examList: ExamListItem[] = exams.map(exam => ({
          id: exam.id,
          title: exam.title,
          examType: exam.examType,
          subjectName: exam.subjectName || 'Not Specified',
          className: undefined,
          totalMarks: exam.totalMarks,
          durationInMinutes: exam.durationInMinutes,
          startTime: exam.startTime ? new Date(exam.startTime) : undefined,
          endTime: exam.endTime ? new Date(exam.endTime) : undefined,
          isPublished: exam.isPublished,
          totalSubmissions: 0, // Can be added from separate API if needed
          pendingGrading: 0,
          averageScore: undefined,
          createdAt: exam.createdAt ? new Date(exam.createdAt) : new Date()
        }));

        this.allExams.set(examList);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load exams:', error);
        this.error.set('Failed to load exams');
        this.toastService.showError('Failed to load exams');
        this.loading.set(false);
      }
    });
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
    this.router.navigate(['/admin/exam/create']);
  }

  /**
   * View exam details
   */
  viewExam(examId: number): void {
    this.router.navigate(['/teacher/exam', examId]);
  }

  /**
   * Edit exam
   */
  editExam(examId: number, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/admin/exam/edit', examId]);
  }

  /**
   * Delete exam
   */
  deleteExam(examId: number, event?: Event): void {
    event?.stopPropagation();

    const exam = this.allExams().find(e => e.id === examId);
    if (!exam) return;

    if (!confirm(`Are you sure you want to delete "${exam.title}"?`)) {
      return;
    }

    this.examApi.deleteExam(examId).subscribe({
      next: () => {
        this.allExams.update(exams => exams.filter(e => e.id !== examId));
        this.toastService.showSuccess('Exam deleted successfully');
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
    const count = this.selectedCount();
    if (!confirm(`Delete ${count} selected exam(s)? This action cannot be undone.`)) {
      return;
    }

    const selectedIds = this.selectedExams();
    this.allExams.update(exams => exams.filter(e => !selectedIds.has(e.id)));
    this.clearSelection();
    this.toastService.showSuccess(`${count} exam(s) deleted successfully`);
  }

  /**
   * Duplicate exam
   */
  duplicateExam(examId: number, event?: Event): void {
    event?.stopPropagation();

    const exam = this.allExams().find(e => e.id === examId);
    if (!exam) return;

    const duplicate: ExamListItem = {
      ...exam,
      id: Math.max(...this.allExams().map(e => e.id)) + 1,
      title: `${exam.title} (Copy)`,
      isPublished: false,
      totalSubmissions: 0,
      pendingGrading: 0,
      averageScore: undefined,
      startTime: undefined,
      endTime: undefined,
      createdAt: new Date()
    };

    this.allExams.update(exams => [duplicate, ...exams]);
    this.toastService.showSuccess('Exam duplicated successfully');
  }

  /**
   * Publish/unpublish exam
   */
  togglePublish(examId: number, event?: Event): void {
    event?.stopPropagation();

    const exam = this.allExams().find(e => e.id === examId);
    if (!exam) return;

    const updatedExam: any = {
      id: exam.id,
      title: exam.title,
      examType: exam.examType,
      subjectId: 0,
      durationInMinutes: exam.durationInMinutes,
      totalMarks: exam.totalMarks,
      passingMarks: exam.totalMarks * 0.5,
      startTime: exam.startTime?.toISOString() || '',
      endTime: exam.endTime?.toISOString() || '',
      isPublished: !exam.isPublished
    };

    this.examApi.updateExam(examId, updatedExam).subscribe({
      next: () => {
        this.allExams.update(exams =>
          exams.map(e => e.id === examId ? { ...e, isPublished: !e.isPublished } : e)
        );

        const action = updatedExam.isPublished ? 'published' : 'unpublished';
        this.toastService.showSuccess(`Exam ${action} successfully`);
      },
      error: (error) => {
        console.error('Failed to update exam:', error);
        this.toastService.showError('Failed to update exam');
      }
    });
  }

  /**
   * View submissions
   */
  viewSubmissions(examId: number, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/teacher/exam', examId, 'submissions']);
  }

  /**
   * Go to grading
   */
  gradeExam(examId: number, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/teacher/exam', examId, 'grade']);
  }

  /**
   * Refresh exams list
   */
  refresh(): void {
    this.loadExams();
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Format time
   */
  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get exam type badge class
   */
  getExamTypeBadge(type: ExamType): string {
    switch (type) {
      case ExamType.Lesson:
        return 'bg-blue-100 text-blue-800';
      case ExamType.Monthly:
        return 'bg-purple-100 text-purple-800';
      case ExamType.Term:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get status badge
   */
  getStatusBadge(exam: ExamListItem): { text: string; class: string } {
    const now = new Date();

    if (!exam.isPublished) {
      return { text: 'Draft', class: 'bg-gray-100 text-gray-800' };
    }

    if (exam.startTime && new Date(exam.startTime) > now) {
      return { text: 'Upcoming', class: 'bg-yellow-100 text-yellow-800' };
    }

    if (exam.endTime && new Date(exam.endTime) < now) {
      return { text: 'Completed', class: 'bg-green-100 text-green-800' };
    }

    return { text: 'Active', class: 'bg-blue-100 text-blue-800' };
  }

  /**
   * Get score color class
   */
  getScoreClass(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }
}
