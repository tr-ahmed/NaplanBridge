import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { SubscriptionPlansService } from '../../core/services/subscription-plans.service';
import {
  SubscriptionPlan,
  CreateSubscriptionPlanDto
} from '../../models/subscription.models';
import {
  PlanType,
  OrderStatus,
  SubscriptionStatus,
  getPlanTypeLabel,
  getOrderStatusInfo
} from '../../models/enums';

// ==================== TYPE DEFINITIONS BASED ON SWAGGER API ====================
// Enums are now imported from models/enums.ts

// Subscription Plan Interface (from Swagger) - using imported SubscriptionPlan
// Extended interface with UI properties

// Order Interface (from Swagger)
interface Order {
  id: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  createdAt: string;
  userId: number;
  orderItems?: OrderItem[];
}

// Order Item Interface
interface OrderItem {
  id: number;
  unitPrice: number;
  quantity: number;
  orderId: number;
  subscriptionPlanId: number;
  studentId: number;
}

interface PlanWithStatus extends SubscriptionPlan {
  statusLabel: 'Active' | 'Inactive';
  planTypeLabel: string;
  subjectName?: string;
  termName?: string;
  yearName?: string;
}

interface OrderWithDetails extends Order {
  userName?: string;
  userEmail?: string;
  statusLabel: string;
  orderItemsCount?: number;
}

// User interface
interface UserDto {
  id: number;
  userName: string;
  email: string;
  fullName?: string;
  roles?: string[];
}

// Subject and Term interfaces
interface SubjectDto {
  id: number;
  name: string;
  description?: string;
}

interface TermDto {
  id: number;
  name: string;
}

interface YearDto {
  id: number;
  yearNumber: number;
  name?: string;
}

// Create/Update DTOs are imported from models/subscription.models.ts

// Stats interface
interface DashboardStats {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  revenue30d: number;
  revenue7d: number;
  averageOrderValue: number;
}

// Filter Options
interface FilterOptions {
  planStatus: '' | 'Active' | 'Inactive';
  planType: PlanType | null;
  orderStatus: OrderStatus | null;
  subjectId: number | null;
  termId: number | null;
  yearId: number | null;
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
}

@Component({
  selector: 'app-subscription-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './subscriptions-admin.component.html',
  styleUrls: ['./subscriptions-admin.component.scss']
})
export class SubscriptionManagementComponent implements OnInit {
  // Enums for template access
  OrderStatus = OrderStatus;
  PlanType = PlanType;

  // UI State
  currencyCode = 'USD';
  userName = 'Admin';
  sidebarCollapsed = false;
  profileHovered = signal(false);
  currentYear = new Date().getFullYear();
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // API base URL
  private apiBaseUrl = environment.apiBaseUrl;

  // Tabs
  activeTab: 'dashboard' | 'plans' | 'orders' = 'dashboard';

  // Data arrays
  plans: PlanWithStatus[] = [];
  orders: OrderWithDetails[] = [];
  users: UserDto[] = [];
  subjects: SubjectDto[] = [];
  terms: TermDto[] = [];
  years: YearDto[] = [];

  // Selected terms for MultiTerm plans
  private selectedTermIds: number[] = [];

  // Stats
  stats: DashboardStats = {
    totalPlans: 0,
    activePlans: 0,
    inactivePlans: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    revenue30d: 0,
    revenue7d: 0,
    averageOrderValue: 0
  };

  // Filters
  filters: FilterOptions = {
    planStatus: '',
    planType: null,
    orderStatus: null,
    subjectId: null,
    termId: null,
    yearId: null,
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  };

  // Paging
  pageSize = 15;
  currentPages = { plans: 1, orders: 1 };

  // Filtered data
  filtered = {
    plans: [] as PlanWithStatus[],
    orders: [] as OrderWithDetails[]
  };

  paged = {
    plans: [] as PlanWithStatus[],
    orders: [] as OrderWithDetails[]
  };

  // Modal state
  isFormOpen = false;
  formMode: 'add' | 'edit' = 'add';
  formEntity: 'plan' | 'order' = 'plan';
  formTitle = '';
  form: any = {};

  previewOpen = false;
  preview: any = {};

  isUserMenuOpen = false;

  constructor(
    public authService: AuthService,
    private http: HttpClient,
    private plansService: SubscriptionPlansService
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.loadAllData();
  }

  // ==================== INITIALIZATION ====================

  private loadCurrentUser() {
    const user = this.authService.currentUser();
    if (user && user.userName) {
      this.userName = user.userName;
    }
  }

