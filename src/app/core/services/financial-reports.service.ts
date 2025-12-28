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

// Tutoring Details DTO (NEW for Tutoring Packages)
export interface TutoringDetailsDto {
  tutoringOrderId: number;
  orderNumber: string;           // e.g., "TUT-000123"
  packageSummary: string;        // e.g., "2 Students × 3 Subjects × 30 Hours"
  totalHours: number;
  totalStudents: number;
  totalSubjects: number;
  baseAmount: number;            // Price before discounts
  discountAmount: number;        // Total discount applied
  discountBreakdown: string;     // e.g., "Multi-Subject: 10%, Group: 35%"
  teachingType: string;          // "OneToOne" or "Group"
}

export interface DetailedFinancialTransactionDto {
  transactionId: number;
  orderId: number;
  date: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  paymentSource: 'Session' | 'Subscription' | 'Tutoring';
  student: StudentInfoDto;
  sessionDetails?: SessionDetailsDto;
  subscriptionDetails?: SubscriptionDetailsDto;
  tutoringDetails?: TutoringDetailsDto;  // NEW
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
  // NEW: Tutoring Packages
  totalTutoringOrders?: number;
  tutoringRevenue?: number;
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
    paymentSource: 'All' | 'Session' | 'Subscription' | 'Tutoring' = 'All',
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
    paymentSource: 'All' | 'Session' | 'Subscription' | 'Tutoring' = 'All',
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

    // Use XMLHttpRequest for better control over binary data
    return new Observable<Blob>(observer => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${this.apiUrl}/detailed/export?${params.toString()}`, true);
      xhr.responseType = 'blob';

      // Add authorization header - use correct token name
      const token = localStorage.getItem('authToken');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        console.log('🔐 Added Authorization header');
      } else {
        console.warn('⚠️ No auth token found in localStorage');
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const blob = xhr.response;
          console.log('✅ Export successful:', {
            status: xhr.status,
            contentType: xhr.getResponseHeader('Content-Type'),
            blobSize: blob.size,
            blobType: blob.type
          });
          observer.next(blob);
          observer.complete();
        } else {
          console.error('❌ Export failed:', xhr.status, xhr.statusText);
          observer.error(new Error(`Export failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        console.error('❌ Network error during export');
        observer.error(new Error('Network error'));
      };

      xhr.send();
    });
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
   * Download exported file with correct MIME type
   */
  downloadFile(blob: Blob, filename: string): void {
    console.log(`📥 Starting download: ${filename}`);
    console.log(`📦 Blob details: size=${blob.size} bytes, type="${blob.type}"`);

    // Determine correct MIME type from extension
    const extension = filename.split('.').pop()?.toLowerCase();
    let correctMimeType = blob.type;

    switch (extension) {
      case 'xlsx':
        correctMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        correctMimeType = 'application/pdf';
        break;
      case 'csv':
        correctMimeType = 'text/csv';
        break;
    }

    // Always create new blob with correct MIME type
    const correctedBlob = new Blob([blob], { type: correctMimeType });
    console.log(`✅ Using MIME type: ${correctMimeType}`);

    // Create download link
    const url = window.URL.createObjectURL(correctedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('✅ Download completed and cleaned up');
    }, 100);
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
