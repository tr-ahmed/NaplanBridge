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
  paymentSource: 'All' | 'Session' | 'Subscription' = 'All';
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
   * Load detailed report
   */
  loadReport(): void {
    if (!this.startDate || !this.endDate) {
      this.toastService.showWarning('Please select start and end dates');
      return;
    }

    this.loading.set(true);

    this.reportsService.getDetailedReport(
      this.startDate,
      this.endDate,
      this.paymentSource,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (data) => {
        this.report.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading report:', error);
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
      this.startDate,
      this.endDate
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

    this.reportsService.exportReport(
      this.startDate,
      this.endDate,
      this.paymentSource,
      format
    ).subscribe({
      next: (blob) => {
        const filename = this.reportsService.generateExportFilename(format);
        this.reportsService.downloadFile(blob, filename);
        this.toastService.showSuccess(`Report exported successfully as ${format.toUpperCase()}`);
        this.exporting.set(false);
      },
      error: (error) => {
        console.error('Error exporting report:', error);
        this.toastService.showError(`Failed to export report as ${format.toUpperCase()}`);
        this.exporting.set(false);
      }
    });
  }

  /**
   * Get payment source badge color
   */
  getSourceBadgeClass(source: 'Session' | 'Subscription'): string {
    return source === 'Session'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800';
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
