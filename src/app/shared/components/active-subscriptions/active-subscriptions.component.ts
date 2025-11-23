/**
 * Active Subscriptions Component
 * Displays a student's active subscription plans
 */

import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { ActiveSubscription, ActiveSubscriptionsResponse } from '../../../models/payment.models';

@Component({
  selector: 'app-active-subscriptions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-subscriptions.component.html',
  styleUrls: ['./active-subscriptions.component.scss']
})
export class ActiveSubscriptionsComponent implements OnInit {
  @Input() studentId!: number;

  subscriptions = signal<ActiveSubscription[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    if (this.studentId) {
      this.loadActiveSubscriptions();
    }
  }

  loadActiveSubscriptions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getStudentActiveSubscriptions(this.studentId)
      .subscribe({
        next: (response: ActiveSubscriptionsResponse) => {
          this.subscriptions.set(response.data || []);
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Failed to load active subscriptions:', err);
          this.error.set('Failed to load active subscriptions. Please try again.');
          this.loading.set(false);
        }
      });
  }

  /**
   * Calculate days remaining until expiry
   */
  getDaysRemaining(expiresOn: string): number {
    const expiry = new Date(expiresOn);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Get badge color based on days remaining
   */
  getBadgeColor(daysRemaining: number): string {
    if (daysRemaining <= 7) return 'bg-red-100 text-red-800';
    if (daysRemaining <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  /**
   * Format plan type for display
   */
  formatPlanType(planType: string): string {
    return planType
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, str => str.toUpperCase());
  }

  /**
   * Refresh subscriptions
   */
  refresh(): void {
    this.loadActiveSubscriptions();
  }
}
