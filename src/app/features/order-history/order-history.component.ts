/**
 * Order History Component
 * Displays parent's order history with pagination and filters
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, OrderFilterParams, PagedOrderSummaryDto, OrderSummaryItem } from '../../core/services/order.service';
import { UserService, ChildDto } from '../../core/services/user.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.scss'
})
export class OrderHistoryComponent implements OnInit {
  private orderService = inject(OrderService);
  private userService = inject(UserService);

  // ✅ Expose Math to template
  protected readonly Math = Math;

  // Signals
  orders = signal<OrderSummaryItem[]>([]);
  children = signal<ChildDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);
  totalOrders = signal(0);
  hasPreviousPage = signal(false);
  hasNextPage = signal(false);

  // Filters
  filters: OrderFilterParams = {
    page: 1,
    pageSize: 10,
    startDate: undefined,
    endDate: undefined,
    status: null,
    studentId: null
  };

  // Filter display values
  startDateInput = '';
  endDateInput = '';
  selectedStatus: '' | 'Paid' | 'Pending' | 'Failed' = '';
  selectedStudentId: number | null = null;

  pageSizeOptions = [10, 20, 50];

  ngOnInit(): void {
    this.loadChildren();
    this.loadOrders();
  }

  /**
   * Load parent's children for filtering
   */
  private loadChildren(): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const parentId = Number(payload.nameid);

      this.userService.getChildren(parentId).pipe(
        catchError(() => of([]))
      ).subscribe(children => {
        this.children.set(children);
      });
    } catch (error) {
      console.error('Error loading children:', error);
    }
  }

  /**
   * Load orders with current filters
   */
  loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    this.orderService.getPagedOrderSummary(this.filters).pipe(
      catchError(error => {
        console.error('Error loading orders:', error);
        this.error.set('Failed to load orders. Please try again.');
        return of({
          orders: [],
          totalSpent: 0,
          totalOrderCount: 0,
          lastOrderDate: null,
          currentPage: 1,
          pageSize: 10,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false
        });
      })
    ).subscribe(response => {
      this.orders.set(response.orders);
      this.currentPage.set(response.currentPage);
      this.pageSize.set(response.pageSize);
      this.totalPages.set(response.totalPages);
      this.totalOrders.set(response.totalOrderCount);
      this.hasPreviousPage.set(response.hasPreviousPage);
      this.hasNextPage.set(response.hasNextPage);
      this.loading.set(false);
    });
  }

  /**
   * Apply filters and reload orders
   */
  applyFilters(): void {
    this.filters.page = 1;
    this.filters.startDate = this.startDateInput || undefined;
    this.filters.endDate = this.endDateInput || undefined;
    this.filters.status = this.selectedStatus || null;
    this.filters.studentId = this.selectedStudentId;
    this.loadOrders();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.startDateInput = '';
    this.endDateInput = '';
    this.selectedStatus = '';
    this.selectedStudentId = null;
    this.filters = {
      page: 1,
      pageSize: this.pageSize(),
      startDate: undefined,
      endDate: undefined,
      status: null,
      studentId: null
    };
    this.loadOrders();
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.hasNextPage()) {
      this.filters.page = this.currentPage() + 1;
      this.loadOrders();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.filters.page = this.currentPage() - 1;
      this.loadOrders();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.filters.page = page;
      this.loadOrders();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Change page size
   */
  changePageSize(newSize: number): void {
    this.filters.pageSize = newSize;
    this.filters.page = 1;
    this.loadOrders();
  }

  /**
   * Get status badge color
   */
  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Paid': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Failed': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      }
    }

    return pages;
  }

  /**
   * View order details
   */
  viewOrderDetails(orderId: number): void {
    // Navigate to order details page (to be implemented)
    console.log('View order:', orderId);
  }

  /**
   * Download receipt
   */
  downloadReceipt(orderId: number): void {
    // Implement receipt download (to be implemented)
    console.log('Download receipt for order:', orderId);
  }
}
