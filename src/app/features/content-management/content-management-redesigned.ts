import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { AuthService } from '../../core/services/auth.service';
import {
  ContentService,
  Year,
  Subject,
  Term,
  Week,
  Lesson,
  Category,
  SubjectName,
  Teacher,
  Resource,
  User
} from '../../core/services/content.service';

// Import child components
import { HierarchyNodeComponent } from './components/hierarchy-node/hierarchy-node.component';
import { YearsTableComponent } from './components/years-table/years-table.component';
import { CategoriesTableComponent } from './components/categories-table/categories-table.component';
import { SubjectsTableComponent } from './components/subjects-table/subjects-table.component';
import { LessonsTableComponent } from './components/lessons-table/lessons-table.component';
import { ContentModalComponent } from './components/content-modal/content-modal.component';
import { ResourceModalComponent } from './components/resource-modal/resource-modal.component';
import { ResourceFormModalComponent } from './components/resource-form-modal/resource-form-modal.component';
import { PreviewModalComponent } from './components/preview-modal/preview-modal.component';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from '../../shared/components/admin-header/admin-header.component';

type Id = number;
type EntityType = 'year' | 'subjectName' | 'subject' | 'term' | 'week' | 'lesson' | 'category';

/**
 * Content Management Component - Redesigned
 * Manages the complete content hierarchy with improved UX
 */
