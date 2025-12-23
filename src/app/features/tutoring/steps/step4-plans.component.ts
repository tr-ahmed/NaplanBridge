import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ContentService } from '../../../core/services/content.service';
import { TutoringPlan, TutoringPlanDto } from '../../../models/tutoring.models';
import { Subject } from '../../../models/package-pricing.model';

@Component({
  selector: 'app-step4-plans',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 4: Select Plan for Each Subject</h2>

      <div *ngFor="let student of students" class="student-section">
        <h3 class="student-name">🎓 {{ student.name }}'s Plans</h3>

        <div *ngFor="let subject of getStudentSubjects(student.id)" class="subject-plan-section">
          <h4 class="subject-title">{{ getSubjectName(subject) }}</h4>

          <div class="plans-grid">
            <!-- 10 Hours Plan -->
            <div
              (click)="selectPlan(student.id, subject, TutoringPlan.Hours10)"
              [class.selected]="getSelectedPlan(student.id, subject) === TutoringPlan.Hours10"
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
                <span class="price-amount">\${{ calculatePlanPrice(100, TutoringPlan.Hours10) }}</span>
              </div>
              <div *ngIf="getSelectedPlan(student.id, subject) === TutoringPlan.Hours10" class="checkmark">✓</div>
            </div>

            <!-- 20 Hours Plan -->
            <div
              (click)="selectPlan(student.id, subject, TutoringPlan.Hours20)"
              [class.selected]="getSelectedPlan(student.id, subject) === TutoringPlan.Hours20"
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
                <span class="original-price">\$200</span>
                <span class="price-amount">\${{ calculatePlanPrice(100, TutoringPlan.Hours20) }}</span>
              </div>
              <div *ngIf="getSelectedPlan(student.id, subject) === TutoringPlan.Hours20" class="checkmark">✓</div>
            </div>

            <!-- 30 Hours Plan -->
            <div
              (click)="selectPlan(student.id, subject, TutoringPlan.Hours30)"
              [class.selected]="getSelectedPlan(student.id, subject) === TutoringPlan.Hours30"
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
                <span class="original-price">\$300</span>
                <span class="price-amount">\${{ calculatePlanPrice(100, TutoringPlan.Hours30) }}</span>
              </div>
              <div *ngIf="getSelectedPlan(student.id, subject) === TutoringPlan.Hours30" class="checkmark">✓</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="info-box">
        <div class="info-icon">💡</div>
        <div>
          <strong>Save more with longer plans!</strong> 20hrs plan gives you 5% off, and 30hrs plan gives you 10% off.
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
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .plan-card {
      background: white;
      border: 3px solid #e0e0e0;
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .plan-card:hover {
      border-color: #108092;
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.2);
    }

    .plan-card.selected {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .plan-card.featured {
      border-color: #bf942d;
    }

    .plan-card.featured.selected {
      border-color: #bf942d;
      background: linear-gradient(135deg, #fffbf0 0%, #fff 100%);
      box-shadow: 0 4px 12px rgba(191, 148, 45, 0.3);
    }

    .popular-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #bf942d;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .plan-header h5 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #333;
      margin: 0;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #f5f5f5;
      color: #666;
    }

    .badge.discount {
      background: #4caf50;
      color: white;
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
    }

    .original-price {
      font-size: 0.875rem;
      color: #999;
      text-decoration: line-through;
      margin-bottom: 0.25rem;
    }

    .price-amount {
      font-size: 1.75rem;
      font-weight: 700;
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
export class Step4PlansComponent implements OnInit {
  TutoringPlan = TutoringPlan;

  students: { id: number; name: string }[] = [];
  subjects: Subject[] = [];
  studentSubjectPlans = new Map<string, TutoringPlan>();
  loading = false;

  constructor(
    private stateService: TutoringStateService,
    private tutoringService: TutoringService,
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    this.restoreState();
    this.loadSubjects();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    // Ensure students is always an array
    this.students = Array.isArray(state.students) ? state.students : [];
    this.studentSubjectPlans = new Map(state.studentSubjectPlans);
  }

  loadSubjects(): void {
    this.loading = true;
    this.contentService.getSubjects().subscribe({
      next: (subjects) => {
        this.subjects = subjects;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
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
    return subject ? subject.name : `Subject ${subjectId}`;
  }

  selectPlan(studentId: number, subjectId: number, plan: TutoringPlan): void {
    const key = `${studentId}_${subjectId}`;
    this.studentSubjectPlans.set(key, plan);
    this.stateService.setPlan(studentId, subjectId, plan);
  }

  getSelectedPlan(studentId: number, subjectId: number): TutoringPlan | null {
    const key = `${studentId}_${subjectId}`;
    return this.studentSubjectPlans.get(key) || null;
  }

  calculatePlanPrice(basePrice: number, plan: TutoringPlan): number {
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
