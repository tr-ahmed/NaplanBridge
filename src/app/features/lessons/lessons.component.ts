import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError, map, switchMap } from 'rxjs/operators';

import { Lesson, StudentLesson } from '../../models/lesson.models';
import { LessonsService } from '../../core/services/lessons.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { CoursesService } from '../../core/services/courses.service';
import { AuthService } from '../../auth/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { SubscriptionPlansService, TermPlansResponse, SubjectPlansResponse, PlanOption } from '../../core/services/subscription-plans.service';
import { PlanSelectionModalComponent } from '../../components/plan-selection-modal/plan-selection-modal.component';
import { SubscriptionPlanSummary } from '../../models/subject.models';
import {
  SubscriptionErrorDialogComponent,
  SubscriptionErrorAction
} from '../../shared/components/subscription-error-dialog/subscription-error-dialog.component';

interface Term {
  id: number;
  termNumber: number;
  name: string;
  isCurrentTerm: boolean;
  hasAccess: boolean;
}

@Component({
  selector: 'app-lessons',
  standalone: true,
  imports: [CommonModule, PlanSelectionModalComponent, SubscriptionErrorDialogComponent],
  templateUrl: './lessons.component.html',
  styleUrls: ['./lessons.component.scss']
})
export class LessonsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State signals
  lessons = signal<Lesson[]>([]);
  studentLessons = signal<StudentLesson[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Current subject and course info
  currentSubject = signal<string>('');
  currentSubjectId = signal<number | null>(null);
  currentCourseId = signal<number | null>(null);
  isEnrolledInSubject = signal<boolean>(false);

  // Term management
  availableTerms = signal<Term[]>([]);
  currentTermId = signal<number | null>(null);
  selectedTermId = signal<number | null>(null);
  showTermSelector = signal<boolean>(false);

  // ✅ NEW: Subscription/Access status
  hasAccess = signal<boolean>(true);  // Default to true for backward compatibility
  showSubscriptionBanner = signal<boolean>(false);

  // ✅ NEW: Student selection (for parents)
  selectedStudentId = signal<number | null>(null);
  parentStudents = signal<any[]>([]);  // Parent's children list
  showStudentSelector = signal<boolean>(false);  // Student selection modal
  pendingPlanId = signal<number | null>(null);  // Plan waiting for student selection

  // ✅ NEW: Plan selection modal (using PlanSelectionModalComponent)
  showPlanModal = signal<boolean>(false);
  selectedCoursePlans = signal<SubscriptionPlanSummary[]>([]);
  selectedCourseName = signal<string>('');
  loadingPlans = signal<boolean>(false);

  // ✅ NEW: Tab management for lessons view
  activeTab = signal<string>('lessons');

  // ✅ NEW: Subscription error handling
  showSubscriptionErrorDialog = signal<boolean>(false);
  subscriptionErrorMessage = signal<string>('');
  subscriptionErrorAction = signal<SubscriptionErrorAction>('none');
  subscriptionErrorActionButton = signal<string | undefined>(undefined);

  // ✅ NEW: Make Math available in template
  Math = Math;

  private toastService = inject(ToastService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonsService: LessonsService,
    private coursesService: CoursesService,
    private authService: AuthService,
    private cartService: CartService,
    private plansService: SubscriptionPlansService,
    private subscriptionService: SubscriptionService
  ) { }

  ngOnInit(): void {
    // Get route parameters
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const subject = params['subject'];
        const subjectId = params['subjectId'];
        const courseId = params['courseId'];
        const termNumber = params['termNumber'];  // ✅ NEW: Use termNumber instead of termId
        const termId = params['termId'];          // Keep for backward compatibility
        const isGlobal = params['isGlobal'] === 'true';  // ✅ NEW: Check if global course
        // 🔒 SECURITY: Removed hasAccess from query params - always verify from backend
        const studentIdParam = params['studentId']; // ✅ NEW: Get studentId from URL

        if (studentIdParam) {
          const studentId = parseInt(studentIdParam, 10);
          if (!isNaN(studentId)) {
            this.selectedStudentId.set(studentId);
            console.log('✅ Selected student ID from URL:', studentId);
          }
        }

        // 🔒 SECURITY: Access status is now determined by API response only, not from URL params

        if (subject) {
          this.currentSubject.set(subject);
        }

        if (subjectId) {
          this.currentSubjectId.set(parseInt(subjectId));

          // ✅ NEW: Handle global courses (no terms) - load lessons directly
          if (isGlobal) {
            console.log('🌍 Global course detected - loading lessons directly without terms');
            this.availableTerms.set([]);  // Clear any terms

            // ✅ BACKEND FIXED (2025-01-29): hasAccessToSubject now correctly handles global courses
            // Global subjects are accessible to ANY student with an active subscription
            const currentUser = this.authService.getCurrentUser();
            const studentId = this.selectedStudentId() || currentUser?.studentId;

            if (studentId) {
              // Check subscription access using the now-fixed hasAccessToSubject API
              this.subscriptionService.hasAccessToSubject(studentId, parseInt(subjectId))
                .pipe(takeUntil(this.destroy$))
                .subscribe(result => {
                  const allowed = !!result?.hasAccess;
                  this.hasAccess.set(allowed);
                  this.showSubscriptionBanner.set(!allowed);
                  console.log('🌍 Global course access check:', { studentId, subjectId, hasAccess: allowed });
                  if (!allowed) {
                    this.toastService.showInfo('Subscribe to unlock this course content');
                  }
                });
            } else {
              // No studentId - show as preview mode
              this.hasAccess.set(false);
              this.showSubscriptionBanner.set(true);
            }

            this.loadLessonsForSubjectId(parseInt(subjectId));

            if (courseId) {
              this.currentCourseId.set(parseInt(courseId));
            }
            return;  // Skip term loading for global courses
          }

          // Load terms first (for non-global courses)
          this.loadAvailableTerms(parseInt(subjectId));

          // 🔒 Parent access check: require active subscription for selected child
          const currentUser = this.authService.getCurrentUser();
          const isParent = Array.isArray(currentUser?.role) && currentUser.role.includes('Parent');
          if (isParent) {
            const childId = this.selectedStudentId();
            if (!childId) {
              // No child context → deny access and show subscription banner
              this.hasAccess.set(false);
              this.showSubscriptionBanner.set(true);
              this.toastService.showWarning('Please select a student to view lessons.');
            } else {
              // Verify subscription access for subject
              this.subscriptionService.hasAccessToSubject(childId, parseInt(subjectId))
                .pipe(takeUntil(this.destroy$))
                .subscribe(result => {
                  const allowed = !!result?.hasAccess;
                  this.hasAccess.set(allowed);
                  this.showSubscriptionBanner.set(!allowed);
                  if (!allowed) {
                    this.toastService.showWarning(result?.reason || 'Subscription required to view lessons');
                  }
                });
            }
          }

          // ✅ PRIORITY: Use termNumber if available (new fix)
          if (termNumber) {
            console.log('🎯 Using termNumber for navigation:', termNumber);
            this.loadLessonsByTermNumber(parseInt(subjectId), parseInt(termNumber));
          }
          // ⚠️ FALLBACK: Use termId if termNumber not available (old method)
          else if (termId) {
            console.warn('⚠️ Using legacy termId (may cause issues):', termId);
            this.selectedTermId.set(parseInt(termId));
            this.loadLessonsByTerm(parseInt(termId));
          }
          // ✅ NEW: Wait for terms to load then auto-select current term
          else {
            console.log('⏳ No termNumber provided - waiting for terms to load and auto-selecting current term');
            this.autoSelectCurrentTermAndLoadLessons(parseInt(subjectId));
          }
        } else if (subject) {
          // Fallback: try to load by subject name (for backward compatibility)
          this.loadLessonsForSubject(subject);
        }

        if (courseId) {
          this.currentCourseId.set(parseInt(courseId));
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load lessons for the specified subject ID (preferred method)
   * ✅ UPDATED: Uses new with-progress endpoint that supports guest mode
   */
  private loadLessonsForSubjectId(subjectId: number): void {
    this.loading.set(true);
    this.error.set(null);

    // ✅ Get studentId only if authenticated (undefined for guests)
    const studentId = this.authService.isAuthenticated()
      ? this.authService.getCurrentUser()?.studentId
      : undefined;

    console.log('📚 Loading lessons:', { subjectId, studentId, isGuest: !studentId });

    // ✅ Use new endpoint that supports guest mode
    this.lessonsService.getLessonsBySubjectWithProgress(subjectId, studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lessons) => {
          // ✅ WORKAROUND: If hasAccess=true, unlock all lessons
          // Backend still returns locked lessons despite valid subscription
          if (this.hasAccess()) {
            console.log('🔓 WORKAROUND: Unlocking all lessons (hasAccess=true)');
            lessons = lessons.map((lesson: any) => ({
              ...lesson,
              hasAccess: true,
              isLocked: false
            }));
          }

          this.lessons.set(lessons);
          this.loading.set(false);

          // ✅ Don't override hasAccess if it was set from query params
          if (!this.hasAccess()) {
            // Check if any lessons have access
            const hasAnyAccess = lessons.some((l: any) => l.hasAccess === true);
            this.hasAccess.set(hasAnyAccess);

            // Show subscription banner if no access
            if (!hasAnyAccess && this.authService.isAuthenticated()) {
              this.showSubscriptionBanner.set(true);
            }
          }

          console.log('✅ Lessons loaded:', {
            count: lessons.length,
            hasAccess: this.hasAccess(),
            isGuest: !studentId
          });
        },
        error: (error) => {
          this.error.set('Failed to load lessons');
          this.loading.set(false);
          console.error('Error loading lessons:', error);
        }
      });
  }

  /**
   * Load lessons for the specified subject (legacy method for backward compatibility)
   */
  private loadLessonsForSubject(subject: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.lessonsService.getLessons({ subject })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lessons) => {
          this.lessons.set(lessons);
          this.loading.set(false);

          // If user is logged in, get their progress
          if (this.authService.isAuthenticated()) {
            this.loadStudentProgress();
          }
        },
        error: (error) => {
          this.error.set('Failed to load lessons');
          this.loading.set(false);
          console.error('Error loading lessons:', error);
        }
      });
  }

  /**
   * Load student progress for lessons
   * TODO: Implement when Progress endpoint is integrated
   * Currently disabled to avoid 404 errors
   */
  private loadStudentProgress(): void {
    // TODO: Use /api/Progress/by-student/{id} endpoint
    // to get student progress for all lessons
    // Then filter by current subject

    // const studentId = this.authService.getCurrentUser()?.studentId;
    // if (!studentId) return;

    // this.progressService.getProgressByStudent(studentId)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (progressList) => {
    //       // Filter for current subject lessons
    //       const subjectProgress = progressList.filter(
    //         p => p.lesson?.subjectId === this.currentSubjectId()
    //       );
    //       this.studentLessons.set(subjectProgress);
    //     },
    //     error: (error) => {
    //       console.error('Error loading student progress:', error);
    //     }
    //   });
  }

  /**
   * Handle lesson click
   * ✅ UPDATED: Removed isEnrolledInSubject check - now uses hasAccess() only
   */
  onLessonClick(lesson: Lesson): void {
    console.log('🎯 Lesson clicked:', {
      lessonId: lesson.id,
      title: lesson.title,
      hasAccess: this.hasAccess(),
      isAuthenticated: this.authService.isAuthenticated(),
      isLocked: lesson.isLocked
    });

    // ✅ PRIORITY 1: Check subscription/access
    if (!this.hasAccess()) {
      console.warn('🔒 Lesson locked - no subscription:', lesson.title);

      const selectedTerm = this.availableTerms().find(t => t.id === this.selectedTermId());
      const message = `This lesson is locked! You need an active subscription for ${selectedTerm?.name || 'this term'} to access lessons.`;

      this.toastService.showWarning(message, 7000);
      return;
    }

    // ✅ Allow guests to view lessons in preview mode (shouldn't happen but safe fallback)
    if (!this.authService.isAuthenticated()) {
      console.log('👤 Guest user viewing lesson in preview mode');
      this.navigateToLesson(lesson.id, true); // true = preview mode
      return;
    }

    // Check if lesson is locked (has prerequisites)
    if (lesson.isLocked) {
      this.toastService.showWarning('This lesson is locked. Complete the prerequisite lessons first.');
      return;
    }

    // Navigate to lesson detail
    console.log('✅ Opening lesson:', lesson.title, '→ /lesson/' + lesson.id);
    this.navigateToLesson(lesson.id, false);
  }

  /**
   * Navigate to lesson detail page
   * @param lessonId - The lesson ID
   * @param isPreviewMode - Whether to open in preview mode (for guests)
   */
  private navigateToLesson(lessonId: number, isPreviewMode: boolean = false): void {
    const queryParams: any = {};

    // Pass subjectId for proper navigation back
    if (this.currentSubjectId()) {
      queryParams.subjectId = this.currentSubjectId();
    }

    // Pass studentId if authenticated
    // Prefer selected student (parent context); fallback to authenticated student
    const studentId = this.selectedStudentId() || this.authService.getCurrentUser()?.studentId;
    if (studentId) {
      queryParams.studentId = studentId;
    }

    // 🔒 SECURITY: Removed hasAccess from query params - subscription guard will verify from backend

    if (isPreviewMode) {
      queryParams.preview = 'true';
    }

    this.router.navigate(['/lesson', lessonId], { queryParams });
  }

  /**
   * Navigate back to courses
   */
  goBackToCourses(): void {
    const queryParams: any = {};

    // Use subjectId if available, otherwise fall back to subject name
    if (this.currentSubjectId()) {
      queryParams.subjectId = this.currentSubjectId();
    }
    if (this.currentSubject()) {
      queryParams.subject = this.currentSubject();
    }

    this.router.navigate(['/student/subjects'], { queryParams });
  }

  /**
   * Enroll in course
   */
  enrollInCourse(): void {
    if (!this.authService.isAuthenticated()) {
      this.toastService.showInfo('Please log in to enroll');
      this.router.navigate(['/auth/login']);
      return;
    }

    const courseId = this.currentCourseId();
    if (!courseId) {
      this.goBackToCourses();
      return;
    }

    if (confirm(`Are you sure you want to enroll in ${this.currentSubject()}?`)) {
      this.coursesService.enrollInCourse(courseId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (success: any) => {
            if (success) {
              this.toastService.showSuccess(`Successfully enrolled in ${this.currentSubject()}!`);
              this.isEnrolledInSubject.set(true);
              this.loadStudentProgress();
            } else {
              this.toastService.showError('Enrollment failed. Please try again.');
            }
          },
          error: (error: any) => {
            console.error('Enrollment error:', error);
            this.toastService.showError('Enrollment failed. Please try again.');
          }
        });
    }
  }

  /**
   * Get lesson progress percentage
   */
  getLessonProgress(lessonId: number): number {
    const studentLesson = this.studentLessons().find(sl => sl.lesson.id === lessonId);
    return studentLesson?.progress.progress || 0;
  }

  /**
   * Check if lesson is completed
   */
  isLessonCompleted(lessonId: number): boolean {
    const studentLesson = this.studentLessons().find(sl => sl.lesson.id === lessonId);
    return studentLesson?.lesson.isCompleted || false;
  }

  /**
   * Get difficulty color class
   */
  getDifficultyColorClass(difficulty: string | undefined): string {
    if (!difficulty) return 'bg-gray-100 text-gray-800';

    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Format duration
   */
  formatDuration(minutes: number | undefined): string {
    if (!minutes || minutes === 0) {
      return '';
    }
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  /**
   * Load available terms for the subject
   */  /**
* Load available terms for the subject
*/
  private loadAvailableTerms(subjectId: number): void {
    const user = this.authService.getCurrentUser();
    let studentId = user?.studentId || this.selectedStudentId();

    // ✅ If no studentId, don't load terms (student must be logged in)
    if (!studentId) {
      console.warn('⚠️ No studentId found - cannot load terms');
      this.availableTerms.set([]);
      return;
    }

    // ✅ Use new backend endpoint to get per-term access status
    this.coursesService.getTermAccessStatus(studentId, subjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (termAccessStatus: any) => {
          console.log('✅ Term access status loaded:', {
            subject: termAccessStatus.subjectName,
            currentTerm: termAccessStatus.currentTermNumber,
            totalTerms: termAccessStatus.terms?.length || 0,
            accessibleTerms: termAccessStatus.terms?.filter((t: any) => t.hasAccess).map((t: any) => t.termNumber) || [],
            lockedTerms: termAccessStatus.terms?.filter((t: any) => !t.hasAccess).map((t: any) => t.termNumber) || []
          });

          // ✅ Handle global courses (yearNumber = 0) - no terms/weeks
          // Backend returns empty terms array for global courses
          let termsData = termAccessStatus.terms || [];

          if (termsData.length === 0) {
            // This is a global course - load lessons directly without term selector
            console.log('📌 Global course detected (no terms) - loading lessons directly');
            this.availableTerms.set([]);

            // Load lessons directly for global courses
            const subjectId = this.currentSubjectId();
            if (subjectId) {
              this.loadLessonsForSubjectId(subjectId);
            }
            return;
          }

          // Standard course with terms - continue with term processing
          // ⚠️ WORKAROUND: If ALL terms have hasAccess: false but currentTermNumber is set,
          // override hasAccess for the current term (backend bug)
          const allLocked = termsData.every((t: any) => !t.hasAccess);
          if (allLocked && termAccessStatus.currentTermNumber) {
            console.warn('⚠️ Backend bug: All terms locked but currentTermNumber set');
            console.log('🔧 Workaround: Granting access to current term:', termAccessStatus.currentTermNumber);

            termsData = termsData.map((t: any) => ({
              ...t,
              hasAccess: t.termNumber === termAccessStatus.currentTermNumber || t.isCurrentTerm
            }));
          }

          // ✅ Backend now returns correct number of terms (4) filtered by current year
          // No client-side filtering needed
          const terms: Term[] = termsData.map((t: any, index: number) => ({
            id: t.termId || t.termNumber,  // ✅ FIX: Use termNumber if termId is 0
            termNumber: t.termNumber,
            name: t.termName,
            isCurrentTerm: t.isCurrentTerm,
            hasAccess: t.hasAccess  // ✅ Backend determines access per term
          }));

          console.log('📋 Mapped Terms:', terms.map(t => ({ id: t.id, termNumber: t.termNumber, name: t.name, hasAccess: t.hasAccess })));

          // ✅ FILTER: Only show terms that student has access to
          const accessibleTerms = terms.filter(t => t.hasAccess);

          console.log('✅ Terms loaded with backend access control:', {
            totalTerms: terms.length,
            accessibleTerms: accessibleTerms.map(t => t.termNumber),
            lockedTerms: terms.filter(t => !t.hasAccess).map(t => t.termNumber),
            currentTermNumber: termAccessStatus.currentTermNumber,
            filtered: `Showing ${accessibleTerms.length} of ${terms.length} terms`
          });

          // Set only accessible terms
          this.availableTerms.set(accessibleTerms);

          // Find and set current term (from accessible terms only)
          const currentTerm = accessibleTerms.find(t => t.isCurrentTerm);
          if (currentTerm) {
            this.currentTermId.set(currentTerm.id);

            // If no term is selected yet, select the current term
            if (!this.selectedTermId()) {
              this.selectedTermId.set(currentTerm.id);
            }
          } else {
            // No current term in accessible terms, select first accessible term
            if (accessibleTerms.length > 0 && !this.selectedTermId()) {
              this.selectedTermId.set(accessibleTerms[0].id);
            }
          }

          console.log('✅ Selected term:', {
            currentTermId: this.currentTermId(),
            selectedTermId: this.selectedTermId(),
            availableCount: accessibleTerms.length
          });
        },
        error: (error: any) => {
          console.error('❌ Error loading term access status:', error);
          this.toastService.showError('Unable to load subscription information. Please try again.');
        }
      });
  }

  /**
   * ✅ NEW: Auto-select current term and load its lessons
   * Called when no termNumber is provided in URL
   */
  private autoSelectCurrentTermAndLoadLessons(subjectId: number): void {
    this.loading.set(true);

    const user = this.authService.getCurrentUser();
    let studentId = user?.studentId || this.selectedStudentId();

    if (!studentId) {
      console.warn('⚠️ No studentId - loading all lessons for subject');
      this.loadLessonsForSubjectId(subjectId);
      return;
    }

    // Get term access status to find current term
    this.coursesService.getTermAccessStatus(studentId, subjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (termAccessStatus: any) => {
          const currentTermNumber = termAccessStatus.currentTermNumber || 1;
          const termsData = termAccessStatus.terms || [];

          // ✅ Handle global courses (no terms)
          if (termsData.length === 0) {
            console.log('📌 Global course detected (no terms) - loading lessons directly');
            this.availableTerms.set([]);
            this.loadLessonsForSubjectId(subjectId);
            return;
          }

          // Find current term in accessible terms
          const currentTerm = termsData.find((t: any) =>
            t.isCurrentTerm || t.termNumber === currentTermNumber
          );

          if (currentTerm && currentTerm.hasAccess) {
            console.log('✅ Auto-selecting current term:', currentTerm.termNumber);
            this.selectedTermId.set(currentTerm.termId || currentTerm.termNumber);
            this.loadLessonsByTermNumber(subjectId, currentTerm.termNumber);
          } else {
            // Find first accessible term
            const firstAccessibleTerm = termsData.find((t: any) => t.hasAccess);
            if (firstAccessibleTerm) {
              console.log('✅ Auto-selecting first accessible term:', firstAccessibleTerm.termNumber);
              this.selectedTermId.set(firstAccessibleTerm.termId || firstAccessibleTerm.termNumber);
              this.loadLessonsByTermNumber(subjectId, firstAccessibleTerm.termNumber);
            } else {
              console.log('⚠️ No accessible terms - loading current term preview');
              this.loadLessonsByTermNumber(subjectId, currentTermNumber);
            }
          }
        },
        error: (error: any) => {
          console.error('❌ Error getting term access - falling back to term 1:', error);
          this.loadLessonsByTermNumber(subjectId, 1);
        }
      });
  }

  /**
   * ✅ UPDATED: Load lessons by term (supports guest mode)
   */
  private loadLessonsByTerm(termId: number): void {
    const user = this.authService.getCurrentUser();
    const studentId = user?.studentId || this.selectedStudentId() || undefined;

    this.loading.set(true);
    this.error.set(null);

    console.log('📚 Loading lessons by term:', { termId, studentId, isGuest: !studentId });

    // ✅ Use new endpoint that supports guest mode
    this.lessonsService.getLessonsByTermWithProgress(termId, studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lessons) => {
          this.lessons.set(lessons);
          this.loading.set(false);

          // Check if any lessons have access
          const hasAnyAccess = lessons.some((l: any) => l.hasAccess === true);
          this.hasAccess.set(hasAnyAccess);

          // Show subscription banner if no access and authenticated
          if (!hasAnyAccess && this.authService.isAuthenticated()) {
            this.showSubscriptionBanner.set(true);
          }

          console.log('✅ Term lessons loaded:', {
            termId,
            count: lessons.length,
            hasAccess: hasAnyAccess,
            isGuest: !studentId
          });
        },
        error: (error) => {
          console.error('❌ Failed to load term lessons:', error);
          this.error.set('Unable to load lessons. Please try again later.');
          this.loading.set(false);
        }
      });
  }

  /**
   * ✅ UPDATED: Load lessons by term number (supports guest mode)
   * @param subjectId - The subject ID
   * @param termNumber - The term number (1-4)
   */
  private loadLessonsByTermNumber(subjectId: number, termNumber: number): void {
    const user = this.authService.getCurrentUser();
    const studentId = user?.studentId || this.selectedStudentId() || undefined;

    this.loading.set(true);
    this.error.set(null);

    console.log(`📚 Loading lessons for subject ${subjectId}, term ${termNumber}`, {
      studentId,
      isGuest: !studentId
    });

    // ✅ Use new endpoint that supports guest mode
    this.lessonsService.getLessonsByTermNumberWithProgress(subjectId, termNumber, studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lessons) => {
          this.lessons.set(lessons);
          this.loading.set(false);

          const currentAccess = this.hasAccess();

          console.log('📦 Lessons loaded:', {
            count: lessons.length,
            subjectId,
            termNumber,
            hasAccess: currentAccess,
            isGuest: !studentId
          });

          if (!currentAccess) {
            console.log('🔒 Preview mode - Lessons shown but locked (no subscription for this term)');
          }
        },
        error: (error) => {
          console.error(`❌ Failed to load term ${termNumber} lessons:`, error);
          this.error.set('Unable to load lessons. Please try again later.');
          this.loading.set(false);
        }
      });
  }

  /**
   * Switch to a different term
   */
  switchTerm(termId: number): void {
    const term = this.availableTerms().find(t => t.id === termId);

    if (!term) {
      console.warn('⚠️ Term not found:', termId);
      return;
    }

    console.log('🔄 ====== SWITCHING TERM ======');
    console.log('🔄 Selected Term:', {
      termId: term.id,
      termNumber: term.termNumber,
      termName: term.name,
      hasAccess: term.hasAccess
    });

    console.log('📋 All Available Terms:', this.availableTerms().map(t => ({
      id: t.id,
      termNumber: t.termNumber,
      name: t.name,
      hasAccess: t.hasAccess
    })));

    // ✅ UPDATE: Set access status for the selected term
    this.hasAccess.set(term.hasAccess);
    this.showSubscriptionBanner.set(!term.hasAccess);
    console.log(`🔒 Updated UI: hasAccess=${term.hasAccess}, showBanner=${!term.hasAccess}`);

    this.selectedTermId.set(termId);

    // ✅ FIX: Use termNumber for loading lessons (not termId)
    const subjectId = this.currentSubjectId();
    console.log(`📚 Will load lessons for: subjectId=${subjectId}, termNumber=${term.termNumber}`);

    if (!term.termNumber) {
      console.error('❌ ERROR: termNumber is missing!', term);
      return;
    }

    // ✅ Always load lessons for preview (even if locked)
    // The onLessonClick() method will handle access control
    if (subjectId && term.termNumber) {
      console.log(term.hasAccess ? '✅ Loading lessons - Student has access' : '👀 Loading lessons for preview - Locked term');
      this.loadLessonsByTermNumber(subjectId, term.termNumber);

      if (!term.hasAccess) {
        // Show info message for locked terms
        this.toastService.showInfo(
          `👀 ${term.name} - Preview mode. Subscribe to unlock all lessons!`,
          5000
        );
      }
    } else {
      console.warn('⚠️ Missing subjectId or termNumber');
    }

    // ✅ FIX: Update URL with termNumber AND hasAccess
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        termNumber: term.termNumber,
        hasAccess: term.hasAccess  // ✅ Include access status in URL
      },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Toggle term selector visibility
   */
  toggleTermSelector(): void {
    this.showTermSelector.update(v => !v);
  }

  /**
   * ✅ NEW: Navigate to subscription page
   */
  goToSubscription(): void {
    const subjectId = this.currentSubjectId();
    const courseId = this.currentCourseId();

    console.log('💳 Redirecting to subscription page');

    // Navigate to subscription page with subject context
    this.router.navigate(['/subscription'], {
      queryParams: {
        subjectId: subjectId,
        courseId: courseId,
        returnUrl: this.router.url
      }
    });
  }

  /**
   * ✅ NEW: Check if user can access a lesson
   */
  canAccessLesson(lesson: Lesson): boolean {
    return this.hasAccess();
  }

  /**
   * ✅ NEW: Show subscription plans modal for the subject
   * Student can choose any plan (single term, multi-term, or full year)
   */
  addTermToCart(): void {
    const subjectId = this.currentSubjectId();
    const user = this.authService.getCurrentUser();
    const studentId = user?.studentId || this.selectedStudentId();

    console.log('🛒 addTermToCart called:', {
      subjectId,
      studentId,
      currentSubject: this.currentSubject()
    });

    if (!subjectId) {
      this.toastService.showError('Subject not found. Please try again.');
      return;
    }

    // ✅ FIXED: For Parents, studentId might not be set yet - allow them to proceed
    // They will select the student in onPlanSelected after picking a plan
    const rolesArray = user?.roles || (Array.isArray(user?.role) ? user.role :
      (typeof user?.role === 'string' ? user.role.split(',').map((r: string) => r.trim()) : []));
    const isParent = rolesArray.some((r: string) => r?.toLowerCase() === 'parent');

    if (!studentId && !isParent) {
      // Only block if NOT a parent and no studentId
      this.toastService.showInfo('Please log in to continue.');
      return;
    }

    if (!studentId && isParent) {
      console.log('👨‍👩‍👧‍👦 Parent without studentId - will select student after plan selection');
    }

    console.log('🛒 Fetching all available plans for subject:', subjectId);

    this.loadingPlans.set(true);

    // Fetch all available plans for this subject (no term filter)
    console.log('📡 API Call: getAvailablePlansForSubject', { subjectId });

    this.plansService.getAvailablePlansForSubject(subjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingPlans.set(false);

          console.log('📦 Plans API Response:', response);

          if (!response.availablePlans || response.availablePlans.length === 0) {
            console.warn('⚠️ No plans returned from API');
            this.toastService.showWarning('No subscription plans available at the moment. Please contact support.');
            return;
          }

          console.log(`✅ Found ${response.availablePlans.length} plans for subject`);

          // Convert API response to SubscriptionPlanSummary format
          const plans: SubscriptionPlanSummary[] = response.availablePlans.map(plan => ({
            id: plan.planId,
            name: plan.planName,
            description: plan.description,
            price: plan.price,
            currency: plan.currency,
            duration: plan.duration,
            planType: plan.planType,
            isActive: plan.isActive,
            isPopular: plan.isRecommended,
            features: plan.features || [],
            discount: plan.discountPercentage || undefined,
            originalPrice: plan.originalPrice || undefined
          }));

          // Show modal with converted plans
          this.selectedCoursePlans.set(plans);
          this.selectedCourseName.set(response.subjectName);
          this.showPlanModal.set(true);
        },
        error: (error) => {
          this.loadingPlans.set(false);
          console.error('❌ Failed to fetch plans:', error);
          this.toastService.showError('Failed to load subscription plans. Please try again later.');
        }
      });
  }

  /**
   * Handle plan selection modal close
   */
  onClosePlanModal(): void {
    this.showPlanModal.set(false);
    this.selectedCoursePlans.set([]);
    this.selectedCourseName.set('');
  }

  /**
   * Handle plan selection confirmation
   */
  onPlanSelected(planId: number): void {
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.toastService.showInfo('Please log in to continue.');
      return;
    }

    // Check user roles - handle multiple formats including comma-separated string
    let rolesArray: string[] = [];

    if (user?.roles && Array.isArray(user.roles)) {
      rolesArray = user.roles;
    } else if (Array.isArray(user?.role)) {
      rolesArray = user.role;
    } else if (typeof user?.role === 'string') {
      // Handle comma-separated string like "Parent, Member"
      rolesArray = user.role.split(',').map((r: string) => r.trim());
    }

    const isStudent = rolesArray.some((r: string) => r?.toLowerCase() === 'student');
    const isParent = rolesArray.some((r: string) => r?.toLowerCase() === 'parent');

    console.log('🛒 onPlanSelected called:', {
      planId,
      isStudent,
      isParent,
      roles: rolesArray,
      user: user,
      selectedStudentId: this.selectedStudentId()
    });

    let studentId: number | undefined;

    if (isStudent) {
      // Direct student access
      studentId = user?.studentId || user?.id;
      console.log('✅ Student role - using studentId:', studentId);
    } else if (isParent) {
      // Parent role - need to handle student selection
      // Load parent students from localStorage (stored by courses component)
      const studentsData = localStorage.getItem('parentStudents');
      let allParentStudents: any[] = [];

      if (studentsData) {
        try {
          allParentStudents = JSON.parse(studentsData);
          this.parentStudents.set(allParentStudents);
        } catch (e) {
          console.error('Error parsing parent students from localStorage:', e);
        }
      }

      console.log('👨‍👩‍👧‍👦 Parent students loaded:', allParentStudents.length);

      if (allParentStudents.length === 0) {
        this.toastService.showError('No students found. Please add a student first.');
        return;
      }

      // ✅ For global courses OR any course - use all students (no year filtering since we're on lessons page)
      // The studentId from URL should already be set, use it if available
      const urlStudentId = this.selectedStudentId();

      if (urlStudentId) {
        // Student already selected via URL parameter
        studentId = urlStudentId;
        console.log('✅ Using studentId from URL:', studentId);
      } else if (allParentStudents.length === 1) {
        // Only one student - auto-select
        studentId = allParentStudents[0].id;
        this.selectedStudentId.set(studentId || null);
        console.log('✅ Auto-selected only student:', allParentStudents[0].name);
      } else {
        // Multiple students - show selection modal
        console.log('👨‍👩‍👧‍👦 Multiple students - showing selection modal');
        this.pendingPlanId.set(planId);
        this.showStudentSelector.set(true);
        return;  // Wait for student selection
      }
    } else {
      // User is logged in but not Student or Parent
      console.log('⚠️ User has neither Student nor Parent role:', rolesArray);
      this.toastService.showError('Only students and parents can add items to cart.');
      return;
    }

    if (!studentId) {
      this.toastService.showInfo('Please select a student first.');
      return;
    }

    // Proceed with adding to cart
    this.addPlanToCart(planId, studentId);
  }

  /**
   * Handle student selection from modal
   */
  onStudentSelected(student: any): void {
    console.log('✅ Student selected:', student.name);
    this.selectedStudentId.set(student.id);
    this.showStudentSelector.set(false);

    const planId = this.pendingPlanId();
    if (planId) {
      this.addPlanToCart(planId, student.id);
      this.pendingPlanId.set(null);
    }
  }

  /**
   * Close student selector modal
   */
  onCloseStudentSelector(): void {
    this.showStudentSelector.set(false);
    this.pendingPlanId.set(null);
  }

  /**
   * Add plan to cart (extracted for reuse)
   * ✅ FIXED: Now uses coursesService.onPlanSelected (same as courses page)
   * This uses /Cart/items endpoint instead of /cart/add
   */
  private addPlanToCart(planId: number, studentId: number): void {
    const selectedPlan = this.selectedCoursePlans().find(p => p.id === planId);

    console.log('🛒 Adding plan to cart:', { planId, studentId, selectedPlan });

    // ✅ Create a course-like object for the service
    const courseData: any = {
      id: this.currentSubjectId(),
      subjectName: this.currentSubject(),
      name: this.currentSubject(),
      courseId: this.currentCourseId(),
      yearId: null  // Global courses don't have yearId filtering
    };

    // ✅ Use coursesService.onPlanSelected (same as courses page)
    // This uses /Cart/items endpoint which is the correct one
    this.coursesService.onPlanSelected(planId, courseData, studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            console.log('✅ Plan added to cart successfully');

            // Close modal
            this.onClosePlanModal();

            // Show success message
            this.toastService.showSuccess(`${selectedPlan?.name || 'Plan'} has been added to your cart!`);

            // Refresh cart count
            this.cartService.getCartItemCount().subscribe();
          } else {
            console.log('⚠️ Plan was not added to cart');
          }
        },
        error: (error) => {
          console.error('❌ Failed to add to cart:', error);

          // ✅ Handle subscription validation errors
          if (error.status === 400 && error.message) {
            this.handleSubscriptionError(error.message, studentId);
          } else {
            this.toastService.showError('Failed to add plan to cart. Please try again.');
          }
        }
      });
  }

  /**
   * Handle subscription validation errors
   */
  handleSubscriptionError(errorMessage: string, studentId: number): void {
    // Close plan modal if open
    this.onClosePlanModal();

    // Determine action type and button text
    const actionType = SubscriptionErrorDialogComponent.determineActionType(errorMessage);
    const actionButton = SubscriptionErrorDialogComponent.getActionButtonText(actionType);

    // Set error dialog state
    this.subscriptionErrorMessage.set(errorMessage);
    this.subscriptionErrorAction.set(actionType);
    this.subscriptionErrorActionButton.set(actionButton);
    this.showSubscriptionErrorDialog.set(true);
  }

  /**
   * Handle subscription error dialog action
   */
  onSubscriptionErrorAction(action: SubscriptionErrorAction): void {
    const currentUser = this.authService.getCurrentUser();
    const studentId = this.selectedStudentId() || currentUser?.id;

    switch (action) {
      case 'view-cart':
        this.router.navigate(['/cart']);
        break;
      case 'view-subscriptions':
        if (studentId) {
          this.router.navigate(['/subscriptions', studentId]);
        }
        break;
    }

    this.showSubscriptionErrorDialog.set(false);
  }

  /**
   * Close subscription error dialog
   */
  onCloseSubscriptionErrorDialog(): void {
    this.showSubscriptionErrorDialog.set(false);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Set active tab
   */
  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  /**
   * Get count of completed lessons
   */
  getCompletedLessonsCount(): number {
    return this.lessons().filter(l => this.isLessonCompleted(l.id)).length;
  }

  /**
   * Get count of lessons in progress
   */
  getInProgressLessonsCount(): number {
    return this.lessons().filter(l =>
      this.getLessonProgress(l.id) > 0 && !this.isLessonCompleted(l.id)
    ).length;
  }

  /**
   * Get total duration of all lessons
   */
  getTotalDuration(): number {
    return this.lessons().reduce((sum, lesson) =>
      sum + (lesson.duration || 0), 0
    );
  }

  /**
   * Get overall completion percentage
   */
  getOverallCompletionPercentage(): number {
    const total = this.lessons().length;
    if (total === 0) return 0;
    const completed = this.getCompletedLessonsCount();
    return Math.round((completed / total) * 100);
  }

  /**
   * Get lessons by term (for lessons tab)
   */
  getLessonsByTerm(): any[] {
    // Group lessons by term number
    const lessonsByTerm = this.lessons().reduce((acc: any, lesson: any) => {
      const term = lesson.term || lesson.termId || 1;
      if (!acc[term]) {
        acc[term] = [];
      }
      acc[term].push(lesson);
      return acc;
    }, {});

    return Object.keys(lessonsByTerm).map(term => ({
      termNumber: parseInt(term),
      lessons: lessonsByTerm[term]
    }));
  }
}
