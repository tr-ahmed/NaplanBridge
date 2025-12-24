/**
 * My Bookings Component
 * لأولياء الأمور لعرض وإدارة حجوزاتهم
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ToastService } from '../../../core/services/toast.service';
import { PrivateTutoringDto } from '../../../models/tutoring.models';

@Component({
  selector: 'app-my-tutoring',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-tutoring.component.html',
  styleUrl: './my-tutoring.component.scss'
})
export class MyTutoringComponent implements OnInit {
  private TutoringService = inject(TutoringService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  bookings = signal<PrivateTutoringDto[]>([]);
  loading = signal<boolean>(true);
  filter = signal<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  selectedBooking = signal<PrivateTutoringDto | null>(null);
  showDetailsModal = signal<boolean>(false);

  ngOnInit(): void {
    this.loadBookings();
  }

  /**
   * Load parent bookings
   */
  private loadBookings(): void {
    this.loading.set(true);

    this.TutoringService.getParentBookings().subscribe({
      next: (response) => {
        console.log('📋 Parent Bookings Response:', response);

        if (response.success && response.data) {
          this.bookings.set(response.data);

          // 🔍 Debug: Log each booking's status and Google Meet link
          response.data.forEach((booking: any) => {
            console.log(`📝 Booking #${booking.id}:`, {
              status: booking.status,
              statusType: typeof booking.status,
              googleMeetLink: booking.googleMeetLink,
              hasLink: !!booking.googleMeetLink,
              willDisplay: booking.status === 'Confirmed' || booking.status === 1
            });
          });
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading bookings:', error);
        this.toastService.showError('Failed to load bookings');
        this.loading.set(false);
      }
    });
  }

  /**
   * Get filtered bookings
   */
  get filteredBookings(): PrivateTutoringDto[] {
    const all = this.bookings();
    const filterValue = this.filter();

    if (filterValue === 'all') return all;

    return all.filter(booking => {
      if (filterValue === 'upcoming') {
        return booking.status === 'Confirmed' && this.TutoringService.isUpcoming(booking.scheduledDateTime);
      }
      if (filterValue === 'completed') {
        return booking.status === 'Completed';
      }
      if (filterValue === 'cancelled') {
        return booking.status === 'Cancelled';
      }
      return true;
    });
  }

  /**
   * Cancel booking
   */
  cancelBooking(booking: PrivateTutoringDto): void {
    if (!confirm(`Do you want to cancel the booking with ${booking.teacherName}?`)) {
      return;
    }

    const reason = prompt('Please specify the reason for cancellation (optional)');

    this.TutoringService.cancelSession(booking.id, reason || 'No reason specified').subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.showSuccess('Booking cancelled successfully');
          this.loadBookings();
        }
      },
      error: (error) => {
        console.error('Error cancelling booking:', error);
        this.toastService.showError('Failed to cancel booking');
      }
    });
  }

  /**
   * Format session date/time
   */
  formatDateTime(dateTime: string): string {
    const { date, time, dayOfWeek } = this.TutoringService.formatSessionDateTime(dateTime);
    return `${dayOfWeek}، ${date} - ${time}`;
  }

  /**
   * Convert status number to readable text
   * 0 = Pending, 1 = Confirmed, 2 = Completed, 3 = Cancelled
   * Unknown status = Pending Payment (حجز تم إنشاؤه لكن لم يتم الدفع)
   */
  getReadableStatus(status: any): string {
    // Convert to string if it's a number
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

  /**
   * Get status badge color
   */
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
      'Pending Payment': '💳 Pending Payment'
    };
    return texts[readableStatus] || '💳 ' + readableStatus;
  }  /**
   * Get count of upcoming sessions
   */
  getUpcomingCount(): number {
    return this.bookings().filter(b =>
      b.status === 'Confirmed' && this.TutoringService.isUpcoming(b.scheduledDateTime)
    ).length;
  }

  /**
   * Get count of completed sessions
   */
  getCompletedCount(): number {
    return this.bookings().filter(b => b.status === 'Completed').length;
  }

  /**
   * Get count of cancelled sessions
   */
  getCancelledCount(): number {
    return this.bookings().filter(b => b.status === 'Cancelled').length;
  }

  /**
   * Check if can cancel booking
   */
  canCancel(booking: PrivateTutoringDto): boolean {
    return booking.status === 'Confirmed' &&
           this.TutoringService.getMinutesUntilSession(booking.scheduledDateTime) > 60;
  }

  /**
   * Set filter
   */
  setFilter(filter: 'all' | 'upcoming' | 'completed' | 'cancelled'): void {
    this.filter.set(filter);
  }

  /**
   * Join session - Opens Google Meet in new tab
   */
  joinSession(booking: PrivateTutoringDto): void {
    if (booking.googleMeetLink) {
      window.open(booking.googleMeetLink, '_blank');
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

  /**
   * Can join session (15 minutes before)
   */
  canJoinSession(booking: PrivateTutoringDto): boolean {
    const now = new Date();
    const sessionTime = new Date(booking.scheduledDateTime);
    const minutesDiff = Math.floor((sessionTime.getTime() - now.getTime()) / 1000 / 60);

    // Can join 15 minutes before until session duration ends
    return minutesDiff <= 15 && minutesDiff >= -booking.durationMinutes;
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
   * Show booking details modal
   */
  showDetails(booking: PrivateTutoringDto): void {
    this.selectedBooking.set(booking);
    this.showDetailsModal.set(true);
  }

  /**
   * Close details modal
   */
  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedBooking.set(null);
  }

  /**
   * Complete payment for pending payment bookings
   * Re-initiate the booking flow since we can't retrieve original Stripe session
   */
  completePayment(booking: PrivateTutoringDto): void {
    this.toastService.showInfo('Please book the session again to complete payment');

    // Navigate to browse sessions page to re-book
    // User will need to select the teacher and time slot again
    this.router.navigate(['/tutoring/browse']);

    console.log('⚠️ User needs to re-book session:', booking);
    console.log('💡 Original booking will be cleaned up by backend if expired');
  }
}
