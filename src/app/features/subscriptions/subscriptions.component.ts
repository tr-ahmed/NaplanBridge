import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

interface SubscriptionPlan {
  planId?: number; // API returns planId
  id?: number; // Fallback
  name: string;
  description: string;
  coverageDescription?: string;
  price: number;
  planType: number; // 1=SingleTerm, 2=MultiTerm, 3=FullYear, 4=SubjectAnnual
  durationInDays?: number;
  subjectId?: number;
  subjectName?: string;
  termId?: number;
  termNumber?: number;
  yearId?: number;
  isActive: boolean;
  createdAt?: string;
}

interface Order {
  id: number;
  orderId: string;
  userId: number;
  userName?: string;
  studentId?: number;
  studentName?: string;
  totalAmount: number;
  status: string;
  orderDate: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: number;
  subscriptionPlanId: number;
  planName: string;
  price: number;
  quantity: number;
}

interface OrderSummary {
  totalOrders: number;
  totalSpending: number;
  ordersByStatus: {
    pending: number;
    paid: number;
    failed: number;
  };
  recentOrders: Order[];
}

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  ordersByMonth: { month: string; count: number; revenue: number }[];
  topPlans: { planName: string; count: number; revenue: number }[];
}

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss']
})
export class SubscriptionsComponent implements OnInit {
  // UI State
  sidebarCollapsed = false;
  activeTab = signal<'plans' | 'orders' | 'analytics'>('plans');
  loading = signal(false);
  Math = Math;
  
  // Data
  subscriptionPlans: SubscriptionPlan[] = [];
  orders: Order[] = [];
  analytics: Analytics | null = null;
  orderSummary: OrderSummary | null = null;
  
  // Filters
  searchTerm = '';
  statusFilter = '';
  dateRange = {
    startDate: '',
    endDate: ''
  };
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  
  // Pagination for Plans
  plansCurrentPage = 1;
  plansPageSize = 10;
  
  // Modal State
  showPlanModal = false;
  isEditMode = false;
  currentPlan: Partial<SubscriptionPlan> = {};
  
