import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { RouterLink } from '@angular/router';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

type Interval = 'month' | 'year';
type PlanStatus = 'Active' | 'Archived';
type SubStatus = 'Active' | 'Past Due' | 'Canceled' | 'Trialing';
type PaymentStatus = 'Paid' | 'Refunded' | 'Failed' | 'Pending';
type CouponStatus = 'Active' | 'Expired' | 'Scheduled';

interface Plan {
  id?: number;
  name: string;
  description: string;
  planType: number;
  price: number;
  isActive: boolean;
  subjectId: number;
  termId: number;
  yearId: number;
  interval?: Interval;
  trialDays?: number;
  status?: PlanStatus;
  features?: string[];
}

interface Order {
  id: number;
  userId: number;
  userName?: string;
  planId: number;
  planName?: string;
  amount: number;
  status: string;
  stripeSessionId?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface Payment {
  id: number;
  orderId: number;
  invoiceNo: string;
  userId: number;
  userName?: string;
  amount: number;
  method: 'Card' | 'Bank Transfer' | 'Cash';
  date: string | Date;
  status: PaymentStatus;
  txnId?: string;
}

interface Coupon {
  id: number;
  code: string;
  type: 'Percent' | 'Fixed';
  value: number;
  maxUses?: number;
  validFrom: string | Date;
  validTo: string | Date;
  status: CouponStatus;
}

interface UserMini {
  id: number;
  name: string;
  email: string;
}

interface ApiResponse<T> {
  data: T[];
  success: boolean;
  message?: string;
}

@Component({
  selector: 'app-subscription-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    RouterModule
  ],
  templateUrl: './subscriptions-admin.html',
  styleUrls: ['./subscriptions-admin.scss']
})
export class SubscriptionManagementComponent implements OnInit {
  currencyCode = 'USD';
  userName: string = 'Admin';
  sidebarCollapsed = false;
  profileHovered = signal(false);
  currentYear = new Date().getFullYear();

  // API base URL
  private apiBaseUrl = environment.apiBaseUrl;

  // Tabs
  activeTab: 'plans'|'subs'|'payments'|'coupons' = 'plans';

  // Data arrays
  plans: Plan[] = [];
  users: UserMini[] = [];
  orders: Order[] = [];
  payments: Payment[] = [];
  coupons: Coupon[] = [];

  // Stats
  stats = {
    plans: 0,
    activeSubs: 0,
    invoices30d: 0,
    revenue30d: 0
  };

  // Filters / search
  filters = {
    planStatus: '' as '' | PlanStatus,
    interval: '' as '' | Interval,
    subStatus: '' as '' | SubStatus,
    planId: null as number | null,
    paymentStatus: '' as '' | PaymentStatus,
    method: '' as '' | 'Card' | 'Bank Transfer' | 'Cash',
    couponStatus: '' as '' | CouponStatus,
  };

  search = { plans: '', subs: '', payments: '', coupons: '' };

  // Paging
  pageSize = 10;
  planPage = 1;
  subPage = 1;
  paymentPage = 1;
  couponPage = 1;

  // Derived (filtered + paged)
  filtered = {
    plans: [] as Plan[],
    orders: [] as Order[],
    payments: [] as Payment[],
    coupons: [] as Coupon[]
  };

  paged = {
    plans: [] as Plan[],
    orders: [] as Order[],
    payments: [] as Payment[],
    coupons: [] as Coupon[]
  };

  private toastService = inject(ToastService);

  constructor(
    public authService: AuthService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.loadAllData();
  }

  // Data loading methods
  private loadAllData() {
    this.loadPlans();
    this.loadOrders();
    // For demo purposes, we'll create mock payments and coupons
    // In real app, you'd have endpoints for these
    // this.loadMockPayments();
    // this.loadMockCoupons();
    // this.loadMockUsers();
  }

  private loadPlans() {
    this.http.get<Plan[]>(`${this.apiBaseUrl}/SubscriptionPlans`)
      .subscribe({
        next: (plans) => {
          this.plans = plans.map(plan => ({
            ...plan,
            interval: 'month' as Interval, // Default, adjust based on your data
            status: plan.isActive ? 'Active' as PlanStatus : 'Archived' as PlanStatus,
            trialDays: 0 // Default value
          }));
          this.updateStats();
          this.onFilterChange();
        },
        error: (error) => {
          console.error('Error loading plans:', error);
          // Fallback to mock data if API fails
          this.loadMockPlans();
        }
      });
  }

