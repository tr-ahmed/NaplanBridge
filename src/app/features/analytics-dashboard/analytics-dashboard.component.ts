/**
 * Analytics Dashboard Component
 * Displays comprehensive spending analytics and trends
 */

import { Component, OnInit, inject, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, OrderAnalyticsDto } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss'
})
export class AnalyticsDashboardComponent implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  // Signals
  analytics = signal<OrderAnalyticsDto | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Date range filter
  startDate = '';
  endDate = '';

  // Current year for default
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.loadCurrentYearAnalytics();
  }

  /**
   * Load current year analytics
   */
  loadCurrentYearAnalytics(): void {
    this.loading.set(true);
    this.error.set(null);

    this.orderService.getCurrentYearAnalytics().pipe(
      catchError(error => {
        console.error('Error loading analytics:', error);
        this.error.set('Failed to load analytics. Please try again.');
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        this.analytics.set(data);
      }
      this.loading.set(false);
    });
  }

  /**
   * Load analytics for custom date range
   */
  loadDateRangeAnalytics(): void {
    if (!this.startDate || !this.endDate) {
      this.toastService.showWarning('Please select both start and end dates');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.orderService.getOrderAnalytics(this.startDate, this.endDate).pipe(
      catchError(error => {
        console.error('Error loading analytics:', error);
        this.error.set('Failed to load analytics. Please try again.');
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        this.analytics.set(data);
      }
      this.loading.set(false);
    });
  }

  /**
   * Reset to current year
   */
  resetToCurrentYear(): void {
    this.startDate = '';
    this.endDate = '';
    this.loadCurrentYearAnalytics();
  }

  /**
   * Get month name
   */
  getMonthColor(index: number): string {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
    ];
    return colors[index % colors.length];
  }

  /**
   * Get student color
   */
  getStudentColor(index: number): string {
    const colors = [
      'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-red-400',
      'bg-purple-400', 'bg-pink-400', 'bg-indigo-400', 'bg-teal-400'
    ];
    return colors[index % colors.length];
  }

  /**
   * Get max spending for chart scaling
   */
  getMaxMonthlySpending(): number {
    if (!this.analytics() || !this.analytics()!.monthlySpending.length) return 100;
    return Math.max(...this.analytics()!.monthlySpending.map(m => m.amount));
  }

  /**
   * Get max subscription count for chart scaling
   */
  getMaxSubscriptionCount(): number {
    if (!this.analytics() || !this.analytics()!.spendingByStudent.length) return 10;
    return Math.max(...this.analytics()!.spendingByStudent.map(s => s.subscriptionCount));
  }

  /**
   * Calculate percentage for bar chart
   */
  getBarHeight(value: number, max: number): number {
    return (value / max) * 100;
  }

  /**
   * Export analytics to CSV
   */
  exportToCSV(): void {
    if (!this.analytics()) return;

    const data = this.analytics()!;
    let csv = 'Analytics Report\n\n';
    csv += `Total Spent,$${data.totalSpent.toFixed(2)}\n`;
    csv += `Total Orders,${data.totalOrders}\n`;
    csv += `Average Order Value,$${data.averageOrderValue.toFixed(2)}\n\n`;

    csv += 'Monthly Spending\n';
    csv += 'Month,Amount,Orders\n';
    data.monthlySpending.forEach(m => {
      csv += `${m.monthName},$${m.amount.toFixed(2)},${m.orderCount}\n`;
    });

    csv += '\nSpending by Student\n';
    csv += 'Student,Total Spent,Subscriptions\n';
    data.spendingByStudent.forEach(s => {
      csv += `${s.studentName},$${s.totalSpent.toFixed(2)},${s.subscriptionCount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Print analytics
   */
  printAnalytics(): void {
    window.print();
  }
}
