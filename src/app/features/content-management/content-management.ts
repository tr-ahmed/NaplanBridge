import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

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
  YearSubject,
  Teacher,
  Resource,
} from '../../core/services/content.service';

type Id = number;

@Component({
  selector: 'app-content-management',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './content-management.html',
  styleUrls: ['./content-management.scss'],
})
export class ContentManagementComponent implements OnInit {
  sidebarCollapsed = false;
  userName = 'Admin User';

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // ===== Data stores =====
  years: Year[] = [];
  subjects: Subject[] = [];
  terms: Term[] = [];
  weeks: Week[] = [];
  lessons: Lesson[] = [];
  categories: Category[] = [];
  yearSubjects: YearSubject[] = [];
  teachers: Teacher[] = [];
  subjectResources: Resource[] = [];

  // ===== Stats =====
  stats = {
    years: 0,
    subjects: 0,
    terms: 0,
    weeks: 0,
    lessons: 0,
    categories: 0,
  };

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
    yearId: null,
    subjectId: null,
    termId: null,
    weekId: null,
    type: '',
    status: '',
    categoryId: null,
  };

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

  yearPage = 1;
  subjectPage = 1;
  termPage = 1;
  weekPage = 1;
  lessonPage = 1;
  categoryPage = 1;

  filteredYears: Year[] = [];
  filteredSubjects: Subject[] = [];
  filteredTerms: Term[] = [];
  filteredWeeks: Week[] = [];
  filteredLessons: Lesson[] = [];
  filteredCategories: Category[] = [];

  pagedYears: Year[] = [];
  pagedSubjects: Subject[] = [];
  pagedTerms: Term[] = [];
  pagedWeeks: Week[] = [];
  pagedLessons: Lesson[] = [];
  pagedCategories: Category[] = [];

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

  // ===== Modals =====
  isFormOpen = false;
  formMode: 'add' | 'edit' = 'add';
  entityType: 'year' | 'subject' | 'term' | 'week' | 'lesson' | 'category' =
    'year';
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
  selectedSubject: Subject | null = null;
  editingResource: Resource | null = null;
  // In the component class, update the resourceForm initialization:
  resourceForm: any = {
    title: '',
    fileUrl: '',
    yearSubjectId: null,
  };

  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    this.loadAllFromAPI();
  }

