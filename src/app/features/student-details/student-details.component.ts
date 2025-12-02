/**
 * Student Details Component (Parent View)
 * Displays complete student information for parents
 * Route: /parent/student/:id
 * Backend API: /api/Parent/student/{studentId}/details
 */

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ParentStudentService } from '../../core/services/parent-student.service';
import { ProgressService } from '../../core/services/progress.service';
import { CategoryService } from '../../core/services/category.service';
import { Year } from '../../models/category.models';
import {
  StudentDetailsForParent,
  UpdateStudentProfileRequest,
  StudentSubscriptionsForParent,
  StudentProgressBySubject
} from '../../models/student-details.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-student-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.scss']
})
export class StudentDetailsComponent implements OnInit {
  // State
  studentId = signal<number>(0);
  studentDetails = signal<StudentDetailsForParent | null>(null);
  subscriptions = signal<StudentSubscriptionsForParent | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<'overview' | 'subscriptions' | 'progress' | 'settings'>('overview');

  // Settings tab
  editMode = signal(false);
  saving = signal(false);
  editForm = signal<UpdateStudentProfileRequest>({});
  years = signal<Year[]>([]);

  // Computed
  hasData = computed(() => this.studentDetails() !== null);

  /**
   * ✅ Filter upcoming exams to show ONLY exams for subjects with active subscriptions
   * This prevents showing exams for subjects the student hasn't subscribed to yet
   */
  filteredUpcomingExams = computed(() => {
    const details = this.studentDetails();
    if (!details) return [];

    // Get list of subjects with active subscriptions
    const activeSubjects = new Set(
      details.activeSubscriptions
        .filter(sub => sub.isActive)
        .map(sub => sub.subject.toLowerCase())
    );

    // Filter exams to only show those for subscribed subjects
    return details.upcomingExams.filter(exam =>
      activeSubjects.has(exam.subject.toLowerCase())
    );
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private parentService: ParentStudentService,
    private progressService: ProgressService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    // Load years for dropdown
    this.loadYears();

    // Get student ID from route
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.studentId.set(id);
        this.loadStudentDetails();
      }
    });

    // Check for tab query parameter
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab.set(params['tab'] as any);
      }
    });
  }

  /**
   * Load years from API
   */
  loadYears(): void {
    this.categoryService.getYears().subscribe({
      next: (years) => {
        this.years.set(years);
      },
      error: (err) => {
        console.error('Error loading years:', err);
      }
    });
  }

  /**
   * Load student details from API
   * ✅ Uses both endpoints:
   * - /api/Parent/student/{id}/details (student info, subscriptions, exams, etc.)
   * - /api/Progress/by-student/{id}/summary (accurate overall progress from backend)
   */
  loadStudentDetails(): void {
    this.loading.set(true);
    this.error.set(null);

    // ✅ Load both student details and accurate progress summary
    forkJoin({
      details: this.parentService.getStudentDetails(this.studentId()),
      progressSummary: this.progressService.getStudentProgressSummary(this.studentId())
    }).subscribe({
      next: ({ details, progressSummary }) => {
        if (details.success) {
          const studentData = details.data;

          // ✅ Update progress with accurate data from backend summary
          studentData.progress = {
            overallProgress: progressSummary.overallProgress,
            completedLessons: progressSummary.completedLessons,
            totalLessons: progressSummary.totalLessons,
            averageScore: progressSummary.averageScore,
            timeSpent: progressSummary.totalTimeSpent,
            lastActivityDate: progressSummary.lastActivityDate
          };

          console.log('📊 Updated student details with accurate progress:', {
            studentId: this.studentId(),
            overallProgress: progressSummary.overallProgress,
            completedLessons: progressSummary.completedLessons,
            totalLessons: progressSummary.totalLessons
          });

          this.studentDetails.set(studentData);
          this.initializeEditForm();
        } else {
          this.error.set('Failed to load student details');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading student details:', err);

        if (err.status === 403) {
          this.error.set('You do not have permission to view this student');
        } else if (err.status === 404) {
          this.error.set('Student not found');
        } else {
          this.error.set('An error occurred while loading student details');
        }

        this.loading.set(false);
      }
    });
  }

  /**
   * Load student subscriptions
   */
  loadSubscriptions(): void {
    this.parentService.getStudentSubscriptions(this.studentId(), true).subscribe({
      next: (response) => {
        if (response.success) {
          this.subscriptions.set(response.data);
        }
      },
      error: (err) => {
        console.error('Error loading subscriptions:', err);
      }
    });
  }

  /**
   * Switch tab
   */
  switchTab(tab: 'overview' | 'subscriptions' | 'progress' | 'settings'): void {
    this.activeTab.set(tab);

    // Update URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });

    // Load data for specific tabs
    if (tab === 'subscriptions' && !this.subscriptions()) {
      this.loadSubscriptions();
    }
  }

  /**
   * Initialize edit form with current student data
   */
  initializeEditForm(): void {
    const student = this.studentDetails()?.student;
    if (student) {
      this.editForm.set({
        userName: student.userName,
        email: student.email,
        age: student.age,
        yearId: student.yearId
      });
    }
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode(): void {
    this.editMode.set(!this.editMode());
    if (!this.editMode()) {
      // Cancel - reset form
      this.initializeEditForm();
    }
  }

  /**
   * Save profile changes
   */
  saveProfile(): void {
    this.saving.set(true);

    this.parentService.updateStudentProfile(this.studentId(), this.editForm()).subscribe({
      next: (response) => {
        if (response.success) {
          // Reload student details to get updated data
          this.loadStudentDetails();
          this.editMode.set(false);
        }
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        alert('Failed to update profile. Please try again.');
        this.saving.set(false);
      }
    });
  }

  /**
   * Get avatar URL for student
   */
  getAvatarUrl(): string {
    const student = this.studentDetails()?.student;
    if (!student) return 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg';

    if (student.avatar) {
      return student.avatar;
    }

    // Return default avatar if no custom avatar
    return 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg';
  }

  /**
   * Get progress color class
   */
  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  /**
   * Get badge color for days remaining
   */
  getDaysRemainingColor(days: number): string {
    if (days > 30) return 'bg-green-100 text-green-800';
    if (days > 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  /**
   * Format time in minutes to hours/minutes
   */
  formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  /**
   * Get year name by ID
   */
  getYearName(yearId: number | undefined): string {
    if (!yearId) return 'Not set';
    const year = this.years().find(y => y.id === yearId);
    return year ? `Year ${year.yearNumber}` : `Year ${yearId}`;
  }

  /**
   * Navigate back to parent dashboard
   */
  goBack(): void {
    this.router.navigate(['/parent/dashboard']);
  }

  /**
   * Navigate to subject progress details
   * Uses the ParentStudentService to get detailed progress for a specific subject
   */
  viewSubjectProgress(subjectId: number): void {
    const studentId = this.studentId();

    // Navigate to a detailed subject progress page
    // Option 1: Navigate to lessons page filtered by subject
    this.router.navigate(['/lessons'], {
      queryParams: {
        subjectId: subjectId,
        studentId: studentId
      }
    });

    // Option 2: Could implement a dedicated progress details modal/page
    // For now, we navigate to lessons where they can see detailed progress
  }

  /**
   * Navigate to add subscription
   */
  addSubscription(): void {
    this.router.navigate(['/courses'], {
      queryParams: { studentId: this.studentId() }
    });
  }
}
