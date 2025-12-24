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
      <h2 class="step-title">Step 3: Select Teaching Type for Each Subject</h2>
      <p class="step-subtitle">Choose One-to-One or Group sessions (35% discount for Group)</p>

      <div *ngFor="let student of students" class="student-section">
        <h3 class="student-name">🎓 {{ student.name }}'s Teaching Types</h3>

        <div *ngFor="let subjectId of getStudentSubjects(student.id)" class="subject-type-section">
          <h4 class="subject-title">{{ getSubjectName(subjectId) }}</h4>

          <div class="teaching-type-grid">
            <!-- One-to-One -->
            <div
              (click)="selectType(student.id, subjectId, TeachingType.OneToOne)"
              [class.selected]="getSelectedType(student.id, subjectId) === TeachingType.OneToOne"
              class="type-card">
              <div class="icon">👤</div>
              <h5>One-to-One</h5>
              <p>Private tutoring</p>
              <ul class="benefits">
                <li>✓ Full attention</li>
                <li>✓ Flexible pace</li>
                <li>✓ Customized learning</li>
              </ul>
              <div class="price-tag">Standard Rate</div>
              <div *ngIf="getSelectedType(student.id, subjectId) === TeachingType.OneToOne" class="checkmark">✓</div>
            </div>

            <!-- Group -->
            <div
              (click)="selectType(student.id, subjectId, TeachingType.GroupTutoring)"
              [class.selected]="getSelectedType(student.id, subjectId) === TeachingType.GroupTutoring"
              class="type-card featured">
              <div class="discount-badge">35% OFF</div>
              <div class="icon">👥</div>
              <h5>Group</h5>
              <p>Small group (2-5 students)</p>
              <ul class="benefits">
                <li>✓ Interactive learning</li>
                <li>✓ Peer collaboration</li>
                <li>✓ Cost effective</li>
              </ul>
              <div class="price-tag discount">35% Discount!</div>
              <div *ngIf="getSelectedType(student.id, subjectId) === TeachingType.GroupTutoring" class="checkmark">✓</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="info-box">
        <div class="info-icon">💡</div>
        <div>
          <strong>Group Sessions:</strong> Save 35% on any subject with group tutoring! Perfect for learning with peers.
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
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .step-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .step-subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 2.5rem;
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

    .subject-type-section {
      margin-bottom: 2rem;
    }

    .subject-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #555;
      margin-bottom: 1rem;
    }

    .teaching-type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .type-card {
      background: white;
      border: 3px solid #e0e0e0;
      border-radius: 16px;
      padding: 2rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      text-align: center;
    }

    .type-card:hover {
      border-color: #108092;
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(16, 128, 146, 0.2);
    }

    .type-card.selected {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 8px 20px rgba(16, 128, 146, 0.3);
    }

    .type-card.featured {
      border-color: #4caf50;
    }

    .discount-badge {
      position: absolute;
      top: -12px;
      right: 16px;
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .type-card h5 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .type-card p {
      color: #666;
      margin-bottom: 1rem;
    }

    .benefits {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem 0;
      text-align: left;
    }

    .benefits li {
      padding: 0.25rem 0;
      color: #555;
    }

    .price-tag {
      background: #f5f5f5;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      color: #666;
    }

    .price-tag.discount {
      background: #e8f5e9;
      color: #388e3c;
    }

    .checkmark {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #4caf50;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
    }

    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
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
      padding: 0.85rem 2rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1.05rem;
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
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(16, 128, 146, 0.4);
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
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
  ) {}

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
