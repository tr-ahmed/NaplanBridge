import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import {
  SmartSchedulingResponse,
  GetAvailableSlotsRequest,
  SmartSchedulingStudentSelection,
  SmartSchedulingSubjectSelection,
  ScheduledTeacherDto,
  ScheduledSlotDto,
  TeachingType,
  HoursOption
} from '../../../models/tutoring.models';

@Component({
  selector: 'app-step5-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 5: Smart Scheduling</h2>
      <p class="step-subtitle">We'll find the best teachers and times based on availability and priority</p>

      <!-- Preferences Section -->
      <div class="preferences-section">
        <h3>📅 Scheduling Preferences (Optional)</h3>
        <div class="preferences-grid">
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" [(ngModel)]="startDate" class="form-control">
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" [(ngModel)]="endDate" class="form-control">
          </div>
          <div class="form-group">
            <label>Preferred Time</label>
            <select [(ngModel)]="preferredTimeRange" class="form-control">
              <option value="">Any Time</option>
              <option value="morning">Morning (9AM - 12PM)</option>
              <option value="afternoon">Afternoon (12PM - 5PM)</option>
              <option value="evening">Evening (5PM - 9PM)</option>
            </select>
          </div>
        </div>
        <div class="preferred-days">
          <label>Preferred Days:</label>
          <div class="days-checkboxes">
            <label *ngFor="let day of daysOfWeek; let i = index" class="day-checkbox">
              <input type="checkbox" [(ngModel)]="selectedDays[i]">
              <span>{{ day }}</span>
            </label>
          </div>
        </div>
        <button class="btn btn-secondary" (click)="loadSmartSchedule()" [disabled]="loading">
          {{ loading ? 'جاري البحث...' : '🔍 Find Best Schedule' }}
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Finding the best teachers and times for you...</p>
      </div>

      <!-- Recommended Schedule -->
      <div *ngIf="!loading && scheduleResponse" class="schedule-results">
        <!-- Summary -->
        <div class="summary-card">
          <h3>📊 Schedule Summary</h3>
          <div class="summary-stats">
            <div class="stat">
              <span class="stat-value">{{ scheduleResponse.summary.totalSessions }}</span>
              <span class="stat-label">Total Sessions</span>
            </div>
            <div class="stat success">
              <span class="stat-value">{{ scheduleResponse.summary.matchedSessions }}</span>
              <span class="stat-label">Matched</span>
            </div>
            <div *ngIf="scheduleResponse.summary.unmatchedSessions > 0" class="stat warning">
              <span class="stat-value">{{ scheduleResponse.summary.unmatchedSessions }}</span>
              <span class="stat-label">Unmatched</span>
            </div>
          </div>
          <div *ngIf="scheduleResponse.summary.sameTeacherForMultipleSubjects" class="same-teacher-badge">
            ✅ Same teacher assigned for multiple subjects where possible!
          </div>
        </div>

        <!-- Teachers Schedule -->
        <div class="teachers-section">
          <h3>🎓 Recommended Teachers & Schedule</h3>

          <div *ngFor="let teacher of scheduleResponse.recommendedSchedule.teachers" class="teacher-card">
            <div class="teacher-header">
              <div class="teacher-info">
                <h4>{{ teacher.teacherName }}</h4>
                <div class="teacher-meta">
                  <span class="priority">⭐ Priority: {{ teacher.priority }}/10</span>
                  <span class="rating">Rating: {{ teacher.rating.toFixed(1) }}⭐</span>
                </div>
                <div class="matched-subjects">
                  <span *ngFor="let subject of teacher.matchedSubjects" class="subject-tag">{{ subject }}</span>
                </div>
              </div>
            </div>

            <div *ngFor="let schedule of teacher.subjectSchedules" class="subject-schedule">
              <div class="subject-schedule-header">
                <h5>📚 {{ schedule.subjectName }}</h5>
                <span class="session-type-badge" [class.group]="schedule.teachingType === 'Group'">
                  {{ schedule.teachingType }}
                </span>
                <span class="sessions-count">{{ schedule.slots.length }}/{{ schedule.totalSessions }} sessions</span>
              </div>

              <div class="slots-grid">
                <div *ngFor="let slot of schedule.slots"
                     class="slot-card"
                     [class.preferred]="slot.isPreferred"
                     (click)="toggleSlot(teacher.teacherId, schedule.subjectId, slot)">
                  <div class="slot-date">{{ formatDate(slot.dateTime) }}</div>
                  <div class="slot-time">{{ formatTime(slot.dateTime) }}</div>
                  <div class="slot-day">{{ getDayName(slot.dayOfWeek) }}</div>
                  <div *ngIf="slot.isPreferred" class="preferred-badge">⭐ Preferred</div>
                  <div *ngIf="isSlotSelected(slot)" class="checkmark">✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alternative Teachers -->
        <div *ngIf="scheduleResponse.alternativeTeachers.length > 0" class="alternatives-section">
          <h3>🔄 Alternative Teachers Available</h3>
          <div class="alternatives-grid">
            <div *ngFor="let alt of scheduleResponse.alternativeTeachers" class="alt-teacher-card">
              <h5>{{ alt.teacherName }}</h5>
              <div class="alt-meta">
                <span>Priority: {{ alt.priority }}/10</span>
                <span>Rating: {{ alt.rating.toFixed(1) }}⭐</span>
                <span>{{ alt.availableSlots }} slots available</span>
              </div>
              <div class="alt-subjects">
                <span *ngFor="let subject of alt.matchedSubjects" class="subject-tag small">{{ subject }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Schedule Found -->
      <div *ngIf="!loading && noScheduleFound" class="no-schedule">
        <div class="warning-icon">⚠️</div>
        <h3>No Available Schedule Found</h3>
        <p>Try adjusting your preferences or contact support for assistance.</p>
      </div>

      <!-- Navigation -->
      <div class="nav-buttons">
        <button
          type="button"
          (click)="previousStep()"
          class="btn btn-secondary">
          ← Back
        </button>
        <button
          type="button"
          (click)="nextStep()"
          [disabled]="!canProceed()"
          class="btn btn-primary">
          Next: Review & Pay →
        </button>
      </div>
    </div>
  `,
  styles: [`
    .step-container {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .step-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 2rem;
    }

    .student-section {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .student-section:last-of-type {
      border-bottom: none;
    }

    .student-name {
      font-size: 1.5rem;
      font-weight: 600;
      color: #108092;
      margin-bottom: 1.5rem;
    }

    .subject-schedule-section {
      margin-bottom: 2rem;
    }

    .subject-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .subject-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #555;
      margin: 0;
    }

    .slots-counter {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 1rem;
    }

    .selected-count {
      font-size: 1.5rem;
      font-weight: 700;
      color: #108092;
    }

    .separator {
      font-size: 1.25rem;
      color: #999;
    }

    .required-count {
      font-size: 1.25rem;
      font-weight: 600;
      color: #666;
    }

    .label {
      font-size: 0.875rem;
      color: #888;
      margin-left: 0.5rem;
    }

    .calendar-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .day-column {
      background: #fafafa;
      border-radius: 8px;
      padding: 0.75rem;
    }

    .day-header {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      text-align: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .slots-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .time-slot {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 0.75rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      min-height: 60px;
    }

    .time-slot:hover:not(.disabled) {
      border-color: #108092;
      transform: translateX(2px);
      box-shadow: 0 2px 6px rgba(16, 128, 146, 0.2);
    }

    .time-slot.selected {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 2px 6px rgba(16, 128, 146, 0.3);
    }

    .time-slot.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f5f5f5;
    }

    .slot-time {
      font-size: 0.875rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.25rem;
    }

    .slot-teacher {
      font-size: 0.75rem;
      color: #666;
    }

    .checkmark {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #4caf50;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
    }

    .unavailable-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #f44336;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
      font-size: 0.625rem;
      font-weight: 700;
    }

    .no-slots {
      text-align: center;
      padding: 1rem;
      color: #999;
      font-size: 0.875rem;
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

    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .info-icon {
      font-size: 1.5rem;
    }

    .nav-buttons {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #666;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }

    .btn-primary {
      background: #108092;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0d6a7a;
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .calendar-container {
        grid-template-columns: 1fr;
      }
    }

    .step-subtitle {
      color: #666;
      margin-bottom: 2rem;
      text-align: center;
    }

    .preferences-section {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .preferences-section h3 {
      margin-bottom: 1rem;
      color: #333;
    }

    .preferences-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #555;
    }

    .form-control {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
    }

    .form-control:focus {
      outline: none;
      border-color: #108092;
    }

    .preferred-days {
      margin-bottom: 1rem;
    }

    .preferred-days > label {
      font-weight: 600;
      color: #555;
      display: block;
      margin-bottom: 0.5rem;
    }

    .days-checkboxes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .day-checkbox {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
    }

    .day-checkbox input:checked + span {
      color: #108092;
      font-weight: 600;
    }

    .schedule-results {
      margin-top: 2rem;
    }

    .summary-card {
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      border: 2px solid #108092;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .summary-card h3 {
      color: #108092;
      margin-bottom: 1rem;
    }

    .summary-stats {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #333;
    }

    .stat.success .stat-value {
      color: #4caf50;
    }

    .stat.warning .stat-value {
      color: #f57c00;
    }

    .stat-label {
      color: #666;
      font-size: 0.875rem;
    }

    .same-teacher-badge {
      background: #e8f5e9;
      color: #388e3c;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      font-weight: 600;
    }

    .teachers-section {
      margin-bottom: 2rem;
    }

    .teachers-section h3 {
      margin-bottom: 1rem;
      color: #333;
    }

    .teacher-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .teacher-header {
      margin-bottom: 1rem;
    }

    .teacher-info h4 {
      font-size: 1.25rem;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .teacher-meta {
      display: flex;
      gap: 1rem;
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .priority {
      color: #f57c00;
    }

    .rating {
      color: #ffc107;
    }

    .matched-subjects {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .subject-tag {
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .subject-tag.small {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
    }

    .subject-schedule {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .subject-schedule-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .subject-schedule-header h5 {
      margin: 0;
      color: #555;
    }

    .session-type-badge {
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .session-type-badge.group {
      background: #e8f5e9;
      color: #388e3c;
    }

    .sessions-count {
      color: #666;
      font-size: 0.875rem;
    }

    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.75rem;
    }

    .slot-card {
      background: #f8f9fa;
      border: 2px solid transparent;
      border-radius: 8px;
      padding: 0.75rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      position: relative;
    }

    .slot-card:hover {
      border-color: #108092;
    }

    .slot-card.preferred {
      background: #fff3e0;
      border-color: #f57c00;
    }

    .slot-date {
      font-weight: 600;
      color: #333;
    }

    .slot-time {
      color: #666;
      font-size: 0.875rem;
    }

    .slot-day {
      color: #888;
      font-size: 0.75rem;
    }

    .preferred-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      font-size: 0.75rem;
    }

    .alternatives-section {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .alternatives-section h3 {
      margin-bottom: 1rem;
      color: #666;
    }

    .alternatives-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .alt-teacher-card {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .alt-teacher-card h5 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .alt-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      color: #666;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
    }

    .alt-subjects {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .no-schedule {
      text-align: center;
      padding: 3rem;
      background: #fff3e0;
      border-radius: 12px;
    }

    .warning-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
  `]
})
export class Step5ScheduleComponent implements OnInit {
  students: { id: number; name: string; academicYearId: number }[] = [];
  scheduleResponse: SmartSchedulingResponse | null = null;
  selectedSlots = new Set<string>();
  loading = false;
  noScheduleFound = false;

  // Preferences
  startDate = '';
  endDate = '';
  preferredTimeRange = '';
  selectedDays: boolean[] = [false, true, false, true, false, true, false]; // Default: Mon, Wed, Sat
  daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private stateService: TutoringStateService,
    private tutoringService: TutoringService,
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    this.restoreState();
    this.setDefaultDates();
    this.loadSmartSchedule();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.students = Array.isArray(state.students) ? state.students : [];
  }

  setDefaultDates(): void {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7); // Start in 1 week

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3); // 3 months duration

    this.startDate = startDate.toISOString().split('T')[0];
    this.endDate = endDate.toISOString().split('T')[0];
  }

  loadSmartSchedule(): void {
    this.loading = true;
    this.noScheduleFound = false;

    const state = this.stateService.getState();

    // Build student selections for API
    const studentSelections: SmartSchedulingStudentSelection[] = this.students.map(student => {
      const subjectIds = state.studentSubjects.get(student.id) || new Set();

      const subjects: SmartSchedulingSubjectSelection[] = Array.from(subjectIds).map(subjectId => {
        const key = `${student.id}_${subjectId}`;
        const teachingType = state.subjectTeachingTypes.get(key) || TeachingType.OneToOne;
        const hours = (state.subjectHours.get(key) || 10) as HoursOption;

        return {
          subjectId,
          teachingType,
          hours
        };
      });

      return {
        studentId: student.id,
        subjects
      };
    });

    // Build preferred days
    const preferredDays = this.selectedDays
      .map((selected, index) => selected ? index : -1)
      .filter(day => day >= 0);

    // Build time range
    let timeRange: { start: string; end: string } | undefined;
    if (this.preferredTimeRange === 'morning') {
      timeRange = { start: '09:00:00', end: '12:00:00' };
    } else if (this.preferredTimeRange === 'afternoon') {
      timeRange = { start: '12:00:00', end: '17:00:00' };
    } else if (this.preferredTimeRange === 'evening') {
      timeRange = { start: '17:00:00', end: '21:00:00' };
    }

    const request: GetAvailableSlotsRequest = {
      studentSelections,
      startDate: this.startDate,
      endDate: this.endDate,
      preferredDays: preferredDays.length > 0 ? preferredDays : undefined,
      preferredTimeRange: timeRange
    };

    this.tutoringService.getAvailableSlotsSmart(request).subscribe({
      next: (response) => {
        this.scheduleResponse = response;
        this.loading = false;

        if (!response.recommendedSchedule.teachers.length) {
          this.noScheduleFound = true;
        }
      },
      error: (err) => {
        console.error('Error loading smart schedule:', err);
        this.loading = false;
        this.noScheduleFound = true;
      }
    });
  }

  formatDate(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getDayName(dayOfWeek: number): string {
    return this.daysOfWeek[dayOfWeek];
  }

  toggleSlot(teacherId: number, subjectId: number, slot: ScheduledSlotDto): void {
    const key = `${teacherId}_${subjectId}_${slot.dateTime}`;
    if (this.selectedSlots.has(key)) {
      this.selectedSlots.delete(key);
    } else {
      this.selectedSlots.add(key);
    }
  }

  isSlotSelected(slot: ScheduledSlotDto): boolean {
    // Simple check - in real implementation, would need to track properly
    return false;
  }

  canProceed(): boolean {
    return this.scheduleResponse !== null &&
           this.scheduleResponse.recommendedSchedule.teachers.length > 0;
  }

  previousStep(): void {
    this.stateService.previousStep();
  }

  nextStep(): void {
    if (this.canProceed()) {
      this.stateService.nextStep();
    }
  }
}
