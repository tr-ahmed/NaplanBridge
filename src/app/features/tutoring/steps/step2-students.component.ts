import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TeachingType } from '../../../models/tutoring.models';

@Component({
  selector: 'app-step2-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 2: How Many Students?</h2>

      <!-- Student Count Selection -->
      <div class="form-section">
        <label class="form-label">Number of Students</label>
        <div class="student-count-grid">
          <button
            *ngFor="let count of allowedCounts"
            type="button"
            (click)="selectStudentCount(count)"
            [class.active]="studentCount === count"
            class="count-card">
            <div class="count-number">{{ count }}</div>
            <div class="count-label">Student{{ count > 1 ? 's' : '' }}</div>
            <div *ngIf="count > 1 && getStudentDiscount(count) > 0" class="discount-badge">
              {{ getStudentDiscount(count) }}% OFF
            </div>
          </button>
        </div>
      </div>

      <!-- Student Names Input -->
      <div *ngIf="studentCount > 0" class="form-section">
        <label class="form-label">Student Names</label>
        <div class="student-names-grid">
          <div *ngFor="let i of getRange(studentCount); let idx = index" class="name-input-group">
            <label class="input-label">Student {{ idx + 1 }}</label>
            <input
              type="text"
              [(ngModel)]="studentNames[idx]"
              placeholder="Enter student name"
              class="form-input"
              required>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div *ngIf="teachingType === TeachingType.GroupTutoring && studentCount > 1" class="info-box">
        <div class="info-icon">ℹ️</div>
        <div>
          <strong>Group Tutoring Discount:</strong> You're getting 35% off + {{ getStudentDiscount(studentCount) }}% multi-student discount!
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

    .form-section {
      margin-bottom: 2rem;
    }

    .form-label {
      display: block;
      font-weight: 600;
      color: #555;
      margin-bottom: 1rem;
      font-size: 1.125rem;
    }

    .student-count-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      max-width: 600px;
    }

    .count-card {
      background: white;
      border: 3px solid #e0e0e0;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .count-card:hover {
      border-color: #108092;
      transform: translateY(-2px);
    }

    .count-card.active {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .count-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: #108092;
      margin-bottom: 0.5rem;
    }

    .count-label {
      font-weight: 600;
      color: #666;
    }

    .discount-badge {
      position: absolute;
      top: -10px;
      right: -10px;
      background: #4caf50;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .student-names-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .name-input-group {
      display: flex;
      flex-direction: column;
    }

    .input-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .form-input {
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: #108092;
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
  `]
})
export class Step2StudentsComponent implements OnInit {
  TeachingType = TeachingType;

  teachingType: TeachingType = TeachingType.OneToOne;
  studentCount = 1;
  studentNames: string[] = [];
  allowedCounts: number[] = [];

  constructor(private stateService: TutoringStateService) {}

  ngOnInit(): void {
    this.restoreState();
    this.setAllowedCounts();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.teachingType = state.teachingType;

    if (state.students.length > 0) {
      this.studentCount = state.students.length;
      this.studentNames = state.students.map(s => s.name);
    }
  }

  setAllowedCounts(): void {
    this.allowedCounts = this.teachingType === TeachingType.OneToOne
      ? [1]
      : [1, 2, 3];
  }

  selectStudentCount(count: number): void {
    this.studentCount = count;
    // Resize array
    if (this.studentNames.length > count) {
      this.studentNames = this.studentNames.slice(0, count);
    } else {
      while (this.studentNames.length < count) {
        this.studentNames.push('');
      }
    }
  }

  getRange(n: number): number[] {
    return Array(n).fill(0).map((_, i) => i);
  }

  getStudentDiscount(count: number): number {
    if (count <= 1) return 0;
    return Math.min(count * 5, 20);
  }

  canProceed(): boolean {
    return this.studentNames.every(name => name.trim().length > 0);
  }

  previousStep(): void {
    this.stateService.previousStep();
  }

  nextStep(): void {
    if (this.canProceed()) {
      const students = this.studentNames.map((name, idx) => ({
        id: idx + 1,
        name: name.trim()
      }));
      this.stateService.setStudents(students);
      this.stateService.nextStep();
    }
  }
}
