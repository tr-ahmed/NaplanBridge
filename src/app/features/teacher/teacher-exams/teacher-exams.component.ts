import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExamApiService } from '../../../core/services/exam-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  TeacherExamDto,
  ExamType,
  getExamTypeLabel,
  getExamTypeIcon,
  EXAM_TYPE_LABELS
} from '../../../models/exam-api.models';

@Component({
  selector: 'app-teacher-exams',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './teacher-exams.component.html',
  styleUrls: ['./teacher-exams.component.scss']
})
export class TeacherExamsComponent implements OnInit {
  // Data
  myExams = signal<TeacherExamDto[]>([]);
  filteredExams = signal<TeacherExamDto[]>([]);

  // Filters
  selectedType = signal<ExamType | ''>('');
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');

  // UI State
  loading = signal(false);
  error = signal<string | null>(null);

  // Constants
  examTypeLabels = EXAM_TYPE_LABELS;

  constructor(
    private examApi: ExamApiService,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) { }

  ngOnInit() {
    this.loadMyExams();
  }

  /**
   * Load teacher's exams
   */
  loadMyExams() {
    this.loading.set(true);
    this.error.set(null);

    this.examApi.getMyExams().subscribe({
      next: (response: any) => {
        const exams = response.data || [];
        console.log('Loaded exams:', exams);
        this.myExams.set(exams);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load exams:', error);
        this.error.set('Failed to load exams. Please try again.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Apply filters
   */
  applyFilters() {
    let filtered = this.myExams();

    // Filter by type
    if (this.selectedType() !== '') {
      filtered = filtered.filter(e => e.examType === this.selectedType());
    }

    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.subjectName.toLowerCase().includes(query)
      );
    }

    // Filter by status
    const status = this.selectedStatus();
    if (status === 'published') {
      filtered = filtered.filter(e => e.isPublished);
    } else if (status === 'draft') {
      filtered = filtered.filter(e => !e.isPublished);
    }

    this.filteredExams.set(filtered);
  }

  /**
   * Navigate to exam submissions
   */
  viewSubmissions(examId: number) {
    this.router.navigate(['/teacher/exams', examId, 'submissions']);
  }

  /**
   * Navigate to create exam
   */
  createExam() {
    console.log('🔵 Create Exam button clicked');
    console.log('🔵 Current user:', this.auth.getCurrentUser());
    console.log('🔵 Has teacher role:', this.auth.hasRole('teacher'));
    console.log('🔵 Navigating to: /teacher/exam/create');

    this.router.navigate(['/teacher/exam/create'])
      .then(success => {
        console.log('✅ Navigation successful:', success);
      })
      .catch(error => {
        console.error('❌ Navigation failed:', error);
        this.toast.showError('Failed to navigate to create exam page');
      });
  }

  /**
   * Navigate to edit exam
   */
  editExam(examId: number) {
    this.router.navigate(['/teacher/exam/edit', examId]);
  }

  /**
   * Delete exam
   */
  deleteExam(examId: number, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    this.examApi.deleteExam(examId).subscribe({
      next: () => {
        this.toast.showSuccess('Exam deleted successfully');
        this.loadMyExams();
      },
      error: (error: any) => {
        console.error('Failed to delete exam:', error);
        this.toast.showError('Failed to delete exam. Please try again.');
      }
    });
  }

  /**
   * Get exam type label
   */
  getExamTypeLabel(type: ExamType): string {
    return getExamTypeLabel(type);
  }

  /**
   * Get exam type icon
   */
  getExamTypeIcon(type: ExamType): string {
    return getExamTypeIcon(type);
  }

  /**
   * Get status color class
   */
  getStatusColor(exam: TeacherExamDto): string {
    if (!exam.isPublished) return 'draft';
    const now = new Date();
    const end = new Date(exam.endTime);
    if (now > end) return 'ended';
    return 'active';
  }

  /**
   * Get grading progress percentage
   */
  getGradingProgress(exam: TeacherExamDto): number {
    if (exam.totalSubmissions === 0) return 0;
    return Math.round((exam.gradedCount / exam.totalSubmissions) * 100);
  }

  /**
   * Filter change handler
   */
  onFilterChange() {
    this.applyFilters();
  }
}
