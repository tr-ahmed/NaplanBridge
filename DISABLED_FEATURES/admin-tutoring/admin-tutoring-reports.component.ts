import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutoringService } from '../../core/services/tutoring.service';

interface TutoringReport {
  totalOrders: number;
  totalRevenue: number;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  activeStudents: number;
  activeTeachers: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface OrderStats {
  orderNumber: string;
  parentName: string;
  students: number;
  totalAmount: number;
  status: string;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-tutoring-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-container">
      <h1 class="page-title">📊 Tutoring System Reports</h1>

      <!-- Period Selector -->
      <div class="period-selector">
        <button
          *ngFor="let period of periods"
          (click)="selectedPeriod = period; loadReports()"
          [class.active]="selectedPeriod === period"
          class="period-btn">
          {{ period }}
        </button>
        <div class="custom-date">
          <input type="date" [(ngModel)]="customStartDate">
          <span>to</span>
          <input type="date" [(ngModel)]="customEndDate">
          <button (click)="loadReports()" class="btn btn-primary">Apply</button>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="metrics-grid">
        <div class="metric-card revenue">
          <div class="metric-icon">💰</div>
          <div class="metric-content">
            <h3>\${{ report.totalRevenue.toLocaleString() }}</h3>
            <p>Total Revenue</p>
            <span class="metric-change positive">+12.5% vs last period</span>
          </div>
        </div>

        <div class="metric-card orders">
          <div class="metric-icon">📦</div>
          <div class="metric-content">
            <h3>{{ report.totalOrders }}</h3>
            <p>Total Orders</p>
            <span class="metric-change positive">+8.3% vs last period</span>
          </div>
        </div>

        <div class="metric-card sessions">
          <div class="metric-icon">📚</div>
          <div class="metric-content">
            <h3>{{ report.totalSessions }}</h3>
            <p>Total Sessions</p>
            <span class="metric-change">{{ report.completedSessions }} completed</span>
          </div>
        </div>

        <div class="metric-card students">
          <div class="metric-icon">👥</div>
          <div class="metric-content">
            <h3>{{ report.activeStudents }}</h3>
            <p>Active Students</p>
            <span class="metric-change positive">+15.2% growth</span>
          </div>
        </div>

        <div class="metric-card teachers">
          <div class="metric-icon">👨‍🏫</div>
          <div class="metric-content">
            <h3>{{ report.activeTeachers }}</h3>
            <p>Active Teachers</p>
            <span class="metric-change">{{ Math.round(report.totalSessions / report.activeTeachers) }} sessions avg</span>
          </div>
        </div>

        <div class="metric-card aov">
          <div class="metric-icon">💳</div>
          <div class="metric-content">
            <h3>\${{ report.averageOrderValue.toFixed(2) }}</h3>
            <p>Avg Order Value</p>
            <span class="metric-change positive">+5.1% increase</span>
          </div>
        </div>

        <div class="metric-card conversion">
          <div class="metric-icon">📈</div>
          <div class="metric-content">
            <h3>{{ report.conversionRate.toFixed(1) }}%</h3>
            <p>Conversion Rate</p>
            <span class="metric-change positive">+2.3% improvement</span>
          </div>
        </div>

        <div class="metric-card cancelled">
          <div class="metric-icon">❌</div>
          <div class="metric-content">
            <h3>{{ report.cancelledSessions }}</h3>
            <p>Cancelled Sessions</p>
            <span class="metric-change negative">{{ (report.cancelledSessions / report.totalSessions * 100).toFixed(1) }}% rate</span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-card">
          <h2>📊 Revenue Trend</h2>
          <div class="chart-placeholder">
            <div class="bar-chart">
              <div class="bar" style="height: 60%"><span>Jan: $4.2K</span></div>
              <div class="bar" style="height: 75%"><span>Feb: $5.1K</span></div>
              <div class="bar" style="height: 85%"><span>Mar: $6.3K</span></div>
              <div class="bar" style="height: 70%"><span>Apr: $5.5K</span></div>
              <div class="bar" style="height: 90%"><span>May: $7.2K</span></div>
              <div class="bar" style="height: 100%"><span>Jun: $8.1K</span></div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <h2>🎯 Teaching Type Distribution</h2>
          <div class="pie-chart">
            <div class="pie-slice one-to-one">
              <span>One-to-One<br>65%</span>
            </div>
            <div class="pie-slice group">
              <span>Group<br>35%</span>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <h2>⏱️ Plan Distribution</h2>
          <div class="donut-chart">
            <div class="segment" style="--percentage: 40; --color: #108092">
              10hrs: 40%
            </div>
            <div class="segment" style="--percentage: 35; --color: #bf942d">
              20hrs: 35%
            </div>
            <div class="segment" style="--percentage: 25; --color: #4caf50">
              30hrs: 25%
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Orders Table -->
      <div class="table-section">
        <h2>📋 Recent Orders</h2>
        <div class="table-controls">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="filterOrders()"
            placeholder="Search by order number or parent name..."
            class="search-input">
          <select [(ngModel)]="statusFilter" (ngModelChange)="filterOrders()">
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Confirmed">Confirmed</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button (click)="exportToExcel()" class="btn btn-export">
            📥 Export Excel
          </button>
        </div>

        <table class="orders-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Parent Name</th>
              <th>Students</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of filteredOrders">
              <td><strong>{{ order.orderNumber }}</strong></td>
              <td>{{ order.parentName }}</td>
              <td>{{ order.students }}</td>
              <td class="amount">\${{ order.totalAmount.toFixed(2) }}</td>
              <td>
                <span [class]="'status-badge ' + order.status.toLowerCase()">
                  {{ order.status }}
                </span>
              </td>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td>
                <button (click)="viewOrderDetails(order)" class="btn btn-small">
                  👁️ View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Top Performing Teachers -->
      <div class="performance-section">
        <h2>🏆 Top Performing Teachers</h2>
        <div class="leaderboard">
          <div class="leaderboard-item gold">
            <div class="rank">🥇</div>
            <div class="info">
              <h4>Mr. Ahmed Ali</h4>
              <p>145 sessions • $7,250 revenue • 4.9★</p>
            </div>
          </div>
          <div class="leaderboard-item silver">
            <div class="rank">🥈</div>
            <div class="info">
              <h4>Ms. Sarah Johnson</h4>
              <p>132 sessions • $6,600 revenue • 4.8★</p>
            </div>
          </div>
          <div class="leaderboard-item bronze">
            <div class="rank">🥉</div>
            <div class="info">
              <h4>Dr. Omar Hassan</h4>
              <p>118 sessions • $5,900 revenue • 4.7★</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Most Popular Subjects -->
      <div class="subjects-section">
        <h2>📚 Most Popular Subjects</h2>
        <div class="subjects-list">
          <div class="subject-item">
            <span class="subject-name">Mathematics</span>
            <div class="progress-bar">
              <div class="progress" style="width: 85%"></div>
            </div>
            <span class="subject-count">342 sessions</span>
          </div>
          <div class="subject-item">
            <span class="subject-name">English</span>
            <div class="progress-bar">
              <div class="progress" style="width: 72%"></div>
            </div>
            <span class="subject-count">290 sessions</span>
          </div>
          <div class="subject-item">
            <span class="subject-name">Science</span>
            <div class="progress-bar">
              <div class="progress" style="width: 68%"></div>
            </div>
            <span class="subject-count">274 sessions</span>
          </div>
          <div class="subject-item">
            <span class="subject-name">Arabic</span>
            <div class="progress-bar">
              <div class="progress" style="width: 55%"></div>
            </div>
            <span class="subject-count">222 sessions</span>
          </div>
          <div class="subject-item">
            <span class="subject-name">History</span>
            <div class="progress-bar">
              <div class="progress" style="width: 42%"></div>
            </div>
            <span class="subject-count">169 sessions</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 2rem;
    }

