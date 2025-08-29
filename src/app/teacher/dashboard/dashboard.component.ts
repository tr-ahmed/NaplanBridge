import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
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

@Component({
  selector: 'app-content-management',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],

  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class ContentManagementComponent implements OnInit {
  sidebarCollapsed = false;
  userName = 'Admin User';
yearPages: any;

toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }

  // ===== Data stores =====
  years: Year[] = [];
  subjects: Subject[] = [];
  terms: Term[] = [];
  weeks: Week[] = [];
  lessons: Lesson[] = [];
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
  searchTerm = '';

  // ===== Pagination =====
  pageSize = 5;

  yearPage = 1; subjectPage = 1; termPage = 1; weekPage = 1; lessonPage = 1; coursePage = 1;

  filteredYears: Year[] = [];
  filteredSubjects: Subject[] = [];
  filteredTerms: Term[] = [];
  filteredWeeks: Week[] = [];
  filteredLessons: Lesson[] = [];
  filteredCourses: Course[] = [];

  pagedYears: Year[] = [];
  pagedSubjects: Subject[] = [];
  pagedTerms: Term[] = [];
  pagedWeeks: Week[] = [];
  pagedLessons: Lesson[] = [];
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

  // ===== Modals =====
  isFormOpen = false;
  formMode: 'add' | 'edit' = 'add';
  entityType: 'year'|'subject'|'term'|'week'|'lesson'|'course' = 'year';
  entityTitle = '';
  form: any = {};

  previewOpen = false;
  preview: any = {};

  activeTab: string = 'years';
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

