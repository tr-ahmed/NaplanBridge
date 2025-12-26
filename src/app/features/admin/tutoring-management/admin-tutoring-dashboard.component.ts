import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SubjectService } from '../../../core/services/subject.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ToastService } from '../../../core/services/toast.service';
import { forkJoin } from 'rxjs';

type TabType = 'overview' | 'pricing' | 'teachers' | 'discounts' | 'reports';

interface TeacherWithPriority {
  id: number;
  name: string;
  email: string;
  priority: number;
  subjects: string[];
  isActive: boolean;
  totalBookings: number;
  avgRating: number;
  isEditing?: boolean;
  newPriority?: number;
}

interface SubjectPricing {
  id: number;
  subjectName: string;
  categoryName: string;
  selfLearningPrice: number;
  tutoringPricePerHour: number | null;
  isAvailableForTutoring: boolean;
  isEditing?: boolean;
  newTutoringPrice?: number;
}

interface DiscountRule {
  id: string;
  name: string;
  type: 'group' | 'hours' | 'multiSubject';
  percentage: number;
  condition: string;
  isActive: boolean;
}

interface TutoringStats {
  totalRevenue: number;
  totalOrders: number;
  totalSessions: number;
  completedSessions: number;
  activeStudents: number;
  activeTeachers: number;
  averageOrderValue: number;
}

// ✅ Advanced Reports Interfaces
interface RevenueBySubject {
  subjectId: number;
  subjectName: string;
  revenue: number;
  sessions: number;
  percentage: number;
}

interface TeacherPerformance {
  teacherId: number;
  teacherName: string;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalRevenue: number;
  avgRating: number;
  completionRate: number;
  avgSessionDuration: number;
}

interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
  sessions: number;
}

interface StudentEngagement {
  totalStudents: number;
  newStudents: number;
  returningStudents: number;
  avgSessionsPerStudent: number;
  topSubjects: { name: string; count: number }[];
}

interface SessionTypeDistribution {
  oneToOne: number;
  group: number;
  total: number;
}

interface CancellationStats {
  total: number;
  byStudent: number;
  byTeacher: number;
  refundAmount: number;
  cancellationRate: number;
}

interface AdvancedReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    pendingSessions: number;
    averageOrderValue: number;
    revenueGrowth: number;
    bookingGrowth: number;
  };
  revenueBySubject: RevenueBySubject[];
  teacherPerformance: TeacherPerformance[];
  bookingTrends: BookingTrend[];
  studentEngagement: StudentEngagement;
  sessionTypeDistribution: SessionTypeDistribution;
  cancellationStats: CancellationStats;
  peakHours: { hour: number; bookings: number }[];
  peakDays: { day: string; bookings: number }[];
}

