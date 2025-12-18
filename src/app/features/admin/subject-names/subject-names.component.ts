import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubjectService } from '../../../core/services/subject.service';
import { SubjectUtilsService } from '../../../core/services/subject-utils.service';
import { CategoryService } from '../../../core/services/category.service';
import { SubjectName, CreateSubjectNameDto, UpdateSubjectNameDto } from '../../../models/subject.models';

@Component({
  selector: 'app-subject-names',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './subject-names.component.html',
  styleUrls: ['./subject-names.component.css']
})
export class SubjectNamesComponent implements OnInit {
  private subjectService = inject(SubjectService);
  private categoryService = inject(CategoryService);
  private subjectUtils = inject(SubjectUtilsService);
  private fb = inject(FormBuilder);

  // State
  subjectNames = signal<SubjectName[]>([]);
  categories = signal<any[]>([]); // Loaded from API
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Modal state
  showModal = signal(false);
  isEditMode = signal(false);
  selectedSubjectName = signal<SubjectName | null>(null);

  // Form
  subjectNameForm: FormGroup;

  constructor() {
    this.subjectNameForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      categoryId: [null, Validators.required],
      isGlobal: [false]
    });
  }

  ngOnInit(): void {
    this.loadSubjectNames();
    this.loadCategories();
  }

  /**
   * Load all subject names
   */
  loadSubjectNames(): void {
    this.loading.set(true);
    this.error.set(null);

    this.subjectService.getSubjectNames().subscribe({
      next: (data) => {
        this.subjectNames.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load subject names: ' + err.message);
        this.loading.set(false);
      }
    });
  }

  /**
   * Load categories for dropdown from API
   */
  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        // Fallback to mock data if API fails
        this.categories.set([
          { id: 1, name: 'Core Subjects' },
          { id: 2, name: 'Religious Studies' },
          { id: 3, name: 'Life Skills' },
          { id: 4, name: 'Languages' },
          { id: 5, name: 'Arts & Design' }
        ]);
      }
    });
  }

  /**
   * Open create modal
   */
  openCreateModal(): void {
    this.isEditMode.set(false);
    this.selectedSubjectName.set(null);
    this.subjectNameForm.reset({
      name: '',
      categoryId: null,
      isGlobal: false
    });
    this.showModal.set(true);
  }

  /**
   * Open edit modal
   */
  openEditModal(subjectName: SubjectName): void {
    this.isEditMode.set(true);
    this.selectedSubjectName.set(subjectName);
    this.subjectNameForm.patchValue({
      name: subjectName.name,
      categoryId: subjectName.categoryId,
      isGlobal: subjectName.isGlobal
    });
    this.showModal.set(true);
  }

  /**
   * Close modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.subjectNameForm.reset();
    this.error.set(null);
    this.success.set(null);
  }

  /**
   * Submit form (create or update)
   */
  onSubmit(): void {
    if (this.subjectNameForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.subjectNameForm.value;

    if (this.isEditMode()) {
      // Update
      const updateDto: UpdateSubjectNameDto = {
        name: formValue.name,
        categoryId: formValue.categoryId,
        isGlobal: formValue.isGlobal
      };

      this.subjectService.updateSubjectName(this.selectedSubjectName()!.id, updateDto).subscribe({
        next: () => {
          this.success.set('Subject name updated successfully');
          this.loading.set(false);
          this.loadSubjectNames();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.error.set('Failed to update: ' + err.message);
          this.loading.set(false);
        }
      });
    } else {
      // Create
      const createDto: CreateSubjectNameDto = {
        name: formValue.name,
        categoryId: formValue.categoryId,
        isGlobal: formValue.isGlobal
      };

      this.subjectService.createSubjectName(createDto).subscribe({
        next: () => {
          this.success.set('Subject name created successfully');
          this.loading.set(false);
          this.loadSubjectNames();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.error.set('Failed to create: ' + err.message);
          this.loading.set(false);
        }
      });
    }
  }

  /**
   * Toggle isGlobal status
   */
  toggleGlobalStatus(subjectName: SubjectName): void {
    if (!confirm(`Are you sure you want to make "${subjectName.name}" ${subjectName.isGlobal ? 'year-specific' : 'global'}?`)) {
      return;
    }

    this.loading.set(true);
    const updateDto: UpdateSubjectNameDto = {
      isGlobal: !subjectName.isGlobal
    };

    this.subjectService.updateSubjectName(subjectName.id, updateDto).subscribe({
      next: () => {
        this.success.set('Subject status updated successfully');
        this.loading.set(false);
        this.loadSubjectNames();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => {
        this.error.set('Failed to update status: ' + err.message);
        this.loading.set(false);
      }
    });
  }

  /**
   * Delete subject name
   */
  deleteSubjectName(subjectName: SubjectName): void {
    if (!confirm(`Are you sure you want to delete "${subjectName.name}"? This cannot be undone.`)) {
      return;
    }

    this.loading.set(true);

    this.subjectService.deleteSubjectName(subjectName.id).subscribe({
      next: () => {
        this.success.set('Subject name deleted successfully');
        this.loading.set(false);
        this.loadSubjectNames();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => {
        this.error.set('Failed to delete: ' + err.message);
        this.loading.set(false);
      }
    });
  }

  /**
   * Get category name by ID
   */
  getCategoryName(categoryId: number): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  /**
   * Get badge class for global/year-specific
   */
  getBadgeClass(isGlobal: boolean): string {
    return isGlobal ? 'badge-global' : 'badge-year';
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const all = this.subjectNames();
    const global = all.filter(s => s.isGlobal).length;
    const yearSpecific = all.filter(s => !s.isGlobal).length;

    return {
      total: all.length,
      global,
      yearSpecific
    };
  }
}
