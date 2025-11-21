import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { AuthService } from '../../../core/services/auth.service';
import {
  ContentService,
  Year,
  Subject,
  Term,
  Week,
  Lesson,
  Category,
  SubjectName,
  Resource,
} from '../../../core/services/content.service';

import {
  TeacherContentManagementService,
  TeacherSubject,
  ContentItem,
} from '../services/teacher-content-management.service';

// Import child components
import { HierarchyNodeComponent } from '../../content-management/components/hierarchy-node/hierarchy-node.component';
import { YearsTableComponent } from '../../content-management/components/years-table/years-table.component';
import { CategoriesTableComponent } from '../../content-management/components/categories-table/categories-table.component';
import { SubjectsTableComponent } from '../../content-management/components/subjects-table/subjects-table.component';
import { LessonsTableComponent } from '../../content-management/components/lessons-table/lessons-table.component';
import { ContentModalComponent } from '../../content-management/components/content-modal/content-modal.component';
import { ResourceModalComponent } from '../../content-management/components/resource-modal/resource-modal.component';
import { ResourceFormModalComponent } from '../../content-management/components/resource-form-modal/resource-form-modal.component';
import { PreviewModalComponent } from '../../content-management/components/preview-modal/preview-modal.component';
import { TeacherSidebarComponent } from '../../../shared/components/teacher-sidebar/teacher-sidebar.component';

type Id = number;
type EntityType = 'year' | 'subjectName' | 'subject' | 'term' | 'week' | 'lesson' | 'category';

/**
 * Teacher Content Management Component - Redesigned
 * Teacher version of Content Management with same design as Admin
 * Teachers can only create/edit content they have permissions for
 * Admin approval is required for all content changes
 */
