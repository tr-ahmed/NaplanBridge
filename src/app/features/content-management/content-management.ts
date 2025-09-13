import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import Swal from 'sweetalert2';

import { AuthService } from '../../core/services/auth.service';
<<<<<<< HEAD
import { ContentService, Year, Subject, Term, Week, Lesson, Category, YearSubject, Teacher, Resource } from '../../core/services/content.service';
=======
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
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab

type Id = number;

@Component({
  selector: 'app-content-management',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './content-management.html',
<<<<<<< HEAD
  styleUrls: ['./content-management.scss']
=======
  styleUrls: ['./content-management.scss'],
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
})
export class ContentManagementComponent implements OnInit {
  sidebarCollapsed = false;
  userName = 'Admin User';

<<<<<<< HEAD
  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }

  // ===== Data stores =====
  years: Year[] = [];
=======
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // ===== Data stores =====
  years: Year[] = [];
  subjectNames: SubjectName[] = [];
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
  subjects: Subject[] = [];
  terms: Term[] = [];
  weeks: Week[] = [];
  lessons: Lesson[] = [];
  categories: Category[] = [];
<<<<<<< HEAD
  yearSubjects: YearSubject[] = [];
  teachers: Teacher[] = [];
  subjectResources: Resource[] = [];

  // ===== Stats =====
  stats = { years: 0, subjects: 0, terms: 0, weeks: 0, lessons: 0, categories: 0 };
=======
  teachers: Teacher[] = [];
  users: User[] = [];
  lessonResources: Resource[] = [];

  // ===== Stats =====
  stats = {
    years: 0,
    subjects: 0,
    terms: 0,
    weeks: 0,
    lessons: 0,
    categories: 0,
  };
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab

  // ===== Filters/Search =====
  filters: {
    status?: any;
    yearId: Id | null;
    subjectId: Id | null;
    termId: Id | null;
    weekId: Id | null;
    type: '' | 'lesson' | 'category';
    categoryId: Id | null;
  } = {
<<<<<<< HEAD
      yearId: null,
      subjectId: null,
      termId: null,
      weekId: null,
      type: '',
      status: '',
      categoryId: null
    };
=======
    yearId: null,
    subjectId: null,
    termId: null,
    weekId: null,
    type: '',
    status: '',
    categoryId: null,
  };
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab

  isOpen = false;

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

  searchTerm = '';

  // ===== Pagination =====
  pageSize = 5;

<<<<<<< HEAD
  yearPage = 1; subjectPage = 1; termPage = 1; weekPage = 1; lessonPage = 1; categoryPage = 1;

  filteredYears: Year[] = [];
=======
  yearPage = 1;
  subjectPage = 1;
  termPage = 1;
  weekPage = 1;
  lessonPage = 1;
  categoryPage = 1;

  filteredYears: Year[] = [];
  filteredSubjectNames: SubjectName[] = [];
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
  filteredSubjects: Subject[] = [];
  filteredTerms: Term[] = [];
  filteredWeeks: Week[] = [];
  filteredLessons: Lesson[] = [];
  filteredCategories: Category[] = [];

  pagedYears: Year[] = [];
<<<<<<< HEAD
=======
  pagedSubjectNames: SubjectName[] = [];
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
  pagedSubjects: Subject[] = [];
  pagedTerms: Term[] = [];
  pagedWeeks: Week[] = [];
  pagedLessons: Lesson[] = [];
  pagedCategories: Category[] = [];

<<<<<<< HEAD
  get yearTotalPages() { return Math.max(1, Math.ceil(this.filteredYears.length / this.pageSize)); }
  get subjectTotalPages() { return Math.max(1, Math.ceil(this.filteredSubjects.length / this.pageSize)); }
  get termTotalPages() { return Math.max(1, Math.ceil(this.filteredTerms.length / this.pageSize)); }
  get weekTotalPages() { return Math.max(1, Math.ceil(this.filteredWeeks.length / this.pageSize)); }
  get lessonTotalPages() { return Math.max(1, Math.ceil(this.filteredLessons.length / this.pageSize)); }
  get categoryTotalPages() { return Math.max(1, Math.ceil(this.filteredCategories.length / this.pageSize)); }

  get yStart() { return this.filteredYears.length ? (this.yearPage - 1) * this.pageSize + 1 : 0; }
  get yEnd() { return Math.min(this.yearPage * this.pageSize, this.filteredYears.length); }
  get sStart() { return this.filteredSubjects.length ? (this.subjectPage - 1) * this.pageSize + 1 : 0; }
  get sEnd() { return Math.min(this.subjectPage * this.pageSize, this.filteredSubjects.length); }
  get tStart() { return this.filteredTerms.length ? (this.termPage - 1) * this.pageSize + 1 : 0; }
  get tEnd() { return Math.min(this.termPage * this.pageSize, this.filteredTerms.length); }
  get wStart() { return this.filteredWeeks.length ? (this.weekPage - 1) * this.pageSize + 1 : 0; }
  get wEnd() { return Math.min(this.weekPage * this.pageSize, this.filteredWeeks.length); }
  get lStart() { return this.filteredLessons.length ? (this.lessonPage - 1) * this.pageSize + 1 : 0; }
  get lEnd() { return Math.min(this.lessonPage * this.pageSize, this.filteredLessons.length); }
  get cStart() { return this.filteredCategories.length ? (this.categoryPage - 1) * this.pageSize + 1 : 0; }
  get cEnd() { return Math.min(this.categoryPage * this.pageSize, this.filteredCategories.length); }
