/**
 * Teacher Tutoring Management - Unified Component
 * Combines Availability and Sessions management with tabs
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, forkJoin } from 'rxjs';
import { SessionService } from '../../core/services/session.service';
import { TutoringService } from '../../core/services/tutoring.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog/confirmation-dialog.service';
import {
  TeacherSessionSettingsDto,
  TeacherAvailabilityDto,
  CreateAvailabilityDto,
  UpdateSessionSettingsDto,
  ExceptionDayDto,
  CreateExceptionDto
} from '../../models/session.models';
import { TutoringSessionDto } from '../../models/tutoring.models';

type ViewMode = 'today' | 'day' | 'week';
type ActiveTab = 'availability' | 'sessions';

@Component({
  selector: 'app-teacher-tutoring-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './teacher-tutoring-sessions.component.html',
  styleUrl: './teacher-tutoring-sessions.component.scss'
})
export class TeacherTutoringSessionsComponent implements OnInit {
  private sessionService = inject(SessionService);
  private tutoringService = inject(TutoringService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmationDialogService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Tab Management
  activeTab = signal<ActiveTab>('sessions');

  // Loading states
  loading = signal<boolean>(true);
  savingSettings = signal<boolean>(false);
  addingAvailability = signal<boolean>(false);
  addingException = signal<boolean>(false);

  // Availability Data
  settings = signal<TeacherSessionSettingsDto | null>(null);
  availabilities = signal<TeacherAvailabilityDto[]>([]);
  exceptions = signal<ExceptionDayDto[]>([]);

  // Sessions Data
  sessions = signal<TutoringSessionDto[]>([]);
  filteredSessions = signal<TutoringSessionDto[]>([]);

  // UI State
  showSettingsForm = signal<boolean>(false);
  showAvailabilityForm = signal<boolean>(false);
  showSlotGenerator = signal<boolean>(false);
  showExceptionForm = signal<boolean>(false);
  showEditSlotModal = signal<boolean>(false);
  editingSlot = signal<TeacherAvailabilityDto | null>(null);
  updatingSlot = signal<boolean>(false);


  // Calendar View
  viewMode = signal<ViewMode>('today');
  selectedDate = signal<Date>(new Date());

  // Forms
  settingsForm!: FormGroup;
  availabilityForm!: FormGroup;
  slotGeneratorForm!: FormGroup;
  exceptionForm!: FormGroup;

  // Filter state
  selectedStatus = '';
  startDate = '';
  endDate = '';

  // Days of week
  daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  ngOnInit(): void {
    this.initForms();

    // Check query param for initial tab
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'availability') {
        this.activeTab.set('availability');
      }
    });

    this.loadData();
  }

  /**
   * Initialize all forms
   */
  private initForms(): void {
    // Settings form
    this.settingsForm = this.fb.group({
      sessionDurationMinutes: [60, [Validators.required, Validators.min(15), Validators.max(180)]],
      bufferTimeMinutes: [15, [Validators.required, Validators.min(0), Validators.max(60)]],
      isAcceptingBookings: [true],
      maxSessionsPerDay: [8, [Validators.min(1), Validators.max(20)]],
      description: ['']
    });

    // Simple availability form
    this.availabilityForm = this.fb.group({
      dayOfWeek: ['', Validators.required],
      startTime: ['09:00', Validators.required],
      endTime: ['17:00', Validators.required]
    });

    // Slot generator form
    this.slotGeneratorForm = this.fb.group({
      dayOfWeek: ['', Validators.required],
      startTime: ['09:00', Validators.required],
      endTime: ['17:00', Validators.required],
      sessionDuration: [60, [Validators.required, Validators.min(15), Validators.max(180)]],
      breakBetweenSessions: [15, [Validators.required, Validators.min(0), Validators.max(60)]],
      defaultSessionType: ['OneToOne'],
      subjectId: [null]
    });

    // Exception form
    this.exceptionForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: [''],
      reason: ['']
    });
  }

  /**
   * Load all data
   */
  private loadData(): void {
    this.loading.set(true);

    // Load settings
    this.sessionService.getTeacherSettings()
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            // Settings don't exist - show setup wizard with default values
            console.log('No settings found. Showing setup wizard...');
            this.showSettingsForm.set(true);

            // Initialize form with sensible defaults
            this.settingsForm.patchValue({
              sessionDurationMinutes: 60,
              bufferTimeMinutes: 15,
              isAcceptingBookings: true,
              maxSessionsPerDay: 8,
              description: 'Experienced teacher - Please update your profile'
            });

            this.toastService.showInfo('Welcome! Please configure your teaching settings to get started.');
            return of({ success: false, data: null, message: 'Settings not configured' });
          }

          // Other errors
          console.error('Error loading settings:', error);
          this.toastService.showError('Failed to load settings. Please try again.');
          return of({ success: false, data: null, message: 'Error loading settings' });
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.settings.set(response.data);
            this.patchSettingsForm(response.data);

            // Only load other data if settings exist
            this.loadAvailabilities();
            this.loadExceptions();
            this.loadSessions();
          } else {
            // Settings don't exist - don't load other data yet
            this.loading.set(false);
          }
        }
      });
  }

  /**
   * Load availabilities
   */
  private loadAvailabilities(): void {
    this.sessionService.getTeacherAvailability()
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return of({ success: true, data: [], message: 'No availability found' });
          }
          console.error('Error loading availabilities:', error);
          return of({ success: false, data: [], message: 'Error' });
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.availabilities.set(response.data);
          }
        }
      });
  }

  /**
   * Load exception days
   */
  private loadExceptions(): void {
    this.sessionService.getTeacherExceptions()
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return of({ success: true, data: [], message: 'No exceptions found' });
          }
          console.error('Error loading exceptions:', error);
          return of({ success: false, data: [], message: 'Error' });
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.exceptions.set(response.data);
          }
        }
      });
  }

  /**
   * Load sessions
   */
  private loadSessions(): void {
    this.tutoringService.getTeacherSessions(this.selectedStatus, this.startDate, this.endDate)
      .subscribe({
        next: (response: any) => {
          // Handle both array response and wrapped { data: [...] } response
          let sessionsArray: TutoringSessionDto[];
          if (Array.isArray(response)) {
            sessionsArray = response;
          } else if (response && Array.isArray(response.data)) {
            sessionsArray = response.data;
          } else if (response && response.sessions && Array.isArray(response.sessions)) {
            sessionsArray = response.sessions;
          } else {
            console.warn('Unexpected sessions response format:', response);
            sessionsArray = [];
          }
          this.sessions.set(sessionsArray);
          this.filterSessionsByViewMode();
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading sessions:', error);
          this.toastService.showError('Failed to load sessions');
          this.sessions.set([]);
          this.filteredSessions.set([]);
          this.loading.set(false);
        }
      });
  }

  // ============================================
  // Tab Management
  // ============================================

  switchTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    // Update URL without navigation
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  // ============================================
  // Settings Methods
  // ============================================

  patchSettingsForm(data: TeacherSessionSettingsDto): void {
    this.settingsForm.patchValue({
      sessionDurationMinutes: data.sessionDurationMinutes,
      bufferTimeMinutes: data.bufferTimeMinutes,
      isAcceptingBookings: data.isAcceptingBookings,
      maxSessionsPerDay: data.maxSessionsPerDay,
      description: data.description
    });
  }

  toggleSettingsForm(): void {
    this.showSettingsForm.set(!this.showSettingsForm());
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.toastService.showWarning('Please fill all required fields');
      return;
    }

    this.savingSettings.set(true);
    const dto: UpdateSessionSettingsDto = this.settingsForm.value;

    this.sessionService.updateTeacherSettings(dto).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.settings.set(response.data);
          this.toastService.showSuccess('Settings saved successfully');
          this.showSettingsForm.set(false);
        }
        this.savingSettings.set(false);
      },
      error: (error) => {
        console.error('Error saving settings:', error);
        this.toastService.showError('Failed to save settings');
        this.savingSettings.set(false);
      }
    });
  }

  // ============================================
  // Availability Methods
  // ============================================

  toggleAvailabilityForm(): void {
    this.showAvailabilityForm.set(!this.showAvailabilityForm());
    this.showSlotGenerator.set(false);
    if (this.showAvailabilityForm()) {
      this.availabilityForm.reset({
        dayOfWeek: '',
        startTime: '09:00',
        endTime: '17:00'
      });
    }
  }

  toggleSlotGenerator(): void {
    this.showSlotGenerator.set(!this.showSlotGenerator());
  }

  addAvailability(): void {
    if (this.availabilityForm.invalid) {
      this.toastService.showWarning('Please fill all required fields');
      return;
    }

    const formValue = this.availabilityForm.value;
    const dayNumber = parseInt(formValue.dayOfWeek);
    const dayName = this.daysOfWeek.find(d => d.value === dayNumber)?.label || 'Sunday';

    if (formValue.startTime >= formValue.endTime) {
      this.toastService.showError('Start time must be before end time');
      return;
    }

    const dto: CreateAvailabilityDto = {
      dayOfWeek: dayName,
      startTime: formValue.startTime + ':00',
      endTime: formValue.endTime + ':00'
    };

    this.addingAvailability.set(true);

    this.sessionService.addTeacherAvailability(dto).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availabilities.update(list => [...list, response.data]);
          this.toastService.showSuccess('Time slot added successfully');
          this.showAvailabilityForm.set(false);
          this.availabilityForm.reset();
        }
        this.addingAvailability.set(false);
      },
      error: (error) => {
        console.error('Error adding availability:', error);
        this.toastService.showError('Failed to add time slot');
        this.addingAvailability.set(false);
      }
    });
  }

  /**
   * Generate multiple slots based on slot generator settings
   * Now uses backend bulk generation API
   */
  generateSlots(): void {
    if (this.slotGeneratorForm.invalid) {
      this.toastService.showWarning('Please fill all required fields');
      return;
    }

    const formValue = this.slotGeneratorForm.value;
    const dayNumber = parseInt(formValue.dayOfWeek);

    // Convert day name to DayOfWeek enum value (0-6)
    const dto: any = {
      dayOfWeek: dayNumber,
      startTime: formValue.startTime + ':00',
      endTime: formValue.endTime + ':00',
      sessionDurationMinutes: formValue.sessionDuration,
      breakBetweenMinutes: formValue.breakBetweenSessions,
      defaultSessionType: formValue.defaultSessionType,
      subjectId: formValue.subjectId || null
    };

    this.addingAvailability.set(true);

    this.sessionService.generateAvailabilitySlots(dto).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const { slotsGenerated, slots, warnings } = response.data;

          // Add all generated slots to the list
          this.availabilities.update(list => [...list, ...slots]);

          // Show success message
          this.toastService.showSuccess(`Generated ${slotsGenerated} time slot(s) successfully`);

          // Show warnings if any
          if (warnings && warnings.length > 0) {
            warnings.forEach(warning => {
              this.toastService.showWarning(warning);
            });
          }

          this.showAvailabilityForm.set(false);
          this.showSlotGenerator.set(false);
          this.slotGeneratorForm.reset({
            dayOfWeek: '',
            startTime: '09:00',
            endTime: '17:00',
            sessionDuration: 60,
            breakBetweenSessions: 15,
            defaultSessionType: 'OneToOne'
          });
        }
        this.addingAvailability.set(false);
      },
      error: (error) => {
        console.error('Error generating slots:', error);
        this.toastService.showError('Failed to generate time slots');
        this.addingAvailability.set(false);
      }
    });
  }

  deleteAvailability(availability: TeacherAvailabilityDto): void {
    const dayName = this.getDayName(availability.dayOfWeek);
    const timeSlot = `${this.formatTime(availability.startTime)} - ${this.formatTime(availability.endTime)}`;

    this.confirmDialog.confirmDelete(`${dayName} time slot (${timeSlot})`).subscribe(confirmed => {
      if (!confirmed) return;

      this.sessionService.deleteTeacherAvailability(availability.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.availabilities.update(list => list.filter(a => a.id !== availability.id));
            this.toastService.showSuccess('Time slot deleted successfully');
          }
        },
        error: (error) => {
          console.error('Error deleting availability:', error);
          this.toastService.showError('Failed to delete time slot');
        }
      });
    });
  }

  /**
   * Edit availability slot - opens modal
   */
  editAvailability(availability: TeacherAvailabilityDto): void {
    this.editingSlot.set(availability);
    this.showEditSlotModal.set(true);
  }

  /**
   * Close edit slot modal
   */
  closeEditSlotModal(): void {
    this.showEditSlotModal.set(false);
    this.editingSlot.set(null);
  }

  /**
   * Update slot session type
   */
  updateSlotSessionType(newSessionType: string, maxStudents?: number): void {
    const slot = this.editingSlot();
    if (!slot) return;

    this.updatingSlot.set(true);

    // Call API to update the slot
    this.sessionService.updateTeacherAvailability(slot.id, {
      sessionType: newSessionType,
      maxStudents: newSessionType === 'Group' ? (maxStudents || 5) : undefined
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local state using unique ID (backend now returns unique IDs)
          this.availabilities.update(list =>
            list.map(a => {
              if (a.id === slot.id) {
                // Use response data if available, otherwise use our update values
                return response.data || {
                  ...a,
                  sessionType: newSessionType,
                  maxStudents: newSessionType === 'Group' ? (maxStudents || 5) : undefined
                };
              }
              return a;
            })
          );
          this.toastService.showSuccess('Session type updated successfully');
          this.closeEditSlotModal();
        }
        this.updatingSlot.set(false);
      },
      error: (error) => {
        console.error('Error updating slot:', error);
        this.toastService.showError('Failed to update session type');
        this.updatingSlot.set(false);
      }
    });
  }


  // ============================================
  // Exception Days Methods
  // ============================================


  toggleExceptionForm(): void {
    this.showExceptionForm.set(!this.showExceptionForm());
    if (this.showExceptionForm()) {
      // Set default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.exceptionForm.reset({
        startDate: this.formatDateForInput(tomorrow),
        endDate: '',
        reason: ''
      });
    }
  }

  addException(): void {
    if (this.exceptionForm.invalid) {
      this.toastService.showWarning('Please select a date');
      return;
    }

    const formValue = this.exceptionForm.value;
    const dto: CreateExceptionDto = {
      startDate: formValue.startDate,
      endDate: formValue.endDate || formValue.startDate,
      reason: formValue.reason || undefined
    };

    this.addingException.set(true);

    this.sessionService.addTeacherException(dto).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.exceptions.update(list => [...list, response.data]);
          this.toastService.showSuccess('Exception added successfully');
          this.showExceptionForm.set(false);
        }
        this.addingException.set(false);
      },
      error: (error) => {
        console.error('Error adding exception:', error);
        this.toastService.showError('Failed to add exception');
        this.addingException.set(false);
      }
    });
  }

  deleteException(exception: ExceptionDayDto): void {
    const dateRange = exception.startDate === exception.endDate
      ? exception.startDate
      : `${exception.startDate} to ${exception.endDate}`;

    this.confirmDialog.confirmDelete(`exception (${dateRange})`).subscribe(confirmed => {
      if (!confirmed) return;

      this.sessionService.deleteTeacherException(exception.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.exceptions.update(list => list.filter(e => e.id !== exception.id));
            this.toastService.showSuccess('Exception deleted successfully');
          }
        },
        error: (error) => {
          console.error('Error deleting exception:', error);
          this.toastService.showError('Failed to delete exception');
        }
      });
    });
  }

  // ============================================
  // Calendar View Methods
  // ============================================

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    if (mode === 'today') {
      this.selectedDate.set(new Date());
    }
    this.filterSessionsByViewMode();
  }

  changeDate(direction: 'prev' | 'next'): void {
    const current = new Date(this.selectedDate());
    const days = this.viewMode() === 'week' ? 7 : 1;

    if (direction === 'prev') {
      current.setDate(current.getDate() - days);
    } else {
      current.setDate(current.getDate() + days);
    }

    this.selectedDate.set(current);
    this.filterSessionsByViewMode();
  }

  setSelectedDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.selectedDate.set(new Date(input.value));
      this.filterSessionsByViewMode();
    }
  }

  goToToday(): void {
    this.selectedDate.set(new Date());
    this.viewMode.set('today');
    this.filterSessionsByViewMode();
  }

  private filterSessionsByViewMode(): void {
    const sessions = this.sessions();
    const mode = this.viewMode();
    const selected = this.selectedDate();

    let filtered: TutoringSessionDto[];

    if (mode === 'today') {
      const today = new Date();
      filtered = sessions.filter(s => this.isSameDay(new Date(s.dateTime), today));
    } else if (mode === 'day') {
      filtered = sessions.filter(s => this.isSameDay(new Date(s.dateTime), selected));
    } else {
      // Week view - get the week starting from selected date
      const weekStart = new Date(selected);
      weekStart.setDate(selected.getDate() - selected.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      filtered = sessions.filter(s => {
        const sessionDate = new Date(s.dateTime);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });
    }

    this.filteredSessions.set(filtered);
  }

  getSessionsForDate(date: Date): TutoringSessionDto[] {
    return this.sessions().filter(s => this.isSameDay(new Date(s.dateTime), date));
  }

  getWeekDates(): Date[] {
    const selected = this.selectedDate();
    const weekStart = new Date(selected);
    weekStart.setDate(selected.getDate() - selected.getDay());

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  // ============================================
  // Session Actions
  // ============================================

  refreshSessions(): void {
    this.loadSessions();
  }

  openMeetingLink(session: TutoringSessionDto): void {
    if (session.meetingLink) {
      window.open(session.meetingLink, '_blank');
    }
  }

  startSession(session: TutoringSessionDto): void {
    if (confirm(`Start session with ${session.studentName}?`)) {
      this.tutoringService.startSession(session.id).subscribe({
        next: () => {
          this.toastService.showSuccess('Session started!');
          this.loadSessions();
        },
        error: (error) => {
          console.error('Error starting session:', error);
          this.toastService.showError('Failed to start session');
        }
      });
    }
  }

  completeSession(session: TutoringSessionDto): void {
    if (confirm(`Complete session with ${session.studentName}?`)) {
      this.tutoringService.completeSession(session.id).subscribe({
        next: () => {
          this.toastService.showSuccess('Session completed!');
          this.loadSessions();
        },
        error: (error) => {
          console.error('Error completing session:', error);
          this.toastService.showError('Failed to complete session');
        }
      });
    }
  }

  cancelSession(session: TutoringSessionDto): void {
    if (confirm(`Cancel session with ${session.studentName}?`)) {
      this.tutoringService.cancelSession(session.id).subscribe({
        next: () => {
          this.toastService.showSuccess('Session cancelled');
          this.loadSessions();
        },
        error: (error) => {
          console.error('Error cancelling session:', error);
          this.toastService.showError('Failed to cancel session');
        }
      });
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  formatTime(time: string): string {
    return time.substring(0, 5);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format exception date to show only date without time
   */
  formatExceptionDate(dateString: string): string {
    // Remove time part if present (e.g., "2025-12-26T00:00:00" -> "2025-12-26")
    const datePart = dateString.split('T')[0];
    const date = new Date(datePart);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }


  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  getDayName(dayOfWeek: string | number): string {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (typeof dayOfWeek === 'number') {
      return dayNames[dayOfWeek];
    }
    const parsed = parseInt(dayOfWeek);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) {
      return dayNames[parsed];
    }
    return dayOfWeek as string;
  }

  getAvailabilitiesByDay(): { [key: string]: TeacherAvailabilityDto[] } {
    const grouped: { [key: string]: TeacherAvailabilityDto[] } = {};

    this.availabilities().forEach(availability => {
      const dayName = this.getDayName(availability.dayOfWeek);
      if (!grouped[dayName]) {
        grouped[dayName] = [];
      }
      grouped[dayName].push(availability);
    });

    return grouped;
  }

  getSortedDays(): string[] {
    const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = this.getAvailabilitiesByDay();
    return daysOrder.filter(day => grouped[day] && grouped[day].length > 0);
  }

  getSessionStats() {
    const sessions = this.sessions();
    return {
      scheduled: sessions.filter(s => s.status === 'Scheduled').length,
      inProgress: sessions.filter(s => s.status === 'InProgress').length,
      completed: sessions.filter(s => s.status === 'Completed').length,
      total: sessions.length
    };
  }
}
