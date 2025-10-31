import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Course, CourseFilter, Cart } from '../../models/course.models';
import { CoursesService } from '../../core/services/courses.service';
import { NewsletterComponent } from '../../shared/newsletter/newsletter.component';
import { PlanSelectionModalComponent } from '../../components/plan-selection-modal/plan-selection-modal.component';
import { SubscriptionPlanSummary } from '../../models/subject.models';
import { AuthService } from '../../auth/auth.service';

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

  constructor(
    private coursesService: CoursesService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
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

    if (user) {
      this.currentUser.set(user);

      // Check if user is a student
      const roles = Array.isArray(user.role) ? user.role : [user.role];
      const isStudentRole = roles.some((r: string) => r.toLowerCase() === 'student');
      this.isStudent.set(isStudentRole);

      // If student and has yearId, auto-filter by their year
      if (isStudentRole && user.yearId) {
        this.userYear.set(user.yearId);
        this.selectedYearId.set(user.yearId);
        console.log('🎓 Student detected - Auto-filtering for Year:', user.yearId);
      }

      console.log('👤 User Info:', {
        role: roles,
        isStudent: isStudentRole,
        yearId: user.yearId,
        autoFilter: isStudentRole && user.yearId
      });
    }
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

    console.log('🔍 Loading courses with filter:', filter);

    this.coursesService.getCourses(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe(courses => {
        console.log('📚 Received courses from API:', courses.length, courses);
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

    console.log('🔎 Applying filters to', filtered.length, 'courses');
    console.log('📊 Current filters:', {
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
      console.log('📅 After year filter:', filtered.length, 'courses for Year ID:', this.selectedYearId());
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
      console.log('🔍 After search filter:', filtered.length);
    }

    console.log('✅ Final filtered courses:', filtered.length);
    console.log('📄 Current page:', this.currentPage(), '| Items per page:', this.itemsPerPage);

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
          console.log(`Added ${course.name} to cart`);
        }
      });
  }

  removeFromCart(courseId: number): void {
    this.coursesService.removeFromCart(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(success => {
        if (success) {
          console.log('Removed course from cart');
        }
      });
  }

  isInCart(courseId: number): boolean {
    return this.coursesService.isInCart(courseId);
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
      this.coursesService.onPlanSelected(planId, course)
        .pipe(takeUntil(this.destroy$))
        .subscribe(success => {
          if (success) {
            console.log('Plan added to cart successfully');
          }
        });
    }
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
            alert(`Successfully enrolled in ${course.name}!`);
          } else {
            alert('Enrollment failed. Please try again.');
          }
        });
    }
  }

  /**
   * Navigate to lessons for a specific course/subject
   */
  viewLessons(course: Course): void {
    this.router.navigate(['/lessons'], {
      queryParams: {
        subjectId: course.subjectNameId,
        subject: course.subject || course.subjectName,
        courseId: course.id
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
