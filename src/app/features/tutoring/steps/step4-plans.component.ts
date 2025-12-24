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
      <h2 class="step-title">Step 4: Select Hours for Each Subject</h2>
      <p class="step-subtitle">Choose 10, 20, or 30 hours (get additional discounts)</p>

      <div *ngFor="let student of students" class="student-section">
        <h3 class="student-name">🎓 {{ student.name }}'s Hours</h3>

        <div *ngFor="let subject of getStudentSubjects(student.id)" class="subject-plan-section">
          <h4 class="subject-title">{{ getSubjectName(subject) }}</h4>

          <div class="plans-grid">
            <!-- 10 Hours -->
            <div
              (click)="selectHours(student.id, subject, 10)"
              [class.selected]="getSelectedHours(student.id, subject) === 10"
              class="plan-card">
              <div class="plan-header">
                <h5>10 Hours</h5>
                <span class="badge">Standard</span>
              </div>
              <div class="plan-details">
                <p class="duration">Over 12 weeks</p>
                <p class="sessions">10 sessions × 1 hour</p>
              </div>
              <div class="plan-price">
                <span class="price-amount">$<span>{{ calculatePrice(getSubjectPrice(subject), 10) }}</span></span>
              </div>
              <div *ngIf="getSelectedHours(student.id, subject) === 10" class="checkmark">✓</div>
            </div>

            <!-- 20 Hours -->
            <div
              (click)="selectHours(student.id, subject, 20)"
              [class.selected]="getSelectedHours(student.id, subject) === 20"
              class="plan-card featured">
              <div class="popular-badge">Most Popular</div>
              <div class="plan-header">
                <h5>20 Hours</h5>
                <span class="badge discount">5% OFF</span>
              </div>
              <div class="plan-details">
                <p class="duration">Over 12 weeks</p>
                <p class="sessions">20 sessions × 1 hour</p>
              </div>
              <div class="plan-price">
                <span class="original-price">$<span>{{ getSubjectPrice(subject) * 2 }}</span></span>
                <span class="price-amount">$<span>{{ calculatePrice(getSubjectPrice(subject), 20) }}</span></span>
              </div>
              <div *ngIf="getSelectedHours(student.id, subject) === 20" class="checkmark">✓</div>
            </div>

            <!-- 30 Hours -->
            <div
              (click)="selectHours(student.id, subject, 30)"
              [class.selected]="getSelectedHours(student.id, subject) === 30"
              class="plan-card premium">
              <div class="plan-header">
                <h5>30 Hours</h5>
                <span class="badge discount">10% OFF</span>
              </div>
              <div class="plan-details">
                <p class="duration">Over 12 weeks</p>
                <p class="sessions">30 sessions × 1 hour</p>
              </div>
              <div class="plan-price">
                <span class="original-price">$<span>{{ getSubjectPrice(subject) * 3 }}</span></span>
                <span class="price-amount">$<span>{{ calculatePrice(getSubjectPrice(subject), 30) }}</span></span>
              </div>
              <div *ngIf="getSelectedHours(student.id, subject) === 30" class="checkmark">✓</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="info-box">
        <div class="info-icon">💡</div>
        <div>
          <strong>Hours Discounts:</strong> 20 hours = 5% OFF | 30 hours = 10% OFF
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

    .subject-plan-section {
      margin-bottom: 2rem;
    }

    .subject-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #555;
      margin-bottom: 1rem;
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1rem;
    }

    .plan-card {
      background: white;
      border: 3px solid #e0e0e0;
      border-radius: 16px;
      padding: 2rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      min-height: 280px;
      display: flex;
      flex-direction: column;
    }

    .plan-card:hover {
      border-color: #108092;
      transform: translateY(-6px);
      box-shadow: 0 8px 24px rgba(16, 128, 146, 0.25);
    }

    .plan-card.selected {
      border-color: #108092;
      border-width: 4px;
      background: linear-gradient(135deg, #e8f5f7 0%, #fff 100%);
      box-shadow: 0 8px 28px rgba(16, 128, 146, 0.35);
      transform: scale(1.02);
    }

    .plan-card.featured {
      border-color: #bf942d;
      position: relative;
    }

    .plan-card.featured.selected {
      border-color: #bf942d;
      border-width: 4px;
      background: linear-gradient(135deg, #fffcf0 0%, #fff 100%);
      box-shadow: 0 8px 28px rgba(191, 148, 45, 0.35);
    }

    .popular-badge {
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #d4a839 0%, #bf942d 100%);
      color: white;
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(191, 148, 45, 0.4);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: translateX(-50%) scale(1); }
      50% { transform: translateX(-50%) scale(1.05); }
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .plan-header h5 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1a1a1a;
      margin: 0;
    }

    .badge {
      padding: 0.35rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      background: #f5f5f5;
      color: #666;
      letter-spacing: 0.5px;
    }

    .badge.discount {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
    }

    .plan-details {
      margin-bottom: 1rem;
    }

    .duration {
      font-size: 0.875rem;
      color: #666;
      margin: 0.25rem 0;
    }

    .sessions {
      font-size: 0.875rem;
      color: #888;
      margin: 0.25rem 0;
    }

    .plan-price {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-top: auto;
      padding-top: 1rem;
    }

    .original-price {
      font-size: 1rem;
      color: #999;
      text-decoration: line-through;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .price-amount {
      font-size: 2.25rem;
      font-weight: 900;
      color: #108092;
      line-height: 1;
      letter-spacing: -1px;
    }

    .plan-card.featured .price-amount {
      color: #bf942d;
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
      animation: checkmarkBounce 0.5s ease;
    }

    @keyframes checkmarkBounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #fff8e1;
      border-left: 4px solid #ffc107;
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
    return subject ? subject.price : 100;
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
    switch (plan) {
      case TutoringPlan.Hours10:
        return basePrice;
      case TutoringPlan.Hours20:
        return Math.round(basePrice * 2 * 0.95); // 5% discount
      case TutoringPlan.Hours30:
        return Math.round(basePrice * 3 * 0.90); // 10% discount
      default:
        return basePrice;
    }
  }

  canProceed(): boolean {
    // All student subjects must have a plan selected
    return this.students.every(student => {
      const subjects = this.getStudentSubjects(student.id);
      return subjects.every(subjectId => {
        return this.getSelectedPlan(student.id, subjectId) !== null;
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
