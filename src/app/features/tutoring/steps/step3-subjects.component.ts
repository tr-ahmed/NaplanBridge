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
      box-shadow: 0 6px 16px rgba(16, 128, 146, 0.2);
    }

    .type-card.selected {
      border-color: #108092;
      border-width: 4px;
      background: linear-gradient(135deg, #e8f5f7 0%, #fff 100%);
      box-shadow: 0 6px 16px rgba(16, 128, 146, 0.3);
    }

    .type-card.featured {
      border-color: #bf942d;
    }

    .type-card.featured.selected {
      border-color: #bf942d;
      border-width: 4px;
      background: linear-gradient(135deg, #fffcf0 0%, #fff 100%);
      box-shadow: 0 6px 16px rgba(191, 148, 45, 0.3);
    }

    .discount-badge {
      position: absolute;
      top: -12px;
      right: 20px;
      background: linear-gradient(135deg, #d4a839 0%, #bf942d 100%);
      color: white;
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(191, 148, 45, 0.4);
    }

    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .type-card h5 {
      font-size: 1.5rem;
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
      margin: 1rem 0;
      text-align: left;
    }

    .benefits li {
      padding: 0.5rem 0;
      color: #555;
      font-size: 0.9rem;
    }

    .price-tag {
      display: inline-block;
      padding: 0.6rem 1.2rem;
      border-radius: 25px;
      font-weight: 600;
      background: #f5f5f5;
      color: #666;
      font-size: 0.9rem;
    }

    .price-tag.discount {
      background: #4caf50;
      color: white;
    }

    .checkmark {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 1.125rem;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
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
      justify-content: space-between;
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
      color: #666;
      text-align: center;
    }

    .discount-info {
      color: #4caf50;
      margin-left: 0.5rem;
    }

    .loading, .no-subjects {
      text-align: center;
      padding: 2rem;
      color: #666;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 1rem;
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
export class Step3SubjectsComponent implements OnInit {
  students: StudentInfo[] = [];
  allSubjects: Subject[] = [];
  subjectsByYear = new Map<number, Subject[]>();
  studentSubjects = new Map<number, Set<number>>();
  loading = false;

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
    this.students = Array.isArray(state.students) ? state.students : [];
    this.studentSubjects = new Map(state.studentSubjects);

    // Initialize empty sets for new students
    this.students.forEach(s => {
      if (!this.studentSubjects.has(s.id)) {
        this.studentSubjects.set(s.id, new Set());
      }
    });
  }

  loadSubjects(): void {
    this.loading = true;

    // Get unique year IDs from students
    const uniqueYears = [...new Set(this.students.map(s => s.academicYearId))];

    // Load subjects for each year
    let loadedCount = 0;
    uniqueYears.forEach(yearId => {
      this.contentService.getSubjectsByYear(yearId).subscribe({
        next: (subjects) => {
          const subjectsArray = Array.isArray(subjects) ? subjects : [];
          this.subjectsByYear.set(yearId, subjectsArray);
          this.allSubjects.push(...subjectsArray);

          loadedCount++;
          if (loadedCount === uniqueYears.length) {
            this.loading = false;
          }
        },
        error: (error) => {
          console.error(`Error loading subjects for year ${yearId}:`, error);
          this.subjectsByYear.set(yearId, []);

          loadedCount++;
          if (loadedCount === uniqueYears.length) {
            this.loading = false;
          }
        }
      });
    });

    // Handle case where there are no students
    if (uniqueYears.length === 0) {
      this.loading = false;
    }
  }

  getSubjectsForStudent(academicYearId: number): Subject[] {
    return this.subjectsByYear.get(academicYearId) || [];
  }

  toggleSubject(studentId: number, subject: Subject): void {
    const selected = this.studentSubjects.get(studentId)!;

    if (selected.has(subject.id)) {
      selected.delete(subject.id);
    } else {
      if (selected.size < 5) {
        selected.add(subject.id);
      } else {
        alert('Maximum 5 subjects per student');
        return;
      }
    }

    this.stateService.setStudentSubjects(this.studentSubjects);
  }

  isSubjectSelected(studentId: number, subjectId: number): boolean {
    return this.studentSubjects.get(studentId)?.has(subjectId) || false;
  }

  getSelectedCount(studentId: number): number {
    return this.studentSubjects.get(studentId)?.size || 0;
  }

  getSubjectDiscount(count: number): number {
    if (count <= 1) return 0;
    return Math.min(count * 5, 20);
  }

  canProceed(): boolean {
    return this.students.every(s => this.getSelectedCount(s.id) > 0);
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
