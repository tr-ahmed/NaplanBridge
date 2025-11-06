import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError, map, switchMap } from 'rxjs/operators';

import { Lesson, StudentLesson } from '../../models/lesson.models';
import { LessonsService } from '../../core/services/lessons.service';
import { CoursesService } from '../../core/services/courses.service';
import { AuthService } from '../../auth/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { SubscriptionPlansService, TermPlansResponse, SubjectPlansResponse, PlanOption } from '../../core/services/subscription-plans.service';
import { PlanSelectionModalComponent } from '../../components/plan-selection-modal/plan-selection-modal.component';
import { SubscriptionPlanSummary } from '../../models/subject.models';

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
  imports: [CommonModule, PlanSelectionModalComponent],
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
  isBrowseMode = signal<boolean>(false);

  // ✅ NEW: Plan selection modal (using PlanSelectionModalComponent)
  showPlanModal = signal<boolean>(false);
  selectedCoursePlans = signal<SubscriptionPlanSummary[]>([]);
  selectedCourseName = signal<string>('');
  loadingPlans = signal<boolean>(false);

  private toastService = inject(ToastService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonsService: LessonsService,
    private coursesService: CoursesService,
    private authService: AuthService,
    private cartService: CartService,
    private plansService: SubscriptionPlansService
  ) {}

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
        const hasAccessParam = params['hasAccess']; // ✅ NEW: Get access status from params
        const browseMode = params['browseMode'] === 'true'; // ✅ NEW: Check if in browse mode
        const studentIdParam = params['studentId']; // ✅ NEW: Get studentId from URL

        // ✅ Set browse mode and student ID
        this.isBrowseMode.set(browseMode);

        if (studentIdParam) {
          const studentId = parseInt(studentIdParam, 10);
          if (!isNaN(studentId)) {
            this.selectedStudentId.set(studentId);
            console.log('✅ Selected student ID from URL:', studentId);
          }
        }

        // ✅ Set access status (convert string to boolean)
        if (hasAccessParam !== undefined) {
          const accessStatus = hasAccessParam === 'true' || hasAccessParam === true;
          this.hasAccess.set(accessStatus);
          this.showSubscriptionBanner.set(!accessStatus);
          console.log('🔒 Access status:', accessStatus ? 'Granted' : 'Denied');
        }

        if (subject) {
          this.currentSubject.set(subject);
        }

        if (subjectId) {
          this.currentSubjectId.set(parseInt(subjectId));

          // Load terms first
          this.loadAvailableTerms(parseInt(subjectId));

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
          // ❌ LAST RESORT: Load all lessons for subject
          else {
            console.warn('⚠️ No termNumber or termId provided, loading all lessons');
            this.loadLessonsForSubjectId(parseInt(subjectId));
          }
        } else if (subject) {
          // Fallback: try to load by subject name (for backward compatibility)
          this.loadLessonsForSubject(subject);
        }

        if (courseId) {
          this.currentCourseId.set(parseInt(courseId));
          this.checkEnrollmentStatus(parseInt(courseId));
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
          this.lessons.set(lessons);
          this.loading.set(false);

          // Check if any lessons have access
          const hasAnyAccess = lessons.some((l: any) => l.hasAccess === true);
          this.hasAccess.set(hasAnyAccess);

          // Show subscription banner if no access
          if (!hasAnyAccess && this.authService.isAuthenticated()) {
            this.showSubscriptionBanner.set(true);
          }

          console.log('✅ Lessons loaded:', {
            count: lessons.length,
            hasAccess: hasAnyAccess,
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
   * Check if user is enrolled in the course
   */
  private checkEnrollmentStatus(courseId: number): void {
    if (!this.authService.isAuthenticated()) {
      this.isEnrolledInSubject.set(false);
      return;
    }

    this.coursesService.isEnrolledInCourse(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (enrolled) => {
          this.isEnrolledInSubject.set(enrolled);
        },
        error: (error) => {
          console.error('Error checking enrollment:', error);
          this.isEnrolledInSubject.set(false);
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
   * ✅ UPDATED: Added subscription check + Guest preview mode
   */
  onLessonClick(lesson: Lesson): void {
    // ✅ PRIORITY 1: Check subscription/access
    if (!this.hasAccess()) {
      console.warn('🔒 Lesson locked - no subscription:', lesson.title);

      const selectedTerm = this.availableTerms().find(t => t.id === this.selectedTermId());
      const message = `This lesson is locked! You need an active subscription for ${selectedTerm?.name || 'this term'} to access lessons. Click "Add to Cart" button above to view available plans.`;

      this.toastService.showWarning(message, 7000);
      return;
    }

    // ✅ Allow guests to view lessons in preview mode
    if (!this.authService.isAuthenticated()) {
      console.log('👤 Guest user viewing lesson in preview mode');
      this.navigateToLesson(lesson.id, true); // true = preview mode
      return;
    }

    // Check if user is enrolled in the course
    if (!this.isEnrolledInSubject()) {
      this.toastService.showWarning(`You need to enroll in ${this.currentSubject()} to access this lesson`);
      this.goBackToCourses();
      return;
    }

    // Check if lesson is locked (has prerequisites)
    if (lesson.isLocked) {
      this.toastService.showWarning('This lesson is locked. Complete the prerequisite lessons first.');
      return;
    }

    // Navigate to lesson detail
    console.log('✅ Opening lesson:', lesson.title);
    this.navigateToLesson(lesson.id, false);
  }

  /**
   * Navigate to lesson detail page
   * @param lessonId - The lesson ID
   * @param isPreviewMode - Whether to open in preview mode (for guests)
   */
  private navigateToLesson(lessonId: number, isPreviewMode: boolean = false): void {
    const queryParams: any = {};

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

    this.router.navigate(['/courses'], { queryParams });
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
          next: (success) => {
            if (success) {
              this.toastService.showSuccess(`Successfully enrolled in ${this.currentSubject()}!`);
              this.isEnrolledInSubject.set(true);
              this.loadStudentProgress();
            } else {
              this.toastService.showError('Enrollment failed. Please try again.');
            }
          },
          error: (error) => {
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

    // ✅ If still no studentId, load terms without access info (browse mode)
    if (!studentId) {
      console.warn('⚠️ No studentId found - loading terms in browse mode');
      this.loadTermsForBrowseMode(subjectId);
      return;
    }

    // ✅ Use new backend endpoint to get per-term access status
    this.coursesService.getTermAccessStatus(studentId, subjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (termAccessStatus) => {
          console.log('✅ Term access status loaded:', {
            subject: termAccessStatus.subjectName,
            currentTerm: termAccessStatus.currentTermNumber,
            totalTerms: termAccessStatus.terms.length,
            accessibleTerms: termAccessStatus.terms.filter(t => t.hasAccess).map(t => t.termNumber),
            lockedTerms: termAccessStatus.terms.filter(t => !t.hasAccess).map(t => t.termNumber)
          });

          // ✅ Backend now returns correct number of terms (4) filtered by current year
          // No client-side filtering needed
          const terms: Term[] = termAccessStatus.terms.map((t, index) => ({
            id: t.termId || t.termNumber,  // ✅ FIX: Use termNumber if termId is 0
            termNumber: t.termNumber,
            name: t.termName,
            isCurrentTerm: t.isCurrentTerm,
            hasAccess: t.hasAccess  // ✅ Backend determines access per term
          }));

          console.log('📋 Mapped Terms:', terms.map(t => ({ id: t.id, termNumber: t.termNumber, name: t.name })));

          this.availableTerms.set(terms);

          // Find and set current term
          const currentTerm = terms.find(t => t.isCurrentTerm);
          if (currentTerm) {
            this.currentTermId.set(currentTerm.id);

            // If no term is selected yet, select the current term if accessible
            if (!this.selectedTermId()) {
              if (currentTerm.hasAccess) {
                this.selectedTermId.set(currentTerm.id);
              } else {
                // Current term not accessible, select first accessible term
                const firstAccessibleTerm = terms.find(t => t.hasAccess);
                if (firstAccessibleTerm) {
                  this.selectedTermId.set(firstAccessibleTerm.id);
                }
              }
            }
          } else {
            // No current term, default to first accessible term
            const firstAccessibleTerm = terms.find(t => t.hasAccess);
            if (firstAccessibleTerm && !this.selectedTermId()) {
              this.selectedTermId.set(firstAccessibleTerm.id);
            }
          }

          console.log('✅ Terms loaded with backend access control:', {
            totalTerms: terms.length,
            accessibleTerms: terms.filter(t => t.hasAccess).map(t => t.termNumber),
            lockedTerms: terms.filter(t => !t.hasAccess).map(t => t.termNumber),
            currentTermNumber: termAccessStatus.currentTermNumber,
            selectedTermId: this.selectedTermId()
          });
        },
        error: (error) => {
          console.error('❌ Error loading term access status:', error);
          this.toastService.showError('Unable to load subscription information. Please try again.');
        }
      });
  }

  /**
   * ✅ NEW: Load terms in browse mode (without student ID)
   * Shows all 4 terms as locked for preview
   */
  private loadTermsForBrowseMode(subjectId: number): void {
    console.log('👀 Loading terms for browse mode (no student ID)');

    // ✅ Fallback: Create default 4 terms (all locked for preview)
    const defaultTerms: Term[] = [
      { id: 1, termNumber: 1, name: 'Term 1', isCurrentTerm: false, hasAccess: false },
      { id: 2, termNumber: 2, name: 'Term 2', isCurrentTerm: false, hasAccess: false },
      { id: 3, termNumber: 3, name: 'Term 3', isCurrentTerm: false, hasAccess: false },
      { id: 4, termNumber: 4, name: 'Term 4', isCurrentTerm: false, hasAccess: false }
    ];

    this.availableTerms.set(defaultTerms);

    // Select first term by default
    if (!this.selectedTermId()) {
      this.selectedTermId.set(1);
      console.log('✅ Selected Term 1 for browse mode');
    }
  }

  /**
   * Load lessons by term
   * ✅ Backend endpoint fixed (Nov 3, 2025) - now stable and performant
   * Fallback mechanism kept as safety net for edge cases
   */
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
          console.log('📦 Lessons loaded:', {
            count: lessons.length,
            subjectId,
            termNumber,
            isGuest: !studentId
          });

          this.lessons.set(lessons);
          this.loading.set(false);

          // Check if any lessons have access
          const hasAnyAccess = lessons.some((l: any) => l.hasAccess === true);
          this.hasAccess.set(hasAnyAccess);

          // Show subscription banner if no access and authenticated
          if (!hasAnyAccess && this.authService.isAuthenticated()) {
            this.showSubscriptionBanner.set(true);
            console.log('🔒 Preview mode - Student viewing locked lessons');
          } else if (hasAnyAccess) {
            console.log('✅ Student has subscription access to this term');
          }

          console.log(`✅ Loaded ${lessons.length} lessons for term ${termNumber} (Access: ${hasAnyAccess})`);
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
      name: t.name
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

    if (subjectId && term.termNumber) {
      this.loadLessonsByTermNumber(subjectId, term.termNumber);
    } else {
      console.warn('⚠️ Missing subjectId or termNumber, using fallback');
      // Fallback to old method if termNumber not available
      this.loadLessonsByTerm(termId);
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

    if (!studentId) {
      this.toastService.showInfo('Please log in to continue.');
      return;
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
    const studentId = user?.studentId || this.selectedStudentId();

    if (!studentId) {
      this.toastService.showInfo('Please log in to add items to cart.');
      return;
    }

    const selectedPlan = this.selectedCoursePlans().find(p => p.id === planId);

    console.log('🛒 Adding plan to cart:', { planId, selectedPlan });

    // Add to cart
    this.cartService.addToCart({
      subscriptionPlanId: planId,
      studentId: studentId,
      quantity: 1
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Plan added to cart:', response);

          // Close modal
          this.onClosePlanModal();

          // Show success message
          this.toastService.showSuccess(`${selectedPlan?.name || 'Plan'} has been added to your cart!`);

          // Refresh cart count
          this.cartService.getCartItemCount().subscribe();
        },
        error: (error) => {
          console.error('❌ Failed to add to cart:', error);
          this.toastService.showError('Failed to add plan to cart. Please try again.');
        }
      });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}
