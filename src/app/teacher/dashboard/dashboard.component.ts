<<<<<<< HEAD
=======


>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
<<<<<<< HEAD
import Swal from 'sweetalert2';

type Id = number;

interface Year { id: Id; name: string; sortOrder?: number; }
interface Subject { id: Id; name: string; yearId: Id; yearName?: string; }
interface Term { id: Id; name: string; subjectId: Id; yearId: Id; subjectName?: string; yearName?: string; }
interface Week { id: Id; name: string; termId: Id; sortOrder?: number; termName?: string; subjectName?: string; yearName?: string; }
interface Lesson {
  id: Id; title: string; type: 'Video'|'Quiz';
  linkType: 'week'|'course'; weekId?: Id; courseId?: Id;
  weekName?: string; courseTitle?: string;
  subjectId: Id; subjectName?: string; yearId: Id; yearName?: string;
  videoUrl?: string; description?: string;
}
interface Course {
  id: Id; title: string; status: 'Active'|'Draft';
  yearId: Id; yearName?: string; subjectId: Id; subjectName?: string;
  teacherId?: Id; teacherName?: string;
  duration?: number; price?: number; description?: string;
  lessons?: { title: string }[]; resources?: { name: string }[];
}
=======
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
  SubjectName,
  Teacher,
  Resource,
  User
} from '../../core/services/content.service';

type Id = number;
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab

@Component({
  selector: 'app-content-management',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
<<<<<<< HEAD

  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
=======
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
})
export class ContentManagementComponent implements OnInit {
  sidebarCollapsed = false;
  userName = 'Admin User';
<<<<<<< HEAD
yearPages: any;

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
<<<<<<< HEAD
  courses: Course[] = [];
  teachers: { id: Id; name: string }[] = [];

  // ===== Stats =====
  stats = { years: 0, subjects: 0, terms: 0, weeks: 0, lessons: 0, courses: 0 };

  // ===== Filters/Search =====
  filters: {
status: any; yearId: Id|null; subjectId: Id|null; termId: Id|null; weekId: Id|null; type: ''|'lesson'|'course' 
} = {
    yearId: null,
    subjectId: null,
    termId: null,
    weekId: null,
    type: '',
    status: '' // Make sure this exists!
  };
=======
  categories: Category[] = [];
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

>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
  searchTerm = '';

  // ===== Pagination =====
  pageSize = 5;

<<<<<<< HEAD
  yearPage = 1; subjectPage = 1; termPage = 1; weekPage = 1; lessonPage = 1; coursePage = 1;

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
<<<<<<< HEAD
  filteredCourses: Course[] = [];

  pagedYears: Year[] = [];
=======
  filteredCategories: Category[] = [];

  pagedYears: Year[] = [];
  pagedSubjectNames: SubjectName[] = [];
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
  pagedSubjects: Subject[] = [];
  pagedTerms: Term[] = [];
  pagedWeeks: Week[] = [];
  pagedLessons: Lesson[] = [];
<<<<<<< HEAD
  pagedCourses: Course[] = [];

  get yearTotalPages()   { return Math.max(1, Math.ceil(this.filteredYears.length   / this.pageSize)); }
  get subjectTotalPages(){ return Math.max(1, Math.ceil(this.filteredSubjects.length/ this.pageSize)); }
  get termTotalPages()   { return Math.max(1, Math.ceil(this.filteredTerms.length   / this.pageSize)); }
  get weekTotalPages()   { return Math.max(1, Math.ceil(this.filteredWeeks.length   / this.pageSize)); }
  get lessonTotalPages() { return Math.max(1, Math.ceil(this.filteredLessons.length / this.pageSize)); }
  get courseTotalPages() { return Math.max(1, Math.ceil(this.filteredCourses.length / this.pageSize)); }

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
  get cStart(){ return this.filteredCourses.length ? (this.coursePage-1)*this.pageSize+1 : 0; }
  get cEnd()  { return Math.min(this.coursePage*this.pageSize, this.filteredCourses.length); }
=======
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
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab

