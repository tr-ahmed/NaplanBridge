/**
 * Advanced Analytics Service
 * Provides comprehensive analytics data and export functionality
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// Interfaces
export interface AnalyticsData {
  period: 'week' | 'month' | 'year';
  reportType: 'overview' | 'students' | 'courses' | 'revenue';

  // Overview metrics
  overview: {
    totalStudents: number;
    previousStudents: number;
    activeStudents: number;
    previousActive: number;
    totalRevenue: number;
    previousRevenue: number;
    coursesCompleted: number;
    previousCompleted: number;
    averageScore: number;
    previousScore: number;
  };

  // Student metrics
  studentMetrics?: {
    enrollments: number[];
    labels: string[];
    topPerformers: Array<{
      name: string;
      score: number;
      progress: number;
    }>;
    engagementRate: number;
  };

  // Course metrics
  courseMetrics?: {
    completionRates: number[];
    courseNames: string[];
    mostPopular: Array<{
      name: string;
      enrollments: number;
      rating: number;
    }>;
  };

  // Revenue metrics
  revenueMetrics?: {
    daily: number[];
    monthly: number[];
    yearly: number[];
    labels: string[];
    byPlan: Record<string, number>;
    subscriptionTrends: {
      new: number;
      renewals: number;
      cancellations: number;
    };
  };
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
    backgroundColor?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedAnalyticsService {

  /**
   * Get analytics data
   */
  getAnalytics(period: 'week' | 'month' | 'year', reportType: 'overview' | 'students' | 'courses' | 'revenue'): Observable<AnalyticsData> {
    // Mock data - replace with real API
    const mockData: AnalyticsData = {
      period,
      reportType,
      overview: {
        totalStudents: 1250,
        previousStudents: 1180,
        activeStudents: 980,
        previousActive: 920,
        totalRevenue: 45600,
        previousRevenue: 42300,
        coursesCompleted: 3450,
        previousCompleted: 3200,
        averageScore: 85.5,
        previousScore: 83.2
      },
      studentMetrics: {
        enrollments: this.getEnrollmentData(period),
        labels: this.getLabels(period),
        topPerformers: [
          { name: 'Ahmed Hassan', score: 95, progress: 92 },
          { name: 'Sara Mohamed', score: 93, progress: 88 },
          { name: 'Omar Ali', score: 91, progress: 95 },
          { name: 'Layla Khaled', score: 89, progress: 85 },
          { name: 'Youssef Ibrahim', score: 87, progress: 90 }
        ],
        engagementRate: 78.5
      },
      courseMetrics: {
        completionRates: [85, 78, 92, 88, 75, 90],
        courseNames: ['Math Y7', 'English Y7', 'Science Y8', 'History Y7', 'Math Y8', 'English Y8'],
        mostPopular: [
          { name: 'Mathematics Year 7', enrollments: 245, rating: 4.8 },
          { name: 'English Year 7', enrollments: 230, rating: 4.7 },
          { name: 'Science Year 8', enrollments: 215, rating: 4.9 }
        ]
      },
      revenueMetrics: {
        daily: this.getRevenueData('daily', period),
        monthly: this.getRevenueData('monthly', period),
        yearly: this.getRevenueData('yearly', period),
        labels: this.getLabels(period),
        byPlan: {
          'Term 1': 12500,
          'Terms 1 & 2': 18900,
          'Full Year': 24200
        },
        subscriptionTrends: {
          new: 145,
          renewals: 320,
          cancellations: 28
        }
      }
    };

    return of(mockData).pipe(delay(500));
  }

  /**
   * Get chart data
   */
  getChartData(period: 'week' | 'month' | 'year', reportType: 'overview' | 'students' | 'courses' | 'revenue'): Observable<ChartData> {
    const mockChartData: ChartData = {
      labels: this.getLabels(period),
      datasets: [
        {
          label: 'Active Students',
          data: this.getEnrollmentData(period),
          color: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)'
        },
        {
          label: 'Revenue',
          data: this.getRevenueData('daily', period),
          color: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)'
        }
      ]
    };

    return of(mockChartData).pipe(delay(300));
  }

  /**
   * Export to PDF
   */
  exportToPDF(data: AnalyticsData): Observable<boolean> {
    // Mock PDF generation
    console.log('Generating PDF report...', data);

    // Simulate PDF download
    const pdfContent = this.generatePDFContent(data);
    this.downloadFile(pdfContent, `analytics-report-${Date.now()}.txt`, 'text/plain');

    return of(true).pipe(delay(1000));
  }

  /**
   * Export to Excel
   */
  exportToExcel(data: AnalyticsData): Observable<boolean> {
    // Mock Excel generation
    console.log('Generating Excel report...', data);

    // Generate CSV format (can be opened in Excel)
    const csvContent = this.generateCSVContent(data);
    this.downloadFile(csvContent, `analytics-report-${Date.now()}.csv`, 'text/csv');

    return of(true).pipe(delay(1000));
  }

  /**
   * Generate enrollment data based on period
   */
  private getEnrollmentData(period: 'week' | 'month' | 'year'): number[] {
    const dataPoints = {
      'week': [120, 135, 128, 142, 138, 145, 150],
      'month': [980, 1020, 1050, 1080, 1120, 1150, 1180, 1200, 1220, 1240, 1235, 1250],
      'year': [850, 920, 980, 1050, 1120, 1180, 1220, 1250, 1200, 1230, 1240, 1250]
    };

    return dataPoints[period];
  }

  /**
   * Generate revenue data
   */
  private getRevenueData(type: 'daily' | 'monthly' | 'yearly', period: 'week' | 'month' | 'year'): number[] {
    if (type === 'daily' && period === 'week') {
      return [1200, 1500, 1800, 1600, 2000, 2200, 2400];
    }
    if (type === 'monthly' && period === 'year') {
      return [32000, 35000, 38000, 40000, 42000, 43000, 44000, 45000, 44500, 45200, 45500, 45600];
    }

    return [3800, 4200, 4500, 4800, 5000, 5200, 5400];
  }

  /**
   * Get labels for charts
   */
  private getLabels(period: 'week' | 'month' | 'year'): string[] {
    const labels = {
      'week': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      'month': ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      'year': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    };

    return labels[period];
  }

  /**
   * Generate PDF content (mock - would use library like jsPDF in production)
   */
  private generatePDFContent(data: AnalyticsData): string {
    let content = '=== ANALYTICS REPORT ===\n\n';
    content += `Period: ${data.period}\n`;
    content += `Report Type: ${data.reportType}\n\n`;

    content += '--- OVERVIEW ---\n';
    content += `Total Students: ${data.overview.totalStudents}\n`;
    content += `Active Students: ${data.overview.activeStudents}\n`;
    content += `Total Revenue: $${data.overview.totalRevenue}\n`;
    content += `Average Score: ${data.overview.averageScore}%\n\n`;

    if (data.studentMetrics) {
      content += '--- TOP PERFORMERS ---\n';
      data.studentMetrics.topPerformers.forEach((student, index) => {
        content += `${index + 1}. ${student.name} - Score: ${student.score}%, Progress: ${student.progress}%\n`;
      });
    }

    return content;
  }

  /**
   * Generate CSV content
   */
  private generateCSVContent(data: AnalyticsData): string {
    let csv = 'Metric,Current,Previous,Change\n';
    csv += `Total Students,${data.overview.totalStudents},${data.overview.previousStudents},${data.overview.totalStudents - data.overview.previousStudents}\n`;
    csv += `Active Students,${data.overview.activeStudents},${data.overview.previousActive},${data.overview.activeStudents - data.overview.previousActive}\n`;
    csv += `Revenue,$${data.overview.totalRevenue},$${data.overview.previousRevenue},$${data.overview.totalRevenue - data.overview.previousRevenue}\n`;
    csv += `Average Score,${data.overview.averageScore}%,${data.overview.previousScore}%,${(data.overview.averageScore - data.overview.previousScore).toFixed(1)}%\n`;

    return csv;
  }

  /**
   * Download file helper
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
