import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import {
  TeacherAvailabilityResponseDto,
  CreateTeacherAvailabilityDto,
  UpdateTeacherAvailabilityDto,
  SessionType
} from '../../../models/tutoring.models';

@Component({
  selector: 'app-teacher-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="availability-container">
      <div class="header">
        <h2>إدارة أوقات التوفر</h2>
        <button class="btn btn-primary" (click)="openAddModal()">
          <span class="icon">+</span> إضافة فترة جديدة
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>

      <!-- Availability by Day -->
      <div *ngIf="!loading" class="days-container">
        <div *ngFor="let day of daysOfWeek; let i = index" class="day-section">
          <h3 class="day-title">📅 {{ day }}</h3>

          <div *ngIf="getAvailabilityForDay(i).length === 0" class="no-slots">
            لا توجد فترات متاحة
          </div>

          <div class="slots-list">
            <div *ngFor="let slot of getAvailabilityForDay(i)" class="slot-card" [class.inactive]="!slot.isActive">
              <div class="slot-time">
                <span class="time">{{ slot.startTime | slice:0:5 }} - {{ slot.endTime | slice:0:5 }}</span>
              </div>
              <div class="slot-info">
                <span class="session-type" [class.group]="slot.sessionType === 'Group'" [class.booking-first]="slot.sessionType === 'BookingFirst'">
                  {{ getSessionTypeLabel(slot.sessionType) }}
                  <span *ngIf="slot.maxStudents">({{ slot.maxStudents }} طلاب)</span>
                </span>
                <span class="subject">{{ slot.subjectName || 'أي مادة' }}</span>
              </div>
              <div class="slot-bookings" *ngIf="slot.currentBookings > 0">
                <span class="badge">{{ slot.currentBookings }} حجز</span>
              </div>
              <div class="slot-actions">
                <button class="btn-icon edit" (click)="openEditModal(slot)" title="تعديل">✏️</button>
                <button class="btn-icon delete" (click)="confirmDelete(slot)" title="حذف">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingSlot ? 'تعديل فترة التوفر' : 'إضافة فترة جديدة' }}</h3>
            <button class="btn-close" (click)="closeModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>اليوم</label>
              <select [(ngModel)]="formData.dayOfWeek" class="form-control">
                <option *ngFor="let day of daysOfWeek; let i = index" [value]="i">{{ day }}</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>من الساعة</label>
                <input type="time" [(ngModel)]="formData.startTime" class="form-control">
              </div>
              <div class="form-group">
                <label>إلى الساعة</label>
                <input type="time" [(ngModel)]="formData.endTime" class="form-control">
              </div>
            </div>

            <div class="form-group">
              <label>نوع الجلسة</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" [(ngModel)]="formData.sessionType" value="OneToOne">
                  <span>فردية (OneToOne)</span>
                </label>
                <label class="radio-option">
                  <input type="radio" [(ngModel)]="formData.sessionType" value="Group">
                  <span>جماعية (Group)</span>
                </label>
                <label class="radio-option">
                  <input type="radio" [(ngModel)]="formData.sessionType" value="BookingFirst">
                  <span>حسب أول حجز</span>
                </label>
              </div>
            </div>

            <div *ngIf="formData.sessionType === 'Group'" class="form-group">
              <label>عدد الطلاب (2-10)</label>
              <input type="number" [(ngModel)]="formData.maxStudents" min="2" max="10" class="form-control">
            </div>

            <div class="form-group">
              <label>المادة (اختياري)</label>
              <select [(ngModel)]="formData.subjectId" class="form-control">
                <option [value]="null">أي مادة</option>
                <option *ngFor="let subject of subjects" [value]="subject.id">{{ subject.subjectName }}</option>
              </select>
            </div>

            <div *ngIf="editingSlot" class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="formData.isActive">
                <span>نشط</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">إلغاء</button>
            <button class="btn btn-primary" (click)="saveAvailability()" [disabled]="saving">
              {{ saving ? 'جاري الحفظ...' : (editingSlot ? 'تحديث' : 'إضافة') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="showDeleteConfirm" class="modal-overlay" (click)="showDeleteConfirm = false">
        <div class="modal-content small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>تأكيد الحذف</h3>
          </div>
          <div class="modal-body">
            <p>هل أنت متأكد من حذف هذه الفترة؟</p>
            <p *ngIf="deletingSlot?.currentBookings" class="warning">
              ⚠️ هناك {{ deletingSlot?.currentBookings }} حجز مرتبط بهذه الفترة
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showDeleteConfirm = false">إلغاء</button>
            <button class="btn btn-danger" (click)="deleteSlot()" [disabled]="deleting">
              {{ deleting ? 'جاري الحذف...' : 'حذف' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Error/Success Messages -->
      <div *ngIf="message" class="message" [class.error]="isError" [class.success]="!isError">
        {{ message }}
      </div>
    </div>
  `,
  styles: [`
    .availability-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #333;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: #108092;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0d6a7a;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #666;
    }

    .btn-danger {
      background: #f44336;
      color: white;
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

    .days-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .day-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .day-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #108092;
      margin-bottom: 1rem;
    }

    .no-slots {
      color: #888;
      font-style: italic;
      padding: 1rem;
      text-align: center;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .slots-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .slot-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .slot-card:hover {
      border-color: #108092;
      background: #f0f9fa;
    }

    .slot-card.inactive {
      opacity: 0.5;
      background: #f0f0f0;
    }

    .slot-time {
      min-width: 120px;
    }

    .slot-time .time {
      font-weight: 700;
      font-size: 1.1rem;
      color: #333;
    }

    .slot-info {
      flex: 1;
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .session-type {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      background: #e3f2fd;
      color: #1976d2;
    }

    .session-type.group {
      background: #e8f5e9;
      color: #388e3c;
    }

    .session-type.booking-first {
      background: #fff3e0;
      color: #f57c00;
    }

    .subject {
      color: #666;
    }

    .slot-bookings .badge {
      background: #108092;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
    }

    .slot-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s ease;
    }

    .btn-icon.edit {
      background: #e3f2fd;
    }

    .btn-icon.edit:hover {
      background: #bbdefb;
    }

    .btn-icon.delete {
      background: #ffebee;
    }

    .btn-icon.delete:hover {
      background: #ffcdd2;
    }

    /* Modal Styles */
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
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-content.small {
      max-width: 400px;
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
      line-height: 1;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #555;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #108092;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .radio-option input {
      width: 18px;
      height: 18px;
      accent-color: #108092;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-label input {
      width: 18px;
      height: 18px;
      accent-color: #108092;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #eee;
    }

    .warning {
      color: #f57c00;
      font-weight: 600;
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
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `]
})
export class TeacherAvailabilityComponent implements OnInit {
  availabilitySlots: TeacherAvailabilityResponseDto[] = [];
  subjects: Subject[] = [];
  loading = false;
  saving = false;
  deleting = false;

  showModal = false;
  showDeleteConfirm = false;
  editingSlot: TeacherAvailabilityResponseDto | null = null;
  deletingSlot: TeacherAvailabilityResponseDto | null = null;

  message = '';
  isError = false;

  daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  formData: any = {
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '10:00',
    sessionType: 'OneToOne',
    maxStudents: null,
    subjectId: null,
    isActive: true
  };

  constructor(
    private tutoringService: TutoringService,
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    this.loadAvailability();
    this.loadSubjects();
  }

  loadAvailability(): void {
    this.loading = true;
    this.tutoringService.getTeacherAvailability(true).subscribe({
      next: (response) => {
        this.availabilitySlots = response.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading availability:', err);
        this.showMessage('حدث خطأ أثناء تحميل البيانات', true);
        this.loading = false;
      }
    });
  }

  loadSubjects(): void {
    this.contentService.getSubjects().subscribe({
      next: (subjects) => {
        this.subjects = subjects;
      },
      error: (err) => {
        console.error('Error loading subjects:', err);
      }
    });
  }

  getAvailabilityForDay(dayIndex: number): TeacherAvailabilityResponseDto[] {
    return this.availabilitySlots.filter(slot => slot.dayOfWeek === dayIndex);
  }

  getSessionTypeLabel(type: string): string {
    switch (type) {
      case 'OneToOne': return 'فردية';
      case 'Group': return 'جماعية';
      case 'BookingFirst': return 'حسب أول حجز';
      default: return type;
    }
  }

  openAddModal(): void {
    this.editingSlot = null;
    this.formData = {
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '10:00',
      sessionType: 'OneToOne',
      maxStudents: null,
      subjectId: null,
      isActive: true
    };
    this.showModal = true;
  }

  openEditModal(slot: TeacherAvailabilityResponseDto): void {
    this.editingSlot = slot;
    this.formData = {
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime.slice(0, 5),
      endTime: slot.endTime.slice(0, 5),
      sessionType: slot.sessionType,
      maxStudents: slot.maxStudents,
      subjectId: slot.subjectId,
      isActive: slot.isActive
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingSlot = null;
  }

  saveAvailability(): void {
    if (!this.validateForm()) return;

    this.saving = true;
    const dto: any = {
      dayOfWeek: parseInt(this.formData.dayOfWeek),
      startTime: this.formData.startTime + ':00',
      endTime: this.formData.endTime + ':00',
      sessionType: this.formData.sessionType,
      maxStudents: this.formData.sessionType === 'Group' ? this.formData.maxStudents : null,
      subjectId: this.formData.subjectId || null
    };

    if (this.editingSlot) {
      dto.isActive = this.formData.isActive;
      this.tutoringService.updateAvailability(this.editingSlot.id, dto).subscribe({
        next: () => {
          this.showMessage('تم تحديث الفترة بنجاح', false);
          this.loadAvailability();
          this.closeModal();
          this.saving = false;
        },
        error: (err) => {
          console.error('Error updating:', err);
          this.showMessage(err.error?.message || 'حدث خطأ أثناء التحديث', true);
          this.saving = false;
        }
      });
    } else {
      this.tutoringService.createAvailability(dto).subscribe({
        next: () => {
          this.showMessage('تم إضافة الفترة بنجاح', false);
          this.loadAvailability();
          this.closeModal();
          this.saving = false;
        },
        error: (err) => {
          console.error('Error creating:', err);
          this.showMessage(err.error?.message || 'حدث خطأ أثناء الإضافة', true);
          this.saving = false;
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.formData.startTime || !this.formData.endTime) {
      this.showMessage('يرجى تحديد وقت البداية والنهاية', true);
      return false;
    }
    if (this.formData.startTime >= this.formData.endTime) {
      this.showMessage('وقت النهاية يجب أن يكون بعد وقت البداية', true);
      return false;
    }
    if (this.formData.sessionType === 'Group' && (!this.formData.maxStudents || this.formData.maxStudents < 2 || this.formData.maxStudents > 10)) {
      this.showMessage('عدد الطلاب للجلسة الجماعية يجب أن يكون بين 2 و 10', true);
      return false;
    }
    return true;
  }

  confirmDelete(slot: TeacherAvailabilityResponseDto): void {
    this.deletingSlot = slot;
    this.showDeleteConfirm = true;
  }

  deleteSlot(): void {
    if (!this.deletingSlot) return;

    this.deleting = true;
    this.tutoringService.deleteAvailability(this.deletingSlot.id).subscribe({
      next: () => {
        this.showMessage('تم حذف الفترة بنجاح', false);
        this.loadAvailability();
        this.showDeleteConfirm = false;
        this.deletingSlot = null;
        this.deleting = false;
      },
      error: (err) => {
        console.error('Error deleting:', err);
        this.showMessage(err.error?.message || 'حدث خطأ أثناء الحذف', true);
        this.deleting = false;
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
