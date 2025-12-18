import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { ContentService } from '../../../core/services/content.service';
import { TeachingType } from '../../../models/tutoring.models';

interface Year {
  id: number;
  yearNumber: number;
  name?: string;
}

@Component({
  selector: 'app-step1-year-type',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 1: Select Academic Year & Teaching Type</h2>

      <!-- Academic Year Selection -->
      <div class="form-section">
        <label class="form-label">Academic Year</label>
        <select
          [(ngModel)]="selectedYearId"
          (ngModelChange)="onYearChange()"
          class="form-select">
          <option [value]="null" disabled>Select academic year</option>
          <option *ngFor="let year of years" [value]="year.id">
            Year {{ year.yearNumber }}
          </option>
        </select>
      </div>

      <!-- Teaching Type Selection -->
      <div class="form-section">
        <label class="form-label">Teaching Type</label>
        <div class="teaching-type-grid">
          <!-- One-to-One -->
          <button
            type="button"
            (click)="selectTeachingType(TeachingType.OneToOne)"
            [class.active]="teachingType === TeachingType.OneToOne"
            class="teaching-type-card">
            <div class="icon">👤</div>
            <h3>One-to-One Tutoring</h3>
            <p>Private tutoring for 1 student</p>
            <div class="price-tag">Standard Rate</div>
          </button>

          <!-- Group Tutoring -->
          <button
            type="button"
            (click)="selectTeachingType(TeachingType.GroupTutoring)"
            [class.active]="teachingType === TeachingType.GroupTutoring"
            class="teaching-type-card">
            <div class="icon">👥</div>
            <h3>Group Tutoring</h3>
            <p>Small group (2-3 students)</p>
            <div class="price-tag discount">35% OFF!</div>
          </button>
        </div>
      </div>

      <!-- Navigation -->
      <div class="nav-buttons">
        <button
          type="button"
          (click)="nextStep()"
          [disabled]="!canProceed()"
          class="btn btn-primary">
          Next: Select Students →
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

    .form-section {
      margin-bottom: 2rem;
    }

    .form-label {
      display: block;
      font-weight: 600;
      color: #555;
      margin-bottom: 0.5rem;
    }

    .form-select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-select:focus {
      outline: none;
      border-color: #108092;
    }

    .teaching-type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .teaching-type-card {
      background: white;
      border: 3px solid #e0e0e0;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .teaching-type-card:hover {
      border-color: #108092;
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.2);
    }

    .teaching-type-card.active {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .teaching-type-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .teaching-type-card p {
      color: #666;
      margin-bottom: 1rem;
    }

    .price-tag {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.875rem;
      background: #f5f5f5;
      color: #666;
    }

    .price-tag.discount {
      background: #4caf50;
      color: white;
    }

    .nav-buttons {
      display: flex;
      justify-content: flex-end;
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

    .btn-primary {
      background: #108092;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0d6a7a;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(16, 128, 146, 0.3);
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  `]
})
export class Step1YearTypeComponent implements OnInit {
  TeachingType = TeachingType;

  selectedYearId: number | null = null;
  teachingType: TeachingType = TeachingType.OneToOne;
  years: Year[] = [];
  loading = false;

  constructor(
    private stateService: TutoringStateService,
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    this.loadYears();
    this.restoreState();
  }

  loadYears(): void {
    this.loading = true;
    this.contentService.getYears().subscribe({
      next: (years) => {
        this.years = years;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading years:', error);
        this.loading = false;
      }
    });
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.selectedYearId = state.academicYearId;
    this.teachingType = state.teachingType;
  }

  onYearChange(): void {
    if (this.selectedYearId) {
      this.stateService.setAcademicYear(this.selectedYearId);
    }
  }

  selectTeachingType(type: TeachingType): void {
    this.teachingType = type;
    this.stateService.setTeachingType(type);
  }

  canProceed(): boolean {
    return this.selectedYearId !== null;
  }

  nextStep(): void {
    if (this.canProceed()) {
      this.stateService.nextStep();
    }
  }
}
