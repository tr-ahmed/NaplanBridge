import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

import Swal from 'sweetalert2';

type Id = number;

interface Year { id: Id; number: number; }
interface Subject { 
  id: Id; 
  name: string; 
  description: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  imageUrl: string;
  level: string;
  duration: number;
  teacherName: string;
  studentCount: number;
  weekNumber: number;
  termNumber: number;
  categoryName: string;
  categoryDescription: string;
  categoryId: number;
  teacherId: number;
}
interface Term { id: Id; number: number; yearSubjectId: Id; }
interface Week { id: Id; number: number; termId: Id; }
interface Lesson {
  id: Id; 
  title: string; 
  videoUrl: string;
  description: string;
  weekId: Id;
}
interface Category {
  id: Id; 
  name: string; 
  description: string;
}
interface YearSubject {
  id: Id;
  yearId: Id;
  yearNumber: number;
  subject: Subject;
}

@Component({
  selector: 'app-content-management',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './content-management.html',
  styleUrls: ['./content-management.scss']
})
export class ContentManagementComponent implements OnInit {
  sidebarCollapsed = false;
  userName = 'Admin User';
  yearPages: any;
  courses: any;

  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }

  // ===== Data stores =====
  years: Year[] = [];
  subjects: Subject[] = [];
  terms: Term[] = [];
  weeks: Week[] = [];
  lessons: Lesson[] = [];
  categories: Category[] = [];
  yearSubjects: YearSubject[] = [];
  teachers: { id: number; name: string; roles: string[] }[] = [];

  // ===== Stats =====
  stats = { years: 0, subjects: 0, terms: 0, weeks: 0, lessons: 0, categories: 0 };

  // ===== Filters/Search =====
  filters: {
    status?: any; yearId: Id|null; subjectId: Id|null; termId: Id|null; weekId: Id|null; type: ''|'lesson'|'category' 
  } = {
    yearId: null,
    subjectId: null,
    termId: null,
    weekId: null,
    type: '',
    status: ''
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

  yearPage = 1; subjectPage = 1; termPage = 1; weekPage = 1; lessonPage = 1; categoryPage = 1;

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

  get yearTotalPages()   { return Math.max(1, Math.ceil(this.filteredYears.length   / this.pageSize)); }
  get subjectTotalPages(){ return Math.max(1, Math.ceil(this.filteredSubjects.length/ this.pageSize)); }
  get termTotalPages()   { return Math.max(1, Math.ceil(this.filteredTerms.length   / this.pageSize)); }
  get weekTotalPages()   { return Math.max(1, Math.ceil(this.filteredWeeks.length   / this.pageSize)); }
  get lessonTotalPages() { return Math.max(1, Math.ceil(this.filteredLessons.length / this.pageSize)); }
  get categoryTotalPages() { return Math.max(1, Math.ceil(this.filteredCategories.length / this.pageSize)); }

  get yStart(){ return this.filteredYears.length   ? (this.yearPage-1)*this.pageSize+1 : 0; }
  get yEnd()  { return Math.min(this.yearPage*this.pageSize, this.filteredYears.length); }
  get sStart(){ return this.filteredSubjects.length? (this.subjectPage-1)*this.pageSize+1 : 0; }
  get sEnd()  { return Math.min(this.subjectPage*this.pageSize, this.filteredSubjects.length); }
  get tStart(){ return this.filteredTerms.length   ? (this.termPage-1)*this.pageSize+1 : 0; }
  get tEnd()  { return Math.min(this.termPage*this.pageSize, this.filteredTerms.length); }
  get wStart(){ return this.filteredWeeks.length   ? (this.weekPage-1)*this.pageSize+1 : 0; }
  get wEnd()  { return Math.min(this.weekPage*this.pageSize, this.filteredWeeks.length); }
  get lStart(){ return this.filteredLessons.length ? (this.lessonPage-1)*this.pageSize+1 : 0; }
  get lEnd()  { return Math.min(this.lessonPage*this.pageSize, this.filteredLessons.length); }
  get cStart(){ return this.filteredCategories.length ? (this.categoryPage-1)*this.pageSize+1 : 0; }
  get cEnd()  { return Math.min(this.categoryPage*this.pageSize, this.filteredCategories.length); }

  // ===== Modals =====
  isFormOpen = false;
  formMode: 'add' | 'edit' = 'add';
  entityType: 'year'|'subject'|'term'|'week'|'lesson'|'category' = 'year';
  entityTitle = '';
  form: any = {};

  previewOpen = false;
  preview: any = {};

  activeTab: string = 'years';
  categoryTab: string = 'lessons';

  dropdownOpen = false;

  private apiBaseUrl = environment.apiBaseUrl || 'https://naplanbridge.runasp.net';

  constructor(
    private sanitizer: DomSanitizer, 
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadAllFromAPI();
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // ===== API Calls =====
  async loadAllFromAPI() {
    try {
      // Load years first
      await this.loadYears();

      // Load subjects, teachers, lessons, categories in parallel (they don't depend on terms/weeks)
      await Promise.all([
        this.loadSubjects(),
        this.loadTeachers(),
        this.loadLessons(),
        this.loadCategories()
      ]);

      // Load yearSubjects (depends on years)
      await this.loadYearSubjects();

      // IMPORTANT: load terms first, then weeks (weeks depend on terms)
      await this.loadTerms();
      await this.loadWeeks();

      // Finally refresh UI state
      this.refreshAll();
    } catch (error) {
      console.error('Error loading data from API:', error);
      Swal.fire('Error', 'Failed to load data from server', 'error');
    }
  }

  async loadYears(): Promise<void> {
    try {
      const headers = this.getHeaders();
      this.years = await this.http.get<Year[]>(`${this.apiBaseUrl}/Years`, { headers }).toPromise() || [];
    } catch (error) {
      console.error('Error loading years:', error);
      throw error;
    }
  }

  async loadSubjects(): Promise<void> {
    try {
      const headers = this.getHeaders();
      this.subjects = await this.http.get<Subject[]>(`${this.apiBaseUrl}/Subjects`, { headers }).toPromise() || [];
    } catch (error) {
      console.error('Error loading subjects:', error);
      throw error;
    }
  }

  async loadTeachers(): Promise<void> {
    try {
      const headers = this.getHeaders();
      const users = await this.http.get<{ id: number; userName: string; roles: string[] }[]>(
        `${this.apiBaseUrl}/Admin/users-with-roles`,
        { headers }
      ).toPromise() || [];

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
      const headers = this.getHeaders();
      this.lessons = await this.http.get<Lesson[]>(`${this.apiBaseUrl}/Lessons`, { headers }).toPromise() || [];
    } catch (error) {
      console.error('Error loading lessons:', error);
      throw error;
    }
  }

  async loadCategories(): Promise<void> {
    try {
      const headers = this.getHeaders();
      this.categories = await this.http.get<Category[]>(`${this.apiBaseUrl}/Categories`, { headers }).toPromise() || [];
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  }

  async loadYearSubjects(): Promise<void> {
    try {
      const headers = this.getHeaders();
      this.yearSubjects = [];

      // parallelize requests per year for speed (but still await all)
      const promises = this.years.map(year =>
        this.http.get<YearSubject[]>(`${this.apiBaseUrl}/YearSubjects/by-year/${year.id}`, { headers }).toPromise()
          .then(r => r || [])
          .catch(err => { console.error(`Error loading yearSubjects for year ${year.id}:`, err); return []; })
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
      const headers = this.getHeaders();
      this.terms = [];

      // parallelize per yearSubject for speed
      const promises = this.yearSubjects.map(ys =>
        this.http.get<Term[]>(`${this.apiBaseUrl}/Terms/by-yearsubject/${ys.id}`, { headers }).toPromise()
          .then(r => r || [])
          .catch(err => { console.error(`Error loading terms for yearSubject ${ys.id}:`, err); return []; })
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
      const headers = this.getHeaders();
      this.weeks = [];

      // IMPORTANT: terms should already be loaded before calling this method.
      const promises = this.terms.map(term =>
        this.http.get<Week[]>(`${this.apiBaseUrl}/Weeks/by-term/${term.id}`, { headers }).toPromise()
          .then(r => r || [])
          .catch(err => { console.error(`Error loading weeks for term ${term.id}:`, err); return []; })
      );

      const results = await Promise.all(promises);
      this.weeks = results.flat();
    } catch (error) {
      console.error('Error loading weeks:', error);
      throw error;
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // ===== Helpers =====
  trackById = (_: number, item: any) => item.id;

  numberYear(id: Id|undefined|null){ return this.years.find(y=>y.id===id)?.number || 0; }
  nameSubject(id: Id|undefined|null){ return this.subjects.find(s=>s.id===id)?.name || ''; }
  numberTerm(id: Id|undefined|null){ return this.terms.find(t=>t.id===id)?.number || 0; }
  numberWeek(id: Id|undefined|null){ return this.weeks.find(w=>w.id===id)?.number || 0; }
  nameCategory(id: Id|undefined|null){ return this.categories.find(c=>c.id===id)?.name || ''; }
  nameTeacher(id: Id|undefined|null){ return this.teachers.find(t=>t.id===id)?.name || ''; }

  // ===== Filtering / Paging =====
  // Simplify: use refreshAll so behavior is consistent
  onFilterChange() {
    this.resetPaging();
  }

  // Helper methods to get year/subject IDs from relations
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
    this.filteredYears = this.years.filter(y => !q || y.number.toString().includes(q));

    // SUBJECTS
    this.filteredSubjects = this.subjects.filter(s => {
      const byYear = this.filters.yearId ? this.getYearIdForSubject(s.id) === this.filters.yearId : true;
      const bySearch = !q || s.name.toLowerCase().includes(q);
      return byYear && bySearch;
    });

    // TERMS
    this.filteredTerms = this.terms.filter(t => {
      const byYear = this.filters.yearId ? this.getYearIdForTerm(t.yearSubjectId) === this.filters.yearId : true;
      const bySubject = this.filters.subjectId ? this.getSubjectIdForTerm(t.yearSubjectId) === this.filters.subjectId : true;
      const bySearch = !q || t.number.toString().includes(q);
      return byYear && bySubject && bySearch;
    });

    // WEEKS: now consider yearId and subjectId via term -> yearSubject
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
      const bySearch = !q || l.title.toLowerCase().includes(q);
      return byTypeFilter && byYear && bySubject && byWeek && bySearch;
    });

    // CATEGORIES
    this.filteredCategories = this.categories.filter(c => {
      const byTypeFilter = this.filters.type ? this.filters.type === 'category' : true;
      const bySearch = !q || c.name.toLowerCase().includes(q);
      return byTypeFilter && bySearch;
    });
  }

  updatePaged() {
    this.pagedYears    = this.slicePage(this.filteredYears,   this.yearPage);
    this.pagedSubjects = this.slicePage(this.filteredSubjects,this.subjectPage);
    this.pagedTerms    = this.slicePage(this.filteredTerms,   this.termPage);
    this.pagedWeeks    = this.slicePage(this.filteredWeeks,   this.weekPage);
    this.pagedLessons  = this.slicePage(this.filteredLessons, this.lessonPage);
    this.pagedCategories  = this.slicePage(this.filteredCategories, this.categoryPage);
  }

  slicePage<T>(arr: T[], page: number){ const start=(page-1)*this.pageSize; return arr.slice(start, start+this.pageSize); }

  updateStats() {
    this.stats = {
      years: this.years.length,
      subjects: this.subjects.length,
      terms: this.terms.length,
      weeks: this.weeks.length,
      lessons: this.lessons.length,
      categories: this.categories.length
    };
  }

  // Paging actions
  goYearPage(p: number){ if(p>=1 && p<=this.yearTotalPages)   { this.yearPage=p; this.updatePaged(); } }
  goSubjectPage(p: number){ if(p>=1 && p<=this.subjectTotalPages){ this.subjectPage=p; this.updatePaged(); } }
  goTermPage(p: number){ if(p>=1 && p<=this.termTotalPages)   { this.termPage=p; this.updatePaged(); } }
  goWeekPage(p: number){ if(p>=1 && p<=this.weekTotalPages)   { this.weekPage=p; this.updatePaged(); } }
  goLessonPage(p: number){ if(p>=1 && p<=this.lessonTotalPages){ this.lessonPage=p; this.updatePaged(); } }
  goCategoryPage(p: number){ if(p>=1 && p<=this.categoryTotalPages){ this.categoryPage=p; this.updatePaged(); } }

  // ===== Add/Edit =====
  openAdd(type: 'year'|'subject'|'term'|'week'|'lesson'|'category'){
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

  openEdit(type: 'year'|'subject'|'term'|'week'|'lesson'|'category', entity: any){
    this.formMode = 'edit';
    this.entityType = type;
    this.entityTitle = this.capitalize(type);
    this.form = { ...entity };
    this.isFormOpen = true;
  }

  closeForm(){ this.isFormOpen = false; }

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
        text: `The ${this.entityType} has been ${this.formMode === 'add' ? 'added' : 'updated'} successfully.`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error saving entity:', error);
      Swal.fire('Error', `Failed to ${this.formMode} ${this.entityType}`, 'error');
    }
  }

  private async addEntity(): Promise<void> {
    const headers = this.getHeaders();

    switch (this.entityType) {
      case 'year': {
        const { number } = this.form;
        if (number == null) {
          Swal.fire('Error', 'Please provide a year number.', 'error');
          throw new Error('Validation failed');
        }
        const newYear = await this.http.post<Year>(`${this.apiBaseUrl}/Years`, { number }, { headers }).toPromise();
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
          termNumber,
          weekNumbers
        } = this.form;

        if (
          !name ||
          !description ||
          originalPrice == null ||
          discountPercentage == null ||
          !imageUrl ||
          !level ||
          duration == null ||
          categoryId == null ||
          teacherId == null ||
          termNumber == null ||
          !Array.isArray(weekNumbers) || weekNumbers.length === 0
        ) {
          Swal.fire('Error', 'Please fill all required subject fields.', 'error');
          throw new Error('Validation failed');
        }

        const payload = {
          name,
          description,
          originalPrice,
          discountPercentage,
          imageUrl,
          level,
          duration,
          categoryId,
          teacherId,
          termNumber,
          weekNumbers
        };

        const newSubject = await this.http.post<Subject>(`${this.apiBaseUrl}/Subjects`, payload, { headers }).toPromise();
        if (newSubject) this.subjects.push(newSubject);
        break;
      }
      case 'term': {
        const { number, yearSubjectId } = this.form;
        if (number == null || yearSubjectId == null) {
          Swal.fire('Error', 'Please provide term number and yearSubjectId.', 'error');
          throw new Error('Validation failed');
        }
        const newTerm = await this.http.post<Term>(`${this.apiBaseUrl}/Terms`, { number, yearSubjectId }, { headers }).toPromise();
        if (newTerm) this.terms.push(newTerm);
        break;
      }
      case 'week': {
        const { number, termId } = this.form;
        if (number == null || termId == null) {
          Swal.fire('Error', 'Please provide week number and termId.', 'error');
          throw new Error('Validation failed');
        }
        const newWeek = await this.http.post<Week>(`${this.apiBaseUrl}/Weeks`, { number, termId }, { headers }).toPromise();
        if (newWeek) this.weeks.push(newWeek);
        break;
      }
      case 'lesson': {
        const { title, videoUrl, description, weekId } = this.form;
        if (!title || !videoUrl || !description || weekId == null) {
          Swal.fire('Error', 'Please fill all required lesson fields.', 'error');
          throw new Error('Validation failed');
        }
        const payload = { title, videoUrl, description, weekId };
        const newLesson = await this.http.post<Lesson>(`${this.apiBaseUrl}/Lessons`, payload, { headers }).toPromise();
        if (newLesson) this.lessons.push(newLesson);
        break;
      }
      case 'category': {
        const { name, description } = this.form;
        if (!name || !description) {
          Swal.fire('Error', 'Please fill all required category fields.', 'error');
          throw new Error('Validation failed');
        }
        const payload = { name, description };
        const newCategory = await this.http.post<Category>(`${this.apiBaseUrl}/Categories`, payload, { headers }).toPromise();
        if (newCategory) this.categories.push(newCategory);
        break;
      }
      default:
        throw new Error('Unknown entity type');
    }
  }

  private async updateEntity() {
    const headers = this.getHeaders();

    switch (this.entityType) {
      case 'year':
        await this.http.put(`${this.apiBaseUrl}/Years/${this.form.id}`, this.form, { headers }).toPromise();
        this.years = this.years.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'subject':
        await this.http.put(`${this.apiBaseUrl}/Subjects/${this.form.id}`, this.form, { headers }).toPromise();
        this.subjects = this.subjects.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'term':
        await this.http.put(`${this.apiBaseUrl}/Terms/${this.form.id}`, this.form, { headers }).toPromise();
        this.terms = this.terms.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'week':
        await this.http.put(`${this.apiBaseUrl}/Weeks/${this.form.id}`, this.form, { headers }).toPromise();
        this.weeks = this.weeks.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'lesson':
        await this.http.put(`${this.apiBaseUrl}/Lessons/${this.form.id}`, this.form, { headers }).toPromise();
        this.lessons = this.lessons.map(x => x.id === this.form.id ? this.form : x);
        break;
      case 'category':
        await this.http.put(`${this.apiBaseUrl}/Categories/${this.form.id}`, this.form, { headers }).toPromise();
        this.categories = this.categories.map(x => x.id === this.form.id ? this.form : x);
        break;
    }
  }

  async confirmDelete(type: 'year'|'subject'|'term'|'week'|'lesson'|'category', entity: any) {
    const result = await Swal.fire({
      title: `Delete this ${type}?`,
      text: 'Are you sure you want to delete this item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const headers = this.getHeaders();

        switch(type){
          case 'year':
            await this.http.delete(`${this.apiBaseUrl}/Years/${entity.id}`, { headers }).toPromise();
            this.years = this.years.filter(x => x.id !== entity.id);
            break;
          case 'subject':
            await this.http.delete(`${this.apiBaseUrl}/Subjects/${entity.id}`, { headers }).toPromise();
            this.subjects = this.subjects.filter(x => x.id !== entity.id);
            break;
          case 'term':
            await this.http.delete(`${this.apiBaseUrl}/Terms/${entity.id}`, { headers }).toPromise();
            this.terms = this.terms.filter(x => x.id !== entity.id);
            break;
          case 'week':
            await this.http.delete(`${this.apiBaseUrl}/Weeks/${entity.id}`, { headers }).toPromise();
            this.weeks = this.weeks.filter(x => x.id !== entity.id);
            break;
          case 'lesson':
            await this.http.delete(`${this.apiBaseUrl}/Lessons/${entity.id}`, { headers }).toPromise();
            this.lessons = this.lessons.filter(x => x.id !== entity.id);
            break;
          case 'category':
            await this.http.delete(`${this.apiBaseUrl}/Categories/${entity.id}`, { headers }).toPromise();
            this.categories = this.categories.filter(x => x.id !== entity.id);
            break;
        }

        this.refreshAll();
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'The item has been deleted.',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting entity:', error);
        Swal.fire('Error', 'Failed to delete item', 'error');
      }
    }
  }

  defaultFormFor(type: string){
    switch(type){
      case 'year':   
        return { number: 0 };
      case 'subject':
        return {
          name: '',
          description: '',
          originalPrice: 0,
          discountPercentage: 0,
          imageUrl: '',
          level: '',
          duration: 0,
          categoryId: 0,
          teacherId: 0,
          yearId: 0,
          termNumber: 0,
          weekNumbers: [0]
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
          weekId: this.weeks[0]?.id ?? null
        };
      case 'category':
        return { 
          name: '', 
          description: ''
        };
      default: return {};
    }
  }

  hydrateNamesBeforeSave(){
    // No-op: server handles relations by IDs
  }

  // ===== Preview =====
  openLessonPreview(lesson: Lesson){
    const safe: SafeResourceUrl | undefined = lesson.videoUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(lesson.videoUrl)
      : undefined;
    this.preview = { ...lesson, type: 'lesson', safeVideoUrl: safe };
    this.previewOpen = true;
  }

  openCategoryView(category: Category){
    this.preview = { ...category, type: 'category' };
    this.previewOpen = true;
  }

  closePreview(){ this.previewOpen = false; }

  // ===== Relations / navigate to children tab =====
  viewChildren(type: 'year'|'subject'|'term'|'week', entity: any){
    switch(type){
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
  activateTab(tabPaneId: string){
    const trigger = document.querySelector<HTMLElement>(`[data-bs-target="#${tabPaneId}"]`);
    if(trigger && (window as any).bootstrap){
      const tab = new (window as any).bootstrap.Tab(trigger);
      tab.show();
    }
  }

  // ===== utils =====
  capitalize(s: string){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

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
}
