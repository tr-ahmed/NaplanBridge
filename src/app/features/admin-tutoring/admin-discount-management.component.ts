import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DiscountRule {
  id: number;
  name: string;
  type: 'Group' | 'MultipleStudents' | 'MultipleSubjects' | 'Plan';
  percentage: number;
  isActive: boolean;
  description: string;
  appliesTo?: string;
}

@Component({
  selector: 'app-admin-discount-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="discount-container">
      <h1 class="page-title">🎯 Discount Management</h1>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card active">
          <h3>{{ activeDiscounts }}</h3>
          <p>Active Discounts</p>
        </div>
        <div class="summary-card total">
          <h3>{{ totalSavings }}</h3>
          <p>Total Savings This Month</p>
        </div>
        <div class="summary-card usage">
          <h3>{{ discountUsage }}%</h3>
          <p>Average Discount Usage</p>
        </div>
      </div>

      <!-- Add New Discount Button -->
      <div class="actions-bar">
        <button (click)="openAddModal()" class="btn btn-primary">
          ➕ Add New Discount Rule
        </button>
        <button (click)="resetToDefaults()" class="btn btn-warning">
          🔄 Reset to Defaults
        </button>
      </div>

      <!-- Group Tutoring Discount -->
      <div class="discount-section">
        <h2>👥 Group Tutoring Discount</h2>
        <div class="discount-card featured">
          <div class="discount-header">
            <div>
              <h3>Group Tutoring</h3>
              <p>Applied when teaching type is Group</p>
            </div>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="groupDiscount.isActive">
              <span class="slider"></span>
            </label>
          </div>
          <div class="discount-body">
            <div class="input-group">
              <label>Discount Percentage:</label>
              <div class="input-with-unit">
                <input
                  type="number"
                  [(ngModel)]="groupDiscount.percentage"
                  min="0"
                  max="100"
                  [disabled]="!groupDiscount.isActive">
                <span class="unit">%</span>
              </div>
            </div>
            <div class="discount-preview">
              <strong>Example:</strong> Base price \$1000 → After discount: \${{ calculateDiscount(1000, groupDiscount.percentage) }}
              <span class="savings">Save \${{ 1000 - calculateDiscount(1000, groupDiscount.percentage) }}!</span>
            </div>
          </div>
          <button (click)="saveDiscount(groupDiscount)" class="btn btn-save">💾 Save Changes</button>
        </div>
      </div>

      <!-- Multiple Students Discount -->
      <div class="discount-section">
        <h2>👨‍👩‍👧‍👦 Multiple Students Discount</h2>
        <div class="discount-card">
          <div class="discount-header">
            <div>
              <h3>Multiple Students</h3>
              <p>Tiered discount based on number of students</p>
            </div>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="multipleStudentsDiscount.isActive">
              <span class="slider"></span>
            </label>
          </div>
          <div class="discount-body">
            <div class="tiered-discounts">
              <div class="tier-item">
                <span class="tier-label">2 Students:</span>
                <div class="input-with-unit">
                  <input
                    type="number"
                    [(ngModel)]="studentTiers[0]"
                    min="0"
                    max="100"
                    [disabled]="!multipleStudentsDiscount.isActive">
                  <span class="unit">%</span>
                </div>
              </div>
              <div class="tier-item">
                <span class="tier-label">3 Students:</span>
                <div class="input-with-unit">
                  <input
                    type="number"
                    [(ngModel)]="studentTiers[1]"
                    min="0"
                    max="100"
                    [disabled]="!multipleStudentsDiscount.isActive">
                  <span class="unit">%</span>
                </div>
              </div>
              <div class="tier-item">
                <span class="tier-label">4+ Students:</span>
                <div class="input-with-unit">
                  <input
                    type="number"
                    [(ngModel)]="studentTiers[2]"
                    min="0"
                    max="100"
                    [disabled]="!multipleStudentsDiscount.isActive">
                  <span class="unit">%</span>
                </div>
              </div>
            </div>
            <div class="discount-info">
              <strong>Note:</strong> Maximum discount cap: {{ maxStudentDiscount }}%
            </div>
          </div>
          <button (click)="saveStudentTiers()" class="btn btn-save">💾 Save Changes</button>
        </div>
      </div>

      <!-- Multiple Subjects Discount -->
      <div class="discount-section">
        <h2>📚 Multiple Subjects Discount</h2>
        <div class="discount-card">
          <div class="discount-header">
            <div>
              <h3>Multiple Subjects</h3>
              <p>Discount per subject per student</p>
            </div>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="multipleSubjectsDiscount.isActive">
              <span class="slider"></span>
            </label>
          </div>
          <div class="discount-body">
            <div class="input-group">
              <label>Percentage per subject:</label>
              <div class="input-with-unit">
                <input
                  type="number"
                  [(ngModel)]="subjectDiscountPerItem"
                  min="0"
                  max="100"
                  [disabled]="!multipleSubjectsDiscount.isActive">
                <span class="unit">%</span>
              </div>
            </div>
            <div class="input-group">
              <label>Maximum discount cap:</label>
              <div class="input-with-unit">
                <input
                  type="number"
                  [(ngModel)]="maxSubjectDiscount"
                  min="0"
                  max="100"
                  [disabled]="!multipleSubjectsDiscount.isActive">
                <span class="unit">%</span>
              </div>
            </div>
            <div class="discount-preview">
              <strong>Example:</strong>
              <ul>
                <li>2 subjects: {{ subjectDiscountPerItem * 2 > maxSubjectDiscount ? maxSubjectDiscount : subjectDiscountPerItem * 2 }}% OFF</li>
                <li>3 subjects: {{ subjectDiscountPerItem * 3 > maxSubjectDiscount ? maxSubjectDiscount : subjectDiscountPerItem * 3 }}% OFF</li>
                <li>5 subjects: {{ subjectDiscountPerItem * 5 > maxSubjectDiscount ? maxSubjectDiscount : subjectDiscountPerItem * 5 }}% OFF</li>
              </ul>
            </div>
          </div>
          <button (click)="saveSubjectDiscount()" class="btn btn-save">💾 Save Changes</button>
        </div>
      </div>

      <!-- Plan-Based Discounts -->
      <div class="discount-section">
        <h2>⏱️ Plan-Based Discounts</h2>
        <div class="plans-grid">
          <div class="discount-card plan-card">
            <div class="plan-header">
              <h3>20 Hours Plan</h3>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="plan20Discount.isActive">
                <span class="slider"></span>
              </label>
            </div>
            <div class="discount-body">
              <div class="input-group">
                <label>Discount:</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    [(ngModel)]="plan20Discount.percentage"
                    min="0"
                    max="100"
                    [disabled]="!plan20Discount.isActive">
                  <span class="unit">%</span>
                </div>
              </div>
              <div class="price-example">
                \$200 → \${{ calculateDiscount(200, plan20Discount.percentage) }}
              </div>
            </div>
            <button (click)="savePlanDiscount(plan20Discount)" class="btn btn-save">💾 Save</button>
          </div>

          <div class="discount-card plan-card">
            <div class="plan-header">
              <h3>30 Hours Plan</h3>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="plan30Discount.isActive">
                <span class="slider"></span>
              </label>
            </div>
            <div class="discount-body">
              <div class="input-group">
                <label>Discount:</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    [(ngModel)]="plan30Discount.percentage"
                    min="0"
                    max="100"
                    [disabled]="!plan30Discount.isActive">
                  <span class="unit">%</span>
                </div>
              </div>
              <div class="price-example">
                \$300 → \${{ calculateDiscount(300, plan30Discount.percentage) }}
              </div>
            </div>
            <button (click)="savePlanDiscount(plan30Discount)" class="btn btn-save">💾 Save</button>
          </div>
        </div>
      </div>

      <!-- Discount History Log -->
      <div class="history-section">
        <h2>📜 Recent Changes</h2>
        <div class="history-list">
          <div *ngFor="let change of recentChanges" class="history-item">
            <div class="history-icon">{{ change.icon }}</div>
            <div class="history-content">
              <strong>{{ change.action }}</strong>
              <p>{{ change.description }}</p>
              <small>{{ change.timestamp }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .discount-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 2rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }

    .summary-card h3 {
      font-size: 2rem;
      font-weight: 700;
      color: #108092;
      margin: 0 0 0.5rem 0;
    }

    .summary-card p {
      font-size: 0.875rem;
      color: #666;
      margin: 0;
    }

    .actions-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .discount-section {
      margin-bottom: 2rem;
    }

    .discount-section h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 1rem;
    }

    .discount-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 2px solid #e0e0e0;
    }

    .discount-card.featured {
      border-color: #108092;
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.2);
    }

    .discount-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .discount-header h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 0.5rem 0;
    }

    .discount-header p {
      font-size: 0.875rem;
      color: #666;
      margin: 0;
    }

    .toggle {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
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
      transition: .4s;
      border-radius: 34px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #4caf50;
    }

    input:checked + .slider:before {
      transform: translateX(26px);
    }

    .discount-body {
      margin-bottom: 1.5rem;
    }

    .input-group {
      margin-bottom: 1rem;
    }

    .input-group label {
      display: block;
      font-weight: 600;
      color: #555;
      margin-bottom: 0.5rem;
    }

    .input-with-unit {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .input-with-unit input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
    }

    .input-with-unit input:focus {
      outline: none;
      border-color: #108092;
    }

    .input-with-unit input:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }

    .unit {
      font-weight: 700;
      color: #108092;
      font-size: 1.25rem;
    }

    .discount-preview {
      padding: 1rem;
      background: #f0f9fa;
      border-radius: 8px;
      border-left: 4px solid #108092;
      margin-top: 1rem;
    }

    .discount-preview strong {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .discount-preview ul {
      margin: 0.5rem 0 0 1.5rem;
      padding: 0;
    }

    .discount-preview li {
      margin: 0.25rem 0;
      color: #666;
    }

    .savings {
      display: inline-block;
      margin-left: 1rem;
      padding: 0.25rem 0.75rem;
      background: #4caf50;
      color: white;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .discount-info {
      padding: 0.75rem 1rem;
      background: #fff8e1;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
      margin-top: 1rem;
      font-size: 0.875rem;
    }

    .tiered-discounts {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .tier-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .tier-label {
      min-width: 120px;
      font-weight: 600;
      color: #555;
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .plan-card .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .plan-card .plan-header h3 {
      margin: 0;
      font-size: 1.125rem;
    }

    .price-example {
      text-align: center;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1.25rem;
      color: #108092;
      margin-top: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #108092;
      color: white;
    }

    .btn-primary:hover {
      background: #0d6a7a;
    }

    .btn-warning {
      background: #ff9800;
      color: white;
    }

    .btn-warning:hover {
      background: #f57c00;
    }

    .btn-save {
      background: #4caf50;
      color: white;
      width: 100%;
    }

    .btn-save:hover {
      background: #45a049;
    }

    .history-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .history-section h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 1.5rem;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .history-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 8px;
      border-left: 4px solid #108092;
    }

    .history-icon {
      font-size: 1.5rem;
    }

    .history-content strong {
      display: block;
      color: #333;
      margin-bottom: 0.25rem;
    }

    .history-content p {
      font-size: 0.875rem;
      color: #666;
      margin: 0 0 0.5rem 0;
    }

    .history-content small {
      font-size: 0.75rem;
      color: #999;
    }

    @media (max-width: 768px) {
      .actions-bar {
        flex-direction: column;
      }

      .plans-grid {
        grid-template-columns: 1fr;
      }

      .tier-item {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class AdminDiscountManagementComponent implements OnInit {
  // Summary
  activeDiscounts = 7;
  totalSavings = '$12,450';
  discountUsage = 68;

  // Group Discount
  groupDiscount = {
    id: 1,
    name: 'Group Tutoring',
    type: 'Group' as const,
    percentage: 35,
    isActive: true,
    description: 'Applied to group tutoring sessions'
  };

  // Multiple Students
  multipleStudentsDiscount = {
    id: 2,
    name: 'Multiple Students',
    type: 'MultipleStudents' as const,
    percentage: 5,
    isActive: true,
    description: 'Per additional student'
  };
  studentTiers = [5, 10, 15]; // 2, 3, 4+ students
  maxStudentDiscount = 20;

  // Multiple Subjects
  multipleSubjectsDiscount = {
    id: 3,
    name: 'Multiple Subjects',
    type: 'MultipleSubjects' as const,
    percentage: 5,
    isActive: true,
    description: 'Per subject per student'
  };
  subjectDiscountPerItem = 5;
  maxSubjectDiscount = 20;

  // Plan Discounts
  plan20Discount = {
    id: 4,
    name: '20 Hours Plan',
    type: 'Plan' as const,
    percentage: 5,
    isActive: true,
    description: 'Applied to 20-hour plans',
    appliesTo: '20hrs'
  };

  plan30Discount = {
    id: 5,
    name: '30 Hours Plan',
    type: 'Plan' as const,
    percentage: 10,
    isActive: true,
    description: 'Applied to 30-hour plans',
    appliesTo: '30hrs'
  };

  // History
  recentChanges = [
    {
      icon: '✏️',
      action: 'Group Discount Updated',
      description: 'Changed from 30% to 35%',
      timestamp: '2 hours ago'
    },
    {
      icon: '✅',
      action: 'Plan Discount Activated',
      description: '30hrs plan discount set to 10%',
      timestamp: '1 day ago'
    },
    {
      icon: '🔄',
      action: 'Multiple Students Reset',
      description: 'Tiers reset to default values',
      timestamp: '3 days ago'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadDiscountSettings();
  }

  loadDiscountSettings(): void {
    // Load from backend or localStorage
    console.log('Loading discount settings...');
  }

  calculateDiscount(basePrice: number, percentage: number): number {
    return Math.round(basePrice * (1 - percentage / 100));
  }

  saveDiscount(discount: any): void {
    console.log('Saving discount:', discount);
    alert(`${discount.name} discount saved successfully!\nPercentage: ${discount.percentage}%`);
    this.addToHistory('💾', `${discount.name} Saved`, `Set to ${discount.percentage}%`);
  }

  saveStudentTiers(): void {
    console.log('Saving student tiers:', this.studentTiers);
    alert(`Multiple Students discount tiers saved!\n2 students: ${this.studentTiers[0]}%\n3 students: ${this.studentTiers[1]}%\n4+ students: ${this.studentTiers[2]}%`);
    this.addToHistory('👨‍👩‍👧‍👦', 'Student Tiers Updated', 'New tier percentages applied');
  }

  saveSubjectDiscount(): void {
    console.log('Saving subject discount');
    alert(`Multiple Subjects discount saved!\nPer subject: ${this.subjectDiscountPerItem}%\nMax cap: ${this.maxSubjectDiscount}%`);
    this.addToHistory('📚', 'Subject Discount Updated', `${this.subjectDiscountPerItem}% per subject`);
  }

  savePlanDiscount(discount: any): void {
    console.log('Saving plan discount:', discount);
    alert(`${discount.name} discount saved!\nPercentage: ${discount.percentage}%`);
    this.addToHistory('⏱️', `${discount.name} Updated`, `Set to ${discount.percentage}%`);
  }

  resetToDefaults(): void {
    if (confirm('Reset all discounts to default values?')) {
      this.groupDiscount.percentage = 35;
      this.studentTiers = [5, 10, 15];
      this.subjectDiscountPerItem = 5;
      this.maxSubjectDiscount = 20;
      this.plan20Discount.percentage = 5;
      this.plan30Discount.percentage = 10;

      alert('All discounts reset to defaults!');
      this.addToHistory('🔄', 'Reset to Defaults', 'All values restored');
    }
  }

  openAddModal(): void {
    alert('Add new custom discount rule (Feature coming soon)');
  }

  addToHistory(icon: string, action: string, description: string): void {
    this.recentChanges.unshift({
      icon,
      action,
      description,
      timestamp: 'Just now'
    });

    if (this.recentChanges.length > 10) {
      this.recentChanges.pop();
    }
  }
}