// دالة محسنة لاستخراج الرسائل الإنجليزية من الأخطاء
private extractEnglishError(error: any): string {
  // إذا كان الخطأ يحتوي على originalError والذي بدوره يحتوي على error نصي
  if (error.originalError && error.originalError.error && typeof error.originalError.error === 'string') {
    return error.originalError.error;
  }
  
  // إذا كان الخطأ يحتوي على خاصية error نصية مباشرة
  if (error.error && typeof error.error === 'string') {
    return error.error;
  }
  
  // إذا كان الخطأ يحتوي على خاصية message نصية
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }
  
  // إذا كان الخطأ نصاً مباشراً
  if (typeof error === 'string') {
    return error;
  }
  
  // إذا كان الخطأ يحتوي على nested error object
  if (error.originalError && error.originalError.error && typeof error.originalError.error === 'object') {
    // تحقق من الخصائص الشائعة في الكائن المتداخل
    const possibleProperties = ['message', 'error', 'detail', 'title', 'reason'];
    for (const prop of possibleProperties) {
      if (error.originalError.error[prop] && typeof error.originalError.error[prop] === 'string') {
        return error.originalError.error[prop];
      }
    }
  }
  
  // إذا كان الخطأ يحتوي على تفاصيل إضافية
  if (error.details && typeof error.details === 'string') {
    return error.details;
  }
  
  // إذا لم نستطع استخراج رسالة، نعيد رسالة افتراضية
  return 'An unknown error occurred. Please try again.';
}

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
        this.loadCategories(),
      ]);

      // Load yearSubjects (depends on years)
      await this.loadYearSubjects();

      // Load terms first, then weeks (weeks depend on terms)
      await this.loadTerms();
      await this.loadWeeks();

      // Finally refresh UI state
      this.refreshAll();
    } catch (error) {
      console.error('Error loading data from API:', error);
      Swal.fire('Error', this.extractEnglishError(error), 'error');
    }
  }

  async loadYears(): Promise<void> {
    try {
      this.years = (await this.contentService.getYears().toPromise()) || [];
    } catch (error) {
      console.error('Error loading years:', error);
      throw error;
    }
  }

  async loadSubjects(): Promise<void> {
    try {
      this.subjects =
        (await this.contentService.getSubjects().toPromise()) || [];
    } catch (error) {
      console.error('Error loading subjects:', error);
      throw error;
    }
  }

  async loadTeachers(): Promise<void> {
    try {
      const users = (await this.contentService.getTeachers().toPromise()) || [];
      this.teachers = users
        .filter((u) => u.roles?.some((r) => r.toLowerCase() === 'teacher'))
        .map((u) => ({
          id: u.id,
          name: u.userName,
          roles: u.roles,
        }));
    } catch (error) {
      console.error('Error loading teachers:', error);
      throw error;
    }
  }

  async loadLessons(): Promise<void> {
    try {
      this.lessons = (await this.contentService.getLessons().toPromise()) || [];
    } catch (error) {
      console.error('Error loading lessons:', error);
      throw error;
    }
  }

  async loadCategories(): Promise<void> {
    try {
      this.categories =
        (await this.contentService.getCategories().toPromise()) || [];
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  }

  async loadYearSubjects(): Promise<void> {
    try {
      this.yearSubjects = [];

      const promises = this.years.map((year) =>
        this.contentService
          .getYearSubjectsByYear(year.id)
          .toPromise()
          .then((r) => r || [])
          .catch((err) => {
            console.error(
              `Error loading yearSubjects for year ${year.id}:`,
              err
            );
            return [];
          })
      );

      const results = await Promise.all(promises);
      this.yearSubjects = results.flat();
    } catch (error) {
      console.error('Error loading year subjects:', error);
      throw error;
    }
  }

  async loadTerms(): Promise<void> {
    try {
      this.terms = [];

      const promises = this.yearSubjects.map((ys) =>
        this.contentService
          .getTermsByYearSubject(ys.id)
          .toPromise()
          .then((r) => r || [])
          .catch((err) => {
            console.error(`Error loading terms for yearSubject ${ys.id}:`, err);
            return [];
          })
      );

      const results = await Promise.all(promises);
      this.terms = results.flat();
    } catch (error) {
      console.error('Error loading terms:', error);
      throw error;
    }
  }

  async loadWeeks(): Promise<void> {
    try {
      this.weeks = [];

      const promises = this.terms.map((term) =>
        this.contentService
          .getWeeksByTerm(term.id)
          .toPromise()
          .then((r) => r || [])
          .catch((err) => {
            console.error(`Error loading weeks for term ${term.id}:`, err);
            return [];
          })
      );

      const results = await Promise.all(promises);
      this.weeks = results.flat();
    } catch (error) {
      console.error('Error loading weeks:', error);
      throw error;
    }
  }

  async loadSubjectResources(subjectId: number): Promise<void> {
    try {
      this.subjectResources =
        (await this.contentService
          .getSubjectResources(subjectId)
          .toPromise()) || [];
    } catch (error) {
      console.error('Error loading subject resources:', error);
      Swal.fire('Error', this.extractEnglishError(error), 'error');
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // ===== Helpers =====
  trackById = (_: number, item: any) => item.id;

  numberYear(id: Id | undefined | null) {
    return this.years.find((y) => y.id === id)?.number || 0;
  }
  nameSubject(id: Id | undefined | null) {
    return this.subjects.find((s) => s.id === id)?.name || '';
  }
  numberTerm(id: Id | undefined | null) {
    return this.terms.find((t) => t.id === id)?.number || 0;
  }
  numberWeek(id: Id | undefined | null) {
    return this.weeks.find((w) => w.id === id)?.number || 0;
  }
  nameCategory(id: Id | undefined | null) {
    return this.categories.find((c) => c.id === id)?.name || '';
  }
  nameTeacher(id: Id | undefined | null) {
    return this.teachers.find((t) => t.id === id)?.name || '';
  }

  getSubjectCountForCategory(categoryId: Id): number {
    return this.subjects.filter((s) => s.categoryId === categoryId).length;
  }

  getTermIdFromWeekId(weekId: Id): Id | null {
    const week = this.weeks.find((w) => w.id === weekId);
    return week ? week.termId : null;
  }

  getSubjectIdFromWeekId(weekId: Id): Id | null {
    const week = this.weeks.find((w) => w.id === weekId);
    if (!week) return null;

    const term = this.terms.find((t) => t.id === week.termId);
    if (!term) return null;

    const yearSubject = this.yearSubjects.find(
      (ys) => ys.id === term.yearSubjectId
    );
    return yearSubject ? yearSubject.subject.id : null;
  }

  getYearIdFromTermId(termId: Id): Id | null {
    const term = this.terms.find((t) => t.id === termId);
    if (!term) return null;

    const yearSubject = this.yearSubjects.find(
      (ys) => ys.id === term.yearSubjectId
    );
    return yearSubject ? yearSubject.yearId : null;
  }

  // ===== Filtering / Paging =====
  onFilterChange() {
    this.resetPaging();
  }

  private getYearIdForSubject(subjectId: Id): Id | null {
    const yearSubject = this.yearSubjects.find(
      (ys) => ys.subject?.id === subjectId
    );
    return yearSubject ? yearSubject.yearId : null;
  }

  private getYearIdForTerm(yearSubjectId: Id): Id | null {
    const yearSubject = this.yearSubjects.find((ys) => ys.id === yearSubjectId);
    return yearSubject ? yearSubject.yearId : null;
  }

  private getSubjectIdForTerm(yearSubjectId: Id): Id | null {
    const yearSubject = this.yearSubjects.find((ys) => ys.id === yearSubjectId);
    return yearSubject ? yearSubject.subject?.id : null;
  }

  private getYearIdForLesson(weekId: Id): Id | null {
    const week = this.weeks.find((w) => w.id === weekId);
    if (!week) return null;

    const term = this.terms.find((t) => t.id === week.termId);
    if (!term) return null;

    return this.getYearIdForTerm(term.yearSubjectId);
  }

  private getSubjectIdForLesson(weekId: Id): Id | null {
    const week = this.weeks.find((w) => w.id === weekId);
    if (!week) return null;

    const term = this.terms.find((t) => t.id === week.termId);
    if (!term) return null;

    return this.getSubjectIdForTerm(term.yearSubjectId);
  }

  resetPaging() {
    this.yearPage =
      this.subjectPage =
      this.termPage =
      this.weekPage =
      this.lessonPage =
      this.categoryPage =
        1;
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
    this.filteredYears = this.years.filter(
      (y) => !q || y.number.toString().includes(q)
    );

    // SUBJECTS
    this.filteredSubjects = this.subjects.filter((s) => {
      const byYear = this.filters.yearId
        ? this.getYearIdForSubject(s.id) === this.filters.yearId
        : true;
      const byCategory = this.filters.categoryId
        ? s.categoryId === this.filters.categoryId
        : true;
      const bySearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      return byYear && byCategory && bySearch;
    });

    // TERMS
    this.filteredTerms = this.terms.filter((t) => {
      const byYear = this.filters.yearId
        ? this.getYearIdForTerm(t.yearSubjectId) === this.filters.yearId
        : true;
      const bySubject = this.filters.subjectId
        ? this.getSubjectIdForTerm(t.yearSubjectId) === this.filters.subjectId
        : true;
      const bySearch = !q || t.number.toString().includes(q);
      return byYear && bySubject && bySearch;
    });

    // WEEKS
    this.filteredWeeks = this.weeks.filter((w) => {
      const term = this.terms.find((t) => t.id === w.termId);
      const byYear = this.filters.yearId
        ? term &&
          this.getYearIdForTerm(term.yearSubjectId) === this.filters.yearId
        : true;
      const bySubject = this.filters.subjectId
        ? term &&
          this.getSubjectIdForTerm(term.yearSubjectId) ===
            this.filters.subjectId
        : true;
      const byTerm = this.filters.termId
        ? w.termId === this.filters.termId
        : true;
      const bySearch = !q || w.number.toString().includes(q);
      return !!term && byYear && bySubject && byTerm && bySearch;
    });

    // LESSONS
    this.filteredLessons = this.lessons.filter((l) => {
      const byTypeFilter = this.filters.type
        ? this.filters.type === 'lesson'
        : true;
      const byYear = this.filters.yearId
        ? this.getYearIdForLesson(l.weekId) === this.filters.yearId
        : true;
      const bySubject = this.filters.subjectId
        ? this.getSubjectIdForLesson(l.weekId) === this.filters.subjectId
        : true;
      const byWeek = this.filters.weekId
        ? l.weekId === this.filters.weekId
        : true;
      const bySearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q);
      return byTypeFilter && byYear && bySubject && byWeek && bySearch;
    });

    // CATEGORIES
    this.filteredCategories = this.categories.filter((c) => {
      const byTypeFilter = this.filters.type
        ? this.filters.type === 'category'
        : true;
      const bySearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      return byTypeFilter && bySearch;
    });
  }

  updatePaged() {
    this.pagedYears = this.slicePage(this.filteredYears, this.yearPage);
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
  }

  slicePage<T>(arr: T[], page: number) {
    const start = (page - 1) * this.pageSize;
    return arr.slice(start, start + this.pageSize);
  }

  updateStats() {
    this.stats = {
      years: this.years.length,
      subjects: this.subjects.length,
      terms: this.terms.length,
      weeks: this.weeks.length,
      lessons: this.lessons.length,
      categories: this.categories.length,
    };
  }

  // Paging actions
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
  openAdd(type: 'year' | 'subject' | 'term' | 'week' | 'lesson' | 'category') {
    this.formMode = 'add';
    this.entityType = type;
    this.entityTitle = this.capitalize(type);

    if (type === 'term') {
      this.form = {
        number: 0,
        yearSubjectId:
          this.yearSubjects.length > 0 ? this.yearSubjects[0].id : null,
      };
    } else {
      this.form = this.defaultFormFor(type);
    }

    this.isFormOpen = true;
  }

  openEdit(
    type: 'year' | 'subject' | 'term' | 'week' | 'lesson' | 'category',
    entity: any
  ) {
    this.formMode = 'edit';
    this.entityType = type;
    this.entityTitle = this.capitalize(type);
    this.form = { ...entity };
    this.isFormOpen = true;
  }

  closeForm() {
    this.isFormOpen = false;
  }

  async submitForm() {
    try {
      this.hydrateNamesBeforeSave();

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
        text: `The ${this.entityType} has been ${
          this.formMode === 'add' ? 'added' : 'updated'
        } successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error saving entity:', error);
      Swal.fire('Error', this.extractEnglishError(error), 'error');
    }
  }

private async addEntity(): Promise<void> {
  switch (this.entityType) {
    case 'year': {
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
  const { title, description, weekId, posterFile, videoFile } = this.form;

  if (!title || !description || weekId == null || !posterFile || !videoFile) {
    Swal.fire('Error', 'Please fill all required lesson fields.', 'error');
    throw new Error('Validation failed');
  }

  const newLesson = await this.contentService
    .addLesson(title, description, weekId, posterFile, videoFile)
    .toPromise();
  if (newLesson) this.lessons.push(newLesson);
  break;
}

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
    default:
      throw new Error('Unknown entity type');
  }
}

private async updateEntity() {
  switch (this.entityType) {
    case 'year':
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
case 'lesson': {
  const { id, title, description, weekId, posterFile, videoFile } = this.form;

  if (!title || !description || weekId == null) {
    Swal.fire('Error', 'Please fill all required lesson fields.', 'error');
    throw new Error('Validation failed');
  }

  await this.contentService
    .updateLesson(id, title, description, weekId, posterFile, videoFile)
    .toPromise();

  this.lessons = this.lessons.map(x => x.id === id ? { ...x, title, description, weekId } : x);
  break;
}

    case 'category':
      await this.contentService.updateCategory(this.form.id, this.form).toPromise();
      this.categories = this.categories.map(x => x.id === this.form.id ? this.form : x);
      break;
  }
}


  async confirmDelete(
    type: 'year' | 'subject' | 'term' | 'week' | 'lesson' | 'category',
    entity: any
  ) {
    const result = await Swal.fire({
      title: `Delete this ${type}?`,
      text: 'Are you sure you want to delete this item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        switch (type) {
          case 'year':
            await this.contentService.deleteYear(entity.id).toPromise();
            this.years = this.years.filter((x) => x.id !== entity.id);
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
            break;
          case 'category':
            await this.contentService.deleteCategory(entity.id).toPromise();
            this.categories = this.categories.filter((x) => x.id !== entity.id);
            break;
        }

        this.refreshAll();
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'The item has been deleted.',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('Error deleting entity:', error);
        Swal.fire('Error', this.extractEnglishError(error), 'error');
      }
    }
  }

  defaultFormFor(type: string) {
    switch (type) {
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
          color: '',
        };
      case 'term':
        return {
          number: 0,
          yearSubjectId:
            this.yearSubjects.length > 0 ? this.yearSubjects[0].id : null,
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
          objectives: '',
        };
      case 'category':
        return {
          name: '',
          description: '',
          color: '',
        };
      default:
        return {};
    }
  }

  hydrateNamesBeforeSave() {
    // No-op: server handles relations by IDs
  }

  // ===== Resource Management =====
  async manageResources(lesson: Lesson) {
    this.selectedLesson = lesson;
    if (lesson.id !== undefined) {
      await this.loadLessonResources(lesson.id);
    }
    this.resourceModalOpen = true;
  }

  closeResourceModal() {
    this.resourceModalOpen = false;
    this.selectedSubject = null;
    this.subjectResources = [];
  }

  // تحديث نموذج إضافة مورد
  openAddResource() {
    this.editingResource = null;
    this.resourceForm = {
      title: '',
      fileUrl: '',
      lessonId: this.selectedLesson?.id, // تغيير من subjectId إلى lessonId
    };
    this.resourceFormOpen = true;
  }
  // تحديث طريقة تحميل موارد الدرس
  async loadLessonResources(lessonId: number): Promise<void> {
    try {
      this.lessonResources =
        (await this.contentService.getLessonResources(lessonId).toPromise()) ||
        [];
    } catch (error) {
      console.error('Error loading lesson resources:', error);
      Swal.fire('Error', this.extractEnglishError(error), 'error');
    }
  }

  closeResourceForm() {
    this.resourceFormOpen = false;
    this.editingResource = null;
  }

  // Update the saveResource method in the component
  async saveResource() {
    try {
      const resourceData = {
        title: this.resourceForm.title,
        fileUrl: this.resourceForm.fileUrl,
        lessonId: this.resourceForm.lessonId, // تغيير من subjectId إلى lessonId
      };

      if (this.editingResource) {
        await this.contentService
          .updateResource(this.editingResource.id!, resourceData)
          .toPromise();
        this.lessonResources = this.lessonResources.map((r) =>
          r.id === this.editingResource!.id ? { ...r, ...resourceData } : r
        );
      } else {
        const newResource = await this.contentService
          .addResource(resourceData)
          .toPromise();
        if (newResource) this.lessonResources.push(newResource);
      }

      this.closeResourceForm();
      Swal.fire(
        'Success',
        `Resource ${this.editingResource ? 'updated' : 'added'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error saving resource:', error);
      Swal.fire('Error', this.extractEnglishError(error), 'error');
    }
  }

  selectedLesson: Lesson | null = null;

  lessonResources: Resource[] = [];

  async deleteResource(resource: Resource) {
    const result = await Swal.fire({
      title: 'Delete this resource?',
      text: 'Are you sure you want to delete this resource?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        if (resource.id !== undefined) {
          await this.contentService.deleteResource(resource.id).toPromise();
          this.subjectResources = this.subjectResources.filter(
            (r) => r.id !== resource.id
          );
          Swal.fire('Success', 'Resource deleted successfully', 'success');
        } else {
          throw new Error('Resource id is undefined');
        }
      } catch (error) {
        console.error('Error deleting resource:', error);
        Swal.fire('Error', this.extractEnglishError(error), 'error');
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

  closePreview() {
    this.previewOpen = false;
  }

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
    const trigger = document.querySelector<HTMLElement>(
      `[data-bs-target="#${tabPaneId}"]`
    );
    if (trigger && (window as any).bootstrap) {
      const tab = new (window as any).bootstrap.Tab(trigger);
      tab.show();
    }
  }

  // ===== utils =====
  capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Add this method to handle week numbers input from the form
  onWeekNumbersInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.form.weekNumbers = input
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }

  getYearSubjectById(id: Id | null | undefined): YearSubject | undefined {
    if (id == null) return undefined;
    return this.yearSubjects.find((ys) => ys.id === id);
  }

  getYearSubjectName(yearSubjectId: number): string {
    const yearSubject = this.yearSubjects.find((ys) => ys.id === yearSubjectId);
    return yearSubject
      ? `Year ${yearSubject.yearNumber} - ${yearSubject.subject.name}`
      : 'Unknown';
  }

onFileChange(event: any, field: 'posterFile' | 'videoFile') {
  if (event.target.files && event.target.files.length > 0) {
    this.form[field] = event.target.files[0];
  }
}

// في المكون TypeScript
formErrors: any = {};

validateField(fieldName: string, value: any) {
  switch (fieldName) {
    case 'name':
      if (!value || value.trim().length < 2) {
        this.formErrors.name = 'Name is required and must be at least 2 characters';
      } else {
        delete this.formErrors.name;
      }
      break;

    case 'level':
      if (!value) {
        this.formErrors.level = 'Level is required';
      } else {
        delete this.formErrors.level;
      }
      break;

    case 'teacherId':
      if (!value) {
        this.formErrors.teacherId = 'Teacher is required';
      } else {
        delete this.formErrors.teacherId;
      }
      break;

    case 'categoryId':
      if (!value) {
        this.formErrors.categoryId = 'Category is required';
      } else {
        delete this.formErrors.categoryId;
      }
      break;

    case 'originalPrice':
      if (value === null || value === undefined || value < 0) {
        this.formErrors.originalPrice = 'Price must be a positive number';
      } else {
        delete this.formErrors.originalPrice;
      }
      break;

    case 'discountPercentage':
      if (value !== null && value !== undefined && (value < 0 || value > 100)) {
        this.formErrors.discountPercentage = 'Discount must be between 0 and 100';
      } else {
        delete this.formErrors.discountPercentage;
      }
      break;

    case 'duration':
      if (!value || value <= 0) {
        this.formErrors.duration = 'Duration must be greater than 0';
      } else {
        delete this.formErrors.duration;
      }
      break;

    case 'yearId':
      if (!value) {
        this.formErrors.yearId = 'Year is required';
      } else {
        delete this.formErrors.yearId;
      }
      break;

    case 'termNumber':
      if (!value || value < 1 || value > 4) {
        this.formErrors.termNumber = 'Term number must be between 1 and 4';
      } else {
        delete this.formErrors.termNumber;
      }
      break;

    case 'weekNumbers':
      if (!value || value.length === 0) {
        this.formErrors.weekNumbers = 'At least one week number is required';
      } else if (!value.every((n: number) => Number.isInteger(n) && n > 0)) {
        this.formErrors.weekNumbers = 'Week numbers must be positive integers';
      } else {
        delete this.formErrors.weekNumbers;
      }
      break;

    case 'imageUrl':
      if (value && !/^https?:\/\/.+\..+/.test(value)) {
        this.formErrors.imageUrl = 'Image URL must be valid (http/https)';
      } else {
        delete this.formErrors.imageUrl;
      }
      break;

    case 'description':
      if (!value || value.trim().length < 10) {
        this.formErrors.description = 'Description is required and must be at least 10 characters';
      } else {
        delete this.formErrors.description;
      }
      break;

    default:
      break;
  }
}


isFormValid(): boolean {
  return Object.keys(this.formErrors).length === 0;
}




}