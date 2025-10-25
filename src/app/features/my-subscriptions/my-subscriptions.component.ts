/**
 * My Subscriptions Component
 * Parent view to manage their children's subscriptions
 * Shows active subscriptions, usage, and renewal options
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../core/services/subscription.service';
import { StudentSubscription } from '../../models/subscription.models';

// Interfaces
interface SubscriptionWithDetails {
  id: number;
  studentId: number;
  studentName?: string;
  planId: number;
  planName?: string;
  status: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  progressPercentage?: number;
  completedLessons?: number;
  totalLessons?: number;
  lastAccessDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  daysUntilExpiry?: number;
  usagePercentage?: number;
}

@Component({
  selector: 'app-my-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-subscriptions.component.html',
  styleUrl: './my-subscriptions.component.scss'
})
export class MySubscriptionsComponent implements OnInit {
  // Services
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);

  // Signals
  subscriptions = signal<SubscriptionWithDetails[]>([]);
  loading = signal(true);
  selectedSubscription = signal<SubscriptionWithDetails | null>(null);
  showCancelModal = signal(false);
  cancelReason = signal('');

  // Stats
  stats = signal({
    total: 0,
    active: 0,
    expiringSoon: 0,
    totalSpent: 0
  });

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  /**
   * Load all subscriptions for parent's children
   */
  private loadSubscriptions(): void {
    this.loading.set(true);

    // Simulate API call with mock data
    setTimeout(() => {
      const mockSubs = this.getMockSubscriptions();
      this.subscriptions.set(mockSubs);
      this.calculateStats(mockSubs);
      this.loading.set(false);
    }, 500);
  }

  /**
   * Calculate subscription statistics
   */
  private calculateStats(subscriptions: SubscriptionWithDetails[]): void {
    const stats = {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'Active').length,
      expiringSoon: subscriptions.filter(s =>
        (s.daysUntilExpiry || 0) <= 30 && (s.daysUntilExpiry || 0) > 0
      ).length,
      totalSpent: subscriptions.reduce((sum, s) => sum + s.totalAmount, 0)
    };
    this.stats.set(stats);
  }

  /**
   * Get mock subscriptions data
   */
  private getMockSubscriptions(): SubscriptionWithDetails[] {
    const now = new Date();

    return [
      {
        id: 1,
        studentId: 1,
        studentName: 'Ahmed Hassan',
        planId: 3,
        planName: 'Full Academic Year',
        status: 'Active',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        autoRenew: true,
        totalAmount: 499,
        paidAmount: 499,
        remainingAmount: 0,
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        progressPercentage: 65,
        completedLessons: 78,
        totalLessons: 120,
        lastAccessDate: new Date(),
        notes: 'Active subscription for full academic year',
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date(),
        daysUntilExpiry: this.calculateDaysUntilExpiry(new Date('2025-06-30')),
        usagePercentage: 65
      },
      {
        id: 2,
        studentId: 2,
        studentName: 'Sara Hassan',
        planId: 1,
        planName: 'Terms 1 & 2 Package',
        status: 'Active',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-01-31'),
        autoRenew: false,
        totalAmount: 249,
        paidAmount: 249,
        remainingAmount: 0,
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        progressPercentage: 78,
        completedLessons: 47,
        totalLessons: 60,
        lastAccessDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        notes: 'Terms 1 & 2 subscription',
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date(),
        daysUntilExpiry: this.calculateDaysUntilExpiry(new Date('2025-01-31')),
        usagePercentage: 78
      },
      {
        id: 3,
        studentId: 3,
        studentName: 'Omar Hassan',
        planId: 3,
        planName: 'Full Academic Year',
        status: 'Active',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        autoRenew: true,
        totalAmount: 499,
        paidAmount: 499,
        remainingAmount: 0,
        paymentMethod: 'debit_card',
        paymentStatus: 'paid',
        progressPercentage: 92,
        completedLessons: 110,
        totalLessons: 120,
        lastAccessDate: new Date(),
        notes: 'Excellent progress!',
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date(),
        daysUntilExpiry: this.calculateDaysUntilExpiry(new Date('2025-06-30')),
        usagePercentage: 92
      }
    ];
  }

  /**
   * Calculate days until expiry
   */
  private calculateDaysUntilExpiry(endDate: Date): number {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'Expired': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800',
      'Pending': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get expiry badge
   */
  getExpiryBadge(days: number): { text: string; class: string } | null {
    if (days <= 0) {
      return { text: 'Expired', class: 'bg-red-100 text-red-800' };
    }
    if (days <= 7) {
      return { text: `${days} days left`, class: 'bg-red-100 text-red-800' };
    }
    if (days <= 30) {
      return { text: `${days} days left`, class: 'bg-yellow-100 text-yellow-800' };
    }
    return null;
  }

  /**
   * Open cancel modal
   */
  openCancelModal(subscription: SubscriptionWithDetails): void {
    this.selectedSubscription.set(subscription);
    this.showCancelModal.set(true);
  }

  /**
   * Close cancel modal
   */
  closeCancelModal(): void {
    this.showCancelModal.set(false);
    this.selectedSubscription.set(null);
    this.cancelReason.set('');
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(): void {
    const sub = this.selectedSubscription();
    if (!sub) return;

    this.loading.set(true);

    this.subscriptionService.cancelSubscription(sub.id, this.cancelReason())
      .subscribe({
        next: () => {
          // Update local state
          const subs = this.subscriptions();
          const updated = subs.map(s =>
            s.id === sub.id ? { ...s, status: 'Cancelled' as any, autoRenew: false } : s
          );
          this.subscriptions.set(updated);
          this.calculateStats(updated);
          this.closeCancelModal();
          this.loading.set(false);
          alert('Subscription cancelled successfully');
        },
        error: (err) => {
          this.loading.set(false);
          alert('Failed to cancel subscription');
        }
      });
  }

  /**
   * Toggle auto-renew
   */
  toggleAutoRenew(subscription: SubscriptionWithDetails): void {
    const subs = this.subscriptions();
    const updated = subs.map(s =>
      s.id === subscription.id ? { ...s, autoRenew: !s.autoRenew } : s
    );
    this.subscriptions.set(updated);

    const message = subscription.autoRenew
      ? 'Auto-renewal disabled'
      : 'Auto-renewal enabled';
    alert(message);
  }

  /**
   * Navigate to upgrade/downgrade
   */
  upgradeSubscription(subscription: SubscriptionWithDetails): void {
    this.router.navigate(['/subscription-plans'], {
      queryParams: { upgrade: subscription.id }
    });
  }

  /**
   * Navigate to subscription plans
   */
  browseNewPlans(): void {
    this.router.navigate(['/subscription-plans']);
  }

  /**
   * View usage details
   */
  viewUsageDetails(subscription: SubscriptionWithDetails): void {
    this.router.navigate(['/student/dashboard'], {
      queryParams: { studentId: subscription.studentId }
    });
  }

  /**
   * Download invoice
   */
  downloadInvoice(subscription: SubscriptionWithDetails): void {
    alert(`Downloading invoice for ${subscription.planName}...`);
    // Implement actual download logic
  }

  /**
   * Refresh subscriptions
   */
  refresh(): void {
    this.loadSubscriptions();
  }
}
