import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import { StudentInfo } from '../../../models/tutoring.models';

@Component({
  selector: 'app-step4-hours',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <div class="header">
        <h2 class="step-title">Step 4: Select Hours for Each Subject</h2>
        <p class="step-subtitle">Choose 10, 20, or 30 hours (get additional discounts)</p>
      </div>

      <div *ngFor="let student of students" class="student-section">
        <div class="student-header">
          <span class="student-icon">🎓</span>
          <h3 class="student-name">{{ student.name }}'s Hours</h3>
        </div>

        <div *ngFor="let subject of getStudentSubjects(student.id)" class="subject-row">
          <div class="subject-info">
            <h4 class="subject-title">{{ getSubjectName(subject) }}</h4>
          </div>

          <div class="hours-options">
            <!-- 10 Hours -->
            <div
              (click)="selectHours(student.id, subject, 10)"
              [class.selected]="getSelectedHours(student.id, subject) === 10"
              class="hours-option">
              <div class="option-header">
                <h5>10 Hours</h5>
                <div *ngIf="getSelectedHours(student.id, subject) === 10" class="check">✓</div>
              </div>
              <p class="duration">12 weeks</p>
              <div class="price">\${{ calculatePrice(getSubjectPrice(subject), 10) }}</div>
            </div>

            <!-- 20 Hours -->
            <div
              (click)="selectHours(student.id, subject, 20)"
              [class.selected]="getSelectedHours(student.id, subject) === 20"
              class="hours-option featured">
              <span class="badge">Popular</span>
              <div class="option-header">
                <h5>20 Hours</h5>
                <div *ngIf="getSelectedHours(student.id, subject) === 20" class="check">✓</div>
              </div>
              <p class="duration">12 weeks · 5% OFF</p>
              <div class="price-wrapper">
                <span class="original">\${{ getSubjectPrice(subject) * 2 }}</span>
                <div class="price">\${{ calculatePrice(getSubjectPrice(subject), 20) }}</div>
              </div>
            </div>

            <!-- 30 Hours -->
            <div
              (click)="selectHours(student.id, subject, 30)"
              [class.selected]="getSelectedHours(student.id, subject) === 30"
              class="hours-option premium">
              <span class="badge best">Best Value</span>
              <div class="option-header">
                <h5>30 Hours</h5>
                <div *ngIf="getSelectedHours(student.id, subject) === 30" class="check">✓</div>
              </div>
              <p class="duration">12 weeks · 10% OFF</p>
              <div class="price-wrapper">
                <span class="original">\${{ getSubjectPrice(subject) * 3 }}</span>
                <div class="price">\${{ calculatePrice(getSubjectPrice(subject), 30) }}</div>
              </div>
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
          Next: Schedule Sessions →
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

    .hours-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .hours-option {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      text-align: center;
    }

    .hours-option:hover {
      border-color: #108092;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.15);
    }

    .hours-option.selected {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.2);
    }

    .hours-option.featured {
      border-color: #bf942d;
    }

    .hours-option.featured.selected {
      border-color: #bf942d;
      background: linear-gradient(135deg, #fffcf0 0%, #fff 100%);
    }

    .hours-option.premium {
      border-color: #4caf50;
    }

    .hours-option.premium.selected {
      border-color: #4caf50;
      background: linear-gradient(135deg, #f0fff4 0%, #fff 100%);
    }

    .badge {
      position: absolute;
      top: -8px;
      right: 8px;
      background: linear-gradient(135deg, #bf942d 0%, #a07e26 100%);
      color: white;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(191, 148, 45, 0.4);
    }

    .badge.best {
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
      box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4);
    }

    .option-header {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      position: relative;
    }

    .option-header h5 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #333;
      margin: 0;
    }

    .check {
      position: absolute;
      right: -8px;
      top: 50%;
      transform: translateY(-50%);
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #4caf50;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4);
    }

    .duration {
      font-size: 0.8rem;
      color: #666;
      margin: 0 0 0.75rem 0;
    }

    .price-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .original {
      font-size: 0.85rem;
      color: #999;
      text-decoration: line-through;
    }

    .price {
      font-size: 1.5rem;
      font-weight: 700;
      color: #108092;
    }

    .hours-option.featured .price {
      color: #bf942d;
    }

    .hours-option.premium .price {
      color: #4caf50;
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

      .hours-options {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .nav-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class Step4HoursComponent implements OnInit {
  students: StudentInfo[] = [];
  subjects: Subject[] = [];
  subjectHours = new Map<string, number>();
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
    this.subjectHours = new Map(state.subjectHours);
  }

  loadSubjects(): void {
    this.loading = true;
    this.contentService.getSubjects().subscribe({
      next: (subjects) => {
        this.subjects = Array.isArray(subjects) ? subjects : [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
        this.subjects = [];
        this.loading = false;
      }
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

  getSubjectPrice(subjectId: number): number {
    const subject = this.subjects.find(s => s.id === subjectId);
    // ✅ Use tutoring price per hour (not self-learning subscription price)
    return subject?.tutoringPricePerHour || subject?.price || 100;
  }

  selectHours(studentId: number, subjectId: number, hours: number): void {
    this.stateService.setSubjectHours(studentId, subjectId, hours);
    const key = `${studentId}_${subjectId}`;
    this.subjectHours.set(key, hours);
  }

  getSelectedHours(studentId: number, subjectId: number): number | null {
    const key = `${studentId}_${subjectId}`;
    return this.subjectHours.get(key) || null;
  }

  calculatePrice(basePrice: number, hours: number): number {
    const total = basePrice * hours;
    if (hours === 10) return total;
    if (hours === 20) return Math.round(total * 0.95); // 5% discount
    if (hours === 30) return Math.round(total * 0.90); // 10% discount
    return total;
  }

  canProceed(): boolean {
    return this.students.every(student => {
      const subjects = this.getStudentSubjects(student.id);
      return subjects.every(subjectId => {
        return this.getSelectedHours(student.id, subjectId) !== null;
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
