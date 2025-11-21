import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';
import { SubscriptionPlansService } from '../../core/services/subscription-plans.service';
import {
  SubscriptionPlan,
  CreateSubscriptionPlanDto
} from '../../models/subscription.models';
import { PlanType, getPlanTypeLabel } from '../../models/enums';

// Local interfaces for component-specific data
interface Order {
  id?: number;
  orderId?: string;
  userId?: number;
  userName?: string;
  studentId?: number;
  studentName?: string;
  totalAmount?: number;
  amount?: number;
  status?: string;
  orderDate?: string;
  createdAt?: string;
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

interface Subject {
  id: number;
  subjectName: string;  // API returns 'subjectName' not 'name'
  categoryId?: number;
  yearId?: number;
  name?: string;  // Fallback for other components
}

interface Term {
  id: number;
  name: string;
  termNumber: number;
  subjectId: number;
  yearId?: number;
}

interface Year {
  id: number;
  name: string;
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
  typeof = (val: any) => typeof val;  // ✅ للاستخدام في template

  // Data
  subscriptionPlans: SubscriptionPlan[] = [];
  orders: Order[] = [];
  analytics: Analytics | null = null;
  orderSummary: OrderSummary | null = null;
  subjects: Subject[] = [];
  filteredTerms: Term[] = [];
  years: Year[] = [];

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
  plansPageSize = 5;

  // Pagination for Orders
  ordersCurrentPage = 1;
  ordersPageSize = 5;

  // Modal State
  showPlanModal = false;
  isEditMode = false;
  currentPlan: Partial<SubscriptionPlan> = {};
  selectedTerms: number[] = [];  // ✅ لتتبع الـ terms في MultiTerm
  selectedYearFilter: number = 0;  // ✅ Year filter for subjects
  filteredSubjects: Subject[] = [];  // ✅ Filtered subjects by year

  // Statistics
  stats = {
    totalPlans: 0,
    activePlans: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    paidOrders: 0
  };

  constructor(
    private http: HttpClient,
    private plansService: SubscriptionPlansService
  ) {}

  // Helper method to create array of numbers for pagination
  createPageArray(length: number): number[] {
    return Array.from({ length }, (_, i) => i);
  }

  // Helper method to ensure safe iteration over arrays with proper typing
  toArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
  }

