import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import { StudentInfo } from '../../../models/tutoring.models';

@Component({
  selector: 'app-step3-subjects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 3: Select Subjects for Each Student</h2>

      <div *ngFor="let student of students; let i = index" class="student-section">
        <h3 class="student-name">
          📚 {{ student.name }}'s Subjects
          <span class="year-badge">Year {{ student.yearNumber }}</span>
        </h3>

        <!-- Subject Grid -->
        <div *ngIf="!loading" class="subjects-grid">
          <div
            *ngFor="let subject of getSubjectsForStudent(student.academicYearId)"
            (click)="toggleSubject(student.id, subject)"
            [class.selected]="isSubjectSelected(student.id, subject.id)"
            class="subject-card">
            <h4>{{ subject.subjectName }}</h4>
            <p class="arabic-name">{{ subject.categoryName }}</p>
            <p class="price">From $100/10hrs</p>
            <div *ngIf="isSubjectSelected(student.id, subject.id)" class="checkmark">✓</div>
          </div>
        </div>

        <div *ngIf="loading" class="loading">Loading subjects...</div>

        <div *ngIf="!loading && getSubjectsForStudent(student.academicYearId).length === 0" class="no-subjects">
          No subjects available for Year {{ student.yearNumber }}
        </div>

        <div class="selected-count">
          Selected: {{ getSelectedCount(student.id) }} / 5 subjects
          <span *ngIf="getSelectedCount(student.id) > 1" class="discount-info">
            ({{ getSubjectDiscount(getSelectedCount(student.id)) }}% multi-subject discount!)
          </span>
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
          Next: Select Plans →
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
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .year-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .subjects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .subject-card {
      background: white;
      border: 3px solid #e0e0e0;
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .subject-card:hover {
      border-color: #108092;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(16, 128, 146, 0.2);
    }

    .subject-card.selected {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .subject-card h4 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .arabic-name {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .price {
      font-size: 0.875rem;
      font-weight: 600;
      color: #108092;
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

    .selected-count {
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      font-weight: 600;
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
