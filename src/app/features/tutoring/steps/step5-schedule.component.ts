import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ContentService } from '../../../core/services/content.service';
import { TimeSlot, TutoringPlan } from '../../../models/tutoring.models';
import { Subject } from '../../../models/package-pricing.model';

@Component({
  selector: 'app-step5-schedule',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 5: Select Time Slots</h2>

      <div *ngFor="let student of students" class="student-section">
        <h3 class="student-name">📅 {{ student.name }}'s Schedule</h3>

        <div *ngFor="let subject of getStudentSubjects(student.id)" class="subject-schedule-section">
          <div class="subject-header">
            <h4 class="subject-title">{{ getSubjectName(subject) }}</h4>
            <div class="slots-counter">
              <span class="selected-count">{{ getSelectedSlotsCount(student.id, subject) }}</span>
              <span class="separator">/</span>
              <span class="required-count">{{ getRequiredSlots(student.id, subject) }}</span>
              <span class="label">sessions selected</span>
            </div>
          </div>

          <!-- Time Slots Grid -->
          <div *ngIf="!loading" class="calendar-container">
            <div *ngFor="let day of daysOfWeek" class="day-column">
              <h5 class="day-header">{{ day }}</h5>

              <div class="slots-list">
                <div
                  *ngFor="let slot of getSlotsByDay(day)"
                  (click)="toggleTimeSlot(student.id, subject, slot)"
                  [class.selected]="isSlotSelected(student.id, subject, slot.id)"
                  [class.disabled]="!slot.isAvailable || (!isSlotSelected(student.id, subject, slot.id) && isLimitReached(student.id, subject))"
                  class="time-slot">
                  <div class="slot-time">
                    {{ slot.startTime }} - {{ slot.endTime }}
                  </div>
                  <div *ngIf="slot.teacherName" class="slot-teacher">
                    👨‍🏫 {{ slot.teacherName }}
                  </div>
                  <div *ngIf="isSlotSelected(student.id, subject, slot.id)" class="checkmark">✓</div>
                  <div *ngIf="!slot.isAvailable" class="unavailable-badge">Full</div>
                </div>

                <div *ngIf="getSlotsByDay(day).length === 0" class="no-slots">
                  No slots available
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading available time slots...</p>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="info-box">
        <div class="info-icon">ℹ️</div>
        <div>
          <strong>Note:</strong> Select the exact number of time slots required for each subject based on your chosen plan. You can select slots from different days of the week.
        </div>
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
  `]
})
export class Step5ScheduleComponent implements OnInit {
  students: { id: number; name: string }[] = [];
  subjects: Subject[] = [];
  availableTimeSlots: TimeSlot[] = [];
  selectedSlots = new Map<string, number[]>();
  loading = false;

  daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  constructor(
    private stateService: TutoringStateService,
    private tutoringService: TutoringService,
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    this.restoreState();
    this.loadSubjects();
    this.loadTimeSlots();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    // Ensure students is always an array
    this.students = Array.isArray(state.students) ? state.students : [];
    this.selectedSlots = new Map(state.studentSubjectTimeSlots);
  }

  loadSubjects(): void {
    this.contentService.getSubjects().subscribe({
      next: (subjects) => {
        // Ensure subjects is always an array
        this.subjects = Array.isArray(subjects) ? subjects : [];
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
        this.subjects = [];
      }
    });
  }

  loadTimeSlots(): void {
    this.loading = true;
    const state = this.stateService.getState();

    this.tutoringService.getAvailableTimeSlots({
      academicYearId: state.academicYearId!,
      teachingType: state.teachingType
    }).subscribe({
      next: (slots) => {
        this.availableTimeSlots = slots;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading time slots:', error);
        // Generate mock data for demonstration
        this.generateMockTimeSlots();
        this.loading = false;
      }
    });
  }

  generateMockTimeSlots(): void {
    const slots: TimeSlot[] = [];
    let id = 1;

    this.daysOfWeek.forEach(day => {
      const times = [
        { start: '09:00', end: '10:00' },
        { start: '10:00', end: '11:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '19:00', end: '20:00' }
      ];

      times.forEach(time => {
        slots.push({
          id: id++,
          dayOfWeek: day,
          startTime: time.start,
          endTime: time.end,
          duration: 60,
          isAvailable: Math.random() > 0.2, // 80% available
          maxStudents: 3,
          teacherName: id % 3 === 0 ? 'Mr. Smith' : undefined
        });
      });
    });

    this.availableTimeSlots = slots;
  }

  getStudentSubjects(studentId: number): number[] {
    const state = this.stateService.getState();
    const subjectSet = state.studentSubjects.get(studentId);
    return subjectSet ? Array.from(subjectSet) : [];
  }

  getSubjectName(subjectId: number): string {
    const subject = this.subjects.find(s => s.id === subjectId);
    return subject ? subject.name : `Subject ${subjectId}`;
  }

  getSlotsByDay(day: string): TimeSlot[] {
    return this.availableTimeSlots.filter(slot => slot.dayOfWeek === day);
  }

  getRequiredSlots(studentId: number, subjectId: number): number {
    const plan = this.stateService.getPlan(studentId, subjectId);
    switch (plan) {
      case TutoringPlan.Hours10: return 10;
      case TutoringPlan.Hours20: return 20;
      case TutoringPlan.Hours30: return 30;
      default: return 10;
    }
  }

  getSelectedSlotsCount(studentId: number, subjectId: number): number {
    const key = `${studentId}_${subjectId}`;
    return this.selectedSlots.get(key)?.length || 0;
  }

  isLimitReached(studentId: number, subjectId: number): boolean {
    const selected = this.getSelectedSlotsCount(studentId, subjectId);
    const required = this.getRequiredSlots(studentId, subjectId);
    return selected >= required;
  }

  isSlotSelected(studentId: number, subjectId: number, slotId: number): boolean {
    const key = `${studentId}_${subjectId}`;
    return this.selectedSlots.get(key)?.includes(slotId) || false;
  }

  toggleTimeSlot(studentId: number, subjectId: number, slot: TimeSlot): void {
    if (!slot.isAvailable) return;

    const key = `${studentId}_${subjectId}`;
    let slots = this.selectedSlots.get(key) || [];

    const index = slots.indexOf(slot.id);
    if (index > -1) {
      // Remove slot
      slots = slots.filter(id => id !== slot.id);
    } else {
      // Add slot
      if (this.isLimitReached(studentId, subjectId)) {
        alert(`You can only select ${this.getRequiredSlots(studentId, subjectId)} time slots for this subject.`);
        return;
      }
      slots = [...slots, slot.id];
    }

    this.selectedSlots.set(key, slots);
    this.stateService.setTimeSlots(studentId, subjectId, slots);
  }

  canProceed(): boolean {
    // All subjects must have exactly the required number of slots selected
    return this.students.every(student => {
      const subjects = this.getStudentSubjects(student.id);
      return subjects.every(subjectId => {
        const required = this.getRequiredSlots(student.id, subjectId);
        const selected = this.getSelectedSlotsCount(student.id, subjectId);
        return selected === required;
      });
    });
  }

  previousStep(): void {
    this.stateService.previousStep();
  }

  nextStep(): void {
    if (this.canProceed()) {
      this.stateService.nextStep();
    } else {
      alert('Please select the required number of time slots for all subjects.');
    }
  }
}