@Component({
  selector: 'app-admin-tutoring-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1>🎓 Tutoring Management</h1>
          <p class="subtitle">Manage pricing, teachers, discounts and view reports</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-container">
        <button
          *ngFor="let tab of tabs"
          (click)="activeTab.set(tab.id)"
          [class.active]="activeTab() === tab.id"
          class="tab-btn">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">

        <!-- Overview Tab -->
        <div *ngIf="activeTab() === 'overview'" class="overview-tab">

          <!-- Loading State -->
          <div *ngIf="loadingStats()" class="loading">
            <div class="spinner"></div>
            <p>Loading statistics...</p>
          </div>

          <div *ngIf="!loadingStats()" class="stats-grid">
            <div class="stat-card revenue">
              <div class="stat-icon">💰</div>
              <div class="stat-info">
                <h3>\${{ stats.totalRevenue.toLocaleString() }}</h3>
                <p>Total Revenue</p>
              </div>
            </div>
            <div class="stat-card orders">
              <div class="stat-icon">📦</div>
              <div class="stat-info">
                <h3>{{ stats.totalOrders }}</h3>
                <p>Total Orders</p>
              </div>
            </div>
            <div class="stat-card sessions">
              <div class="stat-icon">📚</div>
              <div class="stat-info">
                <h3>{{ stats.totalSessions }}</h3>
                <p>Total Sessions</p>
                <small>{{ stats.completedSessions }} completed</small>
              </div>
            </div>
            <div class="stat-card students">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <h3>{{ stats.activeStudents }}</h3>
                <p>Active Students</p>
              </div>
            </div>
            <div class="stat-card teachers">
              <div class="stat-icon">👨‍🏫</div>
              <div class="stat-info">
                <h3>{{ stats.activeTeachers }}</h3>
                <p>Active Teachers</p>
              </div>
            </div>
            <div class="stat-card aov">
              <div class="stat-icon">💳</div>
              <div class="stat-info">
                <h3>\${{ stats.averageOrderValue.toFixed(2) }}</h3>
                <p>Avg Order Value</p>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <h2>Quick Actions</h2>
            <div class="actions-grid">
              <button (click)="activeTab.set('pricing')" class="action-btn pricing">
                <span class="action-icon">💰</span>
                <span class="action-label">Manage Pricing</span>
                <span class="action-desc">Set tutoring rates</span>
              </button>
              <button (click)="activeTab.set('teachers')" class="action-btn teachers">
                <span class="action-icon">⭐</span>
                <span class="action-label">Teacher Priority</span>
                <span class="action-desc">Manage teacher assignments</span>
              </button>
              <button (click)="activeTab.set('discounts')" class="action-btn discounts">
                <span class="action-icon">🎁</span>
                <span class="action-label">Discounts</span>
                <span class="action-desc">Configure discount rules</span>
              </button>
              <button (click)="activeTab.set('reports')" class="action-btn reports">
                <span class="action-icon">📊</span>
                <span class="action-label">Reports</span>
                <span class="action-desc">View detailed analytics</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Pricing Tab -->
        <div *ngIf="activeTab() === 'pricing'" class="pricing-tab">
          <div class="tab-header">
            <h2>💰 Tutoring Pricing</h2>
            <p>Set hourly rates for tutoring sessions (separate from self-learning subscriptions)</p>

            <div class="header-actions">
              <button class="btn btn-primary" (click)="saveAllPricing()" [disabled]="!hasPricingChanges() || saving()">
                {{ saving() ? 'Saving...' : 'Save All Changes' }}
              </button>
            </div>
          </div>

          <!-- Search & Filter -->
          <div class="filters">
            <input
              type="text"
              [(ngModel)]="pricingSearch"
              (ngModelChange)="filterPricing()"
              placeholder="Search subjects..."
              class="search-input">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="showOnlyTutoringEnabled" (change)="filterPricing()">
              Show only tutoring-enabled
            </label>
          </div>

          <!-- Loading -->
          <div *ngIf="loadingPricing()" class="loading">
            <div class="spinner"></div>
            <p>Loading subjects...</p>
          </div>

          <!-- Pricing Table -->
          <div *ngIf="!loadingPricing()" class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Self-Learning<br><small>(Monthly)</small></th>
                  <th>Tutoring Rate<br><small>(Per Hour)</small></th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let subject of filteredSubjects" [class.editing]="subject.isEditing">
                  <td class="subject-cell">
                    <span class="subject-icon">📚</span>
                    {{ subject.subjectName }}
                  </td>
                  <td>{{ subject.categoryName }}</td>
                  <td class="price-cell">\${{ (subject.selfLearningPrice || 0).toFixed(2) }}</td>
                  <td class="price-cell">
                    <div *ngIf="!subject.isEditing">
                      <span *ngIf="subject.tutoringPricePerHour !== null && subject.tutoringPricePerHour !== undefined" class="price tutoring">
                        \${{ subject.tutoringPricePerHour.toFixed(2) }}/hr
                      </span>
                      <span *ngIf="subject.tutoringPricePerHour === null || subject.tutoringPricePerHour === undefined" class="not-set">Not Set</span>
                    </div>
                    <div *ngIf="subject.isEditing" class="edit-input">
                      <span class="currency">$</span>
                      <input type="number" [(ngModel)]="subject.newTutoringPrice" min="0" step="0.01" placeholder="0.00">
                      <span class="unit">/hr</span>
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" [class.enabled]="subject.isAvailableForTutoring" [class.disabled]="!subject.isAvailableForTutoring">
                      {{ subject.isAvailableForTutoring ? 'Enabled' : 'Disabled' }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button *ngIf="!subject.isEditing" (click)="editPricing(subject)" class="btn-icon" title="Edit">✏️</button>
                    <button *ngIf="subject.isEditing" (click)="savePricing(subject)" class="btn-icon save" title="Save">✅</button>
                    <button *ngIf="subject.isEditing" (click)="cancelPricingEdit(subject)" class="btn-icon cancel" title="Cancel">❌</button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div *ngIf="filteredSubjects.length === 0" class="empty-state">
              <p>No subjects found matching your filters.</p>
            </div>
          </div>
        </div>

        <!-- Teachers Tab -->
        <div *ngIf="activeTab() === 'teachers'" class="teachers-tab">
          <div class="tab-header">
            <h2>⭐ Teacher Priority</h2>
            <p>Manage teacher priorities for smart scheduling (10 = highest priority)</p>
          </div>

          <!-- Search & Sort -->
          <div class="filters">
            <input
              type="text"
              [(ngModel)]="teacherSearch"
              (ngModelChange)="filterTeachers()"
              placeholder="Search teachers..."
              class="search-input">
            <select [(ngModel)]="teacherSort" (change)="sortTeachers()" class="sort-select">
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="priority-asc">Priority (Low to High)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="rating-desc">Rating (High to Low)</option>
            </select>
          </div>

          <!-- Loading -->
          <div *ngIf="loadingTeachers()" class="loading">
            <div class="spinner"></div>
            <p>Loading teachers...</p>
          </div>

          <!-- Teachers Table -->
          <div *ngIf="!loadingTeachers()" class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Teacher Name</th>
                  <th>Email</th>
                  <th>Subjects</th>
                  <th>Bookings</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let teacher of filteredTeachers" [class.inactive]="!teacher.isActive">
                  <td class="priority-cell">
                    <div *ngIf="!teacher.isEditing" class="priority-badge" [class]="getPriorityClass(teacher.priority)">
                      ⭐ {{ teacher.priority }}
                    </div>
                    <div *ngIf="teacher.isEditing" class="priority-edit">
                      <input type="range" [(ngModel)]="teacher.newPriority" min="1" max="10" class="priority-slider">
                      <span class="priority-value">{{ teacher.newPriority }}</span>
                    </div>
                  </td>
                  <td class="name-cell">{{ teacher.name }}</td>
                  <td>{{ teacher.email }}</td>
                  <td>
                    <div class="subjects-list">
                      <span *ngFor="let subject of teacher.subjects" class="subject-tag">{{ subject }}</span>
                    </div>
                  </td>
                  <td class="center">{{ teacher.totalBookings }}</td>
                  <td class="center">
                    <span class="rating">{{ (teacher.avgRating || 0).toFixed(1) }} ⭐</span>
                  </td>
                  <td class="center">
                    <span class="status-badge" [class.active]="teacher.isActive" [class.inactive]="!teacher.isActive">
                      {{ teacher.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button *ngIf="!teacher.isEditing" (click)="editTeacher(teacher)" class="btn-icon" title="Edit">✏️</button>
                    <button *ngIf="teacher.isEditing" (click)="saveTeacher(teacher)" class="btn-icon save" title="Save">✅</button>
                    <button *ngIf="teacher.isEditing" (click)="cancelTeacherEdit(teacher)" class="btn-icon cancel" title="Cancel">❌</button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div *ngIf="filteredTeachers.length === 0" class="empty-state">
              <p>No teachers found.</p>
            </div>
          </div>
        </div>

        <!-- Discounts Tab -->
        <div *ngIf="activeTab() === 'discounts'" class="discounts-tab">
          <div class="tab-header">
            <h2>🎁 Discount Rules</h2>
            <p>Configure automatic discount rules for tutoring bookings</p>
          </div>

          <div class="discounts-grid">
            <!-- Group Discount -->
            <div class="discount-card">
              <div class="discount-header">
                <div class="discount-title">
                  <span class="discount-icon">👥</span>
                  <h3>Group Tutoring</h3>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="groupDiscount.isActive" (change)="saveDiscountRule(groupDiscount)">
                  <span class="slider"></span>
                </label>
              </div>
              <p class="discount-desc">Discount applied when student chooses group tutoring</p>
              <div class="discount-value">
                <label>Discount:</label>
                <div class="input-group">
                  <input type="number" [(ngModel)]="groupDiscount.percentage" min="0" max="100" [disabled]="!groupDiscount.isActive">
                  <span class="unit">%</span>
                </div>
              </div>
              <div class="discount-example">
                <strong>Example:</strong> \$100/hr → \${{ (100 * (1 - groupDiscount.percentage/100)).toFixed(2) }}/hr
              </div>
              <button class="btn btn-sm btn-save" (click)="saveDiscountRule(groupDiscount)" [disabled]="!groupDiscount.isActive">
                Save Changes
              </button>
            </div>

            <!-- Hours Discount -->
            <div class="discount-card">
              <div class="discount-header">
                <div class="discount-title">
                  <span class="discount-icon">⏰</span>
                  <h3>Hours Package</h3>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="hoursDiscount.isActive" (change)="saveDiscountRule(hoursDiscount)">
                  <span class="slider"></span>
                </label>
              </div>
              <p class="discount-desc">Discount based on number of hours booked</p>
              <div class="hours-tiers">
                <div class="tier">
                  <span class="tier-label">10 hours:</span>
                  <span class="tier-value">0% (Base)</span>
                </div>
                <div class="tier">
                  <span class="tier-label">20 hours:</span>
                  <div class="input-group">
                    <input type="number" [(ngModel)]="hoursDiscountTiers.tier20" min="0" max="50" [disabled]="!hoursDiscount.isActive">
                    <span class="unit">%</span>
                  </div>
                </div>
                <div class="tier">
                  <span class="tier-label">30 hours:</span>
                  <div class="input-group">
                    <input type="number" [(ngModel)]="hoursDiscountTiers.tier30" min="0" max="50" [disabled]="!hoursDiscount.isActive">
                    <span class="unit">%</span>
                  </div>
                </div>
              </div>
              <button class="btn btn-sm btn-save" (click)="saveDiscountRule(hoursDiscount)" [disabled]="!hoursDiscount.isActive">
                Save Changes
              </button>
            </div>

            <!-- Multi-Subject Discount -->
            <div class="discount-card">
              <div class="discount-header">
                <div class="discount-title">
                  <span class="discount-icon">📚</span>
                  <h3>Multiple Subjects</h3>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="multiSubjectDiscount.isActive" (change)="saveDiscountRule(multiSubjectDiscount)">
                  <span class="slider"></span>
                </label>
              </div>
              <p class="discount-desc">Discount when booking multiple subjects</p>
              <div class="subjects-tiers">
                <div class="tier">
                  <span class="tier-label">1 subject:</span>
                  <span class="tier-value">0% (Base)</span>
                </div>
                <div class="tier">
                  <span class="tier-label">2 subjects:</span>
                  <div class="input-group">
                    <input type="number" [(ngModel)]="multiSubjectTiers.tier2" min="0" max="50" [disabled]="!multiSubjectDiscount.isActive">
                    <span class="unit">%</span>
                  </div>
                </div>
                <div class="tier">
                  <span class="tier-label">3 subjects:</span>
                  <div class="input-group">
                    <input type="number" [(ngModel)]="multiSubjectTiers.tier3" min="0" max="50" [disabled]="!multiSubjectDiscount.isActive">
                    <span class="unit">%</span>
                  </div>
                </div>
                <div class="tier">
                  <span class="tier-label">4 subjects:</span>
                  <div class="input-group">
                    <input type="number" [(ngModel)]="multiSubjectTiers.tier4" min="0" max="50" [disabled]="!multiSubjectDiscount.isActive">
                    <span class="unit">%</span>
                  </div>
                </div>
                <div class="tier">
                  <span class="tier-label">5+ subjects:</span>
                  <div class="input-group">
                    <input type="number" [(ngModel)]="multiSubjectTiers.tier5" min="0" max="50" [disabled]="!multiSubjectDiscount.isActive">
                    <span class="unit">%</span>
                  </div>
                </div>
              </div>
              <button class="btn btn-sm btn-save" (click)="saveDiscountRule(multiSubjectDiscount)" [disabled]="!multiSubjectDiscount.isActive">
                Save Changes
              </button>
            </div>

            <!-- Multiple Students Discount -->
            <div class="discount-card">
              <div class="discount-header">
                <div class="discount-title">
                  <span class="discount-icon">👨‍👩‍👧‍👦</span>
                  <h3>Multiple Students</h3>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="multiStudentsDiscount.isActive" (change)="saveDiscountRule(multiStudentsDiscount)">
                  <span class="slider"></span>
                </label>
              </div>
              <p class="discount-desc">Discount when parent registers multiple children</p>
              <div class="students-tiers">
                <div class="tier">
                  <span class="tier-label">2 students:</span>
                  <div class="input-group">
                    <input type="number" [(ngModel)]="multiStudentsTiers.tier2" min="0" max="50" [disabled]="!multiStudentsDiscount.isActive">
                    <span class="unit">%</span>
                  </div>
                </div>
                <div class="tier">
                  <span class="tier-label">3 students:</span>
                  <div class="input-group">
                    <input type="number" [(ngModel)]="multiStudentsTiers.tier3" min="0" max="50" [disabled]="!multiStudentsDiscount.isActive">
                    <span class="unit">%</span>
                  </div>
                </div>
                <div class="tier">
                  <span class="tier-label">4+ students:</span>
                  <div class="input-group">
                    <input type="number" [(ngModel)]="multiStudentsTiers.tier4" min="0" max="50" [disabled]="!multiStudentsDiscount.isActive">
                    <span class="unit">%</span>
                  </div>
                </div>
                <div class="tier max-cap">
                  <span class="tier-label">Max discount:</span>
                  <div class="input-group">
                    <input type="number" [(ngModel)]="multiStudentsTiers.max" min="0" max="50" [disabled]="!multiStudentsDiscount.isActive">
                    <span class="unit">%</span>
                  </div>
                </div>
              </div>
              <div class="discount-example">
                <strong>Example:</strong> 4 students × \$100 = \$400 → \${{ (400 * (1 - multiStudentsTiers.tier4/100)).toFixed(0) }} ({{ multiStudentsTiers.tier4 }}% off)
              </div>
              <button class="btn btn-sm btn-save" (click)="saveMultiStudentsDiscount()" [disabled]="!multiStudentsDiscount.isActive">
                Save Changes
              </button>
            </div>
          </div>

          <!-- Discount Info -->
          <div class="info-box">
            <div class="info-icon">💡</div>
            <div class="info-content">
              <h4>How Discounts Work</h4>
              <ul>
                <li>Discounts are applied <strong>cumulatively</strong> (all applicable discounts stack)</li>
                <li>Maximum total discount is <strong>60%</strong></li>
                <li>Discounts are calculated <strong>automatically</strong> during checkout</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Reports Tab -->
        <div *ngIf="activeTab() === 'reports'" class="reports-tab">
          <div class="tab-header">
            <div class="header-row">
              <div>
                <h2>📊 Reports & Analytics</h2>
                <p>Comprehensive tutoring analytics and performance insights</p>
              </div>
              <div class="header-actions">
                <button class="btn btn-outline" (click)="exportReport('pdf')">
                  <span>📄</span> Export PDF
                </button>
                <button class="btn btn-outline" (click)="exportReport('excel')">
                  <span>📊</span> Export Excel
                </button>
                <button class="btn btn-primary" (click)="loadReports()">
                  <span>🔄</span> Refresh
                </button>
              </div>
            </div>
          </div>

          <!-- Period Selector -->
          <div class="report-filters">
            <div class="period-selector">
              <button *ngFor="let period of reportPeriods"
                      (click)="selectedPeriod = period; loadReports()"
                      [class.active]="selectedPeriod === period"
                      class="period-btn">
                {{ period }}
              </button>
            </div>
            <div class="date-range">
              <input type="date" [(ngModel)]="reportStartDate" class="date-input">
              <span>to</span>
              <input type="date" [(ngModel)]="reportEndDate" class="date-input">
              <button class="btn btn-sm btn-primary" (click)="loadReportsCustomDate()">Apply</button>
            </div>
          </div>

          <!-- Loading State -->
          <div *ngIf="loadingReports()" class="loading">
            <div class="spinner"></div>
            <p>Loading reports...</p>
          </div>

          <!-- Reports Content -->
          <div *ngIf="!loadingReports()" class="reports-content">

            <!-- Summary Cards -->
            <div class="report-summary-grid">
              <div class="summary-card revenue">
                <div class="summary-icon">💰</div>
                <div class="summary-info">
                  <h3>\${{ reportData.summary.totalRevenue.toLocaleString() }}</h3>
                  <p>Total Revenue</p>
                  <span class="growth" [class.positive]="reportData.summary.revenueGrowth >= 0" [class.negative]="reportData.summary.revenueGrowth < 0">
                    {{ reportData.summary.revenueGrowth >= 0 ? '↑' : '↓' }} {{ Math.abs(reportData.summary.revenueGrowth) }}% vs previous period
                  </span>
                </div>
              </div>
              <div class="summary-card orders">
                <div class="summary-icon">📦</div>
                <div class="summary-info">
                  <h3>{{ reportData.summary.totalOrders }}</h3>
                  <p>Total Orders</p>
                  <span class="growth" [class.positive]="reportData.summary.bookingGrowth >= 0">
                    {{ reportData.summary.bookingGrowth >= 0 ? '↑' : '↓' }} {{ Math.abs(reportData.summary.bookingGrowth) }}% growth
                  </span>
                </div>
              </div>
              <div class="summary-card sessions">
                <div class="summary-icon">📚</div>
                <div class="summary-info">
                  <h3>{{ reportData.summary.totalSessions }}</h3>
                  <p>Total Sessions</p>
                  <span class="sub-stats">
                    ✅ {{ reportData.summary.completedSessions }} completed |
                    ⏳ {{ reportData.summary.pendingSessions }} pending
                  </span>
                </div>
              </div>
              <div class="summary-card aov">
                <div class="summary-icon">💳</div>
                <div class="summary-info">
                  <h3>\${{ reportData.summary.averageOrderValue.toFixed(2) }}</h3>
                  <p>Avg Order Value</p>
                </div>
              </div>
            </div>

            <!-- Charts Row -->
            <div class="charts-row">
              <!-- Revenue by Subject -->
              <div class="chart-card">
                <h3>💰 Revenue by Subject</h3>
                <div class="chart-content">
                  <div *ngFor="let subject of reportData.revenueBySubject" class="bar-item">
                    <div class="bar-label">
                      <span class="subject-name">{{ subject.subjectName }}</span>
                      <span class="subject-value">\${{ subject.revenue.toLocaleString() }}</span>
                    </div>
                    <div class="bar-track">
                      <div class="bar-fill" [style.width.%]="subject.percentage"></div>
                    </div>
                    <span class="bar-percent">{{ subject.percentage.toFixed(1) }}%</span>
                  </div>
                  <div *ngIf="reportData.revenueBySubject.length === 0" class="no-data">
                    No revenue data available
                  </div>
                </div>
              </div>

              <!-- Booking Trends -->
              <div class="chart-card">
                <h3>📈 Booking Trends</h3>
                <div class="chart-content trends-chart">
                  <div class="trend-header">
                    <span class="trend-label">Last {{ reportData.bookingTrends.length }} days</span>
                  </div>
                  <div class="trend-bars">
                    <div *ngFor="let trend of reportData.bookingTrends" class="trend-bar-container">
                      <div class="trend-bar"
                           [style.height.%]="getBarHeight(trend.bookings)"
                           [title]="trend.date + ': ' + trend.bookings + ' bookings'">
                      </div>
                      <span class="trend-day">{{ trend.date | slice:-2 }}</span>
                    </div>
                  </div>
                  <div *ngIf="reportData.bookingTrends.length === 0" class="no-data">
                    No trend data available
                  </div>
                </div>
              </div>
            </div>

            <!-- Session Distribution & Peak Hours -->
            <div class="charts-row">
              <!-- Session Type Distribution -->
              <div class="chart-card small">
                <h3>📊 Session Types</h3>
                <div class="donut-chart">
                  <div class="donut-center">
                    <span class="donut-total">{{ reportData.sessionTypeDistribution.total }}</span>
                    <span class="donut-label">Total</span>
                  </div>
                  <div class="donut-legend">
                    <div class="legend-item">
                      <span class="legend-color one-to-one"></span>
                      <span class="legend-text">One-to-One: {{ reportData.sessionTypeDistribution.oneToOne }}</span>
                      <span class="legend-percent">{{ getSessionPercent('oneToOne') }}%</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-color group"></span>
                      <span class="legend-text">Group: {{ reportData.sessionTypeDistribution.group }}</span>
                      <span class="legend-percent">{{ getSessionPercent('group') }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Peak Hours -->
              <div class="chart-card small">
                <h3>⏰ Peak Booking Hours</h3>
                <div class="peak-hours">
                  <div *ngFor="let hour of reportData.peakHours; let i = index" class="peak-item" [class.top]="i < 3">
                    <span class="peak-rank">{{ i + 1 }}</span>
                    <span class="peak-time">{{ formatHour(hour.hour) }}</span>
                    <div class="peak-bar">
                      <div class="peak-fill" [style.width.%]="getPeakPercent(hour.bookings)"></div>
                    </div>
                    <span class="peak-count">{{ hour.bookings }}</span>
                  </div>
                </div>
              </div>

              <!-- Peak Days -->
              <div class="chart-card small">
                <h3>📅 Busiest Days</h3>
                <div class="peak-days">
                  <div *ngFor="let day of reportData.peakDays; let i = index" class="peak-item" [class.top]="i < 3">
                    <span class="peak-rank">{{ i + 1 }}</span>
                    <span class="peak-day">{{ day.day }}</span>
                    <div class="peak-bar">
                      <div class="peak-fill day" [style.width.%]="getDayPercent(day.bookings)"></div>
                    </div>
                    <span class="peak-count">{{ day.bookings }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Teacher Performance Table -->
            <div class="performance-section">
              <h3>👨‍🏫 Teacher Performance</h3>
              <div class="table-container">
                <table class="performance-table">
                  <thead>
                    <tr>
                      <th>Teacher</th>
                      <th>Sessions</th>
                      <th>Completed</th>
                      <th>Cancelled</th>
                      <th>Revenue</th>
                      <th>Rating</th>
                      <th>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let teacher of reportData.teacherPerformance">
                      <td class="teacher-cell">
                        <span class="teacher-name">{{ teacher.teacherName }}</span>
                      </td>
                      <td class="center">{{ teacher.totalSessions }}</td>
                      <td class="center success">{{ teacher.completedSessions }}</td>
                      <td class="center danger">{{ teacher.cancelledSessions }}</td>
                      <td class="center">\${{ teacher.totalRevenue.toLocaleString() }}</td>
                      <td class="center">
                        <span class="rating-badge">⭐ {{ teacher.avgRating.toFixed(1) }}</span>
                      </td>
                      <td class="center">
                        <div class="completion-bar">
                          <div class="completion-fill" [style.width.%]="teacher.completionRate"></div>
                          <span class="completion-text">{{ teacher.completionRate.toFixed(0) }}%</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div *ngIf="reportData.teacherPerformance.length === 0" class="no-data">
                  No teacher performance data available
                </div>
              </div>
            </div>

            <!-- Student Engagement & Cancellation Stats -->
            <div class="stats-row">
              <!-- Student Engagement -->
              <div class="stats-card">
                <h3>👥 Student Engagement</h3>
                <div class="engagement-stats">
                  <div class="engagement-item">
                    <span class="engagement-value">{{ reportData.studentEngagement.totalStudents }}</span>
                    <span class="engagement-label">Total Students</span>
                  </div>
                  <div class="engagement-item new">
                    <span class="engagement-value">{{ reportData.studentEngagement.newStudents }}</span>
                    <span class="engagement-label">New Students</span>
                  </div>
                  <div class="engagement-item returning">
                    <span class="engagement-value">{{ reportData.studentEngagement.returningStudents }}</span>
                    <span class="engagement-label">Returning</span>
                  </div>
                  <div class="engagement-item avg">
                    <span class="engagement-value">{{ reportData.studentEngagement.avgSessionsPerStudent.toFixed(1) }}</span>
                    <span class="engagement-label">Avg Sessions/Student</span>
                  </div>
                </div>
                <div class="top-subjects">
                  <h4>Top Requested Subjects</h4>
                  <div class="subject-list">
                    <div *ngFor="let subject of reportData.studentEngagement.topSubjects; let i = index" class="subject-item">
                      <span class="subject-rank">{{ i + 1 }}</span>
                      <span class="subject-name">{{ subject.name }}</span>
                      <span class="subject-count">{{ subject.count }} requests</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Cancellation Stats -->
              <div class="stats-card cancellation">
                <h3>❌ Cancellation Analysis</h3>
                <div class="cancellation-stats">
                  <div class="cancel-summary">
                    <div class="cancel-rate">
                      <span class="rate-value">{{ reportData.cancellationStats.cancellationRate.toFixed(1) }}%</span>
                      <span class="rate-label">Cancellation Rate</span>
                    </div>
                    <div class="cancel-total">
                      <span class="total-value">{{ reportData.cancellationStats.total }}</span>
                      <span class="total-label">Total Cancelled</span>
                    </div>
                  </div>
                  <div class="cancel-breakdown">
                    <div class="cancel-item student">
                      <span class="cancel-icon">👤</span>
                      <span class="cancel-label">By Student</span>
                      <span class="cancel-value">{{ reportData.cancellationStats.byStudent }}</span>
                    </div>
                    <div class="cancel-item teacher">
                      <span class="cancel-icon">👨‍🏫</span>
                      <span class="cancel-label">By Teacher</span>
                      <span class="cancel-value">{{ reportData.cancellationStats.byTeacher }}</span>
                    </div>
                  </div>
                  <div class="refund-amount">
                    <span class="refund-label">Total Refunds:</span>
                    <span class="refund-value">\${{ reportData.cancellationStats.refundAmount.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      min-height: 100vh;
      background: #f5f7fa;
    }

    /* Header */
    .dashboard-header {
      background: linear-gradient(135deg, #108092 0%, #0d6a78 100%);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      color: white;
    }

    .dashboard-header h1 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      opacity: 0.9;
      font-size: 1rem;
      margin: 0;
    }

    /* Tabs */
    .tabs-container {
      display: flex;
      gap: 0.5rem;
      background: white;
      padding: 0.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 1.5rem;
      overflow-x: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab-btn:hover {
      background: #f0f0f0;
    }

    .tab-btn.active {
      background: #108092;
      color: white;
    }

    .tab-icon {
      font-size: 1.2rem;
    }

    .tab-label {
      font-weight: 500;
    }

    /* Tab Content */
    .tab-content {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .tab-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }

    .tab-header h2 {
      font-size: 1.5rem;
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .tab-header p {
      color: #666;
      margin: 0;
    }

    .header-actions {
      margin-top: 1rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 12px;
      background: white;
      border: 1px solid #eee;
    }

    .stat-card.revenue { border-left: 4px solid #4caf50; }
    .stat-card.orders { border-left: 4px solid #2196f3; }
    .stat-card.sessions { border-left: 4px solid #9c27b0; }
    .stat-card.students { border-left: 4px solid #ff9800; }
    .stat-card.teachers { border-left: 4px solid #e91e63; }
    .stat-card.aov { border-left: 4px solid #00bcd4; }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-info h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      color: #333;
    }

    .stat-info p {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }

    .stat-info small {
      color: #999;
      font-size: 0.75rem;
    }

    /* Quick Actions */
    .quick-actions {
      margin-top: 2rem;
    }

    .quick-actions h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      color: #333;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem;
      border: 2px solid #eee;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      border-color: #108092;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.15);
    }

    .action-icon {
      font-size: 2rem;
    }

    .action-label {
      font-weight: 600;
      color: #333;
    }

    .action-desc {
      font-size: 0.875rem;
      color: #666;
    }

    /* Filters */
    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-input {
      padding: 0.75rem 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      min-width: 250px;
      font-size: 0.95rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #108092;
    }

    .sort-select {
      padding: 0.75rem 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 0.95rem;
      cursor: pointer;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    /* Tables */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .data-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #555;
      font-size: 0.875rem;
    }

    .data-table tr:hover {
      background: #f8f9fa;
    }

    .data-table tr.editing {
      background: #e3f2fd;
    }

    .data-table tr.inactive {
      opacity: 0.6;
    }

    .subject-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .subject-icon {
      font-size: 1.2rem;
    }

    .price-cell {
      font-weight: 600;
    }

    .price.tutoring {
      color: #108092;
    }

    .not-set {
      color: #999;
      font-style: italic;
    }

    .edit-input {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .edit-input input {
      width: 80px;
      padding: 0.5rem;
      border: 1px solid #108092;
      border-radius: 4px;
    }

    .edit-input .currency,
    .edit-input .unit {
      color: #666;
      font-size: 0.875rem;
    }

    .center {
      text-align: center;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge.enabled,
    .status-badge.active {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-badge.disabled,
    .status-badge.inactive {
      background: #ffebee;
      color: #c62828;
    }

    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      background: #f0f0f0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #e0e0e0;
    }

    .btn-icon.save:hover {
      background: #e8f5e9;
    }

    .btn-icon.cancel:hover {
      background: #ffebee;
    }

    /* Priority */
    .priority-cell {
      width: 120px;
    }

    .priority-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .priority-badge.high {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .priority-badge.medium {
      background: #fff3e0;
      color: #ef6c00;
    }

    .priority-badge.low {
      background: #ffebee;
      color: #c62828;
    }

    .priority-edit {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .priority-slider {
      width: 80px;
    }

    .priority-value {
      font-weight: 600;
      min-width: 20px;
    }

    .subjects-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .subject-tag {
      padding: 0.125rem 0.5rem;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 12px;
      font-size: 0.75rem;
    }

    .rating {
      color: #ff9800;
      font-weight: 500;
    }

    /* Discounts */
    .discounts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .discount-card {
      background: white;
      border: 1px solid #eee;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .discount-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .discount-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .discount-icon {
      font-size: 1.5rem;
    }

    .discount-title h3 {
      margin: 0;
      font-size: 1.1rem;
    }

    .discount-desc {
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .discount-value,
    .hours-tiers,
    .subjects-tiers {
      margin-bottom: 1rem;
    }

    .tier {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .tier-label {
      color: #666;
    }

    .tier-value {
      color: #999;
      font-size: 0.875rem;
    }

    .input-group {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .input-group input {
      width: 60px;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-align: center;
    }

    .input-group input:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }

    .input-group .unit {
      color: #666;
    }

    .discount-example {
      background: #f8f9fa;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    /* Toggle Switch */
    .toggle {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 24px;
    }

    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.4s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }

    .toggle input:checked + .slider {
      background-color: #108092;
    }

    .toggle input:checked + .slider:before {
      transform: translateX(24px);
    }

    /* Buttons */
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #108092;
      color: white;
    }

    .btn-primary:hover {
      background: #0d6a78;
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn-save {
      background: #4caf50;
      color: white;
    }

    .btn-save:hover {
      background: #388e3c;
    }

    .btn-save:disabled {
      background: #ccc;
    }

    /* Info Box */
    .info-box {
      display: flex;
      gap: 1rem;
      background: #e3f2fd;
      border-radius: 12px;
      padding: 1rem;
      margin-top: 1.5rem;
    }

    .info-icon {
      font-size: 1.5rem;
    }

    .info-content h4 {
      margin: 0 0 0.5rem 0;
      color: #1565c0;
    }

    .info-content ul {
      margin: 0;
      padding-left: 1.25rem;
      color: #555;
    }

    .info-content li {
      margin-bottom: 0.25rem;
    }

    /* Warning Box */
    .warning-box {
      display: flex;
      gap: 1rem;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }

    .warning-icon {
      font-size: 1.5rem;
      color: #ff9800;
    }

    .warning-content {
      flex: 1;
    }

    .warning-content strong {
      color: #f57c00;
      display: block;
      margin-bottom: 0.5rem;
    }

    .warning-content p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
      color: #666;
    }

    .warning-content code {
      background: #fff;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #d32f2f;
      border: 1px solid #ffcdd2;
    }

    /* Period Selector */
    .period-selector {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .period-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      background: white;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .period-btn:hover {
      border-color: #108092;
    }

    .period-btn.active {
      background: #108092;
      color: white;
      border-color: #108092;
    }

    /* Reports Tab Styles */
    .reports-tab .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .reports-tab .header-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn-outline {
      background: white;
      border: 1px solid #ddd;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .btn-outline:hover {
      border-color: #108092;
      color: #108092;
    }

    .report-filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-input {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .report-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 12px;
      background: white;
      border: 1px solid #eee;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .summary-card.revenue { border-left: 4px solid #4caf50; }
    .summary-card.orders { border-left: 4px solid #2196f3; }
    .summary-card.sessions { border-left: 4px solid #9c27b0; }
    .summary-card.aov { border-left: 4px solid #ff9800; }

    .summary-icon { font-size: 2rem; }

    .summary-info h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      color: #333;
    }

    .summary-info p {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }

    .growth {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
    }

    .growth.positive { background: #e8f5e9; color: #2e7d32; }
    .growth.negative { background: #ffebee; color: #c62828; }

    .sub-stats {
      font-size: 0.75rem;
      color: #888;
    }

    .charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .chart-card {
      background: white;
      border: 1px solid #eee;
      border-radius: 12px;
      padding: 1.25rem;
    }

    .chart-card.small { min-width: 250px; }

    .chart-card h3 {
      font-size: 1rem;
      margin: 0 0 1rem 0;
      color: #333;
    }

    .bar-item { margin-bottom: 0.75rem; }

    .bar-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    .subject-name { color: #333; }
    .subject-value { color: #4caf50; font-weight: 600; }

    .bar-track {
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #108092 0%, #4caf50 100%);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .bar-percent { font-size: 0.75rem; color: #888; }

    .trends-chart {
      height: 200px;
      display: flex;
      flex-direction: column;
    }

    .trend-header { margin-bottom: 0.5rem; }
    .trend-label { font-size: 0.75rem; color: #888; }

    .trend-bars {
      flex: 1;
      display: flex;
      align-items: flex-end;
      gap: 4px;
      padding-bottom: 1.5rem;
    }

    .trend-bar-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }

    .trend-bar {
      width: 100%;
      max-width: 24px;
      background: linear-gradient(180deg, #108092 0%, #4caf50 100%);
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: height 0.3s ease;
    }

    .trend-day { font-size: 0.625rem; color: #888; margin-top: 0.25rem; }

    .donut-chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .donut-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      background: linear-gradient(135deg, #108092 0%, #4caf50 100%);
      border-radius: 50%;
      color: white;
    }

    .donut-total { font-size: 1.5rem; font-weight: 700; }
    .donut-label { font-size: 0.75rem; opacity: 0.9; }
    .donut-legend { width: 100%; }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .legend-color { width: 12px; height: 12px; border-radius: 3px; }
    .legend-color.one-to-one { background: #108092; }
    .legend-color.group { background: #4caf50; }
    .legend-text { flex: 1; font-size: 0.875rem; }
    .legend-percent { font-size: 0.875rem; font-weight: 600; color: #666; }

    .peak-hours, .peak-days {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .peak-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 8px;
      background: #f8f9fa;
    }

    .peak-item.top { background: #e8f5e9; }

    .peak-rank {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #108092;
      color: white;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .peak-time, .peak-day { min-width: 60px; font-size: 0.875rem; }

    .peak-bar {
      flex: 1;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .peak-fill { height: 100%; background: #108092; border-radius: 4px; }
    .peak-fill.day { background: #4caf50; }
    .peak-count { font-size: 0.75rem; color: #666; min-width: 30px; text-align: right; }

    .performance-section { margin-bottom: 1.5rem; }
    .performance-section h3 { font-size: 1.125rem; margin: 0 0 1rem 0; }

    .performance-table { width: 100%; border-collapse: collapse; }

    .performance-table th,
    .performance-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .performance-table th {
      background: #f8f9fa;
      font-weight: 600;
      font-size: 0.875rem;
      color: #555;
    }

    .performance-table td.center { text-align: center; }
    .performance-table td.success { color: #2e7d32; }
    .performance-table td.danger { color: #c62828; }

    .teacher-name { font-weight: 500; }

    .rating-badge {
      background: #fff3e0;
      padding: 0.25rem 0.5rem;
      border-radius: 10px;
      font-size: 0.75rem;
    }

    .completion-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 100px;
    }

    .completion-fill {
      height: 8px;
      background: #4caf50;
      border-radius: 4px;
      flex: 1;
    }

    .completion-text { font-size: 0.75rem; color: #666; }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .stats-card {
      background: white;
      border: 1px solid #eee;
      border-radius: 12px;
      padding: 1.25rem;
    }

    .stats-card h3 { font-size: 1rem; margin: 0 0 1rem 0; }

    .engagement-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .engagement-item {
      text-align: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .engagement-item.new { background: #e8f5e9; }
    .engagement-item.returning { background: #e3f2fd; }
    .engagement-item.avg { background: #fff3e0; }

    .engagement-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
    }

    .engagement-label { font-size: 0.75rem; color: #666; }

    .top-subjects h4 { font-size: 0.875rem; margin: 0 0 0.75rem 0; color: #555; }

    .subject-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .subject-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .subject-rank {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #108092;
      color: white;
      border-radius: 50%;
      font-size: 0.75rem;
    }

    .subject-item .subject-name { flex: 1; }
    .subject-count { font-size: 0.75rem; color: #888; }

    .stats-card.cancellation { border-left: 4px solid #f44336; }

    .cancel-summary {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .cancel-rate, .cancel-total {
      flex: 1;
      text-align: center;
      padding: 1rem;
      background: #ffebee;
      border-radius: 8px;
    }

    .rate-value, .total-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #c62828;
    }

    .rate-label, .total-label { font-size: 0.75rem; color: #666; }

    .cancel-breakdown {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .cancel-item {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .cancel-icon { font-size: 1.25rem; }
    .cancel-label { flex: 1; font-size: 0.875rem; }
    .cancel-value { font-weight: 600; }

    .refund-amount {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem;
      background: #fff3e0;
      border-radius: 8px;
    }

    .refund-label { color: #666; }
    .refund-value { font-weight: 700; color: #ff9800; }

    .no-data {
      text-align: center;
      padding: 2rem;
      color: #888;
      font-style: italic;
    }

    /* Loading */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #108092;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .tabs-container {
        flex-wrap: nowrap;
        overflow-x: auto;
      }

      .tab-btn {
        padding: 0.5rem 1rem;
      }

      .tab-label {
        display: none;
      }

      .filters {
        flex-direction: column;
      }

      .search-input {
        width: 100%;
        min-width: auto;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminTutoringDashboardComponent implements OnInit {
  // Tabs
  tabs = [
    { id: 'overview' as TabType, icon: '📈', label: 'Overview' },
    { id: 'pricing' as TabType, icon: '💰', label: 'Pricing' },
    { id: 'teachers' as TabType, icon: '⭐', label: 'Teachers' },
    { id: 'discounts' as TabType, icon: '🎁', label: 'Discounts' },
    { id: 'reports' as TabType, icon: '📊', label: 'Reports' }
  ];

  activeTab = signal<TabType>('overview');

  // Stats
  stats: TutoringStats = {
    totalRevenue: 125000,
    totalOrders: 342,
    totalSessions: 1250,
    completedSessions: 980,
    activeStudents: 156,
    activeTeachers: 28,
    averageOrderValue: 365.50
  };

  // Pricing
  subjects: SubjectPricing[] = [];
  filteredSubjects: SubjectPricing[] = [];
  pricingSearch = '';
  showOnlyTutoringEnabled = false;
  loadingPricing = signal(false);
  loadingStats = signal(false);
  saving = signal(false);

  // Teachers
  teachers: TeacherWithPriority[] = [];
  filteredTeachers: TeacherWithPriority[] = [];
  teacherSearch = '';
  teacherSort = 'priority-desc';
  loadingTeachers = signal(false);

  // Discounts
  groupDiscount: DiscountRule = {
    id: 'group',
    name: 'Group Tutoring',
    type: 'group',
    percentage: 35,
    condition: 'Group tutoring sessions',
    isActive: true
  };

  hoursDiscount: DiscountRule = {
    id: 'hours',
    name: 'Hours Package',
    type: 'hours',
    percentage: 0,
    condition: 'Based on hours booked',
    isActive: true
  };

  hoursDiscountTiers = {
    tier20: 5,
    tier30: 10
  };

  multiSubjectDiscount: DiscountRule = {
    id: 'multiSubject',
    name: 'Multiple Subjects',
    type: 'multiSubject',
    percentage: 0,
    condition: 'Multiple subjects booked',
    isActive: true
  };

  multiSubjectTiers = {
    tier2: 5,
    tier3: 10,
    tier4: 15,
    tier5: 20
  };

  multiStudentsDiscount: DiscountRule = {
    id: 'multiStudents',
    name: 'Multiple Students',
    type: 'group', // reuse type since interface doesn't have multiStudents
    percentage: 0,
    condition: 'Multiple students registered',
    isActive: true
  };

  multiStudentsTiers = {
    tier2: 5,
    tier3: 10,
    tier4: 15,
    max: 20
  };

  // Reports
  reportPeriods = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'];
  selectedPeriod = 'This Month';
  loadingReports = signal(false);
  reportStartDate = '';
  reportEndDate = '';

  // Math for template
  Math = Math;

  // Report Data
  reportData: AdvancedReportData = {
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      totalSessions: 0,
      completedSessions: 0,
      cancelledSessions: 0,
      pendingSessions: 0,
      averageOrderValue: 0,
      revenueGrowth: 0,
      bookingGrowth: 0
    },
    revenueBySubject: [],
    teacherPerformance: [],
    bookingTrends: [],
    studentEngagement: {
      totalStudents: 0,
      newStudents: 0,
      returningStudents: 0,
      avgSessionsPerStudent: 0,
      topSubjects: []
    },
    sessionTypeDistribution: {
      oneToOne: 0,
      group: 0,
      total: 0
    },
    cancellationStats: {
      total: 0,
      byStudent: 0,
      byTeacher: 0,
      refundAmount: 0,
      cancellationRate: 0
    },
    peakHours: [],
    peakDays: []
  };

  constructor(
    private subjectService: SubjectService,
    private tutoringService: TutoringService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Load real data from APIs
    this.loadStatistics();
    this.loadPricing();
    this.loadTeachers();
    this.loadDiscountRules();
  }

  // Statistics Methods
  loadStatistics(): void {
    this.loadingStats.set(true);
    this.tutoringService.getTutoringStats().subscribe({
      next: (data: TutoringStats) => {
        this.stats = data;
        this.loadingStats.set(false);
        console.log('✅ Loaded tutoring statistics:', data);
      },
      error: (err: any) => {
        console.error('❌ Error loading statistics:', err);
        this.loadingStats.set(false);
        this.toastService.showError('Failed to load statistics');
        // Keep mock data for display
      }
    });
  }

  // Pricing Methods
  loadPricing(): void {
    this.loadingPricing.set(true);
    this.subjectService.getAllSubjects().subscribe({
      next: (response: any) => {
        const data = response.data || response.items || response || [];

        if (!Array.isArray(data) || data.length === 0) {
          console.warn('⚠️ No subjects data returned from API');
          this.toastService.showWarning('No subjects found');
          this.subjects = [];
          this.filterPricing();
          this.loadingPricing.set(false);
          return;
        }

        this.subjects = data.map((s: any) => ({
          id: s.id,
          subjectName: s.subjectName || s.name || 'Unknown',
          categoryName: s.categoryName || 'General',
          selfLearningPrice: Number(s.price) || 0,
          tutoringPricePerHour: s.tutoringPricePerHour !== null && s.tutoringPricePerHour !== undefined ? Number(s.tutoringPricePerHour) : null,
          isAvailableForTutoring: s.tutoringPricePerHour !== null && s.tutoringPricePerHour !== undefined && s.tutoringPricePerHour > 0,
          isEditing: false
        }));

        this.filterPricing();
        this.loadingPricing.set(false);
        console.log('✅ Loaded subjects:', this.subjects.length);
      },
      error: (err: any) => {
        console.error('❌ Error loading subjects:', err);
        this.loadingPricing.set(false);
        this.subjects = [];
        this.filterPricing();
        this.toastService.showError('Failed to load subjects. Please check backend connection.');
      }
    });
  }

  filterPricing(): void {
    this.filteredSubjects = this.subjects.filter(s => {
      const matchesSearch = !this.pricingSearch ||
        s.subjectName.toLowerCase().includes(this.pricingSearch.toLowerCase()) ||
        s.categoryName.toLowerCase().includes(this.pricingSearch.toLowerCase());
      const matchesTutoring = !this.showOnlyTutoringEnabled || s.isAvailableForTutoring;
      return matchesSearch && matchesTutoring;
    });
  }

  editPricing(subject: SubjectPricing): void {
    subject.isEditing = true;
    subject.newTutoringPrice = subject.tutoringPricePerHour || undefined;
  }

  savePricing(subject: SubjectPricing): void {
    const newPrice = subject.newTutoringPrice !== undefined ? subject.newTutoringPrice : null;

    this.subjectService.updateTutoringPrice(subject.id, newPrice).subscribe({
      next: (response: any) => {
        subject.tutoringPricePerHour = newPrice;
        subject.isAvailableForTutoring = newPrice !== null && newPrice > 0;
        subject.isEditing = false;
        this.toastService.showSuccess(`Pricing updated for ${subject.subjectName}`);
        this.filterPricing();
        console.log('✅ Tutoring price updated:', response);
      },
      error: (err: any) => {
        console.error('❌ Error updating tutoring price:', err);
        subject.isEditing = false;
        this.toastService.showError('Failed to update tutoring price');
      }
    });
  }

  cancelPricingEdit(subject: SubjectPricing): void {
    subject.isEditing = false;
    subject.newTutoringPrice = undefined;
  }

  hasPricingChanges(): boolean {
    return this.subjects.some(s => s.isEditing);
  }

  saveAllPricing(): void {
    this.saving.set(true);
    const editedSubjects = this.subjects.filter(s => s.isEditing);

    if (editedSubjects.length === 0) {
      this.saving.set(false);
      return;
    }

    // Create array of update observables
    const updateRequests = editedSubjects.map(subject => {
      const newPrice = subject.newTutoringPrice !== undefined ? subject.newTutoringPrice : null;
      return this.subjectService.updateTutoringPrice(subject.id, newPrice);
    });

    // Execute all updates in parallel
    forkJoin(updateRequests).subscribe({
      next: (responses: any[]) => {
        // Update all subjects with new values
        editedSubjects.forEach((subject, index) => {
          const newPrice = subject.newTutoringPrice !== undefined ? subject.newTutoringPrice : null;
          subject.tutoringPricePerHour = newPrice;
          subject.isAvailableForTutoring = newPrice !== null && newPrice > 0;
          subject.isEditing = false;
        });

        this.saving.set(false);
        this.toastService.showSuccess(`Successfully updated ${editedSubjects.length} subject(s)`);
        this.filterPricing();
        console.log('✅ All pricing changes saved');
      },
      error: (err: any) => {
        console.error('❌ Error saving pricing:', err);
        this.saving.set(false);
        this.toastService.showError('Failed to save some pricing changes');

        // Reset editing state for all subjects
        editedSubjects.forEach(subject => {
          subject.isEditing = false;
        });
      }
    });
  }

  // Teachers Methods
  loadTeachers(): void {
    this.loadingTeachers.set(true);

    // Using TutoringService to get teachers with priority
    this.tutoringService.getTeachersWithPriority('priority', 'desc', 1, 100).subscribe({
      next: (response: any) => {
        const data = response.data || response.items || response.teachers || [];

        if (!Array.isArray(data) || data.length === 0) {
          console.warn('⚠️ No teachers data returned from API');
          this.toastService.showWarning('No teachers found');
          this.teachers = [];
          this.filterTeachers();
          this.loadingTeachers.set(false);
          return;
        }

        this.teachers = data.map((t: any) => ({
          id: t.id,
          name: t.name || t.fullName || 'Unknown',
          email: t.email || '',
          priority: t.priority || 5,
          subjects: t.subjects || [],
          isActive: t.isActive !== undefined ? t.isActive : true,
          totalBookings: t.totalBookings || 0,
          avgRating: t.avgRating || 0
        }));

        this.filterTeachers();
        this.loadingTeachers.set(false);
        console.log('✅ Loaded teachers:', this.teachers.length);
      },
      error: (err: any) => {
        console.error('❌ Error loading teachers:', err);
        this.loadingTeachers.set(false);
        this.teachers = [];
        this.filterTeachers();
        this.toastService.showError('Failed to load teachers. Please check backend connection.');
      }
    });
  }

  filterTeachers(): void {
    this.filteredTeachers = this.teachers.filter(t => {
      return !this.teacherSearch ||
        t.name.toLowerCase().includes(this.teacherSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(this.teacherSearch.toLowerCase());
    });
    this.sortTeachers();
  }

  sortTeachers(): void {
    const [field, direction] = this.teacherSort.split('-');
    this.filteredTeachers.sort((a, b) => {
      let comparison = 0;
      if (field === 'priority') {
        comparison = a.priority - b.priority;
      } else if (field === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (field === 'rating') {
        comparison = a.avgRating - b.avgRating;
      }
      return direction === 'desc' ? -comparison : comparison;
    });
  }

  editTeacher(teacher: TeacherWithPriority): void {
    teacher.isEditing = true;
    teacher.newPriority = teacher.priority;
  }

  saveTeacher(teacher: TeacherWithPriority): void {
    const newPriority = teacher.newPriority || teacher.priority;

    this.tutoringService.updateTeacherPriority(teacher.id, newPriority).subscribe({
      next: () => {
        teacher.priority = newPriority;
        teacher.isEditing = false;
        this.toastService.showSuccess(`Priority updated for ${teacher.name}`);
        this.sortTeachers();
      },
      error: (err: any) => {
        console.error('❌ Error updating teacher priority:', err);
        teacher.isEditing = false;
        this.toastService.showError('Failed to update teacher priority');
      }
    });
  }

  cancelTeacherEdit(teacher: TeacherWithPriority): void {
    teacher.isEditing = false;
    teacher.newPriority = undefined;
  }

  getPriorityClass(priority: number): string {
    if (priority >= 8) return 'high';
    if (priority >= 5) return 'medium';
    return 'low';
  }

  // Discounts Methods
  loadDiscountRules(): void {
    this.tutoringService.getDiscountRules().subscribe({
      next: (response: any) => {
        const data = response.data || response;

        if (data.groupDiscount) {
          this.groupDiscount.isActive = data.groupDiscount.isActive;
          this.groupDiscount.percentage = data.groupDiscount.percentage;
        }

        if (data.hoursDiscount) {
          this.hoursDiscount.isActive = data.hoursDiscount.isActive;
          if (data.hoursDiscount.tiers) {
            this.hoursDiscountTiers.tier20 = data.hoursDiscount.tiers.hours20 || 5;
            this.hoursDiscountTiers.tier30 = data.hoursDiscount.tiers.hours30 || 10;
          }
        }

        if (data.multiSubjectDiscount) {
          this.multiSubjectDiscount.isActive = data.multiSubjectDiscount.isActive;
          if (data.multiSubjectDiscount.tiers) {
            this.multiSubjectTiers.tier2 = data.multiSubjectDiscount.tiers.subjects2 || 5;
            this.multiSubjectTiers.tier3 = data.multiSubjectDiscount.tiers.subjects3 || 10;
            this.multiSubjectTiers.tier4 = data.multiSubjectDiscount.tiers.subjects4 || 15;
            this.multiSubjectTiers.tier5 = data.multiSubjectDiscount.tiers.subjects5 || 20;
          }
        }

        if (data.multiStudentsDiscount) {
          this.multiStudentsDiscount.isActive = data.multiStudentsDiscount.isActive;
          if (data.multiStudentsDiscount.tiers) {
            this.multiStudentsTiers.tier2 = data.multiStudentsDiscount.tiers.students2 || 5;
            this.multiStudentsTiers.tier3 = data.multiStudentsDiscount.tiers.students3 || 10;
            this.multiStudentsTiers.tier4 = data.multiStudentsDiscount.tiers.students4 || 15;
            this.multiStudentsTiers.max = data.multiStudentsDiscount.tiers.maxPercentage || 20;
          }
        }

        console.log('✅ Loaded discount rules:', data);
      },
      error: (err: any) => {
        console.error('❌ Error loading discount rules:', err);
        // Keep default values on error
      }
    });
  }

  saveDiscountRule(rule: DiscountRule): void {
    // Build the request body based on the discount rules structure
    const discountRules = {
      groupDiscount: {
        isActive: this.groupDiscount.isActive,
        percentage: this.groupDiscount.percentage
      },
      hoursDiscount: {
        isActive: this.hoursDiscount.isActive,
        tiers: {
          hours20: this.hoursDiscountTiers.tier20,
          hours30: this.hoursDiscountTiers.tier30
        }
      },
      multiSubjectDiscount: {
        isActive: this.multiSubjectDiscount.isActive,
        tiers: {
          subjects2: this.multiSubjectTiers.tier2,
          subjects3: this.multiSubjectTiers.tier3,
          subjects4: this.multiSubjectTiers.tier4,
          subjects5: this.multiSubjectTiers.tier5
        }
      },
      multiStudentsDiscount: {
        isActive: this.multiStudentsDiscount.isActive,
        tiers: {
          students2: this.multiStudentsTiers.tier2,
          students3: this.multiStudentsTiers.tier3,
          students4: this.multiStudentsTiers.tier4,
          maxPercentage: this.multiStudentsTiers.max
        }
      }
    };

    this.tutoringService.updateDiscountRules(discountRules).subscribe({
      next: (response: any) => {
        this.toastService.showSuccess(`Discount rules updated successfully!`);
        console.log('✅ Discount rules saved:', response);
      },
      error: (err: any) => {
        console.error('❌ Error saving discount rules:', err);
        this.toastService.showError('Failed to save discount rules');
      }
    });
  }

  saveMultiStudentsDiscount(): void {
    // Just call saveDiscountRule which includes all discounts including multiStudents
    this.saveDiscountRule(this.multiStudentsDiscount);
  }

  // Reports Methods
  loadReports(): void {
    this.loadingReports.set(true);

    // Calculate date range based on selected period
    const { startDate, endDate } = this.getDateRange(this.selectedPeriod);

    // ✅ Use real API
    this.tutoringService.getTutoringReports(startDate, endDate, this.selectedPeriod).subscribe({
      next: (response: any) => {
        const data = response.data || response;
        this.reportData = data;
        this.loadingReports.set(false);
        console.log('✅ Loaded report data for period:', this.selectedPeriod, data);
      },
      error: (err: any) => {
        console.error('❌ Error loading reports:', err);
        this.loadingReports.set(false);
        this.toastService.showError('Failed to load reports');

        // Keep empty state for error
        this.reportData = this.getEmptyReportData();
      }
    });
  }

  loadReportsCustomDate(): void {
    if (!this.reportStartDate || !this.reportEndDate) {
      this.toastService.showWarning('Please select both start and end dates');
      return;
    }

    this.loadingReports.set(true);
    this.selectedPeriod = 'Custom';

    // ✅ Use real API with custom dates
    this.tutoringService.getTutoringReports(this.reportStartDate, this.reportEndDate).subscribe({
      next: (response: any) => {
        const data = response.data || response;
        this.reportData = data;
        this.loadingReports.set(false);
        console.log('✅ Loaded custom date report:', data);
      },
      error: (err: any) => {
        console.error('❌ Error loading custom date report:', err);
        this.loadingReports.set(false);
        this.toastService.showError('Failed to load reports');
        this.reportData = this.getEmptyReportData();
      }
    });
  }

  getEmptyReportData(): AdvancedReportData {
    return {
      summary: {
        totalRevenue: 0,
        totalOrders: 0,
        totalSessions: 0,
        completedSessions: 0,
        cancelledSessions: 0,
        pendingSessions: 0,
        averageOrderValue: 0,
        revenueGrowth: 0,
        bookingGrowth: 0
      },
      revenueBySubject: [],
      teacherPerformance: [],
      bookingTrends: [],
      studentEngagement: {
        totalStudents: 0,
        newStudents: 0,
        returningStudents: 0,
        avgSessionsPerStudent: 0,
        topSubjects: []
      },
      sessionTypeDistribution: {
        oneToOne: 0,
        group: 0,
        total: 0
      },
      cancellationStats: {
        total: 0,
        byStudent: 0,
        byTeacher: 0,
        refundAmount: 0,
        cancellationRate: 0
      },
      peakHours: [],
      peakDays: []
    };
  }

  getDateRange(period: string): { startDate: string; endDate: string } {
    const now = new Date();
    let startDate = new Date();
    const endDate = now.toISOString().split('T')[0];

    switch (period) {
      case 'Today':
        startDate = now;
        break;
      case 'This Week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'This Month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'This Quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'This Year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate
    };
  }

  // Report Helper Methods
  getBarHeight(bookings: number): number {
    const max = Math.max(...this.reportData.bookingTrends.map(t => t.bookings));
    return max > 0 ? (bookings / max) * 100 : 0;
  }

  getSessionPercent(type: 'oneToOne' | 'group'): string {
    const total = this.reportData.sessionTypeDistribution.total;
    if (total === 0) return '0';
    const value = this.reportData.sessionTypeDistribution[type];
    return ((value / total) * 100).toFixed(1);
  }

  getPeakPercent(bookings: number): number {
    const max = Math.max(...this.reportData.peakHours.map(h => h.bookings));
    return max > 0 ? (bookings / max) * 100 : 0;
  }

  getDayPercent(bookings: number): number {
    const max = Math.max(...this.reportData.peakDays.map(d => d.bookings));
    return max > 0 ? (bookings / max) * 100 : 0;
  }

  formatHour(hour: number): string {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${suffix}`;
  }

  exportReport(format: 'pdf' | 'excel'): void {
    const { startDate, endDate } = this.getDateRange(this.selectedPeriod);

    this.toastService.showInfo(`Preparing ${format.toUpperCase()} export...`);

    this.tutoringService.exportReports(format, startDate, endDate, 'summary,revenue,teachers,students').subscribe({
      next: (blob: Blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tutoring-report-${this.selectedPeriod}-${new Date().getTime()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.toastService.showSuccess(`Report exported successfully!`);
      },
      error: (err: any) => {
        console.error('❌ Error exporting report:', err);
        this.toastService.showError('Failed to export report');
      }
    });
  }
}
