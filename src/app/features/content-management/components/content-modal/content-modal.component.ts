import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TerminologyService } from '../../../../core/services/terminology.service';
import { ChapterManagerComponent } from '../chapter-manager/chapter-manager.component';

interface ValidationError {
  [key: string]: string;
}

@Component({
  selector: 'app-content-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ChapterManagerComponent],
  templateUrl: './content-modal.component.html',
  styles: [`
    :host {
      display: contents;
    }

    .error-message {
      @apply text-red-600 text-sm mt-1 block;
    }

    .input-error {
      @apply border-red-500 focus:ring-red-500;
    }

    .input-valid {
      @apply border-green-500 focus:ring-green-500;
    }
  `]
})
export class ContentModalComponent implements OnChanges, OnInit {
  @Input() isOpen: boolean = false;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() entityType: string = '';
  @Input() formData: any = {};
  @Input() years: any[] = [];
  @Input() categories: any[] = [];
  @Input() subjectNames: any[] = [];
  @Input() subjects: any[] = [];
  @Input() terms: any[] = [];
  @Input() weeks: any[] = [];
  @Input() teachers: any[] = [];

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  // Inject terminology service
  terminologyService = inject(TerminologyService);

  // Validation state
  validationErrors: ValidationError = {};
  touchedFields: Set<string> = new Set();
  isFormValid: boolean = false;

  // Filtered data for hierarchical dropdowns
  filteredCategories: any[] = [];
  filteredSubjectNames: any[] = [];
  filteredSubjects: any[] = [];
  filteredTerms: any[] = [];
  filteredWeeks: any[] = [];