  ngOnInit(): void {
    this.loadSubscriptionPlans();
    this.loadYears();        // ✅ Load years from API
    this.loadSubjects();     // ✅ Load subjects from API
    this.loadOrders();
    this.loadAnalytics();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  changeTab(tab: 'plans' | 'orders' | 'analytics'): void {
    this.activeTab.set(tab);
  }

  // ============================================
  // Subject & Term Management
  // ============================================

  loadSubjects(): void {
    console.log('🔍 loadSubjects() called');
    this.http.get<any>(`${environment.apiBaseUrl}/Subjects`)
      .subscribe({
        next: (data) => {
          console.log('📦 Raw Subjects API response:', data);

          // API returns { items: [...], page, pageSize, ... }
          if (data && data.items && Array.isArray(data.items)) {
            // Map API response to Subject interface
            this.subjects = data.items.map((item: any) => ({
              id: item.id,
              subjectName: item.subjectName,
              name: item.subjectName,  // For compatibility
              categoryId: item.categoryId,
              yearId: item.yearId
            }));
            console.log('✅ Subjects extracted from items:', this.subjects.length);
          } else if (Array.isArray(data)) {
            // Fallback for direct array response
            this.subjects = data;
            console.log('✅ Subjects loaded as array:', this.subjects.length);
          } else {
            console.error('❌ Unexpected response format');
            this.subjects = [];
          }
          console.log('📊 Total subjects loaded:', this.subjects.length);
          if (this.subjects.length > 0) {
            console.log('   First subject:', this.subjects[0]);
          }
        },
        error: (error) => {
          console.error('❌ Error loading subjects:', error);
          Swal.fire('Error', 'Failed to load subjects', 'error');
          this.subjects = [];
        }
      });
  }

  onSubjectChange(subjectId: number): void {
    console.log('🔍 onSubjectChange called with subjectId:', subjectId);

    if (subjectId && subjectId > 0) {
      // Load terms for the selected subject
      this.http.get<any>(`${environment.apiBaseUrl}/Terms/by-subject/${subjectId}`)
        .subscribe({
          next: (data) => {
            console.log('📦 Raw Terms API response:', data);

            let rawTerms: any[] = [];

            // Handle different response formats
            if (Array.isArray(data)) {
              rawTerms = data;
            } else if (data && data.items && Array.isArray(data.items)) {
              // Paginated response: { items: [...], page, pageSize, ... }
              rawTerms = data.items;
            } else if (data && typeof data === 'object') {
              // Wrapped response
              rawTerms = (data as any).data || Object.values(data) || [];
            }

            console.log('📋 Extracted raw terms:', rawTerms);

            // Map to Term interface - handle different property names
            this.filteredTerms = rawTerms.map((term: any) => ({
              id: term.id || term.termId,
              name: term.name || term.termName || `Term ${term.termNumber || term.id}`,
              termNumber: term.termNumber || 0,
              subjectId: term.subjectId || subjectId,
              yearId: term.yearId
            }));

            console.log('✅ Mapped filteredTerms:', this.filteredTerms);
            console.log('   - Count:', this.filteredTerms.length);
            if (this.filteredTerms.length > 0) {
              console.log('   - First term:', this.filteredTerms[0]);
            }

            // Auto-fill first term if available (for SingleTerm only)
            if (this.filteredTerms.length > 0 && this.currentPlan.planType === 1) {
              this.currentPlan.termId = this.filteredTerms[0].id;
              console.log('   - Auto-selected termId:', this.currentPlan.termId);
            }
          },
          error: (error) => {
            console.error('❌ Error loading terms:', error);
            this.filteredTerms = [];
            Swal.fire('Error', 'Failed to load terms for this subject', 'error');
          }
        });

      // Get subject name
      const selectedSubject = this.subjects.find(s => s.id === subjectId);
      if (selectedSubject) {
        this.currentPlan.subjectName = selectedSubject.subjectName || selectedSubject.name;
        console.log('📝 Subject name:', this.currentPlan.subjectName);
      }

      // ✅ Update plan name and price suggestions
      this.updatePlanSuggestions();
    } else {
      console.log('⚠️ Invalid subjectId, clearing terms');
      this.filteredTerms = [];
      this.currentPlan.termId = 0;
    }
  }

  loadYears(): void {
    console.log('🔍 loadYears() called');

    // Load years from API
    this.http.get<any>(`${environment.apiBaseUrl}/Years`)
      .subscribe({
        next: (data) => {
          console.log('📦 Raw Years API response:', data);

          let rawYears: any[] = [];

          // Handle different response formats
          if (Array.isArray(data)) {
            rawYears = data;
          } else if (data && data.items && Array.isArray(data.items)) {
            // Paginated response
            rawYears = data.items;
          } else if (data && typeof data === 'object') {
            rawYears = (data as any).data || Object.values(data) || [];
          }

          console.log('📋 Extracted raw years:', rawYears);

          // Map to Year interface
          this.years = rawYears.map((year: any) => ({
            id: year.id || year.yearId,
            name: year.name || year.yearName || `Year ${year.yearNumber || year.id}`
          }));

          // Sort by id
          this.years.sort((a, b) => a.id - b.id);

          console.log('✅ Mapped years:', this.years);
          console.log('   - Count:', this.years.length);
        },
        error: (error) => {
          console.error('❌ Error loading years from API:', error);
          console.log('⚠️ Falling back to hardcoded years');

          // Fallback to hardcoded years if API fails
          this.years = [
            { id: 1, name: 'Year 7' },
            { id: 2, name: 'Year 8' },
            { id: 3, name: 'Year 9' },
            { id: 4, name: 'Year 10' },
            { id: 5, name: 'Year 11' },
            { id: 6, name: 'Year 12' }
          ];

          console.log('   - Using fallback years:', this.years.length);
        }
      });
  }

  getSubjectName(subjectId?: number): string {
    if (!subjectId) return 'Select Subject';
    const subject = this.subjects.find(s => s.id === subjectId);
    return subject ? (subject.subjectName || subject.name || `Subject #${subjectId}`) : `Subject #${subjectId}`;
  }

  getTermName(termId?: number): string {
    if (!termId) return 'Select Term';
    const term = this.filteredTerms.find(t => t.id === termId);
    return term ? `${term.name} (Term ${term.termNumber})` : `Term #${termId}`;
  }

  // ✅ Get year number from subject
  getYearNumberFromSubject(subjectId?: number): number | null {
    if (!subjectId) return null;
    const subject = this.subjects.find(s => s.id === subjectId);
    return subject?.yearId || null;
  }

  // ✅ Get year name
  getYearName(yearId?: number): string {
    if (!yearId) return '';
    const year = this.years.find(y => y.id === yearId);
    return year?.name || `Year ${yearId + 6}`;
  }

  // ✅ Auto-generate plan name based on selections
  generatePlanName(): string {
    const planType = this.currentPlan.planType;
    const subjectName = this.getSubjectName(this.currentPlan.subjectId);
    const termName = this.getTermName(this.currentPlan.termId);

    // Get year from subject
    const yearId = this.getYearNumberFromSubject(this.currentPlan.subjectId);
    const yearName = yearId ? this.getYearName(yearId) : '';

    switch (planType) {
      case PlanType.SingleTerm:
        return yearName
          ? `${subjectName} ${termName} - ${yearName}`
          : `${subjectName} ${termName}`;

      case PlanType.MultiTerm:
        const numTerms = this.selectedTerms.length;
        return yearName
          ? `${subjectName} ${numTerms} Terms - ${yearName}`
          : `${subjectName} Multiple Terms`;

      case PlanType.SubjectAnnual:
        return yearName
          ? `${subjectName} Full Year - ${yearName}`
          : `${subjectName} Annual`;

      case PlanType.FullYear:
        const year = this.getYearName(this.currentPlan.yearId);
        return `Full Year Access - ${year}`;

      default:
        return '';
    }
  }

  // ✅ Get suggested price based on year and plan type
  getSuggestedPrice(): number {
    const yearId = this.getYearNumberFromSubject(this.currentPlan.subjectId)
                   || this.currentPlan.yearId;
    if (!yearId) return 49.99;

    // Base prices by year (Year 7 = yearId 1)
    const yearNumber = yearId + 6; // Convert yearId to year number
    const basePriceByYear: { [key: number]: number } = {
      7: 49.99,
      8: 54.99,
      9: 59.99,
      10: 64.99,
      11: 69.99,
      12: 79.99
    };

    const basePrice = basePriceByYear[yearNumber] || 49.99;

    // Adjust price based on plan type
    switch (this.currentPlan.planType) {
      case PlanType.SingleTerm:
        return basePrice;

      case PlanType.MultiTerm:
        const numTerms = this.selectedTerms.length || 2;
        // Apply 10% discount for multi-term
        return Math.round((basePrice * numTerms * 0.9) * 100) / 100;

      case PlanType.SubjectAnnual:
        // 4 terms with 25% discount
        return Math.round((basePrice * 4 * 0.75) * 100) / 100;

      case PlanType.FullYear:
        // Assume 6 subjects, 25% discount
        return Math.round((basePrice * 6 * 0.75) * 100) / 100;

      default:
        return basePrice;
    }
  }

  // ✅ Apply suggested name and price
  applySuggestions(): void {
    this.currentPlan.name = this.generatePlanName();
    this.currentPlan.price = this.getSuggestedPrice();
  }

  isPlanActive(plan: any): boolean {
    // Check both camelCase and PascalCase property names
    // If isActive property doesn't exist, assume plan is active (default true)
    if (plan?.isActive !== undefined) return plan.isActive === true;
    if (plan?.IsActive !== undefined) return plan.IsActive === true;
    return true; // Default to active if property doesn't exist
  }

  // Validate plan has required data
  isValidPlan(plan: SubscriptionPlan): boolean {
    // Basic validation
    if (!plan.id || !plan.name || !plan.price || plan.planType === undefined) {
      return false;
    }

    return this.plansService.isValidPlan(plan);
  }

  // Get Plan Type label for display
  getPlanTypeLabel(planType: PlanType): string {
    return getPlanTypeLabel(planType);
  }

  // Get all PlanType enum values for dropdown
  get planTypes() {
    return [
      { value: PlanType.SingleTerm, label: 'Single Term' },
      { value: PlanType.MultiTerm, label: 'Multi Term' },
      { value: PlanType.FullYear, label: 'Full Year' },
      { value: PlanType.SubjectAnnual, label: 'Subject Annual' }
    ];
  }

  // Handle term selection for MultiTerm plans
  onTermSelectionChange(event: any, termId: number): void {
    if (event.target.checked) {
      if (!this.selectedTerms.includes(termId)) {
        this.selectedTerms.push(termId);
      }
    } else {
      const index = this.selectedTerms.indexOf(termId);
      if (index > -1) {
        this.selectedTerms.splice(index, 1);
      }
    }

    // Update includedTermIds in currentPlan
    this.currentPlan.includedTermIds = this.selectedTerms.join(',');
    console.log('✅ Selected terms:', this.selectedTerms, 'includedTermIds:', this.currentPlan.includedTermIds);
  }

  // Check if term is selected (for checkbox state)
  isTermSelected(termId: number): boolean {
    return this.selectedTerms.includes(termId);
  }

  // Handle plan type change
  onPlanTypeChange(planType: PlanType): void {
    console.log('🔄 onPlanTypeChange called with:', planType, 'Type:', typeof planType);

    // ✅ تحويل إلى number إذا كان string
    const planTypeNumber = typeof planType === 'string' ? parseInt(planType as any, 10) : planType;
    console.log('   Converted to:', planTypeNumber, 'Type:', typeof planTypeNumber);

    this.currentPlan.planType = planTypeNumber;

    // Reset fields based on plan type
    if (planTypeNumber === PlanType.SingleTerm) {
      console.log('   → Single Term selected - clearing multi-term fields');
      this.selectedTerms = [];
      this.currentPlan.includedTermIds = '';
    } else if (planTypeNumber === PlanType.MultiTerm) {
      console.log('   → Multi Term selected - clearing single term field');
      this.currentPlan.termId = undefined;
      this.selectedTerms = [];  // ✅ Reset selections
    } else if (planTypeNumber === PlanType.FullYear) {
      console.log('   → Full Year selected - clearing subject/term fields');
      this.currentPlan.subjectId = undefined;
      this.currentPlan.termId = undefined;
      this.selectedTerms = [];
      this.currentPlan.includedTermIds = '';
    } else if (planTypeNumber === PlanType.SubjectAnnual) {
      console.log('   → Subject Annual selected - clearing term fields');
      this.currentPlan.termId = undefined;
      this.selectedTerms = [];
      this.currentPlan.includedTermIds = '';
    }

    console.log('   Final state:', {
      planType: this.currentPlan.planType,
      subjectId: this.currentPlan.subjectId,
      selectedTerms: this.selectedTerms,
      filteredTerms: this.filteredTerms.length
    });
  }

  // ✅ Year filter change handler
  onYearFilterChange(yearId: number): void {
    console.log('🔍 onYearFilterChange called with yearId:', yearId);

    if (!yearId || yearId === 0) {
      console.log('   → No year selected, clearing filtered subjects');
      this.filteredSubjects = [];
      this.currentPlan.subjectId = 0;
      this.filteredTerms = [];
      return;
    }

    // Filter subjects by selected year
    this.filteredSubjects = this.subjects.filter(s => s.yearId === yearId);
    console.log(`   → Filtered ${this.filteredSubjects.length} subjects for year ${yearId}`);
    console.log('   → Filtered subjects:', this.filteredSubjects.map(s => ({
      id: s.id,
      name: s.subjectName || s.name,
      yearId: s.yearId
    })));

    // Reset subject and term selections
    this.currentPlan.subjectId = 0;
    this.filteredTerms = [];
    this.selectedTerms = [];

    // Update plan name and price suggestions
    this.updatePlanSuggestions();
  }

  // ============================================
  // Subscription Plans CRUD
  // ============================================

  loadSubscriptionPlans(): void {
    this.loading.set(true);
    this.plansService.getAllPlans()
      .subscribe({
        next: (plans) => {
          console.log('✅ Plans loaded from service:', plans.length);

          // Filter valid plans
          this.subscriptionPlans = plans.filter(plan =>
            this.plansService.isValidPlan(plan)
          );

          this.stats.totalPlans = this.subscriptionPlans.length;
          this.stats.activePlans = this.subscriptionPlans.filter(p => p.isActive).length;

          this.loading.set(false);
        },
        error: (error) => {
          console.error('❌ Error loading subscription plans:', error);
          Swal.fire('Error', error.message || 'Failed to load subscription plans', 'error');
          this.loading.set(false);
        }
      });
  }

  openAddPlanModal(): void {
    console.log('✅ openAddPlanModal() called');
    this.isEditMode = false;
    this.currentPlan = {
      name: '',
      description: '',
      price: 0,
      planType: PlanType.SingleTerm,  // ✅ استخدام enum
      isActive: true,
      subjectId: 0,
      termId: 0,
      yearId: 0,
      includedTermIds: ''  // ✅ للـ MultiTerm
    };
    this.filteredTerms = [];
    this.selectedTerms = [];  // ✅ Reset selected terms
    this.selectedYearFilter = 0;  // ✅ Reset year filter
    this.filteredSubjects = [];  // ✅ Reset filtered subjects

    // ✅ Always ensure subjects and years are loaded
    console.log('📊 Current state - Subjects:', this.subjects.length, 'Years:', this.years.length);

    if (this.subjects.length === 0) {
      console.log('🔄 Loading subjects...');
      this.loadSubjects();
    } else {
      console.log('✓ Subjects already loaded:', this.subjects.length);
    }

    if (this.years.length === 0) {
      console.log('🔄 Loading years...');
      this.loadYears();
    } else {
      console.log('✓ Years already loaded:', this.years.length);
    }

    this.showPlanModal = true;
  }

  // ✅ Update suggestions when selections change
  updatePlanSuggestions(): void {
    if (this.currentPlan.subjectId && this.currentPlan.subjectId > 0) {
      // Only auto-update if name is empty or looks auto-generated
      if (!this.currentPlan.name || this.isAutoGeneratedName(this.currentPlan.name)) {
        this.currentPlan.name = this.generatePlanName();
      }
      // Always update suggested price
      const suggested = this.getSuggestedPrice();
      if (!this.currentPlan.price || this.currentPlan.price === 0) {
        this.currentPlan.price = suggested;
      }
    }
  }

  isAutoGeneratedName(name: string): boolean {
    // Check if name follows auto-generation pattern
    return name.includes(' - Year ') ||
           name.includes('Full Year') ||
           name.includes('Multiple Terms');
  }

  openEditPlanModal(plan: SubscriptionPlan): void {
    console.log('✅ openEditPlanModal() called for plan:', plan.name);
    this.isEditMode = true;
    this.currentPlan = { ...plan };

    // ✅ Reset selections
    this.selectedTerms = [];
    if (plan.includedTermIds) {
      this.selectedTerms = plan.includedTermIds.split(',').map(id => parseInt(id, 10));
    }

    // ✅ Ensure subjects are loaded
    if (this.subjects.length === 0) {
      console.log('🔄 Loading subjects for edit...');
      this.loadSubjects();
    }

    // ✅ Ensure years are loaded
    if (this.years.length === 0) {
      console.log('🔄 Loading years for edit...');
      this.loadYears();
    }

    // ✅ Load terms if editing a plan with a subject
    if (plan.subjectId && plan.subjectId > 0) {
      console.log('🔄 Loading terms for subjectId:', plan.subjectId);
      this.onSubjectChange(plan.subjectId);
    } else {
      this.filteredTerms = [];
    }

    this.showPlanModal = true;
  }

  closePlanModal(): void {
    this.showPlanModal = false;
    this.currentPlan = {};
  }

  savePlan(): void {
    if (!this.currentPlan.name || !this.currentPlan.description ||
        this.currentPlan.price === undefined || this.currentPlan.planType === undefined) {
      Swal.fire('Validation Error', 'Please fill all required fields (Name, Description, Price, Plan Type)', 'warning');
      return;
    }

    this.loading.set(true);
    const planId = this.currentPlan.planId || this.currentPlan.id;

    // ✅ تحويل القيم من string إلى number
    const subjectId = this.currentPlan.subjectId ?
      (typeof this.currentPlan.subjectId === 'string' ?
        parseInt(this.currentPlan.subjectId, 10) :
        this.currentPlan.subjectId) : undefined;

    const termId = this.currentPlan.termId ?
      (typeof this.currentPlan.termId === 'string' ?
        parseInt(this.currentPlan.termId, 10) :
        this.currentPlan.termId) : undefined;

    const yearId = this.currentPlan.yearId ?
      (typeof this.currentPlan.yearId === 'string' ?
        parseInt(this.currentPlan.yearId, 10) :
        this.currentPlan.yearId) : undefined;

    // ✅ بناء DTO بدون wrapper
    const planDto: CreateSubscriptionPlanDto = {
      name: this.currentPlan.name,
      description: this.currentPlan.description,
      planType: this.currentPlan.planType as PlanType,
      price: this.currentPlan.price,
      isActive: this.currentPlan.isActive ?? true,
      subjectId: subjectId,
      termId: termId,
      yearId: yearId,
      includedTermIds: this.currentPlan.includedTermIds || undefined
    };

    console.log('✅ Sending plan DTO:', planDto);
    console.log('   - subjectId type:', typeof planDto.subjectId, '=', planDto.subjectId);
    console.log('   - termId type:', typeof planDto.termId, '=', planDto.termId);
    console.log('   - yearId type:', typeof planDto.yearId, '=', planDto.yearId);

    if (this.isEditMode && planId) {
      // Update existing plan
      this.plansService.updatePlan(planId, planDto)
        .subscribe({
          next: (updatedPlan) => {
            // Update plan in local array
            const index = this.subscriptionPlans.findIndex(p => (p.planId || p.id) === planId);
            if (index !== -1) {
              this.subscriptionPlans[index] = updatedPlan;
            }
            this.loading.set(false);
            this.closePlanModal();
            Swal.fire('Success', 'Subscription plan updated successfully', 'success');
          },
          error: (error) => {
            console.error('❌ Error updating plan:', error);
            this.loading.set(false);
            Swal.fire('Error', error.message || 'Failed to update subscription plan', 'error');
          }
        });
    } else {
      // Create new plan
      this.plansService.createPlan(planDto)
        .subscribe({
          next: (newPlan) => {
            this.subscriptionPlans.push(newPlan);
            this.stats.totalPlans = this.subscriptionPlans.length;
            this.stats.activePlans = this.subscriptionPlans.filter(p => p.isActive).length;
            this.loading.set(false);
            this.closePlanModal();
            Swal.fire('Success', 'Subscription plan created successfully', 'success');
          },
          error: (error) => {
            console.error('❌ Error creating plan:', error);
            this.loading.set(false);
            Swal.fire('Error', error.message || 'Failed to create subscription plan', 'error');
          }
        });
    }
  }

  deactivatePlan(plan: any): void {
    const planId = plan?.planId || plan?.id || plan?.subscriptionPlanId;

    if (!planId) {
      console.error('❌ Plan ID is missing. Plan object:', plan);
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
        this.plansService.deactivatePlan(planId)
          .subscribe({
            next: () => {
              Swal.fire('Deactivated!', 'The subscription plan has been deactivated.', 'success');
              this.loadSubscriptionPlans();
            },
            error: (error) => {
              console.error('❌ Error deactivating plan:', error);
              Swal.fire('Error', error.message || 'Failed to deactivate subscription plan', 'error');
            }
          });
      }
    });
  }

  // ============================================
  // Orders Management
  // ============================================

  getPlanNameFromOrder(order: Order): string {
    if (order.items && order.items.length > 0) {
      return order.items[0].planName;
    }
    return 'N/A';
  }

  getOrderItemsCount(order: Order): number {
    return order.items?.length ?? 0;
  }

  loadOrders(): void {
    this.loading.set(true);
    // Use parent summary endpoint for authenticated orders
    this.http.get<any>(`${environment.apiBaseUrl}/Orders/parent/summary/paged?Page=1&PageSize=100`)
      .subscribe({
        next: (response) => {
          console.log('API Response - Orders:', response);

          // Handle response format - could be { items: [...], totalCount, etc. } or { value: [...] }
          let orders: Order[] = [];

          if (response && Array.isArray(response.items)) {
            orders = response.items;
          } else if (response && Array.isArray(response.value)) {
            orders = response.value;
          } else if (Array.isArray(response)) {
            orders = response;
          } else {
            orders = [];
          }

          console.log('Parsed orders:', orders);
          this.orders = orders;
          this.calculateOrderStats(orders);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          // If parent endpoint fails, try basic endpoint
          this.http.get<any>(`${environment.apiBaseUrl}/Orders`)
            .subscribe({
              next: (data) => {
                this.orders = Array.isArray(data) ? data : [];
                this.calculateOrderStats(this.orders);
                this.loading.set(false);
              },
              error: () => {
                Swal.fire('Error', 'Failed to load orders', 'error');
                this.orders = [];
                this.loading.set(false);
              }
            });
        }
      });
  }

  calculateOrderStats(orders: Order[]): void {
    this.stats.totalOrders = orders.length;
    this.stats.totalRevenue = orders
      .filter(o => o.status === 'Paid')
      .reduce((sum, o) => sum + (o.totalAmount ?? o.amount ?? 0), 0);
    this.stats.pendingOrders = orders.filter(o => o.status === 'Pending').length;
    this.stats.paidOrders = orders.filter(o => o.status === 'Paid').length;
  }

  viewOrderDetails(orderId: number | string | undefined): void {
    if (!orderId) {
      Swal.fire('Error', 'Order ID is missing', 'error');
      return;
    }

    this.http.get<any>(`${environment.apiBaseUrl}/Orders/${orderId}`)
      .subscribe({
        next: (order) => {
          const orderData = order.value ? order.value : order;
          const itemsHtml = orderData.items?.map((item: any) => `
            <div class="flex justify-between py-2 border-b">
              <span>${item.planName || item.name || 'Plan'}</span>
              <span class="font-semibold">$${(item.price || 0).toFixed(2)}</span>
            </div>
          `).join('') || '<p class="text-gray-500">No items</p>';

          const statusColor = orderData.status === 'Paid' ? 'success' : orderData.status === 'Pending' ? 'warning' : 'danger';
          const orderDate = new Date(orderData.orderDate || orderData.createdAt || new Date()).toLocaleDateString();
          const totalAmount = (orderData.totalAmount ?? orderData.amount ?? 0).toFixed(2);

          Swal.fire({
            title: `Order #${orderData.orderId || orderId}`,
            html: `
              <div class="text-left">
                <p class="mb-3"><strong>Status:</strong> <span class="px-3 py-1 rounded-full text-sm font-semibold bg-${statusColor}-100 text-${statusColor}-800">${orderData.status || 'Unknown'}</span></p>
                <p class="mb-2"><strong>Date:</strong> ${orderDate}</p>
                <p class="mb-3"><strong>Total:</strong> <span class="text-xl font-bold text-green-600">$${totalAmount}</span></p>
                <div class="mt-3 pt-3 border-t">
                  <strong class="block mb-2">Items:</strong>
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

  downloadInvoice(orderId: number | string | undefined): void {
    if (!orderId) {
      Swal.fire('Error', 'Order ID is missing', 'error');
      return;
    }

    this.http.get(`${environment.apiBaseUrl}/Orders/${orderId}/invoice`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice-${orderId}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          Swal.fire('Success', 'Invoice downloaded successfully', 'success');
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

    this.http.get<any>(`${environment.apiBaseUrl}/Orders/parent/analytics`, { params })
      .subscribe({
        next: (data) => {
          console.log('API Response - Analytics:', data);

          // Handle multiple possible response formats
          if (data) {
            // Normalize the response to Analytics format
            this.analytics = {
              totalRevenue: data.totalRevenue ?? data.value?.totalRevenue ?? 0,
              totalOrders: data.totalOrders ?? data.value?.totalOrders ?? 0,
              averageOrderValue: data.averageOrderValue ?? data.value?.averageOrderValue ?? 0,
              ordersByMonth: data.ordersByMonth ?? data.value?.ordersByMonth ?? [],
              topPlans: data.topPlans ?? data.value?.topPlans ?? []
            };
          }
        },
        error: (error) => {
          console.error('Error loading analytics:', error);
          // Set default analytics if endpoint fails
          this.analytics = {
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            ordersByMonth: [],
            topPlans: []
          };
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
      // Skip plans with no name and invalid planType
      if (!plan.name || plan.name.trim() === '') {
        return false;
      }

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
      const searchText = this.searchTerm.toLowerCase();
      const orderId = (order.orderId || '').toString().toLowerCase();
      const userName = (order.userName || '').toLowerCase();
      const studentName = (order.studentName || '').toLowerCase();

      const matchesSearch = !this.searchTerm ||
        orderId.includes(searchText) ||
        userName.includes(searchText) ||
        studentName.includes(searchText);

      const matchesStatus = !this.statusFilter || (order.status === this.statusFilter);

      return matchesSearch && matchesStatus;
    });
  }

  get pagedOrders(): Order[] {
    const start = (this.ordersCurrentPage - 1) * this.ordersPageSize;
    const end = start + this.ordersPageSize;
    return this.filteredOrders.slice(start, end);
  }

  goToOrdersPage(page: number): void {
    if (page >= 1 && page <= Math.ceil(this.filteredOrders.length / this.ordersPageSize)) {
      this.ordersCurrentPage = page;
    }
  }

  // Reset pagination when search/filter changes
  onSearchChange(): void {
    this.plansCurrentPage = 1;
    this.ordersCurrentPage = 1;
  }

  onStatusFilterChange(): void {
    this.ordersCurrentPage = 1;
  }
}
