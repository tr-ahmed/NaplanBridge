import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectService } from '../../../core/services/subject.service';
import { Subject } from '../../../models/subject.models';
import { PagedResult } from '../../../models/common.models';

interface SubjectPricing {
  id: number;
  subjectName: string;
  categoryName: string;
  selfLearningPrice: number;
  tutoringPricePerHour: number | null;
  isAvailableForTutoring: boolean;
  isEditing: boolean;
  newTutoringPrice?: number;
}

@Component({
  selector: 'app-admin-tutoring-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1>💰 Tutoring Pricing Management</h1>
          <p class="subtitle">Manage hourly rates for tutoring sessions (separate from self-learning subscriptions)</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="saveAllChanges()" [disabled]="!hasChanges() || saving">
            {{ saving ? 'Saving...' : 'Save All Changes' }}
          </button>
        </div>
      </div>

      <!-- Filter & Search -->
      <div class="filters">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchTerm"
            (ngModelChange)="filterSubjects()"
            placeholder="Search subjects..."
            class="search-input">
        </div>
        <div class="filter-group">
          <label>
            <input type="checkbox" [(ngModel)]="showOnlyTutoringEnabled" (change)="filterSubjects()">
            Show only tutoring-enabled
          </label>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading subjects...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>

      <!-- Subjects Table -->
      <div *ngIf="!loading && !error" class="table-container">
        <table class="pricing-table">
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
              <td class="subject-name">
                <div class="subject-icon">📚</div>
                {{ subject.subjectName }}
              </td>
              <td>{{ subject.categoryName }}</td>
              <td class="price-cell">
                <span class="price">\${{ subject.selfLearningPrice.toFixed(2) }}</span>
              </td>
              <td class="tutoring-price-cell">
                <div *ngIf="!subject.isEditing">
                  <span *ngIf="subject.tutoringPricePerHour !== null" class="price tutoring">
                    \${{ subject.tutoringPricePerHour.toFixed(2) }}
                  </span>
                  <span *ngIf="subject.tutoringPricePerHour === null" class="not-set">
                    Not Set
                  </span>
                </div>
                <div *ngIf="subject.isEditing" class="edit-price">
                  <input
                    type="number"
                    [(ngModel)]="subject.newTutoringPrice"
                    min="0"
                    step="0.01"
                    class="price-input"
                    placeholder="Enter price">
                </div>
              </td>
              <td>
                <span
                  class="status-badge"
                  [class.enabled]="subject.isAvailableForTutoring"
                  [class.disabled]="!subject.isAvailableForTutoring">
                  {{ subject.isAvailableForTutoring ? 'Enabled' : 'Disabled' }}
                </span>
              </td>
              <td class="actions-cell">
                <button
                  *ngIf="!subject.isEditing"
                  (click)="editSubject(subject)"
                  class="btn-icon"
                  title="Edit">
                  ✏️
                </button>
                <button
                  *ngIf="subject.isEditing"
                  (click)="saveSubject(subject)"
                  class="btn-icon save"
                  title="Save">
                  ✅
                </button>
                <button
                  *ngIf="subject.isEditing"
                  (click)="cancelEdit(subject)"
                  class="btn-icon cancel"
                  title="Cancel">
                  ❌
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div *ngIf="filteredSubjects.length === 0" class="empty-state">
          <p>No subjects found matching your filters.</p>
        </div>
      </div>

      <!-- Info Box -->
      <div class="info-box">
        <div class="info-icon">💡</div>
        <div class="info-content">
          <h4>Pricing Information</h4>
          <ul>
            <li><strong>Self-Learning Price:</strong> Monthly subscription for video content, quizzes, and materials</li>
            <li><strong>Tutoring Rate:</strong> Price per hour for live 1-on-1 or group tutoring sessions</li>
            <li><strong>Status:</strong> Set price to enable tutoring, or leave empty to disable</li>
            <li><strong>Discounts:</strong> Additional discounts (group, multiple subjects, hours) apply automatically</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .header-content h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #333;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #666;
      font-size: 0.95rem;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 300px;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #108092;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    .loading, .error-message {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f0f0f0;
      border-top: 4px solid #108092;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      border-radius: 8px;
    }

    .table-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .pricing-table {
      width: 100%;
      border-collapse: collapse;
    }

    .pricing-table thead {
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      color: white;
    }

    .pricing-table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .pricing-table th small {
      display: block;
      font-weight: 400;
      opacity: 0.9;
      font-size: 0.8rem;
    }

    .pricing-table tbody tr {
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s ease;
    }

    .pricing-table tbody tr:hover {
      background: #f8f9fa;
    }

    .pricing-table tbody tr.editing {
      background: #fff8e1;
    }

    .pricing-table td {
      padding: 1rem;
    }

    .subject-name {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      color: #333;
    }

    .subject-icon {
      font-size: 1.5rem;
    }

    .price-cell, .tutoring-price-cell {
      font-weight: 600;
    }

    .price {
      color: #666;
      font-size: 1rem;
    }

    .price.tutoring {
      color: #108092;
      font-size: 1.1rem;
    }

    .not-set {
      color: #999;
      font-style: italic;
    }

    .edit-price {
      display: flex;
      align-items: center;
    }

    .price-input {
      width: 120px;
      padding: 0.5rem;
      border: 2px solid #108092;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
    }

    .status-badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-badge.enabled {
      background: #e8f5e9;
      color: #388e3c;
    }

    .status-badge.disabled {
      background: #ffebee;
      color: #c62828;
    }

    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      padding: 0.5rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 1.2rem;
      transition: transform 0.2s ease;
    }

    .btn-icon:hover {
      transform: scale(1.2);
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      border-radius: 8px;
      margin-top: 2rem;
    }

    .info-icon {
      font-size: 2rem;
    }

    .info-content h4 {
      margin: 0 0 0.75rem 0;
      color: #1565c0;
    }

    .info-content ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .info-content li {
      margin-bottom: 0.5rem;
      color: #555;
    }
  `]
})
export class AdminTutoringPricingComponent implements OnInit {
  subjects: SubjectPricing[] = [];
  filteredSubjects: SubjectPricing[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  searchTerm = '';
  showOnlyTutoringEnabled = false;

  constructor(private subjectService: SubjectService) {}

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.loading = true;
    this.error = null;

    this.subjectService.getSubjects().subscribe({
      next: (response: PagedResult<Subject>) => {
        this.subjects = response.items.map(s => ({
          id: s.id,
          subjectName: s.subjectName,
          categoryName: s.categoryName,
          selfLearningPrice: s.price,
          tutoringPricePerHour: s.tutoringPricePerHour || null,
          isAvailableForTutoring: s.tutoringPricePerHour != null && s.tutoringPricePerHour > 0,
          isEditing: false
        }));
        this.filterSubjects();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading subjects:', err);
        this.error = 'Failed to load subjects. Please try again.';
        this.loading = false;
      }
    });
  }

  filterSubjects(): void {
    let filtered = [...this.subjects];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.subjectName.toLowerCase().includes(term) ||
        s.categoryName.toLowerCase().includes(term)
      );
    }

    // Tutoring enabled filter
    if (this.showOnlyTutoringEnabled) {
      filtered = filtered.filter(s => s.isAvailableForTutoring);
    }

    this.filteredSubjects = filtered;
  }

  editSubject(subject: SubjectPricing): void {
    subject.isEditing = true;
    subject.newTutoringPrice = subject.tutoringPricePerHour || undefined;
  }

  cancelEdit(subject: SubjectPricing): void {
    subject.isEditing = false;
    subject.newTutoringPrice = undefined;
  }

  saveSubject(subject: SubjectPricing): void {
    if (subject.newTutoringPrice !== undefined) {
      subject.tutoringPricePerHour = subject.newTutoringPrice > 0 ? subject.newTutoringPrice : null;
      subject.isAvailableForTutoring = subject.tutoringPricePerHour !== null && subject.tutoringPricePerHour > 0;
    }
    subject.isEditing = false;
    subject.newTutoringPrice = undefined;
  }

  hasChanges(): boolean {
    return this.subjects.some(s => s.isEditing);
  }

  saveAllChanges(): void {
    this.saving = true;

    // Collect all subjects that need updating
    const updates = this.subjects.map(s => ({
      id: s.id,
      tutoringPricePerHour: s.tutoringPricePerHour
    }));

    // Call API to update tutoring prices
    this.subjectService.bulkUpdateTutoringPrices(updates).subscribe({
      next: () => {
        this.saving = false;
        alert('✅ Tutoring prices updated successfully!');
        this.loadSubjects();
      },
      error: (err) => {
        console.error('Error saving tutoring prices:', err);
        this.saving = false;

        // Fallback: If bulk update endpoint not ready, show warning
        if (err.status === 404 || err.status === 0) {
          alert('⚠️ Backend endpoint not ready yet. Changes saved locally only.\n\nPlease check BACKEND_REPORT_TUTORING_PRICING_SEPARATE.md for backend implementation requirements.');
        } else {
          alert('❌ Failed to save tutoring prices. Please try again.');
        }
      }
    });
  }
}
