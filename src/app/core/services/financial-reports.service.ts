/**
 * Financial Reports Service
 * Handles API calls for detailed financial reporting
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces
export interface StudentInfoDto {
  id: number;
  fullName: string;
  email: string;
}

export interface TeacherInfoDto {
  id: number;
  fullName: string;
  email: string;
}

export interface SessionDetailsDto {
  sessionId: number;
  subject: string;
  year: string;
  teacher: TeacherInfoDto;
  sessionDate: string;
  duration: number;
}

export interface SubscriptionDetailsDto {
  subscriptionId: number;
  subject: string;
  year: string;
  planType: string;
  planName: string;
  startDate: string;
  endDate: string;
  termNumber: number;
}

export interface DetailedFinancialTransactionDto {
  transactionId: number;
  orderId: number;
  date: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  paymentSource: 'Session' | 'Subscription';
  student: StudentInfoDto;
  sessionDetails?: SessionDetailsDto;
  subscriptionDetails?: SubscriptionDetailsDto;
}

export interface PaginationDto {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface FinancialSummaryDto {
  totalRevenue: number;
  totalSessions: number;
  sessionsRevenue: number;
  totalSubscriptions: number;
  subscriptionsRevenue: number;
  currency: string;
}

export interface DetailedFinancialReportDto {
  transactions: DetailedFinancialTransactionDto[];
  pagination: PaginationDto;
  summary: FinancialSummaryDto;
}

export interface RevenueSourceDto {
  source: string;
  count: number;
  revenue: number;
  percentage: number;
  averageTransactionValue: number;
}

export interface TopTeacherDto {
  teacherId: number;
  teacherName: string;
  sessionsCount: number;
  sessionsRevenue: number;
}

export interface TopSubjectDto {
  subjectId: number;
  subjectName: string;
  totalRevenue: number;
  sessionsRevenue: number;
  subscriptionsRevenue: number;
}

export interface FinancialSummaryBySourceDto {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRevenue: number;
    currency: string;
    sources: RevenueSourceDto[];
  };
  topTeachers: TopTeacherDto[];
  topSubjects: TopSubjectDto[];
}

@Injectable({
  providedIn: 'root'
})
export class FinancialReportsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/Reports/financial`;

  /**
   * Get detailed financial report with pagination
   */
  getDetailedReport(
    startDate: string,
    endDate: string,
    paymentSource: 'All' | 'Session' | 'Subscription' = 'All',
    page: number = 1,
    pageSize: number = 50
  ): Observable<DetailedFinancialReportDto> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('paymentSource', paymentSource)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<DetailedFinancialReportDto>(
      `${this.apiUrl}/detailed`,
      { params }
    );
  }

  /**
   * Export detailed financial report
   */
  exportReport(
    startDate: string,
    endDate: string,
    paymentSource: 'All' | 'Session' | 'Subscription' = 'All',
    format: 'excel' | 'pdf' | 'csv' = 'excel'
  ): Observable<Blob> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('paymentSource', paymentSource)
      .set('format', format);

    console.log('📡 Requesting export with params:', {
      startDate,
      endDate,
      paymentSource,
      format,
      url: `${this.apiUrl}/detailed/export`
    });

    return this.http.get(
      `${this.apiUrl}/detailed/export`,
      {
        params,
        responseType: 'blob' as 'json',  // Type assertion to handle Angular type checking
        observe: 'body'
      }
    ) as Observable<Blob>;
  }

  /**
   * Get financial summary by source
   */
  getSummaryBySource(
    startDate: string,
    endDate: string
  ): Observable<FinancialSummaryBySourceDto> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<FinancialSummaryBySourceDto>(
      `${this.apiUrl}/summary-by-source`,
      { params }
    );
  }

  /**
   * Download exported file
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get file extension based on format
   */
  getFileExtension(format: 'excel' | 'pdf' | 'csv'): string {
    switch (format) {
      case 'pdf':
        return 'pdf';
      case 'csv':
        return 'csv';
      default:
        return 'xlsx';
    }
  }

  /**
   * Generate filename for export
   */
  generateExportFilename(format: 'excel' | 'pdf' | 'csv'): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = this.getFileExtension(format);
    return `financial_report_${timestamp}.${extension}`;
  }
}
