/**
 * Advanced Analytics Component
 * Comprehensive analytics dashboard with charts and reports
 */

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdvancedAnalyticsService, AnalyticsData, ChartData } from '../../core/services/advanced-analytics.service';

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
    this.analyticsService.exportToPDF(this.analyticsData()!)
      .subscribe({
        next: () => {
          alert('PDF exported successfully!');
        },
        error: (err: any) => {
          alert('Failed to export PDF');
        }
      });
  }

  /**
   * Export to Excel
   */
  exportToExcel(): void {
    this.analyticsService.exportToExcel(this.analyticsData()!)
      .subscribe({
        next: () => {
          alert('Excel exported successfully!');
        },
        error: (err: any) => {
          alert('Failed to export Excel');
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
