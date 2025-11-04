import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
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
    HierarchyNodeComponent,
    YearsTableComponent,
    CategoriesTableComponent,
    SubjectsTableComponent,
    LessonsTableComponent,
    ContentModalComponent,
    ResourceModalComponent,
    ResourceFormModalComponent,
    PreviewModalComponent,
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

  // ============================================
  // Statistics
  // ============================================
  stats = {
    years: 0,
    categories: 0,
    subjects: 0,
    terms: 0,
    weeks: 0,
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
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
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
        .filter((u: User) => u.roles && u.roles.some(r => r.toLowerCase() === 'teacher'))
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
      const subjects = await this.contentService.getSubjects().toPromise();
      this.subjects = Array.isArray(subjects) ? subjects : [];
    } catch (error) {
      console.error('Error loading subjects:', error);
      throw error;
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
      const result = await this.contentService.getLessons().toPromise();
      
      // Handle both array and paginated result
      if (Array.isArray(result)) {
        this.lessons = result;
      } else if (result && 'items' in result) {
        this.lessons = result.items as any[];
      } else {
        this.lessons = [];
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
      this.refreshAll();
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
      this.refreshAll();
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
      this.refreshAll();
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
      this.refreshAll();
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
      this.refreshAll();
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
    // Load filtered data from backend when filters change
    try {
      if (this.filters.yearId) {
        await this.loadSubjectsByYear(this.filters.yearId);
      }
      
      if (this.filters.categoryId) {
        await this.loadSubjectsByCategory(this.filters.categoryId);
      }
      
      if (this.filters.subjectId) {
        await this.loadTermsBySubject(this.filters.subjectId);
      }
      
      if (this.filters.termId) {
        await this.loadWeeksByTerm(this.filters.termId);
      }
      
      if (this.filters.weekId) {
        await this.loadLessonsByWeek(this.filters.weekId);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
    }
    
    this.resetPaging();
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
    this.updateStats();
  }

  applyFilters(): void {
    const q = (this.searchTerm || '').toLowerCase();

    // Filter Years
    this.filteredYears = this.years.filter(y =>
      !q || y.yearNumber.toString().includes(q)
    );

    // Filter Categories
    this.filteredCategories = this.categories.filter(c =>
      !q || c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );

    // Filter Subjects
    const subjectsArr = Array.isArray(this.subjects) ? this.subjects : [];
    this.filteredSubjects = subjectsArr.filter((s: Subject) => {
      const matchesSearch = !q || 
        s.subjectName?.toLowerCase().includes(q) ||
        s.categoryName?.toLowerCase().includes(q);
      
      const matchesYear = !this.filters.yearId || s.yearId === this.filters.yearId;
      const matchesCategory = !this.filters.categoryId || s.categoryId === this.filters.categoryId;
      
      return matchesSearch && matchesYear && matchesCategory;
    });

    // Filter Terms
    this.filteredTerms = this.terms.filter(t => {
      const matchesSearch = !q || t.termNumber.toString().includes(q);
      const matchesSubject = !this.filters.subjectId || t.subjectId === this.filters.subjectId;
      return matchesSearch && matchesSubject;
    });

    // Filter Weeks
    this.filteredWeeks = this.weeks.filter(w => {
      const matchesSearch = !q || w.weekNumber.toString().includes(q);
      const matchesTerm = !this.filters.termId || w.termId === this.filters.termId;
      return matchesSearch && matchesTerm;
    });

    // Filter Lessons
    this.filteredLessons = this.lessons.filter((l: any) => {
      const matchesSearch = !q || 
        l.title?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q);
      
      const matchesWeek = !this.filters.weekId || l.weekId === this.filters.weekId;
      const matchesTerm = !this.filters.termId || this.getTermIdFromWeekId(l.weekId) === this.filters.termId;
      const matchesSubject = !this.filters.subjectId || l.subjectId === this.filters.subjectId;
      
      return matchesSearch && matchesWeek && matchesTerm && matchesSubject;
    });
  }

  updatePaged(): void {
    this.pagedYears = this.slicePage(this.filteredYears, this.yearPage);
    this.pagedCategories = this.slicePage(this.filteredCategories, this.categoryPage);
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
    this.stats = {
      years: this.years.length,
      categories: this.categories.length,
      subjects: this.subjects.length,
      terms: this.terms.length,
      weeks: this.weeks.length,
      lessons: this.lessons.length,
    };
  }

  resetPaging(): void {
    this.yearPage = 1;
    this.categoryPage = 1;
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

  // ============================================
  // CRUD Operations
  // ============================================

  openAdd(type: EntityType): void {
    this.formMode = 'add';
    this.entityType = type;
    this.form = this.getEmptyForm(type);
    this.isFormOpen = true;
  }

  openEdit(type: EntityType, entity: any): void {
    this.formMode = 'edit';
    this.entityType = type;
    this.form = { ...entity };
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.form = {};
  }

  async submitForm(): Promise<void> {
    try {
      Swal.fire({
        title: 'Saving...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      if (this.formMode === 'add') {
        await this.createEntity(this.entityType, this.form);
      } else {
        await this.updateEntity(this.entityType, this.form);
      }

      await this.loadAllData();
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
        await this.contentService.addLesson(
          data.title,
          data.description,
          data.weekId,
          data.subjectId,
          data.posterFile,
          data.videoFile,
          data.duration,
          data.orderIndex
        ).toPromise();
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
        await this.contentService.updateSubject(
          data.id,
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
        await this.contentService.updateLesson(
          data.id,
          data.title,
          data.description,
          data.weekId,
          data.subjectId,
          data.posterFile,
          data.videoFile,
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

  async saveResource(): Promise<void> {
    // Implementation here
  }

  async deleteResource(resource: Resource): Promise<void> {
    // Implementation here
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
    // Implementation for hierarchy view
  }

  collapseAll(): void {
    // Implementation for hierarchy view
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
}
