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
import { UserService } from '../../core/services/user.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { ProgressService } from '../../core/services/progress.service';
import { ToastService } from '../../core/services/toast.service';
import { forkJoin, catchError, of } from 'rxjs';

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
  orderId?: number; // ✅ Added: Link to Orders table for invoice access
}

@Component({
  selector: 'app-my-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-subscriptions.component.html',
  styleUrl: './my-subscriptions.component.scss'
})
export class MySubscriptionsComponent implements OnInit {
  // Services
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  private userService = inject(UserService);
  private dashboardService = inject(DashboardService);
  private progressService = inject(ProgressService);
  private toastService = inject(ToastService);

  // Signals
  subscriptions = signal<SubscriptionWithDetails[]>([]);
  loading = signal(true);
  selectedSubscription = signal<SubscriptionWithDetails | null>(null);
  showCancelModal = signal(false);
  cancelReason = signal('');
  parentId = signal<number | null>(null);

  // Stats
  stats = signal({
    total: 0,
    active: 0,
    expiringSoon: 0,
    totalSpent: 0
  });

  ngOnInit(): void {
    this.extractParentId();
    this.loadSubscriptions();
  }

  /**
   * Extract parent ID from JWT token
   */
  private extractParentId(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.parentId.set(Number(payload.nameid));
      } catch (error) {
        console.error('Error extracting parent ID:', error);
      }
    }
  }

  /**
   * Load all subscriptions for parent's children
   */
  private loadSubscriptions(): void {
    const parentId = this.parentId();
    if (!parentId) {
      console.error('Parent ID not found');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    // Get parent's children
    this.userService.getChildren(parentId).pipe(
      catchError(error => {
        console.error('Error loading children:', error);
        return of([]);
      })
    ).subscribe(children => {
      if (children.length === 0) {
        this.subscriptions.set([]);
        this.loading.set(false);
        return;
      }

      // Load subscriptions and progress for each child
      const childRequests = children.map(child => {
        return forkJoin({
          child: of(child),
          subscriptions: this.dashboardService.getParentStudentSubscriptions(child.id, true).pipe(
            catchError(() => of({ subscriptions: [], expired: [], totalActiveSubscriptions: 0, totalExpired: 0, totalSpent: 0 }))
          ),
          progress: this.progressService.getStudentProgress(child.id).pipe(
            catchError(() => of(null))
          )
        });
      });

      forkJoin(childRequests).subscribe({
        next: (childrenData) => {
          console.log('🔍 My Subscriptions - Raw API Response:', childrenData);

          const allSubscriptions: SubscriptionWithDetails[] = [];
          let totalSpentAcrossAllChildren = 0;

          childrenData.forEach(data => {
            const child = data.child;

            // ✅ Extract subscriptions from Parent API response
            let subscriptions: any[] = [];
            if (data.subscriptions && typeof data.subscriptions === 'object') {
              // Combine active and expired subscriptions
              const activeSubscriptions = Array.isArray(data.subscriptions.subscriptions) ? data.subscriptions.subscriptions : [];
              const expiredSubscriptions = Array.isArray(data.subscriptions.expired) ? data.subscriptions.expired : [];
              subscriptions = [...activeSubscriptions, ...expiredSubscriptions];

              // ✅ Add totalSpent from API response
              totalSpentAcrossAllChildren += data.subscriptions.totalSpent || 0;
            }

            const progressData = Array.isArray(data.progress) ? data.progress : [];

            console.log(`👤 ${child.userName}:`, subscriptions.length, 'subscription(s), Total Spent: $', data.subscriptions?.totalSpent || 0);

            subscriptions.forEach((sub: any) => {
              // Calculate progress - use API data if available, fallback to calculation
              const completedLessons = sub.completedLessons ?? (progressData.filter((p: any) => p.subjectId === sub.subjectId && p.isCompleted).length);
              const totalLessons = sub.totalLessons ?? progressData.filter((p: any) => p.subjectId === sub.subjectId).length;
              const progressPercentage = sub.progressPercentage ?? (totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0);

              // ✅ Handle different date field names from different endpoints
              const endDate = new Date(sub.expiryDate || sub.endDate || sub.subscriptionEndDate || Date.now());
              const daysUntilExpiry = sub.daysRemaining ?? this.calculateDaysUntilExpiry(endDate);

              // Map to SubscriptionWithDetails
              const subscription: SubscriptionWithDetails = {
                id: sub.id || 0,
                studentId: child.id,
                studentName: child.userName,
                planId: sub.planId || 0,
                planName: sub.planName || sub.subjectName || 'Unknown Plan',
                status: sub.isActive || sub.status === 'Active' ? 'Active' : 'Expired',
                startDate: new Date(sub.startDate || sub.subscriptionStartDate || Date.now()),
                endDate: endDate,
                autoRenew: sub.autoRenew || false,
                totalAmount: sub.totalAmount || sub.price || 0,
                paidAmount: sub.paidAmount || sub.price || 0,
                remainingAmount: sub.remainingAmount || 0,
                paymentMethod: sub.paymentMethod || 'credit_card',
                paymentStatus: sub.paymentStatus || (sub.isActive ? 'paid' : 'pending'),
                progressPercentage: Math.round(progressPercentage),
                completedLessons,
                totalLessons,
                lastAccessDate: sub.lastAccessDate ? new Date(sub.lastAccessDate) : undefined,
                notes: sub.notes || '',
                createdAt: new Date(sub.createdAt || Date.now()),
                updatedAt: new Date(sub.updatedAt || Date.now()),
                daysUntilExpiry,
                usagePercentage: Math.round(progressPercentage),
                orderId: sub.orderId // ✅ Added: Map orderId from API response
              };

              allSubscriptions.push(subscription);
            });
          });

          this.subscriptions.set(allSubscriptions);
          this.calculateStats(allSubscriptions, totalSpentAcrossAllChildren);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading subscriptions:', error);
          this.subscriptions.set([]);
          this.loading.set(false);
        }
      });
    });
  }

  /**
   * Calculate subscription statistics
   */
  private calculateStats(subscriptions: SubscriptionWithDetails[], totalSpentFromAPI: number): void {
    const stats = {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'Active').length,
      expiringSoon: subscriptions.filter(s =>
        (s.daysUntilExpiry || 0) <= 30 && (s.daysUntilExpiry || 0) > 0
      ).length,
      totalSpent: totalSpentFromAPI // ✅ Use totalSpent from API instead of calculating
    };
    this.stats.set(stats);
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

    console.log('❌ Cancel Subscription:', {
      subscription: sub,
      reason: this.cancelReason()
    });

    this.loading.set(true);

    // Call real API endpoint
    this.subscriptionService.cancelSubscription(sub.id, this.cancelReason())
      .subscribe({
        next: (response) => {
          console.log('✅ Cancellation response:', response);

          // Update local state
          const subs = this.subscriptions();
          const updated = subs.map(s =>
            s.id === sub.id ? { ...s, status: 'Cancelled' as any, autoRenew: false } : s
          );
          this.subscriptions.set(updated);
          // Recalculate totalSpent after cancellation
          const totalSpent = updated.reduce((sum, s) => sum + (s.status !== 'Cancelled' ? s.totalAmount : 0), 0);
          this.calculateStats(updated, totalSpent);
          this.closeCancelModal();
          this.loading.set(false);

          this.toastService.showSuccess(`${response.message || 'Subscription cancelled successfully'}. Refund: $${response.refundAmount || 0}`);
        },
        error: (err) => {
          console.error('❌ Failed to cancel subscription:', err);
          this.loading.set(false);

          const errorMessage = err.error?.message || 'Failed to cancel subscription';
          this.toastService.showError(`${errorMessage}. Please try again or contact support.`);
        }
      });
  }

  /**
   * Toggle auto-renew - NOW USING REAL API
   */
  toggleAutoRenew(subscription: SubscriptionWithDetails): void {
    console.log('🔄 Toggle Auto-Renew:', subscription);

    const newValue = !subscription.autoRenew;
    this.loading.set(true);

    this.subscriptionService.updateAutoRenew(subscription.id, newValue)
      .subscribe({
        next: (response) => {
          console.log('✅ Auto-renewal updated:', response);

          // Update local state
          const subs = this.subscriptions();
          const updated = subs.map(s =>
            s.id === subscription.id ? { ...s, autoRenew: newValue } : s
          );
          this.subscriptions.set(updated);
          this.loading.set(false);

          this.toastService.showSuccess(`Auto-renewal ${newValue ? 'enabled' : 'disabled'} successfully!`);
        },
        error: (err) => {
          console.error('❌ Failed to update auto-renewal:', err);
          this.loading.set(false);

          let errorMessage = 'Failed to update auto-renewal. ';

          if (err.status === 403) {
            errorMessage += 'Permission Denied. You do not have permission to modify this subscription. Please contact support for assistance.';
          } else if (err.status === 404) {
            errorMessage += 'Subscription not found.';
          } else if (err.error?.message) {
            errorMessage += err.error.message;
          } else {
            errorMessage += 'Please try again later.';
          }

          this.toastService.showError(errorMessage);
        }
      });
  }

  /**
   * Navigate to upgrade/downgrade
   */
  upgradeSubscription(subscription: SubscriptionWithDetails): void {
    console.log('⬆️ Upgrade Subscription:', subscription);
    // Navigate to available plans for this subject/term
    this.router.navigate(['/courses'], {
      queryParams: {
        studentId: subscription.studentId,
        upgrade: true
      }
    });
  }

  /**
   * Navigate to subscription plans
   */
  browseNewPlans(): void {
    console.log('➕ Browse New Plans');
    this.router.navigate(['/courses']);
  }

  /**
   * View usage details
   */
  viewUsageDetails(subscription: SubscriptionWithDetails): void {
    console.log('📊 View Usage Details:', subscription);
    // Navigate to student dashboard to view progress
    this.router.navigate(['/student/dashboard'], {
      queryParams: { studentId: subscription.studentId }
    });
  }

  /**
   * Download invoice - Navigate to invoice page with validation
   */
  downloadInvoice(subscription: SubscriptionWithDetails): void {
    console.log('📄 View Invoice:', subscription);

    // Check if orderId exists
    const orderId = (subscription as any).orderId;

    if (!orderId) {
      // Show informative error message
      this.toastService.showWarning(
        `Invoice Not Available. This subscription (${subscription.planName}) does not have an associated order record. Please contact support for assistance.`,
        7000
      );

      console.warn('⚠️ Missing orderId for subscription:', {
        subscriptionId: subscription.id,
        studentName: subscription.studentName,
        planName: subscription.planName
      });

      return;
    }

    // Navigate to invoice page
    console.log(`✅ Navigating to invoice page for order ${orderId}`);
    this.router.navigate(['/parent/invoice', orderId]);
  }

  /**
   * Refresh subscriptions
   */
  refresh(): void {
    console.log('🔄 Refreshing subscriptions...');
    this.loadSubscriptions();
  }
}
