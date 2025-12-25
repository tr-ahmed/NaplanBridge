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
            <h2>📊 Reports & Analytics</h2>
            <p>View detailed tutoring statistics and reports</p>
          </div>

          <!-- Period Selector -->
          <div class="period-selector">
            <button *ngFor="let period of reportPeriods"
                    (click)="selectedPeriod = period; loadReports()"
                    [class.active]="selectedPeriod === period"
                    class="period-btn">
              {{ period }}
            </button>
          </div>

          <!-- Coming Soon -->
          <div class="coming-soon">
            <div class="coming-soon-icon">🚧</div>
            <h3>Detailed Reports Coming Soon</h3>
            <p>Advanced analytics and reporting features are under development.</p>
            <ul>
              <li>Revenue breakdown by subject</li>
              <li>Teacher performance metrics</li>
              <li>Student engagement analytics</li>
              <li>Booking trends and forecasts</li>
            </ul>
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

    /* Coming Soon */
    .coming-soon {
      text-align: center;
      padding: 3rem;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .coming-soon-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .coming-soon h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .coming-soon p {
      color: #666;
      margin-bottom: 1rem;
    }

    .coming-soon ul {
      list-style: none;
      padding: 0;
      color: #888;
    }

    .coming-soon li {
      padding: 0.25rem 0;
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

  // Reports
  reportPeriods = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'];
  selectedPeriod = 'This Month';

  constructor(
    private subjectService: SubjectService,
    private tutoringService: TutoringService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load real data from APIs
    this.loadStatistics();
    this.loadPricing();
    this.loadTeachers();
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
  saveDiscountRule(rule: DiscountRule): void {
    // TODO: Backend endpoint needed - PUT /api/Admin/Tutoring/DiscountRules
    // See: BACKEND_REPORT_TUTORING_ADMIN_DASHBOARD_MISSING_ENDPOINTS.md

    this.toastService.showWarning(
      'Discount rules management: Backend endpoint not available yet'
    );

    /* Once backend is ready:
    this.tutoringService.updateDiscountRule(rule).subscribe({
      next: () => {
        this.toastService.showSuccess(`${rule.name} discount saved!`);
      },
      error: (err: any) => {
        console.error('❌ Error saving discount rule:', err);
        this.toastService.showError('Failed to save discount rule');
      }
    });
    */
  }

  // Reports Methods
  loadReports(): void {
    // TODO: Backend endpoint needed - GET /api/Admin/Tutoring/Reports
    // See: BACKEND_REPORT_TUTORING_ADMIN_DASHBOARD_MISSING_ENDPOINTS.md
    console.log('📊 Reports feature: Backend endpoint not available yet');
    console.log('Selected period:', this.selectedPeriod);
  }
}