@Component({
  selector: 'app-teacher-content-management-redesigned',
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
    TeacherSidebarComponent,
  ],
  templateUrl: './teacher-content-management-redesigned.html',
  styleUrls: ['./teacher-content-management-redesigned.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TeacherContentManagementRedesignedComponent implements OnInit, OnDestroy {
  // ============================================
  // UI State Management
  // ============================================
  activeTab: string = 'hierarchy';
  searchTerm = '';
  sidebarCollapsed = false;

  // ============================================
  // Teacher-specific Data
  // ============================================
  authorizedSubjects: TeacherSubject[] = [];
  myContent: ContentItem[] = [];
  teacherId: string = '';

  // ============================================
  // Data Collections (Read-only for teacher)
  // ============================================
  years: Year[] = [];
  categories: Category[] = [];
  subjectNames: SubjectName[] = [];
  subjects: Subject[] = [];
  terms: Term[] = [];
  weeks: Week[] = [];
  lessons: Lesson[] = [];
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
    myLessons: 0,
    pendingApproval: 0,
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
  entityType: EntityType = 'lesson';
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

  hierarchyExpandedState: 'expanded' | 'collapsed' | 'default' = 'default';

  // ============================================
  // Constructor & Lifecycle
  // ============================================
  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private contentService: ContentService,
    private teacherContentService: TeacherContentManagementService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    this.teacherId = userId ? userId.toString() : '';
    this.loadAllData();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  // ============================================
  // Data Loading
  // ============================================

  /**
   * Load all data from API
   * Teachers can view all content but only edit what they have permissions for
   */
  async loadAllData(): Promise<void> {
    try {
      Swal.fire({
        title: 'Loading Content...',
        text: 'Please wait while we fetch your data',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // Load teacher-specific data and general content in parallel
      await Promise.all([
        this.loadAuthorizedSubjects(),
        this.loadMyContent(),
        this.loadYears(),
        this.loadCategories(),
        this.loadSubjectNames(),
        this.loadSubjects(),
        this.loadTerms(),
        this.loadWeeks(),
        this.loadLessons(),
      ]);

      this.updateTotalCountsFromAPI();
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
   * Load teacher's authorized subjects
   */
  async loadAuthorizedSubjects(): Promise<void> {
    try {
      this.authorizedSubjects = await this.teacherContentService.getMySubjects().toPromise() || [];
    } catch (error) {
      console.error('Error loading authorized subjects:', error);
      this.authorizedSubjects = [];
    }
  }

  /**
   * Load teacher's content
   */
  async loadMyContent(): Promise<void> {
    try {
      this.myContent = await this.teacherContentService.getMyContent().toPromise() || [];
      this.totalCounts.myLessons = this.myContent.filter(c => c.itemType === 'Lesson').length;
      this.totalCounts.pendingApproval = this.myContent.filter(c => c.status === 'PENDING' || c.status === 'SUBMITTED').length;
    } catch (error) {
      console.error('Error loading my content:', error);
      this.myContent = [];
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
   * Load Subjects - GET /api/Subjects
   */
  async loadSubjects(): Promise<void> {
    try {
      const response = await this.contentService.getSubjects(1, 1000).toPromise();
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
  // Update Counts from API Data
  // ============================================
  updateTotalCountsFromAPI(): void {
    this.totalCounts.years = this.years.length;
    this.totalCounts.categories = this.categories.length;
    this.totalCounts.subjectNames = this.subjectNames.length;
    this.totalCounts.subjects = this.apiTotalCounts.subjects || this.subjects.length;
    this.totalCounts.terms = this.terms.length;
    this.totalCounts.weeks = this.weeks.length;
    this.totalCounts.lessons = this.apiTotalCounts.lessons || this.lessons.length;
  }

  // ============================================
  // UI State Management
  // ============================================

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
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
  }

  applyFilters(): void {
    const q = (this.searchTerm || '').toLowerCase();

    const yearIdNum = this.filters.yearId ? Number(this.filters.yearId) : null;
    const categoryIdNum = this.filters.categoryId ? Number(this.filters.categoryId) : null;
    const subjectIdNum = this.filters.subjectId ? Number(this.filters.subjectId) : null;
    const termIdNum = this.filters.termId ? Number(this.filters.termId) : null;
    const weekIdNum = this.filters.weekId ? Number(this.filters.weekId) : null;

    // Get authorized subject IDs for the teacher
    const authorizedSubjectIds = this.authorizedSubjects.map(s => s.subjectId);

    // Filter Years - only years that have authorized subjects
    const authorizedYearIds = new Set(this.subjects
      .filter(s => authorizedSubjectIds.includes(s.id || 0))
      .map(s => s.yearId));
    
    this.filteredYears = this.years.filter(y => {
      const matchesSearch = !q || y.yearNumber.toString().includes(q);
      const matchesYearFilter = !yearIdNum || y.id === yearIdNum;
      const isAuthorized = authorizedYearIds.has(y.id);
      return matchesSearch && matchesYearFilter && isAuthorized;
    });

    // Filter Categories - only categories that have authorized subjects
    const authorizedCategoryIds = new Set(this.subjects
      .filter(s => authorizedSubjectIds.includes(s.id || 0))
      .map(s => s.categoryId));
    
    this.filteredCategories = this.categories.filter(c => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
      const isAuthorized = authorizedCategoryIds.has(c.id);
      return matchesSearch && isAuthorized;
    });

    // Filter Subject Names - only subject names that have authorized subjects
    const authorizedSubjectNameIds = new Set(this.subjects
      .filter(s => authorizedSubjectIds.includes(s.id || 0))
      .map(s => s.subjectNameId));
    
    this.filteredSubjectNames = this.subjectNames.filter(sn => {
      const matchesSearch = !q || sn.name?.toLowerCase().includes(q);
      const matchesCategory = !categoryIdNum || sn.categoryId === categoryIdNum;
      const isAuthorized = authorizedSubjectNameIds.has(sn.id);
      return matchesSearch && matchesCategory && isAuthorized;
    });

    // Filter Subjects - ONLY authorized subjects
    const subjectsArr = Array.isArray(this.subjects) ? this.subjects : [];
    this.filteredSubjects = subjectsArr.filter((s: Subject) => {
      const matchesSearch = !q ||
        s.subjectName?.toLowerCase().includes(q) ||
        s.categoryName?.toLowerCase().includes(q);

      const matchesYear = !yearIdNum || s.yearId === yearIdNum;
      const matchesCategory = !categoryIdNum || s.categoryId === categoryIdNum;
      const isAuthorized = authorizedSubjectIds.includes(s.id || 0);

      return matchesSearch && matchesYear && matchesCategory && isAuthorized;
    });

    // Filter Terms - only terms for authorized subjects
    this.filteredTerms = this.terms.filter(t => {
      const matchesSearch = !q || t.termNumber.toString().includes(q);
      const matchesSubject = !subjectIdNum || t.subjectId === subjectIdNum;
      const isAuthorized = authorizedSubjectIds.includes(t.subjectId || 0);
      return matchesSearch && matchesSubject && isAuthorized;
    });

    // Filter Weeks - only weeks for authorized subjects' terms
    const authorizedTermIds = new Set(this.terms
      .filter(t => authorizedSubjectIds.includes(t.subjectId || 0))
      .map(t => t.id));
    
    this.filteredWeeks = this.weeks.filter(w => {
      const matchesSearch = !q || w.weekNumber.toString().includes(q);
      const matchesTerm = !termIdNum || w.termId === termIdNum;
      const isAuthorized = authorizedTermIds.has(w.termId || 0);
      return matchesSearch && matchesTerm && isAuthorized;
    });

    // Filter Lessons - only lessons for authorized subjects
    this.filteredLessons = this.lessons.filter((l: any) => {
      const matchesSearch = !q ||
        l.title?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q);

      const matchesWeek = !weekIdNum || l.weekId === weekIdNum;
      const matchesTerm = !termIdNum || l.termId === termIdNum;
      const matchesSubject = !subjectIdNum || l.subjectId === subjectIdNum;
      const isAuthorized = authorizedSubjectIds.includes(l.subjectId || 0);

      return matchesSearch && matchesWeek && matchesTerm && matchesSubject && isAuthorized;
    });
  }

  updatePaged(): void {
    this.pagedYears = this.getPagedData(this.filteredYears, this.yearPage);
    this.pagedCategories = this.getPagedData(this.filteredCategories, this.categoryPage);
    this.pagedSubjectNames = this.getPagedData(this.filteredSubjectNames, this.subjectNamePage);
    this.pagedSubjects = this.getPagedData(this.filteredSubjects, this.subjectPage);
    this.pagedTerms = this.getPagedData(this.filteredTerms, this.termPage);
    this.pagedWeeks = this.getPagedData(this.filteredWeeks, this.weekPage);
    this.pagedLessons = this.getPagedData(this.filteredLessons, this.lessonPage);
  }

  getPagedData<T>(data: T[], page: number): T[] {
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return data.slice(start, end);
  }

  resetPaging(): void {
    this.yearPage = 1;
    this.categoryPage = 1;
    this.subjectNamePage = 1;
    this.subjectPage = 1;
    this.termPage = 1;
    this.weekPage = 1;
    this.lessonPage = 1;
  }

  // ============================================
  // Pagination Methods
  // ============================================

  nextPage(type: string): void {
    switch (type) {
      case 'year':
        if (this.yearPage < this.yearTotalPages) this.yearPage++;
        break;
      case 'category':
        if (this.categoryPage < this.categoryTotalPages) this.categoryPage++;
        break;
      case 'subjectName':
        if (this.subjectNamePage < this.subjectNameTotalPages) this.subjectNamePage++;
        break;
      case 'subject':
        if (this.subjectPage < this.subjectTotalPages) this.subjectPage++;
        break;
      case 'term':
        if (this.termPage < this.termTotalPages) this.termPage++;
        break;
      case 'week':
        if (this.weekPage < this.weekTotalPages) this.weekPage++;
        break;
      case 'lesson':
        if (this.lessonPage < this.lessonTotalPages) this.lessonPage++;
        break;
    }
    this.updatePaged();
  }

  prevPage(type: string): void {
    switch (type) {
      case 'year':
        if (this.yearPage > 1) this.yearPage--;
        break;
      case 'category':
        if (this.categoryPage > 1) this.categoryPage--;
        break;
      case 'subjectName':
        if (this.subjectNamePage > 1) this.subjectNamePage--;
        break;
      case 'subject':
        if (this.subjectPage > 1) this.subjectPage--;
        break;
      case 'term':
        if (this.termPage > 1) this.termPage--;
        break;
      case 'week':
        if (this.weekPage > 1) this.weekPage--;
        break;
      case 'lesson':
        if (this.lessonPage > 1) this.lessonPage--;
        break;
    }
    this.updatePaged();
  }

  // ============================================
  // Permission Checks
  // ============================================

  /**
   * Check if teacher can create content for a subject
   */
  canCreateForSubject(subjectId: number): boolean {
    const subject = this.authorizedSubjects.find(s => s.subjectId === subjectId);
    return subject?.canCreate || false;
  }

  /**
   * Check if teacher can edit content for a subject
   */
  canEditForSubject(subjectId: number): boolean {
    const subject = this.authorizedSubjects.find(s => s.subjectId === subjectId);
    return subject?.canEdit || false;
  }

  /**
   * Check if teacher can delete content for a subject
   */
  canDeleteForSubject(subjectId: number): boolean {
    const subject = this.authorizedSubjects.find(s => s.subjectId === subjectId);
    return subject?.canDelete || false;
  }

  // ============================================
  // CRUD Operations - Teacher can only create/edit lessons
  // ============================================

  /**
   * Open form to add a new lesson (only entity type teachers can create)
   */
  openAdd(type: EntityType): void {
    if (type !== 'lesson') {
      Swal.fire({
        icon: 'warning',
        title: 'Permission Denied',
        text: 'Teachers can only create lessons. Other content types are managed by administrators.',
      });
      return;
    }

    this.formMode = 'add';
    this.entityType = type;
    this.entityTitle = `Add ${this.capitalizeFirst(type)}`;
    this.form = this.getEmptyForm(type);
    this.formErrors = {};
    this.formTouched = {};
    this.formData = {};
    this.isFormOpen = true;
  }

  /**
   * Open form to edit an entity
   * Teachers can only edit lessons they have permission for
   */
  openEdit(type: EntityType, entity: any): void {
    if (type !== 'lesson') {
      Swal.fire({
        icon: 'warning',
        title: 'Permission Denied',
        text: 'Teachers can only edit lessons. Other content types are managed by administrators.',
      });
      return;
    }

    // Check if teacher has permission to edit this lesson's subject
    if (entity.subjectId && !this.canEditForSubject(entity.subjectId)) {
      Swal.fire({
        icon: 'warning',
        title: 'Permission Denied',
        text: 'You do not have permission to edit lessons for this subject.',
      });
      return;
    }

    this.formMode = 'edit';
    this.entityType = type;
    this.entityTitle = `Edit ${this.capitalizeFirst(type)}`;
    this.form = { ...entity };
    this.formErrors = {};
    this.formTouched = {};
    this.formData = {};
    this.isFormOpen = true;
  }

  /**
   * Close the form modal
   */
  closeForm(): void {
    this.isFormOpen = false;
    this.form = {};
    this.formErrors = {};
    this.formTouched = {};
    this.formData = {};
  }

  /**
   * Save entity (create or update)
   * All teacher changes go to pending approval status
   */
  async saveEntity(): Promise<void> {
    if (this.entityType !== 'lesson') {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Operation',
        text: 'Teachers can only save lessons.',
      });
      return;
    }

    // Check permissions
    if (this.form.subjectId && !this.canCreateForSubject(this.form.subjectId)) {
      Swal.fire({
        icon: 'warning',
        title: 'Permission Denied',
        text: 'You do not have permission to create lessons for this subject.',
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Saving...',
        text: 'Your content will be submitted for admin approval',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      if (this.formMode === 'add') {
        await this.createEntity(this.entityType, this.form);
        Swal.fire({
          icon: 'success',
          title: 'Lesson Created',
          text: 'Your lesson has been created and submitted for admin approval.',
        });
      } else {
        await this.updateEntity(this.entityType, this.form.id, this.form);
        Swal.fire({
          icon: 'success',
          title: 'Lesson Updated',
          text: 'Your changes have been submitted for admin approval.',
        });
      }

      this.closeForm();
      await this.loadAllData();
    } catch (error) {
      console.error('Error saving entity:', error);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: this.extractErrorMessage(error),
      });
    }
  }

  /**
   * Delete an entity (lessons only for teachers)
   */
  async deleteItem(type: EntityType, id: Id): Promise<void> {
    if (type !== 'lesson') {
      Swal.fire({
        icon: 'warning',
        title: 'Permission Denied',
        text: 'Teachers can only delete lessons.',
      });
      return;
    }

    const lesson = this.lessons.find(l => l.id === id);
    if (lesson && lesson.subjectId && !this.canDeleteForSubject(lesson.subjectId)) {
      Swal.fire({
        icon: 'warning',
        title: 'Permission Denied',
        text: 'You do not have permission to delete lessons for this subject.',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action will be submitted for admin approval',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await this.deleteEntity(type, id);
        Swal.fire({
          icon: 'success',
          title: 'Delete Request Submitted',
          text: 'Your delete request has been submitted for admin approval.',
        });
        await this.loadAllData();
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
  // API Calls for CRUD
  // ============================================

  private async createEntity(type: EntityType, data: any): Promise<void> {
    // Teacher can only create lessons - use teacher content service
    if (type === 'lesson') {
      await this.teacherContentService.createLesson(data).toPromise();
    }
  }

  private async updateEntity(type: EntityType, id: Id, data: any): Promise<void> {
    // Teacher can only update lessons - use teacher content service
    if (type === 'lesson') {
      await this.teacherContentService.updateLesson(id, data).toPromise();
    }
  }

  private async deleteEntity(type: EntityType, id: Id): Promise<void> {
    // Teacher can only delete lessons - use teacher content service
    if (type === 'lesson') {
      await this.teacherContentService.deleteLesson(id).toPromise();
    }
  }

  // ============================================
  // Resource Management
  // ============================================

  async manageResources(lesson: Lesson): Promise<void> {
    // Check permission
    if (lesson.subjectId && !this.canEditForSubject(lesson.subjectId)) {
      Swal.fire({
        icon: 'warning',
        title: 'Permission Denied',
        text: 'You do not have permission to manage resources for this lesson.',
      });
      return;
    }

    this.selectedLesson = lesson;
    await this.loadLessonResources(lesson.id!);
    this.resourceModalOpen = true;
  }

  closeResourceModal(): void {
    this.resourceModalOpen = false;
    this.selectedLesson = null;
  }

  openAddResource(): void {
    // Check if teacher has create permission for this lesson's subject
    if (this.selectedLesson && !this.canCreateForSubject(this.selectedLesson.subjectId)) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to add resources for this subject.',
      });
      return;
    }
    this.resourceFormOpen = true;
  }

  closeResourceForm(): void {
    this.resourceFormOpen = false;
    // Reset form data
    this.resourceForm = {};
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
    this.hierarchyExpandedState = 'expanded';
    this.refreshAll();
  }

  collapseAll(): void {
    this.hierarchyExpandedState = 'collapsed';
    this.refreshAll();
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getEmptyForm(type: EntityType): any {
    switch (type) {
      case 'lesson':
        return {
          title: '',
          description: '',
          weekId: null,
          termId: null,
          subjectId: null,
          videoUrl: '',
          duration: 0,
          orderIndex: 0,
        };
      default:
        return {};
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

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
  // File Handling
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
  // Form Validation
  // ============================================

  validateField(fieldName: string, value: any): void {
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
  // Helper Methods for Template
  // ============================================

  getAuthorizedSubjectsCanCreateCount(): number {
    return this.authorizedSubjects.filter(s => s.canCreate).length;
  }

  getCategoryName(categoryId?: number): string {
    if (!categoryId) return 'N/A';
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'N/A';
  }

  // ============================================
  // Error Handling
  // ============================================

  private extractErrorMessage(error: any): string {
    console.error('Full error:', error);

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

    if (error.error?.title) return error.error.title;
    if (error.error?.detail) return error.error.detail;
    if (error.error?.message) return error.error.message;
    if (typeof error.error === 'string') return error.error;
    if (error.message) return error.message;

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
  // Additional Helper Methods for Pagination
  // ============================================

  goYearPage(page: number): void {
    this.yearPage = page;
    this.updatePaged();
  }

  goCategoryPage(page: number): void {
    this.categoryPage = page;
    this.updatePaged();
  }

  goSubjectNamePage(page: number): void {
    this.subjectNamePage = page;
    this.updatePaged();
  }

  goSubjectPage(page: number): void {
    this.subjectPage = page;
    this.updatePaged();
  }

  goTermPage(page: number): void {
    this.termPage = page;
    this.updatePaged();
  }

  goWeekPage(page: number): void {
    this.weekPage = page;
    this.updatePaged();
  }

  goLessonPage(page: number): void {
    this.lessonPage = page;
    this.updatePaged();
  }

  // ============================================
  // Delete Confirmation
  // ============================================

  async confirmDelete(type: EntityType, entity: any): Promise<void> {
    await this.deleteItem(type, entity.id);
  }

  // ============================================
  // Resource Management Helpers
  // ============================================

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

    // Check if teacher has create permission for this lesson's subject
    if (this.selectedLesson && !this.canCreateForSubject(this.selectedLesson.subjectId)) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to add resources for this subject.',
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Uploading Resource...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // capture id before awaiting so TypeScript knows it's a number
      const lessonId = this.selectedLesson.id;

      console.log('🚀 Calling addResource API:', { title: data.title, lessonId, file: data.file });

      await this.contentService.addResource(
        data.title,
        lessonId,
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
      // use captured lessonId to avoid narrowing loss across awaits
      await this.loadLessonResources(lessonId);
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
    // Check if teacher has delete permission for this lesson's subject
    if (this.selectedLesson && !this.canDeleteForSubject(this.selectedLesson.subjectId)) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to delete resources for this subject.',
      });
      return;
    }

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
  // Form submission helper
  // ============================================

  submitForm(formData: any): void {
    this.form = { ...this.form, ...formData };
    this.saveEntity();
  }
}
