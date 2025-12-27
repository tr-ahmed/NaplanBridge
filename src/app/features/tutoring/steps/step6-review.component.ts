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
    <div class="bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-3 md:p-5">
      <!-- Compact Header -->
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-800">Step 7: Review & Payment</h1>
          <p class="text-gray-500 text-sm">Confirm selections and proceed to checkout</p>
        </div>
      </div>

      <!-- Loading State -->
      @if (calculatingPrice) {
        <div class="flex items-center justify-center py-8 gap-3">
          <div class="w-8 h-8 border-3 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
          <p class="text-gray-500 text-sm">Calculating price...</p>
        </div>
      }

      <!-- Error State -->
      @if (priceError && !calculatingPrice) {
        <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p class="text-red-600 font-medium mb-2">{{ priceError }}</p>
          <button (click)="calculatePrice()" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg">
            Try Again
          </button>
        </div>
      }

      <!-- Main Content -->
      @if (!calculatingPrice && priceResponse) {
        <div class="max-w-4xl mx-auto space-y-3">
          
          <!-- Students Breakdown - Compact Cards -->
          @for (studentBreakdown of priceResponse.students; track studentBreakdown.studentId) {
            <div class="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              
              <!-- Student Header - Compact -->
              <div class="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2.5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-base">👤</span>
                  <span class="font-semibold text-white">{{ studentBreakdown.studentName }}</span>
                  <span class="text-white/70 text-xs">({{ studentBreakdown.subjects.length }} subjects)</span>
                </div>
                <span class="text-lg font-bold text-white">\${{ studentBreakdown.studentTotal.toFixed(2) }}</span>
              </div>

              <!-- Subjects - Compact List -->
              <div class="p-3 space-y-2">
                @for (subject of studentBreakdown.subjects; track subject.subjectId) {
                  <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2 flex-1 min-w-0">
                        <span class="text-sm">📚</span>
                        <span class="font-medium text-gray-800 text-sm truncate">{{ subject.subjectName }}</span>
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                              [class]="subject.teachingType === 'Group' 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-blue-100 text-blue-700'">
                          {{ subject.teachingType === 'Group' ? '👥' : '👤' }} {{ subject.hours }}h
                        </span>
                        @if (subject.combinedDiscountPercentage > 0) {
                          <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 shrink-0">
                            -{{ subject.combinedDiscountPercentage }}%
                          </span>
                        }
                      </div>
                      <div class="text-right shrink-0">
                        @if (subject.basePrice !== subject.finalPrice) {
                          <span class="text-xs text-gray-400 line-through mr-1">\${{ subject.basePrice.toFixed(0) }}</span>
                        }
                        <span class="font-bold text-emerald-600">\${{ subject.finalPrice.toFixed(2) }}</span>
                      </div>
                    </div>

                    <!-- Discounts - Inline Compact -->
                    @if (hasDiscounts(subject)) {
                      <div class="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-200">
                        @if (subject.discounts.package.amount > 0) {
                          <span class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">-\${{ subject.discounts.package.amount.toFixed(0) }} Package</span>
                        }
                        @if (subject.discounts.group.amount > 0) {
                          <span class="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">-\${{ subject.discounts.group.amount.toFixed(0) }} Group</span>
                        }
                        @if (subject.discounts.multiStudents.amount > 0) {
                          <span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">-\${{ subject.discounts.multiStudents.amount.toFixed(0) }} Multi-Student</span>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Total Savings - Compact Banner -->
          @if (priceResponse.totalDiscount > 0) {
            <div class="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="text-lg">🎉</span>
                <span class="font-semibold text-teal-700">Total Savings</span>
                <div class="flex gap-1.5 flex-wrap">
                  @if (priceResponse.breakdown.packageSavings > 0) {
                    <span class="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded">Package -\${{ priceResponse.breakdown.packageSavings.toFixed(0) }}</span>
                  }
                  @if (priceResponse.breakdown.groupSavings > 0) {
                    <span class="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Group -\${{ priceResponse.breakdown.groupSavings.toFixed(0) }}</span>
                  }
                  @if (priceResponse.breakdown.multiStudentsSavings > 0) {
                    <span class="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">Multi-Students -\${{ priceResponse.breakdown.multiStudentsSavings.toFixed(0) }}</span>
                  }
                </div>
              </div>
              <div class="text-right">
                <span class="text-xl font-bold text-teal-600">-\${{ priceResponse.totalDiscount.toFixed(2) }}</span>
                <span class="text-teal-500 text-xs ml-1">({{ priceResponse.overallDiscountPercentage.toFixed(0) }}% off)</span>
              </div>
            </div>
          }

          <!-- Grand Total & Action - Compact Card -->
          <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div class="flex items-center justify-between gap-4 mb-3">
              <div>
                <span class="font-semibold text-gray-800">Order Total</span>
                <span class="text-gray-400 text-sm ml-2">{{ getStudentCount() }} student(s), {{ getTotalSubjects() }} subject(s)</span>
              </div>
              <div class="text-right">
                @if (priceResponse.totalDiscount > 0) {
                  <span class="text-gray-400 line-through text-sm mr-2">\${{ getOriginalTotal().toFixed(2) }}</span>
                }
                <span class="text-2xl font-bold text-teal-600">\${{ priceResponse.grandTotal.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Terms & Actions Row -->
            <div class="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-gray-100">
              <label class="flex items-center gap-2 cursor-pointer flex-1">
                <input type="checkbox" [(ngModel)]="agreedToTerms" 
                       class="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500/50">
                <span class="text-gray-600 text-sm">
                  I agree to the <a href="/terms" target="_blank" class="text-teal-600 underline">Terms</a> & <a href="/privacy" target="_blank" class="text-teal-600 underline">Privacy</a>
                </span>
              </label>
              
              <div class="flex gap-2 w-full sm:w-auto">
                <button type="button" (click)="previousStep()" [disabled]="creatingOrder"
                        class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm disabled:opacity-50 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  Back
                </button>
                
                <button type="button" (click)="proceedToPayment()" [disabled]="!canProceed() || creatingOrder"
                        class="flex-1 sm:flex-none px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg shadow-sm
                               disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                  @if (!creatingOrder) {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                    </svg>
                    <span>Pay \${{ priceResponse.grandTotal.toFixed(2) }}</span>
                  } @else {
                    <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  }
                </button>
              </div>
            </div>
          </div>

          <!-- Security Badge - Compact -->
          <div class="flex items-center justify-center gap-4 text-gray-400 text-xs">
            <span class="flex items-center gap-1">🔒 Secure</span>
            <span class="flex items-center gap-1">🛡️ SSL</span>
            <span class="flex items-center gap-1">💳 Stripe</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .animation-delay-150 {
      animation-delay: 150ms;
    }
    
    .border-3 {
      border-width: 3px;
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