=======
  get yearTotalPages() {
    return Math.max(1, Math.ceil(this.filteredYears.length / this.pageSize));
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
  get categoryTotalPages() {
    return Math.max(
      1,
      Math.ceil(this.filteredCategories.length / this.pageSize)
    );
  }

  get yStart() {
    return this.filteredYears.length
      ? (this.yearPage - 1) * this.pageSize + 1
      : 0;
  }
  get yEnd() {
    return Math.min(this.yearPage * this.pageSize, this.filteredYears.length);
  }
  get sStart() {
    return this.filteredSubjects.length
      ? (this.subjectPage - 1) * this.pageSize + 1
      : 0;
  }
  get sEnd() {
    return Math.min(
      this.subjectPage * this.pageSize,
      this.filteredSubjects.length
    );
  }
  get tStart() {
    return this.filteredTerms.length
      ? (this.termPage - 1) * this.pageSize + 1
      : 0;
  }
  get tEnd() {
    return Math.min(this.termPage * this.pageSize, this.filteredTerms.length);
  }
  get wStart() {
    return this.filteredWeeks.length
      ? (this.weekPage - 1) * this.pageSize + 1
      : 0;
  }
  get wEnd() {
    return Math.min(this.weekPage * this.pageSize, this.filteredWeeks.length);
  }
  get lStart() {
    return this.filteredLessons.length
      ? (this.lessonPage - 1) * this.pageSize + 1
      : 0;
  }
  get lEnd() {
    return Math.min(
      this.lessonPage * this.pageSize,
      this.filteredLessons.length
    );
  }
  get cStart() {
    return this.filteredCategories.length
      ? (this.categoryPage - 1) * this.pageSize + 1
      : 0;
  }
  get cEnd() {
    return Math.min(
      this.categoryPage * this.pageSize,
      this.filteredCategories.length
    );
  }
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab

  // ===== Modals =====
  isFormOpen = false;
  formMode: 'add' | 'edit' = 'add';
<<<<<<< HEAD
  entityType: 'year' | 'subject' | 'term' | 'week' | 'lesson' | 'category' = 'year';
=======
  entityType: 'year' | 'subjectName' | 'subject' | 'term' | 'week' | 'lesson' | 'category' =
    'year';
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
  entityTitle = '';
  form: any = {};

  previewOpen = false;
  preview: any = {};

  activeTab: string = 'years';
  categoryTab: string = 'lessons';

  dropdownOpen = false;

  // Resource management
  resourceModalOpen = false;
  resourceFormOpen = false;
<<<<<<< HEAD
  selectedSubject: Subject | null = null;
  editingResource: Resource | null = null;
  // In the component class, update the resourceForm initialization:
  resourceForm: any = {
    title: '',
    fileUrl: '',
    yearSubjectId: null
=======
  selectedLesson: Lesson | null = null;
  editingResource: Resource | null = null;
  resourceForm: any = {
    title: '',
    file: null,
    lessonId: null,
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
  };

  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private contentService: ContentService
<<<<<<< HEAD
  ) { }
=======
  ) {}
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab

  ngOnInit(): void {
    this.loadAllFromAPI();
  }

