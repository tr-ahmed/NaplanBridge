/**
 * Book Session Component
 * For booking a private session with a teacher
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../auth/auth.service';
import { AvailableSlotDto, BookSessionDto } from '../../../models/session.models';

@Component({
  selector: 'app-book-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-session.component.html',
  styleUrl: './book-session.component.scss'
})
export class BookSessionComponent implements OnInit {
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  teacherId = signal<number | null>(null);
  selectedStudentId = signal<number | null>(null);
  selectedDate = signal<Date>(new Date());
  selectedSlot = signal<AvailableSlotDto | null>(null);
  notes = signal<string>('');

  availableSlots = signal<AvailableSlotDto[]>([]);
  loading = signal<boolean>(false);
  booking = signal<boolean>(false);

  // Mock students for parent (should come from API)
  students = signal<any[]>([
    { id: 1, name: 'أحمد محمد' },
    { id: 2, name: 'سارة أحمد' }
  ]);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['teacherId'];
      if (id) {
        this.teacherId.set(id);
        this.loadAvailableSlots();
      }
    });
  }

  /**
   * Load available slots for teacher
   */
  loadAvailableSlots(): void {
    if (!this.teacherId()) return;

    this.loading.set(true);
    const { fromDate, toDate } = this.sessionService.getDateRange(14);

    this.sessionService.getTeacherAvailableSlots(
      this.teacherId()!,
      fromDate,
      toDate
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableSlots.set(response.data.filter(slot => slot.isAvailable));
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading slots:', error);
        this.toastService.showError('Failed to load available time slots');
        this.loading.set(false);
      }
    });
  }

  /**
   * Select a time slot
   */
  selectSlot(slot: AvailableSlotDto): void {
    this.selectedSlot.set(slot);
  }

  /**
   * Check if slot is selected
   */
  isSlotSelected(slot: AvailableSlotDto): boolean {
    return this.selectedSlot()?.dateTime === slot.dateTime;
  }

  /**
   * Get slots for selected date
   */
  getSlotsForDate(date: Date): AvailableSlotDto[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.availableSlots().filter(slot => {
      const slotDate = new Date(slot.dateTime).toISOString().split('T')[0];
      return slotDate === dateStr;
    });
  }

  /**
   * Get next 7 days
   */
  getNextDays(): Date[] {
    return this.sessionService.getNext7Days();
  }

  /**
   * Select date
   */
  selectDate(date: Date): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
  }

  /**
   * Check if date is selected
   */
  isDateSelected(date: Date): boolean {
    return date.toDateString() === this.selectedDate().toDateString();
  }

  /**
   * Format date display
   */
  formatDateDisplay(date: Date): string {
    return date.toLocaleDateString('ar-EG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  /**
   * Format time display
   */
  formatTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Book session
   */
  bookSession(): void {
    if (!this.selectedStudentId() || !this.selectedSlot() || !this.teacherId()) {
      this.toastService.showWarning('Please select student and time slot');
      return;
    }

    this.booking.set(true);

    const dto: BookSessionDto = {
      teacherId: this.teacherId()!,
      studentId: this.selectedStudentId()!,
      scheduledDateTime: this.selectedSlot()!.dateTime,
      notes: this.notes() || undefined
    };

    this.sessionService.bookSession(dto).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.toastService.showSuccess('Booking created, redirecting to payment...');

          // Redirect to Stripe checkout
          window.location.href = response.data.stripeCheckoutUrl;
        }
        this.booking.set(false);
      },
      error: (error) => {
        console.error('Error booking session:', error);
        this.toastService.showError('Failed to book session');
        this.booking.set(false);
      }
    });
  }

  /**
   * Cancel and go back
   */
  goBack(): void {
    this.router.navigate(['/sessions/browse']);
  }
}