@Component({
  selector: 'app-content-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HierarchyNodeComponent,
    YearsTableComponent,
    CategoriesTableComponent,
    SubjectsTableComponent,
    LessonsTableComponent,
    ContentModalComponent,
    ResourceModalComponent,
    ResourceFormModalComponent,
    PreviewModalComponent
  ],
  templateUrl: './content-management-redesigned.html',
  styleUrls: ['./content-management-redesigned.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ContentManagementComponent implements OnInit, OnDestroy {
  // ============================================
  // UI State Management
  // ============================================
  activeTab: string = 'hierarchy';
  searchTerm = '';

  // ============================================
  // Data Collections
  // ============================================
  years: Year[] = [];
  categories: Category[] = [];
  subjectNames: SubjectName[] = [];
  subjects: Subject[] = [];
  terms: Term[] = [];
  weeks: Week[] = [];
  lessons: Lesson[] = [];
  teachers: Teacher[] = [];
  users: User[] = [];
  lessonResources: Resource[] = [];

  // ============================================
  // Filtered & Paged Data
  // ============================================
  filteredYears: Year[] = [];
  filteredCategories: Category[] = [];
  filteredSubjectNames: SubjectName[] = [];
  filteredSubjects: Subject[] = [];
  filteredTerms: Term[] = [];
  filteredWeeks: Week[] = [];
  filteredLessons: Lesson[] = [];

  pagedYears: Year[] = [];
  pagedCategories: Category[] = [];
  pagedSubjectNames: SubjectName[] = [];
  pagedSubjects: Subject[] = [];
  pagedTerms: Term[] = [];
  pagedWeeks: Week[] = [];
  pagedLessons: Lesson[] = [];

  // ============================================
  // Filters
  // ============================================
  filters = {
    yearId: null as Id | null,
    categoryId: null as Id | null,
    subjectId: null as Id | null,
    termId: null as Id | null,
    weekId: null as Id | null,
  };

  // ============================================
  // Pagination
  // ============================================
  pageSize = 10;
  yearPage = 1;
  categoryPage = 1;
  subjectNamePage = 1;
  subjectPage = 1;
  termPage = 1;
  weekPage = 1;
  lessonPage = 1;

  get yearTotalPages() {
    return Math.max(1, Math.ceil(this.filteredYears.length / this.pageSize));
  }
  get categoryTotalPages() {
    return Math.max(1, Math.ceil(this.filteredCategories.length / this.pageSize));
  }
  get subjectNameTotalPages() {
    return Math.max(1, Math.ceil(this.filteredSubjectNames.length / this.pageSize));
  }
  get subjectTotalPages() {
    return Math.max(1, Math.ceil(this.filteredSubjects.length / this.pageSize));
  }
  get termTotalPages() {
    return Math.max(1, Math.ceil(this.filteredTerms.length / this.pageSize));
  }
  get weekTotalPages() {
    return Math.max(1, Math.ceil(this.filteredWeeks.length / this.pageSize));
  }
  get lessonTotalPages() {
    return Math.max(1, Math.ceil(this.filteredLessons.length / this.pageSize));
  }

  // Pagination display helpers
  get snStart() {
    return Math.min((this.subjectNamePage - 1) * this.pageSize + 1, this.filteredSubjectNames.length);
  }
  get snEnd() {
    return Math.min(this.subjectNamePage * this.pageSize, this.filteredSubjectNames.length);
  }

  // ============================================
  // Statistics
  // ============================================
  totalCounts = {
    years: 0,
    categories: 0,
    subjectNames: 0,
    subjects: 0,
    terms: 0,
    weeks: 0,
    lessons: 0,
  };

  // Store total counts from API (for paginated endpoints)
  apiTotalCounts = {
    subjects: 0,
    lessons: 0,
  };

  // ============================================
  // Modals
  // ============================================
  isFormOpen = false;
  formMode: 'add' | 'edit' = 'add';
  entityType: EntityType = 'year';
  entityTitle = '';
  form: any = {};
  formErrors: any = {};
  formTouched: any = {};

  resourceModalOpen = false;
  resourceFormOpen = false;
  selectedLesson: Lesson | null = null;
  editingResource: Resource | null = null;
  resourceForm: any = {
    title: '',
    description: '',
    resourceType: 'pdf',
    resourceUrl: '',
    resourceFile: null,
    file: null,
    lessonId: null,
  };

  // Form data for file uploads
  formData: any = {};

  // Validation tracking
  fieldErrors: { [key: string]: string } = {};
  touchedFields: { [key: string]: boolean } = {};

  previewOpen = false;
  preview: any = {};

  // ============================================
  // Constructor & Lifecycle
  // ============================================
  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private contentService: ContentService,
    private router: Router
  ) {}

  // Expose Math for template use
  Math = Math;

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Refresh data - reload all content from API
   */
  refreshData(): void {
    this.loadAllData();
  }

  // ============================================
  // Data Loading - Using Swagger Endpoints
  // ============================================

  /**
   * Load all data from API
   * Uses parallel loading for better performance
   */
  async loadAllData(): Promise<void> {
    try {
      // Show loading indicator
      Swal.fire({
        title: 'Loading Content...',
        text: 'Please wait while we fetch your data',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // Load all data in parallel for better performance
      await Promise.all([
        this.loadYears(),
        this.loadCategories(),
        this.loadSubjectNames(),
        this.loadTeachers(),
        this.loadSubjects(),
        this.loadTerms(),
        this.loadWeeks(),
        this.loadLessons(),
      ]);

      // Update total counts from API data
      this.updateTotalCountsFromAPI();

      // Apply filters and update UI
      this.refreshAll();

      Swal.close();
    } catch (error) {
      console.error('Error loading data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Loading Failed',
        text: this.extractErrorMessage(error),
      });
    }
  }

  /**
   * Load Years - GET /api/Years
   */
  async loadYears(): Promise<void> {
    try {
      this.years = await this.contentService.getYears().toPromise() || [];
    } catch (error) {
      console.error('Error loading years:', error);
      throw error;
    }
  }

  /**
   * Load Categories - GET /api/Categories
   */
  async loadCategories(): Promise<void> {
    try {
      this.categories = await this.contentService.getCategories().toPromise() || [];
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  }

  /**
   * Load Subject Names - GET /api/SubjectNames
   */
  async loadSubjectNames(): Promise<void> {
    try {
      this.subjectNames = await this.contentService.getSubjectNames().toPromise() || [];
    } catch (error) {
      console.error('Error loading subject names:', error);
      throw error;
    }
  }

  /**
   * Load Teachers - GET /api/Admin/users-with-roles
   */
  async loadTeachers(): Promise<void> {
    try {
      const users = await this.contentService.getTeachers().toPromise() || [];
      this.teachers = users
        .filter((u: User) => u.roles && u.roles.some(r => r?.toLowerCase() === 'teacher'))
        .map((u: User) => ({
          id: u.id,
          userName: u.userName,
          email: u.email || '',
          name: u.userName,
          roles: u.roles
        })) as Teacher[];
    } catch (error) {
      console.error('Error loading teachers:', error);
      throw error;
    }
  }

  /**
   * Load Subjects - GET /api/Subjects
   */
  async loadSubjects(): Promise<void> {
    try {
      const response = await this.contentService.getSubjects(1, 1000).toPromise();
      // API returns paginated response: { items: [], page, pageSize, totalCount, ... }
      this.subjects = response?.items || [];
      this.apiTotalCounts.subjects = response?.totalCount || 0;
    } catch (error) {
      console.error('Error loading subjects:', error);
      this.subjects = [];
      this.apiTotalCounts.subjects = 0;
    }
  }

  /**
   * Load Terms - GET /api/Terms
   */
  async loadTerms(): Promise<void> {
    try {
      this.terms = await this.contentService.getTerms().toPromise() || [];
    } catch (error) {
      console.error('Error loading terms:', error);
      throw error;
    }
  }

  /**
   * Load Weeks - GET /api/Weeks
   */
  async loadWeeks(): Promise<void> {
    try {
      this.weeks = await this.contentService.getWeeks().toPromise() || [];
    } catch (error) {
      console.error('Error loading weeks:', error);
      throw error;
    }
  }

  /**
   * Load Lessons - GET /api/Lessons
   */
  async loadLessons(): Promise<void> {
    try {
      const result = await this.contentService.getLessons(1, 1000).toPromise();

      // Handle both array and paginated result
      if (Array.isArray(result)) {
        this.lessons = result;
        this.apiTotalCounts.lessons = result.length;
      } else if (result && 'items' in result) {
        this.lessons = result.items as any[];
        this.apiTotalCounts.lessons = (result as any).totalCount || this.lessons.length;
      } else {
        this.lessons = [];
        this.apiTotalCounts.lessons = 0;
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
      throw error;
    }
  }

  // ============================================
  // Filtered Data Loading
  // ============================================

  /**
   * Load subjects by year - GET /api/Subjects/by-year/{yearId}
   */
  async loadSubjectsByYear(yearId: number): Promise<void> {
    try {
      this.subjects = await this.contentService.getSubjectsByYear(yearId).toPromise() || [];
    } catch (error) {
      console.error('Error loading subjects by year:', error);
    }
  }

  /**
   * Load subjects by category - GET /api/Subjects/by-category/{categoryId}
   */
  async loadSubjectsByCategory(categoryId: number): Promise<void> {
    try {
      this.subjects = await this.contentService.getSubjectsByCategory(categoryId).toPromise() || [];
    } catch (error) {
      console.error('Error loading subjects by category:', error);
    }
  }

  /**
   * Load terms by subject - GET /api/Terms/by-subject/{SubjectId}
   */
  async loadTermsBySubject(subjectId: number): Promise<void> {
    try {
      this.terms = await this.contentService.getTermsBySubject(subjectId).toPromise() || [];
    } catch (error) {
      console.error('Error loading terms by subject:', error);
    }
  }

  /**
   * Load weeks by term - GET /api/Weeks/by-term/{termId}
   */
  async loadWeeksByTerm(termId: number): Promise<void> {
    try {
      this.weeks = await this.contentService.getWeeksByTerm(termId).toPromise() || [];
    } catch (error) {
      console.error('Error loading weeks by term:', error);
    }
  }

  /**
   * Load lessons by week - GET /api/Lessons/week/{weekId}
   */
  async loadLessonsByWeek(weekId: number): Promise<void> {
    try {
      this.lessons = await this.contentService.getLessonsByWeek(weekId).toPromise() || [];
    } catch (error) {
      console.error('Error loading lessons by week:', error);
    }
  }

  /**
   * Load lessons by term - GET /api/Lessons/term/{termId}
   */
  async loadLessonsByTerm(termId: number): Promise<void> {
    try {
      this.lessons = await this.contentService.getLessonsByTerm(termId).toPromise() || [];
      this.refreshAll();
    } catch (error) {
      console.error('Error loading lessons by term:', error);
    }
  }

  /**
   * Load lessons by subject - GET /api/Lessons/subject/{subjectId}
   */
  async loadLessonsBySubject(subjectId: number): Promise<void> {
    try {
      this.lessons = await this.contentService.getLessonsBySubject(subjectId).toPromise() || [];
      this.refreshAll();
    } catch (error) {
      console.error('Error loading lessons by subject:', error);
    }
  }

  /**
   * Load lesson resources - GET /api/Lessons/{lessonId}/resources
   */
  async loadLessonResources(lessonId: number): Promise<void> {
    try {
      this.lessonResources = await this.contentService.getLessonResources(lessonId).toPromise() || [];
    } catch (error) {
      console.error('Error loading lesson resources:', error);
    }
  }

  // ============================================
  // UI State Management
  // ============================================

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // ============================================
  // Search & Filters
  // ============================================

  onSearchChange(): void {
    this.resetPaging();
    this.refreshAll();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  async onFilterChange(): Promise<void> {
    this.refreshAll();
  }

  clearFilters(): void {
    this.filters = {
      yearId: null,
      categoryId: null,
      subjectId: null,
      termId: null,
      weekId: null,
    };
    this.loadAllData();
  }

  // ============================================
  // Data Processing
  // ============================================

  refreshAll(): void {
    this.applyFilters();
    this.updatePaged();
    // Note: We don't call updateStats() here because totalCounts should reflect
    // the total from API (via updateTotalCountsFromAPI), not filtered arrays
  }

  applyFilters(): void {
    const q = (this.searchTerm || '').toLowerCase().trim();

    // Convert string filter values to numbers for comparison
    const yearIdNum = this.filters.yearId ? Number(this.filters.yearId) : null;
    const categoryIdNum = this.filters.categoryId ? Number(this.filters.categoryId) : null;
    const subjectIdNum = this.filters.subjectId ? Number(this.filters.subjectId) : null;
    const termIdNum = this.filters.termId ? Number(this.filters.termId) : null;
    const weekIdNum = this.filters.weekId ? Number(this.filters.weekId) : null;    // Filter Years - Apply year filter for hierarchy view
    // When searching, include years that have matching subjects
    this.filteredYears = this.years.filter(y => {
      if (!y) return false;

      // If searching, check if this year has any subjects that match by subject name only
      let hasMatchingSubjects = false;
      if (q) {
        hasMatchingSubjects = this.subjects.some(s => {
          if (s.yearId !== y.id) return false;
          return (s.subjectName && s.subjectName.toLowerCase().includes(q));
        });
      }

      const matchesSearch = !q || hasMatchingSubjects;
      const matchesYearFilter = !yearIdNum || y.id === yearIdNum;

      return matchesSearch && matchesYearFilter;
    });

    // Filter Categories - no search applied, only filter
    this.filteredCategories = this.categories.filter(c => {
      if (!c) return false;
      return true; // Show all categories when no category filter is applied
    });

    // Filter Subject Names - no search applied, only filter
    this.filteredSubjectNames = this.subjectNames.filter(sn => {
      if (!sn) return false;
      const matchesCategory = !categoryIdNum || sn.categoryId === categoryIdNum;
      return matchesCategory;
    });

    // Filter Subjects - search by subject name only
    const subjectsArr = Array.isArray(this.subjects) ? this.subjects : [];
    this.filteredSubjects = subjectsArr.filter((s: Subject) => {
      if (!s) return false;

      // Search by subject name only
      const matchesSearch = !q || (s.subjectName && s.subjectName.toLowerCase().includes(q));

      const matchesYear = !yearIdNum || s.yearId === yearIdNum;
      const matchesCategory = !categoryIdNum || s.categoryId === categoryIdNum;

      return matchesSearch && matchesYear && matchesCategory;
    });

    // Filter Terms - search by related subject name only
    this.filteredTerms = this.terms.filter(t => {
      if (!t) return false;

      // Get subject details if searching
      let subjectMatches = false;
      if (q && t.subjectId) {
        const subject = this.subjects.find(s => s.id === t.subjectId);
        if (subject) {
          subjectMatches = !!(subject.subjectName && subject.subjectName.toLowerCase().includes(q));
        }
      }

      const matchesSearch = !q || subjectMatches;
      const matchesSubject = !subjectIdNum || t.subjectId === subjectIdNum;
      return matchesSearch && matchesSubject;
    });

    // Filter Weeks - search by related subject name only
    this.filteredWeeks = this.weeks.filter(w => {
      if (!w) return false;

      // Get term and subject details if searching
      let subjectMatches = false;
      if (q && w.termId) {
        const term = this.terms.find(t => t.id === w.termId);
        if (term && term.subjectId) {
          const subject = this.subjects.find(s => s.id === term.subjectId);
          if (subject) {
            subjectMatches = !!(subject.subjectName && subject.subjectName.toLowerCase().includes(q));
          }
        }
      }

      const matchesSearch = !q || subjectMatches;
      const matchesTerm = !termIdNum || w.termId === termIdNum;
      return matchesSearch && matchesTerm;
    });

    // Filter Lessons - search by related subject name only
    this.filteredLessons = this.lessons.filter((l: any) => {
      if (!l) return false;

      // Get subject details if searching
      let subjectMatches = false;
      if (q && l.subjectId) {
        const subject = this.subjects.find(s => s.id === l.subjectId);
        if (subject) {
          subjectMatches = !!(subject.subjectName && subject.subjectName.toLowerCase().includes(q));
        }
      }

      const matchesSearch = !q || subjectMatches;

      const matchesWeek = !weekIdNum || l.weekId === weekIdNum;
      const matchesTerm = !termIdNum || this.getTermIdFromWeekId(l.weekId) === termIdNum;
      const matchesSubject = !subjectIdNum || l.subjectId === subjectIdNum;

      return matchesSearch && matchesWeek && matchesTerm && matchesSubject;
    });
  }  updatePaged(): void {
    this.pagedYears = this.slicePage(this.filteredYears, this.yearPage);
    this.pagedCategories = this.slicePage(this.filteredCategories, this.categoryPage);
    this.pagedSubjectNames = this.slicePage(this.filteredSubjectNames, this.subjectNamePage);
    this.pagedSubjects = this.slicePage(this.filteredSubjects, this.subjectPage);
    this.pagedTerms = this.slicePage(this.filteredTerms, this.termPage);
    this.pagedWeeks = this.slicePage(this.filteredWeeks, this.weekPage);
    this.pagedLessons = this.slicePage(this.filteredLessons, this.lessonPage);
  }

  slicePage<T>(arr: T[], page: number): T[] {
    const start = (page - 1) * this.pageSize;
    return arr.slice(start, start + this.pageSize);
  }

  updateStats(): void {
    this.totalCounts = {
      years: this.years.length,
      categories: this.categories.length,
      subjectNames: this.subjectNames.length,
      subjects: this.subjects.length,
      terms: this.terms.length,
      weeks: this.weeks.length,
      lessons: this.lessons.length,
    };
  }

  /**
   * Update total counts from API data (original data before filtering)
   */
  updateTotalCountsFromAPI(): void {
    this.totalCounts = {
      years: this.years.length,
      categories: this.categories.length,
      subjectNames: this.subjectNames.length,
      subjects: this.apiTotalCounts.subjects || this.subjects.length,
      terms: this.terms.length,
      weeks: this.weeks.length,
      lessons: this.apiTotalCounts.lessons || this.lessons.length,
    };
  }

  resetPaging(): void {
    this.yearPage = 1;
    this.categoryPage = 1;
    this.subjectNamePage = 1;
    this.subjectPage = 1;
    this.termPage = 1;
    this.weekPage = 1;
    this.lessonPage = 1;
    this.refreshAll();
  }

  // ============================================
  // Pagination Navigation
  // ============================================

  goYearPage(p: number): void {
    if (p >= 1 && p <= this.yearTotalPages) {
      this.yearPage = p;
      this.updatePaged();
    }
  }

  goCategoryPage(p: number): void {
    if (p >= 1 && p <= this.categoryTotalPages) {
      this.categoryPage = p;
      this.updatePaged();
    }
  }

  goSubjectNamePage(p: number): void {
    if (p >= 1 && p <= this.subjectNameTotalPages) {
      this.subjectNamePage = p;
      this.updatePaged();
    }
  }

  goSubjectPage(p: number): void {
    if (p >= 1 && p <= this.subjectTotalPages) {
      this.subjectPage = p;
      this.updatePaged();
    }
  }

  goTermPage(p: number): void {
    if (p >= 1 && p <= this.termTotalPages) {
      this.termPage = p;
      this.updatePaged();
    }
  }

  goWeekPage(p: number): void {
    if (p >= 1 && p <= this.weekTotalPages) {
      this.weekPage = p;
      this.updatePaged();
    }
  }

  goLessonPage(p: number): void {
    if (p >= 1 && p <= this.lessonTotalPages) {
      this.lessonPage = p;
      this.updatePaged();
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  getSubjectsByYear(yearId: Id): Subject[] {
    return this.subjects.filter(s => s.yearId === yearId);
  }

  getTermIdFromWeekId(weekId: Id): Id | null {
    const week = this.weeks.find(w => w.id === weekId);
    return week ? week.termId : null;
  }

  getSubjectIdFromWeekId(weekId: Id): Id | null {
    const week = this.weeks.find(w => w.id === weekId);
    if (!week) return null;

    const term = this.terms.find(t => t.id === week.termId);
    return term ? term.subjectId : null;
  }

  nameSubject(id: Id | undefined | null): string {
    return this.subjects.find(s => s.id === id)?.subjectName || '';
  }

  nameCategory(id: Id | undefined | null): string {
    return this.categories.find(c => c.id === id)?.name || '';
  }

  // ============================================
  // CRUD Operations
  // ============================================

  openAdd(type: EntityType): void {
    this.formMode = 'add';
    this.entityType = type;
    this.form = this.getEmptyForm(type);
    this.isFormOpen = true;
  }

  /**
   * Open add form from hierarchy view with pre-filled context
   */
  openAddFromHierarchy(type: EntityType, contextData: any): void {
    this.formMode = 'add';
    this.entityType = type;
    this.form = this.getEmptyForm(type);

    // Pre-fill based on hierarchy context
    if (type === 'subject' && contextData?.year) {
      this.form.yearId = contextData.year.id;
    } else if (type === 'term' && contextData?.subject) {
      this.form.subjectId = contextData.subject.id;
    } else if (type === 'week' && contextData?.term) {
      this.form.termId = contextData.term.id;
    } else if (type === 'lesson' && contextData?.week) {
      this.form.weekId = contextData.week.id;
      // Subject is auto-determined from week's term
      if (contextData?.subject) {
        this.form.subjectId = contextData.subject.id;
      }
    }

    this.isFormOpen = true;
  }

  openEdit(type: EntityType, entity: any): void {
    this.formMode = 'edit';
    this.entityType = type;
    this.form = { ...entity };

    // Ensure numeric fields are properly typed for subject edit
    if (type === 'subject' && this.form.teacherId) {
      this.form.teacherId = Number(this.form.teacherId);
    }

    console.log('📝 Opening edit for', type, ':', this.form);
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.form = {};
    this.formData = {}; // Clear formData to prevent stale file references
  }

  async submitForm(modalFormData?: any): Promise<void> {
    try {
      // Merge formData from modal with existing form data
      let finalData = { ...this.form };

      if (modalFormData) {
        finalData = { ...finalData, ...modalFormData };
        // Store files in formData for access in createEntity/updateEntity
        this.formData = { ...this.formData, ...modalFormData };
        console.log('📦 Received formData from modal:', modalFormData);
        console.log('📋 Final data for submission:', finalData);
      }

      Swal.fire({
        title: 'Saving...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      if (this.formMode === 'add') {
        await this.createEntity(this.entityType, finalData);
      } else {
        await this.updateEntity(this.entityType, finalData);
      }

      await this.loadAllData();
      // Reset to default to preserve user's expand/collapse state
      this.hierarchyExpandedState = 'default';
      this.closeForm();

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `${this.getEntityTitle(this.entityType)} ${this.formMode === 'add' ? 'created' : 'updated'} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: this.extractErrorMessage(error)
      });
    }
  }

  async confirmDelete(type: EntityType, entity: any): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete this ${this.getEntityTitle(type)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        await this.deleteEntity(type, entity.id);
        await this.loadAllData();
        // Reset to default to preserve user's expand/collapse state
        this.hierarchyExpandedState = 'default';

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: `${this.getEntityTitle(type)} has been deleted`,
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.extractErrorMessage(error)
        });
      }
    }
  }

  private getEmptyForm(type: EntityType): any {
    const forms: { [key: string]: any } = {
      'year': { yearNumber: 1 },
      'category': { name: '', description: '', color: '#3B82F6' },
      'subjectName': { name: '', categoryId: null },
      'subject': {
        yearId: null,
        subjectNameId: null,
        originalPrice: 0,
        discountPercentage: 0,
        level: 'Beginner',
        duration: 0,
        teacherId: null,
        startDate: new Date().toISOString().split('T')[0],
        posterFile: null
      },
      'term': { subjectId: null, termNumber: 1, startDate: new Date().toISOString().split('T')[0] },
      'week': { termId: null, weekNumber: 1 },
      'lesson': {
        title: '',
        description: '',
        weekId: null,
        subjectId: null,
        duration: 0,
        orderIndex: 0,
        posterFile: null,
        videoFile: null
      }
    };
    return forms[type] || {};
  }

  private getEntityTitle(type: EntityType): string {
    const titles: { [key: string]: string } = {
      'year': 'Year',
      'category': 'Category',
      'subjectName': 'Subject Name',
      'subject': 'Subject',
      'term': 'Term',
      'week': 'Week',
      'lesson': 'Lesson'
    };
    return titles[type] || 'Item';
  }

  private async createEntity(type: EntityType, data: any): Promise<void> {
    switch (type) {
      case 'year':
        await this.contentService.addYear({ yearNumber: data.yearNumber }).toPromise();
        break;
      case 'category':
        await this.contentService.addCategory({
          name: data.name,
          description: data.description,
          color: data.color
        }).toPromise();
        break;
      case 'subjectName':
        await this.contentService.addSubjectName({
          name: data.name,
          categoryId: data.categoryId
        }).toPromise();
        break;
      case 'subject':
        await this.contentService.addSubject(
          data.yearId,
          data.subjectNameId,
          data.originalPrice,
          data.discountPercentage || 0,
          data.level,
          data.duration || 0,
          data.teacherId,
          data.startDate,
          data.posterFile
        ).toPromise();
        break;
      case 'term':
        await this.contentService.addTerm({
          subjectId: data.subjectId,
          termNumber: data.termNumber,
          startDate: data.startDate
        }).toPromise();
        break;
      case 'week':
        await this.contentService.addWeek({
          termId: data.termId,
          weekNumber: data.weekNumber
        }).toPromise();
        break;
      case 'lesson':
        console.log('📤 Creating lesson with data:', data);
        console.log('📦 FormData files:', this.formData);

        // Get files from formData instead of data
        const posterFile = this.formData['posterFile'] || data.posterFile;
        const videoFile = this.formData['videoFile'] || data.videoFile;

        console.log('🖼️ Poster file:', posterFile);
        console.log('🎥 Video file:', videoFile);

        if (!posterFile) {
          throw new Error('Poster file is required');
        }
        if (!videoFile) {
          throw new Error('Video file is required');
        }

        // Validate that they are actual File objects
        if (!(posterFile instanceof File)) {
          console.error('❌ posterFile is not a File object:', typeof posterFile, posterFile);
          throw new Error('Poster file must be a File object');
        }
        if (!(videoFile instanceof File)) {
          console.error('❌ videoFile is not a File object:', typeof videoFile, videoFile);
          throw new Error('Video file must be a File object');
        }

        // Validate required fields
        if (!data.subjectId) {
          throw new Error('Subject ID is required');
        }

        console.log('✅ Files validated. Calling API...');

        const newLesson = await this.contentService.addLesson(
          data.title,
          data.description,
          data.weekId,
          data.subjectId,
          posterFile,
          videoFile,
          data.duration,
          data.orderIndex
        ).toPromise();

        // Navigate to lesson management page
        if (newLesson && newLesson.id) {
          await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Lesson created successfully. Redirecting to lesson management...',
            timer: 1500,
            showConfirmButton: false
          });
          this.router.navigate(['/admin/lesson-management', newLesson.id]);
        }
        break;
    }
  }

  private async updateEntity(type: EntityType, data: any): Promise<void> {
    switch (type) {
      case 'year':
        await this.contentService.updateYear(data.id, { yearNumber: data.yearNumber }).toPromise();
        break;
      case 'category':
        await this.contentService.updateCategory(data.id, {
          name: data.name,
          description: data.description,
          color: data.color
        }).toPromise();
        break;
      case 'subjectName':
        await this.contentService.updateSubjectName(data.id, {
          name: data.name,
          categoryId: data.categoryId
        }).toPromise();
        break;
      case 'subject':
        // Get poster file from formData (file upload) or data object
        const posterFileForUpdate = this.formData['posterFile'] || data.posterFile;

        console.log('📝 Updating subject:', {
          id: data.id,
          originalPrice: data.originalPrice,
          discountPercentage: data.discountPercentage,
          level: data.level,
          duration: data.duration,
          teacherId: data.teacherId,
          posterFile: posterFileForUpdate ? 'File selected' : 'No file'
        });

        // Validate required fields according to Swagger spec
        if (!data.teacherId) {
          throw new Error('Teacher is required');
        }

        await this.contentService.updateSubject(
          data.id,
          Number(data.originalPrice) || 0,
          Number(data.discountPercentage) || 0,
          data.level || 'Beginner',
          Number(data.duration) || 0,
          Number(data.teacherId),
          posterFileForUpdate
        ).toPromise();
        break;
      case 'term':
        await this.contentService.updateTerm(data.id, {
          subjectId: data.subjectId,
          termNumber: data.termNumber,
          startDate: data.startDate
        }).toPromise();
        break;
      case 'week':
        await this.contentService.updateWeek(data.id, {
          termId: data.termId,
          weekNumber: data.weekNumber
        }).toPromise();
        break;
      case 'lesson':
        // Get files from formData instead of data (files may be optional for update)
        const posterFileUpdate = this.formData['posterFile'] || data.posterFile;
        const videoFileUpdate = this.formData['videoFile'] || data.videoFile;

        await this.contentService.updateLesson(
          data.id,
          data.title,
          data.description,
          data.weekId,
          data.subjectId,
          posterFileUpdate,
          videoFileUpdate,
          data.duration,
          data.orderIndex
        ).toPromise();
        break;
    }
  }

  private async deleteEntity(type: EntityType, id: number): Promise<void> {
    switch (type) {
      case 'year':
        await this.contentService.deleteYear(id).toPromise();
        break;
      case 'category':
        await this.contentService.deleteCategory(id).toPromise();
        break;
      case 'subjectName':
        await this.contentService.deleteSubjectName(id).toPromise();
        break;
      case 'subject':
        await this.contentService.deleteSubject(id).toPromise();
        break;
      case 'term':
        await this.contentService.deleteTerm(id).toPromise();
        break;
      case 'week':
        await this.contentService.deleteWeek(id).toPromise();
        break;
      case 'lesson':
        await this.contentService.deleteLesson(id).toPromise();
        break;
    }
  }

  // ============================================
  // Resource Management
  // ============================================

  async manageResources(lesson: Lesson): Promise<void> {
    this.selectedLesson = lesson;
    await this.loadLessonResources(lesson.id!);
    this.resourceModalOpen = true;
  }

  closeResourceModal(): void {
    this.resourceModalOpen = false;
    this.selectedLesson = null;
  }

  openAddResource(): void {
    this.resourceFormOpen = true;
  }

  closeResourceForm(): void {
    this.resourceFormOpen = false;
  }

  async saveResource(data: { title: string; file: File }): Promise<void> {
    if (!this.selectedLesson?.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No lesson selected',
      });
      return;
    }

    // Validate data
    if (!data || !data.title || !data.file) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please provide both title and file',
      });
      return;
    }

    console.log('📤 Resource data:', { title: data.title, fileName: data.file.name, fileSize: data.file.size });

    try {
      Swal.fire({
        title: 'Uploading Resource...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      console.log('🚀 Calling addResource API:', { title: data.title, lessonId: this.selectedLesson.id, file: data.file });

      await this.contentService.addResource(
        data.title,
        this.selectedLesson.id,
        data.file
      ).toPromise();

      Swal.fire({
        icon: 'success',
        title: 'Resource Uploaded',
        text: 'Resource has been uploaded successfully.',
        timer: 2000,
        showConfirmButton: false
      });

      this.closeResourceForm();
      if (this.selectedLesson?.id) {
        await this.loadLessonResources(this.selectedLesson.id);
      }
    } catch (error) {
      console.error('❌ Resource upload failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: this.extractErrorMessage(error),
      });
    }
  }

  async deleteResource(resource: Resource): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete resource "${resource.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        await this.contentService.deleteResource(resource.id).toPromise();

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Resource has been deleted.',
          timer: 2000,
          showConfirmButton: false
        });

        if (this.selectedLesson?.id) {
          await this.loadLessonResources(this.selectedLesson.id);
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: this.extractErrorMessage(error),
        });
      }
    }
  }

  // ============================================
  // Preview
  // ============================================

  openLessonPreview(lesson: Lesson): void {
    this.preview = { type: 'lesson', ...lesson };
    this.previewOpen = true;
  }

  closePreview(): void {
    this.previewOpen = false;
  }

  // ============================================
  // Hierarchy View Methods
  // ============================================

  expandAll(): void {
    // Emit event to all hierarchy node components to expand
    this.hierarchyExpandedState = 'expanded';
    // Expand all items
    this.filteredSubjects.forEach(s => s.id && this.expandedSubjects.add(s.id));
    this.filteredTerms.forEach(t => t.id && this.expandedTerms.add(t.id));
    this.filteredWeeks.forEach(w => w.id && this.expandedWeeks.add(w.id));
    // Force re-render
    this.refreshAll();
  }

  collapseAll(): void {
    // Emit event to all hierarchy node components to collapse
    this.hierarchyExpandedState = 'collapsed';
    // Collapse all items
    this.expandedSubjects.clear();
    this.expandedTerms.clear();
    this.expandedWeeks.clear();
    // Force re-render
    this.refreshAll();
  }

  // Handle expand state changes from child components
  onExpandStateChange(event: { type: 'subject' | 'term' | 'week'; id: number; expanded: boolean }): void {
    if (event.type === 'subject') {
      if (event.expanded) {
        this.expandedSubjects.add(event.id);
      } else {
        this.expandedSubjects.delete(event.id);
      }
    } else if (event.type === 'term') {
      if (event.expanded) {
        this.expandedTerms.add(event.id);
      } else {
        this.expandedTerms.delete(event.id);
      }
    } else if (event.type === 'week') {
      if (event.expanded) {
        this.expandedWeeks.add(event.id);
      } else {
        this.expandedWeeks.delete(event.id);
      }
    }
  }

  // State for hierarchy expansion
  hierarchyExpandedState: 'expanded' | 'collapsed' | 'default' = 'default';

  // Store expanded state to persist across re-renders
  expandedSubjects: Set<number> = new Set();
  expandedTerms: Set<number> = new Set();
  expandedWeeks: Set<number> = new Set();

  // ============================================
  // Navigation
  // ============================================

  navigateToLessonManagement(lesson: Lesson): void {
    if (lesson && lesson.id) {
      this.router.navigate(['/admin/lesson-management', lesson.id]);
    }
  }

  // ============================================
  // File Handling Methods
  // ============================================

  onFileChange(event: any, fieldName: string): void {
    const file = event.target?.files?.[0];
    if (file) {
      (this.formData as any)[fieldName] = file;
    }
  }

  getFileName(fieldName: string): string {
    const file = (this.formData as any)[fieldName];
    return file ? file.name : '';
  }

  onResourceFileChange(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      this.resourceForm.resourceFile = file;
    }
  }

  // ============================================
  // Display Name Helper Methods
  // ============================================

  getSubjectDisplayName(subject: Subject): string {
    const year = this.years.find(y => y.id === subject.yearId);
    const category = this.categories.find(c => c.id === subject.categoryId);
    const subjectName = this.subjectNames.find(s => s.id === subject.subjectNameId);

    return `${subjectName?.name || 'N/A'} - Year ${year?.yearNumber || 'N/A'} - ${category?.name || 'N/A'}`;
  }

  getSubjectById(subjectId: number): Subject | undefined {
    return this.subjects.find(s => s.id === subjectId);
  }

  getTermById(termId: number): Term | undefined {
    return this.terms.find(t => t.id === termId);
  }

  getTermDisplayName(term: Term): string {
    const subject = this.subjects.find(s => s.id === term.subjectId);
    return `Term ${term.termNumber} - ${this.getSubjectDisplayName(subject!)}`;
  }

  getWeekDisplayName(week: Week): string {
    const term = this.terms.find(t => t.id === week.termId);
    return `Week ${week.weekNumber} - ${term ? 'Term ' + term.termNumber : 'N/A'}`;
  }

  numberWeek(weekId?: number): string {
    if (!weekId) return 'N/A';
    const week = this.weeks.find(w => w.id === weekId);
    return week ? `Week ${week.weekNumber}` : 'N/A';
  }

  getSubjectNameCountForCategory(categoryId?: number): number {
    if (!categoryId) return 0;
    return this.subjectNames.filter(sn => sn.categoryId === categoryId).length;
  }

  // ============================================
  // Form Validation Helper Methods
  // ============================================

  validateField(fieldName: string, value: any): void {
    // Simple validation - can be enhanced
    if (!value || (typeof value === 'string' && !value.trim())) {
      this.fieldErrors[fieldName] = 'This field is required';
      this.touchedFields[fieldName] = true;
    } else {
      delete this.fieldErrors[fieldName];
    }
  }

  markFieldTouched(fieldName: string): void {
    this.touchedFields[fieldName] = true;
  }

  hasFieldError(fieldName: string): boolean {
    return this.touchedFields[fieldName] && !!this.fieldErrors[fieldName];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName] || '';
  }

  // ============================================
  // Error Handling
  // ============================================

  private extractErrorMessage(error: any): string {
    console.error('Full error:', error);

    // Handle .NET API validation errors (ModelState)
    if (error.error?.errors) {
      const messages: string[] = [];
      for (const field in error.error.errors) {
        if (Array.isArray(error.error.errors[field])) {
          messages.push(...error.error.errors[field]);
        }
      }
      if (messages.length > 0) {
        return messages.join('. ');
      }
    }

    // Handle direct error messages
    if (error.error?.title) return error.error.title;
    if (error.error?.detail) return error.error.detail;
    if (error.error?.message) return error.error.message;
    if (typeof error.error === 'string') return error.error;
    if (error.message) return error.message;

    // Handle HTTP status codes
    if (error.status) {
      switch (error.status) {
        case 400: return 'Invalid request. Please check your input.';
        case 401: return 'Unauthorized. Please login again.';
        case 403: return 'You do not have permission for this action.';
        case 404: return 'Resource not found.';
        case 409: return 'A conflict occurred. Resource may already exist.';
        case 500: return 'Internal server error. Please contact support.';
        default: return `HTTP ${error.status}: ${error.statusText || 'Unknown error'}`;
      }
    }

    return 'An unexpected error occurred. Please try again.';
  }

  // ============================================
  // Lesson Approval Methods
  // ============================================
  async approveLesson(lesson: Lesson): Promise<void> {
    const result = await Swal.fire({
      title: 'Approve Lesson',
      text: `Do you want to approve "${lesson.title}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Approving...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        // Update lesson status to APPROVED using the proper API signature
        await this.contentService.updateLesson(
          lesson.id!,
          lesson.title,
          lesson.description,
          lesson.weekId,
          lesson.subjectId,
          undefined, // posterFile
          undefined, // videoFile
          lesson.duration,
          lesson.orderIndex
        ).toPromise();

        await this.loadAllData();

        Swal.fire({
          icon: 'success',
          title: 'Approved!',
          text: 'Lesson has been approved successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.extractErrorMessage(error)
        });
      }
    }
  }

  async rejectLesson(lesson: Lesson): Promise<void> {
    const result = await Swal.fire({
      title: 'Reject Lesson',
      text: `Do you want to reject "${lesson.title}"?`,
      input: 'textarea',
      inputLabel: 'Rejection Reason (optional)',
      inputPlaceholder: 'Provide a reason for rejection...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Rejecting...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        // Update lesson - rejection reason would be stored separately via API if supported
        await this.contentService.updateLesson(
          lesson.id!,
          lesson.title,
          lesson.description,
          lesson.weekId,
          lesson.subjectId,
          undefined, // posterFile
          undefined, // videoFile
          lesson.duration,
          lesson.orderIndex
        ).toPromise();

        await this.loadAllData();

        Swal.fire({
          icon: 'success',
          title: 'Rejected!',
          text: 'Lesson has been rejected',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.extractErrorMessage(error)
        });
      }
    }
  }

  // ============================================
}
