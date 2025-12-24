import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import { StudentInfo } from '../../../models/tutoring.models';

@Component({
  selector: 'app-step2-subjects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 2: Select Subjects for Each Student</h2>
      <p class="step-subtitle">Choose subjects and get multi-subject discounts up to 20%</p>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading subjects...</p>
      </div>

      <!-- Students Subjects -->
      <div *ngFor="let student of students; let i = index" class="student-section">
        <h3 class="student-name">
          📚 {{ student.name }}'s Subjects
          <span class="year-badge">Year {{ student.yearNumber }}</span>
        </h3>

        <!-- Discount Info -->
        <div *ngIf="getSelectedCount(student.id) > 1" class="discount-banner">
          🎉 {{ getSubjectDiscount(getSelectedCount(student.id)) }}% Multi-Subject Discount Applied!
        </div>

        <!-- Subject Grid -->
        <div *ngIf="!loading" class="subjects-grid">
          <div
            *ngFor="let subject of getSubjectsForStudent(student.academicYearId)"
            (click)="toggleSubject(student.id, subject)"
            [class.selected]="isSubjectSelected(student.id, subject.id)"
            [class.disabled]="!canSelectMoreSubjects(student.id, subject.id)"
            class="subject-card">
            <h4>{{ subject.subjectName }}</h4>
            <p class="category-name">{{ subject.categoryName }}</p>
            <div class="price-section">
              <p class="price">$<span>{{ subject.price }}</span></p>
              <div *ngIf="subject.discountPercentage > 0" class="subject-discount">
                <span class="discount-badge">{{ subject.discountPercentage }}% OFF</span>
              </div>
            </div>
            <div *ngIf="isSubjectSelected(student.id, subject.id)" class="checkmark">✓</div>
          </div>
        </div>

        <!-- Selected Count -->
        <div class="selection-info">
          <p>Selected: {{ getSelectedCount(student.id) }} / 5 subjects</p>
          <p *ngIf="getSelectedCount(student.id) >= 1" class="discount-text">
            Discount: {{ getSubjectDiscount(getSelectedCount(student.id)) }}%
          </p>
        </div>
      </div>

      <!-- Overall Info Box -->
      <div class="info-box">
        <div class="info-icon">💡</div>
        <div>
          <strong>Multi-Subject Discounts:</strong>
          <ul>
            <li>2 subjects = 5% discount</li>
            <li>3 subjects = 10% discount</li>
            <li>4 subjects = 15% discount</li>
            <li>5+ subjects = 20% discount (Maximum!)</li>
          </ul>
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
          Next: Select Teaching Type →
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
export class Step2SubjectsComponent implements OnInit {
  students: StudentInfo[] = [];
  subjects: Subject[] = [];
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
    this.students = state.students;
    this.studentSubjects = new Map(state.studentSubjects);
  }

  loadSubjects(): void {
    this.loading = true;
    
    const uniqueYears = [...new Set(this.students.map(s => s.academicYearId))];
    
    let loadedCount = 0;
    uniqueYears.forEach(yearId => {
      this.contentService.getSubjectsByYear(yearId).subscribe({
        next: (subjects) => {
          const subjectsArray = Array.isArray(subjects) ? subjects : [];
          this.subjectsByYear.set(yearId, subjectsArray);
          this.subjects.push(...subjectsArray);
          
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
    
    if (uniqueYears.length === 0) {
      this.loading = false;
    }
  }

  getSubjectsForStudent(yearId: number): Subject[] {
    return this.subjectsByYear.get(yearId) || [];
  }

  toggleSubject(studentId: number, subject: Subject): void {
    if (!this.canSelectMoreSubjects(studentId, subject.id)) {
      return;
    }

    if (!this.studentSubjects.has(studentId)) {
      this.studentSubjects.set(studentId, new Set());
    }

    const subjects = this.studentSubjects.get(studentId)!;
    if (subjects.has(subject.id)) {
      subjects.delete(subject.id);
    } else {
      subjects.add(subject.id);
    }

    this.saveSelection();
  }

  isSubjectSelected(studentId: number, subjectId: number): boolean {
    return this.studentSubjects.get(studentId)?.has(subjectId) || false;
  }

  canSelectMoreSubjects(studentId: number, subjectId: number): boolean {
    if (this.isSubjectSelected(studentId, subjectId)) {
      return true; // Can always deselect
    }
    return this.getSelectedCount(studentId) < 5;
  }

  getSelectedCount(studentId: number): number {
    return this.studentSubjects.get(studentId)?.size || 0;
  }

  getSubjectDiscount(count: number): number {
    if (count <= 1) return 0;
    if (count === 2) return 5;
    if (count === 3) return 10;
    if (count === 4) return 15;
    return 20; // 5+ subjects
  }

  saveSelection(): void {
    this.stateService.setStudentSubjects(this.studentSubjects);
  }

  canProceed(): boolean {
    return this.students.every(student => this.getSelectedCount(student.id) > 0);
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
