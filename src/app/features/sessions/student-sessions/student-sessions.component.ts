/**
 * Student Sessions Component
 * For students to view their upcoming sessions and join them
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';
import { ToastService } from '../../../core/services/toast.service';
import { PrivateSessionDto } from '../../../models/session.models';

@Component({
  selector: 'app-student-sessions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-sessions.component.html',
  styleUrl: './student-sessions.component.scss'
})
export class StudentSessionsComponent implements OnInit {
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);

  sessions = signal<PrivateSessionDto[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading.set(true);

    this.sessionService.getStudentUpcomingSessions().subscribe({
      next: (response) => {
        console.log('📚 Student Sessions API Response:', response);
        console.log('📚 Sessions Data:', response.data);
        console.log('📚 Sessions Count:', response.data?.length);

        if (response.success && response.data) {
          console.log('✅ Setting sessions:', response.data);
          this.sessions.set(response.data);

          // Log each session status
          response.data.forEach((session, index) => {
            console.log(`Session ${index + 1}:`, {
              id: session.id,
              teacher: session.teacherName,
              status: session.status,
              statusReadable: this.getReadableStatus(session.status),
              scheduledDateTime: session.scheduledDateTime
            });
          });
        } else {
          console.warn('⚠️ No sessions data or success=false');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading sessions:', error);
        console.error('❌ Error details:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
        this.toastService.showError('Failed to load sessions');
        this.loading.set(false);
      }
    });
  }

  /**
   * Format date time for display
   */
  formatDateTime(dateTime: string): string {
    const { date, time, dayOfWeek } = this.sessionService.formatSessionDateTime(dateTime);
    return `${dayOfWeek}، ${date} - ${time}`;
  }

  /**
   * Convert status number to readable text
   * 0 = Pending, 1 = Confirmed, 2 = Completed, 3 = Cancelled, 4 = Pending Payment
   */
  getReadableStatus(status: any): string {
    const statusStr = status?.toString();

    const statusMap: { [key: string]: string } = {
      '0': 'Pending',
      '1': 'Confirmed',
      '2': 'Completed',
      '3': 'Cancelled',
      '4': 'Pending Payment',
      'Pending': 'Pending',
      'Confirmed': 'Confirmed',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled',
      'PendingPayment': 'Pending Payment',
      'Unknown': 'Pending Payment',
      'null': 'Pending Payment',
      'undefined': 'Pending Payment'
    };

    return statusMap[statusStr] || 'Pending Payment';
  }

  /**
   * Get status text with emoji
   */
  getStatusText(status: any): string {
    const readableStatus = this.getReadableStatus(status);

    const texts: { [key: string]: string } = {
      'Confirmed': '✅ Confirmed',
      'Completed': '✔️ Completed',
      'Cancelled': '❌ Cancelled',
      'Pending': '⏳ Pending',
      'Pending Payment': '💳 Awaiting Payment'
    };
    return texts[readableStatus] || readableStatus;
  }  /**
   * Can join 15 minutes before session starts
   */
  canJoinSession(session: PrivateSessionDto): boolean {
    const now = new Date();
    const sessionTime = new Date(session.scheduledDateTime);
    const minutesDiff = Math.floor((sessionTime.getTime() - now.getTime()) / 1000 / 60);

    // Can join 15 minutes before until session duration ends
    return minutesDiff <= 15 && minutesDiff >= -session.durationMinutes;
  }

  /**
   * Get session status based on time
   */
  getSessionStatus(session: PrivateSessionDto): 'past' | 'starting-soon' | 'upcoming' | 'scheduled' {
    const now = new Date();
    const sessionTime = new Date(session.scheduledDateTime);
    const minutesDiff = Math.floor((sessionTime.getTime() - now.getTime()) / 1000 / 60);

    if (minutesDiff < -session.durationMinutes) return 'past';
    if (minutesDiff <= 15 && minutesDiff >= 0) return 'starting-soon';
    if (minutesDiff <= 60) return 'upcoming';
    return 'scheduled';
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

    if (days > 0) return `after ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `after ${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `in ${minutes} min`;
    return 'Now';
  }

  /**
   * Join session - Opens Google Meet in new tab
   */
  joinSession(session: PrivateSessionDto): void {
    if (session.googleMeetLink) {
      window.open(session.googleMeetLink, '_blank');
      this.toastService.showSuccess('Opening session...');
    } else {
      this.toastService.showWarning('Meeting link not available yet');
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
}
