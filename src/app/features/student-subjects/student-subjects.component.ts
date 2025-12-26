import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CoursesService } from '../../core/services/courses.service';
import { SubjectUtilsService } from '../../core/services/subject-utils.service';

interface EnrolledSubject {
  subjectId?: number; // Optional for Full Year subscriptions
  subjectName: string;
  categoryName?: string;
  posterUrl?: string;
  isActive: boolean;
  expiryDate?: string;
  startDate?: string;
  daysRemaining?: number;
  progress?: number;
  completedLessons?: number;
  totalLessons?: number;
  currentTermNumber?: number;
  accessibleTerms?: number[];
  isGlobal?: boolean; // ✅ NEW: For global courses (no terms hierarchy)
}

@Component({
  selector: 'app-student-subjects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-subjects.component.html',
  styleUrl: './student-subjects.component.scss'
})
export class StudentSubjectsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private coursesService = inject(CoursesService);
  private router = inject(Router);
  public subjectUtils = inject(SubjectUtilsService);

  loading = signal<boolean>(true);
  enrolledSubjects = signal<EnrolledSubject[]>([]);
  studentId: number = 0;

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser && this.authService.hasRole('Student')) {
      const studentId = this.authService.getStudentId();
      if (studentId) {
        this.studentId = studentId;
        this.loadEnrolledSubjects();
      } else {
        this.toastService.showError('Student ID not found. Please re-login.');
        this.router.navigate(['/auth/login']);
      }
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Load enrolled subjects with subscriptions
   */
  private loadEnrolledSubjects(): void {
    this.loading.set(true);

    this.dashboardService.getStudentSubscriptionsSummary(this.studentId).subscribe({
      next: (response) => {
        console.log('📚 Subscriptions response:', response);

        let subsArray: any[] = [];
        if (response) {
          if (response.subscriptions && Array.isArray(response.subscriptions)) {
            subsArray = response.subscriptions;
          } else if (Array.isArray(response)) {
            subsArray = response;
          }
        }

        console.log(`✅ Found ${subsArray.length} subscription(s)`);

        // ✅ DEBUG: Log first subscription to see structure
        if (subsArray.length > 0) {
          console.log('📦 First subscription structure:', subsArray[0]);
        }

        // ✅ Group subscriptions by subjectId to avoid duplicates
        const subjectsMap = new Map<number, EnrolledSubject>();

        subsArray.forEach(sub => {
          const subjectId = sub.subjectId;
          const subjectName = sub.subjectName || sub.subject || 'Unknown Subject';

          // ✅ Skip if no subjectId (Full Year subscriptions)
          if (!subjectId) {
            console.log('ℹ️ Skipping Full Year subscription:', sub.planName);
            return;
          }

          // Calculate days remaining
          let daysRemaining = 0;
          if (sub.expiryDate || sub.endDate) {
            const expiryDate = new Date(sub.expiryDate || sub.endDate);
            const now = new Date();
            const diffTime = expiryDate.getTime() - now.getTime();
            daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          }

          // If subject already exists, keep the one with more days remaining
          if (subjectsMap.has(subjectId)) {
            const existing = subjectsMap.get(subjectId)!;
            if (daysRemaining > (existing.daysRemaining || 0)) {
              subjectsMap.set(subjectId, {
                subjectId,
                subjectName,
                categoryName: sub.categoryName || sub.category,
                posterUrl: sub.posterUrl,
                isActive: sub.isActive !== false && daysRemaining > 0,
                expiryDate: sub.expiryDate || sub.endDate,
                startDate: sub.startDate || sub.createdAt,
                daysRemaining,
                currentTermNumber: sub.currentTermNumber,
                accessibleTerms: []
              });
            }
          } else {
            // ✅ Detect global courses: isGlobal flag OR yearNumber === 0 (convention for global courses)
            const isGlobalCourse = sub.isGlobal || sub.isGlobalLesson || sub.yearNumber === 0 || false;

            subjectsMap.set(subjectId, {
              subjectId,
              subjectName,
              categoryName: sub.categoryName || sub.category,
              posterUrl: sub.posterUrl,
              isActive: sub.isActive !== false && daysRemaining > 0,
              expiryDate: sub.expiryDate || sub.endDate,
              startDate: sub.startDate || sub.createdAt,
              daysRemaining,
              currentTermNumber: sub.currentTermNumber,
              accessibleTerms: [],
              isGlobal: isGlobalCourse
            });
          }
        });

        const subjects = Array.from(subjectsMap.values());
        console.log(`✅ Mapped ${subjects.length} unique subject(s)`);

        // ✅ Load term access for each subject
        this.loadTermAccessForSubjects(subjects);
      },
      error: (err) => {
        console.error('❌ Error loading subscriptions:', err);
        this.toastService.showError('Failed to load your subjects. Please try again.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Load term access information for all subjects
   */
  private loadTermAccessForSubjects(subjects: EnrolledSubject[]): void {
    // ✅ Filter out subjects without subjectId
    const validSubjects = subjects.filter(s => s.subjectId);

    if (validSubjects.length === 0) {
      console.warn('⚠️ No valid subjects with subjectId found');
      this.enrolledSubjects.set(subjects);
      this.loading.set(false);
      return;
    }

    const accessPromises = validSubjects.map(subject =>
      this.loadSubjectTermAccess(subject)
    );

    Promise.allSettled(accessPromises).then(() => {
      this.enrolledSubjects.set(subjects);
      this.loading.set(false);
      console.log('✅ All subjects loaded with term access:', subjects);
    });
  }  /**
   * Load term access for a single subject
   */
  private loadSubjectTermAccess(subject: EnrolledSubject): Promise<void> {
    return new Promise((resolve) => {
      // ✅ Validate subjectId before making API call
      if (!subject.subjectId) {
        console.warn('⚠️ Cannot load term access - missing subjectId for:', subject.subjectName);
        resolve();
        return;
      }

      this.coursesService.getTermAccessStatus(this.studentId, subject.subjectId).subscribe({
        next: (response: any) => {
          if (response && response.terms) {
            const accessibleTerms = response.terms
              .filter((t: any) => t.hasAccess)
              .map((t: any) => t.termNumber);

            subject.accessibleTerms = accessibleTerms;
            subject.currentTermNumber = response.currentTermNumber || 1;

            console.log(`✅ Subject "${subject.subjectName}": Accessible terms:`, accessibleTerms);
          }
          resolve();
        },
        error: (err) => {
          console.warn(`⚠️ Failed to load term access for subject ${subject.subjectId}:`, err);
          resolve();
        }
      });
    });
  }

  /**
   * Navigate to subject lessons
   */
  viewSubjectLessons(subject: EnrolledSubject): void {
    if (!subject.isActive) {
      this.toastService.showError('This subscription is no longer active.');
      return;
    }

    if (!subject.subjectId) {
      this.toastService.showError('Subject information is not available.');
      return;
    }

    // ✅ NEW: Handle global courses (no terms hierarchy)
    if (subject.isGlobal) {
      console.log('🌍 Global course detected - navigating directly without terms');
      this.router.navigate(['/lessons'], {
        queryParams: {
          subjectId: subject.subjectId,
          subject: subject.subjectName,
          studentId: this.studentId,
          hasAccess: true,
          isGlobal: true  // Flag for lessons page
        }
      });
      return;
    }

    // Navigate to lessons with subject context (non-global courses)
    if (subject.accessibleTerms && subject.accessibleTerms.length > 0) {
      // Navigate to first accessible term
      const firstTerm = subject.accessibleTerms[0];
      this.router.navigate(['/lessons'], {
        queryParams: {
          subjectId: subject.subjectId,
          subject: subject.subjectName,
          termNumber: firstTerm,
          hasAccess: true,
          studentId: this.studentId
        }
      });
    } else {
      // Navigate to lessons without specific term
      this.router.navigate(['/lessons'], {
        queryParams: {
          subjectId: subject.subjectId,
          subject: subject.subjectName,
          studentId: this.studentId
        }
      });
    }
  }

  /**
   * Get days remaining color class
   */
  getDaysRemainingColor(days?: number): string {
    if (!days) return 'bg-gray-100 text-gray-700';
    if (days > 30) return 'bg-green-100 text-green-700';
    if (days > 7) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  }

  /**
   * Get status badge color
   */
  getStatusColor(isActive: boolean): string {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-600';
  }

  /**
   * Format date
   */
  formatDate(date?: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Get accessible terms display text
   */
  getAccessibleTermsText(accessibleTerms?: number[]): string {
    if (!accessibleTerms || accessibleTerms.length === 0) {
      return 'No terms available';
    }

    if (accessibleTerms.length === 4) {
      return 'Full Year Access';
    }

    if (accessibleTerms.length === 1) {
      return `Term ${accessibleTerms[0]} Only`;
    }

    return `Terms ${accessibleTerms.join(', ')}`;
  }

}
