import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { StudentInfo } from '../../../models/tutoring.models';

interface HoursDiscountTiers {
  hours20: number;
  hours30: number;
}

interface SubjectDiscountTier {
  minSubjects: number;
  percentage: number;
}

const MAX_TOTAL_DISCOUNT = 20; // Maximum combined discount percentage

@Component({
  selector: 'app-step4-hours',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <div class="header">
        <h2 class="step-title">Step 5: Select Hours for Each Subject</h2>
        <p class="step-subtitle">Choose 10, 20, or 30 hours (get additional discounts)</p>
      </div>

      <div *ngFor="let student of students" class="student-section">
        <div class="student-header">
          <span class="student-icon">🎓</span>
          <h3 class="student-name">{{ student.name }}'s Hours</h3>
        </div>

        <!-- Discount Cap Info Banner -->
        <div *ngIf="getMultiSubjectDiscount(student.id) >= 20" class="discount-cap-banner maxed">
          <span class="banner-icon">⚠️</span>
          <span class="banner-text">Maximum 20% discount already applied from subjects. No additional hours discount available.</span>
        </div>
        <div *ngIf="getMultiSubjectDiscount(student.id) > 0 && getMultiSubjectDiscount(student.id) < 20" class="discount-cap-banner info">
          <span class="banner-icon">💡</span>
          <span class="banner-text">{{ getMultiSubjectDiscount(student.id) }}% discount from subjects. Hours discount limited to {{ 20 - getMultiSubjectDiscount(student.id) }}% max (20% total cap).</span>
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
              <div class="price">\${{ getSubjectPrice(subject) * 10 }}</div>
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
              <p class="duration">12 weeks · Unlocks {{ hoursDiscountTiers.hours20 }}% OFF</p>
              <div class="price">\${{ getSubjectPrice(subject) * 20 }}</div>
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
              <p class="duration">12 weeks · Unlocks {{ hoursDiscountTiers.hours30 }}% OFF</p>
              <div class="price">\${{ getSubjectPrice(subject) * 30 }}</div>
            </div>
          </div>
        </div>

        <!-- Student Total Discount Summary (Compact) -->
        <div *ngIf="getTotalStudentDiscount(student.id) > 0" class="discount-summary-compact">
          <div class="discount-pills">
            <span *ngIf="getMultiSubjectDiscount(student.id) > 0" class="discount-pill subjects">
              📚 {{ getMultiSubjectDiscount(student.id) }}%
            </span>
            <span *ngIf="getEffectiveHoursDiscount(student.id) > 0" class="discount-pill hours">
              ⏱️ {{ getEffectiveHoursDiscount(student.id) }}%
            </span>
            <span class="discount-pill total" [class.maxed]="getTotalStudentDiscount(student.id) >= 20">
              🎉 Total: {{ getTotalStudentDiscount(student.id) }}% OFF
            </span>
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

    /* Discount Cap Banner */
    .discount-cap-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .discount-cap-banner.maxed {
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      border: 2px solid #ff9800;
      color: #e65100;
    }

    .discount-cap-banner.info {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border: 2px solid #2196f3;
      color: #1565c0;
    }

    .banner-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .banner-text {
      flex: 1;
      font-weight: 500;
    }

    /* Compact Discount Summary */
    .discount-summary-compact {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #86efac;
      border-radius: 10px;
    }

    .discount-pills {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }

    .discount-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .discount-pill.subjects {
      background: #dbeafe;
      color: #1d4ed8;
      border: 1px solid #93c5fd;
    }

    .discount-pill.hours {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fcd34d;
    }

    .discount-pill.total {
      background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
    }

    .discount-pill.total.maxed {
      background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
      animation: pulse-glow 2s infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3); }
      50% { box-shadow: 0 4px 16px rgba(34, 197, 94, 0.5); }
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

  // Dynamic discount tiers loaded from API
  hoursDiscountTiers: HoursDiscountTiers = {
    hours20: 5, // Default fallback
    hours30: 10 // Default fallback
  };

  // Multi-subject discount tiers (loaded from API)
  subjectDiscountTiers: SubjectDiscountTier[] = [
    { minSubjects: 2, percentage: 5 },
    { minSubjects: 3, percentage: 10 },
    { minSubjects: 4, percentage: 15 },
    { minSubjects: 5, percentage: 20 }
  ];

  constructor(
    private stateService: TutoringStateService,
    private contentService: ContentService,
    private tutoringService: TutoringService
  ) { }

  ngOnInit(): void {
    this.restoreState();
    this.loadSubjects();
    this.loadDiscountTiers();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.students = state.students;
    this.subjectHours = new Map(state.subjectHours);
  }

  loadSubjects(): void {
    this.loading = true;
    this.contentService.getSubjects().subscribe({
      next: (response) => {
        // Handle paginated response: { items: [...], totalCount, page, ... }
        if (response && Array.isArray(response.items)) {
          this.subjects = response.items;
        } else if (response && Array.isArray(response.data)) {
          // Fallback for alternative response structure
          this.subjects = response.data;
        } else if (Array.isArray(response)) {
          // Fallback if API returns array directly
          this.subjects = response;
        } else {
          this.subjects = [];
        }
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

  calculatePrice(basePrice: number, hours: number, studentId?: number): number {
    const total = basePrice * hours;
    if (hours === 10) return total;

    // Get the effective discount (capped at remaining discount after multi-subject)
    let effectiveDiscount = 0;
    if (hours === 20) {
      effectiveDiscount = studentId
        ? this.getEffectiveHoursDiscount(studentId, 20)
        : this.hoursDiscountTiers.hours20;
    } else if (hours === 30) {
      effectiveDiscount = studentId
        ? this.getEffectiveHoursDiscount(studentId, 30)
        : this.hoursDiscountTiers.hours30;
    }

    const discountRate = effectiveDiscount / 100;
    return Math.round(total * (1 - discountRate));
  }

  /**
   * Get the number of subjects selected for a student
   */
  getStudentSubjectCount(studentId: number): number {
    return this.getStudentSubjects(studentId).length;
  }

  /**
   * Calculate multi-subject discount for a student based on number of subjects
   */
  getMultiSubjectDiscount(studentId: number): number {
    const subjectCount = this.getStudentSubjectCount(studentId);
    if (subjectCount <= 1) return 0;

    // Find the highest applicable discount tier
    let discount = 0;
    for (const tier of this.subjectDiscountTiers) {
      if (subjectCount >= tier.minSubjects) {
        discount = tier.percentage;
      }
    }
    return discount;
  }

  /**
   * Get the maximum hours selected for any subject for this student
   * Used for display purposes
   */
  getStudentMaxHours(studentId: number): number {
    const subjects = this.getStudentSubjects(studentId);
    let maxHours = 0;

    for (const subjectId of subjects) {
      const hours = this.getSelectedHours(studentId, subjectId) || 0;
      if (hours > maxHours) {
        maxHours = hours;
      }
    }

    return maxHours;
  }

  /**
   * Get the CUMULATIVE hours discount for the student
   * Each subject contributes its hours tier discount:
   * - Subject at 20h adds 5%
   * - Subject at 30h adds 10%
   * Total is summed across all subjects
   */
  getStudentHoursDiscount(studentId: number): number {
    const subjects = this.getStudentSubjects(studentId);
    let totalHoursDiscount = 0;

    for (const subjectId of subjects) {
      const hours = this.getSelectedHours(studentId, subjectId) || 0;

      if (hours >= 30) {
        totalHoursDiscount += this.hoursDiscountTiers.hours30;
      } else if (hours >= 20) {
        totalHoursDiscount += this.hoursDiscountTiers.hours20;
      }
      // 10 hours = no discount contribution
    }

    return totalHoursDiscount;
  }

  /**
   * Get the effective hours discount after applying the 20% cap rule
   * Total discount (multi-subject + hours) cannot exceed 20%
   * Hours discount is CUMULATIVE across all subjects
   */
  getEffectiveHoursDiscount(studentId: number, hours?: number): number {
    const multiSubjectDiscount = this.getMultiSubjectDiscount(studentId);
    const remainingDiscount = MAX_TOTAL_DISCOUNT - multiSubjectDiscount;

    // If multi-subject discount already reached max, no hours discount allowed
    if (remainingDiscount <= 0) {
      return 0;
    }

    // Get the CUMULATIVE hours discount for this student
    const baseHoursDiscount = this.getStudentHoursDiscount(studentId);

    // Cap the hours discount to not exceed the remaining discount
    return Math.min(baseHoursDiscount, remainingDiscount);
  }

  /**
   * Get total discount percentage for student (multi-subject + hours)
   */
  getTotalStudentDiscount(studentId: number): number {
    const multiSubject = this.getMultiSubjectDiscount(studentId);
    const hours = this.getEffectiveHoursDiscount(studentId);
    return Math.min(multiSubject + hours, MAX_TOTAL_DISCOUNT);
  }

  private loadDiscountTiers(): void {
    this.tutoringService.getDiscountRules().subscribe({
      next: (response: any) => {
        const data = response.data || response;

        // Load hours discount tiers
        if (data.hoursDiscount?.tiers) {
          this.hoursDiscountTiers = {
            hours20: data.hoursDiscount.tiers.hours20 || 5,
            hours30: data.hoursDiscount.tiers.hours30 || 10
          };
        }

        // Load multi-subject discount tiers
        if (data.multiSubjectDiscount?.tiers) {
          const tiers = data.multiSubjectDiscount.tiers;
          this.subjectDiscountTiers = [
            { minSubjects: 2, percentage: tiers.subjects2 || 5 },
            { minSubjects: 3, percentage: tiers.subjects3 || 10 },
            { minSubjects: 4, percentage: tiers.subjects4 || 15 },
            { minSubjects: 5, percentage: tiers.subjects5 || 20 }
          ];
        }

        console.log('✅ Loaded discount tiers:', {
          hours: this.hoursDiscountTiers,
          subjects: this.subjectDiscountTiers
        });
      },
      error: (err) => {
        console.error('Error loading discount tiers:', err);
        // Keep default tiers on error (already set in initialization)
      }
    });
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
