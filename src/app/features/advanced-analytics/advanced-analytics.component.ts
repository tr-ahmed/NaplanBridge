/**
 * Advanced Analytics Component
 * Comprehensive analytics dashboard with charts and reports
 */

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdvancedAnalyticsService, AnalyticsData, ChartData } from '../../core/services/advanced-analytics.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-advanced-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './advanced-analytics.component.html',
  styleUrl: './advanced-analytics.component.scss'
})
export class AdvancedAnalyticsComponent implements OnInit {

  // State
  loading = signal(true);
  selectedPeriod = signal<'week' | 'month' | 'year'>('month');
  selectedReport = signal<'overview' | 'students' | 'courses' | 'revenue'>('overview');

  // Data
  analyticsData = signal<AnalyticsData | null>(null);
  chartData = signal<ChartData | null>(null);
  private toastService = inject(ToastService);

  constructor(private analyticsService: AdvancedAnalyticsService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  /**
   * Load analytics data
   */
  loadAnalytics(): void {
    this.loading.set(true);

    this.analyticsService.getAnalytics(this.selectedPeriod(), this.selectedReport())
      .subscribe({
        next: (data: AnalyticsData) => {
          this.analyticsData.set(data);
          this.loadChartData();
        },
        error: (err: any) => {
          console.error('Error loading analytics:', err);
          this.loading.set(false);
        }
      });
  }

  /**
   * Load chart data
   */
  private loadChartData(): void {
    this.analyticsService.getChartData(this.selectedPeriod(), this.selectedReport())
      .subscribe({
        next: (data: ChartData) => {
          this.chartData.set(data);
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error loading chart data:', err);
          this.loading.set(false);
        }
      });
  }

  /**
   * Change period
   */
  changePeriod(period: 'week' | 'month' | 'year'): void {
    this.selectedPeriod.set(period);
    this.loadAnalytics();
  }

  /**
   * Change report type
   */
  changeReport(report: 'overview' | 'students' | 'courses' | 'revenue'): void {
    this.selectedReport.set(report);
    this.loadAnalytics();
  }

  /**
   * Export to PDF
   */
  exportToPDF(): void {
    if (!this.analyticsData()) {
      this.toastService.showWarning('No data available to export');
      return;
    }

    this.analyticsService.exportToPDF(this.analyticsData()!)
      .subscribe({
        next: (blob: Blob) => {
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `analytics-report-${Date.now()}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);

          this.toastService.showSuccess('PDF exported successfully!');
        },
        error: (err: any) => {
          console.error('PDF export error:', err);
          this.toastService.showError('Failed to export PDF');
        }
      });
  }

  /**
   * Export to Excel
   */
  exportToExcel(): void {
    if (!this.analyticsData()) {
      this.toastService.showWarning('No data available to export');
      return;
    }

    this.analyticsService.exportToExcel(this.analyticsData()!)
      .subscribe({
        next: (blob: Blob) => {
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `analytics-report-${Date.now()}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);

          this.toastService.showSuccess('Excel exported successfully!');
        },
        error: (err: any) => {
          console.error('Excel export error:', err);
          this.toastService.showError('Failed to export Excel');
        }
      });
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadAnalytics();
  }

  /**
   * Get percentage change
   */
  getPercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Get trend indicator
   */
  getTrendIndicator(current: number, previous: number): 'up' | 'down' | 'neutral' {
    const change = this.getPercentageChange(current, previous);
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'neutral';
  }

  /**
   * Get max value for chart scaling
   */
  getMaxValue(values: number[]): number {
    return Math.max(...values);
  }

  /**
   * Get bar height percentage
   */
  getBarHeight(value: number, max: number): number {
    return (value / max) * 100;
  }
}
