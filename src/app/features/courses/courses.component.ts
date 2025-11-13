import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Course, CourseFilter, Cart } from '../../models/course.models';
import { CoursesService, LessonWithProgress } from '../../core/services/courses.service';
import { NewsletterComponent } from '../../shared/newsletter/newsletter.component';
import { PlanSelectionModalComponent } from '../../components/plan-selection-modal/plan-selection-modal.component';
import { SubscriptionPlanSummary } from '../../models/subject.models';
import { AuthService } from '../../auth/auth.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, NewsletterComponent, PlanSelectionModalComponent],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss']
})
export class CoursesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State signals
  courses = signal<Course[]>([]);
  filteredCourses = signal<Course[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  cart = signal<Cart>({ items: [], totalAmount: 0, totalItems: 0 });

  // Plan selection modal state
  showPlanModal = signal<boolean>(false);
  selectedCourse = signal<Course | null>(null);
  selectedCoursePlans = computed(() => this.selectedCourse()?.subscriptionPlans || []);
  selectedCourseName = computed(() => this.selectedCourse()?.name || this.selectedCourse()?.subjectName || '');

  // Filter options
  selectedTerm = signal<number>(0); // 0 means no term filter
  selectedSubject = signal<string>('');
  selectedLevel = signal<string>('');
  selectedCategory = signal<string>('');
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  itemsPerPage = 9;

  // Filter and pagination options
  terms = [0, 1, 2, 3, 4]; // 0 = All Terms
  subjects = ['Math', 'English', 'Science', 'HASS'];
  levels = ['Beginner', 'Intermediate', 'Advanced'];
  categories = ['Language', 'Mathematics', 'Science', 'Social Studies'];

  // User info
  currentUser = signal<any>(null);
  userYear = signal<number | null>(null);
  isStudent = signal<boolean>(false);
  selectedStudentId = signal<number | null>(null); // For parent - selected child
  parentStudents = signal<any[]>([]); // Parent's children list

  // ✅ NEW: Student selection modal for parents
  showStudentSelector = signal<boolean>(false);
  studentsToSelect = signal<any[]>([]);
  pendingPlanId = signal<number | null>(null);
  pendingCourse = signal<Course | null>(null);

  // Available years for filtering
  availableYears = signal<Array<{id: number, name: string}>>([
    { id: 1, name: 'Year 7' },
    { id: 2, name: 'Year 8' },
    { id: 3, name: 'Year 9' }
  ]);
  selectedYearId = signal<number | null>(null);

  // Computed values
  totalPages = computed(() =>
    Math.ceil(this.filteredCourses().length / this.itemsPerPage)
  );

  paginatedCourses = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredCourses().slice(start, end);
  });

  cartItemCount = computed(() => this.cart().totalItems);

  // Display year name
  displayYearName = computed(() => {
    if (!this.selectedYearId()) return 'All Years';
    const year = this.availableYears().find(y => y.id === this.selectedYearId());
    return year?.name || 'All Years';
  });

  // Enrollment tracking
  private enrolledSubjectNames = new Set<string>();
  private hasFullYearSubscription = false;
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  constructor(
    private coursesService: CoursesService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadStudentSubscriptions(); // Load enrollment status
    this.subscribeToCart();
    this.subscribeToPlanModal();
    this.handleQueryParameters();
    this.loadCourses();
  }

  /**
   * Load current user information and auto-filter for students
   */
  private loadUserInfo(): void {
    const user = this.authService.getCurrentUser();

    this.logger.log('🔍 Loading user info...');
    this.logger.log('📦 Raw user object:', user);

    if (user) {
      this.currentUser.set(user);

      // Check if user is a student
      const roles = Array.isArray(user.role) ? user.role : [user.role];
      const isStudentRole = roles.some((r: string) => r.toLowerCase() === 'student');
      this.isStudent.set(isStudentRole);

      this.logger.log('👤 User Details:', {
        id: user.id,
        userName: user.userName,
        email: user.email,
        role: roles,
        isStudent: isStudentRole,
        yearId: user.yearId,
        yearIdType: typeof user.yearId,
        hasYearId: !!user.yearId
      });

      // If student and has yearId, auto-filter by their year
      if (isStudentRole && user.yearId) {
        this.userYear.set(user.yearId);
        this.selectedYearId.set(user.yearId);
        this.logger.log('✅ Student detected - Auto-filtering for Year ID:', user.yearId);
        this.logger.log('� Will show only subjects with yearId =', user.yearId);
      } else if (isStudentRole && !user.yearId) {
        console.warn('⚠️ Student detected but NO yearId found in token!');
        console.warn('📋 Backend may not have added yearId claim to JWT');

        // ✅ Also check for parent role
        const isParentRole = roles.some((r: string) => r.toLowerCase() === 'parent');
        if (isParentRole) {
          this.logger.log('👨‍👩‍👧‍👦 Student with Parent role - loading students...');
          this.loadParentStudents();
        }
      } else {
        this.logger.log('👔 Non-student user - showing all years');

        // ✅ If parent, load their students
        const isParentRole = roles.some((r: string) => r.toLowerCase() === 'parent');
        if (isParentRole) {
          this.logger.log('👨‍👩‍👧‍👦 Parent user - loading students...');
          this.loadParentStudents();
        }
      }
    } else {
      this.logger.log('⚠️ No user found - user not logged in');
    }
  }

  /**
   * Load parent's students
   */
  private loadParentStudents(): void {
    const parentId = this.currentUser()?.id;
    if (!parentId) return;

    this.logger.log('👨‍👩‍👧‍👦 Loading parent students from API...');

    // ✅ Use actual API endpoint
    this.http.get<any[]>(`${environment.apiBaseUrl}/User/get-children/${parentId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (students: any[]) => {
          this.logger.log('✅ Loaded parent students from API (RAW):', students);

          // Map to expected format
          const mappedStudents = students.map((s: any) => {
            const mapped = {
              id: s.id,
              name: s.name || s.userName,
              yearId: s.yearId || s.schoolYearId || s.year,
              yearName: s.yearName || s.schoolYearName || (s.yearId ? `Year ${s.yearId}` : 'Unknown'),
              email: s.email
            };

            this.logger.log('📝 Mapping student:', {
              raw: { id: s.id, name: s.name, yearId: s.yearId, schoolYearId: s.schoolYearId, year: s.year },
              mapped
            });

            return mapped;
          });

          this.logger.log('✅ Final mapped students:', mappedStudents);
          this.parentStudents.set(mappedStudents);

          // Store in localStorage for quick access
          localStorage.setItem('parentStudents', JSON.stringify(mappedStudents));
        },
        error: (error: any) => {
          console.error('❌ Error loading parent students:', error);

          // Fallback: Try localStorage
          const studentsData = localStorage.getItem('parentStudents');
          if (studentsData) {
            try {
              const students = JSON.parse(studentsData);
              this.parentStudents.set(students);
              this.logger.log('✅ Loaded parent students from localStorage:', students);
            } catch (e) {
              console.error('Failed to parse parent students data');
            }
          }
        }
      });
  }

  /**
   * Subscribe to plan modal state
   */
  private subscribeToPlanModal(): void {
    this.coursesService.showPlanModal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.showPlanModal.set(state.show);
        this.selectedCourse.set(state.course);
      });
  }

  /**
   * Handle query parameters for filtering
   */
  private handleQueryParameters(): void {
    // Handle query parameters (for ?subject=mathematics, etc.)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        // ✅ Check for studentId and yearId params (from parent dashboard)
        if (params['studentId']) {
          const studentId = parseInt(params['studentId'], 10);
          if (!isNaN(studentId)) {
            this.selectedStudentId.set(studentId);
            this.logger.log('✅ Selected student ID from params:', studentId);
          }
        }

        // ✅ Check for yearId param (filter by student's year)
        if (params['yearId']) {
          const yearId = parseInt(params['yearId'], 10);
          if (!isNaN(yearId)) {
            this.selectedYearId.set(yearId);
            this.logger.log('✅ Selected year ID from params:', yearId);
          }
        }

        // Set filters based on parameters
        if (params['subject']) {
          this.selectedSubject.set(params['subject']);
        }
        if (params['category']) {
          this.selectedCategory.set(params['category']);
        }
        if (params['level']) {
          this.selectedLevel.set(params['level']);
        }
        if (params['term']) {
          this.selectedTerm.set(parseInt(params['term'], 10));
        }
        if (params['search']) {
          this.searchQuery.set(params['search']);
        }

        // Apply filters after setting parameters
        if (Object.keys(params).length > 0) {
          this.loadCourses(); // Reload courses with new filters
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load courses from service
   */
  loadCourses(): void {
    const filter: CourseFilter = {
      term: this.selectedTerm() > 0 ? this.selectedTerm() : undefined,
      subject: this.selectedSubject() || undefined,
      level: this.selectedLevel() || undefined,
      category: this.selectedCategory() || undefined
    };

    this.logger.log('🔍 Loading courses with filter:', filter);

    this.coursesService.getCourses(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe(courses => {
        this.logger.log('📚 Received courses from API:', courses.length, courses);
        this.courses.set(courses);
        this.applyFilters();
      });
  }

  /**
   * Subscribe to cart changes
   */
  private subscribeToCart(): void {
    this.coursesService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => this.cart.set(cart));
  }

  /**
   * Apply filters to courses
   */
  applyFilters(): void {
    let filtered = [...this.courses()];

    this.logger.log('🔎 Applying filters to', filtered.length, 'courses');
    this.logger.log('📊 Current filters:', {
      term: this.selectedTerm(),
      subject: this.selectedSubject(),
      level: this.selectedLevel(),
      category: this.selectedCategory(),
      search: this.searchQuery(),
      yearId: this.selectedYearId()
    });

    // Apply year filter (important for students)
    if (this.selectedYearId()) {
      filtered = filtered.filter(course => course.yearId === this.selectedYearId());
      this.logger.log('📅 After year filter:', filtered.length, 'courses for Year ID:', this.selectedYearId());
    }

    // Apply search filter
    if (this.searchQuery().trim()) {
      const query = this.searchQuery().toLowerCase().trim();
      filtered = filtered.filter(course =>
        (course.name || course.subjectName)?.toLowerCase().includes(query) ||
        (course.description || '')?.toLowerCase().includes(query) ||
        (course.instructor || '')?.toLowerCase().includes(query) ||
        (course.tags || []).some(tag => tag.toLowerCase().includes(query)) ||
        course.subjectName?.toLowerCase().includes(query) ||
        course.categoryName?.toLowerCase().includes(query)
      );
      this.logger.log('🔍 After search filter:', filtered.length);
    }

    this.logger.log('✅ Final filtered courses:', filtered.length);
    this.logger.log('📄 Current page:', this.currentPage(), '| Items per page:', this.itemsPerPage);

    this.filteredCourses.set(filtered);
    this.currentPage.set(1); // Reset to first page when filters change
  }

  /**
   * Handle year filter change
   */
  onYearChange(yearId: number | null): void {
    this.selectedYearId.set(yearId);
    this.applyFilters();
  }

  /**
   * Handle filter changes
   */
  onTermChange(term: number): void {
    this.selectedTerm.set(term);
    this.loadCourses();
  }

  onSubjectChange(subject: string): void {
    this.selectedSubject.set(subject);
    this.loadCourses();
  }

  onLevelChange(level: string): void {
    this.selectedLevel.set(level);
    this.applyFilters();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
    this.applyFilters();
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.applyFilters();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.selectedTerm.set(1);
    this.selectedSubject.set('');
    this.selectedLevel.set('');
    this.selectedCategory.set('');
    this.searchQuery.set('');
    this.loadCourses();
  }

  /**
   * Pagination methods
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  /**
   * Cart management methods
   */
  addToCart(course: Course): void {
    this.coursesService.addToCart(course)
      .pipe(takeUntil(this.destroy$))
      .subscribe(success => {
        if (success) {
          // Could show a toast notification here
          this.logger.log(`Added ${course.name} to cart`);
        }
      });
  }

  removeFromCart(courseId: number): void {
    // ✅ NEW: Use exact ID matching from enhanced cart response
    const course = this.courses().find(c => c.id === courseId);
    if (!course) {
      console.error('❌ Course not found:', courseId);
      return;
    }

    const cart = this.coursesService.getCartValue();

    // Find cart item using exact subjectId and yearId
    const cartItem = cart.items.find((item: any) => {
      // New backend structure with IDs (preferred)
      if (item.subjectId !== undefined && item.yearId !== undefined) {
        const match = item.subjectId === course.id && item.yearId === course.yearId;

        this.logger.log('🔍 Finding cart item by ID:', {
          courseId: course.id,
          courseName: course.name || course.subjectName,
          courseYearId: course.yearId,
          itemSubjectId: item.subjectId,
          itemYearId: item.yearId,
          itemCartItemId: item.cartItemId,
          match
        });

        return match;
      }

      // Fallback: Legacy structure (old way)
      const itemFullName = (item.course?.subjectName || item.course?.name || '').trim();
      const itemSubjectName = itemFullName.split(' - ')[0].trim().toLowerCase();
      const baseSubjectName = (course.subjectName || course.name || '').split(' - ')[0].trim().toLowerCase();
      const itemNameNoYear = itemSubjectName.replace(/year\s*\d+/gi, '').trim();
      const courseNameNoYear = baseSubjectName.replace(/year\s*\d+/gi, '').trim();

      return itemNameNoYear === courseNameNoYear;
    });

    if (!cartItem) {
      console.error('❌ Cart item not found for course:', course.name || course.subjectName);
      this.logger.log('📦 Available cart items:', cart.items.map((item: any) => ({
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        yearId: item.yearId,
        cartItemId: item.cartItemId
      })));
      return;
    }

    // Get the cartItemId or subscriptionPlanId to remove
    const itemId = (cartItem as any).cartItemId ||
                   (cartItem as any).subscriptionPlanId ||
                   (cartItem as any)._backendData?.subscriptionPlanId;

    this.logger.log('🗑️ Removing cart item:', {
      courseId: course.id,
      courseName: course.name || course.subjectName,
      itemId,
      cartItem: {
        subjectId: (cartItem as any).subjectId,
        yearId: (cartItem as any).yearId,
        cartItemId: (cartItem as any).cartItemId
      }
    });

    this.coursesService.removeFromCart(itemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(success => {
        if (success) {
          this.logger.log('✅ Removed course from cart');
        }
      });
  }  isInCart(courseId: number): boolean {
    // ✅ NEW: Use exact ID matching from enhanced cart response
    const course = this.courses().find(c => c.id === courseId);
    if (!course) return false;

    const cart = this.coursesService.getCartValue();

    this.logger.log('🔍 isInCart called:', {
      courseId: course.id,
      courseName: course.name || course.subjectName,
      courseYearId: course.yearId,
      cartItemsCount: cart.items.length
    });

    // Check using exact subjectId and yearId from enhanced cart items
    const inCart = cart.items.some((item: any) => {
      this.logger.log('🔄 Checking cart item:', {
        hasSubjectId: item.subjectId !== undefined,
        hasYearId: item.yearId !== undefined,
        subjectId: item.subjectId,
        yearId: item.yearId,
        subjectName: item.subjectName,
        planName: item.planName,
        legacyCourseName: item.course?.name || item.course?.subjectName
      });

      // New backend structure with IDs
      if (item.subjectId !== undefined && item.yearId !== undefined) {
        const match = item.subjectId === course.id && item.yearId === course.yearId;

        this.logger.log('✅ Using exact ID matching:', {
          courseId: course.id,
          courseName: course.name || course.subjectName,
          courseYearId: course.yearId,
          itemSubjectId: item.subjectId,
          itemYearId: item.yearId,
          match
        });

        return match;
      }

      // Fallback to legacy structure (for backward compatibility)
      this.logger.log('⚠️ Using legacy matching (subjectId/yearId not available)');
      return this.coursesService.isInCart(courseId);
    });

    this.logger.log('🎯 Final isInCart result:', inCart);
    return inCart;
  }

  /**
   * Handle plan selection modal close
   */
  onClosePlanModal(): void {
    this.coursesService.closePlanSelectionModal();
  }

  /**
   * Handle plan selection from modal
   */
  onPlanSelected(planId: number): void {
    const course = this.selectedCourse();
    if (course) {
      // ✅ Get studentId for parent role
      const user = this.authService.getCurrentUser();
      let studentId: number | undefined;

      if (user?.role === 'Student' || (Array.isArray(user?.role) && user.role.includes('Student'))) {
        // Direct student access - use token studentId
        studentId = user.studentId;
      } else if (user?.role === 'Parent' || (Array.isArray(user?.role) && user.role.includes('Parent'))) {
        // Parent access - use selected student ID
        studentId = this.selectedStudentId() || undefined;

        if (!studentId) {
          // Try auto-select if only one student in same year
          const courseYearId = course.yearId;
          const allParentStudents = this.parentStudents();

          // ✅ Map yearId (database ID) to actual year number
          // yearId: 1 → Year 7, yearId: 2 → Year 8, yearId: 3 → Year 9
          const courseYearNumber = courseYearId + 6; // 1→7, 2→8, 3→9

          // ✅ Compare using yearNumber instead of yearId
          const studentsInSameYear = allParentStudents.filter(s => s.yearId === courseYearNumber);

          if (studentsInSameYear.length === 1) {
            // ✅ Only one student in same year - auto-select
            studentId = studentsInSameYear[0].id;
            this.selectedStudentId.set(studentId || null);
            this.logger.log('✅ Auto-selected student for cart:', studentsInSameYear[0].name);
          } else if (studentsInSameYear.length > 1) {
            // ⚠️ Multiple students in same year - ask parent to select
            this.logger.log('⚠️ Multiple students in same year, need manual selection');
            this.showStudentSelectionModal(studentsInSameYear, planId, course);
            return;  // Exit early - will continue after selection
          } else if (studentsInSameYear.length === 0) {
            // Use any available student
            const allStudents = this.parentStudents();
            if (allStudents.length > 0) {
              studentId = allStudents[0].id;
              this.logger.log('✅ Using first available student for cart:', allStudents[0].name);
            }
          }
        }
      }

      this.coursesService.onPlanSelected(planId, course, studentId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(success => {
          if (success) {
            this.logger.log('Plan added to cart successfully');
          }
        });
    }
  }

  /**
   * ✅ NEW: Show student selection modal for parents with multiple students
   */
  showStudentSelectionModal(students: any[], planId: number, course: Course): void {
    this.logger.log('👨‍👩‍👧‍👦 Opening student selector:', students);
    this.studentsToSelect.set(students);
    this.pendingPlanId.set(planId);
    this.pendingCourse.set(course);
    this.showStudentSelector.set(true);
  }

  /**
   * ✅ NEW: Handle student selection from modal
   */
  onStudentSelected(studentId: number): void {
    this.logger.log('✅ Student selected:', studentId);

    // Store selected student
    this.selectedStudentId.set(studentId);

    // Close modal
    this.showStudentSelector.set(false);

    // Continue with adding to cart
    const planId = this.pendingPlanId();
    const course = this.pendingCourse();

    if (planId && course) {
      this.coursesService.onPlanSelected(planId, course, studentId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(success => {
          if (success) {
            this.logger.log('Plan added to cart successfully for selected student');
          }
        });
    }

    // Clear pending data
    this.pendingPlanId.set(null);
    this.pendingCourse.set(null);
    this.studentsToSelect.set([]);
  }

  /**
   * ✅ NEW: Cancel student selection
   */
  onCancelStudentSelection(): void {
    this.logger.log('❌ Student selection cancelled');
    this.showStudentSelector.set(false);
    this.pendingPlanId.set(null);
    this.pendingCourse.set(null);
    this.studentsToSelect.set([]);
  }

  /**
   * Enrollment method
   */
  enrollNow(course: Course): void {
    if (confirm(`Are you sure you want to enroll in "${course.name}" for $${course.price}?`)) {
      this.coursesService.enrollInCourse(course.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(success => {
          if (success) {
            this.toastService.showSuccess(`Successfully enrolled in ${course.name}!`);
          } else {
            this.toastService.showError('Enrollment failed. Please try again.');
          }
        });
    }
  }

  /**
   * Continue Learning - Navigate to last incomplete lesson
   */
  continueLearning(course: Course): void {
    const user = this.authService.getCurrentUser();
    let studentId: number | undefined;

    // ✅ Handle both Student and Parent roles
    if (user?.role === 'Student' || (Array.isArray(user?.role) && user.role.includes('Student'))) {
      studentId = user.studentId;
    } else if (user?.role === 'Parent' || (Array.isArray(user?.role) && user.role.includes('Parent'))) {
      // ✅ Parent access - Auto-select student if only one in the same year
      studentId = this.selectedStudentId() || undefined;

      if (!studentId) {
        // ✅ Try to auto-select student based on course year
        const courseYearId = course.yearId;
        const studentsInSameYear = this.parentStudents().filter(s => s.yearId === courseYearId);

        if (studentsInSameYear.length === 1) {
          // ✅ Only one student in this year - auto-select
          studentId = studentsInSameYear[0].id;
          this.selectedStudentId.set(studentId || null);
          this.logger.log('✅ Auto-selected student for continue learning:', studentsInSameYear[0].name);
        } else {
          // ✅ No students or multiple students - Need student selection for progress tracking
          console.warn('⚠️ Continue Learning requires student selection');
          this.toastService.showInfo('Please select a student from your dashboard to continue their learning.');
          this.router.navigate(['/parent/dashboard']);
          return;
        }
      }
    }    if (!studentId) {
      console.warn('⚠️ No studentId found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    this.logger.log('📚 Finding last incomplete lesson for student:', studentId, 'subject:', course.id);

    // Get lessons with progress for this subject
    this.coursesService.getLessonsWithProgress(course.id, studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lessons: LessonWithProgress[]) => {
          if (!lessons || lessons.length === 0) {
            this.coursesService['toastService'].showWarning('No lessons available for this subject');
            return;
          }

          // Find last lesson with progress < 100%
          let targetLesson = lessons.find((lesson: LessonWithProgress) =>
            lesson.progressPercentage > 0 && lesson.progressPercentage < 100
          );

          // If no lesson in progress, find first incomplete lesson (progress = 0)
          if (!targetLesson) {
            targetLesson = lessons.find((lesson: LessonWithProgress) => lesson.progressPercentage === 0 || !lesson.progressPercentage);
          }

          // If all lessons are complete (100%), go to first lesson
          if (!targetLesson) {
            targetLesson = lessons[0];
          }

          this.logger.log('✅ Navigating to lesson:', targetLesson);

          // Navigate to the lesson detail page
          this.router.navigate(['/lesson-detail', targetLesson.id], {
            queryParams: {
              subjectId: course.subjectNameId,
              courseId: course.id,
              progress: targetLesson.progressPercentage || 0
            }
          });
        },
        error: (error: any) => {
          console.error('❌ Error fetching lessons:', error);
          this.coursesService['toastService'].showError('Failed to load lessons');
        }
      });
  }

  /**
   * Navigate to lessons for a specific course/subject
   */
  viewLessons(course: Course): void {
    const user = this.authService.getCurrentUser();
    let studentId: number | undefined;
    let isParentBrowseMode = false;

    // ✅ Handle both Student and Parent roles
    if (user?.role === 'Student' || (Array.isArray(user?.role) && user.role.includes('Student'))) {
      // Direct student access
      studentId = user.studentId;
    } else if (user?.role === 'Parent' || (Array.isArray(user?.role) && user.role.includes('Parent'))) {
      // ✅ Parent access - Try to auto-select student if only one in the same year
      studentId = this.selectedStudentId() || undefined;

      if (!studentId) {
        // ✅ Try to auto-select student based on course year
        const courseYearId = course.yearId;
        const studentsInSameYear = this.parentStudents().filter(s => s.yearId === courseYearId);

        this.logger.log('🔍 Checking for auto-select student:', {
          courseYearId,
          totalStudents: this.parentStudents().length,
          studentsInSameYear: studentsInSameYear.length
        });

        if (studentsInSameYear.length === 1) {
          // ✅ Only one student in this year - auto-select
          studentId = studentsInSameYear[0].id;
          this.selectedStudentId.set(studentId || null);
          this.logger.log('✅ Auto-selected student:', studentsInSameYear[0].name, 'ID:', studentId);
        } else {
          // ✅ Multiple students or no students - Try to pick any student for browse mode
          this.logger.log('👀 Parent browse mode - Multiple or no students in same year');

          // Try to use any available student (for browse mode)
          const allStudents = this.parentStudents();
          if (allStudents.length > 0) {
            // Pick the first available student (any year)
            studentId = allStudents[0].id;
            this.logger.log('✅ Using first available student for browse mode:', allStudents[0].name, 'ID:', studentId);
          } else {
            // No students at all - still allow browsing
            this.logger.log('⚠️ No students available - pure browse mode');
            isParentBrowseMode = true;
          }
        }
      }
    }

    // ✅ If parent browse mode (no student available), navigate without student data
    if (isParentBrowseMode) {
      this.logger.log('👀 Parent browsing lessons (no student available)');

      // Navigate to lessons without fetching term/week data
      this.router.navigate(['/lessons'], {
        queryParams: {
          subjectId: course.subjectNameId,
          subject: course.subject || course.subjectName,
          courseId: course.id,
          yearId: course.yearId,
          termNumber: 1,  // Default to term 1
          weekNumber: 1,  // Default to week 1
          hasAccess: false,  // Parent browsing - no access
          browseMode: true  // ✅ NEW: Indicate browse mode
        }
      });
      return;
    }

    // ✅ UPDATED: Allow guests to view lessons in preview mode
    if (!studentId) {
      this.logger.log('👤 Guest user - redirecting to lessons preview mode');

      // Navigate to lessons without studentId (preview mode)
      this.router.navigate(['/lessons'], {
        queryParams: {
          subject: course.name || course.subjectName,
          subjectId: course.id,
          termNumber: 1,  // Default to term 1 for guests
          hasAccess: false,
          browseMode: true  // Indicate guest preview mode
        }
      });
      return;
    }

    this.logger.log('📚 Fetching current term/week for student:', studentId, 'subject:', course.id);

    // ✅ Use backend endpoint to get current term/week
    this.coursesService.getCurrentTermWeek(studentId, course.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (termWeek) => {
          this.logger.log('✅ Term/Week info received:', {
            courseId: course.id,
            courseName: course.name || course.subjectName,
            hasAccess: termWeek.hasAccess,
            currentTerm: termWeek.currentTermName,
            currentWeek: termWeek.currentWeekNumber,
            progress: `${termWeek.progressPercentage}%`
          });

          // ✅ FIX: Use termNumber instead of termId for cross-subject navigation
          // This fixes the issue where different subjects have different term IDs
          // for the same term number (e.g., Algebra Term 3 = ID 3, Reading Term 3 = ID 11)

          // ✅ FREEMIUM MODEL: Always navigate to lessons (even without subscription)
          // User can see lesson names and terms, but lessons are locked
          this.router.navigate(['/lessons'], {
            queryParams: {
              subjectId: course.subjectNameId,
              subject: course.subject || course.subjectName,
              courseId: course.id,
              yearId: course.yearId,
              termNumber: termWeek.currentTermNumber || 3,  // Default to term 3 if not available
              weekNumber: termWeek.currentWeekNumber || 1,  // Default to week 1 if not available
              hasAccess: termWeek.hasAccess,  // ✅ Pass access status to lessons component
              studentId: studentId  // ✅ NEW: Pass student ID for parent access
            }
          });

          // ⚠️ Show info message if no subscription (non-blocking)
          if (!termWeek.hasAccess) {
            console.warn('⚠️ No subscription:', termWeek.message);
            // Show message after navigation completes
            setTimeout(() => {
              this.coursesService['toastService'].showInfo(
                '🔒 Subscribe to unlock all lessons and features for this subject',
                5000
              );
            }, 500);
          }
        },
        error: (error) => {
          console.error('❌ Error fetching current term/week:', error);

          // ✅ Still navigate to lessons even on error (with defaults)
          // Better UX: Let user see the interface even if API fails
          this.router.navigate(['/lessons'], {
            queryParams: {
              subjectId: course.subjectNameId,
              subject: course.subject || course.subjectName,
              courseId: course.id,
              yearId: course.yearId,
              termNumber: 3,  // Default term
              weekNumber: 1,  // Default week
              hasAccess: false,  // Assume no access on error
              studentId: studentId  // ✅ NEW: Pass student ID for parent access
            }
          });

          this.coursesService['toastService'].showWarning(
            'Unable to verify subscription. Some features may be limited.'
          );
        }
      });
  }

  /**
   * Utility methods
   */
  getDiscountPercentage(originalPrice: number, currentPrice: number): number {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  getStarsArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  isStarFilled(star: number, rating: number): boolean {
    return star <= Math.floor(rating);
  }

  isStarHalf(star: number, rating: number): boolean {
    return star === Math.floor(rating) + 1 && rating % 1 >= 0.5;
  }

  /**
   * Get minimum price from subscription plans
   */
  getMinPrice(course: Course): number {
    if (!course.subscriptionPlans || course.subscriptionPlans.length === 0) {
      return course.price || 0;
    }

    const prices = course.subscriptionPlans.map(plan => plan.price);
    return Math.min(...prices);
  }

  /**
   * Check if course has multiple plans
   */
  hasMultiplePlans(course: Course): boolean {
    return !!(course.subscriptionPlans && course.subscriptionPlans.length > 1);
  }

  /**
   * Load student's active subscriptions
   */
  private loadStudentSubscriptions(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser?.studentId) {
      console.warn('⚠️ No student ID found, skipping subscription load');
      return;
    }

    this.logger.log('📦 Loading subscriptions for student ID:', currentUser.studentId);

    this.subscriptionService.loadSubscriptionsSummary(currentUser.studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.logger.log('✅ Subscriptions loaded:', summary);

          // Check for Full Year subscription
          this.hasFullYearSubscription = summary.subscriptions.some(
            sub => sub.planType === 'FullYear'
          );

          // Store enrolled subject names
          this.enrolledSubjectNames = new Set(
            summary.subscriptions
              .filter(sub => sub.subjectName)
              .map(sub => sub.subjectName as string)
          );

          this.logger.log('📊 Enrollment status:', {
            hasFullYear: this.hasFullYearSubscription,
            enrolledSubjects: Array.from(this.enrolledSubjectNames)
          });
        },
        error: (error) => {
          console.error('❌ Failed to load subscriptions:', error);
          // Continue with empty enrollment (show all as Add to Cart)
        }
      });
  }

  /**
   * Check if student is already enrolled in this subject
   */
  isEnrolled(course: Course): boolean {
    // If student has Full Year subscription, they're enrolled in everything
    if (this.hasFullYearSubscription) {
      return true;
    }

    // Check if enrolled in specific subject by name
    const courseName = course.name || course.subjectName;
    return this.enrolledSubjectNames.has(courseName);
  }  /**
   * Get year name by ID
   */
  getYearName(yearId: number): string {
    const year = this.availableYears().find(y => y.id === yearId);
    return year?.name || `Year ${yearId}`;
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, -1);
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push(-1, total);
    } else if (total > 1) {
      rangeWithDots.push(total);
    }

    return rangeWithDots;
  }
}
