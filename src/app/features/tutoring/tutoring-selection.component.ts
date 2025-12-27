import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TutoringStateService } from '../../core/services/tutoring-state.service';
import { Step1YearTypeComponent } from './steps/step1-year-type.component';
import { Step2SubjectsComponent } from './steps/step2-students.component';
import { Step2bTermSelectionComponent } from './steps/step2b-term-selection.component';
import { Step3TeachingTypeComponent } from './steps/step3-subjects.component';
import { Step4HoursComponent } from './steps/step4-plans.component';
import { Step5ScheduleComponent } from './steps/step5-schedule.component';
import { Step6ReviewComponent } from './steps/step6-review.component';
import { PriceSummaryComponent } from './steps/remaining-components';

@Component({
  selector: 'app-tutoring-selection',
  standalone: true,
  imports: [
    CommonModule,
    Step1YearTypeComponent,
    Step2SubjectsComponent,
    Step2bTermSelectionComponent,
    Step3TeachingTypeComponent,
    Step4HoursComponent,
    Step5ScheduleComponent,
    Step6ReviewComponent,
    PriceSummaryComponent
  ],
  template: `
    <div class="tutoring-selection-container">
      <!-- Step Indicator -->
      <div class="step-indicator">
        @for (step of displaySteps; track step.number) {
          <div 
            class="step-item"
            [class.active]="currentStep === step.number"
            [class.completed]="currentStep > step.number">
            <div class="step-circle">
              @if (currentStep > step.number) {
                <span>✓</span>
              } @else {
                <span>{{ step.displayNumber }}</span>
              }
            </div>
            <div class="step-label">{{ step.label }}</div>
          </div>
        }
      </div>

      <!-- Current Step Content -->
      <div class="step-content">
        <!-- Step 1 - Students -->
        @if (currentStep === 1) {
          <app-step1-students></app-step1-students>
        }

        <!-- Step 2 - Subjects -->
        @if (currentStep === 2) {
          <app-step2-subjects></app-step2-subjects>
        }

        <!-- Step 3 - Term Selection (NEW) -->
        @if (currentStep === 3) {
          <app-step2b-term-selection></app-step2b-term-selection>
        }

        <!-- Step 4 - Teaching Type -->
        @if (currentStep === 4) {
          <app-step3-teaching-type></app-step3-teaching-type>
        }

        <!-- Step 5 - Hours -->
        @if (currentStep === 5) {
          <app-step4-hours></app-step4-hours>
        }

        <!-- Step 6 - Schedule -->
        @if (currentStep === 6) {
          <app-step5-schedule></app-step5-schedule>
        }

        <!-- Step 7 - Review -->
        @if (currentStep === 7) {
          <app-step6-review></app-step6-review>
        }
      </div>

      <!-- Price Summary Sidebar -->
      <app-price-summary class="price-sidebar"></app-price-summary>
    </div>
  `,
  styles: [`
    .tutoring-selection-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
    }

    .step-indicator {
      grid-column: 1 / -1;
      display: flex;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding: 0 2rem;
    }

    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      position: relative;
    }

    .step-item:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 20px;
      left: 50%;
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.4);
      z-index: 1;
    }

    .step-item.completed:not(:last-child)::after {
      background: rgba(255, 255, 255, 0.7);
    }

    .step-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: white;
      border: 3px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #475569;
      margin-bottom: 0.5rem;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: relative;
      z-index: 2;
    }

    .step-item.active .step-circle {
      background: #108092;
      border-color: #108092;
      color: white;
      transform: scale(1.1);
    }

    .step-item.completed .step-circle {
      background: #4caf50;
      border-color: #4caf50;
      color: white;
    }

    .step-label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
    }

    .step-item.active .step-label {
      color: white;
      font-weight: 600;
    }

    .step-content {
      grid-column: 1;
    }

    .price-sidebar {
      grid-column: 2;
      position: sticky;
      top: 2rem;
      height: fit-content;
    }

    @media (max-width: 1024px) {
      .tutoring-selection-container {
        grid-template-columns: 1fr;
      }

      .price-sidebar {
        grid-column: 1;
        position: static;
      }
    }
  `]
})
export class TutoringSelectionComponent implements OnInit {
  currentStep = 1;

  // Updated steps to include Term Selection
  displaySteps = [
    { number: 1, displayNumber: 1, label: 'Students' },
    { number: 2, displayNumber: 2, label: 'Subjects' },
    { number: 3, displayNumber: 3, label: 'Terms' },
    { number: 4, displayNumber: 4, label: 'Teaching Type' },
    { number: 5, displayNumber: 5, label: 'Hours' },
    { number: 6, displayNumber: 6, label: 'Schedule' },
    { number: 7, displayNumber: 7, label: 'Review' }
  ];

  constructor(
    private stateService: TutoringStateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to current step
    this.stateService.state$.subscribe(state => {
      this.currentStep = state.currentStep;
    });
  }
}

