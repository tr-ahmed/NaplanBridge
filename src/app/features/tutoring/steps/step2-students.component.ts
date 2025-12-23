import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { UserService } from '../../../core/services/user.service';
import { TeachingType, StudentInfo } from '../../../models/tutoring.models';

interface StudentWithSelection extends StudentInfo {
  selected: boolean;
}

@Component({
  selector: 'app-step2-students',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 2: Select Students</h2>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading your students...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="error-box">
        <div class="error-icon">⚠️</div>
        <div>{{ error }}</div>
      </div>

      <!-- Students Selection -->
      <div *ngIf="!loading && !error" class="form-section">
        <label class="form-label">
          Choose which students to enroll in tutoring
          <span *ngIf="teachingType === TeachingType.GroupTutoring" class="info-text">
            (Maximum 3 students for group tutoring)
          </span>
        </label>

        <div *ngIf="availableStudents.length === 0" class="no-students">
          <p>📚 No students found. Please add a student first.</p>
          <a href="/parent/dashboard" class="btn btn-secondary">Go to Dashboard</a>
        </div>

        <div *ngIf="availableStudents.length > 0" class="students-grid">
          <div
            *ngFor="let student of availableStudents"
            (click)="toggleStudent(student)"
            [class.selected]="student.selected"
            [class.disabled]="!canSelectStudent(student)"
            class="student-card">
            <div class="checkbox">
              <input
                type="checkbox"
                [checked]="student.selected"
                [disabled]="!canSelectStudent(student)"
                (click)="$event.stopPropagation()">
            </div>
            <div class="student-info">
              <h4>{{ student.name }}</h4>
              <p class="year-info">📚 Year {{ student.yearNumber }}</p>
            </div>
            <div *ngIf="student.selected" class="checkmark">✓</div>
          </div>
        </div>

        <div *ngIf="selectedCount > 0" class="selection-summary">
          Selected: {{ selectedCount }} student{{ selectedCount > 1 ? 's' : '' }}
          <span *ngIf="teachingType === TeachingType.GroupTutoring && selectedCount > 1" class="discount-info">
            ({{ getStudentDiscount(selectedCount) }}% multi-student discount!)
          </span>
        </div>
      </div>

      <!-- Info Box -->
      <div *ngIf="teachingType === TeachingType.GroupTutoring && !loading" class="info-box">
        <div class="info-icon">💡</div>
        <div>
          <strong>Group Tutoring Benefits:</strong> 35% base discount + additional multi-student discounts!
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
          Next: Select Subjects →
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

    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #108092;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-box {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #ffebee;
      border-left: 4px solid #f44336;
      border-radius: 8px;
      margin-bottom: 2rem;
      color: #c62828;
    }

    .error-icon {
      font-size: 1.5rem;
    }

    .form-section {
      margin-bottom: 2rem;
    }

    .form-label {
      display: block;
      font-weight: 600;
      color: #555;
      margin-bottom: 1.5rem;
      font-size: 1.125rem;
    }

    .info-text {
      font-size: 0.875rem;
      color: #888;
      font-weight: normal;
      display: block;
      margin-top: 0.5rem;
    }

    .no-students {
      text-align: center;
      padding: 3rem 2rem;
      background: #f5f5f5;
      border-radius: 12px;
    }

    .no-students p {
      font-size: 1.125rem;
      color: #666;
      margin-bottom: 1.5rem;
    }

    .students-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .student-card {
      background: white;
      border: 3px solid #e0e0e0;
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .student-card:hover:not(.disabled) {
      border-color: #108092;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(16, 128, 146, 0.2);
    }

    .student-card.selected {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .student-card.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .checkbox {
      flex-shrink: 0;
    }

    .checkbox input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .student-info {
      flex: 1;
    }

    .student-info h4 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.25rem;
    }

    .year-info {
      font-size: 0.875rem;
      color: #666;
      margin: 0;
    }

    .checkmark {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #4caf50;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
    }

    .selection-summary {
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      font-weight: 600;
      color: #666;
      margin-top: 1.5rem;
      text-align: center;
    }

    .discount-info {
      color: #4caf50;
      margin-left: 0.5rem;
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
      text-decoration: none;
      display: inline-block;
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
  `]
})
export class Step2StudentsComponent implements OnInit {
  TeachingType = TeachingType;

  teachingType: TeachingType = TeachingType.OneToOne;
  availableStudents: StudentWithSelection[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private stateService: TutoringStateService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.restoreState();
    this.loadStudents();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.teachingType = state.teachingType;
  }

  loadStudents(): void {
    this.loading = true;
    this.error = null;

    this.userService.getMyStudents().subscribe({
      next: (students) => {
        const state = this.stateService.getState();
        const selectedStudentIds = new Set(state.students.map(s => s.id));

        this.availableStudents = students.map(student => ({
          id: student.id,
          name: student.userName,
          academicYearId: student.year,
          yearNumber: student.year,
          selected: selectedStudentIds.has(student.id)
        }));

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.error = 'Failed to load students. Please try again.';
        this.loading = false;
      }
    });
  }

  toggleStudent(student: StudentWithSelection): void {
    if (!this.canSelectStudent(student)) {
      return;
    }

    student.selected = !student.selected;
  }

  canSelectStudent(student: StudentWithSelection): boolean {
    if (student.selected) {
      return true; // Can always deselect
    }

    const maxStudents = this.teachingType === TeachingType.OneToOne ? 1 : 3;
    return this.selectedCount < maxStudents;
  }

  get selectedCount(): number {
    return this.availableStudents.filter(s => s.selected).length;
  }

  getStudentDiscount(count: number): number {
    if (count <= 1) return 0;
    return Math.min(count * 5, 20);
  }

  canProceed(): boolean {
    return this.selectedCount > 0;
  }

  previousStep(): void {
    this.stateService.previousStep();
  }

  nextStep(): void {
    if (this.canProceed()) {
      const selectedStudents: StudentInfo[] = this.availableStudents
        .filter(s => s.selected)
        .map(s => ({
          id: s.id,
          name: s.name,
          academicYearId: s.academicYearId,
          yearNumber: s.yearNumber
        }));

      this.stateService.setStudents(selectedStudents);
      this.stateService.nextStep();
    }
  }
}
