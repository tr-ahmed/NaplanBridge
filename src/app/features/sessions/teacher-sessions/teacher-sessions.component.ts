/**
 * Teacher Sessions Dashboard Component
 * For teachers to view their upcoming and past sessions
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../../core/services/session.service';
import { ToastService } from '../../../core/services/toast.service';
import { PrivateSessionDto } from '../../../models/session.models';
import { TeacherSidebarComponent } from '../../../shared/components/teacher-sidebar/teacher-sidebar.component';
import { TeacherHeaderComponent } from '../../../shared/components/teacher-header/teacher-header.component';

@Component({
  selector: 'app-teacher-sessions',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './teacher-sessions.component.html',
  styleUrl: './teacher-sessions.component.scss'
})
export class TeacherSessionsComponent implements OnInit {
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);

  upcomingSessions = signal<PrivateSessionDto[]>([]);
  pastSessions = signal<PrivateSessionDto[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<'upcoming' | 'history'>('upcoming');

  // Meeting Link Dialog
  showMeetingDialog = signal<boolean>(false);
  selectedSession = signal<PrivateSessionDto | null>(null);
  meetingLinkInput = '';

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading.set(true);

    // Load upcoming sessions
    this.sessionService.getTeacherUpcomingSessions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.upcomingSessions.set(response.data);
        }
      },
      error: (error) => console.error('Error loading upcoming sessions:', error)
    });

    // Load past sessions
    this.sessionService.getTeacherSessionHistory().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pastSessions.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading session history:', error);
        this.loading.set(false);
      }
    });
  }

  formatDateTime(dateTime: string): string {
    const { date, time, dayOfWeek } = this.sessionService.formatSessionDateTime(dateTime);
    return `${dayOfWeek}، ${date} - ${time}`;
  }

  /**
   * Convert status number to readable text
   * 0 = Pending, 1 = Confirmed, 2 = Completed, 3 = Cancelled
   * Unknown/null/undefined = Pending Payment (حجز تم إنشاؤه لكن لم يتم الدفع)
   */
  getReadableStatus(status: any): string {
    const statusStr = status?.toString();

    const statusMap: { [key: string]: string } = {
      '0': 'Pending',
      '1': 'Confirmed',
      '2': 'Completed',
      '3': 'Cancelled',
      'Pending': 'Pending',
      'Confirmed': 'Confirmed',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled',
      'Unknown': 'Pending Payment',
      'null': 'Pending Payment',
      'undefined': 'Pending Payment'
    };

    return statusMap[statusStr] || 'Pending Payment';
  }

  getStatusClass(status: any): string {
    const readableStatus = this.getReadableStatus(status);

    const classes: { [key: string]: string } = {
      'Confirmed': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200',
      'Completed': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200',
      'Cancelled': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200',
      'Pending': 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200',
      'Pending Payment': 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200'
    };
    return classes[readableStatus] || 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200';
  }

  getStatusText(status: any): string {
    const readableStatus = this.getReadableStatus(status);

    const texts: { [key: string]: string } = {
      'Confirmed': '✅ Confirmed',
      'Completed': '✔️ Completed',
      'Cancelled': '❌ Cancelled',
      'Pending': '⏳ Pending',
      'Pending Payment': '💳 Pending Payment'
    };
    return texts[readableStatus] || '💳 ' + readableStatus;
  }  setTab(tab: 'upcoming' | 'history'): void {
    this.activeTab.set(tab);
  }

  /**
   * Open meeting link dialog
   */
  openMeetingLinkDialog(session: PrivateSessionDto): void {
    this.selectedSession.set(session);
    this.meetingLinkInput = session.googleMeetLink || '';
    this.showMeetingDialog.set(true);
  }

  /**
   * Close meeting link dialog
   */
  closeMeetingLinkDialog(): void {
    this.showMeetingDialog.set(false);
    this.selectedSession.set(null);
    this.meetingLinkInput = '';
  }

  /**
   * Save meeting link
   */
  saveMeetingLink(): void {
    const session = this.selectedSession();
    if (!session) return;

    if (!this.meetingLinkInput || !this.meetingLinkInput.trim()) {
      this.toastService.showError('Please enter a valid Google Meet link');
      return;
    }

    // Validate URL format
    if (!this.meetingLinkInput.includes('meet.google.com')) {
      this.toastService.showError('Please enter a valid Google Meet link');
      return;
    }

    this.sessionService.updateSessionMeetingLink(session.id, this.meetingLinkInput).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.showSuccess('Meeting link saved successfully!');
          this.closeMeetingLinkDialog();
          this.loadSessions(); // Reload to get updated data
        }
      },
      error: (error) => {
        console.error('Error saving meeting link:', error);
        this.toastService.showError('Failed to save meeting link');
      }
    });
  }

  /**
   * Mark session as completed
   */
  markAsCompleted(session: PrivateSessionDto): void {
    console.log('🔵 Attempting to complete session:', session);
    
    if (!confirm(`Mark this session with ${session.studentName} as completed?`)) {
      return;
    }

    this.sessionService.markSessionAsCompleted(session.id).subscribe({
      next: (response) => {
        console.log('✅ Session completed response:', response);
        if (response.success) {
          this.toastService.showSuccess('Session marked as completed!');
          this.loadSessions();
        }
      },
      error: (error) => {
        console.error('❌ Error marking session as completed:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        this.toastService.showError(error.message || 'Failed to mark session as completed');
      }
    });
  }

  /**
   * Join session - Opens Google Meet in new tab
   */
  joinSession(session: PrivateSessionDto): void {
    if (session.googleMeetLink) {
      window.open(session.googleMeetLink, '_blank');
      this.toastService.showSuccess('Opening session...');
    } else {
      this.toastService.showWarning('Meeting link not set yet');
    }
  }

  /**
   * Copy meeting link to clipboard
   */
  copyMeetLink(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      this.toastService.showSuccess('Link copied to clipboard!');
    }).catch(() => {
      this.toastService.showError('Failed to copy link');
    });
  }

  /**
   * Can join session (15 minutes before)
   */
  canJoinSession(session: PrivateSessionDto): boolean {
    const now = new Date();
    const sessionTime = new Date(session.scheduledDateTime);
    const minutesDiff = Math.floor((sessionTime.getTime() - now.getTime()) / 1000 / 60);

    // Can join 15 minutes before until session duration ends
    return minutesDiff <= 15 && minutesDiff >= -session.durationMinutes;
  }

  /**
   * Get countdown until session
   */
  getTimeUntilSession(dateTime: string): string {
    const now = new Date();
    const sessionTime = new Date(dateTime);
    const diff = sessionTime.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `in ${minutes} min`;
    return 'Now';
  }

  /**
   * Get remaining time for payment (24 hours from creation)
   */
  getPaymentTimeRemaining(createdAt: string): string {
    const now = new Date();
    const createdTime = new Date(createdAt);
    const expiryTime = new Date(createdTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
    const diff = expiryTime.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  }

  /**
   * Check if payment has expired (more than 24 hours since creation)
   */
  isPaymentExpired(createdAt: string): boolean {
    const now = new Date();
    const createdTime = new Date(createdAt);
    const expiryTime = new Date(createdTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
    return now.getTime() > expiryTime.getTime();
  }
}
