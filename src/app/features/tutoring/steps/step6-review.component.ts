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
  templateUrl: './step6-review.component.html',
  styleUrls: ['./step6-review.component.scss']
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
  ) { }

  ngOnInit(): void {
    this.restoreState();
    this.loadSubjects();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.students = Array.isArray(state.students) ? state.students : [];
  }

  loadSubjects(): void {
    // Get unique academic year IDs from selected students
    const uniqueYears = [...new Set(this.students.map(s => s.academicYearId))];

    if (uniqueYears.length === 0) {
      this.calculatePrice();
      return;
    }

    let loadedCount = 0;
    this.subjects = [];

    uniqueYears.forEach(yearId => {
      this.contentService.getSubjectsByYear(yearId).subscribe({
        next: (subjects) => {
          const subjectsArray = Array.isArray(subjects) ? subjects : [];
          this.subjects.push(...subjectsArray);

          loadedCount++;
          if (loadedCount === uniqueYears.length) {
            // Calculate price after all subjects loaded
            console.log('📚 Loaded subjects with tutoringPricePerHour:',
              this.subjects.map(s => ({ id: s.id, name: s.subjectName, tutoringPricePerHour: s.tutoringPricePerHour, price: s.price }))
            );
            this.calculatePrice();
          }
        },
        error: (error) => {
          console.error(`Error loading subjects for year ${yearId}:`, error);
          loadedCount++;
          if (loadedCount === uniqueYears.length) {
            this.calculatePrice();
          }
        }
      });
    });
  }

  calculatePrice(): void {
    this.calculatingPrice = true;
    this.priceError = null;

    const request = this.buildPriceRequest();

    // Log request for debugging
    console.log('📤 Calculating price with request:', request);

    this.tutoringService.calculatePriceV2(request).subscribe({
      next: (response) => {
        console.log('📥 Price calculation response:', response);
        this.priceResponse = response;
        this.calculatingPrice = false;
      },
      error: (error) => {
        console.error('❌ Error calculating price:', error);
        this.priceError = error.error?.message || 'Failed to calculate price. Please try again.';
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

        // Use tutoring price per hour (not self-learning subscription price)
        const tutoringPrice = subjectInfo?.tutoringPricePerHour || subjectInfo?.price || 100;

        // Get both termId and academicTermId for term-based subjects from state
        const termIds = this.stateService.getSubjectTermIds(student.id, subjectId);

        return {
          subjectId,
          subjectName: subjectInfo?.subjectName || `Subject ${subjectId}`,
          basePrice: tutoringPrice,
          teachingType,
          hours,
          termId: termIds?.termId ?? null,               // Subject Term ID (from Terms table)
          academicTermId: termIds?.academicTermId ?? null // Academic Term ID (from AcademicTerms table)
        };
      });

      return {
        studentId: student.id,
        studentName: student.name,
        subjects
      };
    });

    return {
      studentSelections,
      totalStudents: this.students.length  // ✅ Required for Multiple Students Discount
    };
  }

  hasDiscounts(subject: any): boolean {
    return (
      subject.discounts.package.amount > 0 ||
      subject.discounts.group.amount > 0 ||
      subject.discounts.multiStudents.amount > 0
    );
  }

  getStudentCount(): number {
    return this.priceResponse?.students?.length || 0;
  }

  getTotalSubjects(): number {
    if (!this.priceResponse?.students) return 0;
    return this.priceResponse.students.reduce((sum, s) => sum + s.subjects.length, 0);
  }

  getOriginalTotal(): number {
    if (!this.priceResponse) return 0;
    return this.priceResponse.grandTotal + this.priceResponse.totalDiscount;
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

    // Get session token from state (reserved in step 5)
    const sessionToken = this.stateService.getReservationSessionToken();

    // ✅ Validate sessionToken exists
    if (!sessionToken) {
      console.error('❌ No sessionToken! Slots may have expired.');
      alert('انتهت صلاحية الحجز. يرجى الرجوع لخطوة جدولة المواعيد وإعادة الحجز.');
      this.creatingOrder = false;
      return;
    }

    // Build order request with new structure
    const orderRequest: any = {
      studentSelections: this.buildPriceRequest().studentSelections,
      totalStudents: this.students.length,
      expectedPrice: this.priceResponse.grandTotal,
      sessionToken: sessionToken  // ✅ Include session token for slot reservation!
    };

    console.log('📤 Creating order with sessionToken:', sessionToken);
    console.log('📤 Full request:', orderRequest);

    this.tutoringService.createOrder(orderRequest).subscribe({
      next: (response) => {
        console.log('📥 Order created successfully:', response);

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
        console.error('❌ Error creating order:', error);
        alert(error.error?.message || 'Failed to create order. Please try again.');
        this.creatingOrder = false;
      }
    });
  }
}