  // ===== Modals =====
  isFormOpen = false;
  formMode: 'add' | 'edit' = 'add';
<<<<<<< HEAD
  entityType: 'year'|'subject'|'term'|'week'|'lesson'|'course' = 'year';
=======
  entityType: 'year' | 'subjectName' | 'subject' | 'term' | 'week' | 'lesson' | 'category' =
    'year';
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
  entityTitle = '';
  form: any = {};

  previewOpen = false;
  preview: any = {};

  activeTab: string = 'years';
<<<<<<< HEAD
courseTab: string = 'lessons';

  dropdownOpen = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadAllFromStorage();
    // if (this.years.length === 0) this.seedDummyData();
    this.refreshAll();
  }

  loadAllFromStorage() {
    this.years    = loadFromStorage<Year[]>('years', []);
    this.subjects = loadFromStorage<Subject[]>('subjects', []);
    this.terms    = loadFromStorage<Term[]>('terms', []);
    this.weeks    = loadFromStorage<Week[]>('weeks', []);
    this.lessons  = loadFromStorage<Lesson[]>('lessons', []);
    this.courses  = loadFromStorage<Course[]>('courses', []);
    this.teachers = loadFromStorage<{id:Id;name:string}[]>('teachers', []);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // ===== Dummy data =====
  // seedDummyData() {
  //   this.years = [
  //     { id: 1, name: 'Year 7', sortOrder: 1 },
  //     { id: 2, name: 'Year 8', sortOrder: 2 }
  //   ];
  //   this.subjects = [
  //     { id: 1, name: 'Math',    yearId: 1, yearName: 'Year 7' },
  //     { id: 2, name: 'English', yearId: 1, yearName: 'Year 7' },
  //     { id: 3, name: 'Science', yearId: 2, yearName: 'Year 8' }
  //   ];
  //   this.terms = [
  //     { id: 1, name: 'Term 1', subjectId: 1, yearId: 1, subjectName: 'Math', yearName: 'Year 7' },
  //     { id: 2, name: 'Term 2', subjectId: 1, yearId: 1, subjectName: 'Math', yearName: 'Year 7' }
  //   ];
  //   this.weeks = [
  //     { id: 1, name: 'Week 1', termId: 1, sortOrder: 1, termName: 'Term 1', subjectName: 'Math', yearName: 'Year 7' },
  //     { id: 2, name: 'Week 2', termId: 1, sortOrder: 2, termName: 'Term 1', subjectName: 'Math', yearName: 'Year 7' }
  //   ];
  //   this.courses = [
  //     { id: 1, title: 'Algebra Basics', status: 'Active', yearId: 1, yearName: 'Year 7', subjectId: 1, subjectName: 'Math', teacherId: 1, teacherName: 'Mr. Smith', description: 'Intro to Algebra', lessons:[{title:'Intro'}], resources:[{name:'PDF'}] }
  //   ];
  //   this.lessons = [
  //     { id: 1, title: 'Fractions Basics', type: 'Video', linkType: 'week', weekId: 1, weekName: 'Week 1',
  //       subjectId: 1, subjectName: 'Math', yearId: 1, yearName: 'Year 7',
  //       videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Fractions explained' },
  //     { id: 2, title: 'Linear Equations', type: 'Video', linkType: 'course', courseId: 1, courseTitle: 'Algebra Basics',
  //       subjectId: 1, subjectName: 'Math', yearId: 1, yearName: 'Year 7', videoUrl: '' }
  //   ];
  //   this.teachers = [
  //     { id: 1, name: 'Mr. Smith' }, { id: 2, name: 'Ms. Jane' }
  //   ];
  // }

  // ===== Helpers =====
  trackById = (_: number, item: any) => item.id;

  nameOfYear(id: Id|undefined|null){ return this.years.find(y=>y.id===id)?.name || ''; }
  nameOfSubject(id: Id|undefined|null){ return this.subjects.find(s=>s.id===id)?.name || ''; }
  nameOfTerm(id: Id|undefined|null){ return this.terms.find(t=>t.id===id)?.name || ''; }
  nameOfWeek(id: Id|undefined|null){ return this.weeks.find(w=>w.id===id)?.name || ''; }
  titleOfCourse(id: Id|undefined|null){ return this.courses.find(c=>c.id===id)?.title || ''; }
  nameOfTeacher(id: Id|undefined|null){ return this.teachers.find(t=>t.id===id)?.name || ''; }

  // ===== Filtering / Paging =====
  onFilterChange() {
    // فلترة السنوات
    this.filteredYears = this.years.filter(y =>
      (!this.filters.yearId || y.id === this.filters.yearId) &&
      (!this.searchTerm || y.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
    this.pagedYears = this.filteredYears.slice((this.yearPage - 1) * this.pageSize, this.yearPage * this.pageSize);

    // فلترة المواد
    this.filteredSubjects = this.subjects.filter(s =>
      (!this.filters.yearId || s.yearId === this.filters.yearId) &&
      (!this.filters.subjectId || s.id === this.filters.subjectId) &&
      (!this.searchTerm || s.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
    this.pagedSubjects = this.filteredSubjects.slice((this.subjectPage - 1) * this.pageSize, this.subjectPage * this.pageSize);

    // فلترة التيرمات
    this.filteredTerms = this.terms.filter(t =>
      (!this.filters.yearId || t.yearId === this.filters.yearId) &&
      (!this.filters.subjectId || t.subjectId === this.filters.subjectId) &&
      (!this.filters.termId || t.id === this.filters.termId) &&
      (!this.searchTerm || t.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
    this.pagedTerms = this.filteredTerms.slice((this.termPage - 1) * this.pageSize, this.termPage * this.pageSize);

    // فلترة الأسابيع
    this.filteredWeeks = this.weeks.filter(w => {
      // Find the term for this week to get yearId and subjectId
      const term = this.terms.find(t => t.id === w.termId);
      return (
        (!this.filters.yearId || term?.yearId === this.filters.yearId) &&
        (!this.filters.subjectId || term?.subjectId === this.filters.subjectId) &&
        (!this.filters.termId || w.termId === this.filters.termId) &&
        (!this.filters.weekId || w.id === this.filters.weekId) &&
        (!this.searchTerm || w.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    });
    this.pagedWeeks = this.filteredWeeks.slice((this.weekPage - 1) * this.pageSize, this.weekPage * this.pageSize);

    // فلترة الدروس
    this.filteredLessons = this.lessons.filter(l =>
      (!this.filters.yearId || l.yearId === this.filters.yearId) &&
      (!this.filters.subjectId || l.subjectId === this.filters.subjectId) &&
      (!this.filters.type || this.filters.type === 'lesson') &&
      (!this.searchTerm || l.title.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
    this.pagedLessons = this.filteredLessons.slice((this.lessonPage - 1) * this.pageSize, this.lessonPage * this.pageSize);

    // فلترة الكورسات
    this.filteredCourses = this.courses.filter(c =>
      (!this.filters.yearId || c.yearId === this.filters.yearId) &&
      (!this.filters.subjectId || c.subjectId === this.filters.subjectId) &&
      (!this.filters.type || this.filters.type === 'course') &&
      (!this.searchTerm || c.title.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
    this.pagedCourses = this.filteredCourses.slice((this.coursePage - 1) * this.pageSize, this.coursePage * this.pageSize);
  }

  resetPaging() {
    this.yearPage = this.subjectPage = this.termPage = this.weekPage = this.lessonPage = this.coursePage = 1;
    this.refreshAll();
  }

  refreshAll() {
    this.applyFilters();
    this.updatePaged();
    this.updateStats();
    this.saveAllToStorage();
  }

  // Save all entities to localStorage
  saveAllToStorage() {
    saveToStorage('years', this.years);
    saveToStorage('subjects', this.subjects);
    saveToStorage('terms', this.terms);
    saveToStorage('weeks', this.weeks);
    saveToStorage('lessons', this.lessons);
    saveToStorage('courses', this.courses);
    saveToStorage('teachers', this.teachers);
  }

  applyFilters() {
    const q = (this.searchTerm || '').toLowerCase();

    // Years: search only
    this.filteredYears = this.years.filter(y => !q || y.name.toLowerCase().includes(q));

    // Subjects: filter by year + search
    this.filteredSubjects = this.subjects.filter(s => {
      const byYear = this.filters.yearId ? s.yearId === this.filters.yearId : true;
      const bySearch = !q || s.name.toLowerCase().includes(q) || (s.yearName||'').toLowerCase().includes(q);
      return byYear && bySearch;
    });

    // Terms: filter by subject/year + search
    this.filteredTerms = this.terms.filter(t => {
      const byYear = this.filters.yearId ? t.yearId === this.filters.yearId : true;
      const bySubject = this.filters.subjectId ? t.subjectId === this.filters.subjectId : true;
      const bySearch = !q || t.name.toLowerCase().includes(q) || (t.subjectName||'').toLowerCase().includes(q) || (t.yearName||'').toLowerCase().includes(q);
      return byYear && bySubject && bySearch;
    });

    // Weeks: filter by term + (subject/year implicit via term) + search
    this.filteredWeeks = this.weeks.filter(w => {
      const byTerm = this.filters.termId ? w.termId === this.filters.termId : true;
      const bySearch = !q || w.name.toLowerCase().includes(q) || (w.termName||'').toLowerCase().includes(q) || (w.subjectName||'').toLowerCase().includes(q);
      return byTerm && bySearch;
    });

    // Lessons
    this.filteredLessons = this.lessons.filter(l => {
      const byTypeFilter = this.filters.type ? this.filters.type === 'lesson' : true;
      const byYear = this.filters.yearId ? l.yearId === this.filters.yearId : true;
      const bySubject = this.filters.subjectId ? l.subjectId === this.filters.subjectId : true;
      const byWeek = this.filters.weekId ? l.weekId === this.filters.weekId : true; // only if linked to week
      const bySearch = !q || l.title.toLowerCase().includes(q) || (l.weekName||'').toLowerCase().includes(q) || (l.courseTitle||'').toLowerCase().includes(q);
      return byTypeFilter && byYear && bySubject && byWeek && bySearch;
    });

    // Courses
    this.filteredCourses = this.courses.filter(c => {
      const byTypeFilter = this.filters.type ? this.filters.type === 'course' : true;
      const byYear = this.filters.yearId ? c.yearId === this.filters.yearId : true;
      const bySubject = this.filters.subjectId ? c.subjectId === this.filters.subjectId : true;
      const bySearch = !q || c.title.toLowerCase().includes(q) || (c.subjectName||'').toLowerCase().includes(q);
      return byTypeFilter && byYear && bySubject && bySearch;
    });
  }

  updatePaged() {
    this.pagedYears    = this.slicePage(this.filteredYears,   this.yearPage);
    this.pagedSubjects = this.slicePage(this.filteredSubjects,this.subjectPage);
    this.pagedTerms    = this.slicePage(this.filteredTerms,   this.termPage);
    this.pagedWeeks    = this.slicePage(this.filteredWeeks,   this.weekPage);
    this.pagedLessons  = this.slicePage(this.filteredLessons, this.lessonPage);
    this.pagedCourses  = this.slicePage(this.filteredCourses, this.coursePage);
  }

  slicePage<T>(arr: T[], page: number){ const start=(page-1)*this.pageSize; return arr.slice(start, start+this.pageSize); }

  updateStats() {
    this.stats = {
      years: this.years.length,
      subjects: this.subjects.length,
      terms: this.terms.length,
      weeks: this.weeks.length,
      lessons: this.lessons.length,
      courses: this.courses.length
    };
  }

  // Paging actions
  goYearPage(p: number){ if(p>=1 && p<=this.yearTotalPages)   { this.yearPage=p; this.updatePaged(); } }
  goSubjectPage(p: number){ if(p>=1 && p<=this.subjectTotalPages){ this.subjectPage=p; this.updatePaged(); } }
  goTermPage(p: number){ if(p>=1 && p<=this.termTotalPages)   { this.termPage=p; this.updatePaged(); } }
  goWeekPage(p: number){ if(p>=1 && p<=this.weekTotalPages)   { this.weekPage=p; this.updatePaged(); } }
  goLessonPage(p: number){ if(p>=1 && p<=this.lessonTotalPages){ this.lessonPage=p; this.updatePaged(); } }
  goCoursePage(p: number){ if(p>=1 && p<=this.courseTotalPages){ this.coursePage=p; this.updatePaged(); } }

  // ===== Add/Edit =====
  openAdd(type: 'year'|'subject'|'term'|'week'|'lesson'|'course'){
    this.formMode = 'add';
    this.entityType = type;
    this.entityTitle = this.capitalize(type);
    this.form = this.defaultFormFor(type);
    this.isFormOpen = true;
  }

  openEdit(type: 'year'|'subject'|'term'|'week'|'lesson'|'course', entity: any){
    this.formMode = 'edit';
    this.entityType = type;
    this.entityTitle = this.capitalize(type);
    this.form = { ...entity }; // shallow clone
    this.isFormOpen = true;
  }

  closeForm(){ this.isFormOpen = false; }

  async submitForm() {
    this.hydrateNamesBeforeSave();

    if (this.formMode === 'add') {
      this.form.id = Date.now();
      switch (this.entityType) {
        case 'year': this.years.push(this.form); break;
        case 'subject': this.subjects.push(this.form); break;
        case 'term': this.terms.push(this.form); break;
        case 'week': this.weeks.push(this.form); break;
        case 'lesson': this.lessons.push(this.form); break;
        case 'course': this.courses.push(this.form); break;
      }
      this.refreshAll();
      this.closeForm();
      await Swal.fire({
        icon: 'success',
        title: 'Added!',
        text: `The ${this.entityType} has been added successfully.`,
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      switch (this.entityType) {
        case 'year': this.years = this.years.map(x => x.id === this.form.id ? this.form : x); break;
        case 'subject': this.subjects = this.subjects.map(x => x.id === this.form.id ? this.form : x); break;
        case 'term': this.terms = this.terms.map(x => x.id === this.form.id ? this.form : x); break;
        case 'week': this.weeks = this.weeks.map(x => x.id === this.form.id ? this.form : x); break;
        case 'lesson': this.lessons = this.lessons.map(x => x.id === this.form.id ? this.form : x); break;
        case 'course': this.courses = this.courses.map(x => x.id === this.form.id ? this.form : x); break;
      }
      this.refreshAll();
      this.closeForm();
      await Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: `The ${this.entityType} has been updated successfully.`,
        timer: 1500,
        showConfirmButton: false
      });
    }
  }

  async confirmDelete(type: 'year'|'subject'|'term'|'week'|'lesson'|'course', entity: any) {
    const result = await Swal.fire({
      title: `Delete this ${type}?`,
      text: 'Are you sure you want to delete this item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
      switch(type){
        case 'year':   this.years   = this.years.filter(x=>x.id!==entity.id); break;
        case 'subject':this.subjects= this.subjects.filter(x=>x.id!==entity.id); break;
        case 'term':   this.terms   = this.terms.filter(x=>x.id!==entity.id); break;
        case 'week':   this.weeks   = this.weeks.filter(x=>x.id!==entity.id); break;
        case 'lesson': this.lessons = this.lessons.filter(x=>x.id!==entity.id); break;
        case 'course': this.courses = this.courses.filter(x=>x.id!==entity.id); break;
      }
      this.refreshAll();
      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'The item has been deleted.',
        timer: 1500,
        showConfirmButton: false
      });
    }
  }

  defaultFormFor(type: string){
    switch(type){
      case 'year':   return { name:'', sortOrder: 1 };
      case 'subject':return { name:'', yearId: this.filters.yearId ?? this.years[0]?.id };
      case 'term':   return { name:'', subjectId: this.filters.subjectId ?? this.subjects[0]?.id, yearId: this.filters.yearId ?? this.years[0]?.id };
      case 'week':   return { name:'', termId: this.filters.termId ?? this.terms[0]?.id, sortOrder: 1 };
      case 'lesson': return { title:'', type:'Video', linkType:'week', weekId: this.filters.weekId ?? this.weeks[0]?.id,
                               subjectId: this.filters.subjectId ?? this.subjects[0]?.id, yearId: this.filters.yearId ?? this.years[0]?.id,
                               videoUrl:'', description:'' };
      case 'course': return { title:'', status:'Draft', yearId: this.filters.yearId ?? this.years[0]?.id,
                               subjectId: this.filters.subjectId ?? this.subjects[0]?.id,
                               teacherId: this.teachers[0]?.id, duration: 10, price: 0, description:'' };
      default: return {};
    }
  }

  hydrateNamesBeforeSave(){
    if(this.entityType==='subject'){
      this.form.yearName = this.nameOfYear(this.form.yearId);
    }
    if(this.entityType==='term'){
      this.form.subjectName = this.nameOfSubject(this.form.subjectId);
      this.form.yearName = this.nameOfYear(this.form.yearId);
    }
    if(this.entityType==='week'){
      this.form.termName = this.nameOfTerm(this.form.termId);
      // derive subject/year via term
      const term = this.terms.find(t=>t.id===this.form.termId);
      this.form.subjectName = term?.subjectName || this.nameOfSubject(term?.subjectId || null);
      this.form.yearName = term?.yearName || this.nameOfYear(term?.yearId || null);
    }
    if(this.entityType==='lesson'){
      if(this.form.linkType==='week'){ this.form.weekName = this.nameOfWeek(this.form.weekId); this.form.courseId = undefined; this.form.courseTitle = undefined; }
      if(this.form.linkType==='course'){ this.form.courseTitle = this.titleOfCourse(this.form.courseId); this.form.weekId = undefined; this.form.weekName = undefined; }
      this.form.subjectName = this.nameOfSubject(this.form.subjectId);
      this.form.yearName = this.nameOfYear(this.form.yearId);
    }
    if(this.entityType==='course'){
      this.form.subjectName = this.nameOfSubject(this.form.subjectId);
      this.form.yearName = this.nameOfYear(this.form.yearId);
      this.form.teacherName = this.nameOfTeacher(this.form.teacherId);
      if(!this.form.lessons) this.form.lessons = [];
      if(!this.form.resources) this.form.resources = [];
    }
  }

  // ===== Preview =====
  openLessonPreview(lesson: Lesson){
    const safe: SafeResourceUrl | undefined = lesson.videoUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(lesson.videoUrl)
      : undefined;
    this.preview = { ...lesson, type: 'lesson', safeVideoUrl: safe };
    this.previewOpen = true;
  }

  openCourseView(course: Course){
    this.preview = { ...course, type: 'course' };
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
        this.filters.yearId = entity.yearId;
        this.filters.subjectId = entity.id;
        this.activateTab('tab-terms');
        break;
      case 'term':
        this.filters.yearId = entity.yearId;
        this.filters.subjectId = entity.subjectId;
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
    // find the corresponding pill button
    const trigger = document.querySelector<HTMLElement>(`[data-bs-target="#${tabPaneId}"]`);
    // @ts-ignore - bootstrap is global
    if(trigger && (window as any).bootstrap){
      // @ts-ignore
      const tab = new (window as any).bootstrap.Tab(trigger);
      tab.show();
    }
  }

  // ===== utils =====
  capitalize(s: string){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}

function saveToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadFromStorage<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) as T : fallback;
}

=======
  categoryTab: string = 'lessons';

  dropdownOpen = false;

  // Resource management
  resourceModalOpen = false;
  resourceFormOpen = false;
  selectedLesson: Lesson | null = null;
  editingResource: Resource | null = null;
  resourceForm: any = {
    title: '',
    file: null,
    lessonId: null,
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

  async loadCategories(): Promise<void> {
    try {
      this.categories = (await this.contentService.getCategories().toPromise()) || [];
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  }

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
      throw error;
    }
  }

  async loadTerms(): Promise<void> {
    try {
      this.terms = (await this.contentService.getTerms().toPromise()) || [];
    } catch (error) {
      console.error('Error loading terms:', error);
      throw error;
    }
  }

  async loadWeeks(): Promise<void> {
    try {
      this.weeks = (await this.contentService.getWeeks().toPromise()) || [];
    } catch (error) {
      console.error('Error loading weeks:', error);
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

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // ===== Helpers =====
  trackById = (_: number, item: any) => item.id;

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
    return week ? week.termId : null;
  }

  getSubjectIdFromWeekId(weekId: Id): Id | null {
    const week = this.weeks.find((w) => w.id === weekId);
    if (!week) return null;

    const term = this.terms.find((t) => t.id === week.termId);
    return term ? term.subjectId : null;
  }

  getYearIdFromSubjectId(subjectId: Id): Id | null {
    const subject = this.subjects.find((s) => s.id === subjectId);
    return subject ? subject.yearId : null;
  }

  // ===== Filtering / Paging =====
  onFilterChange() {
    this.resetPaging();
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
      return byYear && byCategory && bySearch;
    });

    // TERMS
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
    this.pagedSubjectNames = this.slicePage(
      this.filteredSubjectNames,
      this.subjectPage
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
        const { yearNumber } = this.form;
        if (yearNumber == null) {
          Swal.fire('Error', 'Please provide a year number.', 'error');
          throw new Error('Validation failed');
        }
        const newYear = await this.contentService.addYear({ yearNumber }).toPromise();
        if (newYear) this.years.push(newYear);
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
      default:
        throw new Error('Unknown entity type');
    }
  }

  private async updateEntity() {
    switch (this.entityType) {
      case 'year':
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
      case 'year':   return { yearNumber: 0 };
      case 'category':
        return {
          name: '',
          description: '',
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
    this.resourceModalOpen = true;
  }

  closeResourceModal() {
    this.resourceModalOpen = false;
    this.selectedLesson = null;
    this.lessonResources = [];
  }

  openAddResource() {
    this.editingResource = null;
    this.resourceForm = {
      title: '',
      file: null,
      lessonId: this.selectedLesson?.id,
    };
    this.resourceFormOpen = true;
  }

  async loadLessonResources(lessonId: number): Promise<void> {
    try {
      this.lessonResources = (await this.contentService.getLessonResources(lessonId).toPromise()) || [];
    } catch (error) {
      console.error('Error loading lesson resources:', error);
      Swal.fire('Error', this.extractEnglishError(error), 'error');
    }
  }

  closeResourceForm() {
    this.resourceFormOpen = false;
    this.editingResource = null;
  }

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
    }
  }

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

  // ===== File Handling =====
  onFileChange(event: any, field: string) {
    if (event.target.files && event.target.files.length > 0) {
      this.form[field] = event.target.files[0];
    }
  }

  onResourceFileChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.resourceForm.file = event.target.files[0];
    }
  }

  // ===== utils =====
  capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

getSubjectIdFromTermId(termId: Id): Id | null {
  const term = this.terms.find((t) => t.id === termId);
  return term ? term.subjectId : null;
}


getTeacherNameById(id: number): string {
  const teacher = this.teachers.find(t => t.id === id);
  return teacher ? teacher.userName : 'Unknown Teacher';
}
}
>>>>>>> 1a7027bcf5d7fc7167661cbaa6c714e563219bab