  ngOnInit(): void {
    this.initializeFilters();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        document.body.style.overflow = 'hidden';
        this.resetValidation();
        this.initializeFilters();
        // Delay to ensure all inputs are ready
        setTimeout(() => this.setupHierarchicalWatchers(), 50);
      } else {
        document.body.style.overflow = '';
      }
    }

    if (changes['formData'] && this.formData) {
      // Ensure numeric fields are properly typed
      if (this.formData.teacherId) {
        this.formData.teacherId = Number(this.formData.teacherId);
      }
      if (this.formData.yearId) {
        this.formData.yearId = Number(this.formData.yearId);
      }
      if (this.formData.subjectNameId) {
        this.formData.subjectNameId = Number(this.formData.subjectNameId);
      }
      console.log('📝 Modal received formData:', this.formData);
      // Delay to ensure all inputs are ready
      setTimeout(() => this.setupHierarchicalWatchers(), 50);
    }

    // Re-run auto-selection when data arrays change
    if ((changes['subjects'] || changes['terms'] || changes['weeks']) && this.isOpen && this.mode === 'add') {
      setTimeout(() => this.setupHierarchicalWatchers(), 50);
    }
  }

  /**
   * Initialize filtered data for hierarchical dropdowns
   */
  initializeFilters(): void {
    this.filteredCategories = [...this.categories];
    this.filteredSubjectNames = [...this.subjectNames];
    this.filteredSubjects = [...this.subjects];
    this.filteredTerms = [...this.terms];
    this.filteredWeeks = [...this.weeks];
  }

  /**
   * Setup watchers for hierarchical auto-fill
   */
  setupHierarchicalWatchers(): void {
    // Only proceed if we're in add mode
    if (this.mode !== 'add') {
      return;
    }

    // Apply filters based on current formData
    this.applyHierarchicalFilters();

    // Auto-select for Term: if only one subject available, select it automatically
    if (this.entityType === 'term') {
      const availableSubjects = this.filteredSubjects.length > 0 ? this.filteredSubjects : this.subjects;
      console.log('🔍 Term - Available subjects:', availableSubjects.length, 'Current subjectId:', this.formData.subjectId);

      if (availableSubjects.length === 1 && (this.formData.subjectId === null || this.formData.subjectId === undefined)) {
        console.log('✅ Auto-selecting subject:', availableSubjects[0]);
        this.formData.subjectId = availableSubjects[0].id;
        this.applyHierarchicalFilters();
      }
    }

    // Auto-select for Week: if only one term available, select it automatically
    if (this.entityType === 'week') {
      const availableTerms = this.filteredTerms.length > 0 ? this.filteredTerms : this.terms;
      console.log('🔍 Week - Available terms:', availableTerms.length, 'Current termId:', this.formData.termId);

      if (availableTerms.length === 1 && (this.formData.termId === null || this.formData.termId === undefined)) {
        console.log('✅ Auto-selecting term:', availableTerms[0]);
        this.formData.termId = availableTerms[0].id;
        this.applyHierarchicalFilters();
      }
    }

    // Auto-select for Lesson: if only one week available, select it automatically
    if (this.entityType === 'lesson') {
      const availableWeeks = this.filteredWeeks.length > 0 ? this.filteredWeeks : this.weeks;
      console.log('🔍 Lesson - Available weeks:', availableWeeks.length, 'Current weekId:', this.formData.weekId);

      if (availableWeeks.length === 1 && (this.formData.weekId === null || this.formData.weekId === undefined)) {
        console.log('✅ Auto-selecting week:', availableWeeks[0]);
        this.formData.weekId = availableWeeks[0].id;
        this.applyHierarchicalFilters();
      }
    }
  }

  /**
   * Apply hierarchical filters based on selected values
   */
  applyHierarchicalFilters(): void {
    // Filter Subject Names by Category
    if (this.formData.categoryId) {
      this.filteredSubjectNames = this.subjectNames.filter(
        sn => sn.categoryId === Number(this.formData.categoryId)
      );
    } else {
      this.filteredSubjectNames = [...this.subjectNames];
    }

    // Filter Subjects by Year and/or Category
    if (this.formData.yearId || this.formData.categoryId) {
      this.filteredSubjects = this.subjects.filter(s => {
        const matchesYear = !this.formData.yearId || s.yearId === Number(this.formData.yearId);
        const matchesCategory = !this.formData.categoryId || s.categoryId === Number(this.formData.categoryId);
        return matchesYear && matchesCategory;
      });
    } else {
      this.filteredSubjects = [...this.subjects];
    }

    // Filter Terms by Subject
    if (this.formData.subjectId) {
      this.filteredTerms = this.terms.filter(
        t => t.subjectId === Number(this.formData.subjectId)
      );

      // Auto-fill term count when adding a new term
      if (this.entityType === 'term' && this.mode === 'add') {
        const maxTermNumber = this.filteredTerms.reduce((max, t) => Math.max(max, t.termNumber || 0), 0);
        this.formData.termNumber = maxTermNumber + 1;
      }
    } else {
      this.filteredTerms = [...this.terms];

      // If adding a term and no subject selected, try to auto-select if only one subject exists
      if (this.entityType === 'term' && this.mode === 'add' && this.subjects.length === 1) {
        this.formData.subjectId = this.subjects[0].id;
        // Re-trigger to calculate term number
        this.applyHierarchicalFilters();
        return;
      }
    }

    // Filter Weeks by Term
    if (this.formData.termId) {
      this.filteredWeeks = this.weeks.filter(
        w => w.termId === Number(this.formData.termId)
      );

      // Auto-fill week count when adding a new week
      if (this.entityType === 'week' && this.mode === 'add') {
        const maxWeekNumber = this.filteredWeeks.reduce((max, w) => Math.max(max, w.weekNumber || 0), 0);
        this.formData.weekNumber = maxWeekNumber + 1;
      }

      // Auto-fill subjectId for lessons from term
      if (this.entityType === 'lesson') {
        const selectedTerm = this.terms.find(t => t.id === Number(this.formData.termId));
        if (selectedTerm && !this.formData.subjectId) {
          this.formData.subjectId = selectedTerm.subjectId;
        }
      }
    } else {
      this.filteredWeeks = [...this.weeks];

      // If adding a week and no term selected, try to auto-select if only one term exists
      if (this.entityType === 'week' && this.mode === 'add' && this.terms.length === 1) {
        this.formData.termId = this.terms[0].id;
        // Re-trigger to calculate week number
        this.applyHierarchicalFilters();
        return;
      }
    }

    // Auto-fill for lesson based on week selection
    if (this.entityType === 'lesson') {
      if (this.formData.weekId) {
        const selectedWeek = this.weeks.find(w => w.id === Number(this.formData.weekId));
        if (selectedWeek) {
          const selectedTerm = this.terms.find(t => t.id === selectedWeek.termId);
          if (selectedTerm && !this.formData.subjectId) {
            this.formData.subjectId = selectedTerm.subjectId;
          }
        }
      } else if (this.mode === 'add' && this.weeks.length === 1 && !this.formData.weekId) {
        // If adding a lesson and only one week exists, auto-select it
        this.formData.weekId = this.weeks[0].id;
        // Re-trigger to set subjectId from term
        this.applyHierarchicalFilters();
        return;
      }
    }
  }

  /**
   * Handle field change with validation
   */
  onFieldChange(fieldName: string, value: any): void {
    this.formData[fieldName] = value;
    this.touchedFields.add(fieldName);
    this.validateField(fieldName, value);
    this.validateForm();

    // Trigger hierarchical updates
    if (['categoryId', 'yearId', 'subjectId', 'termId', 'weekId'].includes(fieldName)) {
      this.applyHierarchicalFilters();
    }
  }

  /**
   * Mark field as touched (on blur)
   */
  markFieldTouched(fieldName: string): void {
    this.touchedFields.add(fieldName);
    this.validateField(fieldName, this.formData[fieldName]);
  }

  /**
   * Validate individual field
   */
  validateField(fieldName: string, value: any): void {
    delete this.validationErrors[fieldName];

    // Required field validation
    const requiredFields = this.getRequiredFields();
    if (requiredFields.includes(fieldName)) {
      if (!value || (typeof value === 'string' && !value.trim())) {
        this.validationErrors[fieldName] = 'This field is required';
        return;
      }
    }

    // Type-specific validation
    switch (fieldName) {
      case 'yearNumber':
        if (value < 1 || value > 12) {
          this.validationErrors[fieldName] = 'Year number must be between 1 and 12';
        }
        break;

      case 'originalPrice':
        if (value < 0) {
          this.validationErrors[fieldName] = 'Price cannot be negative';
        }
        break;

      case 'discountPercentage':
        if (value < 0 || value > 100) {
          this.validationErrors[fieldName] = 'Discount must be between 0 and 100';
        }
        break;

      case 'duration':
        if (value < 0) {
          this.validationErrors[fieldName] = 'Duration cannot be negative';
        }
        break;

      case 'termNumber':
        if (value < 1) {
          this.validationErrors[fieldName] = 'Term number must be greater than 0';
        }
        break;

      case 'weekNumber':
        if (value < 1) {
          this.validationErrors[fieldName] = 'Week number must be greater than 0';
        }
        break;

      case 'orderIndex':
        if (value < 0) {
          this.validationErrors[fieldName] = 'Order cannot be negative';
        }
        break;

      case 'title':
        if (value && value.length < 3) {
          this.validationErrors[fieldName] = 'Title must be at least 3 characters';
        }
        break;

      case 'name':
        if (value && value.length < 2) {
          this.validationErrors[fieldName] = 'Name must be at least 2 characters';
        }
        break;
    }
  }

  /**
   * Get required fields based on entity type and mode
   */
  getRequiredFields(): string[] {
    const requiredFieldsMap: { [key: string]: string[] } = {
      'year': ['yearNumber'],
      'category': ['name'],
      'subjectName': ['name', 'categoryId'],
      'subject': this.mode === 'add'
        ? ['yearId', 'subjectNameId', 'originalPrice', 'level', 'teacherId', 'startDate']
        : ['originalPrice', 'level', 'teacherId'],
      'term': ['subjectId', 'termNumber', 'startDate'],
      'week': ['termId', 'weekNumber'],
      'lesson': ['title', 'description', 'weekId'] // subjectId removed - auto-calculated by backend
    };

    return requiredFieldsMap[this.entityType] || [];
  }

  /**
   * Validate entire form
   */
  validateForm(): void {
    const requiredFields = this.getRequiredFields();
    let isValid = true;

    // Validate all required fields
    for (const field of requiredFields) {
      this.validateField(field, this.formData[field]);
      if (this.validationErrors[field]) {
        isValid = false;
      }
    }

    this.isFormValid = isValid && Object.keys(this.validationErrors).length === 0;
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string): boolean {
    return this.touchedFields.has(fieldName) && !!this.validationErrors[fieldName];
  }

  /**
   * Get error message for field
   */
  getError(fieldName: string): string {
    return this.validationErrors[fieldName] || '';
  }

  /**
   * Check if field is valid
   */
  isFieldValid(fieldName: string): boolean {
    return this.touchedFields.has(fieldName) && !this.validationErrors[fieldName] && !!this.formData[fieldName];
  }

  /**
   * Reset validation state
   */
  resetValidation(): void {
    this.validationErrors = {};
    this.touchedFields = new Set();
    this.isFormValid = false;
  }

  /**
   * Get entity title for display
   */
  getEntityTitle(): string {
    const titles: Record<string, string> = {
      'year': 'Year',
      'category': 'Category',
      'subjectName': 'Subject Name',
      'subject': 'Subject',
      'term': 'Term',
      'week': 'Week',
      'lesson': 'Lesson'
    };
    return titles[this.entityType] || this.entityType;
  }

  /**
   * Handle file change
   */
  onFileChange(event: any, fieldName: string): void {
    const file = event.target.files[0];
    if (file) {
      this.formData[fieldName] = file;
      this.onFieldChange(fieldName, file);
    }
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: MouseEvent): void {
    this.onCancel();
  }

  /**
   * Handle cancel
   */
  onCancel(): void {
    document.body.style.overflow = '';
    this.resetValidation();
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.cancel.emit();
  }

  /**
   * Handle save
   */
  onSave(): void {
    // Mark all required fields as touched
    const requiredFields = this.getRequiredFields();
    requiredFields.forEach(field => {
      this.touchedFields.add(field);
      this.validateField(field, this.formData[field]);
    });

    this.validateForm();

    if (this.isFormValid) {
      this.save.emit(this.formData);
    } else {
      // Show error message
      console.warn('Form validation failed', this.validationErrors);
    }
  }

  /**
   * Get placeholder text
   */
  getPlaceholder(fieldName: string): string {
    const placeholders: { [key: string]: string } = {
      'yearNumber': 'Enter year number (1-12)',
      'name': 'Enter name',
      'description': 'Enter description',
      'title': 'Enter title',
      'originalPrice': '0.00',
      'discountPercentage': '0',
      'tutoringPricePerHour': '0.00',
      'duration': '0',
      'termNumber': 'Enter term number',
      'weekNumber': 'Enter week number',
      'orderIndex': '0'
    };
    return placeholders[fieldName] || '';
  }

  /**
   * Get year display label - Returns "Courses" for yearNumber 0, otherwise "Year {number}"
   */
  getYearLabel(year: any): string {
    if (!year) return 'N/A';
    if (year.yearNumber === 0) {
      return 'Courses';
    }
    return `Year ${year.yearNumber}`;
  }

  /**
   * Get formatted subject display with hierarchy info
   */
  getSubjectDisplay(subject: any): string {
    const year = this.years.find(y => y.id === subject.yearId);
    const yearText = year ? this.getYearLabel(year) : '';
    const categoryText = subject.categoryName || '';
    const subjectText = subject.subjectName || '';

    return [yearText, categoryText, subjectText].filter(Boolean).join(' - ');
  }

  /**
   * Get formatted term display with hierarchy info
   */
  getTermDisplay(term: any): string {
    const subject = this.subjects.find(s => s.id === term.subjectId);
    if (!subject) return `Term ${term.termNumber}`;

    const year = this.years.find(y => y.id === subject.yearId);
    const yearText = year ? this.getYearLabel(year) : '';
    const subjectText = subject.subjectName || '';
    const termText = `Term ${term.termNumber}`;

    return [yearText, subjectText, termText].filter(Boolean).join(' - ');
  }

  /**
   * Get formatted week display with hierarchy info
   */
  getWeekDisplay(week: any): string {
    const term = this.terms.find(t => t.id === week.termId);
    if (!term) return `Week ${week.weekNumber}`;

    const subject = this.subjects.find(s => s.id === term.subjectId);
    if (!subject) return `Week ${week.weekNumber}`;

    const year = this.years.find(y => y.id === subject.yearId);
    const yearText = year ? this.getYearLabel(year) : '';
    const subjectText = subject.subjectName || '';
    const termText = `Term ${term.termNumber}`;
    const weekText = `Week ${week.weekNumber}`;

    return [yearText, subjectText, termText, weekText].filter(Boolean).join(' - ');
  }
}