  // Statistics
  stats = {
    totalPlans: 0,
    activePlans: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    paidOrders: 0
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSubscriptionPlans();
    this.loadOrders();
    this.loadAnalytics();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  changeTab(tab: 'plans' | 'orders' | 'analytics'): void {
    this.activeTab.set(tab);
  }

  isPlanActive(plan: any): boolean {
    // Check both camelCase and PascalCase property names
    // If isActive property doesn't exist, assume plan is active (default true)
    if (plan?.isActive !== undefined) return plan.isActive === true;
    if (plan?.IsActive !== undefined) return plan.IsActive === true;
    return true; // Default to active if property doesn't exist
  }

  // ============================================
  // Subscription Plans CRUD
  // ============================================
  
  loadSubscriptionPlans(): void {
    this.loading.set(true);
    this.http.get<SubscriptionPlan[]>(`${environment.apiBaseUrl}/SubscriptionPlans`)
      .subscribe({
        next: (data) => {
          console.log('API Response - Subscription Plans:', data);
          if (data && data.length > 0) {
            console.log('First plan object:', data[0]);
            console.log('First plan properties:', Object.keys(data[0]));
          }
          this.subscriptionPlans = data;
          this.stats.totalPlans = data.length;
          // Since API doesn't return isActive property, consider all plans as active
          this.stats.activePlans = data.length;
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading subscription plans:', error);
          Swal.fire('Error', 'Failed to load subscription plans', 'error');
          this.loading.set(false);
        }
      });
  }

  openAddPlanModal(): void {
    this.isEditMode = false;
    this.currentPlan = {
      name: '',
      description: '',
      price: 0,
      planType: 1, // SingleTerm by default
      isActive: true,
      subjectId: 0,
      termId: 0,
      yearId: 0
    };
    this.showPlanModal = true;
  }

  openEditPlanModal(plan: SubscriptionPlan): void {
    this.isEditMode = true;
    this.currentPlan = { ...plan };
    this.showPlanModal = true;
  }

  closePlanModal(): void {
    this.showPlanModal = false;
    this.currentPlan = {};
  }

  savePlan(): void {
    if (!this.currentPlan.name || !this.currentPlan.description || this.currentPlan.price === undefined || this.currentPlan.planType === undefined) {
      Swal.fire('Validation Error', 'Please fill all required fields (Name, Description, Price, Plan Type)', 'warning');
      return;
    }

    this.loading.set(true);
    const planId = this.currentPlan.planId || this.currentPlan.id;
    
    // Prepare the data according to API schema
    const planData = {
      name: this.currentPlan.name,
      description: this.currentPlan.description,
      planType: this.currentPlan.planType,
      price: this.currentPlan.price,
      isActive: this.currentPlan.isActive ?? true,
      subjectId: this.currentPlan.subjectId || 0,
      termId: this.currentPlan.termId || 0,
      yearId: this.currentPlan.yearId || 0
    };
    
    if (this.isEditMode && planId) {
      // Update existing plan
      this.http.put(`${environment.apiBaseUrl}/SubscriptionPlans/${planId}`, planData)
        .subscribe({
          next: () => {
            // Update the plan in local array without reloading
            const index = this.subscriptionPlans.findIndex(p => (p.planId || p.id) === planId);
            if (index !== -1) {
              this.subscriptionPlans[index] = { ...this.currentPlan, planId } as SubscriptionPlan;
            }
            this.loading.set(false);
            this.closePlanModal();
            Swal.fire('Success', 'Subscription plan updated successfully', 'success');
          },
          error: (error) => {
            console.error('Error updating plan:', error);
            this.loading.set(false);
            Swal.fire('Error', 'Failed to update subscription plan', 'error');
          }
        });
    } else {
      // Create new plan
      this.http.post(`${environment.apiBaseUrl}/SubscriptionPlans`, planData)
        .subscribe({
          next: (newPlan: any) => {
            // Add new plan to local array
            this.subscriptionPlans.push(newPlan);
            this.stats.totalPlans = this.subscriptionPlans.length;
            this.stats.activePlans = this.subscriptionPlans.length;
            this.loading.set(false);
            this.closePlanModal();
            Swal.fire('Success', 'Subscription plan created successfully', 'success');
          },
          error: (error) => {
            console.error('Error creating plan:', error);
            this.loading.set(false);
            Swal.fire('Error', 'Failed to create subscription plan', 'error');
          }
        });
    }
  }

  deactivatePlan(plan: any): void {
    console.log('deactivatePlan called with plan object:', plan);
    
    // Try different possible ID property names from the API
    const planId = plan?.planId || plan?.id || plan?.subscriptionPlanId;
    
    console.log('Extracted plan ID:', planId);
    
    if (!planId) {
      console.error('Plan ID is missing. Plan object:', plan);
      Swal.fire('Error', 'Plan ID is missing', 'error');
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to deactivate this subscription plan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, deactivate it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.post(`${environment.apiBaseUrl}/SubscriptionPlans/deactivate-plan/${planId}`, {})
          .subscribe({
            next: () => {
              Swal.fire('Deactivated!', 'The subscription plan has been deactivated.', 'success');
              this.loadSubscriptionPlans();
            },
            error: (error) => {
              console.error('Error deactivating plan:', error);
              Swal.fire('Error', 'Failed to deactivate subscription plan', 'error');
            }
          });
      }
    });
  }

  // ============================================
  // Orders Management
  // ============================================
  
  loadOrders(): void {
    this.loading.set(true);
    this.http.get<Order[]>(`${environment.apiBaseUrl}/Orders`)
      .subscribe({
        next: (data) => {
          this.orders = data;
          this.calculateOrderStats(data);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          Swal.fire('Error', 'Failed to load orders', 'error');
          this.loading.set(false);
        }
      });
  }

  calculateOrderStats(orders: Order[]): void {
    this.stats.totalOrders = orders.length;
    this.stats.totalRevenue = orders
      .filter(o => o.status === 'Paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    this.stats.pendingOrders = orders.filter(o => o.status === 'Pending').length;
    this.stats.paidOrders = orders.filter(o => o.status === 'Paid').length;
  }

  viewOrderDetails(orderId: number): void {
    this.http.get<Order>(`${environment.apiBaseUrl}/Orders/${orderId}`)
      .subscribe({
        next: (order) => {
          const itemsHtml = order.items?.map(item => `
            <div class="flex justify-between py-2 border-b">
              <span>${item.planName}</span>
              <span class="font-semibold">$${item.price}</span>
            </div>
          `).join('') || '';

          Swal.fire({
            title: `Order #${order.orderId}`,
            html: `
              <div class="text-left">
                <p><strong>Status:</strong> <span class="badge bg-${order.status === 'Paid' ? 'success' : order.status === 'Pending' ? 'warning' : 'danger'}">${order.status}</span></p>
                <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
                <p><strong>Total:</strong> $${order.totalAmount}</p>
                <div class="mt-3">
                  <strong>Items:</strong>
                  ${itemsHtml}
                </div>
              </div>
            `,
            width: 600
          });
        },
        error: (error) => {
          console.error('Error loading order details:', error);
          Swal.fire('Error', 'Failed to load order details', 'error');
        }
      });
  }

  downloadInvoice(orderId: number): void {
    this.http.get(`${environment.apiBaseUrl}/Orders/${orderId}/invoice`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice-${orderId}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error downloading invoice:', error);
          Swal.fire('Error', 'Failed to download invoice', 'error');
        }
      });
  }

  // ============================================
  // Analytics
  // ============================================
  
  loadAnalytics(): void {
    const params: any = {};
    if (this.dateRange.startDate) params.startDate = this.dateRange.startDate;
    if (this.dateRange.endDate) params.endDate = this.dateRange.endDate;

    this.http.get<Analytics>(`${environment.apiBaseUrl}/Orders/parent/analytics`, { params })
      .subscribe({
        next: (data) => {
          this.analytics = data;
        },
        error: (error) => {
          console.error('Error loading analytics:', error);
        }
      });
  }

  applyDateFilter(): void {
    this.loadAnalytics();
    this.loadOrders();
  }

  clearDateFilter(): void {
    this.dateRange = { startDate: '', endDate: '' };
    this.loadAnalytics();
    this.loadOrders();
  }

  // ============================================
  // Filters & Search
  // ============================================
  
  get filteredPlans(): SubscriptionPlan[] {
    return this.subscriptionPlans.filter(plan => {
      const matchesSearch = !this.searchTerm || 
        plan.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }

  get pagedPlans(): SubscriptionPlan[] {
    const start = (this.plansCurrentPage - 1) * this.plansPageSize;
    const end = start + this.plansPageSize;
    return this.filteredPlans.slice(start, end);
  }

  goToPlansPage(page: number): void {
    if (page >= 1 && page <= Math.ceil(this.filteredPlans.length / this.plansPageSize)) {
      this.plansCurrentPage = page;
    }
  }

  get filteredOrders(): Order[] {
    return this.orders.filter(order => {
      const matchesSearch = !this.searchTerm || 
        order.orderId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.userName?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || order.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  get pagedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredOrders.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= Math.ceil(this.filteredOrders.length / this.pageSize)) {
      this.currentPage = page;
    }
  }

  // Reset pagination when search/filter changes
  onSearchChange(): void {
    this.plansCurrentPage = 1;
    this.currentPage = 1;
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
  }
}
