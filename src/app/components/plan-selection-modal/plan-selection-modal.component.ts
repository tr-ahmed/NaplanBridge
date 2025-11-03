/**
 * Plan Selection Modal Component
 * Allows user to select a subscription plan when adding a course to cart
 */
import { Component, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionPlanSummary } from '../../models/subject.models';

@Component({
  selector: 'app-plan-selection-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Modal Backdrop -->
    @if (isOpen()) {
      <div
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        (click)="onBackdropClick($event)">

        <!-- Modal Content -->
        <div
          class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">
                Choose Your Plan
              </h2>
              <p class="text-sm text-gray-600 mt-1">
                {{ courseName() }}
              </p>
            </div>
            <button
              (click)="onClose()"
              class="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Plans List -->
          <div class="p-6 space-y-4">
            @if (plans().length === 0) {
              <div class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="mt-2 text-gray-600">No subscription plans available for this subject</p>
              </div>
            } @else {
              @for (plan of plans(); track plan.id) {
                <div
                  class="border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 hover:shadow-md"
                  [class.border-blue-500]="selectedPlanId() === plan.id"
                  [class.bg-blue-50]="selectedPlanId() === plan.id"
                  (click)="selectPlan(plan.id)">

                  <div class="flex items-start justify-between">
                    <!-- Plan Info -->
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <!-- Radio Button -->
                        <div class="flex items-center">
                          <div
                            class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                            [class.border-blue-500]="selectedPlanId() === plan.id"
                            [class.border-gray-300]="selectedPlanId() !== plan.id">
                            @if (selectedPlanId() === plan.id) {
                              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                            }
                          </div>
                        </div>

                        <!-- Plan Name -->
                        <h3 class="text-lg font-semibold text-gray-900">
                          {{ plan.name }}
                        </h3>

                        <!-- Popular Badge -->
                        @if (isPopular(plan)) {
                          <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Most Popular
                          </span>
                        }
                      </div>

                      <!-- Plan Description -->
                      @if (plan.description) {
                        <p class="text-sm text-gray-600 mt-2 ml-7">
                          {{ plan.description }}
                        </p>
                      }

                      <!-- Plan Type Badge -->
                      <div class="flex items-center gap-2 mt-2 ml-7">
                        <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {{ getPlanTypeLabel(plan.planType) }}
                        </span>
                        @if (!plan.isActive) {
                          <span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                            Currently Unavailable
                          </span>
                        }
                      </div>
                    </div>

                    <!-- Price -->
                    <div class="text-right ml-4">
                      <div class="text-2xl font-bold text-blue-600">
                        AUD {{ plan.price.toFixed(2) }}
                      </div>
                      @if (showSavings(plan)) {
                        <div class="text-sm text-green-600 font-medium">
                          Save {{ calculateSavings(plan).toFixed(2) }} AUD
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            }
          </div>

          <!-- Footer Actions -->
          <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              (click)="onClose()"
              class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              (click)="onConfirm()"
              [disabled]="!selectedPlanId() || !isSelectedPlanActive()"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
              @if (selectedPlanId()) {
                Add to Cart - AUD {{ getSelectedPlanPrice() }}
              } @else {
                Select a Plan
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class PlanSelectionModalComponent {
  // Inputs
  isOpen = input.required<boolean>();
  plans = input.required<SubscriptionPlanSummary[]>();
  courseName = input.required<string>();

  // Outputs
  close = output<void>();
  selectPlanConfirmed = output<number>();

  // State
  selectedPlanId = signal<number | null>(null);

  /**
   * Select a plan
   */
  selectPlan(planId: number): void {
    const plan = this.plans().find(p => p.id === planId);
    if (plan && plan.isActive) {
      this.selectedPlanId.set(planId);
    }
  }

  /**
   * Confirm selection
   */
  onConfirm(): void {
    const planId = this.selectedPlanId();
    if (planId) {
      const plan = this.plans().find(p => p.id === planId);
      // Emit both planId and plan name for validation
      this.selectPlanConfirmed.emit(planId);
      // Store plan name for the service to use
      if (plan) {
        (window as any).__selectedPlanName = plan.name;
      }
      this.reset();
    }
  }

  /**
   * Close modal
   */
  onClose(): void {
    this.reset();
    this.close.emit();
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: Event): void {
    this.onClose();
  }

  /**
   * Reset state
   */
  private reset(): void {
    this.selectedPlanId.set(null);
  }

  /**
   * Check if plan is popular (e.g., FullYear or MultiTerm)
   */
  isPopular(plan: SubscriptionPlanSummary): boolean {
    return plan.planType === 'FullYear' || plan.planType === 'MultiTerm';
  }

  /**
   * Get plan type label in English
   */
  getPlanTypeLabel(planType: string): string {
    const labels: Record<string, string> = {
      'SingleTerm': 'Single Term',
      'MultiTerm': 'Multiple Terms',
      'FullYear': 'Full Year',
      'SubjectAnnual': 'Annual Subscription'
    };
    return labels[planType] || planType;
  }

  /**
   * Check if should show savings
   */
  showSavings(plan: SubscriptionPlanSummary): boolean {
    return plan.planType === 'FullYear' || plan.planType === 'SubjectAnnual';
  }

  /**
   * Calculate savings (mock calculation)
   */
  calculateSavings(plan: SubscriptionPlanSummary): number {
    if (plan.planType === 'FullYear') {
      return plan.price * 0.2; // 20% savings
    }
    if (plan.planType === 'SubjectAnnual') {
      return plan.price * 0.15; // 15% savings
    }
    return 0;
  }

  /**
   * Check if selected plan is active
   */
  isSelectedPlanActive(): boolean {
    const planId = this.selectedPlanId();
    if (!planId) return false;
    const plan = this.plans().find(p => p.id === planId);
    return plan?.isActive ?? false;
  }

  /**
   * Get selected plan price
   */
  getSelectedPlanPrice(): string {
    const planId = this.selectedPlanId();
    if (!planId) return '0.00';
    const plan = this.plans().find(p => p.id === planId);
    return plan ? plan.price.toFixed(2) : '0.00';
  }
}
