import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutoringService } from '../../../core/services/tutoring.service';
import { TeacherWithPriorityDto, PaginationInfo } from '../../../models/tutoring.models';

@Component({
  selector: 'app-admin-teacher-priority',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="priority-container">
      <div class="header">
        <h2>إدارة أولوية المعلمين</h2>
        <p class="subtitle">رتب المعلمين حسب الأولوية للجدولة الذكية (10 = أعلى أولوية)</p>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="search()"
            placeholder="بحث عن معلم..."
            class="search-input">
          <span class="search-icon">🔍</span>
        </div>
        <div class="sort-controls">
          <select [(ngModel)]="sortBy" (change)="loadTeachers()" class="form-control">
            <option value="priority">الأولوية</option>
            <option value="name">الاسم</option>
            <option value="subject">المادة</option>
          </select>
          <select [(ngModel)]="orderBy" (change)="loadTeachers()" class="form-control">
            <option value="desc">تنازلي</option>
            <option value="asc">تصاعدي</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>

      <!-- Teachers Table -->
      <div *ngIf="!loading" class="table-container">
        <table class="teachers-table">
          <thead>
            <tr>
              <th class="priority-col">الأولوية</th>
              <th>اسم المعلم</th>
              <th>البريد الإلكتروني</th>
              <th>المواد</th>
              <th>الحجوزات</th>
              <th>التقييم</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let teacher of teachers" [class.inactive]="!teacher.isActive">
              <td class="priority-col">
                <div class="priority-badge" [class]="getPriorityClass(teacher.priority)">
                  ⭐ {{ teacher.priority }}
                </div>
              </td>
              <td class="name-col">{{ teacher.name }}</td>
              <td>{{ teacher.email }}</td>
              <td>
                <div class="subjects-list">
                  <span *ngFor="let subject of teacher.subjects" class="subject-tag">{{ subject }}</span>
                </div>
              </td>
              <td class="center">{{ teacher.totalBookings }}</td>
              <td class="center">
                <span class="rating">{{ teacher.avgRating.toFixed(1) || 'N/A' }} ⭐</span>
              </td>
              <td class="center">
                <span class="status-badge" [class.active]="teacher.isActive" [class.inactive]="!teacher.isActive">
                  {{ teacher.isActive ? 'نشط' : 'غير نشط' }}
                </span>
              </td>
              <td class="center">
                <button class="btn-edit" (click)="openEditModal(teacher)">
                  تعديل الأولوية
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div *ngIf="pagination" class="pagination">
          <button
            class="btn-page"
            [disabled]="pagination.currentPage <= 1"
            (click)="goToPage(pagination.currentPage - 1)">
            ◀ السابق
          </button>
          <span class="page-info">
            صفحة {{ pagination.currentPage }} من {{ pagination.totalPages }}
            ({{ pagination.totalRecords }} معلم)
          </span>
          <button
            class="btn-page"
            [disabled]="pagination.currentPage >= pagination.totalPages"
            (click)="goToPage(pagination.currentPage + 1)">
            التالي ▶
          </button>
        </div>
      </div>

      <!-- Edit Priority Modal -->
      <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>تحديث أولوية المعلم</h3>
            <button class="btn-close" (click)="closeModal()">×</button>
          </div>

          <div class="modal-body" *ngIf="selectedTeacher">
            <div class="teacher-info">
              <h4>{{ selectedTeacher.name }}</h4>
              <p>{{ selectedTeacher.email }}</p>
            </div>

            <div class="priority-slider-container">
              <label>الأولوية: <strong>{{ newPriority }}</strong></label>
              <div class="slider-wrapper">
                <span class="slider-label">1</span>
                <input
                  type="range"
                  [(ngModel)]="newPriority"
                  min="1"
                  max="10"
                  step="1"
                  class="priority-slider">
                <span class="slider-label">10</span>
              </div>
              <div class="priority-description">
                {{ getPriorityDescription(newPriority) }}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">إلغاء</button>
            <button class="btn btn-primary" (click)="updatePriority()" [disabled]="saving">
              {{ saving ? 'جاري الحفظ...' : 'حفظ' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div *ngIf="message" class="message" [class.error]="isError" [class.success]="!isError">
        {{ message }}
      </div>
    </div>
  `,
  styles: [`
    .priority-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 2rem;
    }

    .header h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #666;
    }

    .filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 400px;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .search-input:focus {
      outline: none;
      border-color: #108092;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
    }

    .sort-controls {
      display: flex;
      gap: 0.75rem;
    }

    .form-control {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      min-width: 120px;
    }

    .loading {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #108092;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .teachers-table {
      width: 100%;
      border-collapse: collapse;
    }

    .teachers-table th {
      background: #f5f5f5;
      padding: 1rem;
      text-align: right;
      font-weight: 600;
      color: #555;
      border-bottom: 2px solid #e0e0e0;
    }

    .teachers-table td {
      padding: 1rem;
      border-bottom: 1px solid #eee;
      vertical-align: middle;
    }

    .teachers-table tr:hover {
      background: #f9f9f9;
    }

    .teachers-table tr.inactive {
      opacity: 0.6;
    }

    .priority-col {
      width: 100px;
      text-align: center !important;
    }

    .priority-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 700;
      font-size: 1rem;
    }

    .priority-badge.high {
      background: #e8f5e9;
      color: #388e3c;
    }

    .priority-badge.medium {
      background: #fff3e0;
      color: #f57c00;
    }

    .priority-badge.low {
      background: #ffebee;
      color: #c62828;
    }

    .name-col {
      font-weight: 600;
      color: #333;
    }

    .subjects-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .subject-tag {
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .center {
      text-align: center;
    }

    .rating {
      font-weight: 600;
      color: #f57c00;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-badge.active {
      background: #e8f5e9;
      color: #388e3c;
    }

    .status-badge.inactive {
      background: #ffebee;
      color: #c62828;
    }

    .btn-edit {
      padding: 0.5rem 1rem;
      background: #108092;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-edit:hover {
      background: #0d6a7a;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #eee;
    }

    .btn-page {
      padding: 0.5rem 1rem;
      border: 2px solid #108092;
      background: white;
      color: #108092;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-page:hover:not(:disabled) {
      background: #108092;
      color: white;
    }

    .btn-page:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: #666;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 450px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .btn-close {
      width: 32px;
      height: 32px;
      border: none;
      background: #f5f5f5;
      border-radius: 50%;
      font-size: 1.5rem;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .teacher-info {
      text-align: center;
      margin-bottom: 2rem;
    }

    .teacher-info h4 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .teacher-info p {
      color: #666;
    }

    .priority-slider-container {
      text-align: center;
    }

    .priority-slider-container label {
      display: block;
      font-size: 1.125rem;
      margin-bottom: 1rem;
    }

    .priority-slider-container strong {
      font-size: 2rem;
      color: #108092;
    }

    .slider-wrapper {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .slider-label {
      font-weight: 600;
      color: #666;
    }

    .priority-slider {
      flex: 1;
      height: 8px;
      -webkit-appearance: none;
      appearance: none;
      background: linear-gradient(to right, #ffcdd2, #c8e6c9);
      border-radius: 4px;
      outline: none;
    }

    .priority-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 24px;
      height: 24px;
      background: #108092;
      border-radius: 50%;
      cursor: pointer;
    }

    .priority-description {
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 8px;
      color: #666;
      font-size: 0.9rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #eee;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #108092;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0d6a7a;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #666;
    }

    .message {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    }

    .message.success {
      background: #e8f5e9;
      color: #388e3c;
    }

    .message.error {
      background: #ffebee;
      color: #c62828;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class AdminTeacherPriorityComponent implements OnInit {
  teachers: TeacherWithPriorityDto[] = [];
  pagination: PaginationInfo | null = null;
  loading = false;
  saving = false;

  searchQuery = '';
  sortBy = 'priority';
  orderBy = 'desc';
  currentPage = 1;
  pageSize = 20;

  showModal = false;
  selectedTeacher: TeacherWithPriorityDto | null = null;
  newPriority = 5;

  message = '';
  isError = false;

  constructor(private tutoringService: TutoringService) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(): void {
    this.loading = true;
    this.tutoringService.getTeachersWithPriority(this.sortBy, this.orderBy, this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.teachers = response.data || [];
          this.pagination = response.pagination;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading teachers:', err);
          this.showMessage('حدث خطأ أثناء تحميل البيانات', true);
          this.loading = false;
        }
      });
  }

  search(): void {
    // Implement client-side search or debounce API call
    // For now, filter locally
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadTeachers();
  }

  getPriorityClass(priority: number): string {
    if (priority >= 8) return 'high';
    if (priority >= 5) return 'medium';
    return 'low';
  }

  openEditModal(teacher: TeacherWithPriorityDto): void {
    this.selectedTeacher = teacher;
    this.newPriority = teacher.priority;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedTeacher = null;
  }

  getPriorityDescription(priority: number): string {
    if (priority >= 9) return 'أولوية قصوى - سيتم اختياره أولاً في الجدولة';
    if (priority >= 7) return 'أولوية عالية - فرصة كبيرة للاختيار';
    if (priority >= 5) return 'أولوية متوسطة - فرصة عادية';
    if (priority >= 3) return 'أولوية منخفضة - سيتم اختياره إذا لم يتوفر غيره';
    return 'أولوية دنيا - نادراً ما يتم اختياره';
  }

  updatePriority(): void {
    if (!this.selectedTeacher) return;

    this.saving = true;
    this.tutoringService.updateTeacherPriority(this.selectedTeacher.id, this.newPriority)
      .subscribe({
        next: () => {
          this.showMessage('تم تحديث الأولوية بنجاح', false);
          this.loadTeachers();
          this.closeModal();
          this.saving = false;
        },
        error: (err) => {
          console.error('Error updating priority:', err);
          this.showMessage(err.error?.message || 'حدث خطأ أثناء التحديث', true);
          this.saving = false;
        }
      });
  }

  showMessage(msg: string, error: boolean): void {
    this.message = msg;
    this.isError = error;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}
