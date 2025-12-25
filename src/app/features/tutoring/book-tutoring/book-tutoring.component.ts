/**
 * Book Tutoring Component
 * For booking a private tutoring session with a tutor
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../auth/auth.service';
import { UserService } from '../../../core/services/user.service';
import { AvailableSlotDto, BookTutoringDto } from '../../../models/tutoring.models';

@Component({
  selector: 'app-book-tutoring',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './book-tutoring.component.html',
  styleUrl: './book-tutoring.component.scss'
})
export class BookTutoringComponent implements OnInit {
  private tutoringService = inject(TutoringService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  teacherId = signal<number | null>(null);
  teacherPrice = signal<number>(50); // Default price, will be updated from API
  selectedStudentId = signal<number | null>(null);
  selectedDate = signal<Date>(new Date());
  selectedSlot = signal<AvailableSlotDto | null>(null);
  notes = signal<string>('');

  availableSlots = signal<AvailableSlotDto[]>([]);
  loading = signal<boolean>(false);
  booking = signal<boolean>(false);

  // Students list (will be loaded from API)
  students = signal<any[]>([]);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['teacherId'];
      if (id) {
        this.teacherId.set(id);
        // Price loading removed - pricing managed by admin
        this.loadStudents();
        this.loadAvailableSlots();
      }
    });
  }



  /**
   * Load parent's students from API
   */
  private loadStudents(): void {
    console.log('🔍 Loading students from API...');

    // Get real students from API
    this.userService.getMyStudents().subscribe({
      next: (students) => {
        console.log('✅ Loaded students from API:', students);

        if (students && students.length > 0) {
          // Map students to simpler format
          const mappedStudents = students.map(s => ({
            id: s.id,
            name: s.userName || `Student ${s.id}`
          }));

          console.log('📋 Mapped students:', mappedStudents);
          this.students.set(mappedStudents);

          // If only one student, auto-select
          if (mappedStudents.length === 1) {
            this.selectedStudentId.set(mappedStudents[0].id);
            console.log('🎯 Auto-selected student:', mappedStudents[0]);
          }
        } else {
          // No students found - show warning
          console.warn('⚠️ No students found in API response');
          this.toastService.showWarning('No students found. Please add students before booking a tutoring session.');
          this.students.set([]);
        }
      },
      error: (error) => {
        console.error('❌ Error loading students:', error);
        this.toastService.showError('Failed to load students. Please make sure you are logged in as a Parent.');

        // Fallback to empty array
        this.students.set([]);
      }
    });
  }

  /**
   * Load available slots for tutor
   */
  loadAvailableSlots(): void {
    if (!this.teacherId()) return;

    this.loading.set(true);
    const { fromDate, toDate } = this.tutoringService.getDateRange(14);

    this.tutoringService.getTutorAvailableSlots(
      this.teacherId()!,
      fromDate,
      toDate
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableSlots.set(response.data.filter((slot: any) => slot.isAvailable));
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
    return this.tutoringService.getNext7Days();
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
    return date.toLocaleDateString('en-US', {
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
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Get selected student name
   */
  getSelectedStudentName(): string {
    if (!this.selectedStudentId()) return '-';
    const student = this.students().find(s => s.id === this.selectedStudentId());
    return student?.name || '-';
  }

  /**
   * Get selected slot date
   */
  getSelectedSlotDate(): string {
    if (!this.selectedSlot()) return '-';
    return this.formatDateDisplay(new Date(this.selectedSlot()!.dateTime));
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

    const dto: BookTutoringDto = {
      teacherId: this.teacherId()!,
      studentId: this.selectedStudentId()!,
      scheduledDateTime: this.selectedSlot()!.dateTime,
      notes: this.notes() || undefined
    };

    // 🔍 Debug: Log booking request
    console.log('🛒 Booking session with:', {
      teacherId: dto.teacherId,
      studentId: dto.studentId,  // Should be Student.Id (1, 2, 3...), NOT User.Id
      studentName: this.getSelectedStudentName(),
      scheduledDateTime: dto.scheduledDateTime
    });

    this.tutoringService.bookTutoring(dto).subscribe({
      next: (response) => {
        console.log('✅ Booking response:', response);

        if (response.success && response.data) {
          this.toastService.showSuccess('Booking created! Redirecting to payment...');

          // Redirect to Stripe checkout
          setTimeout(() => {
            window.location.href = response.data.stripeCheckoutUrl;
          }, 1000);
        } else {
          const errorMsg = response.message || 'Failed to create booking. Please try again.';
          this.toastService.showError(errorMsg);
          this.booking.set(false);
        }
      },
      error: (error) => {
        console.error('❌ Booking error:', error);

        // Extract specific error message from backend
        let errorMessage = 'Failed to book session. Please try again.';

        if (error?.error?.message) {
          // Backend returned specific message
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        // Display user-friendly error
        this.toastService.showError(errorMessage);

        // Log detailed error for debugging
        console.error('📋 Error details:', {
          status: error?.status,
          statusText: error?.statusText,
          message: errorMessage,
          fullError: error
        });

        this.booking.set(false);
      }
    });
  }

  /**
   * Cancel and go back
   */
  goBack(): void {
    this.router.navigate(['/tutoring/browse']);
  }
}
