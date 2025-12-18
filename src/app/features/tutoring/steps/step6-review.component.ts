import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ContentService } from '../../../core/services/content.service';
import {
  TutoringPlan,
  TutoringPriceResponse,
  StudentSubjectSelection,
  SubjectWithPlan,
  CreateTutoringOrderRequest,
  TeachingType
} from '../../../models/tutoring.models';
import { Subject } from '../../../models/package-pricing.model';

@Component({
  selector: 'app-step6-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 6: Review & Payment</h2>

      <!-- Order Summary -->
      <div class="summary-section">
        <h3>Order Summary</h3>

        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Teaching Type:</span>
            <span class="value">{{ teachingType === TeachingType.OneToOne ? 'One-to-One' : 'Group Tutoring' }}</span>
            <span *ngIf="teachingType === TeachingType.GroupTutoring" class="discount-badge">35% OFF</span>
          </div>

          <div class="summary-item">
            <span class="label">Number of Students:</span>
            <span class="value">{{ students.length }}</span>
            <span *ngIf="students.length > 1" class="discount-badge">{{ getStudentDiscount() }}% OFF</span>
          </div>

          <div class="summary-item">
            <span class="label">Total Subjects:</span>
            <span class="value">{{ getTotalSubjects() }}</span>
          </div>

          <div class="summary-item">
            <span class="label">Total Sessions:</span>
            <span class="value">{{ getTotalSessions() }}</span>
          </div>
        </div>
      </div>

      <!-- Students Details -->
      <div class="students-details">
        <h3>Students & Subjects</h3>

        <div *ngFor="let student of students" class="student-card">
          <h4 class="student-name">{{ student.name }}</h4>

          <table class="subjects-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Plan</th>
                <th>Sessions</th>
                <th class="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let subject of getStudentSubjects(student.id)">
                <td class="subject-name">{{ getSubjectName(subject) }}</td>
                <td>{{ getPlanLabel(student.id, subject) }}</td>
                <td>{{ getRequiredSlots(student.id, subject) }} sessions</td>
                <td class="text-right price">\${{ calculateSubjectPrice(student.id, subject) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-right"><strong>Subtotal for {{ student.name }}:</strong></td>
                <td class="text-right price"><strong>\${{ getStudentTotal(student.id) }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Price Breakdown -->
      <div class="price-breakdown-section">
        <h3>Price Breakdown</h3>

        <div *ngIf="!calculatingPrice && priceCalculation" class="breakdown-details">
          <div class="breakdown-row">
            <span>Base Price:</span>
            <span>\${{ priceCalculation.basePrice.toFixed(2) }}</span>
          </div>

          <div *ngIf="priceCalculation.groupDiscount > 0" class="breakdown-row discount">
            <span>Group Tutoring Discount (35%):</span>
            <span>-\${{ priceCalculation.groupDiscount.toFixed(2) }}</span>
          </div>

          <div *ngIf="priceCalculation.multipleStudentsDiscount > 0" class="breakdown-row discount">
            <span>Multiple Students Discount ({{ getStudentDiscount() }}%):</span>
            <span>-\${{ priceCalculation.multipleStudentsDiscount.toFixed(2) }}</span>
          </div>

          <div *ngIf="priceCalculation.multipleSubjectsDiscount > 0" class="breakdown-row discount">
            <span>Multiple Subjects Discount:</span>
            <span>-\${{ priceCalculation.multipleSubjectsDiscount.toFixed(2) }}</span>
          </div>

          <div *ngIf="priceCalculation.planDiscount > 0" class="breakdown-row discount">
            <span>Plan Discounts (20hrs/30hrs):</span>
            <span>-\${{ priceCalculation.planDiscount.toFixed(2) }}</span>
          </div>

          <div class="breakdown-row total-discount">
            <span><strong>Total Discount:</strong></span>
            <span><strong>-\${{ priceCalculation.totalDiscount.toFixed(2) }}</strong></span>
          </div>

          <div class="breakdown-row total">
            <span><strong>Final Price:</strong></span>
            <span><strong>\${{ priceCalculation.finalPrice.toFixed(2) }}</strong></span>
          </div>
        </div>

        <div *ngIf="calculatingPrice" class="loading-price">
          <div class="spinner"></div>
          <p>Calculating price...</p>
        </div>

        <div *ngIf="priceError" class="error-box">
          <span>❌ Error calculating price: {{ priceError }}</span>
          <button (click)="calculatePrice()" class="btn btn-small">Retry</button>
        </div>
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
            💳 Proceed to Payment (\${{ priceCalculation?.finalPrice?.toFixed(2) || '0.00' }})
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

  students: { id: number; name: string }[] = [];
  subjects: Subject[] = [];
  teachingType: TeachingType = TeachingType.OneToOne;
  priceCalculation: TutoringPriceResponse | null = null;
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
    this.calculatePrice();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.students = state.students;
    this.teachingType = state.teachingType;
  }

  loadSubjects(): void {
    this.contentService.getSubjects().subscribe({
      next: (subjects) => {
        this.subjects = subjects;
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
      }
    });
  }

  calculatePrice(): void {
    this.calculatingPrice = true;
    this.priceError = null;

    const request = this.buildPriceRequest();

    this.tutoringService.calculatePrice(request).subscribe({
      next: (response) => {
        this.priceCalculation = response;
        this.stateService.setPriceCalculation(response);
        this.calculatingPrice = false;
      },
      error: (error) => {
        console.error('Error calculating price:', error);
        this.priceError = error.error?.error || 'Failed to calculate price';
        this.calculatingPrice = false;
      }
    });
  }

  buildPriceRequest(): any {
    const state = this.stateService.getState();

    const studentSelections: StudentSubjectSelection[] = this.students.map(student => ({
      studentId: student.id,
      studentName: student.name,
      subjects: this.getStudentSubjects(student.id).map(subjectId => ({
        subjectId: subjectId,
        subjectName: this.getSubjectName(subjectId),
        plan: this.stateService.getPlan(student.id, subjectId) || TutoringPlan.Hours10,
        basePrice: 100,
        totalPrice: this.calculateSubjectPrice(student.id, subjectId),
        selectedTimeSlotIds: this.stateService.getTimeSlots(student.id, subjectId),
        requiredSlots: this.getRequiredSlots(student.id, subjectId)
      }))
    }));

    return {
      teachingType: state.teachingType,
      academicYearId: state.academicYearId!,
      studentSelections
    };
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

  getPlanLabel(studentId: number, subjectId: number): string {
    const plan = this.stateService.getPlan(studentId, subjectId);
    return plan || '10hrs';
  }

  getRequiredSlots(studentId: number, subjectId: number): number {
    const plan = this.stateService.getPlan(studentId, subjectId);
    switch (plan) {
      case TutoringPlan.Hours10: return 10;
      case TutoringPlan.Hours20: return 20;
      case TutoringPlan.Hours30: return 30;
      default: return 10;
    }
  }

  calculateSubjectPrice(studentId: number, subjectId: number): number {
    const basePrice = 100;
    const plan = this.stateService.getPlan(studentId, subjectId);

    switch (plan) {
      case TutoringPlan.Hours10:
        return basePrice;
      case TutoringPlan.Hours20:
        return Math.round(basePrice * 2 * 0.95);
      case TutoringPlan.Hours30:
        return Math.round(basePrice * 3 * 0.90);
      default:
        return basePrice;
    }
  }

  getStudentTotal(studentId: number): number {
    const subjects = this.getStudentSubjects(studentId);
    return subjects.reduce((total, subjectId) =>
      total + this.calculateSubjectPrice(studentId, subjectId), 0
    );
  }

  getTotalSubjects(): number {
    return this.students.reduce((total, student) =>
      total + this.getStudentSubjects(student.id).length, 0
    );
  }

  getTotalSessions(): number {
    return this.students.reduce((total, student) => {
      const subjects = this.getStudentSubjects(student.id);
      return total + subjects.reduce((subTotal, subjectId) =>
        subTotal + this.getRequiredSlots(student.id, subjectId), 0
      );
    }, 0);
  }

  getStudentDiscount(): number {
    const count = this.students.length;
    if (count <= 1) return 0;
    return Math.min(count * 5, 20);
  }

  canProceed(): boolean {
    return this.agreedToTerms && this.priceCalculation !== null && !this.calculatingPrice;
  }

  previousStep(): void {
    this.stateService.previousStep();
  }

  async proceedToPayment(): Promise<void> {
    if (!this.canProceed() || !this.priceCalculation) return;

    this.creatingOrder = true;

    const state = this.stateService.getState();
    const orderRequest: CreateTutoringOrderRequest = {
      teachingType: state.teachingType,
      academicYearId: state.academicYearId!,
      termId: 1, // TODO: Get from state
      studentSelections: this.buildPriceRequest().studentSelections,
      totalStudents: this.students.length,
      expectedPrice: this.priceCalculation.finalPrice
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
        alert(error.error?.error || 'Failed to create order. Please try again.');
        this.creatingOrder = false;
      }
    });
  }
}
