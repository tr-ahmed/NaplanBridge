import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import {
  TeachingType,
  NewPriceCalculationRequest,
  NewPriceCalculationResponse,
  NewStudentSelectionDto,
  NewSubjectSelectionDto,
  HoursOption,
  StudentInfo
} from '../../../models/tutoring.models';

@Component({
  selector: 'app-step6-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 6: Review & Payment</h2>
      <p class="step-subtitle">Review your selections and complete the booking</p>

      <!-- Price Calculation Loading -->
      <div *ngIf="calculatingPrice" class="loading">
        <div class="spinner"></div>
        <p>Calculating your discounts...</p>
      </div>

      <!-- Price Breakdown -->
      <div *ngIf="!calculatingPrice && priceResponse" class="price-section">

        <!-- Students Breakdown -->
        <div *ngFor="let studentBreakdown of priceResponse.students" class="student-card">
          <h3 class="student-name">👤 {{ studentBreakdown.studentName }}</h3>

          <table class="subjects-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Type</th>
                <th>Hours</th>
                <th>Base Price</th>
                <th>Discounts</th>
                <th class="text-right">Final</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let subject of studentBreakdown.subjects">
                <td class="subject-name">{{ subject.subjectName }}</td>
                <td>
                  <span class="type-badge" [class.group]="subject.teachingType === 'Group'">
                    {{ subject.teachingType }}
                  </span>
                </td>
                <td>{{ subject.hours }}h</td>
                <td>\${{ subject.basePrice }}</td>
                <td>
                  <div class="discounts-list">
                    <span *ngIf="subject.discounts.multiSubject.amount > 0" class="discount-item">
                      📚 -\${{ subject.discounts.multiSubject.amount }} ({{ subject.discounts.multiSubject.reason }})
                    </span>
                    <span *ngIf="subject.discounts.group.amount > 0" class="discount-item group">
                      👥 -\${{ subject.discounts.group.amount }} ({{ subject.discounts.group.reason }})
                    </span>
                    <span *ngIf="subject.discounts.hours.amount > 0" class="discount-item hours">
                      ⏰ -\${{ subject.discounts.hours.amount }} ({{ subject.discounts.hours.reason }})
                    </span>
                  </div>
                </td>
                <td class="text-right final-price">\${{ subject.finalPrice }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="text-right"><strong>Student Total:</strong></td>
                <td class="text-right student-total">\${{ studentBreakdown.studentTotal }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Grand Total Section -->
        <div class="grand-total-section">
          <div class="savings-breakdown">
            <h4>💰 Your Savings</h4>
            <div class="savings-row">
              <span>Multi-Subject Discount:</span>
              <span class="savings-value">-\${{ priceResponse.breakdown.multiSubjectSavings }}</span>
            </div>
            <div class="savings-row">
              <span>Group Sessions Discount:</span>
              <span class="savings-value">-\${{ priceResponse.breakdown.groupSavings }}</span>
            </div>
            <div class="savings-row">
              <span>Hours Package Discount:</span>
              <span class="savings-value">-\${{ priceResponse.breakdown.hoursSavings }}</span>
            </div>
            <div class="savings-total">
              <span>Total Savings:</span>
              <span class="total-savings">-\${{ priceResponse.totalDiscount }} ({{ priceResponse.overallDiscountPercentage.toFixed(1) }}%)</span>
            </div>
          </div>

          <div class="final-amount">
            <div class="original-price">
              Original: <span>\${{ priceResponse.grandTotal + priceResponse.totalDiscount }}</span>
            </div>
            <div class="grand-total">
              <span>Total to Pay:</span>
              <span class="amount">\${{ priceResponse.grandTotal }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="priceError" class="error-box">
        <span>❌ {{ priceError }}</span>
        <button (click)="calculatePrice()" class="btn btn-small">Retry</button>
      </div>

      <!-- Terms & Conditions -->
      <div class="terms-section">
        <label class="checkbox-container">
          <input type="checkbox" [(ngModel)]="agreedToTerms">
          <span>I agree to the <a href="/terms" target="_blank">Terms & Conditions</a></span>
        </label>
      </div>

      <!-- Navigation -->
      <div class="nav-buttons">
        <button
          type="button"
          (click)="previousStep()"
          [disabled]="creatingOrder"
          class="btn btn-secondary">
          ← Back
        </button>
        <button
          type="button"
          (click)="proceedToPayment()"
          [disabled]="!canProceed() || creatingOrder"
          class="btn btn-primary btn-large">
          <span *ngIf="!creatingOrder">
            💳 Proceed to Payment (\${{ priceResponse?.grandTotal?.toFixed(2) || '0.00' }})
          </span>
          <span *ngIf="creatingOrder">
            Processing...
          </span>
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

    .summary-section,
    .students-details,
    .price-breakdown-section,
    .terms-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 12px;
    }

    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 1rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      border: 2px solid #e0e0e0;
    }

    .summary-item .label {
      font-size: 0.875rem;
      color: #666;
    }

    .summary-item .value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #108092;
    }

    .discount-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: #4caf50;
      color: white;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      align-self: flex-start;
    }

    .student-card {
      margin-bottom: 1.5rem;
      padding: 1.5rem;
      background: white;
      border-radius: 8px;
      border: 2px solid #e0e0e0;
    }

    .student-card:last-child {
      margin-bottom: 0;
    }

    .student-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #108092;
      margin-bottom: 1rem;
    }

    .subjects-table {
      width: 100%;
      border-collapse: collapse;
    }

    .subjects-table th,
    .subjects-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    .subjects-table th {
      background: #f5f5f5;
      font-weight: 600;
      color: #555;
    }

    .subjects-table tfoot td {
      border-top: 2px solid #108092;
      border-bottom: none;
      padding-top: 1rem;
    }

    .text-right {
      text-align: right !important;
    }

    .subject-name {
      font-weight: 600;
      color: #333;
    }

    .price {
      color: #108092;
      font-weight: 600;
    }

    .breakdown-details {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .breakdown-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .breakdown-row:last-child {
      border-bottom: none;
    }

    .breakdown-row.discount {
      color: #4caf50;
    }

    .breakdown-row.total-discount {
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 2px solid #e0e0e0;
      color: #4caf50;
      font-size: 1.125rem;
    }

    .breakdown-row.total {
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 2px solid #108092;
      font-size: 1.5rem;
      color: #108092;
    }

    .loading-price,
    .error-box {
      text-align: center;
      padding: 2rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #108092;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-box {
      background: #ffebee;
      border: 2px solid #f44336;
      border-radius: 8px;
      color: #d32f2f;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 1rem;
      background: white;
      border-radius: 8px;
    }

    .checkbox-container input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .checkbox-container a {
      color: #108092;
      text-decoration: underline;
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

    .btn-small {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn-large {
      padding: 1rem 2.5rem;
      font-size: 1.125rem;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #666;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e0e0e0;
    }

    .btn-primary {
      background: #108092;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0d6a7a;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .btn-primary:disabled,
    .btn-secondary:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }

    @media (max-width: 768px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }

      .subjects-table {
        font-size: 0.875rem;
      }

      .nav-buttons {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class Step6ReviewComponent implements OnInit {
  TeachingType = TeachingType;

  students: StudentInfo[] = [];
  subjects: Subject[] = [];
  priceResponse: NewPriceCalculationResponse | null = null;
  agreedToTerms = false;
  calculatingPrice = false;
  creatingOrder = false;
  priceError: string | null = null;

  constructor(
    private stateService: TutoringStateService,
    private tutoringService: TutoringService,
    private contentService: ContentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.restoreState();
    this.loadSubjects();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.students = Array.isArray(state.students) ? state.students : [];
  }

  loadSubjects(): void {
    this.contentService.getSubjects().subscribe({
      next: (subjects) => {
        this.subjects = Array.isArray(subjects) ? subjects : [];
        // Calculate price after subjects loaded
        this.calculatePrice();
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
        this.subjects = [];
        this.calculatePrice();
      }
    });
  }

  calculatePrice(): void {
    this.calculatingPrice = true;
    this.priceError = null;

    const request = this.buildPriceRequest();

    this.tutoringService.calculatePriceV2(request).subscribe({
      next: (response) => {
        this.priceResponse = response;
        this.calculatingPrice = false;
      },
      error: (error) => {
        console.error('Error calculating price:', error);
        this.priceError = error.error?.message || 'Failed to calculate price';
        this.calculatingPrice = false;
      }
    });
  }

  buildPriceRequest(): NewPriceCalculationRequest {
    const state = this.stateService.getState();

    const studentSelections: NewStudentSelectionDto[] = this.students.map(student => {
      const subjectIds = state.studentSubjects.get(student.id) || new Set();

      const subjects: NewSubjectSelectionDto[] = Array.from(subjectIds).map(subjectId => {
        const key = `${student.id}_${subjectId}`;
        const teachingType = state.subjectTeachingTypes.get(key) || TeachingType.OneToOne;
        const hours = (state.subjectHours.get(key) || 10) as HoursOption;
        const subjectInfo = this.subjects.find(s => s.id === subjectId);

        // ✅ Use tutoring price per hour (not self-learning subscription price)
        const tutoringPrice = subjectInfo?.tutoringPricePerHour || subjectInfo?.price || 100;

        return {
          subjectId,
          subjectName: subjectInfo?.subjectName || `Subject ${subjectId}`,
          basePrice: tutoringPrice,  // ✅ Tutoring hourly rate
          teachingType,
          hours
        };
      });

      return {
        studentId: student.id,
        studentName: student.name,
        subjects
      };
    });

    return { studentSelections };
  }

  canProceed(): boolean {
    return this.agreedToTerms && this.priceResponse !== null && !this.calculatingPrice;
  }

  previousStep(): void {
    this.stateService.previousStep();
  }

  async proceedToPayment(): Promise<void> {
    if (!this.canProceed() || !this.priceResponse) return;

    this.creatingOrder = true;

    const state = this.stateService.getState();

    // Build order request with new structure
    const orderRequest: any = {
      studentSelections: this.buildPriceRequest().studentSelections,
      totalStudents: this.students.length,
      expectedPrice: this.priceResponse.grandTotal
    };

    this.tutoringService.createOrder(orderRequest).subscribe({
      next: (response) => {
        // Save order info for success page
        localStorage.setItem('pendingTutoringOrder', JSON.stringify({
          orderId: response.orderId,
          orderNumber: response.orderNumber,
          amount: response.totalAmount,
          confirmationCode: response.confirmationCode
        }));

        // Clear state
        this.stateService.clearState();

        // Redirect to Stripe Checkout
        window.location.href = response.stripeCheckoutUrl;
      },
      error: (error) => {
        console.error('Error creating order:', error);
        alert(error.error?.message || 'Failed to create order. Please try again.');
        this.creatingOrder = false;
      }
    });
  }
}
