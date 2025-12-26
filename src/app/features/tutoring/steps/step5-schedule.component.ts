import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import {
  SmartSchedulingResponse,
  GetAvailableSlotsRequest,
  SmartSchedulingStudentSelection,
  SmartSchedulingSubjectSelection,
  ScheduledTeacherDto,
  ScheduledSlotDto,
  TeachingType,
  HoursOption
} from '../../../models/tutoring.models';

@Component({
  selector: 'app-step5-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Step 5: Smart Scheduling</h2>
      <p class="step-subtitle">We'll find the best teachers and schedule all sessions for each subject with the same teacher</p>

      <!-- Preferences Section -->
      <div class="preferences-section">
        <h3>📅 Scheduling Preferences (Optional)</h3>
        <div class="preferences-grid">
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" [(ngModel)]="startDate" class="form-control">
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" [(ngModel)]="endDate" class="form-control">
          </div>
          <div class="form-group">
            <label>Preferred Time</label>
            <select [(ngModel)]="preferredTimeRange" class="form-control">
              <option value="">Any Time</option>
              <option value="morning">Morning (9AM - 12PM)</option>
              <option value="afternoon">Afternoon (12PM - 5PM)</option>
              <option value="evening">Evening (5PM - 9PM)</option>
            </select>
          </div>
        </div>
        <div class="preferred-days">
          <label>Preferred Days:</label>
          <div class="days-checkboxes">
            <label *ngFor="let day of daysOfWeek; let i = index" class="day-checkbox">
              <input type="checkbox" [(ngModel)]="selectedDays[i]">
              <span>{{ day }}</span>
            </label>
          </div>
        </div>
        <button class="btn btn-secondary" (click)="loadSmartSchedule()" [disabled]="loading">
          {{ loading ? 'جاري البحث...' : '🔍 Find Best Schedule' }}
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Finding the best teachers and times for you...</p>
      </div>

      <!-- Recommended Schedule -->
      <div *ngIf="!loading && scheduleResponse" class="schedule-results">
        <!-- Compact Summary Bar -->
        <div class="summary-bar">
          <span class="summary-stat">📊 <strong>{{ scheduleResponse.summary.matchedSessions }}</strong>/{{ scheduleResponse.summary.totalSessions }} sessions scheduled</span>
          <span *ngIf="scheduleResponse.summary.unmatchedSessions > 0" class="summary-warning">
            ⚠️ {{ scheduleResponse.summary.unmatchedSessions }} unmatched
          </span>
          <span *ngIf="scheduleResponse.summary.consistentTeacherPerSubject" class="summary-success">✅ Same teacher per subject</span>
        </div>

        <!-- Unmatched Warning (Compact) -->
        <div *ngIf="scheduleResponse.summary.unmatchedSessions > 0" class="unmatched-tip">
          💡 Try extending your date range or removing time restrictions for better coverage
        </div>

        <!-- Split Subjects (Collapsible) -->
        <details *ngIf="scheduleResponse.summary.splitSubjects.length > 0" class="split-details">
          <summary>ℹ️ {{ scheduleResponse.summary.splitSubjects.length }} subject(s) split between teachers</summary>
          <div class="split-content">
            <div *ngFor="let split of scheduleResponse.summary.splitSubjects" class="split-item">
              <span class="split-subject">{{ split.subjectName }}</span>
              <span class="split-teachers">
                <span *ngFor="let alloc of split.allocations; let last = last">
                  {{ alloc.teacherName }} ({{ alloc.sessionsAssigned }}){{ last ? '' : ', ' }}
                </span>
              </span>
            </div>
          </div>
        </details>

        <!-- Schedule by Subject (with Time and Selection) -->
        <div class="schedule-compact">
          <h3>📅 Your Schedule</h3>
          <p class="schedule-hint">Click on any slot to remove it. Sessions are distributed across your selected date range.</p>
          
          <div *ngFor="let teacher of scheduleResponse.recommendedSchedule.teachers" class="teacher-block">
            <div class="teacher-name-bar">
              👨‍🏫 {{ teacher.teacherName }}
            </div>

            <div *ngFor="let schedule of teacher.subjectSchedules" class="subject-row">
              <div class="subject-header-compact">
                <span class="subject-name">{{ schedule.subjectName }}</span>
                <span class="type-badge" [class.group]="schedule.teachingType === 'Group'">{{ schedule.teachingType === 'Group' ? 'Group' : '1:1' }}</span>
                <span class="count-badge">{{ schedule.assignedSessions }}/{{ schedule.totalSessions }}</span>
              </div>
              
              <div class="slots-table">
                <div *ngFor="let slot of schedule.slots; let i = index" 
                     class="slot-row"
                     [class.preferred]="getDisplaySlot(slot).isPreferred"
                     [class.selected]="isSlotSelected(slot)"
                     [class.swapped]="isSlotSwapped(slot)">
                  <span class="slot-num">{{ i + 1 }}</span>
                  <span class="slot-day">{{ getDayName(getDisplaySlot(slot).dayOfWeek) }}</span>
                  <span class="slot-date">{{ formatDate(getDisplaySlot(slot).dateTime) }}</span>
                  <span class="slot-time">{{ formatTime(getDisplaySlot(slot).dateTime) }}</span>
                  <span *ngIf="getDisplaySlot(slot).isPreferred" class="slot-pref">⭐</span>
                  <span *ngIf="isSlotSwapped(slot)" class="slot-swapped-badge">🔄</span>
                  <button class="swap-btn" 
                          (click)="openSwapModal(teacher.teacherId, schedule.subjectId, slot, $event)"
                          title="Change this slot">
                    ⇄
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alternative Teachers (Collapsed) -->
        <details *ngIf="scheduleResponse.alternativeTeachers.length > 0" class="alternatives-collapsed">
          <summary>🔄 {{ scheduleResponse.alternativeTeachers.length }} Alternative Teachers Available</summary>
          <div class="alt-list">
            <div *ngFor="let alt of scheduleResponse.alternativeTeachers" class="alt-item">
              <span class="alt-name">{{ alt.teacherName }}</span>
              <span class="alt-subject">{{ alt.subjectName }}</span>
              <span class="alt-slots">{{ alt.availableSlots }} slots</span>
            </div>
          </div>
        </details>
      </div>

      <!-- No Schedule Found -->
      <div *ngIf="!loading && noScheduleFound" class="no-schedule">
        <div class="warning-icon">⚠️</div>
        <h3>No Available Schedule Found</h3>
        <p>Try adjusting your preferences or contact support for assistance.</p>
      </div>

      <!-- Navigation -->
      <div class="nav-buttons">
        <button
          type="button"
          (click)="previousStep()"
          class="btn btn-secondary">
          ← Back
        </button>
        <button
          type="button"
          (click)="nextStep()"
          [disabled]="!canProceed()"
          class="btn btn-primary">
          Next: Review & Pay →
        </button>
      </div>

      <!-- Swap Modal -->
      <div *ngIf="swapModalOpen" class="swap-modal-overlay" (click)="closeSwapModal()">
        <div class="swap-modal" (click)="$event.stopPropagation()">
          <div class="swap-modal-header">
            <h4>🔄 Change Time Slot</h4>
            <button class="close-btn" (click)="closeSwapModal()">✕</button>
          </div>
          
          <div *ngIf="currentSwapSlot" class="current-slot-info">
            <p>Current Slot:</p>
            <div class="current-slot-display">
              {{ getDayName(getDisplaySlot(currentSwapSlot).dayOfWeek) }} 
              {{ formatDate(getDisplaySlot(currentSwapSlot).dateTime) }} 
              at {{ formatTime(getDisplaySlot(currentSwapSlot).dateTime) }}
            </div>
          </div>

          <div class="alternative-slots-section">
            <p>Select an alternative time:</p>
            
            <!-- Loading State -->
            <div *ngIf="loadingAlternatives" class="loading-alternatives">
              ⏳ Loading available times...
            </div>
            
            <div *ngIf="!loadingAlternatives" class="alternative-slots-list">
              <div *ngFor="let altSlot of availableAlternativeSlots" 
                   class="alt-slot-option"
                   [class.preferred]="altSlot.isPreferred"
                   (click)="swapSlot(altSlot)">
                <span class="alt-slot-day">{{ getDayName(altSlot.dayOfWeek) }}</span>
                <span class="alt-slot-date">{{ formatDate(altSlot.dateTime) }}</span>
                <span class="alt-slot-time">{{ formatTime(altSlot.dateTime) }}</span>
                <span *ngIf="altSlot.isPreferred" class="alt-slot-pref">⭐</span>
              </div>
              <div *ngIf="availableAlternativeSlots.length === 0" class="no-alternatives">
                ❗ No alternative slots available for this teacher.<br>
                Try adjusting your date range or contact support.
              </div>
            </div>
          </div>

          <div class="swap-modal-footer">
            <button class="btn btn-secondary" (click)="closeSwapModal()">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .step-container {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .step-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 2rem;
    }

    .student-section {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .student-section:last-of-type {
      border-bottom: none;
    }

    .student-name {
      font-size: 1.5rem;
      font-weight: 600;
      color: #108092;
      margin-bottom: 1.5rem;
    }

    .subject-schedule-section {
      margin-bottom: 2rem;
    }

    .subject-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .subject-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #555;
      margin: 0;
    }

    .slots-counter {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 1rem;
    }

    .selected-count {
      font-size: 1.5rem;
      font-weight: 700;
      color: #108092;
    }

    .separator {
      font-size: 1.25rem;
      color: #999;
    }

    .required-count {
      font-size: 1.25rem;
      font-weight: 600;
      color: #666;
    }

    .label {
      font-size: 0.875rem;
      color: #888;
      margin-left: 0.5rem;
    }

    .calendar-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .day-column {
      background: #fafafa;
      border-radius: 8px;
      padding: 0.75rem;
    }

    .day-header {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      text-align: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .slots-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .time-slot {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 0.75rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      min-height: 60px;
    }

    .time-slot:hover:not(.disabled) {
      border-color: #108092;
      transform: translateX(2px);
      box-shadow: 0 2px 6px rgba(16, 128, 146, 0.2);
    }

    .time-slot.selected {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 2px 6px rgba(16, 128, 146, 0.3);
    }

    .time-slot.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f5f5f5;
    }

    .slot-time {
      font-size: 0.875rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.25rem;
    }

    .slot-teacher {
      font-size: 0.75rem;
      color: #666;
    }

    .checkmark {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #4caf50;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
    }

    .unavailable-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #f44336;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
      font-size: 0.625rem;
      font-weight: 700;
    }

    .no-slots {
      text-align: center;
      padding: 1rem;
      color: #999;
      font-size: 0.875rem;
    }

    .loading {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #108092;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .info-icon {
      font-size: 1.5rem;
    }

    .nav-buttons {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #666;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }

    .btn-primary {
      background: #108092;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0d6a7a;
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .calendar-container {
        grid-template-columns: 1fr;
      }
    }

    .step-subtitle {
      color: #666;
      margin-bottom: 2rem;
      text-align: center;
    }

    .preferences-section {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .preferences-section h3 {
      margin-bottom: 1rem;
      color: #333;
    }

    .preferences-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #555;
    }

    .form-control {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
    }

    .form-control:focus {
      outline: none;
      border-color: #108092;
    }

    .preferred-days {
      margin-bottom: 1rem;
    }

    .preferred-days > label {
      font-weight: 600;
      color: #555;
      display: block;
      margin-bottom: 0.5rem;
    }

    .days-checkboxes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .day-checkbox {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
    }

    .day-checkbox input:checked + span {
      color: #108092;
      font-weight: 600;
    }

    .schedule-results {
      margin-top: 2rem;
    }

    /* Compact Summary Bar */
    .summary-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      border: 1px solid #108092;
      border-radius: 8px;
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
    }

    .summary-stat {
      color: #333;
    }

    .summary-stat strong {
      color: #108092;
      font-size: 1.1rem;
    }

    .summary-warning {
      color: #e65100;
      font-weight: 500;
    }

    .summary-success {
      color: #2e7d32;
    }

    .unmatched-tip {
      padding: 0.5rem 1rem;
      background: #fff8e1;
      border-radius: 6px;
      font-size: 0.85rem;
      color: #6d4c41;
      margin-bottom: 0.75rem;
    }

    /* Split Details Collapsible */
    .split-details {
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .split-details summary {
      padding: 0.6rem 1rem;
      cursor: pointer;
      font-size: 0.85rem;
      color: #666;
    }

    .split-details summary:hover {
      color: #108092;
    }

    .split-content {
      padding: 0 1rem 0.75rem;
    }

    .split-item {
      display: flex;
      gap: 1rem;
      padding: 0.4rem 0;
      font-size: 0.85rem;
      border-bottom: 1px solid #eee;
    }

    .split-item:last-child {
      border-bottom: none;
    }

    .split-subject {
      font-weight: 600;
      color: #333;
      min-width: 120px;
    }

    .split-teachers {
      color: #666;
    }

    .summary-card {
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      border: 2px solid #108092;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .summary-card h3 {
      color: #108092;
      margin-bottom: 1rem;
    }

    .summary-stats {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #333;
    }

    .stat.success .stat-value {
      color: #4caf50;
    }

    .stat.warning .stat-value {
      color: #f57c00;
    }

    .stat-label {
      color: #666;
      font-size: 0.875rem;
    }

    .same-teacher-badge {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      font-weight: 600;
    }

    .same-teacher-badge.success {
      background: #e8f5e9;
      color: #388e3c;
    }

    .same-teacher-badge.warning {
      background: #fff3e0;
      color: #e65100;
    }

    .same-teacher-badge.info {
      background: #e3f2fd;
      color: #1565c0;
    }

    .unmatched-warning {
      margin-top: 1rem;
      padding: 1rem 1.5rem;
      background: #fff8e1;
      border: 1px solid #ffca28;
      border-radius: 8px;
      border-left: 4px solid #f57c00;
    }

    .unmatched-warning .warning-header {
      font-weight: 600;
      font-size: 1rem;
      color: #e65100;
      margin-bottom: 0.5rem;
    }

    .unmatched-warning .warning-text {
      color: #6d4c41;
      margin: 0.5rem 0;
    }

    .unmatched-warning .suggestions {
      margin-top: 0.75rem;
      font-size: 0.875rem;
      color: #5d4037;
    }

    .unmatched-warning .suggestions ul {
      margin: 0.25rem 0 0 1.25rem;
      padding: 0;
    }

    .unmatched-warning .suggestions li {
      margin-bottom: 0.25rem;
    }

    .split-subjects-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #fff8e1;
      border-radius: 12px;
      border-left: 4px solid #ffc107;
    }

    .split-subjects-section h4 {
      color: #e65100;
      margin-bottom: 1rem;
    }

    .split-subject-card {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .split-subject-card:last-child {
      margin-bottom: 0;
    }

    .split-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .split-header h5 {
      margin: 0;
      color: #333;
      font-size: 1.125rem;
    }

    .teacher-count-badge {
      background: #ff9800;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .split-reason {
      font-size: 0.875rem;
      color: #666;
      margin: 0 0 1rem 0;
    }

    .allocations {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .allocation-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 6px;
    }

    .allocation-item .teacher-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .teacher-name {
      font-weight: 600;
      color: #333;
    }

    .priority-badge {
      background: #108092;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .sessions-badge {
      background: #4caf50;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .teachers-section {
      margin-bottom: 2rem;
    }

    .teachers-section h3 {
      margin-bottom: 1rem;
      color: #333;
    }

    .teacher-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .teacher-header {
      margin-bottom: 1rem;
    }

    .teacher-info h4 {
      font-size: 1.25rem;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .teacher-meta {
      display: flex;
      gap: 1rem;
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .priority {
      color: #f57c00;
    }

    .rating {
      color: #ffc107;
    }

    .matched-subjects {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .subject-tag {
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .subject-tag.small {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
    }

    .subject-schedule {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .subject-schedule-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .subject-schedule-header h5 {
      margin: 0;
      color: #555;
    }

    .session-type-badge {
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .session-type-badge.group {
      background: #e8f5e9;
      color: #388e3c;
    }

    .sessions-count {
      color: #666;
      font-size: 0.875rem;
    }

    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.75rem;
    }

    .slot-card {
      background: #f8f9fa;
      border: 2px solid transparent;
      border-radius: 8px;
      padding: 0.75rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      position: relative;
    }

    .slot-card:hover {
      border-color: #108092;
    }

    .slot-card.preferred {
      background: #fff3e0;
      border-color: #f57c00;
    }

    .slot-date {
      font-weight: 600;
      color: #333;
    }

    .slot-time {
      color: #666;
      font-size: 0.875rem;
    }

    .slot-day {
      color: #888;
      font-size: 0.75rem;
    }

    .preferred-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      font-size: 0.75rem;
    }

    .alternatives-section {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .alternatives-section h3 {
      margin-bottom: 1rem;
      color: #666;
    }

    .alternatives-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .alt-teacher-card {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .alt-teacher-card h5 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .alt-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      color: #666;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
    }

    .alt-subject {
      margin-top: 0.5rem;
    }

    .alt-subject .subject-tag {
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-block;
    }

    .no-schedule {
      text-align: center;
      padding: 3rem;
      background: #fff3e0;
      border-radius: 12px;
    }

    .warning-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    /* Compact Schedule Styles */
    .schedule-compact {
      margin-bottom: 2rem;
    }

    .schedule-compact h3 {
      margin-bottom: 1rem;
      color: #333;
      font-size: 1.25rem;
    }

    .teacher-block {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .teacher-name-bar {
      font-weight: 600;
      font-size: 1rem;
      color: #108092;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 0.75rem;
    }

    .subject-row {
      background: white;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .subject-header-compact {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .subject-name {
      font-weight: 600;
      color: #333;
      font-size: 0.95rem;
    }

    .type-badge {
      background: #e3f2fd;
      color: #1565c0;
      padding: 0.15rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .type-badge.group {
      background: #fce4ec;
      color: #c2185b;
    }

    .count-badge {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 0.15rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .slots-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .slot-chip {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      color: #555;
      cursor: default;
      white-space: nowrap;
    }

    .slot-chip.preferred {
      background: #fff8e1;
      border-color: #ffca28;
      color: #e65100;
    }

    .slot-chip:hover {
      background: #e3f2fd;
      border-color: #2196f3;
    }

    /* Slots Table Layout */
    .schedule-hint {
      font-size: 0.8rem;
      color: #888;
      margin-bottom: 1rem;
    }

    .slots-table {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .slot-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.85rem;
    }

    .slot-row:hover {
      background: #e3f2fd;
      border-color: #2196f3;
    }

    .slot-row.preferred {
      background: #fff8e1;
      border-color: #ffca28;
    }

    .slot-row.selected {
      background: #ffebee;
      border-color: #ef5350;
      text-decoration: line-through;
      opacity: 0.6;
    }

    .slot-num {
      width: 24px;
      height: 24px;
      background: #108092;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .slot-row.selected .slot-num {
      background: #ef5350;
    }

    .slot-row .slot-day {
      width: 80px;
      font-weight: 500;
      color: #333;
    }

    .slot-row .slot-date {
      width: 70px;
      color: #555;
    }

    .slot-row .slot-time {
      color: #108092;
      font-weight: 600;
    }

    .slot-pref {
      margin-left: auto;
    }

    /* Swap Button */
    .swap-btn {
      background: #e3f2fd;
      border: 1px solid #2196f3;
      color: #1565c0;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      margin-left: 0.5rem;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .slot-row:hover .swap-btn {
      opacity: 1;
    }

    .swap-btn:hover {
      background: #1565c0;
      color: white;
    }

    .slot-swapped-badge {
      font-size: 0.75rem;
    }

    .slot-row.swapped {
      background: #e8f5e9;
      border-color: #4caf50;
    }

    .slot-row.swapped .slot-num {
      background: #4caf50;
    }

    /* Swap Modal */
    .swap-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .swap-modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 450px;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .swap-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .swap-modal-header h4 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #666;
    }

    .close-btn:hover {
      color: #333;
    }

    .current-slot-info {
      padding: 1rem 1.5rem;
      background: #f5f5f5;
    }

    .current-slot-info p {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.85rem;
    }

    .current-slot-display {
      font-weight: 600;
      color: #333;
      font-size: 1rem;
    }

    .alternative-slots-section {
      padding: 1rem 1.5rem;
    }

    .alternative-slots-section p {
      margin: 0 0 0.75rem 0;
      color: #333;
      font-weight: 500;
    }

    .alternative-slots-list {
      max-height: 250px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .alt-slot-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .alt-slot-option:hover {
      background: #e3f2fd;
      border-color: #2196f3;
    }

    .alt-slot-option.preferred {
      background: #fff8e1;
      border-color: #ffca28;
    }

    .alt-slot-day {
      font-weight: 500;
      min-width: 80px;
    }

    .alt-slot-date {
      color: #555;
    }

    .alt-slot-time {
      color: #108092;
      font-weight: 600;
    }

    .alt-slot-pref {
      margin-left: auto;
    }

    .no-alternatives {
      text-align: center;
      padding: 2rem;
      color: #888;
    }

    .swap-modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
    }

    /* Alternative Teachers Collapsed */
    .alternatives-collapsed {
      margin-top: 1.5rem;
      background: #f5f5f5;
      border-radius: 8px;
      padding: 0;
    }

    .alternatives-collapsed summary {
      padding: 0.75rem 1rem;
      cursor: pointer;
      font-weight: 500;
      color: #666;
      font-size: 0.9rem;
    }

    .alternatives-collapsed summary:hover {
      color: #108092;
    }

    .alt-list {
      padding: 0.5rem 1rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .alt-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem;
      background: white;
      border-radius: 6px;
      font-size: 0.85rem;
    }

    .alt-name {
      font-weight: 600;
      color: #333;
    }

    .alt-item .alt-subject {
      color: #1565c0;
      font-size: 0.8rem;
    }

    .alt-slots {
      margin-left: auto;
      color: #666;
      font-size: 0.75rem;
    }
  `]
})
export class Step5ScheduleComponent implements OnInit {
  students: { id: number; name: string; academicYearId: number }[] = [];
  scheduleResponse: SmartSchedulingResponse | null = null;
  selectedSlots = new Set<string>();
  loading = false;
  noScheduleFound = false;

  // Swap Modal State
  swapModalOpen = false;
  currentSwapSlot: ScheduledSlotDto | null = null;
  currentSwapTeacherId: number | null = null;
  currentSwapSubjectId: number | null = null;
  availableAlternativeSlots: ScheduledSlotDto[] = [];
  // Map of original slot availabilityId -> new slot (for tracking swaps)
  swappedSlots = new Map<number, ScheduledSlotDto>();

  // Preferences
  startDate = '';
  endDate = '';
  preferredTimeRange = '';
  selectedDays: boolean[] = [false, true, false, true, false, true, false]; // Default: Mon, Wed, Sat
  daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private stateService: TutoringStateService,
    private tutoringService: TutoringService,
    private contentService: ContentService
  ) { }

  ngOnInit(): void {
    this.restoreState();
    this.setDefaultDates();
    this.loadSmartSchedule();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.students = Array.isArray(state.students) ? state.students : [];
  }

  setDefaultDates(): void {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7); // Start in 1 week

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3); // 3 months duration

    this.startDate = startDate.toISOString().split('T')[0];
    this.endDate = endDate.toISOString().split('T')[0];
  }

  loadSmartSchedule(): void {
    this.loading = true;
    this.noScheduleFound = false;

    const state = this.stateService.getState();

    // Build student selections for API
    const studentSelections: SmartSchedulingStudentSelection[] = this.students.map(student => {
      const subjectIds = state.studentSubjects.get(student.id) || new Set();

      const subjects: SmartSchedulingSubjectSelection[] = Array.from(subjectIds).map(subjectId => {
        const key = `${student.id}_${subjectId}`;
        const teachingType = state.subjectTeachingTypes.get(key) || TeachingType.OneToOne;
        const hours = (state.subjectHours.get(key) || 10) as HoursOption;

        return {
          subjectId,
          teachingType,
          hours
        };
      });

      return {
        studentId: student.id,
        subjects
      };
    });

    // Build preferred days
    const preferredDays = this.selectedDays
      .map((selected, index) => selected ? index : -1)
      .filter(day => day >= 0);

    // Build time range
    let timeRange: { start: string; end: string } | undefined;
    if (this.preferredTimeRange === 'morning') {
      timeRange = { start: '09:00:00', end: '12:00:00' };
    } else if (this.preferredTimeRange === 'afternoon') {
      timeRange = { start: '12:00:00', end: '17:00:00' };
    } else if (this.preferredTimeRange === 'evening') {
      timeRange = { start: '17:00:00', end: '21:00:00' };
    }

    // Convert dates to ISO 8601 format
    const startDateTime = new Date(this.startDate);
    startDateTime.setHours(0, 0, 0, 0);

    const endDateTime = new Date(this.endDate);
    endDateTime.setHours(23, 59, 59, 999);

    const request: GetAvailableSlotsRequest = {
      studentSelections,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      preferredDays: preferredDays.length > 0 ? preferredDays : undefined,
      preferredTimeRange: timeRange
    };

    this.tutoringService.getAvailableSlotsSmart(request).subscribe({
      next: (response) => {
        // Debug logging - remove in production
        console.log('📅 Smart Schedule Response:', response);
        console.log('📊 Summary:', {
          total: response.summary.totalSessions,
          matched: response.summary.matchedSessions,
          unmatched: response.summary.unmatchedSessions,
          consistentTeacher: response.summary.consistentTeacherPerSubject,
          splitSubjects: response.summary.splitSubjects?.length || 0
        });
        console.log('👨‍🏫 Teachers count:', response.recommendedSchedule.teachers.length);
        response.recommendedSchedule.teachers.forEach((t, i) => {
          console.log(`  Teacher ${i + 1}: ${t.teacherName} (Priority: ${t.priority})`);
          t.subjectSchedules.forEach(s => {
            console.log(`    📚 ${s.subjectName}: ${s.assignedSessions}/${s.totalSessions} sessions, ${s.slots.length} slots`);
          });
        });

        this.scheduleResponse = response;
        this.loading = false;

        // Only show "no schedule found" if teachers array is truly empty
        if (!response.recommendedSchedule.teachers.length) {
          this.noScheduleFound = true;
          console.warn('⚠️ No teachers found in recommendedSchedule');
        } else {
          this.noScheduleFound = false;
        }
      },
      error: (err) => {
        console.error('❌ Error loading smart schedule:', err);
        console.error('Error details:', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        this.loading = false;
        this.noScheduleFound = true;
      }
    });
  }

  formatDate(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getDayName(dayOfWeek: number): string {
    return this.daysOfWeek[dayOfWeek];
  }

  isSlotSelected(slot: ScheduledSlotDto): boolean {
    // Check if this slot has been removed/deselected by the user
    return this.selectedSlots.has(slot.availabilityId.toString());
  }

  toggleSlot(teacherId: number, subjectId: number, slot: ScheduledSlotDto): void {
    // Use availabilityId as unique identifier for the slot
    const key = slot.availabilityId.toString();
    if (this.selectedSlots.has(key)) {
      this.selectedSlots.delete(key);
    } else {
      this.selectedSlots.add(key);
    }
  }

  canProceed(): boolean {
    return this.scheduleResponse !== null &&
      this.scheduleResponse.recommendedSchedule.teachers.length > 0;
  }

  previousStep(): void {
    this.stateService.previousStep();
  }

  nextStep(): void {
    if (this.canProceed()) {
      this.stateService.nextStep();
    }
  }

  // Swap Modal Methods
  loadingAlternatives = false;

  openSwapModal(teacherId: number, subjectId: number, slot: ScheduledSlotDto, event: Event): void {
    event.stopPropagation();

    this.currentSwapSlot = slot;
    this.currentSwapTeacherId = teacherId;
    this.currentSwapSubjectId = subjectId;
    this.availableAlternativeSlots = [];
    this.loadingAlternatives = true;
    this.swapModalOpen = true;

    // Get all currently assigned slot IDs to exclude them
    const excludeSlotIds: number[] = [];
    if (this.scheduleResponse) {
      this.scheduleResponse.recommendedSchedule.teachers.forEach(teacher => {
        teacher.subjectSchedules.forEach(schedule => {
          schedule.slots.forEach(s => {
            excludeSlotIds.push(s.availabilityId);
          });
        });
      });
    }

    // Get teaching type for this subject
    const state = this.stateService.getState();
    const student = this.students[0];
    let teachingType = 'OneToOne';
    if (student) {
      const key = `${student.id}_${subjectId}`;
      const tt = state.subjectTeachingTypes.get(key);
      if (tt) teachingType = tt;
    }

    // Call the new Alternative Slots API
    this.tutoringService.getAlternativeSlots(
      teacherId,
      subjectId,
      teachingType,
      this.startDate,
      this.endDate,
      excludeSlotIds
    ).subscribe({
      next: (response) => {
        console.log('📅 Alternative slots response:', response);

        // Convert AlternativeSlotDto to ScheduledSlotDto format
        this.availableAlternativeSlots = response.alternativeSlots.map(alt => ({
          availabilityId: alt.availabilityId,
          dateTime: alt.dateTime,
          dayOfWeek: alt.dayOfWeek,
          duration: alt.duration,
          isPreferred: alt.isPreferred,
          conflictingBookings: 0
        }));

        this.loadingAlternatives = false;
        console.log('Found', this.availableAlternativeSlots.length, 'alternative slots');
      },
      error: (err) => {
        console.error('Error fetching alternative slots:', err);
        this.loadingAlternatives = false;

        // Fallback: show other existing slots
        this.showFallbackAlternatives(teacherId, subjectId, slot);
      }
    });
  }

  showFallbackAlternatives(teacherId: number, subjectId: number, slot: ScheduledSlotDto): void {
    if (this.scheduleResponse) {
      const currentTeacher = this.scheduleResponse.recommendedSchedule.teachers
        .find(t => t.teacherId === teacherId);

      if (currentTeacher) {
        const currentSchedule = currentTeacher.subjectSchedules
          .find(s => s.subjectId === subjectId);

        if (currentSchedule) {
          const currentDateTime = this.getDisplaySlot(slot).dateTime;
          this.availableAlternativeSlots = currentSchedule.slots
            .filter(s => s.dateTime !== currentDateTime)
            .filter(s => !this.isSlotSwapped(s));
        }
      }
    }
  }

  closeSwapModal(): void {
    this.swapModalOpen = false;
    this.currentSwapSlot = null;
    this.currentSwapTeacherId = null;
    this.currentSwapSubjectId = null;
    this.availableAlternativeSlots = [];
  }

  swapSlot(newSlot: ScheduledSlotDto): void {
    if (this.currentSwapSlot) {
      // Store the swap: original slot -> new slot
      this.swappedSlots.set(this.currentSwapSlot.availabilityId, newSlot);
      console.log('Swapped slot:', this.currentSwapSlot.dateTime, '->', newSlot.dateTime);
    }
    this.closeSwapModal();
  }

  // Get the display slot (either original or swapped)
  getDisplaySlot(slot: ScheduledSlotDto): ScheduledSlotDto {
    return this.swappedSlots.get(slot.availabilityId) || slot;
  }

  // Check if a slot has been swapped
  isSlotSwapped(slot: ScheduledSlotDto): boolean {
    return this.swappedSlots.has(slot.availabilityId);
  }
}
