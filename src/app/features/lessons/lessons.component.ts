import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError, map, switchMap } from 'rxjs/operators';

import { Lesson, StudentLesson } from '../../models/lesson.models';
import { LessonsService } from '../../core/services/lessons.service';
import { CoursesService } from '../../core/services/courses.service';
import { AuthService } from '../../auth/auth.service';
import { CartService } from '../../core/services/cart.service';
import { SubscriptionPlansService, TermPlansResponse, PlanOption } from '../../core/services/subscription-plans.service';

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
  imports: [CommonModule],
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

  // ✅ NEW: Plan selection modal
  showPlansModal = signal<boolean>(false);
  selectedTermPlans = signal<TermPlansResponse | null>(null);
  addingToCart = signal<boolean>(false);
  loadingPlans = signal<boolean>(false);

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
   */
  private loadLessonsForSubjectId(subjectId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.lessonsService.getLessonsBySubjectId(subjectId)
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
   * ✅ UPDATED: Added subscription check
   */
  onLessonClick(lesson: Lesson): void {
    // ✅ PRIORITY 1: Check subscription/access
    if (!this.hasAccess()) {
      console.warn('🔒 Lesson locked - no subscription:', lesson.title);

      const selectedTerm = this.availableTerms().find(t => t.id === this.selectedTermId());
      const message = `🔒 This lesson is locked!\n\n` +
        `You need an active subscription for ${selectedTerm?.name || 'this term'} to access lessons.\n\n` +
        `Click "Add to Cart" button above to view available plans starting from $29.99.`;

      alert(message);
      return;
    }

    // Check if user is logged in
    if (!this.authService.isAuthenticated()) {
      alert('Please log in to access lessons');
      this.router.navigate(['/auth/login']);
      return;
    }

    // Check if user is enrolled in the course
    if (!this.isEnrolledInSubject()) {
      alert(`You need to enroll in ${this.currentSubject()} to access this lesson`);
      this.goBackToCourses();
      return;
    }

    // Check if lesson is locked (has prerequisites)
    if (lesson.isLocked) {
      alert('This lesson is locked. Complete the prerequisite lessons first.');
      return;
    }

    // Navigate to lesson detail
    console.log('✅ Opening lesson:', lesson.title);
    this.router.navigate(['/lesson', lesson.id]);
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
      alert('Please log in to enroll');
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
              alert(`Successfully enrolled in ${this.currentSubject()}!`);
              this.isEnrolledInSubject.set(true);
              this.loadStudentProgress();
            } else {
              alert('Enrollment failed. Please try again.');
            }
          },
          error: (error) => {
            console.error('Enrollment error:', error);
            alert('Enrollment failed. Please try again.');
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
    const studentId = this.authService.getCurrentUser()?.studentId;

    if (!studentId) {
      console.warn('⚠️ No studentId found');
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
          const terms: Term[] = termAccessStatus.terms.map(t => ({
            id: t.termId,
            termNumber: t.termNumber,
            name: t.termName,
            isCurrentTerm: t.isCurrentTerm,
            hasAccess: t.hasAccess  // ✅ Backend determines access per term
          }));

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
          alert('Unable to load subscription information. Please try again.');
        }
      });
  }

  /**
   * Load lessons by term
   * ✅ Backend endpoint fixed (Nov 3, 2025) - now stable and performant
   * Fallback mechanism kept as safety net for edge cases
   */
  private loadLessonsByTerm(termId: number): void {
    const studentId = this.authService.getCurrentUser()?.studentId;

    if (!studentId || !this.currentSubjectId()) {
      console.warn('⚠️ Missing studentId or subjectId');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // ✅ Endpoint: /api/Lessons/term/{termId}/with-progress/{studentId}
    // Status: Fixed and ready for production use
    const url = `${this.lessonsService['baseUrl']}/Lessons/term/${termId}/with-progress/${studentId}`;

    this.lessonsService['http'].get<any[]>(url)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('❌ Error loading lessons by term endpoint:', error);
          console.warn('🔄 Activating fallback: loading by subject and filtering...');

          // Fallback: Load all lessons for subject and filter by term on frontend
          return this.lessonsService.getLessonsBySubjectId(this.currentSubjectId()!)
            .pipe(
              map((allLessons: Lesson[]) => {
                // Filter lessons by termId if available
                const filteredLessons = allLessons.filter(lesson => lesson.termId === termId);
                console.log(`✅ Fallback successful: Found ${filteredLessons.length} lessons for term ${termId}`);
                return filteredLessons;
              }),
              catchError(() => {
                // If fallback also fails, return empty array
                console.error('❌ Fallback also failed');
                return of([]);
              })
            );
        })
      )
      .subscribe({
        next: (lessons) => {
          this.lessons.set(lessons as Lesson[]);
          this.loading.set(false);

          if (lessons.length > 0) {
            console.log('✅ Lessons loaded for term:', termId, lessons);
          } else {
            console.warn('⚠️ No lessons found for term:', termId);
            this.error.set('No lessons available for this term. The term may not have content yet.');
          }

          // Load student progress
          if (this.authService.isAuthenticated()) {
            this.loadStudentProgress();
          }
        },
        error: (error) => {
          console.error('❌ Fatal error loading lessons:', error);
          this.error.set('Unable to load lessons. Please try again later.');
          this.loading.set(false);
        }
      });
  }

  /**
   * Load lessons by term NUMBER (NEW - Nov 3, 2025)
   * ✅ This method fixes cross-subject navigation by using termNumber instead of termId
   * Different subjects have different term IDs for the same term number
   * @param subjectId - The subject ID
   * @param termNumber - The term number (1-4)
   */
  private loadLessonsByTermNumber(subjectId: number, termNumber: number): void {
    const studentId = this.authService.getCurrentUser()?.studentId;

    if (!studentId || !subjectId) {
      console.warn('⚠️ Missing studentId or subjectId');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    console.log(`🎯 Loading lessons for subject ${subjectId}, term ${termNumber}`);

    // ✅ NEW ENDPOINT: /api/Lessons/subject/{subjectId}/term-number/{termNumber}/with-progress/{studentId}
    this.coursesService.getLessonsByTermNumber(subjectId, termNumber, studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lessons) => {
          this.lessons.set(lessons as any[]);
          this.loading.set(false);

          if (lessons.length > 0) {
            console.log(`✅ Loaded ${lessons.length} lessons for term ${termNumber}`);

            // ✅ NEW: Check access status from first lesson
            const firstLesson = lessons[0] as any;
            if (firstLesson.hasAccess !== undefined) {
              const studentHasAccess = firstLesson.hasAccess === true;
              this.hasAccess.set(studentHasAccess);
              this.showSubscriptionBanner.set(!studentHasAccess);

              if (studentHasAccess) {
                console.log('✅ Student has subscription access to this term');
              } else {
                console.log('🔒 Preview mode - Student viewing locked lessons');
                console.log(`📚 Showing ${lessons.length} lesson previews`);
              }
            }
          } else {
            console.warn(`⚠️ No lessons found for subject ${subjectId}, term ${termNumber}`);
            this.error.set('No lessons available for this term. The term may not have content yet.');
          }

          // Load student progress (only if has access)
          if (this.authService.isAuthenticated() && this.hasAccess()) {
            this.loadStudentProgress();
          }
        },
        error: (error) => {
          console.error(`❌ Error loading lessons for term ${termNumber}:`, error);

          // Handle real errors (not 403 anymore since backend returns preview data)
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

    console.log('🔄 Switching to term:', {
      termId: term.id,
      termNumber: term.termNumber,
      termName: term.name,
      hasAccess: term.hasAccess
    });

    // ✅ UPDATE: Set access status for the selected term
    this.hasAccess.set(term.hasAccess);
    this.showSubscriptionBanner.set(!term.hasAccess);

    this.selectedTermId.set(termId);

    // ✅ FIX: Use termNumber for loading lessons (not termId)
    const subjectId = this.currentSubjectId();
    if (subjectId && term.termNumber) {
      this.loadLessonsByTermNumber(subjectId, term.termNumber);
    } else {
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
   * ✅ NEW: Add current term to cart
   * Fetches available plans and shows modal for selection
   */
  addTermToCart(): void {
    const selectedTerm = this.availableTerms().find(t => t.id === this.selectedTermId());
    const subjectId = this.currentSubjectId();
    const studentId = this.authService.getCurrentUser()?.studentId;

    if (!selectedTerm || !subjectId || !studentId) {
      alert('Unable to proceed. Please try again.');
      return;
    }

    console.log('🛒 Fetching available plans for:', {
      subjectId,
      termNumber: selectedTerm.termNumber,
      termName: selectedTerm.name
    });

    this.loadingPlans.set(true);

    // Fetch available plans from backend
    this.plansService.getAvailablePlansForTerm(subjectId, selectedTerm.termNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingPlans.set(false);

          if (!response.availablePlans || response.availablePlans.length === 0) {
            alert('No subscription plans available for this term at the moment. Please contact support.');
            return;
          }

          console.log(`✅ Found ${response.availablePlans.length} plans:`, response.availablePlans);

          // Show plans modal
          this.selectedTermPlans.set(response);
          this.showPlansModal.set(true);
        },
        error: (error) => {
          this.loadingPlans.set(false);
          console.error('❌ Failed to fetch plans:', error);
          alert('Failed to load subscription plans. Please try again later.');
        }
      });
  }

  /**
   * ✅ NEW: Add selected plan to cart
   */
  addPlanToCart(plan: PlanOption): void {
    const studentId = this.authService.getCurrentUser()?.studentId;

    if (!studentId) {
      alert('Please log in to add items to cart.');
      return;
    }

    console.log('🛒 Adding plan to cart:', plan);

    this.addingToCart.set(true);

    this.cartService.addToCart({
      subscriptionPlanId: plan.planId,
      studentId: studentId,
      quantity: 1
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.addingToCart.set(false);
          this.closePlansModal();

          console.log('✅ Plan added to cart:', response);

          // Show success message
          alert(`✅ ${plan.planName} has been added to your cart!`);

          // Refresh cart count
          this.cartService.getCartItemCount().subscribe();
        },
        error: (error) => {
          this.addingToCart.set(false);
          console.error('❌ Failed to add to cart:', error);
          alert('Failed to add plan to cart. Please try again.');
        }
      });
  }

  /**
   * ✅ NEW: Close plans modal
   */
  closePlansModal(): void {
    this.showPlansModal.set(false);
    this.selectedTermPlans.set(null);
  }
}
