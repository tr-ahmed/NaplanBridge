import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { UserService } from '../../../core/services/user.service';
import { TeachingType, StudentInfo } from '../../../models/tutoring.models';

interface StudentWithSelection extends StudentInfo {
  selected: boolean;
}

@Component({
  selector: 'app-step1-students',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 1: Select Students for Tutoring</h2>
      <p class="step-subtitle">Choose which students you want to enroll</p>

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
        <div class="section-header">
          <label class="form-label">Select Students</label>
          <button type="button" (click)="addNewStudent()" class="btn btn-add">
            <span class="icon">+</span> Add New Student
          </button>
        </div>

        <div *ngIf="availableStudents.length === 0" class="no-students">
          <p>📚 No students found. Please add a student first.</p>
          <button type="button" (click)="addNewStudent()" class="btn btn-primary">
            Add Your First Student
          </button>
        </div>

        <div *ngIf="availableStudents.length > 0" class="students-grid">
          <div
            *ngFor="let student of availableStudents"
            (click)="toggleStudent(student)"
            [class.selected]="student.selected"
            class="student-card">
            <div class="checkbox">
              <input
                type="checkbox"
                [checked]="student.selected"
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
        </div>
      </div>

      <!-- Info Box -->
      <div *ngIf="!loading" class="info-box">
        <div class="info-icon">💡</div>
        <div>
          <strong>Flexible Learning:</strong> You can select teaching type and hours for each subject individually in the next steps.
        </div>
      </div>

      <!-- Navigation -->
      <div class="nav-buttons">
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
      max-width: 900px;
      margin: 0 auto;
    }

    .step-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .step-subtitle {
      font-size: 1rem;
      color: #666;
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .form-label {
      font-size: 1.125rem;
      font-weight: 600;
      color: #333;
    }

    .btn-add {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: #108092;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-add .icon {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .btn-add:hover {
      background: #0d6a7a;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
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

    .no-students {
      text-align: center;
      padding: 3rem;
      background: #f5f5f5;
      border-radius: 12px;
      margin-bottom: 2rem;
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
      margin-bottom: 1.5rem;
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

    .student-card:hover {
      border-color: #108092;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.2);
    }

    .student-card.selected {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .checkbox {
      flex-shrink: 0;
    }

    .checkbox input[type="checkbox"] {
      width: 24px;
      height: 24px;
      cursor: pointer;
      accent-color: #108092;
    }

    .student-info {
      flex: 1;
    }

    .student-info h4 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 0.5rem 0;
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
    }

    .selection-summary {
      text-align: center;
      padding: 1rem;
      background: #e8f5f7;
      border-radius: 8px;
      font-weight: 600;
      color: #108092;
    }

    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #e3f2fd 0%, #f0f9fa 100%);
      border-left: 4px solid #2196f3;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .info-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .nav-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.875rem 2.5rem;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 1.05rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #108092;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0d6a7a;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(16, 128, 146, 0.4);
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class Step1YearTypeComponent implements OnInit {
  availableStudents: StudentWithSelection[] = [];
  selectedCount = 0;
  loading = false;
  error: string | null = null;

  constructor(
    private stateService: TutoringStateService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStudents();
    this.restoreState();
  }

  loadStudents(): void {
    this.loading = true;
    this.error = null;

    this.userService.getMyStudents().subscribe({
      next: (students) => {
        // Map API response to StudentWithSelection interface
        // ChildDto has: id, userName, email, age, year
        this.availableStudents = students.map(s => ({
          id: s.id,
          name: s.userName || `Student ${s.id}`,
          academicYearId: s.year || 1,
          yearNumber: s.year || 1,
          selected: false
        }));
        this.restoreSelections();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.error = 'Failed to load students. Please try again.';
        this.loading = false;
      }
    });
  }

  restoreState(): void {
    const savedStudents = this.stateService.getStudents();
    if (savedStudents.length > 0) {
      this.restoreSelections();
    }
  }

  restoreSelections(): void {
    const savedStudents = this.stateService.getStudents();
    const savedIds = new Set(savedStudents.map(s => s.id));

    this.availableStudents.forEach(student => {
      student.selected = savedIds.has(student.id);
    });

    this.updateSelectedCount();
  }

  toggleStudent(student: StudentWithSelection): void {
    student.selected = !student.selected;
    this.updateSelectedCount();
    this.saveSelection();
  }

  updateSelectedCount(): void {
    this.selectedCount = this.availableStudents.filter(s => s.selected).length;
  }

  saveSelection(): void {
    const selected = this.availableStudents
      .filter(s => s.selected)
      .map(s => ({
        id: s.id,
        name: s.name,
        academicYearId: s.academicYearId,
        yearNumber: s.yearNumber
      }));

    this.stateService.setStudents(selected);
  }

  addNewStudent(): void {
    // Navigate to add student page
    this.router.navigate(['/parent/dashboard'], {
      queryParams: { action: 'add-student' }
    });
  }

  canProceed(): boolean {
    return this.selectedCount > 0;
  }

  nextStep(): void {
    if (this.canProceed()) {
      this.stateService.nextStep();
    }
  }
}