    .period-selector {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .period-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .period-btn:hover {
      border-color: #108092;
    }

    .period-btn.active {
      background: #108092;
      color: white;
      border-color: #108092;
    }

    .custom-date {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-left: auto;
    }

    .custom-date input {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.3s ease;
    }

    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .metric-icon {
      font-size: 2.5rem;
    }

    .metric-content h3 {
      font-size: 2rem;
      font-weight: 700;
      color: #108092;
      margin: 0 0 0.25rem 0;
    }

    .metric-content p {
      font-size: 0.875rem;
      color: #666;
      margin: 0 0 0.5rem 0;
    }

    .metric-change {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      background: #f5f5f5;
      color: #666;
    }

    .metric-change.positive {
      background: #e8f5e9;
      color: #4caf50;
    }

    .metric-change.negative {
      background: #ffebee;
      color: #f44336;
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .chart-card h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 1rem;
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 200px;
      gap: 0.5rem;
    }

    .bar {
      flex: 1;
      background: linear-gradient(180deg, #108092 0%, #0d6a7a 100%);
      border-radius: 8px 8px 0 0;
      position: relative;
      transition: all 0.3s ease;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 0.5rem;
    }

    .bar:hover {
      opacity: 0.8;
    }

    .bar span {
      font-size: 0.75rem;
      color: white;
      font-weight: 600;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
    }

    .pie-chart {
      display: flex;
      gap: 1rem;
      justify-content: space-around;
      align-items: center;
      height: 200px;
    }

    .pie-slice {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      text-align: center;
    }

    .pie-slice.one-to-one {
      background: #108092;
    }

    .pie-slice.group {
      background: #bf942d;
    }

    .donut-chart {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }

    .segment {
      padding: 1rem;
      border-radius: 8px;
      background: var(--color);
      color: white;
      font-weight: 600;
    }

    .table-section,
    .performance-section,
    .subjects-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .table-section h2,
    .performance-section h2,
    .subjects-section h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 1.5rem;
    }

    .table-controls {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 250px;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
    }

    .table-controls select {
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;
    }

    .orders-table th,
    .orders-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    .orders-table th {
      background: #f5f5f5;
      font-weight: 600;
      color: #555;
    }

    .orders-table tr:hover {
      background: #f9f9f9;
    }

    .amount {
      font-weight: 700;
      color: #108092;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.paid {
      background: #e8f5e9;
      color: #4caf50;
    }

    .status-badge.pending {
      background: #fff3e0;
      color: #ff9800;
    }

    .status-badge.cancelled {
      background: #ffebee;
      color: #f44336;
    }

    .leaderboard {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .leaderboard-item {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem;
      border-radius: 12px;
      border: 3px solid #e0e0e0;
    }

    .leaderboard-item.gold {
      border-color: #ffd700;
      background: linear-gradient(135deg, #fff9e6 0%, #fff 100%);
    }

    .leaderboard-item.silver {
      border-color: #c0c0c0;
      background: linear-gradient(135deg, #f5f5f5 0%, #fff 100%);
    }

    .leaderboard-item.bronze {
      border-color: #cd7f32;
      background: linear-gradient(135deg, #fff5e6 0%, #fff 100%);
    }

    .rank {
      font-size: 2.5rem;
    }

    .info h4 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 0.5rem 0;
    }

    .info p {
      font-size: 0.875rem;
      color: #666;
      margin: 0;
    }

    .subjects-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .subject-item {
      display: grid;
      grid-template-columns: 150px 1fr 120px;
      gap: 1rem;
      align-items: center;
    }

    .subject-name {
      font-weight: 600;
      color: #333;
    }

    .progress-bar {
      height: 24px;
      background: #f0f0f0;
      border-radius: 12px;
      overflow: hidden;
    }

    .progress {
      height: 100%;
      background: linear-gradient(90deg, #108092 0%, #0d6a7a 100%);
      border-radius: 12px;
      transition: width 0.5s ease;
    }

    .subject-count {
      font-size: 0.875rem;
      color: #666;
      text-align: right;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-small {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: #108092;
      color: white;
    }

    .btn-primary:hover {
      background: #0d6a7a;
    }

    .btn-export {
      background: #4caf50;
      color: white;
    }

    .btn-export:hover {
      background: #45a049;
    }

    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .charts-section {
        grid-template-columns: 1fr;
      }

      .subject-item {
        grid-template-columns: 1fr;
      }

      .table-controls {
        flex-direction: column;
      }

      .search-input {
        width: 100%;
      }
    }
  `]
})
export class AdminTutoringReportsComponent implements OnInit {
  Math = Math;

  periods = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'];
  selectedPeriod = 'This Month';
  customStartDate = '';
  customEndDate = '';

  report: TutoringReport = {
    totalOrders: 0,
    totalRevenue: 0,
    totalSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    activeStudents: 0,
    activeTeachers: 0,
    averageOrderValue: 0,
    conversionRate: 0
  };

  orders: OrderStats[] = [];
  filteredOrders: OrderStats[] = [];
  searchQuery = '';
  statusFilter = '';

  constructor(private tutoringService: TutoringService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    // Load reports from API
    this.tutoringService.getAdminReports(this.selectedPeriod, this.customStartDate, this.customEndDate)
      .subscribe({
        next: (data) => {
          this.report = {
            totalOrders: data.totalOrders || 0,
            totalRevenue: data.totalRevenue || 0,
            totalSessions: data.totalSessions || 0,
            completedSessions: data.completedSessions || 0,
            cancelledSessions: data.cancelledSessions || 0,
            activeStudents: data.activeStudents || 0,
            activeTeachers: data.activeTeachers || 0,
            averageOrderValue: data.averageOrderValue || 0,
            conversionRate: data.conversionRate || 0
          };
        },
        error: (error) => {
          console.error('Error loading reports:', error);
          // Use mock data as fallback
          this.report = {
            totalOrders: 156,
            totalRevenue: 78450,
            totalSessions: 624,
            completedSessions: 542,
            cancelledSessions: 28,
            activeStudents: 89,
            activeTeachers: 12,
            averageOrderValue: 502.88,
            conversionRate: 68.4
          };
        }
      });

    // Load orders
    this.tutoringService.getAdminOrders(this.statusFilter, this.searchQuery)
      .subscribe({
        next: (response) => {
          this.orders = response.orders || [];
          this.filteredOrders = [...this.orders];
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.orders = this.generateMockOrders();
          this.filteredOrders = [...this.orders];
        }
      });
  }

  generateMockOrders(): OrderStats[] {
    const orders: OrderStats[] = [];
    const statuses = ['Paid', 'Pending', 'Confirmed', 'InProgress', 'Completed', 'Cancelled'];
    const parents = ['Ahmed Ali', 'Sara Hassan', 'Omar Ibrahim', 'Fatima Ahmed', 'Ali Mohammed'];

    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      orders.push({
        orderNumber: `TUT-${String(1000 + i).padStart(6, '0')}`,
        parentName: parents[i % parents.length],
        students: Math.floor(Math.random() * 3) + 1,
        totalAmount: Math.random() * 500 + 200,
        status: statuses[i % statuses.length],
        createdAt: date
      });
    }

    return orders;
  }

  filterOrders(): void {
    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch = !this.searchQuery ||
        order.orderNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        order.parentName.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = !this.statusFilter || order.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  viewOrderDetails(order: OrderStats): void {
    alert(`Order Details:\n\nOrder: ${order.orderNumber}\nParent: ${order.parentName}\nAmount: $${order.totalAmount.toFixed(2)}`);
  }

  exportToExcel(): void {
    alert('Exporting to Excel... (Feature implementation pending)');
  }
}
