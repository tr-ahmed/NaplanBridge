import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ValidationError {
  [key: string]: string;
}

@Component({
  selector: 'app-content-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './content-modal-enhanced.component.html',
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
        this.setupHierarchicalWatchers();
      } else {
        document.body.style.overflow = '';
      }
    }

    if (changes['formData'] && this.formData) {
      this.setupHierarchicalWatchers();
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
    // Apply filters based on current formData
    this.applyHierarchicalFilters();
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

      // Auto-fill term count
      if (this.entityType === 'term' && this.mode === 'add') {
        const maxTermNumber = this.filteredTerms.reduce((max, t) => Math.max(max, t.termNumber || 0), 0);
        this.formData.termNumber = maxTermNumber + 1;
      }
    } else {
      this.filteredTerms = [...this.terms];
    }

    // Filter Weeks by Term
    if (this.formData.termId) {
      this.filteredWeeks = this.weeks.filter(
        w => w.termId === Number(this.formData.termId)
      );

      // Auto-fill week count
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
    }

    // Auto-fill for lesson based on week selection
    if (this.entityType === 'lesson' && this.formData.weekId) {
      const selectedWeek = this.weeks.find(w => w.id === Number(this.formData.weekId));
      if (selectedWeek) {
        const selectedTerm = this.terms.find(t => t.id === selectedWeek.termId);
        if (selectedTerm && !this.formData.subjectId) {
          this.formData.subjectId = selectedTerm.subjectId;
        }
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
          this.validationErrors[fieldName] = 'Discount percentage must be between 0 and 100';
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
          this.validationErrors[fieldName] = 'Order index cannot be negative';
        }
        break;

      case 'title':
        if (value && value.length < 3) {
          this.validationErrors[fieldName] = 'Title must be at least 3 characters long';
        }
        break;

      case 'name':
        if (value && value.length < 2) {
          this.validationErrors[fieldName] = 'Name must be at least 2 characters long';
        }
        break;
    }
  }

  /**
   * Get required fields based on entity type
   */
  getRequiredFields(): string[] {
    const requiredFieldsMap: { [key: string]: string[] } = {
      'year': ['yearNumber'],
      'category': ['name'],
      'subjectName': ['name', 'categoryId'],
      'subject': ['yearId', 'subjectNameId', 'originalPrice', 'level', 'teacherId'],
      'term': ['subjectId', 'termNumber', 'startDate'],
      'week': ['termId', 'weekNumber'],
      'lesson': ['title', 'description', 'weekId', 'subjectId']
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
    const titles: { [key: string]: string } = {
      'year': 'Academic Year',
      'category': 'Category',
      'subjectName': 'Subject Name',
      'subject': 'Subject',
      'term': 'Term',
      'week': 'Week',
      'lesson': 'Lesson'
    };
    return titles[this.entityType] || 'Item';
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
      'duration': '0',
      'termNumber': 'Enter term number',
      'weekNumber': 'Enter week number',
      'orderIndex': '0'
    };
    return placeholders[fieldName] || '';
  }
}
