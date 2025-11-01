/**
 * My Bookings Component
 * لأولياء الأمور لعرض وإدارة حجوزاتهم
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';
import { ToastService } from '../../../core/services/toast.service';
import { PrivateSessionDto } from '../../../models/session.models';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.scss'
})
export class MyBookingsComponent implements OnInit {
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);

  bookings = signal<PrivateSessionDto[]>([]);
  loading = signal<boolean>(true);
  filter = signal<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  ngOnInit(): void {
    this.loadBookings();
  }

  /**
   * Load parent bookings
   */
  loadBookings(): void {
    this.loading.set(true);

    this.sessionService.getParentBookings().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.bookings.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.toastService.showError('Failed to load bookings');
        this.loading.set(false);
      }
    });
  }

  /**
   * Get filtered bookings
   */
  get filteredBookings(): PrivateSessionDto[] {
    const all = this.bookings();
    const filterValue = this.filter();

    if (filterValue === 'all') return all;

    return all.filter(booking => {
      if (filterValue === 'upcoming') {
        return booking.status === 'Confirmed' && this.sessionService.isUpcoming(booking.scheduledDateTime);
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
  cancelBooking(booking: PrivateSessionDto): void {
    if (!confirm(`Do you want to cancel the booking with ${booking.teacherName}?`)) {
      return;
    }

    const reason = prompt('يرجى ذكر سبب الإلغاء (اختياري)');

    this.sessionService.cancelSession(booking.id, reason || 'لم يتم تحديد سبب').subscribe({
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
    const { date, time, dayOfWeek } = this.sessionService.formatSessionDateTime(dateTime);
    return `${dayOfWeek}، ${date} - ${time}`;
  }

  /**
   * Get status badge color
   */
  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Confirmed': 'bg-green-100 text-green-800',
      'Completed': 'bg-blue-100 text-blue-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Pending': 'bg-yellow-100 text-yellow-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get status text in Arabic
   */
  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'Confirmed': 'Confirmed',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled',
      'Pending': 'قيد الانتظار'
    };
    return texts[status] || status;
  }

  /**
   * Check if can cancel booking
   */
  canCancel(booking: PrivateSessionDto): boolean {
    return booking.status === 'Confirmed' &&
           this.sessionService.getMinutesUntilSession(booking.scheduledDateTime) > 60;
  }

  /**
   * Set filter
   */
  setFilter(filter: 'all' | 'upcoming' | 'completed' | 'cancelled'): void {
    this.filter.set(filter);
  }
}
