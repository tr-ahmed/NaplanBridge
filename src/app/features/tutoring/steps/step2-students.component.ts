import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import { StudentInfo } from '../../../models/tutoring.models';

interface DiscountTier {
  minSubjects: number;
  percentage: number;
}

@Component({
  selector: 'app-step2-subjects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <div class="header-section">
        <h2 class="step-title">Step 2: Select Subjects for Each Student</h2>
        <p class="step-subtitle">Choose subjects and get multi-subject discounts up to 20%</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading subjects...</p>
      </div>

      <!-- Students Subjects -->
      <div *ngFor="let student of students; let i = index" class="student-section">
        <div class="student-header">
          <div class="student-info-header">
            <div class="student-icon">📚</div>
            <div>
              <h3 class="student-name">{{ student.name }}'s Subjects</h3>
              <span class="year-badge">Year {{ student.yearNumber }}</span>
            </div>
          </div>
          <div class="selection-counter">
            <span class="counter-value">{{ getSelectedCount(student.id) }}</span>
            <span class="counter-label">/ 5 subjects</span>
          </div>
        </div>

        <!-- Discount Banner -->
        <div *ngIf="getSelectedCount(student.id) > 1" class="discount-banner">
          <div class="discount-icon">🎉</div>
          <div class="discount-content">
            <span class="discount-title">Multi-Subject Discount Applied!</span>
            <span class="discount-value">{{ getSubjectDiscount(getSelectedCount(student.id)) }}% OFF</span>
          </div>
        </div>

        <!-- Subject Grid -->
        <div *ngIf="!loading" class="subjects-grid">
          <div
            *ngFor="let subject of getSubjectsForStudent(student.academicYearId)"
            (click)="toggleSubject(student.id, subject)"
            [class.selected]="isSubjectSelected(student.id, subject.id)"
            [class.disabled]="!canSelectMoreSubjects(student.id, subject.id)"
            class="subject-card">

            <div class="card-header">
              <h4 class="subject-name">{{ subject.subjectName }}</h4>
              <div *ngIf="isSubjectSelected(student.id, subject.id)" class="checkmark">✓</div>
            </div>

            <p class="category-badge">{{ subject.categoryName }}</p>

            <div class="card-footer">
              <div class="price-tag">
                <span class="currency">$</span>
                <span class="amount">{{ getTutoringPrice(subject) }}</span>
                <span class="unit">/hr</span>
              </div>
              <div *ngIf="subject.discountPercentage > 0" class="subject-discount-badge">
                -{{ subject.discountPercentage }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Multi-Subject Discount Info -->
        <div *ngIf="getSelectedCount(student.id) > 0" class="selection-summary">
          <div class="summary-item">
            <span class="summary-label">Selected:</span>
            <span class="summary-value">{{ getSelectedCount(student.id) }} subject(s)</span>
          </div>
          <div *ngIf="getSubjectDiscount(getSelectedCount(student.id)) > 0" class="summary-item discount">
            <span class="summary-label">Discount:</span>
            <span class="summary-value">{{ getSubjectDiscount(getSelectedCount(student.id)) }}%</span>
          </div>
        </div>
      </div>

      <!-- Discount Info Box -->
      <div class="info-card">
        <div class="info-header">
          <div class="info-icon">💰</div>
          <h4>Multi-Subject Discount Tiers</h4>
        </div>
        <div class="discount-tiers">
          <div *ngFor="let tier of discountTiers; let last = last"
               class="tier-item"
               [class.featured]="last">
            <div class="tier-badge">{{ tier.minSubjects }}{{ last ? '+' : '' }}</div>
            <span class="tier-label">subjects</span>
            <span class="tier-discount">{{ tier.percentage }}% OFF</span>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="nav-buttons">
        <button
          type="button"
          (click)="previousStep()"
          class="btn btn-secondary">
          <span class="btn-icon">←</span>
          <span>Back</span>
        </button>
        <button
          type="button"
          (click)="nextStep()"
          [disabled]="!canProceed()"
          class="btn btn-primary">
          <span>Next: Teaching Type</span>
          <span class="btn-icon">→</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .step-container {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-section {
      text-align: center;
      margin-bottom: 3rem;
    }

    .step-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
    }

    .step-subtitle {
      font-size: 1.125rem;
      color: #666;
      font-weight: 400;
    }

    .loading {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #108092;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Student Section */
    .student-section {
      margin-bottom: 3rem;
      padding: 2rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 16px;
      border: 2px solid #e9ecef;
    }

    .student-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e9ecef;
    }

    .student-info-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .student-icon {
      font-size: 2.5rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .student-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 0.25rem 0;
    }

    .year-badge {
      display: inline-block;
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .selection-counter {
      text-align: right;
    }

    .counter-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #108092;
      line-height: 1;
    }

    .counter-label {
      display: block;
      font-size: 0.875rem;
      color: #666;
      margin-top: 0.25rem;
    }

    /* Discount Banner */
    .discount-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      animation: slideIn 0.5s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .discount-icon {
      font-size: 2rem;
    }

    .discount-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .discount-title {
      color: white;
      font-weight: 600;
      font-size: 1rem;
    }

    .discount-value {
      color: #fff;
      font-weight: 700;
      font-size: 1.5rem;
    }

    /* Subjects Grid */
    .subjects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .subject-card {
      background: white;
      border: 3px solid #e0e0e0;
      border-radius: 12px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .subject-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #108092, #0d6a7a);
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    .subject-card:hover:not(.disabled) {
      border-color: #108092;
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(16, 128, 146, 0.2);
    }

    .subject-card:hover:not(.disabled)::before {
      transform: scaleX(1);
    }

    .subject-card.selected {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 4px 16px rgba(16, 128, 146, 0.25);
    }

    .subject-card.selected::before {
      transform: scaleX(1);
    }

    .subject-card.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .subject-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
      line-height: 1.3;
      flex: 1;
      padding-right: 0.5rem;
    }

    .checkmark {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
    }

    .category-badge {
      display: inline-block;
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }

    .price-tag {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .currency {
      font-size: 1rem;
      font-weight: 600;
      color: #666;
    }

    .amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: #108092;
    }

    .unit {
      font-size: 0.875rem;
      font-weight: 500;
      color: #666;
    }

    .subject-discount-badge {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(245, 124, 0, 0.3);
    }

    /* Selection Summary */
    .selection-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: white;
      border-radius: 10px;
      border: 2px solid #e9ecef;
      margin-top: 1.5rem;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .summary-item.discount {
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      padding: 0.5rem 1rem;
      border-radius: 8px;
    }

    .summary-label {
      font-weight: 600;
      color: #666;
      font-size: 0.9rem;
    }

    .summary-value {
      font-weight: 700;
      color: #108092;
      font-size: 1.125rem;
    }

    .summary-item.discount .summary-value {
      color: #2e7d32;
    }

    /* Info Card */
    .info-card {
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      border: 2px solid #ffb74d;
    }

    .info-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .info-header .info-icon {
      font-size: 2.5rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }

    .info-header h4 {
      font-size: 1.375rem;
      font-weight: 700;
      color: #e65100;
      margin: 0;
    }

    .discount-tiers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
    }

    .tier-item {
      background: white;
      padding: 1.25rem;
      border-radius: 12px;
      text-align: center;
      border: 2px solid #ffe0b2;
      transition: all 0.3s ease;
    }

    .tier-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 16px rgba(255, 152, 0, 0.2);
    }

    .tier-item.featured {
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
      border-color: #4caf50;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }

    .tier-badge {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 auto 0.75rem;
      box-shadow: 0 4px 8px rgba(245, 124, 0, 0.3);
    }

    .tier-item.featured .tier-badge {
      background: white;
      color: #4caf50;
    }

    .tier-label {
      display: block;
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .tier-item.featured .tier-label {
      color: rgba(255,255,255,0.9);
    }

    .tier-discount {
      display: block;
      font-size: 1.25rem;
      font-weight: 700;
      color: #f57c00;
    }

    .tier-item.featured .tier-discount {
      color: white;
    }

    /* Navigation Buttons */
    .nav-buttons {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 2.5rem;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 1.05rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
    }

    .btn-icon {
      font-size: 1.25rem;
      transition: transform 0.3s ease;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #666;
      border: 2px solid #e0e0e0;
    }

    .btn-secondary:hover {
      background: #e9ecef;
      border-color: #ced4da;
      transform: translateX(-4px);
    }

    .btn-secondary:hover .btn-icon {
      transform: translateX(-4px);
    }

    .btn-primary {
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 128, 146, 0.4);
    }

    .btn-primary:hover:not(:disabled) .btn-icon {
      transform: translateX(4px);
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
      box-shadow: none;
      opacity: 0.6;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .step-container {
        padding: 1.5rem;
      }

      .student-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .selection-counter {
        text-align: left;
      }

      .subjects-grid {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1rem;
      }

      .discount-tiers {
        grid-template-columns: repeat(2, 1fr);
      }

      .nav-buttons {
        flex-direction: column;
      }

      .btn {
        justify-content: center;
      }
    }
  `]
})
export class Step2SubjectsComponent implements OnInit {
  students: StudentInfo[] = [];
  subjects: Subject[] = [];
  subjectsByYear = new Map<number, Subject[]>();
  studentSubjects = new Map<number, Set<number>>();
  loading = false;

  // Dynamic discount tiers loaded from API (initialized with defaults)
  discountTiers: DiscountTier[] = [
    { minSubjects: 2, percentage: 5 },
    { minSubjects: 3, percentage: 10 },
    { minSubjects: 4, percentage: 15 },
    { minSubjects: 5, percentage: 20 }
  ];

  constructor(
    private stateService: TutoringStateService,
    private tutoringService: TutoringService,
    private contentService: ContentService
  ) { }

  ngOnInit(): void {
    this.restoreState();
    this.loadSubjects();
    this.loadDiscountTiers();
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

    // Find the highest applicable discount tier
    let discount = 0;
    for (const tier of this.discountTiers) {
      if (count >= tier.minSubjects) {
        discount = tier.percentage;
      }
    }
    return discount;
  }

  private loadDiscountTiers(): void {
    this.tutoringService.getDiscountRules().subscribe({
      next: (response: any) => {
        const data = response.data || response;

        if (data.multiSubjectDiscount?.tiers) {
          const tiers = data.multiSubjectDiscount.tiers;
          this.discountTiers = [
            { minSubjects: 2, percentage: tiers.subjects2 || 5 },
            { minSubjects: 3, percentage: tiers.subjects3 || 10 },
            { minSubjects: 4, percentage: tiers.subjects4 || 15 },
            { minSubjects: 5, percentage: tiers.subjects5 || 20 }
          ];
        } else {
          // Fallback to default tiers
          this.discountTiers = [
            { minSubjects: 2, percentage: 5 },
            { minSubjects: 3, percentage: 10 },
            { minSubjects: 4, percentage: 15 },
            { minSubjects: 5, percentage: 20 }
          ];
        }

        console.log('✅ Loaded subject discount tiers:', this.discountTiers);
      },
      error: (err) => {
        console.error('Error loading discount tiers:', err);
        // Use default tiers on error
        this.discountTiers = [
          { minSubjects: 2, percentage: 5 },
          { minSubjects: 3, percentage: 10 },
          { minSubjects: 4, percentage: 15 },
          { minSubjects: 5, percentage: 20 }
        ];
      }
    });
  }

  getTutoringPrice(subject: Subject): number {
    // ✅ Use tutoring hourly rate (not self-learning subscription price)
    return subject.tutoringPricePerHour || subject.price || 100;
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
