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
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-4 md:p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Review & Payment</h1>
        <p class="text-gray-500 text-lg">Confirm your selections and proceed to checkout</p>
      </div>

      <!-- Loading State -->
      @if (calculatingPrice) {
        <div class="flex flex-col items-center justify-center py-16">
          <div class="relative">
            <div class="w-20 h-20 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
            <div class="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-teal-400 rounded-full animate-spin animation-delay-150"></div>
          </div>
          <p class="text-gray-500 mt-6 text-lg animate-pulse">Calculating your best price...</p>
        </div>
      }

      <!-- Error State -->
      @if (priceError && !calculatingPrice) {
        <div class="max-w-2xl mx-auto">
          <div class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center shadow-sm">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-red-600 mb-2">Unable to Calculate Price</h3>
            <p class="text-red-500/80 mb-4">{{ priceError }}</p>
            <button (click)="calculatePrice()" 
                    class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105">
              Try Again
            </button>
          </div>
        </div>
      }

      <!-- Main Content -->
      @if (!calculatingPrice && priceResponse) {
        <div class="max-w-5xl mx-auto space-y-6">
          
          <!-- Students Breakdown Cards -->
          @for (studentBreakdown of priceResponse.students; track studentBreakdown.studentId) {
            <div class="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50
                        transition-all duration-300 hover:shadow-2xl hover:shadow-teal-100">
              
              <!-- Student Header -->
              <div class="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                    <span class="text-xl">👤</span>
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-white">{{ studentBreakdown.studentName }}</h3>
                    <p class="text-white/70 text-sm">{{ studentBreakdown.subjects.length }} subject(s) selected</p>
                  </div>
                  <div class="ml-auto text-right">
                    <span class="text-2xl font-bold text-white">\${{ studentBreakdown.studentTotal.toFixed(2) }}</span>
                    <p class="text-white/70 text-sm">Subtotal</p>
                  </div>
                </div>
              </div>

              <!-- Subjects Grid -->
              <div class="p-6 space-y-4">
                @for (subject of studentBreakdown.subjects; track subject.subjectId) {
                  <div class="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all duration-300">
                    <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                          <span class="text-lg">📚</span>
                        </div>
                        <div>
                          <h4 class="font-semibold text-gray-800 text-lg">{{ subject.subjectName }}</h4>
                          <div class="flex items-center gap-2 mt-1">
                            <span class="px-3 py-1 rounded-full text-xs font-medium"
                                  [class]="subject.teachingType === 'Group' 
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                    : 'bg-blue-100 text-blue-700 border border-blue-200'">
                              {{ subject.teachingType === 'Group' ? '👥 Group' : '👤 One-to-One' }}
                            </span>
                            <span class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              ⏱️ {{ subject.hours }} hours
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="text-sm text-gray-400 line-through">\${{ subject.basePrice.toFixed(2) }}</p>
                        <p class="text-xl font-bold text-emerald-600">\${{ subject.finalPrice.toFixed(2) }}</p>
                      </div>
                    </div>

                    <!-- Discounts Applied -->
                    @if (hasDiscounts(subject)) {
                      <div class="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                        @if (subject.discounts.multiSubject.amount > 0) {
                          <div class="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg border border-green-200">
                            <span class="text-green-600 text-sm">📚</span>
                            <span class="text-green-700 text-sm font-medium">-\${{ subject.discounts.multiSubject.amount.toFixed(2) }}</span>
                            <span class="text-green-600/70 text-xs">Multi-Subject</span>
                          </div>
                        }
                        @if (subject.discounts.group.amount > 0) {
                          <div class="flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-lg border border-amber-200">
                            <span class="text-amber-600 text-sm">👥</span>
                            <span class="text-amber-700 text-sm font-medium">-\${{ subject.discounts.group.amount.toFixed(2) }}</span>
                            <span class="text-amber-600/70 text-xs">Group</span>
                          </div>
                        }
                        @if (subject.discounts.hours.amount > 0) {
                          <div class="flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-lg border border-purple-200">
                            <span class="text-purple-600 text-sm">⏰</span>
                            <span class="text-purple-700 text-sm font-medium">-\${{ subject.discounts.hours.amount.toFixed(2) }}</span>
                            <span class="text-purple-600/70 text-xs">Hours Pkg</span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Total Savings Banner -->
          @if (priceResponse.totalDiscount > 0) {
            <div class="bg-teal-50 border border-teal-200 rounded-3xl p-6 shadow-sm">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center">
                    <span class="text-2xl">🎉</span>
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-teal-700">Your Total Savings!</h3>
                    <p class="text-teal-600/80">Great choice! You're saving with our discount packages</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-3xl font-bold text-teal-600">-\${{ priceResponse.totalDiscount.toFixed(2) }}</p>
                  <p class="text-teal-500 text-sm">{{ priceResponse.overallDiscountPercentage.toFixed(1) }}% off</p>
                </div>
              </div>
              
              <!-- Breakdown Pills -->
              <div class="flex flex-wrap gap-3 mt-5 pt-5 border-t border-teal-200">
                @if (priceResponse.breakdown.multiSubjectSavings > 0) {
                  <div class="px-4 py-2 bg-teal-100 rounded-xl border border-teal-200">
                    <span class="text-teal-700 text-sm font-medium">📚 Multi-Subject: -\${{ priceResponse.breakdown.multiSubjectSavings.toFixed(2) }}</span>
                  </div>
                }
                @if (priceResponse.breakdown.groupSavings > 0) {
                  <div class="px-4 py-2 bg-amber-100 rounded-xl border border-amber-200">
                    <span class="text-amber-700 text-sm font-medium">👥 Group: -\${{ priceResponse.breakdown.groupSavings.toFixed(2) }}</span>
                  </div>
                }
                @if (priceResponse.breakdown.hoursSavings > 0) {
                  <div class="px-4 py-2 bg-purple-100 rounded-xl border border-purple-200">
                    <span class="text-purple-700 text-sm font-medium">⏰ Hours: -\${{ priceResponse.breakdown.hoursSavings.toFixed(2) }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Grand Total Card -->
          <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl shadow-gray-200/50">
            <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 class="text-xl font-bold text-gray-800 mb-1">Order Summary</h3>
                <p class="text-gray-500">{{ getStudentCount() }} student(s), {{ getTotalSubjects() }} subject(s)</p>
              </div>
              <div class="text-right">
                @if (priceResponse.totalDiscount > 0) {
                  <p class="text-gray-400 line-through text-lg">\${{ getOriginalTotal().toFixed(2) }}</p>
                }
                <p class="text-4xl font-bold text-teal-600">
                  \${{ priceResponse.grandTotal.toFixed(2) }}
                </p>
              </div>
            </div>

            <!-- Terms & Conditions -->
            <div class="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
              <label class="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" [(ngModel)]="agreedToTerms" 
                       class="w-5 h-5 mt-0.5 rounded border-gray-300 bg-white text-emerald-500 focus:ring-emerald-500/50 focus:ring-2 cursor-pointer">
                <span class="text-gray-600 text-sm leading-relaxed">
                  I agree to the 
                  <a href="/terms" target="_blank" class="text-teal-600 hover:text-teal-700 underline underline-offset-2 transition-colors">
                    Terms & Conditions
                  </a> 
                  and 
                  <a href="/privacy" target="_blank" class="text-teal-600 hover:text-teal-700 underline underline-offset-2 transition-colors">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4">
              <button type="button"
                      (click)="previousStep()"
                      [disabled]="creatingOrder"
                      class="flex-1 sm:flex-none px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl 
                             transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2 border border-gray-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back
              </button>
              
              <button type="button"
                      (click)="proceedToPayment()"
                      [disabled]="!canProceed() || creatingOrder"
                      class="flex-1 px-8 py-4 bg-teal-500 hover:bg-teal-600 
                             text-white font-bold rounded-xl shadow-md shadow-teal-200
                             transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                             flex items-center justify-center gap-3 text-lg">
                @if (!creatingOrder) {
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                  </svg>
                  <span>Proceed to Payment</span>
                  <span class="bg-white/20 px-3 py-1 rounded-lg">\${{ priceResponse.grandTotal.toFixed(2) }}</span>
                }
                @if (creatingOrder) {
                  <div class="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                }
              </button>
            </div>
          </div>

          <!-- Security Badge -->
          <div class="flex items-center justify-center gap-6 text-gray-600 text-sm">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              <span>Secure Payment</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <span>SSL Protected</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-lg">💳</span>
              <span>Powered by Stripe</span>
            </div>
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

        return {
          subjectId,
          subjectName: subjectInfo?.subjectName || `Subject ${subjectId}`,
          basePrice: tutoringPrice,
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

  hasDiscounts(subject: any): boolean {
    return (
      subject.discounts.multiSubject.amount > 0 ||
      subject.discounts.group.amount > 0 ||
      subject.discounts.hours.amount > 0
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

    // Build order request with new structure
    const orderRequest: any = {
      studentSelections: this.buildPriceRequest().studentSelections,
      totalStudents: this.students.length,
      expectedPrice: this.priceResponse.grandTotal
    };

    console.log('📤 Creating order with request:', orderRequest);

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
