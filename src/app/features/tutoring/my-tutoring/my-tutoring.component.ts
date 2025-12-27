/**
 * My Tutoring Component - Enhanced
 * For parents to view and manage their tutoring bookings
 * Features: Grouped by student, stats summary, filters, session details
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ToastService } from '../../../core/services/toast.service';
import { PrivateTutoringDto } from '../../../models/tutoring.models';

interface StudentGroup {
  studentName: string;
  sessions: PrivateTutoringDto[];
  upcomingCount: number;
  completedCount: number;
}

@Component({
  selector: 'app-my-tutoring',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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

  // View mode: 'list' or 'grouped'
  viewMode = signal<'list' | 'grouped'>('list');

  // Expanded students in grouped view
  expandedStudents = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadBookings();
  }

  /**
   * Load parent tutoring sessions (from TutoringSessions table)
   */
  private loadBookings(): void {
    this.loading.set(true);

    this.TutoringService.getParentSessions().subscribe({
      next: (response) => {
        console.log('📋 Parent Sessions Response:', response);

        // Map sessions from new API format to existing PrivateTutoringDto format
        if (response.sessions && response.sessions.length > 0) {
          const mappedSessions = response.sessions.map((s: any) => ({
            id: s.id,
            studentName: s.studentName || 'Unknown',
            teacherName: s.teacherName || 'Unknown',
            subjectName: s.subjectName || 'Unknown',
            scheduledDateTime: s.dateTime,
            durationMinutes: s.duration || 60,
            status: s.status || 'Scheduled',
            googleMeetLink: s.meetingLink || null,
            notes: s.notes || null,
            // Required fields for interface (not used in UI)
            teacherId: 0,
            studentId: 0,
            parentId: 0,
            parentName: '',
            subjectId: 0,
            createdAt: s.dateTime,
            price: 0
          } as PrivateTutoringDto));
          this.bookings.set(mappedSessions);

          // Auto-expand all students initially
          const students = new Set<string>(mappedSessions.map((b) => b.studentName as string));
          this.expandedStudents.set(students);
        } else {
          this.bookings.set([]);
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading sessions:', error);
        this.toastService.showError('Failed to load tutoring sessions');
        this.loading.set(false);
      }
    });
  }

  /**
   * Map tutoring session status to numeric format for existing UI
   */
  private mapTutoringStatus(status: string): number {
    const statusMap: { [key: string]: number } = {
      'Scheduled': 1,      // Confirmed
      'InProgress': 1,     // Confirmed
      'Completed': 2,
      'Cancelled': 3,
      'Pending': 0
    };
    return statusMap[status] ?? 0;
  }

  /**
   * Refresh bookings
   */
  refreshBookings(): void {
    this.loadBookings();
  }

  /**
   * Get filtered bookings
   */
  get filteredBookings(): PrivateTutoringDto[] {
    const all = this.bookings();
    const filterValue = this.filter();

    if (filterValue === 'all') return all;

    return all.filter(booking => {
      const status = this.getReadableStatus(booking.status);
      if (filterValue === 'upcoming') {
        return status === 'Confirmed' &&
          this.TutoringService.isUpcoming(booking.scheduledDateTime);
      }
      if (filterValue === 'completed') {
        return status === 'Completed';
      }
      if (filterValue === 'cancelled') {
        return status === 'Cancelled';
      }
      return true;
    });
  }

  /**
   * Group bookings by student
   */
  get groupedByStudent(): StudentGroup[] {
    const grouped: { [key: string]: PrivateTutoringDto[] } = {};

    this.filteredBookings.forEach(booking => {
      const name = booking.studentName || 'Unknown';
      if (!grouped[name]) {
        grouped[name] = [];
      }
      grouped[name].push(booking);
    });

    return Object.entries(grouped).map(([studentName, sessions]) => ({
      studentName,
      sessions: sessions.sort((a, b) =>
        new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime()
      ),
      upcomingCount: sessions.filter(s =>
        this.getReadableStatus(s.status) === 'Confirmed' &&
        this.TutoringService.isUpcoming(s.scheduledDateTime)
      ).length,
      completedCount: sessions.filter(s => this.getReadableStatus(s.status) === 'Completed').length
    }));
  }

  /**
   * Get unique students count
   */
  get uniqueStudentsCount(): number {
    return new Set(this.bookings().map(b => b.studentName)).size;
  }

  /**
   * Toggle student expansion
   */
  toggleStudent(studentName: string): void {
    const current = this.expandedStudents();
    const newSet = new Set(current);
    if (newSet.has(studentName)) {
      newSet.delete(studentName);
    } else {
      newSet.add(studentName);
    }
    this.expandedStudents.set(newSet);
  }

  /**
   * Check if student is expanded
   */
  isStudentExpanded(studentName: string): boolean {
    return this.expandedStudents().has(studentName);
  }

  /**
   * Toggle view mode
   */
  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'list' ? 'grouped' : 'list');
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
    return `${dayOfWeek}, ${date} - ${time}`;
  }

  /**
   * Format just the date
   */
  formatDate(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  /**
   * Format just the time
   */
  formatTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Convert status to readable text
   */
  getReadableStatus(status: any): string {
    const statusStr = status?.toString();

    const statusMap: { [key: string]: string } = {
      // Numeric format (legacy)
      '0': 'Pending',
      '1': 'Confirmed',
      '2': 'Completed',
      '3': 'Cancelled',
      // String format (new Tutoring API)
      'Scheduled': 'Confirmed',
      'InProgress': 'Confirmed',
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
  }

  /**
   * Get status color bar class
   */
  getStatusBarClass(status: any): string {
    const readableStatus = this.getReadableStatus(status);

    const classes: { [key: string]: string } = {
      'Confirmed': 'bg-gradient-to-r from-green-400 to-emerald-500',
      'Completed': 'bg-gradient-to-r from-blue-400 to-cyan-500',
      'Cancelled': 'bg-gradient-to-r from-red-400 to-rose-500',
      'Pending': 'bg-gradient-to-r from-yellow-400 to-orange-500',
      'Pending Payment': 'bg-gradient-to-r from-orange-400 to-red-500'
    };
    return classes[readableStatus] || 'bg-gradient-to-r from-gray-400 to-gray-500';
  }

  /**
   * Get count of upcoming sessions
   */
  getUpcomingCount(): number {
    return this.bookings().filter(b =>
      this.getReadableStatus(b.status) === 'Confirmed' &&
      this.TutoringService.isUpcoming(b.scheduledDateTime)
    ).length;
  }

  /**
   * Get count of completed sessions
   */
  getCompletedCount(): number {
    return this.bookings().filter(b => this.getReadableStatus(b.status) === 'Completed').length;
  }

  /**
   * Get count of cancelled sessions
   */
  getCancelledCount(): number {
    return this.bookings().filter(b => this.getReadableStatus(b.status) === 'Cancelled').length;
  }

  /**
   * Check if can cancel booking
   */
  canCancel(booking: PrivateTutoringDto): boolean {
    return this.getReadableStatus(booking.status) === 'Confirmed' &&
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

    if (diff < 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    if (minutes > 0) return `in ${minutes}m`;
    return 'Now';
  }

  /**
   * Check if session is starting soon (within 30 min)
   */
  isStartingSoon(dateTime: string): boolean {
    const now = new Date();
    const sessionTime = new Date(dateTime);
    const diff = sessionTime.getTime() - now.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    return minutes > 0 && minutes <= 30;
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
   */
  completePayment(booking: PrivateTutoringDto): void {
    this.toastService.showInfo('Please book the session again to complete payment');
    this.router.navigate(['/parent/tutoring/select']);
  }
}
