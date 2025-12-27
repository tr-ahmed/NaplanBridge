/**
 * Student Sessions Component
 * For students to view their upcoming and past tutoring sessions
 * Updated to use new getStudentSessions API with filters/pagination
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ToastService } from '../../../core/services/toast.service';
import { StudentSessionDto, SessionFilters } from '../../../models/tutoring.models';

@Component({
  selector: 'app-student-tutoring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-tutoring.component.html',
  styleUrl: './student-tutoring.component.scss'
})
export class StudentTutoringComponent implements OnInit {
  private tutoringService = inject(TutoringService);
  private toastService = inject(ToastService);

  // Sessions data
  sessions = signal<StudentSessionDto[]>([]);
  loading = signal<boolean>(true);

  // Pagination
  totalCount = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);

  // Filters
  selectedStatus = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Status options for filter
  statusOptions = [
    { value: '', label: 'All Sessions' },
    { value: 'Scheduled', label: 'Scheduled' },
    { value: 'InProgress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading.set(true);

    const filters: SessionFilters = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize()
    };

    // Add status filter if selected
    if (this.selectedStatus()) {
      filters.status = this.selectedStatus();
    }

    // Add date filters if set
    if (this.startDate()) {
      filters.startDate = new Date(this.startDate());
    }
    if (this.endDate()) {
      filters.endDate = new Date(this.endDate());
    }

    this.tutoringService.getStudentSessions(filters).subscribe({
      next: (response) => {
        this.sessions.set(response.sessions || []);
        this.totalCount.set(response.totalCount || 0);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        // Fallback to legacy endpoint if new one fails
        this.loadLegacySessions();
      }
    });
  }

  /**
   * Fallback to legacy endpoint for backward compatibility
   */
  private loadLegacySessions(): void {
    this.tutoringService.getStudentUpcomingSessions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sessions.set(response.data.map((s: any) => ({
            id: s.id,
            teacherName: s.teacherName,
            subjectName: s.notes || 'Session',
            dateTime: s.scheduledDateTime,
            duration: s.durationMinutes,
            status: this.mapLegacyStatus(s.status),
            meetingLink: s.googleMeetLink,
            notes: s.notes
          })));
          this.totalCount.set(response.data.length);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading legacy sessions:', error);
        this.toastService.showError('Failed to load sessions');
        this.loading.set(false);
      }
    });
  }

  /**
   * Map legacy status to new format
   */
  private mapLegacyStatus(status: any): string {
    const statusMap: { [key: string]: string } = {
      '0': 'Scheduled',
      '1': 'Scheduled',
      '2': 'Completed',
      '3': 'Cancelled',
      'Pending': 'Scheduled',
      'Confirmed': 'Scheduled',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled'
    };
    return statusMap[status?.toString()] || 'Scheduled';
  }

  /**
   * Handle status filter change
   */
  onStatusChange(status: string): void {
    this.selectedStatus.set(status);
    this.pageNumber.set(1); // Reset to first page
    this.loadSessions();
  }

  /**
   * Handle date filter change
   */
  onDateChange(): void {
    this.pageNumber.set(1);
    this.loadSessions();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.selectedStatus.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.pageNumber.set(1);
    this.loadSessions();
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageNumber.set(page);
      this.loadSessions();
    }
  }

  /**
   * Calculate total pages
   */
  totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize());
  }

  /**
   * Get page numbers array for pagination
   */
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.pageNumber();
    const pages: number[] = [];

    // Show max 5 page numbers
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Format date time for display
   */
  formatDateTime(dateTime: string): string {
    const { date, time, dayOfWeek } = this.tutoringService.formatSessionDateTime(dateTime);
    return `${dayOfWeek}, ${date} - ${time}`;
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
      'InProgress': 'bg-orange-100 text-orange-800 border-orange-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return classes[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Get status text with icon
   */
  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'Scheduled': '📅 Scheduled',
      'InProgress': '🔴 In Progress',
      'Completed': '✅ Completed',
      'Cancelled': '❌ Cancelled'
    };
    return texts[status] || status;
  }

  /**
   * Check if can join session (15 min before)
   */
  canJoinSession(session: StudentSessionDto): boolean {
    const now = new Date();
    const sessionTime = new Date(session.dateTime);
    const minutesDiff = Math.floor((sessionTime.getTime() - now.getTime()) / 1000 / 60);

    // Can join 15 minutes before until session duration ends
    return session.status === 'Scheduled' &&
      minutesDiff <= 15 &&
      minutesDiff >= -session.duration;
  }

  /**
   * Get session time status
   */
  getSessionStatus(session: StudentSessionDto): 'past' | 'starting-soon' | 'upcoming' | 'scheduled' {
    const now = new Date();
    const sessionTime = new Date(session.dateTime);
    const minutesDiff = Math.floor((sessionTime.getTime() - now.getTime()) / 1000 / 60);

    if (minutesDiff < -session.duration) return 'past';
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

    if (diff < 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hr${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `in ${minutes} min`;
    return 'Now';
  }

  /**
   * Join session - Opens meeting link in new tab
   */
  joinSession(session: StudentSessionDto): void {
    if (session.meetingLink) {
      window.open(session.meetingLink, '_blank');
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
