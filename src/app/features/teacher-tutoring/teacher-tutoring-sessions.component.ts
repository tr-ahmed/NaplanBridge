import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutoringService } from '../../core/services/tutoring.service';
import { TutoringSessionDto, TutoringSessionStatus } from '../../models/tutoring.models';

@Component({
  selector: 'app-teacher-tutoring-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sessions-container">
      <h1 class="page-title">📚 My Tutoring Sessions</h1>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label>Status:</label>
          <select [(ngModel)]="selectedStatus" (ngModelChange)="filterSessions()">
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Date Range:</label>
          <input type="date" [(ngModel)]="startDate" (ngModelChange)="filterSessions()">
          <span>to</span>
          <input type="date" [(ngModel)]="endDate" (ngModelChange)="filterSessions()">
        </div>

        <button (click)="loadSessions()" class="btn btn-refresh">🔄 Refresh</button>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <h3>{{ getSessionsByStatus('Scheduled').length }}</h3>
            <p>Scheduled</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">▶️</div>
          <div class="stat-content">
            <h3>{{ getSessionsByStatus('InProgress').length }}</h3>
            <p>In Progress</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <h3>{{ getSessionsByStatus('Completed').length }}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <h3>{{ totalEarnings }}</h3>
            <p>Total Earnings</p>
          </div>
        </div>
      </div>

      <!-- Sessions Calendar View -->
      <div class="calendar-section">
        <h2>📆 Calendar View</h2>
        <div class="calendar-grid">
          <div *ngFor="let day of weekDays" class="day-column">
            <h3 class="day-header">{{ day }}</h3>
            <div class="sessions-list">
              <div
                *ngFor="let session of getSessionsByDay(day)"
                [class.scheduled]="session.status === 'Scheduled'"
                [class.in-progress]="session.status === 'InProgress'"
                [class.completed]="session.status === 'Completed'"
                [class.cancelled]="session.status === 'Cancelled'"
                class="session-card"
                (click)="openSessionDetails(session)">
                <div class="session-time">{{ session.startTime }}</div>
                <div class="session-student">👤 {{ session.studentName }}</div>
                <div class="session-subject">📖 {{ session.subjectName }}</div>
                <div class="session-status">{{ session.status }}</div>
              </div>
              <div *ngIf="getSessionsByDay(day).length === 0" class="no-sessions">
                No sessions
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sessions Table -->
      <div class="table-section">
        <h2>📋 All Sessions</h2>
        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Loading sessions...</p>
        </div>

        <table *ngIf="!loading && filteredSessions.length > 0" class="sessions-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Student</th>
              <th>Subject</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Meeting Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let session of filteredSessions">
              <td>
                <strong>{{ formatDate(session.dateTime) }}</strong><br>
                <small>{{ formatTime(session.dateTime) }}</small>
              </td>
              <td>{{ session.studentName }}</td>
              <td>{{ session.subjectName }}</td>
              <td>{{ session.duration }} min</td>
              <td>
                <span [class]="'status-badge ' + session.status.toLowerCase()">
                  {{ session.status }}
                </span>
              </td>
              <td>
                <a *ngIf="session.meetingLink" [href]="session.meetingLink" target="_blank" class="link-btn">
                  🔗 Join
                </a>
                <button *ngIf="!session.meetingLink && session.status === 'Scheduled'"
                        (click)="addMeetingLink(session)"
                        class="btn btn-small">
                  + Add Link
                </button>
                <span *ngIf="!session.meetingLink && session.status !== 'Scheduled'">-</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    *ngIf="session.status === 'Scheduled'"
                    (click)="startSession(session)"
                    class="btn btn-small btn-primary">
                    ▶️ Start
                  </button>
                  <button
                    *ngIf="session.status === 'InProgress'"
                    (click)="completeSession(session)"
                    class="btn btn-small btn-success">
                    ✅ Complete
                  </button>
                  <button
                    *ngIf="session.status === 'Scheduled'"
                    (click)="cancelSession(session)"
                    class="btn btn-small btn-danger">
                    ❌ Cancel
                  </button>
                  <button
                    (click)="addNotes(session)"
                    class="btn btn-small">
                    📝 Notes
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="!loading && filteredSessions.length === 0" class="no-data">
          <p>No sessions found</p>
        </div>
      </div>
    </div>

    <!-- Session Details Modal -->
    <div *ngIf="selectedSession" class="modal-overlay" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h2>📋 Session Details</h2>
        <div class="details-grid">
          <div class="detail-item">
            <label>Student:</label>
            <span>{{ selectedSession.studentName }}</span>
          </div>
          <div class="detail-item">
            <label>Subject:</label>
            <span>{{ selectedSession.subjectName }}</span>
          </div>
          <div class="detail-item">
            <label>Date & Time:</label>
            <span>{{ formatDate(selectedSession.dateTime) }} {{ formatTime(selectedSession.dateTime) }}</span>
          </div>
          <div class="detail-item">
            <label>Duration:</label>
            <span>{{ selectedSession.duration }} minutes</span>
          </div>
          <div class="detail-item">
            <label>Status:</label>
            <span class="status-badge">{{ selectedSession.status }}</span>
          </div>
          <div class="detail-item">
            <label>Meeting Link:</label>
            <span>{{ selectedSession.meetingLink || 'Not set' }}</span>
          </div>
          <div class="detail-item full-width">
            <label>Notes:</label>
            <textarea [(ngModel)]="selectedSession.notes" rows="4"></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button (click)="saveSessionNotes()" class="btn btn-primary">💾 Save Notes</button>
          <button (click)="closeModal()" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sessions-container {
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

    .filters-section {
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

    .filter-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .filter-group label {
      font-weight: 600;
      color: #555;
    }

    .filter-group select,
    .filter-group input {
      padding: 0.5rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      font-size: 2.5rem;
    }

    .stat-content h3 {
      font-size: 2rem;
      font-weight: 700;
      color: #108092;
      margin: 0;
    }

    .stat-content p {
      font-size: 0.875rem;
      color: #666;
      margin: 0;
    }

    .calendar-section,
    .table-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .calendar-section h2,
    .table-section h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 1.5rem;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1rem;
    }

    .day-column {
      min-height: 200px;
    }

    .day-header {
      font-size: 1rem;
      font-weight: 600;
      color: #555;
      text-align: center;
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 8px 8px 0 0;
      margin: 0;
    }

    .sessions-list {
      padding: 0.5rem;
      background: #fafafa;
      border-radius: 0 0 8px 8px;
      min-height: 150px;
    }

    .session-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .session-card:hover {
      border-color: #108092;
      transform: translateX(2px);
    }

    .session-card.scheduled {
      border-left: 4px solid #2196f3;
    }

    .session-card.in-progress {
      border-left: 4px solid #ff9800;
    }

    .session-card.completed {
      border-left: 4px solid #4caf50;
    }

    .session-card.cancelled {
      border-left: 4px solid #f44336;
      opacity: 0.6;
    }

    .session-time {
      font-weight: 700;
      color: #108092;
      font-size: 0.875rem;
    }

    .session-student,
    .session-subject {
      font-size: 0.75rem;
      color: #666;
      margin: 0.25rem 0;
    }

    .session-status {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #888;
    }

    .no-sessions {
      text-align: center;
      padding: 2rem 0.5rem;
      color: #999;
      font-size: 0.875rem;
    }

    .sessions-table {
      width: 100%;
      border-collapse: collapse;
    }

    .sessions-table th,
    .sessions-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    .sessions-table th {
      background: #f5f5f5;
      font-weight: 600;
      color: #555;
    }

    .sessions-table tr:hover {
      background: #f9f9f9;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.scheduled {
      background: #e3f2fd;
      color: #2196f3;
    }

    .status-badge.inprogress {
      background: #fff3e0;
      color: #ff9800;
    }

    .status-badge.completed {
      background: #e8f5e9;
      color: #4caf50;
    }

    .status-badge.cancelled {
      background: #ffebee;
      color: #f44336;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-small {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: #108092;
      color: white;
    }

    .btn-primary:hover {
      background: #0d6a7a;
    }

    .btn-success {
      background: #4caf50;
      color: white;
    }

    .btn-success:hover {
      background: #45a049;
    }

    .btn-danger {
      background: #f44336;
      color: white;
    }

    .btn-danger:hover {
      background: #d32f2f;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #666;
    }

    .btn-refresh {
      background: #108092;
      color: white;
    }

    .link-btn {
      color: #108092;
      text-decoration: none;
      font-weight: 600;
    }

    .link-btn:hover {
      text-decoration: underline;
    }

    .loading,
    .no-data {
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

    .modal-overlay {
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

    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-item.full-width {
      grid-column: 1 / -1;
    }

    .detail-item label {
      font-weight: 600;
      color: #555;
      font-size: 0.875rem;
    }

    .detail-item span {
      color: #333;
    }

    .detail-item textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-family: inherit;
      resize: vertical;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    @media (max-width: 768px) {
      .calendar-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .sessions-table {
        font-size: 0.875rem;
      }

      .action-buttons {
        flex-direction: column;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TeacherTutoringSessionsComponent implements OnInit {
  sessions: TutoringSessionDto[] = [];
  filteredSessions: TutoringSessionDto[] = [];
  selectedSession: TutoringSessionDto | null = null;
  loading = false;

  selectedStatus = '';
  startDate = '';
  endDate = '';

  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  totalEarnings = '$0';

  constructor(private tutoringService: TutoringService) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading = true;

    // Use real API
    this.tutoringService.getTeacherSessions(this.selectedStatus, this.startDate, this.endDate)
      .subscribe({
        next: (sessions) => {
          this.sessions = sessions;
          this.filteredSessions = [...this.sessions];
          this.calculateEarnings();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading sessions:', error);
          // Fallback to mock data if API fails
          this.sessions = this.generateMockSessions();
          this.filteredSessions = [...this.sessions];
          this.calculateEarnings();
          this.loading = false;
        }
      });
  }

  generateMockSessions(): TutoringSessionDto[] {
    const sessions: TutoringSessionDto[] = [];
    const statuses: TutoringSessionStatus[] = [
      TutoringSessionStatus.Scheduled,
      TutoringSessionStatus.InProgress,
      TutoringSessionStatus.Completed,
      TutoringSessionStatus.Cancelled
    ];
    const students = ['Ahmed', 'Sara', 'Ali', 'Fatima', 'Omar'];
    const subjects = ['Math', 'English', 'Science', 'Arabic', 'History'];

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + (i % 7));
      const hour = 9 + (i % 8);
      date.setHours(hour);

      sessions.push({
        id: i + 1,
        studentName: students[i % students.length],
        subjectName: subjects[i % subjects.length],
        teacherName: 'Current Teacher',
        dateTime: date,
        startTime: `${hour}:00`, // Added startTime
        duration: 60,
        status: statuses[i % statuses.length],
        meetingLink: i % 2 === 0 ? 'https://zoom.us/j/123456' : undefined,
        notes: i % 3 === 0 ? 'Student needs extra help with algebra' : undefined
      });
    }

    return sessions;
  }

  filterSessions(): void {
    this.filteredSessions = this.sessions.filter(session => {
      if (this.selectedStatus && session.status !== this.selectedStatus) {
        return false;
      }

      if (this.startDate) {
        const sessionDate = new Date(session.dateTime);
        const start = new Date(this.startDate);
        if (sessionDate < start) return false;
      }

      if (this.endDate) {
        const sessionDate = new Date(session.dateTime);
        const end = new Date(this.endDate);
        if (sessionDate > end) return false;
      }

      return true;
    });
  }

  getSessionsByStatus(status: string): TutoringSessionDto[] {
    return this.filteredSessions.filter(s => s.status === status);
  }

  getSessionsByDay(day: string): TutoringSessionDto[] {
    return this.filteredSessions.filter(session => {
      const sessionDay = new Date(session.dateTime).toLocaleDateString('en-US', { weekday: 'long' });
      return sessionDay === day;
    });
  }

  calculateEarnings(): void {
    const completed = this.sessions.filter(s => s.status === 'Completed').length;
    this.totalEarnings = `$${completed * 50}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openSessionDetails(session: TutoringSessionDto): void {
    this.selectedSession = { ...session };
  }

  closeModal(): void {
    this.selectedSession = null;
  }

  saveSessionNotes(): void {
    if (this.selectedSession) {
      this.tutoringService.updateSessionNotes(this.selectedSession.id, this.selectedSession.notes || '').subscribe({
        next: () => {
          const index = this.sessions.findIndex(s => s.id === this.selectedSession!.id);
          if (index > -1 && this.selectedSession) {
            this.sessions[index].notes = this.selectedSession.notes;
          }
          alert('Notes saved successfully!');
          this.closeModal();
        },
        error: (error) => {
          console.error('Error saving notes:', error);
          alert('Failed to save notes. Please try again.');
        }
      });
    }
  }

  startSession(session: TutoringSessionDto): void {
    if (confirm(`Start session with ${session.studentName}?`)) {
      this.tutoringService.startSession(session.id).subscribe({
        next: () => {
          session.status = TutoringSessionStatus.InProgress;
          alert('Session started!');
        },
        error: (error) => {
          console.error('Error starting session:', error);
          alert('Failed to start session. Please try again.');
        }
      });
    }
  }

  completeSession(session: TutoringSessionDto): void {
    if (confirm(`Mark this session as completed?`)) {
      this.tutoringService.completeSession(session.id).subscribe({
        next: () => {
          session.status = TutoringSessionStatus.Completed;
          alert('Session completed!');
          this.calculateEarnings();
        },
        error: (error) => {
          console.error('Error completing session:', error);
          alert('Failed to complete session. Please try again.');
        }
      });
    }
  }

  cancelSession(session: TutoringSessionDto): void {
    const reason = prompt('Reason for cancellation (optional):');
    if (confirm(`Cancel session with ${session.studentName}?`)) {
      this.tutoringService.cancelSession(session.id, reason || undefined).subscribe({
        next: () => {
          session.status = TutoringSessionStatus.Cancelled;
          alert('Session cancelled!');
        },
        error: (error) => {
          console.error('Error cancelling session:', error);
          alert('Failed to cancel session. Please try again.');
        }
      });
    }
  }

  addMeetingLink(session: TutoringSessionDto): void {
    const link = prompt('Enter meeting link (e.g., Zoom, Google Meet):');
    if (link) {
      this.tutoringService.updateMeetingLink(session.id, link).subscribe({
        next: () => {
          session.meetingLink = link;
          alert('Meeting link added!');
        },
        error: (error) => {
          console.error('Error adding meeting link:', error);
          alert('Failed to add meeting link. Please try again.');
        }
      });
    }
  }

  addNotes(session: TutoringSessionDto): void {
    this.openSessionDetails(session);
  }
}
