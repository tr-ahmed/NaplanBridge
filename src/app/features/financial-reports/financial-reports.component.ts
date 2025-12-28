/**
 * Financial Reports Component
 * Displays detailed financial transactions with filtering and export
 */

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FinancialReportsService,
  DetailedFinancialReportDto,
  DetailedFinancialTransactionDto,
  FinancialSummaryBySourceDto
} from '../../core/services/financial-reports.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financial-reports.component.html',
  styleUrl: './financial-reports.component.scss'
})
export class FinancialReportsComponent implements OnInit {
  private reportsService = inject(FinancialReportsService);
  private toastService = inject(ToastService);

  // State
  loading = signal(false);
  exporting = signal(false);

  // Filters
  startDate = '';
  endDate = '';
  paymentSource: 'All' | 'Session' | 'Subscription' | 'Tutoring' = 'All';
  currentPage = 1;
  pageSize = 50;

  // Data
  report = signal<DetailedFinancialReportDto | null>(null);
  summary = signal<FinancialSummaryBySourceDto | null>(null);

  ngOnInit(): void {
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];

    this.loadReport();
    this.loadSummary();
  }

  /**
   * Convert a date string (YYYY-MM-DD) to end-of-day ISO string (inclusive)
   */
  private toEndOfDayISOString(dateStr: string): string {
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }

  /**
   * Convert a date string (YYYY-MM-DD) to start-of-day ISO string
   */
  private toStartOfDayISOString(dateStr: string): string {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  /**
   * Load detailed report
   */
  loadReport(): void {
    if (!this.startDate || !this.endDate) {
      this.toastService.showWarning('Please select start and end dates');
      return;
    }

    // Guard: startDate should not be after endDate
    if (new Date(this.startDate) > new Date(this.endDate)) {
      this.toastService.showWarning('Start date cannot be after end date');
      return;
    }

    this.loading.set(true);

    this.reportsService.getDetailedReport(
      this.toStartOfDayISOString(this.startDate),
      this.toEndOfDayISOString(this.endDate),
      this.paymentSource,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (data) => {
        console.log('📊 Financial report loaded:', data);
        console.log('💰 Summary:', {
          totalRevenue: data.summary.totalRevenue,
          sessionsRevenue: data.summary.sessionsRevenue,
          subscriptionsRevenue: data.summary.subscriptionsRevenue,
          tutoringRevenue: data.summary.tutoringRevenue,
          totalSessions: data.summary.totalSessions,
          totalSubscriptions: data.summary.totalSubscriptions,
          totalTutoringOrders: data.summary.totalTutoringOrders
        });
        this.report.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading report:', error);
        this.toastService.showError('Failed to load financial report');
        this.loading.set(false);
      }
    });
  }

  /**
   * Load summary by source
   */
  loadSummary(): void {
    if (!this.startDate || !this.endDate) return;

    this.reportsService.getSummaryBySource(
      this.toStartOfDayISOString(this.startDate),
      this.toEndOfDayISOString(this.endDate)
    ).subscribe({
      next: (data) => {
        this.summary.set(data);
      },
      error: (error) => {
        console.error('Error loading summary:', error);
      }
    });
  }

  /**
   * Apply filters
   */
  applyFilters(): void {
    this.currentPage = 1;
    this.loadReport();
    this.loadSummary();
  }

  /**
   * Change page
   */
  changePage(page: number): void {
    this.currentPage = page;
    this.loadReport();
  }

  /**
   * Export report
   */
  exportReport(format: 'excel' | 'pdf' | 'csv'): void {
    if (!this.startDate || !this.endDate) {
      this.toastService.showWarning('Please select start and end dates');
      return;
    }

    this.exporting.set(true);
    console.log(`📤 Exporting report as ${format.toUpperCase()}...`);

    this.reportsService.exportReport(
      this.toStartOfDayISOString(this.startDate),
      this.toEndOfDayISOString(this.endDate),
      this.paymentSource,
      format
    ).subscribe({
      next: (blob: Blob) => {
        console.log('✅ Export response received');
        console.log(`📦 Blob details: size=${blob.size} bytes, type="${blob.type}"`);

        if (!blob || blob.size === 0) {
          console.error('❌ Empty blob received');
          this.toastService.showError('Received empty file from server');
          this.exporting.set(false);
          return;
        }

        try {
          const filename = this.reportsService.generateExportFilename(format);
          console.log(`💾 Initiating download: ${filename}`);
          this.reportsService.downloadFile(blob, filename);

          this.toastService.showSuccess(`Report exported successfully as ${format.toUpperCase()}`);
          this.exporting.set(false);
        } catch (downloadError) {
          console.error('❌ Error downloading file:', downloadError);
          this.toastService.showError('Failed to download the exported file');
          this.exporting.set(false);
        }
      },
      error: (error) => {
        console.error('❌ Error exporting report:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });

        if (error.error instanceof Blob) {
          console.log('⚠️ Response treated as error but contains blob, attempting download...');
          try {
            const filename = this.reportsService.generateExportFilename(format);
            this.reportsService.downloadFile(error.error, filename);
            this.toastService.showSuccess(`Report exported successfully as ${format.toUpperCase()}`);
            this.exporting.set(false);
            return;
          } catch (downloadError) {
            console.error('❌ Failed to download blob from error:', downloadError);
          }
        }

        let errorMessage = `Failed to export report as ${format.toUpperCase()}`;
        if (error.status === 0) {
          errorMessage = 'Network error - please check your connection';
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized - please login again';
        } else if (error.status === 500) {
          errorMessage = 'Server error - please try again later';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.toastService.showError(errorMessage);
        this.exporting.set(false);
      }
    });
  }

  /**
   * Get payment source badge color
   */
  getSourceBadgeClass(source: 'Session' | 'Subscription' | 'Tutoring'): string {
    switch (source) {
      case 'Session':
        return 'bg-blue-100 text-blue-800';
      case 'Subscription':
        return 'bg-green-100 text-green-800';
      case 'Tutoring':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pagination = this.report()?.pagination;
    if (!pagination) return [];

    const total = pagination.totalPages;
    const current = pagination.currentPage;
    const delta = 2;

    const range: number[] = [];
    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift(-1);
    }
    if (current + delta < total - 1) {
      range.push(-1);
    }

    range.unshift(1);
    if (total > 1) {
      range.push(total);
    }

    return range;
  }
}
