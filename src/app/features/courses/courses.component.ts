import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { Course, CourseFilter, Cart } from '../../models/course.models';
import { CoursesService, LessonWithProgress } from '../../core/services/courses.service';
import { NewsletterComponent } from '../../shared/newsletter/newsletter.component';
import { PlanSelectionModalComponent } from '../../components/plan-selection-modal/plan-selection-modal.component';
import { SubscriptionPlanSummary } from '../../models/subject.models';
import { AuthService } from '../../auth/auth.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { CategoryService } from '../../core/services/category.service';
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
  private searchSubject$ = new Subject<string>();

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
  itemsPerPage = 15; // Match API pageSize
  totalCount = signal<number>(0); // Total count from API

  // Filter and pagination options
  terms = [0, 1, 2, 3, 4]; // 0 = All Terms
  subjects = ['Math', 'English', 'Science', 'HASS'];
  levels = ['Beginner', 'Intermediate', 'Advanced'];
  categories = ['Language', 'Mathematics', 'Science', 'Social Studies'];

  // User info
  currentUser = signal<any>(null);
  userYear = signal<number | null>(null);
  isStudent = signal<boolean>(false);
  isParent = signal<boolean>(false); // ✅ Track if user is parent
  selectedStudentId = signal<number | null>(null); // For parent - selected child
  parentStudents = signal<any[]>([]); // Parent's children list

  // ✅ NEW: Student selection modal for parents
  showStudentSelector = signal<boolean>(false);
  studentsToSelect = signal<any[]>([]);
  pendingPlanId = signal<number | null>(null);
  pendingCourse = signal<Course | null>(null);

  // Available years for filtering - loaded from database
  availableYears = signal<Array<{id: number, yearNumber: number, name: string}>>([]);
  selectedYearId = signal<number | null>(null);

  // Computed values
  totalPages = computed(() =>
    Math.ceil(this.totalCount() / this.itemsPerPage)
  );

  // ✅ API handles pagination for all users (including parents with multiple years)
  paginatedCourses = computed(() => this.filteredCourses());  cartItemCount = computed(() => this.cart().totalItems);

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
  private categoryService = inject(CategoryService);

  constructor(
    private coursesService: CoursesService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('🚀 CoursesComponent ngOnInit - Starting...');

    // Check if user is logged in
    const user = this.authService.getCurrentUser();
    console.log('👤 Current user:', user ? 'Logged in' : 'Guest', user);

    if (user) {
      console.log('✅ User is logged in - Loading years from API...');
      // ✅ IMPORTANT: Load years FIRST - they will trigger filtering when loaded (only for logged-in users)
      this.loadAvailableYears(); // Load years from database first

      // ✅ Then load user info - parent students will be loaded
      this.loadUserInfo(); // This will load parent students and trigger loadCourses for parents

      this.loadStudentSubscriptions(); // Load enrollment status

      const userRoles = user.role || user.roles || user.Role || user.Roles;
      const rolesArray = Array.isArray(userRoles) ? userRoles : (userRoles ? [userRoles] : []);
      const isParent = rolesArray.some((r: string) => r?.toLowerCase() === 'parent');
      const isStudent = rolesArray.some((r: string) => r?.toLowerCase() === 'student');

      // Only load courses immediately if not a parent (or if parent+student)
      if (!isParent || isStudent) {
        this.loadCourses();
      }
    } else {
      console.log('🔓 Guest user - Loading years for guest...');
      // Guest user - load years from database and filter by available subjects
      this.loadAvailableYearsForGuest();
    }

    this.subscribeToCart();
    this.subscribeToPlanModal();
    this.subscribeToSearch(); // Subscribe to search with debounce
    this.handleQueryParameters();
  }

  /**
   * Set default years for guests or when API fails
   */
  private setDefaultYears(): void {
    const defaultYears = this.getDefaultYears();
    this.availableYears.set(defaultYears);
    this.logger.log('✅ Using default years:', defaultYears);
  }

  /**
   * Load available years from database
   */
  private loadAvailableYears(): void {
    this.categoryService.getYears().subscribe({
      next: (years) => {
        console.log('🔍 RAW API Response from /api/Years:', years);

        const formattedYears = years.map(year => {
          console.log(`📊 Mapping year: id=${year.id}, yearNumber=${year.yearNumber}`);
          return {
            id: year.id,                    // ✅ Database ID (e.g., 11)
            yearNumber: year.yearNumber,    // ✅ Display number (e.g., 8)
            name: `Year ${year.yearNumber}` // ✅ Display name (e.g., "Year 8")
          };
        });

        console.log('✅ Formatted years for UI:', formattedYears);
        this.availableYears.set(formattedYears);
        this.logger.log('✅ Loaded years from API /api/Years:', formattedYears);

        // ✅ After loading years, check if we need to filter for parent
        const user = this.currentUser();
        if (user) {
          const userRoles = user.roles || [];
          const isParent = userRoles.some((r: string) => r?.toLowerCase() === 'parent');
          const isStudent = userRoles.some((r: string) => r?.toLowerCase() === 'student');

          // If parent (not student), filter years after they're loaded
          if (isParent && !isStudent && this.parentStudents().length > 0) {
            this.logger.log('✅ Years loaded - triggering parent filter');
            this.filterYearsForParent();
          }
        }
      },
      error: (err) => {
        console.error('❌ Failed to load years:', err);
        // Fallback to default years
        this.setDefaultYears();
      }
    });
  }

  /**
   * Filter available years for parents to show only their children's years
   */
  private filterYearsForParent(): void {
    const user = this.currentUser();
    if (!user) {
      this.logger.log('⚠️ filterYearsForParent - No user found');
      return;
    }

    const userRoles = user.roles || [];
    const isParent = userRoles.some((r: string) => r?.toLowerCase() === 'parent');
    const isStudent = userRoles.some((r: string) => r?.toLowerCase() === 'student');

    // Only filter if user is parent (not student)
    if (isParent && !isStudent) {
      const students = this.parentStudents();
      const allYears = this.availableYears();

      this.logger.log('👨‍👩‍👧‍👦 filterYearsForParent called:', {
        students: students.length,
        availableYears: allYears.length
      });

      // ✅ Check if years are loaded
      if (!allYears || allYears.length === 0) {
        this.logger.log('⚠️ No years available yet - cannot filter');
        return;
      }

      if (students && students.length > 0) {
        // Get unique year Numbers (not IDs!) from parent's children
        // yearId from students is actually yearNumber (7, 9, etc.)
        const childrenYearNumbers = [...new Set(students.map(s => s.yearId).filter(id => id))];

        this.logger.log('👨‍👩‍👧‍👦 Children year Numbers:', childrenYearNumbers);
        this.logger.log('📚 Available years before filter:', allYears);

        // Filter available years by yearNumber (not id)
        const filteredYears = allYears.filter(year => childrenYearNumbers.includes(year.yearNumber));

        this.logger.log('✅ Filtered years (by yearNumber):', filteredYears);

        if (filteredYears.length > 0) {
          this.availableYears.set(filteredYears);

          // ✅ Don't auto-select - keep null to show "All My Children"
          if (!this.selectedYearId()) {
            this.selectedYearId.set(null); // Show all children's subjects
            this.logger.log('✅ Set to "All My Children" mode');
          }

          // ✅ Reload courses with filtered years
          this.logger.log('🔄 Reloading courses with filtered years');
          this.loadCourses();
        } else {
          this.logger.log('⚠️ No matching years found for children - keeping all years');
        }
      } else {
        // ✅ No students yet - show all years and load all courses
        this.logger.log('⚠️ Parent has no students yet - showing all years');
        this.loadCourses(); // Load courses without year filter
      }
    }
  }

  /**
   * Load available years for guest users
   * ✅ UPDATED (Dec 5, 2025): Use /api/Years API instead of extracting from subjects
   */
  private loadAvailableYearsForGuest(): void {
    console.log('📞 Guest - Loading years from /api/Years...');

    // ✅ Use the same API as logged-in users
    this.categoryService.getYears().subscribe({
      next: (years) => {
        console.log('🔍 Guest - RAW API Response from /api/Years:', years);

        const formattedYears = years.map(year => {
          console.log(`📊 Guest - Mapping year: id=${year.id}, yearNumber=${year.yearNumber}`);
          return {
            id: year.id,                    // ✅ Database ID (e.g., 11)
            yearNumber: year.yearNumber,    // ✅ Display number (e.g., 8)
            name: `Year ${year.yearNumber}` // ✅ Display name (e.g., "Year 8")
          };
        });

        console.log('✅ Guest - Formatted years for UI:', formattedYears);
        this.availableYears.set(formattedYears);
        this.logger.log('✅ Guest - Loaded years from API /api/Years:', formattedYears);

        // Now load courses with pagination
        this.loadCourses();
      },
      error: (err) => {
        console.error('❌ Guest - Failed to load years from API:', err);
        // Fallback to default years
        this.setDefaultYears();
        this.loadCourses();
      }
    });
  }

  /**
   * Get default years array (helper method)
   */
  private getDefaultYears() {
    return [
      { id: 1, yearNumber: 7, name: 'Year 7' },
      { id: 2, yearNumber: 8, name: 'Year 8' },
      { id: 3, yearNumber: 9, name: 'Year 9' },
      { id: 4, yearNumber: 10, name: 'Year 10' },
      { id: 5, yearNumber: 11, name: 'Year 11' },
      { id: 6, yearNumber: 12, name: 'Year 12' }
    ];
  }

  /**
   * Load current user information and auto-filter for students
   */
  private loadUserInfo(): void {
    const user = this.authService.getCurrentUser();

    this.logger.log('🔍 Loading user info...');
    this.logger.log('📦 Raw user object:', user);

    if (user) {
      // ✅ Normalize user object to handle both localStorage and token formats
      const userId = user.id || user.userId;
      const userRoles = user.role || user.roles || user.Role || user.Roles;
      const rolesArray = Array.isArray(userRoles) ? userRoles : (userRoles ? [userRoles] : []);
      const isStudent = rolesArray.some((r: string) => r?.toLowerCase() === 'student');

      const normalizedUser = {
        id: userId,
        // ✅ Use studentId from JWT token (decoded in AuthService)
        studentId: user.studentId,  // Now properly populated from JWT token
        userName: user.userName || user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
        role: rolesArray.length > 0 ? (rolesArray.length === 1 ? rolesArray[0] : rolesArray) : 'Guest',
        roles: rolesArray,
        yearId: user.yearId
      };

      this.currentUser.set(normalizedUser);

      // Check if user is a student
      const isStudentRole = rolesArray.some((r: string) => r?.toLowerCase() === 'student');
      this.isStudent.set(isStudentRole);

      // Check if user is a parent
      const isParentRole = rolesArray.some((r: string) => r?.toLowerCase() === 'parent');
      this.isParent.set(isParentRole && !isStudentRole); // ✅ Parent only if not also a student

      this.logger.log('👤 User Details:', {
        id: normalizedUser.id,
        studentId: normalizedUser.studentId,
        userName: normalizedUser.userName,
        email: normalizedUser.email,
        role: normalizedUser.role,
        roles: rolesArray,
        isStudent: isStudentRole,
        yearId: normalizedUser.yearId,
        yearIdType: typeof normalizedUser.yearId,
        hasYearId: !!normalizedUser.yearId
      });

      // If student and has yearId, auto-filter by their year
      if (isStudentRole && normalizedUser.yearId) {
        this.userYear.set(normalizedUser.yearId);
        this.selectedYearId.set(normalizedUser.yearId);
        this.logger.log('✅ Student detected - Auto-filtering for Year ID:', normalizedUser.yearId);
        this.logger.log('📚 Will show only subjects with yearId =', normalizedUser.yearId);
      } else if (isStudentRole && !normalizedUser.yearId) {
        console.warn('⚠️ Student detected but NO yearId found in token!');
        console.warn('📋 Backend may not have added yearId claim to JWT');

        // ✅ Also check for parent role
        const isParentRole = rolesArray.some((r: string) => r?.toLowerCase() === 'parent');
        if (isParentRole) {
          this.logger.log('👨‍👩‍👧‍👦 Student with Parent role - loading students...');
          this.loadParentStudents();
        }
      } else {
        this.logger.log('👔 Non-student user - showing all years');

        // ✅ If parent, load their students
        const isParentRole = rolesArray.some((r: string) => r?.toLowerCase() === 'parent');
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

    // ✅ Use Dashboard API instead of User API - it returns correct studentId!
    // Dashboard API returns ChildSummaryDto with studentId field
    this.http.get<any>(`${environment.apiBaseUrl}/Dashboard/parent`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dashboard: any) => {
          this.logger.log('✅ Loaded parent dashboard from API (RAW):', dashboard);

          // Extract children from dashboard response
          const students = dashboard.children || [];
          this.logger.log('✅ Children from dashboard:', students);

          // Map to expected format
          const mappedStudents = students.map((s: any) => {
            // ✅ CRITICAL: Log FULL raw object to see what backend actually returns
            this.logger.log('🔍 RAW STUDENT OBJECT FROM BACKEND:', s);
            this.logger.log('🔍 All properties:', Object.keys(s));

            // ✅ CRITICAL: Dashboard API returns studentId correctly!
            const mapped = {
              id: s.studentId,  // ✅ Correct Student.Id from Students table
              name: s.studentName || s.name || s.userName,
              yearId: s.year || s.yearId || s.schoolYearId,
              yearName: s.yearName || s.schoolYearName || (s.year ? `Year ${s.year}` : 'Unknown'),
              email: s.email
            };

            this.logger.log('📝 Mapping student:', {
              raw: {
                FULL_OBJECT: s,
                studentId: s.studentId,
                studentName: s.studentName,
                year: s.year,
                yearId: s.yearId
              },
              mapped
            });

            return mapped;
          });

          this.logger.log('✅ Final mapped students:', mappedStudents);
          this.parentStudents.set(mappedStudents);

          // ✅ CRITICAL: Clear old localStorage data and store new correct data
          localStorage.removeItem('parentStudents'); // Clear old data first
          localStorage.setItem('parentStudents', JSON.stringify(mappedStudents));
          this.logger.log('💾 Saved to localStorage:', mappedStudents);

          // ✅ Filter available years based on children's years
          // Only filter if years are already loaded
          const availableYears = this.availableYears();
          if (availableYears && availableYears.length > 0) {
            this.logger.log('✅ Years already loaded - filtering immediately');
            this.filterYearsForParent();
          } else {
            this.logger.log('⏳ Years not loaded yet - will filter when years load');
          }
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

              // ✅ Filter available years based on children's years
              // Only filter if years are already loaded
              const availableYears = this.availableYears();
              if (availableYears && availableYears.length > 0) {
                this.logger.log('✅ Years already loaded - filtering from localStorage');
                this.filterYearsForParent();
              } else {
                this.logger.log('⏳ Years not loaded yet - will filter when years load');
              }
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
   * Subscribe to search with debounce
   */
  private subscribeToSearch(): void {
    this.searchSubject$
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.currentPage.set(1); // Reset to first page when searching
        this.loadCourses(); // Reload from API with search query
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
   * ✅ UPDATED (Dec 5, 2025): Use yearId from database (not yearNumber)
   */
  loadCourses(): void {
    // ✅ Determine which years to filter - USING DATABASE IDs (not yearNumber)
    let yearsToFilter: number[] = [];

    if (this.selectedYearId()) {
      // ✅ If a specific year is selected (parent clicked on a year button), use only that year ID
      yearsToFilter = [this.selectedYearId()!];
    } else if (this.isParent() && this.availableYears().length > 0) {
      // ✅ If no year selected and user is parent, show all children's years IDs
      yearsToFilter = this.availableYears().map(y => y.id);
    }

    const filter: CourseFilter = {
      term: this.selectedTerm() > 0 ? this.selectedTerm() : undefined,
      subject: this.selectedSubject() || undefined,
      level: this.selectedLevel() || undefined,
      category: this.selectedCategory() || undefined,
      page: this.currentPage(),
      pageSize: this.itemsPerPage,
      search: this.searchQuery() || undefined,
      // ✅ Send yearIds (database IDs) - backend expects yearId not yearNumber
      yearIds: yearsToFilter.length > 0 ? yearsToFilter : undefined
    };

    this.logger.log('🔍 Loading courses with filter:', filter);

    this.coursesService.getCourses(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.logger.log('📚 API returned courses:', {
            count: response.courses.length,
            filter: filter,
            yearIds: filter.yearIds,
            totalCount: response.totalCount
          });
          this.courses.set(response.courses);
          this.totalCount.set(response.totalCount);
          this.applyFilters();
        },
        error: (error) => {
          this.logger.error('❌ Failed to load courses:', error);
          // For guests or unauthorized responses, show an empty list gracefully
          this.courses.set([]);
          this.totalCount.set(0);
          this.applyFilters();
        }
      });
  }  /**
   * Subscribe to cart changes
   */
  private subscribeToCart(): void {
    this.coursesService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => this.cart.set(cart));
  }

  /**
   * Apply filters to courses
   * ✅ UPDATE (Jan 27, 2025): API now handles year filtering - no need for frontend filtering
   */
  applyFilters(): void {
    // Since API handles all filtering (yearIds, search, categoryId),
    // we just use the courses as-is from the API response
    const filtered = [...this.courses()];

    this.logger.log('✅ Using API-filtered courses:', filtered.length);
    this.logger.log('📊 Active filters:', {
      term: this.selectedTerm(),
      subject: this.selectedSubject(),
      level: this.selectedLevel(),
      category: this.selectedCategory(),
      search: this.searchQuery(),
      yearId: this.selectedYearId(),
      isParent: this.isParent(),
      availableYears: this.availableYears().length
    });

    this.filteredCourses.set(filtered);
  }  /**
   * Handle year filter change
   */
  onYearChange(yearId: number | null): void {
    this.selectedYearId.set(yearId);
    this.currentPage.set(1); // Reset to first page
    this.loadCourses(); // Reload from API with new year filter
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
    // Trim the query to handle spaces
    const trimmedQuery = query.trim();

    this.logger.log('🔍 Search input changed:', {
      originalQuery: query,
      trimmedQuery: trimmedQuery,
      isEmpty: trimmedQuery === ''
    });

    this.searchQuery.set(trimmedQuery);

    // ✅ Using server-side search with debounce
    // If empty, reload immediately; otherwise use debounced search
    if (trimmedQuery === '') {
      this.currentPage.set(1);
      this.loadCourses();
    } else {
      // Use debounced search for non-empty queries
      this.searchSubject$.next(trimmedQuery);
    }
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
    // Don't reset yearId if user is a student (their year is fixed)
    if (!this.isStudent()) {
      this.selectedYearId.set(null);
    }
    this.currentPage.set(1);
    this.loadCourses();
  }

  /**
   * Pagination methods
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadCourses(); // Reload courses from API with new page
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadCourses(); // Reload courses from API with new page
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadCourses(); // Reload courses from API with new page
    }
  }

  /**
   * Cart management methods
   */
  addToCart(course: Course): void {
    // ✅ Check if user is logged in (not a guest)
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Guest user - show message and redirect to login
      this.toastService.showWarning('Please login first to add items to your cart');
      this.logger.log('🚫 Guest tried to add to cart - redirecting to login');
      // Redirect to login page after a short delay so user sees the message
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 1500);
      return;
    }

    this.coursesService.addToCart(course)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            // Could show a toast notification here
            this.logger.log(`Added ${course.name} to cart`);
          }
        },
        error: (err) => {
          // ✅ Error already handled in service, just log it here
          this.logger.error('Add to cart failed:', err);
          // Don't show toast here - service already showed it
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
      .subscribe((success: any) => {
        if (success) {
          this.logger.log('✅ Removed course from cart');
        }
      });
  }  isInCart(courseId: number): boolean {
    // ✅ NEW: Use exact ID matching from enhanced cart response
    const course = this.courses().find(c => c.id === courseId);
    if (!course) return false;

    const cart = this.coursesService.getCartValue();

    // this.logger.log('🔍 isInCart called:', {
    //   courseId: course.id,
    //   courseName: course.name || course.subjectName,
    //   courseYearId: course.yearId,
    //   cartItemsCount: cart.items.length
    // });

    // Check using exact subjectId and yearId from enhanced cart items
    const inCart = cart.items.some((item: any) => {
      // Removed excessive logging from inside loop to reduce noise

      // New backend structure with IDs
      if (item.subjectId !== undefined && item.yearId !== undefined) {
        // Compare subjectId from cart with subjectNameId from course
        // AND compare yearId to ensure it's the same year
        const match = item.subjectId === course.subjectNameId && item.yearId === course.yearId;

        // Only log if there's a match to reduce noise
        if (match) {
          this.logger.log('✅ Course is in cart:', {
            courseId: course.id,
            courseName: course.name || course.subjectName,
            courseYearId: course.yearId,
            courseSubjectNameId: course.subjectNameId,
            itemSubjectId: item.subjectId,
            itemYearId: item.yearId
          });
        }

        return match;
      }

      // Fallback to legacy structure (for backward compatibility)
      this.logger.log('⚠️ Using legacy matching (subjectId/yearId not available)');
      return this.coursesService.isInCart(courseId);
    });

    // this.logger.log('🎯 Final isInCart result:', inCart);
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
      // ✅ Get studentId - use normalized user from signal
      const user = this.currentUser();
      let studentId: number | undefined;

      // ✅ Extract roles array for checking
      const rolesArray = user?.roles || (Array.isArray(user?.role) ? user.role : (user?.role ? [user.role] : []));
      const isStudent = rolesArray.some((r: string) => r?.toLowerCase() === 'student');
      const isParent = rolesArray.some((r: string) => r?.toLowerCase() === 'parent');

      this.logger.log('🎯 onPlanSelected called:', {
        planId,
        courseName: course.name,
        userRole: user?.role,
        userRoles: rolesArray,
        isStudent,
        isParent,
        userStudentId: user?.studentId,
        userId: user?.id
      });

      if (isStudent) {
        // Direct student access - use token studentId OR user.id as fallback
        studentId = user.studentId || user.id;
        this.logger.log('✅ Student role - using studentId:', studentId, 'from:', user.studentId ? 'token.studentId' : 'user.id');
      } else if (isParent) {
        // Parent access - check if student selection is needed
        // ✅ IMPORTANT: Do NOT use previously selected student automatically
        // Always show modal if multiple students exist in same year
        const allParentStudents = this.parentStudents();

        if (allParentStudents.length === 0) {
          this.logger.log('❌ No students found for parent');
          this.toastService.showError('No students found. Please add a student first.');
          return;
        }

        // ✅ FIX: Convert course.yearId (DB id) to yearNumber for comparison
        // course.yearId is the ID from Years table (1, 2, 3...)
        // student.yearId is the yearNumber (7, 8, 9...)
        const courseYearId = course.yearId;
        const yearInfo = this.availableYears().find(y => y.id === courseYearId);
        const courseYearNumber = yearInfo?.yearNumber || courseYearId;

        const studentsInSameYear = allParentStudents.filter(s => s.yearId === courseYearNumber);

        this.logger.log('🔍 Course yearId (DB):', courseYearId);
        this.logger.log('🔍 Course yearNumber:', courseYearNumber);
        this.logger.log('👨‍👩‍👧‍👦 All students:', allParentStudents.map(s => ({ name: s.name, yearId: s.yearId })));
        this.logger.log('👨‍👩‍👧‍👦 Students in same year:', studentsInSameYear.length);

        if (studentsInSameYear.length === 0) {
          this.logger.log('❌ No students found for this year');
          this.toastService.showError('None of your children are enrolled in this year level.');
          return;
        } else if (studentsInSameYear.length === 1) {
          // ✅ Only one student in this year - auto-select
          studentId = studentsInSameYear[0].id;
          this.selectedStudentId.set(studentId || null);
          this.logger.log('✅ Auto-selected student:', studentsInSameYear[0].name, 'for Year', courseYearNumber);
          this.logger.log('🔍 Student details:', {
            studentId: studentId,
            studentObject: studentsInSameYear[0],
            allStudentsData: allParentStudents
          });
        } else {
          // ✅ Multiple students in same year - ALWAYS show selector (even if previously selected)
          this.logger.log('👨‍👩‍👧‍👦 Multiple students in Year', courseYearNumber, '- showing selector');
          this.showStudentSelectionModal(studentsInSameYear, planId, course);
          return;  // Exit early - will continue after selection
        }
      } else {
        // ❌ User is not Student or Parent - cannot add to cart
        this.logger.log('❌ Cannot add to cart - User role is not Student or Parent');
        this.logger.log('🔍 User details:', { user, rolesArray, isStudent, isParent });
        this.toastService.showError('Only students and parents can add items to cart');
        return;
      }

      // ✅ Final validation: studentId must exist
      if (!studentId) {
        this.logger.log('❌ Cannot add to cart - No student ID available');
        this.toastService.showError('Cannot add to cart without student information');
        return;
      }

      this.logger.log('🚀 Calling coursesService.onPlanSelected with:', {
        planId,
        courseId: course.id,
        studentId
      });

      this.coursesService.onPlanSelected(planId, course, studentId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((success: any) => {
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
        .subscribe((success: any) => {
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
        .subscribe((success: any) => {
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
    const user = this.currentUser();
    let studentId: number | undefined;

    // ✅ Handle both Student and Parent roles
    if (user?.role === 'Student' || (Array.isArray(user?.role) && user.role.includes('Student'))) {
      studentId = user.studentId || user.id;
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
    const user = this.currentUser();
    let studentId: number | undefined;
    let isParentBrowseMode = false;

    // ✅ Handle both Student and Parent roles
    if (user?.role === 'Student' || (Array.isArray(user?.role) && user.role.includes('Student'))) {
      // Direct student access
      studentId = user.studentId || user.id;
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

    this.logger.log('📚 Fetching term access status for student:', studentId, 'subject:', course.id);

    // ✅ Use getTermAccessStatus to get correct current term and access info
    this.coursesService.getTermAccessStatus(studentId, course.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (termAccess: any) => {
          console.log('🔍 RAW API Response from getTermAccessStatus:', termAccess);

          this.logger.log('✅ Term access info received:', {
            courseId: course.id,
            courseName: course.name || course.subjectName,
            currentTermNumber: termAccess.currentTermNumber,
            totalTerms: termAccess.terms?.length || 0,
            accessibleTerms: termAccess.terms?.filter((t: any) => t.hasAccess).map((t: any) => t.termNumber) || []
          });

          // ✅ Find first accessible term or use current term
          let accessibleTerm = termAccess.terms?.find((t: any) => t.hasAccess);

          // ⚠️ WORKAROUND: If no term has access but currentTermNumber is set,
          // assume student has access to current term (backend bug)
          if (!accessibleTerm && termAccess.currentTermNumber) {
            console.warn('⚠️ Backend bug: No accessible terms found, but currentTermNumber is set');
            console.log('🔧 Workaround: Assuming access to current term', termAccess.currentTermNumber);

            // Find current term and assume it has access
            accessibleTerm = termAccess.terms?.find((t: any) =>
              t.termNumber === termAccess.currentTermNumber || t.isCurrentTerm
            );

            if (accessibleTerm) {
              // Override hasAccess for workaround
              accessibleTerm = { ...accessibleTerm, hasAccess: true };
            }
          }

          const targetTermNumber = accessibleTerm?.termNumber || termAccess.currentTermNumber || 1;
          const hasAnyAccess = accessibleTerm?.hasAccess || (termAccess.currentTermNumber !== null);

          console.log('🎯 Navigation decision:', {
            targetTermNumber,
            hasAccess: hasAnyAccess,
            reason: accessibleTerm?.hasAccess ? 'Found accessible term' : 'Using current term (workaround)'
          });

          // ✅ Navigate to the term (accessible or current)
          this.router.navigate(['/lessons'], {
            queryParams: {
              subjectId: course.subjectNameId,
              subject: course.subject || course.subjectName,
              courseId: course.id,
              yearId: course.yearId,
              termNumber: targetTermNumber,
              weekNumber: 1,
              hasAccess: hasAnyAccess,
              studentId: studentId
            }
          });

          // ⚠️ Show info message only if really no access
          if (!hasAnyAccess) {
            console.warn('⚠️ No access to any term');
            setTimeout(() => {
              this.coursesService['toastService'].showInfo(
                '🔒 Subscribe to unlock lessons for this subject',
                5000
              );
            }, 500);
          }
        },
        error: (error: any) => {
          console.error('❌ Error fetching term access status:', error);

          // ✅ Still navigate to lessons even on error (with defaults)
          this.router.navigate(['/lessons'], {
            queryParams: {
              subjectId: course.subjectNameId,
              subject: course.subject || course.subjectName,
              courseId: course.id,
              yearId: course.yearId,
              termNumber: 1,  // Default to term 1 on error
              weekNumber: 1,
              hasAccess: false,
              studentId: studentId
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
    const currentUser = this.currentUser();

    // ✅ Only load subscriptions for actual students
    if (!this.isStudent()) {
      this.logger.log('ℹ️ User is not a student - skipping subscription load');
      return;
    }

    // ✅ Use studentId (must be integer, not GUID)
    const studentId = currentUser?.studentId;

    if (!studentId) {
      console.warn('⚠️ No student ID found in token - cart functionality will not work');
      console.warn('🔧 User needs to re-login to get updated token with studentId');
      return;
    }

    this.logger.log('📦 Loading subscriptions for student ID:', studentId);

    this.subscriptionService.loadSubscriptionsSummary(studentId)
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
