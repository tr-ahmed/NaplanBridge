/**
 * Order Service
 * Handles order-related API calls with pagination, filtering, and analytics
 * Based on Enhanced Backend API Documentation (Phase 2)
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './base-api.service';

// ============================================
// DTOs - Request Parameters
// ============================================

export interface OrderFilterParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  status?: 'Pending' | 'Paid' | 'Failed' | '' | null;
  studentId?: number | null;
}

// ============================================
// DTOs - Order Summary
// ============================================

export interface ParentOrderSummary {
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string | null;
  orders: OrderSummaryItem[];
}

export interface OrderSummaryItem {
  id: number;
  date: string;
  amount: number;
  status: string;
  items: OrderItemSummary[];
}

export interface OrderItemSummary {
  studentName: string;
  planName: string;
  price: number;
}

// ============================================
// DTOs - Paginated Response
// ============================================

export interface PagedOrderSummaryDto {
  totalSpent: number;
  totalOrderCount: number;
  lastOrderDate: string | null;
  orders: OrderSummaryItem[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ============================================
// DTOs - Analytics
// ============================================

export interface OrderAnalyticsDto {
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  monthlySpending: MonthlySpendingDto[];
  spendingByStudent: StudentSpendingDto[];
  popularPlans: PlanPopularityDto[];
  statusBreakdown: StatusBreakdownDto;
}

export interface MonthlySpendingDto {
  year: number;
  month: number;
  monthName: string;
  amount: number;
  orderCount: number;
}

export interface StudentSpendingDto {
  studentId: number;
  studentName: string;
  totalSpent: number;
  subscriptionCount: number;
  activeSubjects: string[];
}

export interface PlanPopularityDto {
  planName: string;
  purchaseCount: number;
  totalRevenue: number;
}

export interface StatusBreakdownDto {
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  paidAmount: number;
  pendingAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  // ============================================
  // Basic Order Summary (Original Endpoint)
  // ============================================

  /**
   * Get parent order summary (basic, cached)
   * Endpoint: GET /api/Orders/parent/summary
   * Cache: 15 minutes
   */
  getParentSummary(): Observable<ParentOrderSummary> {
    return this.api.get<ParentOrderSummary>('Orders/parent/summary');
  }

  // ============================================
  // Paginated Order Summary (New Endpoint)
  // ============================================

  /**
   * Get paginated and filtered parent order summary
   * Endpoint: GET /api/Orders/parent/summary/paged
   * Supports: pagination, date filtering, status filtering, student filtering
   */
  getPagedOrderSummary(filters?: OrderFilterParams): Observable<PagedOrderSummaryDto> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.pageSize) {
        params = params.set('pageSize', filters.pageSize.toString());
      }
      if (filters.startDate) {
        params = params.set('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params = params.set('endDate', filters.endDate);
      }
      if (filters.status !== null && filters.status !== undefined && filters.status !== '') {
        params = params.set('status', filters.status);
      }
      if (filters.studentId !== null && filters.studentId !== undefined) {
        params = params.set('studentId', filters.studentId.toString());
      }
    }

    return this.api.get<PagedOrderSummaryDto>('Orders/parent/summary/paged', params);
  }

  // ============================================
  // Order Analytics (New Endpoint)
  // ============================================

  /**
   * Get comprehensive order analytics
   * Endpoint: GET /api/Orders/parent/analytics
   * Cache: 30 minutes
   * Supports: optional date range filtering
   */
  getOrderAnalytics(startDate?: string, endDate?: string): Observable<OrderAnalyticsDto> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.api.get<OrderAnalyticsDto>('Orders/parent/analytics', params);
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Get orders for current month
   */
  getCurrentMonthOrders(): Observable<PagedOrderSummaryDto> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.getPagedOrderSummary({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    });
  }

  /**
   * Get orders for current year
   */
  getCurrentYearOrders(): Observable<PagedOrderSummaryDto> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);

    return this.getPagedOrderSummary({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    });
  }

  /**
   * Get orders for specific student
   */
  getStudentOrders(studentId: number, page: number = 1, pageSize: number = 10): Observable<PagedOrderSummaryDto> {
    return this.getPagedOrderSummary({
      studentId,
      page,
      pageSize
    });
  }

  /**
   * Get only paid orders
   */
  getPaidOrders(page: number = 1, pageSize: number = 10): Observable<PagedOrderSummaryDto> {
    return this.getPagedOrderSummary({
      status: 'Paid',
      page,
      pageSize
    });
  }

  /**
   * Get analytics for current year
   */
  getCurrentYearAnalytics(): Observable<OrderAnalyticsDto> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);

    return this.getOrderAnalytics(
      firstDay.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );
  }

  /**
   * Get analytics for date range
   */
  getDateRangeAnalytics(startDate: Date, endDate: Date): Observable<OrderAnalyticsDto> {
    return this.getOrderAnalytics(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  }
}
