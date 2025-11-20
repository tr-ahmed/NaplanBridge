import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import {
  TeacherPermissionService,
  GrantPermissionDto,
  UpdatePermissionDto,
  TeacherPermissionDto,
  TeacherDto,
  SubjectDto
} from '../../teacher/services/teacher-permission.service';

@Component({
  selector: 'app-assign-teacher',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="teacher-assignment-container">
      <h2 class="page-title">🎓 تعيين المدرسين على المواد</h2>
      <div class="card p-4">
        <p>جاري تحميل النظام...</p>
      </div>
    </div>
  `,
  styles: [`
    .teacher-assignment-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .page-title {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 30px;
      color: #333;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .p-4 {
      padding: 25px;
    }
  `]
})
export class AssignTeacherComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private permissionService = inject(TeacherPermissionService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // State
  loading = signal(false);
  submitting = signal(false);
  loadingPermissions = signal(false);
  editingId = signal<number | null>(null);

  // Data
  teachers = signal<TeacherDto[]>([]);
  subjects = signal<SubjectDto[]>([]);
  permissions = signal<TeacherPermissionDto[]>([]);
  filteredPermissions = signal<TeacherPermissionDto[]>([]);

  // Form & UI
  form!: FormGroup;
  showModal = signal(false);
  modalTitle = signal('تعيين معلم جديد');

  // Pagination & Filter
  currentPage = signal(1);
  pageSize = signal(10);
  searchTerm = signal('');
  filterTeacherId = signal<number | null>(null);
  filterSubjectId = signal<number | null>(null);

  ngOnInit(): void {
    this.initForm();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      teacherId: [null, Validators.required],
      subjectId: [null, Validators.required],
      canCreate: [true, Validators.required],
      canEdit: [true, Validators.required],
      canDelete: [false, Validators.required],
      notes: ['']
    });
  }

  private loadInitialData(): void {
    this.loading.set(true);
    Promise.all([
      this.loadTeachers(),
      this.loadSubjects(),
      this.loadPermissions()
    ]).finally(() => this.loading.set(false));
  }

  private loadTeachers(): Promise<void> {
    return new Promise((resolve) => {
      this.permissionService.getTeachers()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (teachers: TeacherDto[]) => {
            this.teachers.set(teachers);
            resolve();
          },
          error: (error: any) => {
            console.error('Error loading teachers:', error);
            this.toastService.showError('فشل تحميل قائمة المعلمين');
            resolve();
          }
        });
    });
  }

  private loadSubjects(): Promise<void> {
    return new Promise((resolve) => {
      this.permissionService.getSubjects()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (subjects: SubjectDto[]) => {
            this.subjects.set(subjects);
            resolve();
          },
          error: (error: any) => {
            console.error('Error loading subjects:', error);
            this.toastService.showError('فشل تحميل قائمة المواد');
            resolve();
          }
        });
    });
  }

  private loadPermissions(): Promise<void> {
    return new Promise((resolve) => {
      this.loadingPermissions.set(true);
      this.permissionService.getAllPermissions()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.permissions.set(response.data);
            this.applyFilters();
            this.loadingPermissions.set(false);
            resolve();
          },
          error: (error: any) => {
            console.error('Error loading permissions:', error);
            this.toastService.showError('فشل تحميل الصلاحيات');
            this.loadingPermissions.set(false);
            resolve();
          }
        });
    });
  }

  openNewAssignment(): void {
    this.editingId.set(null);
    this.modalTitle.set('تعيين معلم جديد');
    this.form.reset({ teacherId: null, subjectId: null, canCreate: true, canEdit: true, canDelete: false, notes: '' });
    this.showModal.set(true);
  }

  editPermission(permission: TeacherPermissionDto): void {
    this.editingId.set(permission.id);
    this.modalTitle.set(`تعديل صلاحيات ${permission.teacherName}`);
    this.form.patchValue({
      teacherId: permission.teacherId,
      subjectId: permission.subjectId,
      canCreate: permission.canCreate,
      canEdit: permission.canEdit,
      canDelete: permission.canDelete,
      notes: permission.notes || ''
    });
    this.showModal.set(true);
  }

  submitForm(): void {
    if (!this.form.valid) {
      this.toastService.showWarning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    this.submitting.set(true);
    if (this.editingId()) {
      this.updatePermission();
    } else {
      this.createPermission();
    }
  }

  private createPermission(): void {
    const dto: GrantPermissionDto = this.form.value;
    this.permissionService.grantPermission(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.showSuccess('تم التعيين بنجاح ✅');
            this.showModal.set(false);
            this.loadPermissions();
          } else {
            this.toastService.showError(response.message);
          }
          this.submitting.set(false);
        },
        error: (error: any) => {
          const msg = error?.error?.message || 'حدث خطأ في التعيين';
          this.toastService.showError(msg);
          this.submitting.set(false);
        }
      });
  }

  private updatePermission(): void {
    const dto: UpdatePermissionDto = {
      canCreate: this.form.get('canCreate')?.value,
      canEdit: this.form.get('canEdit')?.value,
      canDelete: this.form.get('canDelete')?.value,
      notes: this.form.get('notes')?.value,
      isActive: true
    };
    this.permissionService.updatePermission(this.editingId()!, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.showSuccess('تم التحديث بنجاح ✅');
            this.showModal.set(false);
            this.loadPermissions();
          } else {
            this.toastService.showError(response.message);
          }
          this.submitting.set(false);
        },
        error: (error: any) => {
          const msg = error?.error?.message || 'حدث خطأ في التحديث';
          this.toastService.showError(msg);
          this.submitting.set(false);
        }
      });
  }

  deletePermission(permission: TeacherPermissionDto): void {
    const msg = `هل تريد سحب صلاحيات ${permission.teacherName} من ${permission.subjectName}؟`;
    if (confirm(msg)) {
      this.permissionService.revokePermission(permission.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastService.showSuccess('تم السحب بنجاح ✅');
              this.loadPermissions();
            } else {
              this.toastService.showError(response.message);
            }
          },
          error: (error: any) => {
            const msg = error?.error?.message || 'فشل سحب الصلاحيات';
            this.toastService.showError(msg);
          }
        });
    }
  }

  applyFilters(): void {
    let filtered = this.permissions();
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(p =>
        p.teacherName.toLowerCase().includes(search) ||
        p.subjectName.toLowerCase().includes(search) ||
        p.teacherEmail?.toLowerCase().includes(search)
      );
    }
    if (this.filterTeacherId()) {
      filtered = filtered.filter(p => p.teacherId === this.filterTeacherId());
    }
    if (this.filterSubjectId()) {
      filtered = filtered.filter(p => p.subjectId === this.filterSubjectId());
    }
    this.filteredPermissions.set(filtered);
  }

  getPaginatedPermissions(): TeacherPermissionDto[] {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredPermissions().slice(start, start + this.pageSize());
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredPermissions().length / this.pageSize());
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage.set(page);
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  getTeacherName(teacherId: number): string {
    return this.teachers().find(t => t.id === teacherId)?.name || 'غير معروف';
  }

  getSubjectName(subjectId: number): string {
    return this.subjects().find(s => s.id === subjectId)?.name || 'غير معروفة';
  }
}