  private loadOrders() {
    this.http.get<Order[]>(`${this.apiBaseUrl}/Orders`)
      .subscribe({
        next: (orders) => {
          this.orders = orders.map(order => ({
            ...order,
            status: this.mapOrderStatus(order.status),
            startDate: order.createdAt,
            renewalDate: new Date(new Date(order.createdAt).setFullYear(new Date(order.createdAt).getFullYear() + 1))
          }));
          this.updateStats();
          this.onFilterChange();
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          // Fallback to mock data if API fails
          this.loadMockOrders();
        }
      });
  }

  private mapOrderStatus(status: string): SubStatus {
    const statusMap: { [key: string]: SubStatus } = {
      'completed': 'Active',
      'active': 'Active',
      'past_due': 'Past Due',
      'canceled': 'Canceled',
      'trialing': 'Trialing'
    };
    return statusMap[status.toLowerCase()] || 'Active';
  }

  // Mock data fallbacks (remove when real endpoints are available)
  private loadMockPlans() {
    this.plans = [
      {
        id: 1,
        name: 'Basic',
        description: 'Basic subscription plan',
        price: 9.99,
        planType: 1,
        isActive: true,
        subjectId: 1,
        termId: 1,
        yearId: 2025,
        interval: 'month',
        trialDays: 7,
        status: 'Active'
      },
      {
        id: 2,
        name: 'Pro',
        description: 'Professional subscription plan',
        price: 99,
        planType: 2,
        isActive: true,
        subjectId: 1,
        termId: 1,
        yearId: 2025,
        interval: 'year',
        status: 'Active'
      }
    ];
    this.updateStats();
    this.onFilterChange();
  }

  private loadMockOrders() {
    this.orders = [
      {
        id: 11,
        userId: 1,
        userName: 'Sara Ali',
        planId: 2,
        planName: 'Pro',
        amount: 99,
        status: 'Active',
        stripeSessionId: 'cs_test_123',
        createdAt: new Date('2024-08-01'),
        updatedAt: new Date('2024-08-01')
      },
      {
        id: 12,
        userId: 2,
        userName: 'Omar Khan',
        planId: 1,
        planName: 'Basic',
        amount: 9.99,
        status: 'Past Due',
        stripeSessionId: 'cs_test_456',
        createdAt: new Date('2025-05-10'),
        updatedAt: new Date('2025-05-10')
      }
    ];
    this.updateStats();
    this.onFilterChange();
  }

  private loadMockPayments() {
    this.payments = [
      {
        id: 101,
        orderId: 11,
        invoiceNo: 'INV-1001',
        userId: 1,
        userName: 'Sara Ali',
        amount: 99,
        method: 'Card',
        date: new Date(),
        status: 'Paid',
        txnId: 'ch_abc123'
      },
      {
        id: 102,
        orderId: 12,
        invoiceNo: 'INV-1002',
        userId: 2,
        userName: 'Omar Khan',
        amount: 9.99,
        method: 'Card',
        date: new Date(),
        status: 'Failed',
        txnId: 'ch_def456'
      }
    ];
    this.updateStats();
    this.onFilterChange();
  }

  private loadMockCoupons() {
    this.coupons = [
      {
        id: 201,
        code: 'SPRING25',
        type: 'Percent',
        value: 25,
        validFrom: new Date('2025-03-01'),
        validTo: new Date('2025-03-31'),
        status: 'Expired'
      },
      {
        id: 202,
        code: 'ANNUAL50',
        type: 'Fixed',
        value: 50,
        validFrom: new Date('2025-01-01'),
        validTo: new Date('2025-12-31'),
        status: 'Active',
        maxUses: 200
      }
    ];
    this.updateStats();
    this.onFilterChange();
  }

  private loadMockUsers() {
    this.users = [
      { id: 1, name: 'Sara Ali', email: 'sara@example.com' },
      { id: 2, name: 'Omar Khan', email: 'omar@example.com' },
      { id: 3, name: 'John Smith', email: 'john@example.com' }
    ];
  }

