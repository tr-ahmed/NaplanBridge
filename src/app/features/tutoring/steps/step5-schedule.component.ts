import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
      <!-- Hero Header -->
      <div class="hero-header">
        <div class="hero-icon">📅</div>
        <h2>Step 6: Smart Scheduling</h2>
        <p>We'll match you with the best teachers and create your personalized schedule</p>
      </div>

      <!-- Preferences Panel -->
      <div class="preferences-panel">
        <div class="panel-header" (click)="preferencesExpanded = !preferencesExpanded">
          <span>⚙️ Scheduling Preferences</span>
          <span class="toggle-icon">{{ preferencesExpanded ? '▼' : '▶' }}</span>
        </div>
        
        <div class="panel-content" *ngIf="preferencesExpanded">
          <div class="pref-grid">
            <div class="pref-card">
              <div class="pref-icon">📆</div>
              <label>Start Date</label>
              <input type="date" [(ngModel)]="startDate" class="pref-input">
            </div>
            <div class="pref-card">
              <div class="pref-icon">🏁</div>
              <label>End Date</label>
              <input type="date" [(ngModel)]="endDate" class="pref-input">
            </div>
            <div class="pref-card">
              <div class="pref-icon">🕐</div>
              <label>Preferred Time</label>
              <select [(ngModel)]="preferredTimeRange" class="pref-input">
                <option value="">Any Time</option>
                <option value="morning">🌅 Morning</option>
                <option value="afternoon">☀️ Afternoon</option>
                <option value="evening">🌙 Evening</option>
              </select>
            </div>
          </div>
          
          <div class="days-section">
            <label>Preferred Days</label>
            <div class="days-pills">
              <button *ngFor="let day of daysOfWeek; let i = index" 
                      class="day-pill" 
                      [class.active]="selectedDays[i]"
                      (click)="selectedDays[i] = !selectedDays[i]">
                {{ day }}
              </button>
            </div>
          </div>
          
          <button class="find-btn" (click)="loadSmartSchedule()" [disabled]="loading">
            <span *ngIf="!loading">🔍 Find Best Schedule</span>
            <span *ngIf="loading">⏳ Searching...</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="loader"></div>
        <p>Finding the perfect schedule for you...</p>
      </div>

      <!-- Schedule Results -->
      <div *ngIf="!loading && scheduleResponse" class="results-section">
        
        <!-- Stats Bar -->
        <div class="stats-bar">
          <div class="stat-item">
            <div class="stat-value">{{ scheduleResponse.summary.matchedSessions }}</div>
            <div class="stat-label">Scheduled</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">{{ scheduleResponse.summary.totalSessions }}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item success" *ngIf="scheduleResponse.summary.unmatchedSessions === 0">
            <div class="stat-value">✓</div>
            <div class="stat-label">Complete</div>
          </div>
          <div class="stat-item warning" *ngIf="scheduleResponse.summary.unmatchedSessions > 0">
            <div class="stat-value">{{ scheduleResponse.summary.unmatchedSessions }}</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>

        <!-- Unavailable Subjects Warning Banner (Inline) -->
        <div class="unavailable-warning-banner" *ngIf="unavailableSubjects.length > 0">
          <div class="warning-banner-header">
            <span class="warning-banner-icon">⚠️</span>
            <span class="warning-banner-title">Some subjects have no available slots</span>
            <button class="dismiss-btn" (click)="dismissWarningAndRemoveSubjects()">✕</button>
          </div>
          <div class="warning-banner-items">
            <div *ngFor="let item of unavailableSubjects" class="warning-item">
              <span class="warning-student">{{ item.studentName }}</span>
              <span class="warning-arrow">→</span>
              <span class="warning-subject">{{ item.subjectName }}</span>
              <span class="warning-type">({{ item.teachingType }})</span>
              <span class="warning-sessions">{{ item.availableSessions }}/{{ item.requestedSessions }}</span>
            </div>
          </div>
          <div class="warning-banner-note">
            These will be removed from your booking. <a href="javascript:void(0)" (click)="cancelDueToUnavailableSubjects()">Change subjects instead</a>
          </div>
        </div>

        <!-- Schedule by Student → Subject → Slots -->
        <div class="students-schedule">
          <div *ngFor="let student of students" class="student-section">
            <!-- Student Header -->
            <div class="student-header">
              <span class="student-avatar">👤</span>
              <span class="student-name">{{ student.name }}</span>
            </div>
            
            <!-- Student's Subjects -->
            <div class="student-subjects">
              <div *ngFor="let subjectData of getSubjectsForStudent(student.id); let subjectIdx = index" 
                   class="subject-card"
                   [class.expanded]="isSubjectExpanded(student.id, subjectData.subjectId)"
                   [class.first]="subjectIdx === 0">
                <div class="subject-card-header" (click)="toggleSubject(student.id, subjectData.subjectId)">
                  <span class="subject-icon">📚</span>
                  <span class="subject-name">{{ subjectData.subjectName }}</span>
                  <div class="subject-meta">
                    <span class="badge type" [class.group]="subjectData.teachingType === 'Group'">
                      {{ subjectData.teachingType === 'Group' ? '👥 Group' : '👤 1:1' }}
                    </span>
                    <span class="badge count">{{ subjectData.slots.length }} sessions</span>
                    <span class="expand-icon">{{ isSubjectExpanded(student.id, subjectData.subjectId) ? '▼' : '▶' }}</span>
                  </div>
                </div>
                
                <div class="slots-container" *ngIf="isSubjectExpanded(student.id, subjectData.subjectId)">
                  <div class="slots-grid">
                    <div *ngFor="let slotInfo of subjectData.slots; let i = index" 
                         class="slot-card"
                         [class.swapped]="isSlotSwapped(slotInfo.slot)">
                      <div class="slot-date">
                        <span class="slot-day-name">{{ getDayName(getDisplaySlot(slotInfo.slot).dayOfWeek).substring(0,3) }}</span>
                        <span class="slot-day-num">{{ formatDayNum(getDisplaySlot(slotInfo.slot).dateTime) }}</span>
                        <span class="slot-month">{{ formatMonth(getDisplaySlot(slotInfo.slot).dateTime) }}</span>
                      </div>
                      <div class="slot-time">{{ formatTime(getDisplaySlot(slotInfo.slot).dateTime) }}</div>
                      <button class="slot-swap-btn" 
                              (click)="openSwapModal(slotInfo.teacherId, subjectData.subjectId, slotInfo.slot, $event)"
                              title="Change time">
                        ⇄
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div *ngIf="getSubjectsForStudent(student.id).length === 0" class="no-subjects">
                No subjects selected for this student
              </div>
            </div>
          </div>
        </div>

        <!-- Alternative Teachers -->
        <details *ngIf="scheduleResponse.alternativeTeachers.length > 0" class="alt-section">
          <summary>🔄 {{ scheduleResponse.alternativeTeachers.length }} Alternative Teachers</summary>
          <div class="alt-grid">
            <div *ngFor="let alt of scheduleResponse.alternativeTeachers" class="alt-card">
              <div class="alt-avatar">{{ alt.teacherName.charAt(0) }}</div>
              <div class="alt-info">
                <span class="alt-name">{{ alt.teacherName }}</span>
                <span class="alt-subject">{{ alt.subjectName }}</span>
              </div>
              <span class="alt-slots">{{ alt.availableSlots }} slots</span>
            </div>
          </div>
        </details>
      </div>

      <!-- No Schedule Found -->
      <div *ngIf="!loading && noScheduleFound" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No Schedule Found</h3>
        <p>Try adjusting your preferences or extending the date range</p>
        <button class="retry-btn" (click)="loadSmartSchedule()">🔄 Try Again</button>
      </div>

      <!-- Navigation -->
      <div class="nav-footer">
        <button class="nav-btn back" (click)="previousStep()" [disabled]="reservingSlots">
          ← Back
        </button>
        <button class="nav-btn next" (click)="nextStep()" [disabled]="!canProceed() || reservingSlots">
          {{ reservingSlots ? '⏳ Reserving...' : 'Review & Pay →' }}
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

    <!-- Unavailable Subjects Warning Modal -->
    <div class="modal-overlay" *ngIf="unavailableSubjectsModalOpen" (click)="continueWithAvailableSubjects()">
      <div class="warning-modal" (click)="$event.stopPropagation()">
        <div class="warning-modal-header">
          <span class="warning-icon">⚠️</span>
          <h3>Some Subjects Not Available</h3>
        </div>
        
        <div class="warning-modal-body">
          <p>The following subjects don't have enough available sessions:</p>
          
          <div class="unavailable-list">
            <div *ngFor="let item of unavailableSubjects" class="unavailable-item">
              <div class="unavailable-student">👤 {{ item.studentName }}</div>
              <div class="unavailable-subject">
                <span class="subject-name">📚 {{ item.subjectName }}</span>
                <span class="teaching-type">({{ item.teachingType }})</span>
              </div>
              <div class="unavailable-info">
                <span class="requested">Requested: {{ item.requestedSessions }} sessions</span>
                <span class="available">Available: {{ item.availableSessions }} sessions</span>
              </div>
              <div class="unavailable-message">{{ item.message }}</div>
            </div>
          </div>

          <div class="warning-note">
            <strong>Note:</strong> These subjects will NOT be included in your booking. 
            You will only be charged for the available subjects.
          </div>
        </div>
        
        <div class="warning-modal-footer">
          <button class="btn btn-secondary" (click)="cancelDueToUnavailableSubjects()">
            ← Go Back & Change Subjects
          </button>
          <button class="btn btn-primary" (click)="continueWithAvailableSubjects()">
            Continue with Available Subjects →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Base Container */
    .step-container {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 16px;
      padding: 0;
      min-height: 600px;
    }

    /* Hero Header */
    .hero-header {
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      color: white;
      padding: 2rem;
      border-radius: 16px 16px 0 0;
      text-align: center;
    }

    .hero-icon {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }

    .hero-header h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
      font-weight: 700;
    }

    .hero-header p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.95rem;
    }

    /* Preferences Panel */
    .preferences-panel {
      background: white;
      margin: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #f8fafc;
      cursor: pointer;
      font-weight: 600;
      color: #334155;
      transition: background 0.2s;
    }

    .panel-header:hover {
      background: #f1f5f9;
    }

    .toggle-icon {
      color: #94a3b8;
      font-size: 0.75rem;
    }

    .panel-content {
      padding: 1.5rem;
    }

    .pref-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .pref-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
    }

    .pref-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .pref-card label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pref-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.9rem;
      text-align: center;
      background: white;
    }

    .pref-input:focus {
      outline: none;
      border-color: #108092;
      box-shadow: 0 0 0 3px rgba(16,128,146,0.1);
    }

    /* Days Section */
    .days-section {
      margin-bottom: 1.5rem;
    }

    .days-section label {
      display: block;
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 0.75rem;
    }

    .days-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .day-pill {
      padding: 0.5rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 20px;
      background: white;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      color: #64748b;
      transition: all 0.2s;
    }

    .day-pill:hover {
      border-color: #108092;
      color: #108092;
    }

    .day-pill.active {
      background: #108092;
      border-color: #108092;
      color: white;
    }

    /* Find Button */
    .find-btn {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .find-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16,128,146,0.3);
    }

    .find-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .loader {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #108092;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p {
      color: #64748b;
    }

    /* Results Section */
    .results-section {
      padding: 0 1.5rem 1.5rem;
    }

    /* Stats Bar */
    .stats-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
      padding: 1rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      margin-bottom: 1.5rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #108092;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: #e2e8f0;
    }

    .stat-item.success .stat-value {
      color: #22c55e;
    }

    .stat-item.warning .stat-value {
      color: #f59e0b;
    }

    /* Split Subjects Warning */
    .split-warning {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .split-warning-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 0.75rem;
    }

    .split-icon {
      font-size: 1.25rem;
    }

    .split-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .split-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: white;
      padding: 0.75rem 1rem;
      border-radius: 8px;
    }

    .split-subject {
      font-weight: 600;
      color: #334155;
    }

    .split-teachers {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .split-teacher {
      background: #f1f5f9;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      color: #64748b;
    }

    /* Teacher Cards */
    .teacher-cards {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .teacher-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .teacher-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
    }

    .teacher-avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .teacher-info h4 {
      margin: 0;
      font-size: 1.1rem;
      color: #1e293b;
    }

    .session-count {
      font-size: 0.8rem;
      color: #64748b;
    }

    /* Inline Warning Banner */
    .unavailable-warning-banner {
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      border: 1px solid #ffb74d;
      border-radius: 12px;
      margin: 0 1.5rem 1rem 1.5rem;
      overflow: hidden;
    }

    .warning-banner-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;
    }

    .warning-banner-icon {
      font-size: 1rem;
    }

    .warning-banner-title {
      font-weight: 600;
      font-size: 0.9rem;
      flex: 1;
    }

    .dismiss-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }

    .dismiss-btn:hover {
      background: rgba(255,255,255,0.3);
    }

    .warning-banner-items {
      padding: 0.75rem 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .warning-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: white;
      padding: 0.4rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      border: 1px solid #ffcc80;
    }

    .warning-student {
      font-weight: 600;
      color: #e65100;
    }

    .warning-arrow {
      color: #999;
    }

    .warning-subject {
      color: #333;
    }

    .warning-type {
      color: #888;
      font-size: 0.75rem;
    }

    .warning-sessions {
      background: #ffccbc;
      color: #bf360c;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .warning-banner-note {
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
      color: #666;
      border-top: 1px solid #ffcc80;
      background: rgba(255,255,255,0.5);
    }

    .warning-banner-note a {
      color: #e65100;
      font-weight: 500;
    }

    /* Student Schedule Sections */
    .students-schedule {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .student-section {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .student-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      color: white;
    }

    .student-avatar {
      font-size: 1rem;
      display: flex;
      align-items: center;
    }

    .student-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: white !important;
      display: flex;
      align-items: center;
      margin: 0 !important;
      margin-bottom: 0 !important;
    }

    .student-subjects {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .no-subjects {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
    }

    /* Subject Cards (No teacher info) */
    .subjects-schedule {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .subject-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .subject-card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
    }

    .subject-icon {
      font-size: 1.5rem;
    }

    .subject-card-header .subject-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 1.1rem;
      flex: 1;
    }

    .subject-meta {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .expand-icon {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-left: 0.5rem;
      transition: transform 0.2s ease;
    }

    .subject-card-header {
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .subject-card-header:hover {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    }

    .slots-container {
      overflow: hidden;
      animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        max-height: 0;
      }
      to {
        opacity: 1;
        max-height: 1000px;
      }
    }

    .subject-card .slots-grid {
      padding: 1rem 1.25rem;
    }

    /* Subject Block (legacy) */
    .subject-block {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .subject-block:last-child {
      border-bottom: none;
    }

    .subject-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .subject-name {
      font-weight: 600;
      color: #334155;
    }

    .subject-badges {
      display: flex;
      gap: 0.5rem;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge.type {
      background: #e0f2fe;
      color: #0369a1;
    }

    .badge.type.group {
      background: #fef3c7;
      color: #b45309;
    }

    .badge.count {
      background: #f1f5f9;
      color: #64748b;
    }

    /* Slots Grid */
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 0.5rem;
    }

    .slot-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.75rem 0.5rem;
      text-align: center;
      position: relative;
      transition: all 0.2s;
    }

    .slot-card:hover {
      border-color: #108092;
      box-shadow: 0 2px 8px rgba(16,128,146,0.15);
    }

    .slot-card.swapped {
      background: #ecfdf5;
      border-color: #22c55e;
    }

    .slot-date {
      margin-bottom: 0.25rem;
    }

    .slot-day-name {
      display: block;
      font-size: 0.7rem;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .slot-day-num {
      font-size: 1.25rem;
      font-weight: 700;
      color: #334155;
    }

    .slot-month {
      display: block;
      font-size: 0.7rem;
      color: #108092;
      text-transform: uppercase;
      font-weight: 500;
    }

    .slot-card .slot-time {
      font-size: 0.8rem;
      color: #108092;
      font-weight: 600;
    }

    .slot-swap-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      background: rgba(16,128,146,0.1);
      border: none;
      border-radius: 4px;
      color: #108092;
      cursor: pointer;
      font-size: 0.7rem;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .slot-card:hover .slot-swap-btn {
      opacity: 1;
    }

    .slot-swap-btn:hover {
      background: #108092;
      color: white;
    }

    /* Alternative Section */
    .alt-section {
      margin-top: 1rem;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    .alt-section summary {
      padding: 1rem;
      cursor: pointer;
      font-weight: 500;
      color: #64748b;
    }

    .alt-grid {
      display: grid;
      gap: 0.5rem;
      padding: 0 1rem 1rem;
    }

    .alt-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    .alt-avatar {
      width: 32px;
      height: 32px;
      background: #e2e8f0;
      color: #64748b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .alt-info {
      flex: 1;
    }

    .alt-name {
      display: block;
      font-weight: 500;
      color: #334155;
      font-size: 0.9rem;
    }

    .alt-subject {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .alt-slots {
      font-size: 0.75rem;
      color: #108092;
      font-weight: 500;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: #334155;
    }

    .empty-state p {
      color: #64748b;
      margin-bottom: 1.5rem;
    }

    .retry-btn {
      padding: 0.75rem 2rem;
      background: #f1f5f9;
      border: none;
      border-radius: 8px;
      color: #334155;
      font-weight: 500;
      cursor: pointer;
    }

    .retry-btn:hover {
      background: #e2e8f0;
    }

    /* Navigation Footer */
    .nav-footer {
      display: flex;
      justify-content: space-between;
      padding: 1.5rem;
      background: white;
      border-top: 1px solid #e2e8f0;
      margin: 0 -0;
      border-radius: 0 0 16px 16px;
    }

    .nav-btn {
      padding: 0.875rem 2rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-btn.back {
      background: #f1f5f9;
      border: none;
      color: #64748b;
    }

    .nav-btn.back:hover {
      background: #e2e8f0;
    }

    .nav-btn.next {
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      border: none;
      color: white;
    }

    .nav-btn.next:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16,128,146,0.3);
    }

    .nav-btn.next:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

    /* Warning Modal Styles */
    .warning-modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 550px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }

    .warning-modal-header {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .warning-modal-header .warning-icon {
      font-size: 1.5rem;
    }

    .warning-modal-header h3 {
      margin: 0;
      font-size: 1.15rem;
    }

    .warning-modal-body {
      padding: 1.5rem;
      max-height: 60vh;
      overflow-y: auto;
    }

    .warning-modal-body > p {
      margin: 0 0 1rem 0;
      color: #666;
    }

    .unavailable-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .unavailable-item {
      background: #fff3e0;
      border: 1px solid #ffcc80;
      border-radius: 8px;
      padding: 1rem;
    }

    .unavailable-student {
      font-weight: 600;
      color: #e65100;
      margin-bottom: 0.5rem;
    }

    .unavailable-subject {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .unavailable-subject .subject-name {
      font-weight: 500;
      color: #333;
    }

    .unavailable-subject .teaching-type {
      color: #888;
      font-size: 0.85rem;
    }

    .unavailable-info {
      display: flex;
      gap: 1rem;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }

    .unavailable-info .requested {
      color: #d32f2f;
    }

    .unavailable-info .available {
      color: #388e3c;
    }

    .unavailable-message {
      font-size: 0.8rem;
      color: #666;
      font-style: italic;
    }

    .warning-note {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #1565c0;
    }

    .warning-modal-footer {
      padding: 1rem 1.5rem;
      background: #f5f5f5;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .warning-modal-footer .btn {
      padding: 0.75rem 1.25rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .warning-modal-footer .btn-secondary {
      background: white;
      color: #666;
      border: 1px solid #ddd;
    }

    .warning-modal-footer .btn-secondary:hover {
      background: #f5f5f5;
    }

    .warning-modal-footer .btn-primary {
      background: linear-gradient(135deg, #009688 0%, #00796b 100%);
      color: white;
    }

    .warning-modal-footer .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,150,136,0.3);
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

  // UI State
  preferencesExpanded = true;

  // Collapsible subjects state: Map of "studentId_subjectId" -> isExpanded
  expandedSubjects = new Set<string>();
  hoveredSubject: string | null = null;
  firstSubjectsInitialized = false;

  // Cached schedule data to prevent re-calculation on every render
  cachedStudentSchedules: Map<number, Array<{
    subjectId: number;
    subjectName: string;
    teachingType: string;
    slots: Array<{ slot: ScheduledSlotDto; teacherId: number }>;
  }>> = new Map();

  // Slot Reservation State
  reservationSessionToken: string | null = null;
  reservationExpiresAt: Date | null = null;
  reservationTimer: any = null;
  reservationRemainingMinutes: number = 0;
  reservationRemainingSeconds: number = 0;
  reservingSlots: boolean = false;

  // Unavailable Subjects Warning
  unavailableSubjectsModalOpen: boolean = false;
  unavailableSubjects: Array<{
    studentId: number;
    studentName: string;
    subjectId: number;
    subjectName: string;
    teachingType: string;
    requestedSessions: number;
    availableSessions: number;
    message: string;
  }> = [];

  constructor(
    private stateService: TutoringStateService,
    private tutoringService: TutoringService,
    private contentService: ContentService,
    private cdr: ChangeDetectorRef
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

    // Build student selections for API (with per-subject term info)
    const studentSelections: SmartSchedulingStudentSelection[] = this.students.map(student => {
      const subjectIds = state.studentSubjects.get(student.id) || new Set();

      const subjects: SmartSchedulingSubjectSelection[] = Array.from(subjectIds).map(subjectId => {
        const key = `${student.id}_${subjectId}`;
        const teachingType = state.subjectTeachingTypes.get(key) || TeachingType.OneToOne;
        const hours = (state.subjectHours.get(key) || 10) as HoursOption;

        // Get term ID from state (null if global subject or not selected)
        const termId = state.subjectTerms.get(key) || null;

        // Determine if subject is global (no term required)
        // If termId is null and subject still passed validation, it's global
        const isGlobal = termId === null;

        console.log(`📚 Subject ${subjectId}: termId=${termId}, isGlobal=${isGlobal}`);

        return {
          subjectId,
          teachingType,
          hours,
          academicTermId: termId,
          isGlobal
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
          // Build cached data first, then initialize expanded subjects
          this.buildCachedSchedules();
          this.initializeFirstSubjects();
          // Check for unavailable subjects and show warning
          this.checkUnavailableSubjects();
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

  getTotalSessions(teacher: ScheduledTeacherDto): number {
    return teacher.subjectSchedules.reduce((total, s) => total + s.assignedSessions, 0);
  }

  formatDayNum(dateTime: string): string {
    const date = new Date(dateTime);
    return date.getDate().toString();
  }

  formatMonth(dateTime: string): string {
    const date = new Date(dateTime);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
  }

  // Group all slots by subject (merging from multiple teachers)
  getGroupedSubjectSlots(): Array<{
    subjectId: number;
    subjectName: string;
    teachingType: string;
    slots: Array<{ slot: ScheduledSlotDto; teacherId: number }>;
  }> {
    if (!this.scheduleResponse) return [];

    const subjectMap = new Map<number, {
      subjectId: number;
      subjectName: string;
      teachingType: string;
      slots: Array<{ slot: ScheduledSlotDto; teacherId: number }>;
    }>();

    // Collect all slots from all teachers, grouped by subject
    this.scheduleResponse.recommendedSchedule.teachers.forEach(teacher => {
      teacher.subjectSchedules.forEach(schedule => {
        if (!subjectMap.has(schedule.subjectId)) {
          subjectMap.set(schedule.subjectId, {
            subjectId: schedule.subjectId,
            subjectName: schedule.subjectName,
            teachingType: schedule.teachingType,
            slots: []
          });
        }

        const subjectData = subjectMap.get(schedule.subjectId)!;
        schedule.slots.forEach(slot => {
          subjectData.slots.push({ slot, teacherId: teacher.teacherId });
        });
      });
    });

    // Convert to array and sort slots by date
    const result = Array.from(subjectMap.values());
    result.forEach(subject => {
      subject.slots.sort((a, b) =>
        new Date(this.getDisplaySlot(a.slot).dateTime).getTime() -
        new Date(this.getDisplaySlot(b.slot).dateTime).getTime()
      );
    });

    return result;
  }

  // Get subjects and slots for a specific student
  getSubjectsForStudent(studentId: number): Array<{
    subjectId: number;
    subjectName: string;
    teachingType: string;
    slots: Array<{ slot: ScheduledSlotDto; teacherId: number }>;
  }> {
    // Return cached data if available
    if (this.cachedStudentSchedules.has(studentId)) {
      return this.cachedStudentSchedules.get(studentId)!;
    }
    return [];
  }

  // Build cached data for all students (called once after schedule loads)
  // Now uses studentId from backend response for correct grouping
  buildCachedSchedules(): void {
    this.cachedStudentSchedules.clear();

    if (!this.scheduleResponse) return;

    // Group schedules by studentId from the response
    this.students.forEach(student => {
      const studentSubjects: Array<{
        subjectId: number;
        subjectName: string;
        teachingType: string;
        slots: Array<{ slot: ScheduledSlotDto; teacherId: number }>;
      }> = [];

      // Collect all subjects for this student from all teachers
      this.scheduleResponse!.recommendedSchedule.teachers.forEach(teacher => {
        teacher.subjectSchedules
          .filter(schedule => schedule.studentId === student.id)
          .forEach(schedule => {
            // Check if we already have this subject for this student
            let existingSubject = studentSubjects.find(s => s.subjectId === schedule.subjectId);

            if (!existingSubject) {
              existingSubject = {
                subjectId: schedule.subjectId,
                subjectName: schedule.subjectName,
                teachingType: schedule.teachingType,
                slots: []
              };
              studentSubjects.push(existingSubject);
            }

            // Add slots from this teacher
            schedule.slots.forEach(slot => {
              existingSubject!.slots.push({
                slot: slot,
                teacherId: teacher.teacherId
              });
            });
          });
      });

      // Sort slots by date
      studentSubjects.forEach(subject => {
        subject.slots.sort((a, b) =>
          new Date(a.slot.dateTime).getTime() - new Date(b.slot.dateTime).getTime()
        );
      });

      this.cachedStudentSchedules.set(student.id, studentSubjects);
    });

    console.log('📚 Built cached schedules for', this.cachedStudentSchedules.size, 'students');
  }

  // Initialize first subject of each student as expanded
  initializeFirstSubjects(): void {
    this.firstSubjectsInitialized = true;
    console.log('🔓 Initializing first subjects, students:', this.students.length);
    console.log('📚 Cached schedules:', this.cachedStudentSchedules.size);

    this.students.forEach(student => {
      const studentSubjects = this.cachedStudentSchedules.get(student.id) || [];
      console.log(`👤 Student ${student.id} has ${studentSubjects.length} subjects`);
      if (studentSubjects.length > 0) {
        const key = `${student.id}_${studentSubjects[0].subjectId}`;
        this.expandedSubjects.add(key);
        console.log(`✅ Expanded: ${key}`);
      }
    });
    console.log('📂 Total expanded subjects:', this.expandedSubjects.size);
    // Force UI update
    this.cdr.detectChanges();
  }

  // Check for subjects that don't have full sessions available
  checkUnavailableSubjects(): void {
    if (!this.scheduleResponse?.summary?.subjectAvailability) {
      console.log('ℹ️ No subjectAvailability data in response');
      return;
    }

    // Find subjects that are NOT fully covered
    const unavailable = this.scheduleResponse.summary.subjectAvailability
      .filter(sa => !sa.isFullyCovered);

    if (unavailable.length === 0) {
      console.log('✅ All subjects are fully covered');
      return;
    }

    console.log('⚠️ Found unavailable subjects:', unavailable);

    // Build list with student info
    this.unavailableSubjects = unavailable.map(sa => {
      // Try to find student name
      const student = this.students.find(s => s.id === sa.studentId);
      return {
        studentId: sa.studentId || 0,
        studentName: sa.studentName || student?.name || 'Unknown Student',
        subjectId: sa.subjectId,
        subjectName: sa.subjectName,
        teachingType: sa.teachingType,
        requestedSessions: sa.requestedSessions,
        availableSessions: sa.availableSessions,
        message: sa.message
      };
    });

    // Inline banner shows automatically via *ngIf
    // No need to trigger modal anymore
  }

  // Continue booking after acknowledging unavailable subjects
  continueWithAvailableSubjects(): void {
    // Remove unavailable subjects from state
    this.removeUnavailableSubjectsFromState();
    this.unavailableSubjectsModalOpen = false;
    console.log('👍 User chose to continue with available subjects - unavailable removed from state');
  }

  // Remove unavailable subjects from the state service
  removeUnavailableSubjectsFromState(): void {
    // For each unavailable subject, remove it completely from state
    this.unavailableSubjects.forEach(item => {
      this.stateService.removeSubjectFromStudent(item.studentId, item.subjectId);
    });
    console.log('✅ State updated - unavailable subjects removed');
  }

  // Dismiss warning banner and remove unavailable subjects
  dismissWarningAndRemoveSubjects(): void {
    this.removeUnavailableSubjectsFromState();
    this.unavailableSubjects = [];
    console.log('👋 Warning banner dismissed, subjects removed');
  }

  // Cancel booking due to unavailable subjects
  cancelDueToUnavailableSubjects(): void {
    this.unavailableSubjectsModalOpen = false;
    // Go back to subject selection
    this.stateService.setCurrentStep(2); // Step 2 is subject selection
  }

  // Check if a subject is expanded
  isSubjectExpanded(studentId: number, subjectId: number): boolean {
    const key = `${studentId}_${subjectId}`;
    return this.expandedSubjects.has(key);
  }

  // Toggle subject expanded/collapsed
  toggleSubject(studentId: number, subjectId: number): void {
    const key = `${studentId}_${subjectId}`;
    if (this.expandedSubjects.has(key)) {
      this.expandedSubjects.delete(key);
    } else {
      this.expandedSubjects.add(key);
    }
  }

  getTeacherDisplayName(teacher: ScheduledTeacherDto): string {
    return teacher.teacherName || `Teacher #${teacher.teacherId}`;
  }

  getTeacherInitial(teacher: ScheduledTeacherDto): string {
    const name = teacher.teacherName || '';
    return name.length > 0 ? name.charAt(0).toUpperCase() : 'T';
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
    // Cancel any reservations before going back
    this.cancelReservationsAndGoBack();
  }

  cancelReservationsAndGoBack(): void {
    if (this.reservationSessionToken) {
      this.tutoringService.cancelReservations(this.reservationSessionToken).subscribe({
        next: () => {
          this.clearReservationState();
          this.stateService.previousStep();
        },
        error: () => {
          this.clearReservationState();
          this.stateService.previousStep();
        }
      });
    } else {
      this.stateService.previousStep();
    }
  }

  nextStep(): void {
    if (this.canProceed()) {
      this.proceedToPayment();
    }
  }

  // Reserve slots before proceeding to payment
  proceedToPayment(): void {
    if (this.reservingSlots) return;

    // Auto-remove unavailable subjects before proceeding
    if (this.unavailableSubjects.length > 0) {
      console.log('🗑️ Auto-removing unavailable subjects before payment...');
      this.removeUnavailableSubjectsFromState();
      this.unavailableSubjects = [];
    }

    // Collect all slots to reserve from all teachers
    const slotsToReserve: Array<{
      availabilityId: number;
      dateTime: string;
      teacherId: number;
      subjectId: number;
      teachingType: string;
    }> = [];

    if (this.scheduleResponse) {
      this.scheduleResponse.recommendedSchedule.teachers.forEach(teacher => {
        teacher.subjectSchedules.forEach(schedule => {
          schedule.slots.forEach(slot => {
            // Use swapped slot if exists
            const displaySlot = this.getDisplaySlot(slot);
            slotsToReserve.push({
              availabilityId: displaySlot.availabilityId,
              dateTime: displaySlot.dateTime,
              teacherId: teacher.teacherId,
              subjectId: schedule.subjectId,
              teachingType: schedule.teachingType
            });
          });
        });
      });
    }

    if (slotsToReserve.length === 0) {
      console.warn('No slots to reserve');
      return;
    }

    this.reservingSlots = true;
    console.log('🔒 Reserving', slotsToReserve.length, 'slots...');

    this.tutoringService.reserveSlots({
      slots: slotsToReserve,
      expirationMinutes: 15
    }).subscribe({
      next: (result) => {
        this.reservingSlots = false;
        if (result.success) {
          console.log('✅ Slots reserved successfully, token:', result.sessionToken);
          this.reservationSessionToken = result.sessionToken;
          this.reservationExpiresAt = new Date(result.expiresAt);
          this.startReservationTimer();
          // Proceed to next step (payment)
          this.stateService.nextStep();
        } else {
          console.error('❌ Some slots not available:', result.failedSlots);
          alert(`Some slots are no longer available. Please refresh and try again.`);
        }
      },
      error: (err) => {
        this.reservingSlots = false;
        console.error('❌ Error reserving slots:', err);
        alert('Failed to reserve slots. Please try again.');
      }
    });
  }

  // Timer for reservation countdown
  startReservationTimer(): void {
    if (this.reservationTimer) {
      clearInterval(this.reservationTimer);
    }

    this.reservationTimer = setInterval(() => {
      if (!this.reservationExpiresAt) {
        this.stopReservationTimer();
        return;
      }

      const remaining = this.reservationExpiresAt.getTime() - Date.now();

      if (remaining <= 0) {
        this.stopReservationTimer();
        this.clearReservationState();
        alert('Your reservation has expired. Please select slots again.');
        // Reload the schedule
        this.loadSmartSchedule();
      } else {
        this.reservationRemainingMinutes = Math.floor(remaining / 60000);
        this.reservationRemainingSeconds = Math.floor((remaining % 60000) / 1000);
      }
    }, 1000);
  }

  stopReservationTimer(): void {
    if (this.reservationTimer) {
      clearInterval(this.reservationTimer);
      this.reservationTimer = null;
    }
  }

  clearReservationState(): void {
    this.stopReservationTimer();
    this.reservationSessionToken = null;
    this.reservationExpiresAt = null;
    this.reservationRemainingMinutes = 0;
    this.reservationRemainingSeconds = 0;
  }

  // Extend reservation if user needs more time
  extendReservation(): void {
    if (!this.reservationSessionToken) return;

    this.tutoringService.extendReservations(this.reservationSessionToken, 10).subscribe({
      next: (result) => {
        if (result.success) {
          this.reservationExpiresAt = new Date(result.newExpiresAt);
          console.log('⏰ Reservation extended to:', result.newExpiresAt);
        }
      },
      error: (err) => {
        console.error('Failed to extend reservation:', err);
      }
    });
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

    // Get teaching type and term info for this subject
    const state = this.stateService.getState();
    const student = this.students[0];
    let teachingType = 'OneToOne';
    let termId: number | null = null;
    let isGlobal = false;

    if (student) {
      const key = `${student.id}_${subjectId}`;
      const tt = state.subjectTeachingTypes.get(key);
      if (tt) teachingType = tt;

      // Get term info for per-subject date resolution
      termId = state.subjectTerms.get(key) || null;
      isGlobal = termId === null;
    }

    console.log(`🔄 Loading alternatives: termId=${termId}, isGlobal=${isGlobal}`);

    // Call the Alternative Slots API with per-subject term info
    this.tutoringService.getAlternativeSlots(
      teacherId,
      subjectId,
      teachingType,
      this.startDate,  // Fallback for global subjects
      this.endDate,    // Fallback for global subjects
      excludeSlotIds,
      termId,          // Per-subject term
      isGlobal         // Is this a global subject?
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
