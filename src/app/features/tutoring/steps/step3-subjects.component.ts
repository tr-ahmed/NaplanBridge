import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import { StudentInfo, TeachingType } from '../../../models/tutoring.models';

@Component({
  selector: 'app-step3-teaching-type',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <div class="header">
        <h2 class="step-title">Step 4: Select Teaching Type for Each Subject</h2>
        <p class="step-subtitle">Choose One-to-One or Group sessions (35% discount for Group)</p>
      </div>

      <div *ngFor="let student of students" class="student-section">
        <div class="student-header">
          <span class="student-icon">🎓</span>
          <h3 class="student-name">{{ student.name }}'s Teaching Types</h3>
        </div>

        <div *ngFor="let subjectId of getStudentSubjects(student.id)" class="subject-row">
          <div class="subject-info">
            <h4 class="subject-title">{{ getSubjectName(subjectId) }}</h4>
          </div>

          <div class="teaching-type-options">
            <!-- One-to-One -->
            <div
              (click)="selectType(student.id, subjectId, TeachingType.OneToOne)"
              [class.selected]="getSelectedType(student.id, subjectId) === TeachingType.OneToOne"
              class="type-option">
              <div class="option-header">
                <span class="icon">👤</span>
                <h5>One-to-One</h5>
                <div *ngIf="getSelectedType(student.id, subjectId) === TeachingType.OneToOne" class="check">✓</div>
              </div>
              <p class="description">Private tutoring</p>
              <div class="price-tag">Standard Rate</div>
            </div>

            <!-- Group -->
            <div
              (click)="selectType(student.id, subjectId, TeachingType.GroupTutoring)"
              [class.selected]="getSelectedType(student.id, subjectId) === TeachingType.GroupTutoring"
              class="type-option featured">
              <span class="discount-badge">35% OFF</span>
              <div class="option-header">
                <span class="icon">👥</span>
                <h5>Group</h5>
                <div *ngIf="getSelectedType(student.id, subjectId) === TeachingType.GroupTutoring" class="check">✓</div>
              </div>
              <p class="description">Small group (2-5 students)</p>
              <div class="price-tag discount">35% Discount!</div>
            </div>
          </div>
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
          Next: Select Hours →
        </button>
      </div>
    </div>
  `,
  styles: [`
    .step-container {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 1000px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .step-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .step-subtitle {
      color: #666;
      font-size: 0.95rem;
    }

    .student-section {
      margin-bottom: 2rem;
      padding: 1.25rem;
      background: #f8f9fa;
      border-radius: 10px;
    }

    .student-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e9ecef;
    }

    .student-icon {
      font-size: 1.75rem;
      width: 45px;
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(16, 128, 146, 0.3);
    }

    .student-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
    }

    .subject-row {
      margin-bottom: 1.25rem;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .subject-row:last-child {
      margin-bottom: 0;
    }

    .subject-info {
      margin-bottom: 0.75rem;
    }

    .subject-title {
      font-size: 1rem;
      font-weight: 600;
      color: #555;
      margin: 0;
    }

    .teaching-type-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .type-option {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .type-option:hover {
      border-color: #108092;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.15);
    }

    .type-option.selected {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.2);
    }

    .type-option.featured {
      border-color: #4caf50;
    }

    .type-option.featured.selected {
      border-color: #4caf50;
    }

    .discount-badge {
      position: absolute;
      top: -10px;
      right: 10px;
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.75rem;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4);
    }

    .option-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .icon {
      font-size: 1.75rem;
    }

    .option-header h5 {
      font-size: 1rem;
      font-weight: 700;
      color: #333;
      margin: 0;
      flex: 1;
    }

    .check {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #4caf50;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4);
    }

    .description {
      color: #666;
      font-size: 0.85rem;
      margin: 0 0 0.75rem 0;
    }

    .price-tag {
      background: #f5f5f5;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-weight: 600;
      color: #666;
      font-size: 0.85rem;
      text-align: center;
    }

    .price-tag.discount {
      background: #e8f5e9;
      color: #388e3c;
    }

    .nav-buttons {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 2px solid #f0f0f0;
    }

    .btn {
      padding: 0.75rem 1.75rem;
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
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 128, 146, 0.4);
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
      box-shadow: none;
      opacity: 0.6;
    }

    @media (max-width: 768px) {
      .step-container {
        padding: 1rem;
      }

      .teaching-type-options {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .nav-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class Step3TeachingTypeComponent implements OnInit {
  TeachingType = TeachingType;

  students: StudentInfo[] = [];
  subjects: Subject[] = [];
  subjectsByYear = new Map<number, Subject[]>();
  subjectTeachingTypes = new Map<string, TeachingType>();

  constructor(
    private stateService: TutoringStateService,
    private contentService: ContentService
  ) { }

  ngOnInit(): void {
    this.restoreState();
    this.loadSubjects();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.students = state.students;
    this.subjectTeachingTypes = new Map(state.subjectTeachingTypes);
  }

  loadSubjects(): void {
    const uniqueYears = [...new Set(this.students.map(s => s.academicYearId))];

    uniqueYears.forEach(yearId => {
      this.contentService.getSubjectsByYear(yearId).subscribe({
        next: (subjects) => {
          const subjectsArray = Array.isArray(subjects) ? subjects : [];
          this.subjectsByYear.set(yearId, subjectsArray);
          this.subjects.push(...subjectsArray);
        },
        error: (error) => {
          console.error(`Error loading subjects for year ${yearId}:`, error);
          this.subjectsByYear.set(yearId, []);
        }
      });
    });
  }

  getStudentSubjects(studentId: number): number[] {
    const state = this.stateService.getState();
    const subjectSet = state.studentSubjects.get(studentId);
    return subjectSet ? Array.from(subjectSet) : [];
  }

  getSubjectName(subjectId: number): string {
    const subject = this.subjects.find(s => s.id === subjectId);
    return subject ? subject.subjectName : `Subject ${subjectId}`;
  }

  selectType(studentId: number, subjectId: number, type: TeachingType): void {
    this.stateService.setSubjectTeachingType(studentId, subjectId, type);
    const key = `${studentId}_${subjectId}`;
    this.subjectTeachingTypes.set(key, type);
  }

  getSelectedType(studentId: number, subjectId: number): TeachingType | null {
    const key = `${studentId}_${subjectId}`;
    return this.subjectTeachingTypes.get(key) || null;
  }

  canProceed(): boolean {
    return this.students.every(student => {
      const subjects = this.getStudentSubjects(student.id);
      return subjects.every(subjectId => {
        return this.getSelectedType(student.id, subjectId) !== null;
      });
    });
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
