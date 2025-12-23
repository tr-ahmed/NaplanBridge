import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TeachingType } from '../../../models/tutoring.models';

@Component({
  selector: 'app-step1-year-type',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 1: Select Teaching Type</h2>
      <p class="step-subtitle">Choose how you want your children to learn</p>

      <!-- Teaching Type Selection -->
      <div class="teaching-type-grid">
        <!-- One-to-One -->
        <button
          type="button"
          (click)="selectTeachingType(TeachingType.OneToOne)"
          [class.active]="teachingType === TeachingType.OneToOne"
          class="teaching-type-card">
          <div class="icon">👤</div>
          <h3>One-to-One Tutoring</h3>
          <p>Private tutoring for individual students</p>
          <ul class="benefits">
            <li>✓ Personalized attention</li>
            <li>✓ Flexible schedule</li>
            <li>✓ Customized pace</li>
          </ul>
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
          <p>Small group sessions (2-3 students)</p>
          <ul class="benefits">
            <li>✓ Interactive learning</li>
            <li>✓ Peer collaboration</li>
            <li>✓ Cost effective</li>
          </ul>
          <div class="price-tag discount">35% OFF!</div>
        </button>
      </div>

      <!-- Info Box -->
      <div *ngIf="teachingType === TeachingType.GroupTutoring" class="info-box">
        <div class="info-icon">💡</div>
        <div>
          <strong>Group Tutoring Benefits:</strong> Save 35% on all sessions! Perfect for siblings or friends learning together.
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
      max-width: 900px;
      margin: 0 auto;
    }

    .step-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .step-subtitle {
      font-size: 1rem;
      color: #666;
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .teaching-type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .teaching-type-card {
      background: white;
      border: 3px solid #e0e0e0;
      border-radius: 16px;
      padding: 2.5rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .teaching-type-card:hover {
      border-color: #108092;
      transform: translateY(-4px);
      box-shadow: 0 6px 16px rgba(16, 128, 146, 0.2);
    }

    .teaching-type-card.active {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 6px 16px rgba(16, 128, 146, 0.3);
    }

    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .teaching-type-card h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.75rem;
    }

    .teaching-type-card p {
      color: #666;
      margin-bottom: 1.5rem;
      font-size: 1rem;
    }

    .benefits {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem 0;
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
      font-size: 0.95rem;
      background: #f5f5f5;
      color: #666;
    }

    .price-tag.discount {
      background: #4caf50;
      color: white;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #e3f2fd 0%, #f0f9fa 100%);
      border-left: 4px solid #2196f3;
      border-radius: 12px;
      margin-bottom: 2rem;
      animation: slideIn 0.5s ease;
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

    .info-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .nav-buttons {
      display: flex;
      justify-content: center;
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
      transform: none;
    }
  `]
})
export class Step1YearTypeComponent implements OnInit {
  TeachingType = TeachingType;
  teachingType: TeachingType = TeachingType.OneToOne;

  constructor(private stateService: TutoringStateService) {}

  ngOnInit(): void {
    this.restoreState();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.teachingType = state.teachingType;
  }

  selectTeachingType(type: TeachingType): void {
    this.teachingType = type;
    this.stateService.setTeachingType(type);
  }

  canProceed(): boolean {
    return this.teachingType !== null;
  }

  nextStep(): void {
    if (this.canProceed()) {
      this.stateService.nextStep();
    }
  }
}