  private loadAllData() {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      users: this.loadUsers(),
      subjects: this.loadSubjects(),
      terms: this.loadTerms(),
      years: this.loadYears(),
      plans: this.loadPlans(),
      orders: this.loadOrders()
    }).subscribe({
      next: (results) => {
        this.users = results.users || [];
        this.subjects = results.subjects || [];
        this.terms = results.terms || [];
        this.years = results.years || [];
        this.plans = results.plans || [];
        this.orders = results.orders || [];

        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.errorMessage = 'Failed to load data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // ==================== API DATA LOADING ====================

  private loadUsers() {
    return this.http.get<UserDto[]>(`${this.apiBaseUrl}/User`)
      .pipe(catchError(() => of([])));
  }

  private loadSubjects() {
    return this.http.get<SubjectDto[]>(`${this.apiBaseUrl}/Subjects?pageSize=-1`)
      .pipe(catchError(() => of([])));
  }

  private loadTerms() {
    return this.http.get<TermDto[]>(`${this.apiBaseUrl}/Terms`)
      .pipe(catchError(() => of([])));
  }

  private loadYears() {
    return this.http.get<YearDto[]>(`${this.apiBaseUrl}/Years`)
      .pipe(catchError(() => of([])));
  }

  private loadPlans() {
    return this.plansService.getAllPlans().pipe(
      map(plans => (plans || []).map(plan => this.mapPlanWithStatus(plan))),
      catchError(() => of([]))
    );
  }

  private loadOrders() {
    return this.http.get<Order[]>(`${this.apiBaseUrl}/Orders`)
      .pipe(
        map(orders => (orders || []).map(order => this.mapOrderWithDetails(order))),
        catchError(() => of([]))
      );
  }

  // ==================== DATA MAPPING ====================

  private mapPlanWithStatus(plan: SubscriptionPlan): PlanWithStatus {
    return {
      ...plan,
      statusLabel: plan.isActive ? 'Active' : 'Inactive',
      planTypeLabel: this.getPlanTypeLabel(plan.planType),
      subjectName: this.getSubjectName(plan.subjectId),
      termName: this.getTermName(plan.termId),
      yearName: this.getYearName(plan.yearId)
    };
  }

  private mapOrderWithDetails(order: Order): OrderWithDetails {
    const user = this.users.find(u => u.id === order.userId);

    return {
      ...order,
      userName: user?.fullName || user?.userName || 'Unknown User',
      userEmail: user?.email || '',
      statusLabel: this.getOrderStatusLabel(order.orderStatus),
      orderItemsCount: order.orderItems?.length || 0
    };
  }

  // ==================== STATISTICS ====================

  private calculateStats() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.stats = {
      totalPlans: this.plans.length,
      activePlans: this.plans.filter(p => p.isActive).length,
      inactivePlans: this.plans.filter(p => !p.isActive).length,
      totalOrders: this.orders.length,
      pendingOrders: this.orders.filter(o => o.orderStatus === OrderStatus.Pending).length,
      completedOrders: this.orders.filter(o => o.orderStatus === OrderStatus.Completed).length,
      cancelledOrders: this.orders.filter(o => o.orderStatus === OrderStatus.Cancelled).length,
      totalRevenue: this.orders
        .filter(o => o.orderStatus === OrderStatus.Completed)
        .reduce((sum, o) => sum + o.totalAmount, 0),
      revenue30d: this.orders
        .filter(o => o.orderStatus === OrderStatus.Completed && new Date(o.createdAt) >= thirtyDaysAgo)
        .reduce((sum, o) => sum + o.totalAmount, 0),
      revenue7d: this.orders
        .filter(o => o.orderStatus === OrderStatus.Completed && new Date(o.createdAt) >= sevenDaysAgo)
        .reduce((sum, o) => sum + o.totalAmount, 0),
      averageOrderValue: this.orders.length > 0
        ? this.orders.reduce((sum, o) => sum + o.totalAmount, 0) / this.orders.length
        : 0
    };
  }

  // ==================== FILTERING & PAGINATION ====================

  applyFilters() {
    // Filter plans
    this.filtered.plans = this.plans.filter(p => {
      if (this.filters.planStatus && p.statusLabel !== this.filters.planStatus) return false;
      if (this.filters.planType !== null && p.planType !== this.filters.planType) return false;
      if (this.filters.subjectId && p.subjectId !== this.filters.subjectId) return false;
      if (this.filters.termId && p.termId !== this.filters.termId) return false;
      if (this.filters.yearId && p.yearId !== this.filters.yearId) return false;
      if (this.filters.searchTerm) {
        const term = this.filters.searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(term) ||
               p.description.toLowerCase().includes(term);
      }
      return true;
    });

    // Filter orders
    this.filtered.orders = this.orders.filter(o => {
      if (this.filters.orderStatus !== null && o.orderStatus !== this.filters.orderStatus) return false;
      if (this.filters.dateFrom && new Date(o.createdAt) < new Date(this.filters.dateFrom)) return false;
      if (this.filters.dateTo && new Date(o.createdAt) > new Date(this.filters.dateTo)) return false;
      if (this.filters.searchTerm) {
        const term = this.filters.searchTerm.toLowerCase();
        return (o.userName?.toLowerCase().includes(term) || false) ||
               (o.userEmail?.toLowerCase().includes(term) || false);
      }
      return true;
    });

    this.updatePagination();
  }

  updatePagination() {
    this.currentPages.plans = Math.min(this.currentPages.plans, this.getTotalPages('plans'));
    this.currentPages.orders = Math.min(this.currentPages.orders, this.getTotalPages('orders'));

    this.paged.plans = this.paginate(this.filtered.plans, this.currentPages.plans);
    this.paged.orders = this.paginate(this.filtered.orders, this.currentPages.orders);
  }

  private paginate<T>(items: T[], page: number): T[] {
    const start = (page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  getTotalPages(entity: 'plans' | 'orders'): number {
    return Math.max(1, Math.ceil(this.filtered[entity].length / this.pageSize));
  }

  goToPage(entity: 'plans' | 'orders', page: number) {
    this.currentPages[entity] = Math.max(1, Math.min(page, this.getTotalPages(entity)));
    this.updatePagination();
  }

  // ==================== CRUD OPERATIONS ====================

  createPlan(planData: CreateSubscriptionPlanDto) {
    this.isLoading = true;
    this.plansService.createPlan(planData)
      .subscribe({
        next: (newPlan) => {
          this.plans.push(this.mapPlanWithStatus(newPlan));
          this.calculateStats();
          this.applyFilters();
          this.showSuccess('Plan created successfully!');
          this.closeForm();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error creating plan:', error);
          this.showError(error.message || 'Failed to create plan');
          this.isLoading = false;
        }
      });
  }

  updatePlan(planId: number, planData: CreateSubscriptionPlanDto) {
    this.isLoading = true;
    this.plansService.updatePlan(planId, planData)
      .subscribe({
        next: (updatedPlan) => {
          const index = this.plans.findIndex(p => p.id === planId);
          if (index !== -1) {
            this.plans[index] = this.mapPlanWithStatus(updatedPlan);
          }
          this.calculateStats();
          this.applyFilters();
          this.showSuccess('Plan updated successfully!');
          this.closeForm();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error updating plan:', error);
          this.showError(error.message || 'Failed to update plan');
          this.isLoading = false;
        }
      });
  }

  togglePlanStatus(planId: number) {
    if (!confirm('Are you sure you want to toggle this plan status?')) return;

    this.isLoading = true;
    this.plansService.deactivatePlan(planId)
      .subscribe({
        next: () => {
          const plan = this.plans.find(p => p.id === planId);
          if (plan) {
            plan.isActive = !plan.isActive;
            plan.statusLabel = plan.isActive ? 'Active' : 'Inactive';
          }
          this.calculateStats();
          this.applyFilters();
          this.showSuccess('Plan status updated!');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error toggling plan status:', error);
          this.showError(error.message || 'Failed to update plan status');
          this.isLoading = false;
        }
      });
  }

  viewOrderDetails(orderId: number) {
    this.http.get<Order>(`${this.apiBaseUrl}/Orders/${orderId}`)
      .subscribe({
        next: (order) => {
          this.preview = this.mapOrderWithDetails(order);
          this.previewOpen = true;
        },
        error: (error) => {
          console.error('Error loading order details:', error);
          this.showError('Failed to load order details');
        }
      });
  }

  // ==================== UI HELPERS ====================

  getPlanTypeLabel(planType: PlanType): string {
    return getPlanTypeLabel(planType);
  }

  getOrderStatusLabel(status: OrderStatus): string {
    return getOrderStatusInfo(status).label;
  }

  getOrderStatusClass(status: OrderStatus): string {
    const color = getOrderStatusInfo(status).color;
    return `badge bg-${color}${color === 'warning' ? ' text-dark' : ''}`;
  }

  getSubjectName(id?: number): string {
    if (!id) return 'N/A';
    return this.subjects.find(s => s.id === id)?.name || `Subject ${id}`;
  }

  getYearName(id?: number): string {
    if (!id) return 'N/A';
    const year = this.years.find(y => y.id === id);
    return year?.name || year?.yearNumber.toString() || `Year ${id}`;
  }

  getUserName(id: number): string {
    const user = this.users.find(u => u.id === id);
    return user?.fullName || user?.userName || 'Unknown User';
  }

  // ==================== MODAL OPERATIONS ====================

  openAddPlan() {
    this.formMode = 'add';
    this.formEntity = 'plan';
    this.formTitle = 'Add New Subscription Plan';
    this.selectedTermIds = []; // Reset selected terms
    this.form = {
      name: '',
      description: '',
      planType: PlanType.SingleTerm,  // ✅ استخدام enum
      price: 0,
      durationInDays: 90,  // 3 months default
      subjectId: null,
      termId: null,
      yearId: null,
      includedTermIds: '',
      isActive: true
    };
    this.isFormOpen = true;
  }

  openEditPlan(plan: PlanWithStatus) {
    this.formMode = 'edit';
    this.formEntity = 'plan';
    this.formTitle = 'Edit Subscription Plan';
    this.form = { ...plan };

    // Load selected terms for MultiTerm plans
    if (plan.planType === PlanType.MultiTerm && plan.includedTermIds) {
      this.selectedTermIds = plan.includedTermIds.split(',').map(id => parseInt(id.trim()));
    } else {
      this.selectedTermIds = [];
    }

    this.isFormOpen = true;
  }

  // Handle plan type change
  onPlanTypeChange() {
    // Reset relevant fields when plan type changes
    if (this.form.planType === PlanType.FullYear) {
      this.form.subjectId = null;
      this.form.termId = null;
      this.selectedTermIds = [];
      this.form.includedTermIds = '';
    } else if (this.form.planType === PlanType.SingleTerm) {
      this.selectedTermIds = [];
      this.form.includedTermIds = '';
    } else if (this.form.planType === PlanType.MultiTerm) {
      this.form.termId = null;
      this.selectedTermIds = [];
      this.form.includedTermIds = '';
    } else if (this.form.planType === PlanType.SubjectAnnual) {
      this.form.termId = null;
      this.selectedTermIds = [];
      this.form.includedTermIds = '';
    }
  }

  // Toggle term selection for MultiTerm plans
  toggleTermSelection(termId: number) {
    const index = this.selectedTermIds.indexOf(termId);
    if (index > -1) {
      this.selectedTermIds.splice(index, 1);
    } else {
      this.selectedTermIds.push(termId);
    }

    // Update form.includedTermIds
    this.form.includedTermIds = this.selectedTermIds.sort((a, b) => a - b).join(',');
  }

  // Check if term is selected
  isTermSelected(termId: number): boolean {
    return this.selectedTermIds.includes(termId);
  }

  // Get selected terms
  getSelectedTerms(): number[] {
    return this.selectedTermIds;
  }

  // Get term name by ID (unified implementation)
  getTermName(termId?: number): string {
    if (!termId) return 'N/A';
    const term = this.terms.find(t => t.id === termId);
    return term?.name || `Term ${termId}`;
  }

  submitForm() {
    // Validation
    if (!this.form.name || !this.form.description || !this.form.planType ||
        this.form.price === undefined || !this.form.durationInDays) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    // Validate based on plan type
    if (this.form.planType === PlanType.SingleTerm && !this.form.termId) {
      this.errorMessage = 'Please select a term for Single Term plan';
      return;
    }

    if (this.form.planType === PlanType.MultiTerm) {
      if (this.selectedTermIds.length < 2) {
        this.errorMessage = 'Please select at least 2 terms for Multi Term plan';
        return;
      }
      this.form.includedTermIds = this.selectedTermIds.sort((a, b) => a - b).join(',');
    }

    if (this.form.planType === PlanType.SubjectAnnual && !this.form.subjectId) {
      this.errorMessage = 'Please select a subject for Subject Annual plan';
      return;
    }

    // Submit
    if (this.formMode === 'add') {
      this.createPlan(this.form);
    } else if (this.formMode === 'edit' && this.form.id) {
      this.updatePlan(this.form.id, this.form);
    }
  }

  closeForm() {
    this.isFormOpen = false;
    this.form = {};
  }

  openPlanPreview(plan: PlanWithStatus) {
    this.preview = plan;
    this.previewOpen = true;
  }

  closePreview() {
    this.previewOpen = false;
    this.preview = {};
  }

  // ==================== NAVIGATION ====================

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  setActiveTab(tab: 'dashboard' | 'plans' | 'orders') {
    this.activeTab = tab;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  handleLogout() {
    this.authService.logout();
  }

  navigateToProfile() {
    window.location.href = '/profile';
  }

  // ==================== UTILITIES ====================

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currencyCode
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString();
  }

  private showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 3000);
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
  }

  clearFilters() {
    this.filters = {
      planStatus: '',
      planType: null,
      orderStatus: null,
      subjectId: null,
      termId: null,
      yearId: null,
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    };
    this.applyFilters();
  }

  exportToCSV(entity: 'plans' | 'orders') {
    // Implementation for CSV export
    console.log(`Exporting ${entity} to CSV...`);
  }

  refreshData() {
    this.loadAllData();
  }

  // Math helper for template
  get Math() {
    return Math;
  }
}