<<<<<<< HEAD
  // ===== API Calls =====
  async loadAllFromAPI() {
    try {
      // Load years first
      await this.loadYears();

      // Load subjects, teachers, lessons, categories in parallel
      await Promise.all([
        this.loadSubjects(),
        this.loadTeachers(),
        this.loadLessons(),
        this.loadCategories()
      ]);

      // Load yearSubjects (depends on years)
      await this.loadYearSubjects();

      // Load terms first, then weeks (weeks depend on terms)
      await this.loadTerms();
      await this.loadWeeks();
=======
  // دالة محسنة لاستخراج الرسائل الإنجليزية من الأخطاء
  private extractEnglishError(error: any): string {
    if (error.originalError && error.originalError.error && typeof error.originalError.error === 'string') {
      return error.originalError.error;
    }
    
    if (error.error && typeof error.error === 'string') {
      return error.error;
    }
    
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.originalError && error.originalError.error && typeof error.originalError.error === 'object') {
      const possibleProperties = ['message', 'error', 'detail', 'title', 'reason'];
      for (const prop of possibleProperties) {
        if (error.originalError.error[prop] && typeof error.originalError.error[prop] === 'string') {
          return error.originalError.error[prop];
        }
      }
    }
    
    if (error.details && typeof error.details === 'string') {
      return error.details;
    }
    
    return 'An unknown error occurred. Please try again.';
  }

  // ===== API Calls =====
  async loadAllFromAPI() {
    try {
      // Load all data in sequence
      await this.loadYears();
      await this.loadCategories();
      await this.loadSubjectNames();
      await this.loadTeachers();
      await this.loadSubjects();
      await this.loadTerms();
      await this.loadWeeks();
      await this.loadLessons();
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab

      // Finally refresh UI state
      this.refreshAll();
    } catch (error) {
      console.error('Error loading data from API:', error);
<<<<<<< HEAD
      Swal.fire('Error', 'Failed to load data from server', 'error');
=======
      Swal.fire('Error', this.extractEnglishError(error), 'error');
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    }
  }

  async loadYears(): Promise<void> {
    try {
<<<<<<< HEAD
      this.years = await this.contentService.getYears().toPromise() || [];
=======
      this.years = (await this.contentService.getYears().toPromise()) || [];
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    } catch (error) {
      console.error('Error loading years:', error);
      throw error;
    }
  }

<<<<<<< HEAD
  async loadSubjects(): Promise<void> {
    try {
      this.subjects = await this.contentService.getSubjects().toPromise() || [];
    } catch (error) {
      console.error('Error loading subjects:', error);
      throw error;
    }
  }

  async loadTeachers(): Promise<void> {
    try {
      const users = await this.contentService.getTeachers().toPromise() || [];
      this.teachers = users
        .filter(u => u.roles?.some(r => r.toLowerCase() === 'teacher'))
        .map(u => ({
          id: u.id,
          name: u.userName,
          roles: u.roles
        }));
    } catch (error) {
      console.error('Error loading teachers:', error);
      throw error;
    }
  }

  async loadLessons(): Promise<void> {
    try {
      this.lessons = await this.contentService.getLessons().toPromise() || [];
    } catch (error) {
      console.error('Error loading lessons:', error);
      throw error;
    }
  }

  async loadCategories(): Promise<void> {
    try {
      this.categories = await this.contentService.getCategories().toPromise() || [];
=======
  async loadCategories(): Promise<void> {
    try {
      this.categories = (await this.contentService.getCategories().toPromise()) || [];
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  }

<<<<<<< HEAD
  async loadYearSubjects(): Promise<void> {
    try {
      this.yearSubjects = [];

      const promises = this.years.map(year =>
        this.contentService.getYearSubjectsByYear(year.id).toPromise()
          .then(r => r || [])
          .catch(err => { console.error(`Error loading yearSubjects for year ${year.id}:`, err); return []; })
      );

      const results = await Promise.all(promises);
      this.yearSubjects = results.flat();
    } catch (error) {
      console.error('Error loading year subjects:', error);
=======
  async loadSubjectNames(): Promise<void> {
    try {
      this.subjectNames = (await this.contentService.getSubjectNames().toPromise()) || [];
    } catch (error) {
      console.error('Error loading subject names:', error);
      throw error;
    }
  }

// In your component
async loadTeachers(): Promise<void> {
  try {
    const users = (await this.contentService.getTeachers().toPromise()) || [];
    
    // Filter users with Teacher role
    this.teachers = users
      .filter(user => user.roles && user.roles.includes('Teacher'))
      .map(user => ({
        id: user.id,
        userName: user.userName,
        email: user.email || '',
        name: user.userName, // Use userName as name
        roles: user.roles
      }));
      
  } catch (error) {
    console.error('Error loading teachers:', error);
    throw error;
  }
}
  async loadSubjects(): Promise<void> {
    try {
      this.subjects = (await this.contentService.getSubjects().toPromise()) || [];
    } catch (error) {
      console.error('Error loading subjects:', error);
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
      throw error;
    }
  }

  async loadTerms(): Promise<void> {
    try {
<<<<<<< HEAD
      this.terms = [];

      const promises = this.yearSubjects.map(ys =>
        this.contentService.getTermsByYearSubject(ys.id).toPromise()
          .then(r => r || [])
          .catch(err => { console.error(`Error loading terms for yearSubject ${ys.id}:`, err); return []; })
      );

      const results = await Promise.all(promises);
      this.terms = results.flat();
=======
      this.terms = (await this.contentService.getTerms().toPromise()) || [];
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    } catch (error) {
      console.error('Error loading terms:', error);
      throw error;
    }
  }

  async loadWeeks(): Promise<void> {
    try {
<<<<<<< HEAD
      this.weeks = [];

      const promises = this.terms.map(term =>
        this.contentService.getWeeksByTerm(term.id).toPromise()
          .then(r => r || [])
          .catch(err => { console.error(`Error loading weeks for term ${term.id}:`, err); return []; })
      );

      const results = await Promise.all(promises);
      this.weeks = results.flat();
=======
      this.weeks = (await this.contentService.getWeeks().toPromise()) || [];
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    } catch (error) {
      console.error('Error loading weeks:', error);
      throw error;
    }
  }

<<<<<<< HEAD
  async loadSubjectResources(subjectId: number): Promise<void> {
    try {
      this.subjectResources = await this.contentService.getSubjectResources(subjectId).toPromise() || [];
    } catch (error) {
      console.error('Error loading subject resources:', error);
      Swal.fire('Error', 'Failed to load resources', 'error');
=======
  async loadLessons(): Promise<void> {
    try {
      this.lessons = (await this.contentService.getLessons().toPromise()) || [];
    } catch (error) {
      console.error('Error loading lessons:', error);
      throw error;
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // ===== Helpers =====
  trackById = (_: number, item: any) => item.id;

<<<<<<< HEAD
  numberYear(id: Id | undefined | null) { return this.years.find(y => y.id === id)?.number || 0; }
  nameSubject(id: Id | undefined | null) { return this.subjects.find(s => s.id === id)?.name || ''; }
  numberTerm(id: Id | undefined | null) { return this.terms.find(t => t.id === id)?.number || 0; }
  numberWeek(id: Id | undefined | null) { return this.weeks.find(w => w.id === id)?.number || 0; }
  nameCategory(id: Id | undefined | null) { return this.categories.find(c => c.id === id)?.name || ''; }
  nameTeacher(id: Id | undefined | null) { return this.teachers.find(t => t.id === id)?.name || ''; }

  getSubjectCountForCategory(categoryId: Id): number {
    return this.subjects.filter(s => s.categoryId === categoryId).length;
  }

  getTermIdFromWeekId(weekId: Id): Id | null {
    const week = this.weeks.find(w => w.id === weekId);
=======
  numberYear(id: Id | undefined | null) {
    return this.years.find((y) => y.id === id)?.yearNumber || 0;
  }
  
  nameSubject(id: Id | undefined | null) {
    return this.subjects.find((s) => s.id === id)?.subjectName || '';
  }
  
  nameSubjectName(id: Id | undefined | null) {
    return this.subjectNames.find((s) => s.id === id)?.name || '';
  }
  
  numberTerm(id: Id | undefined | null) {
    return this.terms.find((t) => t.id === id)?.termNumber || 0;
  }
  
  numberWeek(id: Id | undefined | null) {
    return this.weeks.find((w) => w.id === id)?.weekNumber || 0;
  }
  
  nameCategory(id: Id | undefined | null) {
    return this.categories.find((c) => c.id === id)?.name || '';
  }
  
nameTeacher(id: Id | undefined | null) {
  const teacher = this.teachers.find((t) => t.id === id);
  return teacher ? teacher.name || teacher.userName : '';
}

  getSubjectCountForCategory(categoryId: Id): number {
    return this.subjects.filter((s) => s.categoryId === categoryId).length;
  }

  getSubjectNameCountForCategory(categoryId: Id): number {
    return this.subjectNames.filter((s) => s.categoryId === categoryId).length;
  }

  getTermIdFromWeekId(weekId: Id): Id | null {
    const week = this.weeks.find((w) => w.id === weekId);
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    return week ? week.termId : null;
  }

  getSubjectIdFromWeekId(weekId: Id): Id | null {
<<<<<<< HEAD
    const week = this.weeks.find(w => w.id === weekId);
    if (!week) return null;

    const term = this.terms.find(t => t.id === week.termId);
    if (!term) return null;

    const yearSubject = this.yearSubjects.find(ys => ys.id === term.yearSubjectId);
    return yearSubject ? yearSubject.subject.id : null;
  }

  getYearIdFromTermId(termId: Id): Id | null {
    const term = this.terms.find(t => t.id === termId);
    if (!term) return null;

    const yearSubject = this.yearSubjects.find(ys => ys.id === term.yearSubjectId);
    return yearSubject ? yearSubject.yearId : null;
=======
    const week = this.weeks.find((w) => w.id === weekId);
    if (!week) return null;

    const term = this.terms.find((t) => t.id === week.termId);
    return term ? term.subjectId : null;
  }

  getYearIdFromSubjectId(subjectId: Id): Id | null {
    const subject = this.subjects.find((s) => s.id === subjectId);
    return subject ? subject.yearId : null;
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
  }

  // ===== Filtering / Paging =====
  onFilterChange() {
    this.resetPaging();
  }

<<<<<<< HEAD
  private getYearIdForSubject(subjectId: Id): Id | null {
    const yearSubject = this.yearSubjects.find(ys => ys.subject?.id === subjectId);
    return yearSubject ? yearSubject.yearId : null;
  }

  private getYearIdForTerm(yearSubjectId: Id): Id | null {
    const yearSubject = this.yearSubjects.find(ys => ys.id === yearSubjectId);
    return yearSubject ? yearSubject.yearId : null;
  }

  private getSubjectIdForTerm(yearSubjectId: Id): Id | null {
    const yearSubject = this.yearSubjects.find(ys => ys.id === yearSubjectId);
    return yearSubject ? yearSubject.subject?.id : null;
  }

  private getYearIdForLesson(weekId: Id): Id | null {
    const week = this.weeks.find(w => w.id === weekId);
    if (!week) return null;

    const term = this.terms.find(t => t.id === week.termId);
    if (!term) return null;

    return this.getYearIdForTerm(term.yearSubjectId);
  }

  private getSubjectIdForLesson(weekId: Id): Id | null {
    const week = this.weeks.find(w => w.id === weekId);
    if (!week) return null;

    const term = this.terms.find(t => t.id === week.termId);
    if (!term) return null;

    return this.getSubjectIdForTerm(term.yearSubjectId);
  }

  resetPaging() {
    this.yearPage = this.subjectPage = this.termPage = this.weekPage = this.lessonPage = this.categoryPage = 1;
=======
  resetPaging() {
    this.yearPage =
      this.subjectPage =
      this.termPage =
      this.weekPage =
      this.lessonPage =
      this.categoryPage =
        1;
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    this.refreshAll();
  }

  refreshAll() {
    this.applyFilters();
    this.updatePaged();
    this.updateStats();
  }

  handleLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }

  applyFilters() {
    const q = (this.searchTerm || '').toLowerCase();

    // YEARS
<<<<<<< HEAD
    this.filteredYears = this.years.filter(y => !q || y.number.toString().includes(q));

    // SUBJECTS
    this.filteredSubjects = this.subjects.filter(s => {
      const byYear = this.filters.yearId ? this.getYearIdForSubject(s.id) === this.filters.yearId : true;
      const byCategory = this.filters.categoryId ? s.categoryId === this.filters.categoryId : true;
      const bySearch = !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
=======
    this.filteredYears = this.years.filter(
      (y) => !q || y.yearNumber.toString().includes(q)
    );

    // SUBJECTS
    this.filteredSubjects = this.subjects.filter((s) => {
      const byYear = this.filters.yearId
        ? s.yearId === this.filters.yearId
        : true;
      const byCategory = this.filters.categoryId
        ? s.categoryId === this.filters.categoryId
        : true;
      const bySearch =
        !q ||
        s.subjectName.toLowerCase().includes(q) ||
        s.categoryName.toLowerCase().includes(q);
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
      return byYear && byCategory && bySearch;
    });

    // TERMS
<<<<<<< HEAD
    this.filteredTerms = this.terms.filter(t => {
      const byYear = this.filters.yearId ? this.getYearIdForTerm(t.yearSubjectId) === this.filters.yearId : true;
      const bySubject = this.filters.subjectId ? this.getSubjectIdForTerm(t.yearSubjectId) === this.filters.subjectId : true;
      const bySearch = !q || t.number.toString().includes(q);
      return byYear && bySubject && bySearch;
    });

    // WEEKS
    this.filteredWeeks = this.weeks.filter(w => {
      const term = this.terms.find(t => t.id === w.termId);
      const byYear = this.filters.yearId ? (term && this.getYearIdForTerm(term.yearSubjectId) === this.filters.yearId) : true;
      const bySubject = this.filters.subjectId ? (term && this.getSubjectIdForTerm(term.yearSubjectId) === this.filters.subjectId) : true;
      const byTerm = this.filters.termId ? w.termId === this.filters.termId : true;
      const bySearch = !q || w.number.toString().includes(q);
      return !!term && byYear && bySubject && byTerm && bySearch;
    });

    // LESSONS
    this.filteredLessons = this.lessons.filter(l => {
      const byTypeFilter = this.filters.type ? this.filters.type === 'lesson' : true;
      const byYear = this.filters.yearId ? this.getYearIdForLesson(l.weekId) === this.filters.yearId : true;
      const bySubject = this.filters.subjectId ? this.getSubjectIdForLesson(l.weekId) === this.filters.subjectId : true;
      const byWeek = this.filters.weekId ? l.weekId === this.filters.weekId : true;
      const bySearch = !q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q);
      return byTypeFilter && byYear && bySubject && byWeek && bySearch;
    });

    // CATEGORIES
    this.filteredCategories = this.categories.filter(c => {
      const byTypeFilter = this.filters.type ? this.filters.type === 'category' : true;
      const bySearch = !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      return byTypeFilter && bySearch;
=======
    this.filteredTerms = this.terms.filter((t) => {
      const bySubject = this.filters.subjectId
        ? t.subjectId === this.filters.subjectId
        : true;
      const bySearch = !q || t.termNumber.toString().includes(q);
      return bySubject && bySearch;
    });

    // WEEKS
    this.filteredWeeks = this.weeks.filter((w) => {
      const byTerm = this.filters.termId
        ? w.termId === this.filters.termId
        : true;
      const bySearch = !q || w.weekNumber.toString().includes(q);
      return byTerm && bySearch;
    });

    // LESSONS
    this.filteredLessons = this.lessons.filter((l) => {
      const byWeek = this.filters.weekId
        ? l.weekId === this.filters.weekId
        : true;
      const bySubject = this.filters.subjectId
        ? l.subjectId === this.filters.subjectId
        : true;
      const bySearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q);
      return byWeek && bySubject && bySearch;
    });

    // CATEGORIES
    this.filteredCategories = this.categories.filter((c) => {
      const bySearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      return bySearch;
    });

    // SUBJECT NAMES
    this.filteredSubjectNames = this.subjectNames.filter((sn) => {
      const byCategory = this.filters.categoryId
        ? sn.categoryId === this.filters.categoryId
        : true;
      const bySearch =
        !q ||
        sn.name.toLowerCase().includes(q);
      return byCategory && bySearch;
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    });
  }

  updatePaged() {
    this.pagedYears = this.slicePage(this.filteredYears, this.yearPage);
<<<<<<< HEAD
    this.pagedSubjects = this.slicePage(this.filteredSubjects, this.subjectPage);
    this.pagedTerms = this.slicePage(this.filteredTerms, this.termPage);
    this.pagedWeeks = this.slicePage(this.filteredWeeks, this.weekPage);
    this.pagedLessons = this.slicePage(this.filteredLessons, this.lessonPage);
    this.pagedCategories = this.slicePage(this.filteredCategories, this.categoryPage);
  }

  slicePage<T>(arr: T[], page: number) { const start = (page - 1) * this.pageSize; return arr.slice(start, start + this.pageSize); }
=======
    this.pagedSubjects = this.slicePage(
      this.filteredSubjects,
      this.subjectPage
    );
    this.pagedTerms = this.slicePage(this.filteredTerms, this.termPage);
    this.pagedWeeks = this.slicePage(this.filteredWeeks, this.weekPage);
    this.pagedLessons = this.slicePage(this.filteredLessons, this.lessonPage);
    this.pagedCategories = this.slicePage(
      this.filteredCategories,
      this.categoryPage
    );
    this.pagedSubjectNames = this.slicePage(
      this.filteredSubjectNames,
      this.subjectPage
    );
  }

  slicePage<T>(arr: T[], page: number) {
    const start = (page - 1) * this.pageSize;
    return arr.slice(start, start + this.pageSize);
  }
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab

  updateStats() {
    this.stats = {
      years: this.years.length,
      subjects: this.subjects.length,
      terms: this.terms.length,
      weeks: this.weeks.length,
      lessons: this.lessons.length,
<<<<<<< HEAD
      categories: this.categories.length
=======
      categories: this.categories.length,
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    };
  }

  // Paging actions
<<<<<<< HEAD
  goYearPage(p: number) { if (p >= 1 && p <= this.yearTotalPages) { this.yearPage = p; this.updatePaged(); } }
  goSubjectPage(p: number) { if (p >= 1 && p <= this.subjectTotalPages) { this.subjectPage = p; this.updatePaged(); } }
  goTermPage(p: number) { if (p >= 1 && p <= this.termTotalPages) { this.termPage = p; this.updatePaged(); } }
  goWeekPage(p: number) { if (p >= 1 && p <= this.weekTotalPages) { this.weekPage = p; this.updatePaged(); } }
  goLessonPage(p: number) { if (p >= 1 && p <= this.lessonTotalPages) { this.lessonPage = p; this.updatePaged(); } }
  goCategoryPage(p: number) { if (p >= 1 && p <= this.categoryTotalPages) { this.categoryPage = p; this.updatePaged(); } }

  // ===== Add/Edit =====
  openAdd(type: 'year' | 'subject' | 'term' | 'week' | 'lesson' | 'category') {
    this.formMode = 'add';
    this.entityType = type;
    this.entityTitle = this.capitalize(type);

    if (type === 'term') {
      this.form = {
        number: 0,
        yearSubjectId: this.yearSubjects.length > 0 ? this.yearSubjects[0].id : null
      };
    } else {
      this.form = this.defaultFormFor(type);
    }

    this.isFormOpen = true;
  }

  openEdit(type: 'year' | 'subject' | 'term' | 'week' | 'lesson' | 'category', entity: any) {
=======
  goYearPage(p: number) {
    if (p >= 1 && p <= this.yearTotalPages) {
      this.yearPage = p;
      this.updatePaged();
    }
  }
  goSubjectPage(p: number) {
    if (p >= 1 && p <= this.subjectTotalPages) {
      this.subjectPage = p;
      this.updatePaged();
    }
  }
  goTermPage(p: number) {
    if (p >= 1 && p <= this.termTotalPages) {
      this.termPage = p;
      this.updatePaged();
    }
  }
  goWeekPage(p: number) {
    if (p >= 1 && p <= this.weekTotalPages) {
      this.weekPage = p;
      this.updatePaged();
    }
  }
  goLessonPage(p: number) {
    if (p >= 1 && p <= this.lessonTotalPages) {
      this.lessonPage = p;
      this.updatePaged();
    }
  }
  goCategoryPage(p: number) {
    if (p >= 1 && p <= this.categoryTotalPages) {
      this.categoryPage = p;
      this.updatePaged();
    }
  }

  // ===== Add/Edit =====
  openAdd(type: 'year' | 'subjectName' | 'subject' | 'term' | 'week' | 'lesson' | 'category') {
    this.formMode = 'add';
    this.entityType = type;
    this.entityTitle = this.capitalize(type);
    this.form = this.defaultFormFor(type);
    this.isFormOpen = true;
  }

  openEdit(
    type: 'year' | 'subjectName' | 'subject' | 'term' | 'week' | 'lesson' | 'category',
    entity: any
  ) {
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    this.formMode = 'edit';
    this.entityType = type;
    this.entityTitle = this.capitalize(type);
    this.form = { ...entity };
    this.isFormOpen = true;
  }

<<<<<<< HEAD
  closeForm() { this.isFormOpen = false; }

  async submitForm() {
    try {
      this.hydrateNamesBeforeSave();

=======
  closeForm() {
    this.isFormOpen = false;
  }

  async submitForm() {
    try {
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
      if (this.formMode === 'add') {
        await this.addEntity();
      } else {
        await this.updateEntity();
      }

      this.refreshAll();
      this.closeForm();

      await Swal.fire({
        icon: 'success',
        title: this.formMode === 'add' ? 'Added!' : 'Updated!',
<<<<<<< HEAD
        text: `The ${this.entityType} has been ${this.formMode === 'add' ? 'added' : 'updated'} successfully.`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error saving entity:', error);
      Swal.fire('Error', `Failed to ${this.formMode} ${this.entityType}`, 'error');
=======
        text: `The ${this.entityType} has been ${
          this.formMode === 'add' ? 'added' : 'updated'
        } successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error saving entity:', error);
      Swal.fire('Error', this.extractEnglishError(error), 'error');
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    }
  }

  private async addEntity(): Promise<void> {
    switch (this.entityType) {
      case 'year': {
<<<<<<< HEAD
        const { number } = this.form;
        if (number == null) {
          Swal.fire('Error', 'Please provide a year number.', 'error');
          throw new Error('Validation failed');
        }
        const newYear = await this.contentService.addYear({ number }).toPromise();
        if (newYear) this.years.push(newYear);
        break;
      }
      case 'subject': {
        const {
          name,
          description,
          originalPrice,
          discountPercentage,
          imageUrl,
          level,
          duration,
          categoryId,
          teacherId,
          yearId,
          termNumber,
          weekNumbers,
          objectives,
          color
        } = this.form;

        if (
          !name ||
          !description ||
          originalPrice == null ||
          discountPercentage == null ||
          !level ||
          duration == null ||
          categoryId == null ||
          teacherId == null ||
          yearId == null ||
          termNumber == null ||
          !Array.isArray(weekNumbers) || weekNumbers.length === 0
        ) {
          Swal.fire('Error', 'Please fill all required subject fields.', 'error');
          throw new Error('Validation failed');
        }

        // Calculate price based on discount
        const price = originalPrice * (1 - (discountPercentage / 100));

        const payload = {
          name,
          description,
          originalPrice,
          discountPercentage,
          price,
          imageUrl,
          level,
          duration,
          categoryId,
          teacherId,
          yearId,
          termNumber,
          weekNumbers,
          objectives,
          color
        };

        const newSubject = await this.contentService.addSubject(payload).toPromise();
        if (newSubject) this.subjects.push(newSubject);
        break;
      }
      case 'term': {
        const { number, yearSubjectId } = this.form;
        if (number == null || yearSubjectId == null) {
          Swal.fire('Error', 'Please provide term number and yearSubjectId.', 'error');
          throw new Error('Validation failed');
        }
        const newTerm = await this.contentService.addTerm({ number, yearSubjectId }).toPromise();
        if (newTerm) this.terms.push(newTerm);
        break;
      }
      case 'week': {
        const { number, termId } = this.form;
        if (number == null || termId == null) {
          Swal.fire('Error', 'Please provide week number and termId.', 'error');
          throw new Error('Validation failed');
        }
        const newWeek = await this.contentService.addWeek({ number, termId }).toPromise();
        if (newWeek) this.weeks.push(newWeek);
        break;
      }
      case 'lesson': {
        const { title, videoUrl, description, weekId, duration, objectives } = this.form;
        if (!title || !videoUrl || !description || weekId == null) {
          Swal.fire('Error', 'Please fill all required lesson fields.', 'error');
          throw new Error('Validation failed');
        }
        const payload = { title, videoUrl, description, weekId, duration, objectives };
        const newLesson = await this.contentService.addLesson(payload).toPromise();
        if (newLesson) this.lessons.push(newLesson);
        break;
      }
=======
        const { yearNumber } = this.form;
        if (yearNumber == null) {
          Swal.fire('Error', 'Please provide a year number.', 'error');
          throw new Error('Validation failed');
        }
        const newYear = await this.contentService.addYear({ yearNumber }).toPromise();
        if (newYear) this.years.push(newYear);
        break;
      }
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
      case 'category': {
        const { name, description, color } = this.form;
        if (!name || !description) {
          Swal.fire('Error', 'Please fill all required category fields.', 'error');
          throw new Error('Validation failed');
        }
        const payload = { name, description, color };
        const newCategory = await this.contentService.addCategory(payload).toPromise();
        if (newCategory) this.categories.push(newCategory);
        break;
      }
<<<<<<< HEAD
=======
      case 'subjectName': {
        const { name, categoryId } = this.form;
        if (!name || !categoryId) {
          Swal.fire('Error', 'Please fill all required subject name fields.', 'error');
          throw new Error('Validation failed');
        }
        const payload = { name, categoryId };
        const newSubjectName = await this.contentService.addSubjectName(payload).toPromise();
        if (newSubjectName) this.subjectNames.push(newSubjectName);
        break;
      }
      case 'subject': {
        const {
          yearId,
          subjectNameId,
          originalPrice,
          discountPercentage,
          level,
          duration,
          teacherId,
          startDate,
          posterFile
        } = this.form;

        if (
          !yearId ||
          !subjectNameId ||
          originalPrice == null ||
          discountPercentage == null ||
          !level ||
          duration == null ||
          !teacherId ||
          !startDate ||
          !posterFile
        ) {
          Swal.fire('Error', 'Please fill all required subject fields.', 'error');
          throw new Error('Validation failed');
        }

        const newSubject = await this.contentService.addSubject(
          yearId,
          subjectNameId,
          originalPrice,
          discountPercentage,
          level,
          duration,
          teacherId,
          startDate,
          posterFile
        ).toPromise();
        
        if (newSubject) this.subjects.push(newSubject);
        break;
      }
      case 'term': {
        const { subjectId, termNumber, startDate } = this.form;
        if (!subjectId || termNumber == null || !startDate) {
          Swal.fire('Error', 'Please provide all required term fields.', 'error');
          throw new Error('Validation failed');
        }
        const newTerm = await this.contentService.addTerm({ subjectId, termNumber, startDate }).toPromise();
        if (newTerm) this.terms.push(newTerm);
        break;
      }
      case 'week': {
        const { termId, weekNumber } = this.form;
        if (!termId || weekNumber == null) {
          Swal.fire('Error', 'Please provide week number and termId.', 'error');
          throw new Error('Validation failed');
        }
        const newWeek = await this.contentService.addWeek({ termId, weekNumber }).toPromise();
        if (newWeek) this.weeks.push(newWeek);
        break;
      }
      case 'lesson': {
        const { title, description, weekId, posterFile, videoFile } = this.form;

        if (!title || !description || !weekId || !posterFile || !videoFile) {
          Swal.fire('Error', 'Please fill all required lesson fields.', 'error');
          throw new Error('Validation failed');
        }

        const newLesson = await this.contentService
          .addLesson(title, description, weekId, posterFile, videoFile)
          .toPromise();
        if (newLesson) this.lessons.push(newLesson);
        break;
      }
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
      default:
        throw new Error('Unknown entity type');
    }
  }

  private async updateEntity() {
    switch (this.entityType) {
      case 'year':
<<<<<<< HEAD
        await this.contentService.updateYear(this.form.id, this.form).toPromise();
        this.years = this.years.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'subject':
        // Calculate price based on discount
        this.form.price = this.form.originalPrice * (1 - (this.form.discountPercentage / 100));
        await this.contentService.updateSubject(this.form.id, this.form).toPromise();
        this.subjects = this.subjects.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'term':
        await this.contentService.updateTerm(this.form.id, this.form).toPromise();
        this.terms = this.terms.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'week':
        await this.contentService.updateWeek(this.form.id, this.form).toPromise();
        this.weeks = this.weeks.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'lesson':
        await this.contentService.updateLesson(this.form.id, this.form).toPromise();
        this.lessons = this.lessons.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'category':
        await this.contentService.updateCategory(this.form.id, this.form).toPromise();
        this.categories = this.categories.map(x => x.id === this.form.id ? this.form : x);
        break;
    }
  }

  async confirmDelete(type: 'year' | 'subject' | 'term' | 'week' | 'lesson' | 'category', entity: any) {
=======
        await this.contentService.updateYear(this.form.id, { yearNumber: this.form.yearNumber }).toPromise();
        this.years = this.years.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'category':
        await this.contentService.updateCategory(this.form.id, { 
          name: this.form.name, 
          description: this.form.description, 
          color: this.form.color 
        }).toPromise();
        this.categories = this.categories.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'subjectName':
        await this.contentService.updateSubjectName(this.form.id, { 
          name: this.form.name, 
          categoryId: this.form.categoryId 
        }).toPromise();
        this.subjectNames = this.subjectNames.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'subject':
        await this.contentService.updateSubject(
          this.form.id,
          this.form.yearId,
          this.form.subjectNameId,
          this.form.originalPrice,
          this.form.discountPercentage,
          this.form.level,
          this.form.duration,
          this.form.teacherId,
          this.form.startDate,
          this.form.posterFile
        ).toPromise();
        this.subjects = this.subjects.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'term':
        await this.contentService.updateTerm(this.form.id, { 
          subjectId: this.form.subjectId, 
          termNumber: this.form.termNumber, 
          startDate: this.form.startDate 
        }).toPromise();
        this.terms = this.terms.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'week':
        await this.contentService.updateWeek(this.form.id, { 
          termId: this.form.termId, 
          weekNumber: this.form.weekNumber 
        }).toPromise();
        this.weeks = this.weeks.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'lesson':
        await this.contentService.updateLesson(
          this.form.id,
          this.form.title,
          this.form.description,
          this.form.weekId,
          this.form.posterFile,
          this.form.videoFile
        ).toPromise();
        this.lessons = this.lessons.map(x => x.id === this.form.id ? this.form : x);
        break;
    }
  }

  async confirmDelete(
    type: 'year' | 'subjectName' | 'subject' | 'term' | 'week' | 'lesson' | 'category',
    entity: any
  ) {
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    const result = await Swal.fire({
      title: `Delete this ${type}?`,
      text: 'Are you sure you want to delete this item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
<<<<<<< HEAD
      cancelButtonText: 'Cancel'
=======
      cancelButtonText: 'Cancel',
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    });

    if (result.isConfirmed) {
      try {
        switch (type) {
          case 'year':
            await this.contentService.deleteYear(entity.id).toPromise();
<<<<<<< HEAD
            this.years = this.years.filter(x => x.id !== entity.id);
            break;
          case 'subject':
            await this.contentService.deleteSubject(entity.id).toPromise();
            this.subjects = this.subjects.filter(x => x.id !== entity.id);
            break;
          case 'term':
            await this.contentService.deleteTerm(entity.id).toPromise();
            this.terms = this.terms.filter(x => x.id !== entity.id);
            break;
          case 'week':
            await this.contentService.deleteWeek(entity.id).toPromise();
            this.weeks = this.weeks.filter(x => x.id !== entity.id);
            break;
          case 'lesson':
            await this.contentService.deleteLesson(entity.id).toPromise();
            this.lessons = this.lessons.filter(x => x.id !== entity.id);
            break;
          case 'category':
            await this.contentService.deleteCategory(entity.id).toPromise();
            this.categories = this.categories.filter(x => x.id !== entity.id);
=======
            this.years = this.years.filter((x) => x.id !== entity.id);
            break;
          case 'category':
            await this.contentService.deleteCategory(entity.id).toPromise();
            this.categories = this.categories.filter((x) => x.id !== entity.id);
            break;
          case 'subjectName':
            await this.contentService.deleteSubjectName(entity.id).toPromise();
            this.subjectNames = this.subjectNames.filter((x) => x.id !== entity.id);
            break;
          case 'subject':
            await this.contentService.deleteSubject(entity.id).toPromise();
            this.subjects = this.subjects.filter((x) => x.id !== entity.id);
            break;
          case 'term':
            await this.contentService.deleteTerm(entity.id).toPromise();
            this.terms = this.terms.filter((x) => x.id !== entity.id);
            break;
          case 'week':
            await this.contentService.deleteWeek(entity.id).toPromise();
            this.weeks = this.weeks.filter((x) => x.id !== entity.id);
            break;
          case 'lesson':
            await this.contentService.deleteLesson(entity.id).toPromise();
            this.lessons = this.lessons.filter((x) => x.id !== entity.id);
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
            break;
        }

        this.refreshAll();
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'The item has been deleted.',
          timer: 1500,
<<<<<<< HEAD
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting entity:', error);
        Swal.fire('Error', 'Failed to delete item', 'error');
=======
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('Error deleting entity:', error);
        Swal.fire('Error', this.extractEnglishError(error), 'error');
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
      }
    }
  }

  defaultFormFor(type: string) {
    switch (type) {
<<<<<<< HEAD
      case 'year':
        return { number: 0 };
      case 'subject':
        return {
          name: '',
          description: '',
          originalPrice: 0,
          discountPercentage: 0,
          price: 0,
          imageUrl: '',
          level: '',
          duration: 0,
          categoryId: null,
          teacherId: null,
          yearId: null,
          termNumber: 0,
          weekNumbers: [],
          objectives: '',
          color: ''
        };
      case 'term':
        return {
          number: 0,
          yearSubjectId: this.yearSubjects.length > 0 ? this.yearSubjects[0].id : null
        };
      case 'week':
        return { number: 0, termId: this.terms[0]?.id ?? null };
      case 'lesson':
        return {
          title: '',
          videoUrl: '',
          description: '',
          weekId: this.weeks[0]?.id ?? null,
          duration: 0,
          objectives: ''
        };
=======
      case 'year':   return { yearNumber: 0 };
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
      case 'category':
        return {
          name: '',
          description: '',
<<<<<<< HEAD
          color: ''
        };
      default: return {};
    }
  }

  hydrateNamesBeforeSave() {
    // No-op: server handles relations by IDs
  }

  // ===== Resource Management =====
  async manageResources(subject: Subject) {
    this.selectedSubject = subject;
    await this.loadSubjectResources(subject.id);
=======
          color: '',
        };
      case 'subjectName':
        return {
          name: '',
          categoryId: this.categories.length > 0 ? this.categories[0].id : null,
        };
      case 'subject':
        return {
          yearId: this.years.length > 0 ? this.years[0].id : null,
          subjectNameId: this.subjectNames.length > 0 ? this.subjectNames[0].id : null,
          originalPrice: 0,
          discountPercentage: 0,
          level: '',
          duration: 0,
          teacherId: this.teachers.length > 0 ? this.teachers[0].id : null,
          startDate: new Date().toISOString().split('T')[0],
          posterFile: null
        };
      case 'term':
        return {
          subjectId: this.subjects.length > 0 ? this.subjects[0].id : null,
          termNumber: 1,
          startDate: new Date().toISOString().split('T')[0],
        };
      case 'week':
        return { 
          termId: this.terms.length > 0 ? this.terms[0].id : null, 
          weekNumber: 1 
        };
      case 'lesson':
        return {
          title: '',
          description: '',
          weekId: this.weeks.length > 0 ? this.weeks[0].id : null,
          posterFile: null,
          videoFile: null
        };
      default:
        return {};
    }
  }

  // ===== Resource Management =====
  async manageResources(lesson: Lesson) {
    this.selectedLesson = lesson;
    if (lesson.id !== undefined) {
      await this.loadLessonResources(lesson.id);
    }
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    this.resourceModalOpen = true;
  }

  closeResourceModal() {
    this.resourceModalOpen = false;
<<<<<<< HEAD
    this.selectedSubject = null;
    this.subjectResources = [];
  }

  // Update the openAddResource method:
  openAddResource() {
    this.editingResource = null;

    // Find the yearSubjectId for the selected subject
    const yearSubject = this.yearSubjects.find(ys =>
      ys.subject.id === this.selectedSubject?.id
    );

    this.resourceForm = {
      title: '',
      fileUrl: '',
      yearSubjectId: yearSubject ? yearSubject.id : null
=======
    this.selectedLesson = null;
    this.lessonResources = [];
  }

  openAddResource() {
    this.editingResource = null;
    this.resourceForm = {
      title: '',
      file: null,
      lessonId: this.selectedLesson?.id,
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    };
    this.resourceFormOpen = true;
  }

<<<<<<< HEAD

  // Update the editResource method:
  editResource(resource: Resource) {
    this.editingResource = resource;
    this.resourceForm = {
      title: resource.title,
      fileUrl: resource.fileUrl,
      yearSubjectId: resource.yearSubjectId
    };
    this.resourceFormOpen = true;
=======
  async loadLessonResources(lessonId: number): Promise<void> {
    try {
      this.lessonResources = (await this.contentService.getLessonResources(lessonId).toPromise()) || [];
    } catch (error) {
      console.error('Error loading lesson resources:', error);
      Swal.fire('Error', this.extractEnglishError(error), 'error');
    }
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
  }

  closeResourceForm() {
    this.resourceFormOpen = false;
    this.editingResource = null;
  }

<<<<<<< HEAD

  // Update the saveResource method to use the correct API structure:
  // Update the saveResource method in the component
  async saveResource() {
    try {
      // Prepare the data in the required format
      const resourceData = {
        title: this.resourceForm.title,
        fileUrl: this.resourceForm.fileUrl,
        yearSubjectId: this.resourceForm.yearSubjectId
      };

      if (this.editingResource) {
        // For update, include the id in the request body if needed by your API
        // Or just send the partial update data
        const updateData = {
          ...resourceData,
          id: this.editingResource.id // Include ID if your API requires it
        };

        await this.contentService.updateResource(this.editingResource.id, updateData).toPromise();

        // Update local state
        this.subjectResources = this.subjectResources.map(r =>
          r.id === this.editingResource!.id ? { ...r, ...resourceData } : r
        );
      } else {
        // For create, just send the basic data
        const newResource = await this.contentService.addResource(resourceData).toPromise();
        if (newResource) this.subjectResources.push(newResource);
      }

      this.closeResourceForm();
      Swal.fire('Success', `Resource ${this.editingResource ? 'updated' : 'added'} successfully`, 'success');
    } catch (error) {
      console.error('Error saving resource:', error);
      Swal.fire('Error', `Failed to ${this.editingResource ? 'update' : 'add'} resource`, 'error');
=======
  async saveResource() {
    try {
      if (!this.resourceForm.title || !this.resourceForm.file || !this.resourceForm.lessonId) {
        Swal.fire('Error', 'Please fill all required resource fields.', 'error');
        return;
      }

      const newResource = await this.contentService.addResource(
        this.resourceForm.title,
        this.resourceForm.lessonId,
        this.resourceForm.file
      ).toPromise();
      
      if (newResource) this.lessonResources.push(newResource);

      this.closeResourceForm();
      Swal.fire('Success', 'Resource added successfully', 'success');
    } catch (error) {
      console.error('Error saving resource:', error);
      Swal.fire('Error', this.extractEnglishError(error), 'error');
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    }
  }

  async deleteResource(resource: Resource) {
    const result = await Swal.fire({
      title: 'Delete this resource?',
      text: 'Are you sure you want to delete this resource?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
<<<<<<< HEAD
      cancelButtonText: 'Cancel'
=======
      cancelButtonText: 'Cancel',
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    });

    if (result.isConfirmed) {
      try {
<<<<<<< HEAD
        await this.contentService.deleteResource(resource.id).toPromise();
        this.subjectResources = this.subjectResources.filter(r => r.id !== resource.id);
        Swal.fire('Success', 'Resource deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting resource:', error);
        Swal.fire('Error', 'Failed to delete resource', 'error');
=======
        if (resource.id !== undefined) {
          await this.contentService.deleteResource(resource.id).toPromise();
          this.lessonResources = this.lessonResources.filter(
            (r) => r.id !== resource.id
          );
          Swal.fire('Success', 'Resource deleted successfully', 'success');
        } else {
          throw new Error('Resource id is undefined');
        }
      } catch (error) {
        console.error('Error deleting resource:', error);
        Swal.fire('Error', this.extractEnglishError(error), 'error');
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
      }
    }
  }

  // ===== Preview =====
  openLessonPreview(lesson: Lesson) {
    const safe: SafeResourceUrl | undefined = lesson.videoUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(lesson.videoUrl)
      : undefined;
    this.preview = { ...lesson, type: 'lesson', safeVideoUrl: safe };
    this.previewOpen = true;
  }

  openCategoryView(category: Category) {
    this.preview = { ...category, type: 'category' };
    this.previewOpen = true;
  }

<<<<<<< HEAD
  closePreview() { this.previewOpen = false; }

  // ===== Relations / navigate to children tab =====
  viewChildren(type: 'year' | 'subject' | 'term' | 'week', entity: any) {
    switch (type) {
      case 'year':
        this.filters.yearId = entity.id;
        this.activateTab('tab-subjects');
        break;
      case 'subject':
        this.filters.yearId = this.getYearIdForSubject(entity.id);
        this.filters.subjectId = entity.id;
        this.activateTab('tab-terms');
        break;
      case 'term':
        this.filters.yearId = this.getYearIdForTerm(entity.yearSubjectId);
        this.filters.subjectId = this.getSubjectIdForTerm(entity.yearSubjectId);
        this.filters.termId = entity.id;
        this.activateTab('tab-weeks');
        break;
      case 'week':
        this.filters.termId = entity.termId;
        this.filters.weekId = entity.id;
        this.activateTab('tab-lessons');
        break;
    }
    this.resetPaging();
  }

  // Activate bootstrap tab by id (data-bs-target)
  activateTab(tabPaneId: string) {
    const trigger = document.querySelector<HTMLElement>(`[data-bs-target="#${tabPaneId}"]`);
    if (trigger && (window as any).bootstrap) {
      const tab = new (window as any).bootstrap.Tab(trigger);
      tab.show();
=======
  closePreview() {
    this.previewOpen = false;
  }

  // ===== File Handling =====
  onFileChange(event: any, field: string) {
    if (event.target.files && event.target.files.length > 0) {
      this.form[field] = event.target.files[0];
    }
  }

  onResourceFileChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.resourceForm.file = event.target.files[0];
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
    }
  }

  // ===== utils =====
<<<<<<< HEAD
  capitalize(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
=======
  capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

<<<<<<< HEAD
  // Add this method to handle week numbers input from the form
  onWeekNumbersInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.form.weekNumbers = input
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));
  }

  getYearSubjectById(id: Id | null | undefined): YearSubject | undefined {
    if (id == null) return undefined;
    return this.yearSubjects.find(ys => ys.id === id);
  }

  getYearSubjectName(yearSubjectId: number): string {
    const yearSubject = this.yearSubjects.find(ys => ys.id === yearSubjectId);
    return yearSubject ? `Year ${yearSubject.yearNumber} - ${yearSubject.subject.name}` : 'Unknown';
  }


=======
getSubjectIdFromTermId(termId: Id): Id | null {
  const term = this.terms.find((t) => t.id === termId);
  return term ? term.subjectId : null;
}


getTeacherNameById(id: number): string {
  const teacher = this.teachers.find(t => t.id === id);
  return teacher ? teacher.userName : 'Unknown Teacher';
}
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
}