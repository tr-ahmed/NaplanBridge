/**
 * Student Subscriptions Component
 * Shows student's own active subscriptions
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-student-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-subscriptions.component.html',
  styleUrl: './student-subscriptions.component.scss'
})
export class StudentSubscriptionsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  studentId: number = 0;
  loading = signal<boolean>(true);
  subscriptions = signal<any[]>([]);

  // Stats
  stats = signal({
    total: 0,
    active: 0,
    expiringSoon: 0
  });

  ngOnInit(): void {
    const studentId = this.authService.getStudentId();
    if (studentId) {
      this.studentId = studentId;
      this.loadSubscriptions();
    } else {
      this.toastService.showError('Student ID not found');
      this.router.navigate(['/student/dashboard']);
    }
  }

  private loadSubscriptions(): void {
    this.loading.set(true);

    this.dashboardService.getStudentSubscriptionsSummary(this.studentId).subscribe({
      next: (response: any) => {
        let subsArray: any[] = [];

        if (response) {
          if (Array.isArray(response)) {
            subsArray = response;
          } else if (response.subscriptions && Array.isArray(response.subscriptions)) {
            subsArray = response.subscriptions;
          } else if (typeof response === 'object') {
            subsArray = [response];
          }
        }

        // Calculate days until expiry and status
        const now = new Date();
        subsArray = subsArray.map(sub => {
          const endDate = new Date(sub.endDate);
          const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          return {
            ...sub,
            daysUntilExpiry,
            isExpiringSoon: daysUntilExpiry > 0 && daysUntilExpiry <= 7,
            isActive: sub.status === 'Active' || (sub.isActive === true) || (endDate > now)
          };
        });

        this.subscriptions.set(subsArray);
        this.calculateStats(subsArray);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading subscriptions:', err);
        this.toastService.showError('Failed to load subscriptions');
        this.loading.set(false);
      }
    });
  }

  private calculateStats(subs: any[]): void {
    const total = subs.length;
    const active = subs.filter(s => s.isActive).length;
    const expiringSoon = subs.filter(s => s.isExpiringSoon).length;

    this.stats.set({ total, active, expiringSoon });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getDaysUntilExpiryClass(days: number): string {
    if (days <= 0) return 'text-red-600';
    if (days <= 7) return 'text-yellow-600';
    return 'text-gray-600';
  }

  renewSubscription(subscriptionId: number): void {
    this.toastService.showInfo('Renewal feature coming soon');
    // Navigate to courses for renewal
    this.router.navigate(['/courses']);
  }

  cancelSubscription(subscriptionId: number): void {
    this.toastService.showInfo('Cancellation feature coming soon');
  }

  viewDetails(subscription: any): void {
    this.toastService.showInfo('Subscription details feature coming soon');
  }

  goToBrowsePlans(): void {
    this.router.navigate(['/courses']);
  }
}
