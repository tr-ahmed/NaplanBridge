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
      <div class="header-section">
        <h2 class="page-title">👨‍🏫 Assign Teachers to Subjects</h2>
        <button (click)="openNewAssignment()" class="btn-primary">
          <i class="fas fa-plus"></i> New Assignment
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filter-group">
          <input
            type="text"
            placeholder="Search by teacher or subject..."
            class="search-input"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event); applyFilters()">
        </div>
        <div class="filter-group">
          <select
            class="filter-select"
            [ngModel]="filterTeacherId()"
            (ngModelChange)="filterTeacherId.set($event); applyFilters()">
            <option [value]="null">All Teachers</option>
            @for (teacher of teachers(); track teacher.id) {
              <option [value]="teacher.id">{{ teacher.name }}</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <select
            class="filter-select"
            [ngModel]="filterSubjectId()"
            (ngModelChange)="filterSubjectId.set($event); applyFilters()">
            <option [value]="null">All Subjects</option>
            @for (subject of subjects(); track subject.id) {
              <option [value]="subject.id">{{ subject.name }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-card">
          <div class="spinner"></div>
          <p>Loading assignments...</p>
        </div>
      }

      <!-- Permissions Table -->
      @if (!loading() && filteredPermissions().length > 0) {
        <div class="table-card">
          <table class="permissions-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                <th>Permissions</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (permission of getPaginatedPermissions(); track permission.id) {
                <tr>
                  <td>
                    <div class="teacher-info">
                      <strong>{{ permission.teacherName }}</strong>
                      @if (permission.teacherEmail) {
                        <small>{{ permission.teacherEmail }}</small>
                      }
                    </div>
                  </td>
                  <td>{{ permission.subjectName }}</td>
                  <td>
                    <div class="permissions-badges">
                      @if (permission.canCreate) {
                        <span class="badge badge-success">Create</span>
                      }
                      @if (permission.canEdit) {
                        <span class="badge badge-info">Edit</span>
                      }
                      @if (permission.canDelete) {
                        <span class="badge badge-danger">Delete</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="notes-text">{{ permission.notes || '-' }}</span>
                  </td>
                  <td>
                    <span [class]="permission.isActive ? 'status-active' : 'status-inactive'">
                      {{ permission.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button
                        (click)="editPermission(permission)"
                        class="btn-edit"
                        title="Edit">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button
                        (click)="deletePermission(permission)"
                        class="btn-delete"
                        title="Revoke">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          @if (getTotalPages() > 1) {
            <div class="pagination">
              <button
                (click)="changePage(currentPage() - 1)"
                [disabled]="currentPage() === 1"
                class="btn-page">
                Previous
              </button>
              <span class="page-info">
                Page {{ currentPage() }} of {{ getTotalPages() }}
              </span>
              <button
                (click)="changePage(currentPage() + 1)"
                [disabled]="currentPage() === getTotalPages()"
                class="btn-page">
                Next
              </button>
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && filteredPermissions().length === 0) {
        <div class="empty-state">
          <i class="fas fa-folder-open fa-3x"></i>
          <p>No teacher assignments found</p>
          <button (click)="openNewAssignment()" class="btn-primary">
            Assign First Teacher
          </button>
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ modalTitle() }}</h3>
              <button (click)="closeModal()" class="btn-close">&times;</button>
            </div>

            <form [formGroup]="form" (ngSubmit)="submitForm()">
              <div class="modal-body">
                <div class="form-group">
                  <label>Teacher *</label>
                  <select formControlName="teacherId" [disabled]="editingId() !== null">
                    <option [value]="null">Select Teacher</option>
                    @for (teacher of teachers(); track teacher.id) {
                      <option [value]="teacher.id">{{ teacher.name }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label>Subject *</label>
                  <select formControlName="subjectId" [disabled]="editingId() !== null">
                    <option [value]="null">Select Subject</option>
                    @for (subject of subjects(); track subject.id) {
                      <option [value]="subject.id">{{ subject.name }}</option>
                    }
                  </select>
                </div>

                <div class="permissions-group">
                  <label>Permissions</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="checkbox" formControlName="canCreate">
                      <span>Can Create Content</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" formControlName="canEdit">
                      <span>Can Edit Content</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" formControlName="canDelete">
                      <span>Can Delete Content</span>
                    </label>
                  </div>
                </div>

                <div class="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    formControlName="notes"
                    rows="3"
                    placeholder="Add any notes or restrictions...">
                  </textarea>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" (click)="closeModal()" class="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn-primary"
                  [disabled]="!form.valid || submitting()">
                  @if (submitting()) {
                    <span class="spinner-small"></span> Saving...
                  } @else {
                    {{ editingId() ? 'Update' : 'Assign' }}
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .teacher-assignment-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .filters-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .search-input, .filter-select {
      width: 100%;
      padding: 10px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
    }

    .search-input:focus, .filter-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .loading-card, .empty-state {
      background: white;
      padding: 60px 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state i {
      color: #9ca3af;
      margin-bottom: 16px;
    }

    .empty-state p {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 20px;
    }

    .table-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .permissions-table {
      width: 100%;
      border-collapse: collapse;
    }

    .permissions-table thead {
      background: #f9fafb;
    }

    .permissions-table th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      font-size: 14px;
      border-bottom: 2px solid #e5e7eb;
    }

    .permissions-table td {
      padding: 16px;
      border-bottom: 1px solid #f3f4f6;
    }

    .permissions-table tr:hover {
      background: #f9fafb;
    }

    .teacher-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .teacher-info strong {
      color: #111827;
    }

    .teacher-info small {
      color: #6b7280;
      font-size: 12px;
    }

    .permissions-badges {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-info {
      background: #dbeafe;
      color: #1e40af;
    }

    .badge-danger {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-active {
      color: #059669;
      font-weight: 600;
    }

    .status-inactive {
      color: #dc2626;
      font-weight: 600;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-edit, .btn-delete {
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-edit {
      background: #dbeafe;
      color: #1e40af;
    }

    .btn-edit:hover {
      background: #3b82f6;
      color: white;
    }

    .btn-delete {
      background: #fee2e2;
      color: #991b1b;
    }

    .btn-delete:hover {
      background: #dc2626;
      color: white;
    }

    .pagination {
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .btn-page {
      padding: 8px 16px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-page:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #3b82f6;
    }

    .btn-page:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: #6b7280;
      font-size: 14px;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 20px;
      color: #111827;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 28px;
      color: #9ca3af;
      cursor: pointer;
      line-height: 1;
    }

    .btn-close:hover {
      color: #374151;
    }

    .modal-body {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }

    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 10px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .permissions-group label {
      display: block;
      margin-bottom: 12px;
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-weight: normal;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-secondary {
      padding: 10px 20px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #f3f4f6;
    }

    .spinner-small {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid white;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    .notes-text {
      color: #6b7280;
      font-size: 13px;
      max-width: 200px;
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
            this.toastService.showError('Failed to load teachers list');
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
            this.toastService.showError('Failed to load subjects list');
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
            this.toastService.showError('Failed to load permissions');
            this.loadingPermissions.set(false);
            resolve();
          }
        });
    });
  }

  openNewAssignment(): void {
    this.editingId.set(null);
    this.modalTitle.set('Assign New Teacher');
    this.form.reset({ teacherId: null, subjectId: null, canCreate: true, canEdit: true, canDelete: false, notes: '' });
    this.showModal.set(true);
  }

  editPermission(permission: TeacherPermissionDto): void {
    this.editingId.set(permission.id);
    this.modalTitle.set(`Edit Permissions for ${permission.teacherName}`);
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
      this.toastService.showWarning('Please fill all required fields');
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
            this.toastService.showSuccess('Teacher assigned successfully ✅');
            this.showModal.set(false);
            this.loadPermissions();
          } else {
            this.toastService.showError(response.message);
          }
          this.submitting.set(false);
        },
        error: (error: any) => {
          const msg = error?.error?.message || 'Error assigning teacher';
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
            this.toastService.showSuccess('Permissions updated successfully ✅');
            this.showModal.set(false);
            this.loadPermissions();
          } else {
            this.toastService.showError(response.message);
          }
          this.submitting.set(false);
        },
        error: (error: any) => {
          const msg = error?.error?.message || 'Error updating permissions';
          this.toastService.showError(msg);
          this.submitting.set(false);
        }
      });
  }

  deletePermission(permission: TeacherPermissionDto): void {
    const msg = `Are you sure you want to revoke ${permission.teacherName}'s permissions for ${permission.subjectName}?`;
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
          const msg = error?.error?.message || 'Failed to revoke permissions';
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
    return this.teachers().find(t => t.id === teacherId)?.name || 'Unknown';
  }

  getSubjectName(subjectId: number): string {
    return this.subjects().find(s => s.id === subjectId)?.name || 'Unknown';
  }
}