  private updateStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.stats = {
      plans: this.plans.length,
      activeSubs: this.orders.filter(order => order.status === 'Active' || order.status === 'Trialing').length,
      invoices30d: this.payments.filter(p => new Date(p.date) >= thirtyDaysAgo).length,
      revenue30d: this.payments
        .filter(p => p.status === 'Paid' && new Date(p.date) >= thirtyDaysAgo)
        .reduce((a, b) => a + b.amount, 0)
    };
  }

  // UI Interaction Methods
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  setActiveTab(t: 'plans' | 'subs' | 'payments' | 'coupons') {
    this.activeTab = t;
    this.onFilterChange();
  }

  // Filter + pagination recompute
  onFilterChange() {
    // Plans
    this.filtered.plans = this.plans.filter(p => {
      const s = this.search.plans.toLowerCase();
      const okText = !s || p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s);
      const okStatus = !this.filters.planStatus || p.status === this.filters.planStatus;
      const okInterval = !this.filters.interval || p.interval === this.filters.interval;
      return okText && okStatus && okInterval;
    });

    // Orders (Subscriptions)
    this.filtered.orders = this.orders.filter(o => {
      const q = this.search.subs.toLowerCase();
      const planName = this.getPlanName(o.planId).toLowerCase();
      const userName = (o.userName || '').toLowerCase();
      const okText = !q || planName.includes(q) || userName.includes(q);
      const okStatus = !this.filters.subStatus || o.status === this.filters.subStatus;
      const okPlan = !this.filters.planId || o.planId === this.filters.planId;
      return okText && okStatus && okPlan;
    });

    // Payments
    this.filtered.payments = this.payments.filter(p => {
      const q = this.search.payments.toLowerCase();
      const okText = !q ||
        p.invoiceNo.toLowerCase().includes(q) ||
        (p.userName || '').toLowerCase().includes(q) ||
        (p.txnId || '').toLowerCase().includes(q);
      const okStatus = !this.filters.paymentStatus || p.status === this.filters.paymentStatus;
      const okMethod = !this.filters.method || p.method === this.filters.method;
      return okText && okStatus && okMethod;
    });

    // Coupons
    this.filtered.coupons = this.coupons.filter(c => {
      const q = this.search.coupons.toLowerCase();
      const okText = !q || c.code.toLowerCase().includes(q);
      const okStatus = !this.filters.couponStatus || c.status === this.filters.couponStatus;
      return okText && okStatus;
    });

    // Reset pages if current page overflowed
    this.planPage = Math.min(this.planPage, this.planTotalPages);
    this.subPage = Math.min(this.subPage, this.subTotalPages);
    this.paymentPage = Math.min(this.paymentPage, this.paymentTotalPages);
    this.couponPage = Math.min(this.couponPage, this.couponTotalPages);

    this.sliceData();
  }

  sliceData() {
    const slice = (arr: any[], page: number) => arr.slice((page - 1) * this.pageSize, page * this.pageSize);
    this.paged.plans = slice(this.filtered.plans, this.planPage);
    this.paged.orders = slice(this.filtered.orders, this.subPage);
    this.paged.payments = slice(this.filtered.payments, this.paymentPage);
    this.paged.coupons = slice(this.filtered.coupons, this.couponPage);
  }

  // API Operations
  createPlan(planData: Plan) {
    return this.http.post<Plan>(`${this.apiBaseUrl}/SubscriptionPlans`, planData)
      .subscribe({
        next: (newPlan) => {
          this.plans.push({
            ...newPlan,
            interval: 'month',
            status: newPlan.isActive ? 'Active' : 'Archived',
            trialDays: 0
          });
          this.updateStats();
          this.onFilterChange();
          this.closeForm();
          this.toastService.showSuccess('Plan created successfully!');
        },
        error: (error) => {
          console.error('Error creating plan:', error);
          this.toastService.showError('Error creating plan: ' + (error.error?.message || error.message));
        }
      });
  }

  updatePlan(planId: number, planData: Plan) {
    // Note: You'll need to implement a PUT endpoint for updating plans
    // For now, we'll simulate an update by replacing the plan in the array
    const index = this.plans.findIndex(p => p.id === planId);
    if (index > -1) {
      this.plans[index] = { ...planData, id: planId };
      this.updateStats();
      this.onFilterChange();
      this.closeForm();
      this.toastService.showSuccess('Plan updated successfully!');
    }
  }

  deactivatePlan(planId: number) {
    return this.http.post(`${this.apiBaseUrl}/SubscriptionPlans/deactivate-plan/${planId}`, {})
      .subscribe({
        next: () => {
          const plan = this.plans.find(p => p.id === planId);
          if (plan) {
            plan.isActive = false;
            plan.status = 'Archived';
          }
          this.updateStats();
          this.onFilterChange();
          this.toastService.showSuccess('Plan deactivated successfully!');
        },
        error: (error) => {
          console.error('Error deactivating plan:', error);
          this.toastService.showError('Error deactivating plan: ' + (error.error?.message || error.message));
        }
      });
  }

  deletePlan(planId: number) {
    // Note: You'll need to implement a DELETE endpoint for plans
    // For now, we'll simulate deletion
    this.plans = this.plans.filter(p => p.id !== planId);
    this.updateStats();
    this.onFilterChange();
    this.toastService.showSuccess('Plan deleted successfully!');
  }

  getOrderDetails(orderId: number) {
    return this.http.get<Order>(`${this.apiBaseUrl}/Orders/${orderId}`)
      .subscribe({
        next: (order) => {
          console.log('Order details:', order);
        },
        error: (error) => {
          console.error('Error fetching order details:', error);
        }
      });
  }

  // Helper methods
  getPlanName(id: number) {
    return this.plans.find(x => x.id === id)?.name || '-';
  }

  getUserName(id: number) {
    return this.users.find(x => x.id === id)?.name || '-';
  }

  // Pagination getters
  get pStart() { return this.rangeStart(this.planPage, this.filtered.plans.length); }
  get pEnd() { return this.rangeEnd(this.planPage, this.filtered.plans.length); }
  get sStart() { return this.rangeStart(this.subPage, this.filtered.orders.length); }
  get sEnd() { return this.rangeEnd(this.subPage, this.filtered.orders.length); }
  get payStart() { return this.rangeStart(this.paymentPage, this.filtered.payments.length); }
  get payEnd() { return this.rangeEnd(this.paymentPage, this.filtered.payments.length); }
  get cStart() { return this.rangeStart(this.couponPage, this.filtered.coupons.length); }
  get cEnd() { return this.rangeEnd(this.couponPage, this.filtered.coupons.length); }

  get planTotalPages() { return Math.max(1, Math.ceil(this.filtered.plans.length / this.pageSize)); }
  get subTotalPages() { return Math.max(1, Math.ceil(this.filtered.orders.length / this.pageSize)); }
  get paymentTotalPages() { return Math.max(1, Math.ceil(this.filtered.payments.length / this.pageSize)); }
  get couponTotalPages() { return Math.max(1, Math.ceil(this.filtered.coupons.length / this.pageSize)); }

  rangeStart(page: number, total: number) { return total ? (page - 1) * this.pageSize + 1 : 0; }
  rangeEnd(page: number, total: number) { return Math.min(page * this.pageSize, total); }

  goPlanPage(p: number) { this.planPage = Math.min(Math.max(1, p), this.planTotalPages); this.sliceData(); }
  goSubPage(p: number) { this.subPage = Math.min(Math.max(1, p), this.subTotalPages); this.sliceData(); }
  goPaymentPage(p: number) { this.paymentPage = Math.min(Math.max(1, p), this.paymentTotalPages); this.sliceData(); }
  goCouponPage(p: number) { this.couponPage = Math.min(Math.max(1, p), this.couponTotalPages); this.sliceData(); }

  // Modal state
  isFormOpen = false;
  formMode: 'add' | 'edit' = 'add';
  entityType: 'plan' | 'subscription' | 'payment' | 'coupon' | null = null;
  entityTitle = '';
  form: any = {};

  openAdd(type: any) {
    this.formMode = 'add';
    this.entityType = type;
    this.entityTitle = this.entityTypeTitle(type);
    this.form = {};

    if (type === 'plan') {
      this.form = {
        name: '',
        description: '',
        planType: 1,
        price: 0,
        isActive: true,
        subjectId: 1,
        termId: 1,
        yearId: this.currentYear
      };
    }
    if (type === 'subscription') {
      this.form = {
        status: 'Active',
        startDate: this.today(),
        renewalDate: this.today()
      };
    }
    if (type === 'payment') {
      this.form = {
        status: 'Paid',
        amount: 0,
        date: this.nowLocal(),
        method: 'Card'
      };
    }
    if (type === 'coupon') {
      this.form = {
        type: 'Percent',
        value: 10,
        status: 'Active',
        validFrom: this.today(),
        validTo: this.today()
      };
    }
    this.isFormOpen = true;
  }

  openEdit(type: any, row: any) {
    this.formMode = 'edit';
    this.entityType = type;
    this.entityTitle = this.entityTypeTitle(type);
    this.form = { ...row };

    if (type === 'plan' && Array.isArray(row.features)) {
      this.form.features = row.features.join(', ');
    }
    this.isFormOpen = true;
  }

  closeForm() {
    this.isFormOpen = false;
  }

  entityTypeTitle(type: any) {
    if (type === 'plan') return 'Plan';
    if (type === 'subscription') return 'Subscription';
    if (type === 'payment') return 'Payment';
    if (type === 'coupon') return 'Coupon';
    return '';
  }

  submitForm() {
    if (!this.entityType) return;

    if (this.entityType === 'plan') {
      const payload: Plan = {
        name: this.form.name,
        description: this.form.description || '',
        planType: +this.form.planType,
        price: +this.form.price,
        isActive: this.form.isActive,
        subjectId: +this.form.subjectId,
        termId: +this.form.termId,
        yearId: +this.form.yearId
      };

      if (this.formMode === 'add') {
        this.createPlan(payload);
      } else {
        this.updatePlan(this.form.id, payload);
      }
      return;
    }

    // For other entity types, use mock operations (replace with real API calls when available)
    if (this.entityType === 'subscription') {
      const payload: Order = {
        id: this.form.id ?? this.newId(this.orders),
        userId: +this.form.userId,
        planId: +this.form.planId,
        amount: +this.form.amount || 0,
        status: this.form.status,
        createdAt: this.form.startDate,
        updatedAt: new Date()
      };
      this.upsert(this.orders, payload);
      this.isFormOpen = false;
      this.onFilterChange();
    }

    if (this.entityType === 'payment') {
      const payload: Payment = {
        id: this.form.id ?? this.newId(this.payments),
        orderId: +this.form.orderId || 0,
        invoiceNo: this.form.invoiceNo,
        userId: +this.form.userId,
        userName: this.getUserName(+this.form.userId),
        amount: +this.form.amount,
        method: this.form.method,
        date: this.form.date,
        status: this.form.status,
        txnId: this.form.txnId
      };
      this.upsert(this.payments, payload);
      this.isFormOpen = false;
      this.onFilterChange();
    }

    if (this.entityType === 'coupon') {
      const payload: Coupon = {
        id: this.form.id ?? this.newId(this.coupons),
        code: this.form.code,
        type: this.form.type,
        value: +this.form.value,
        maxUses: this.form.maxUses ? +this.form.maxUses : undefined,
        validFrom: this.form.validFrom,
        validTo: this.form.validTo,
        status: this.form.status
      };
      this.upsert(this.coupons, payload);
      this.isFormOpen = false;
      this.onFilterChange();
    }
  }

  confirmDelete(type: any, row: any) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    if (type === 'plan') {
      this.deletePlan(row.id);
    } else {
      // For other types, use local removal (replace with API calls when available)
      if (type === 'subscription') this.orders = this.orders.filter(x => x.id !== row.id);
      if (type === 'payment') this.payments = this.payments.filter(x => x.id !== row.id);
      if (type === 'coupon') this.coupons = this.coupons.filter(x => x.id !== row.id);
      this.onFilterChange();
      this.toastService.showSuccess(`${this.entityTypeTitle(type)} deleted successfully!`);
    }
  }

  // Preview functionality
  previewOpen = false;
  preview: any = {};

  openPlanPreview(p: Plan) {
    this.previewOpen = true;
    this.preview = {
      type: 'plan',
      title: p.name,
      description: p.description,
      planType: p.planType,
      price: p.price,
      isActive: p.isActive,
      subjectId: p.subjectId,
      termId: p.termId,
      yearId: p.yearId,
      interval: p.interval,
      trialDays: p.trialDays,
      features: p.features || []
    };
  }

  openPaymentPreview(p: Payment) {
    this.previewOpen = true;
    this.preview = {
      type: 'payment',
      title: `Invoice ${p.invoiceNo}`,
      ...p
    };
  }

  openSubPreview(o: Order) {
    this.previewOpen = true;
    this.preview = {
      type: 'subscription',
      title: `Order #${o.id}`,
      userName: o.userName,
      planName: this.getPlanName(o.planId),
      amount: o.amount,
      status: o.status,
      startDate: o.createdAt,
      renewalDate: o.updatedAt
    };
  }

  closePreview() {
    this.previewOpen = false;
  }

  // Utility methods
  newId<T extends { id: number }>(arr: T[]) {
    return (arr.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
  }

  upsert<T extends { id: number }>(arr: T[], item: T) {
    const i = arr.findIndex(x => x.id === item.id);
    if (i > -1) arr[i] = item;
    else arr.unshift(item);
  }

  today() {
    return new Date().toISOString().substring(0, 10);
  }

  nowLocal() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // User menu
  isOpen = false;

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

  handleLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }

  navigateToProfile(): void {
    window.location.href = '/profile';
  }
}
