/**
 * Teacher Availability Management Component
 * For teachers to manage their available booking times
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { SessionService } from '../../../core/services/session.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog/confirmation-dialog.service';
import { TeacherSidebarComponent } from '../../../shared/components/teacher-sidebar/teacher-sidebar.component';
import { TeacherHeaderComponent } from '../../../shared/components/teacher-header/teacher-header.component';
import {
  TeacherSessionSettingsDto,
  TeacherAvailabilityDto,
  DayOfWeek,
  CreateAvailabilityDto,
  UpdateSessionSettingsDto
} from '../../../models/session.models';

@Component({
  selector: 'app-teacher-availability',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './teacher-availability.component.html',
  styleUrl: './teacher-availability.component.scss'
})
export class TeacherAvailabilityComponent implements OnInit {
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmationDialogService);
  private fb = inject(FormBuilder);

  // Signals
  settings = signal<TeacherSessionSettingsDto | null>(null);
  availabilities = signal<TeacherAvailabilityDto[]>([]);
  loading = signal<boolean>(true);
  savingSettings = signal<boolean>(false);
  addingAvailability = signal<boolean>(false);

  // Forms
  settingsForm!: FormGroup;
  availabilityForm!: FormGroup;

  // UI State
  showSettingsForm = signal<boolean>(false);
  showAvailabilityForm = signal<boolean>(false);

  // Days of week for display
  // Days of week for dropdown - display names with numeric values
  daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  ngOnInit(): void {
    this.initForms();
    this.loadData();
  }

  /**
   * Initialize forms
   */
  private initForms(): void {
    // Settings form
    this.settingsForm = this.fb.group({
      sessionDurationMinutes: [60, [Validators.required, Validators.min(15), Validators.max(180)]],
      bufferTimeMinutes: [15, [Validators.required, Validators.min(0), Validators.max(60)]],
      // pricePerSession removed - managed by admin
      isAcceptingBookings: [true],
      maxSessionsPerDay: [8, [Validators.min(1), Validators.max(20)]],
      description: ['']
    });

    // Availability form
    this.availabilityForm = this.fb.group({
      dayOfWeek: ['', Validators.required],
      startTime: ['09:00', Validators.required],
      endTime: ['17:00', Validators.required]
    });
  }

  /**
   * Load settings and availabilities
   */
  private loadData(): void {
    this.loading.set(true);

    // Load settings with graceful 404 handling
    this.sessionService.getTeacherSettings()
      .pipe(
        catchError((error) => {
          // 404 is expected when teacher hasn't set up settings yet
          if (error.statusCode === 404 || error.status === 404) {
            console.log('✅ No settings found - teacher can create settings on first save');
            this.toastService.showInfo('No settings found. Please configure your session settings.');
            this.showSettingsForm.set(true); // Auto-show settings form
            return of({ success: false, data: null, message: 'No settings found' });
          }
          // For other errors, show error message
          console.error('❌ Error loading settings:', error);
          this.toastService.showError('Failed to load settings');
          return of({ success: false, data: null, message: 'Error loading settings' });
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.settings.set(response.data);
            this.patchSettingsForm(response.data);
          }
          this.loadAvailabilities();
        }
      });
  }

  /**
   * Load teacher availabilities
   */
  private loadAvailabilities(): void {
    this.sessionService.getTeacherAvailability()
      .pipe(
        catchError((error) => {
          // 404 is expected when teacher hasn't added any availability slots yet
          if (error.statusCode === 404 || error.status === 404) {
            console.log('✅ No availability slots found - teacher can add them using the form');
            return of({ success: true, data: [], message: 'No availability slots found' });
          }
          // For other errors, show error message
          console.error('❌ Error loading availabilities:', error);
          this.toastService.showError('Failed to load available time slots');
          return of({ success: false, data: [], message: 'Error loading availabilities' });
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.availabilities.set(response.data);
          }
          this.loading.set(false);
        }
      });
  }

  /**
   * Patch settings form with data
   */
  private patchSettingsForm(data: TeacherSessionSettingsDto): void {
    this.settingsForm.patchValue({
      sessionDurationMinutes: data.sessionDurationMinutes,
      bufferTimeMinutes: data.bufferTimeMinutes,
      // pricePerSession removed - managed by admin
      isAcceptingBookings: data.isAcceptingBookings,
      maxSessionsPerDay: data.maxSessionsPerDay,
      description: data.description
    });
  }

  /**
   * Toggle settings form
   */
  toggleSettingsForm(): void {
    this.showSettingsForm.set(!this.showSettingsForm());
  }

  /**
   * Toggle availability form
   */
  toggleAvailabilityForm(): void {
    this.showAvailabilityForm.set(!this.showAvailabilityForm());
    if (this.showAvailabilityForm()) {
      this.availabilityForm.reset({
        dayOfWeek: '',
        startTime: '09:00',
        endTime: '17:00'
      });
    }
  }

  /**
   * Save settings
   */
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

  /**
   * Add availability
   */
  addAvailability(): void {
    if (this.availabilityForm.invalid) {
      this.toastService.showWarning('Please fill all required fields');
      return;
    }

    const formValue = this.availabilityForm.value;

    // Convert day number to day name string
    const dayNumber = parseInt(formValue.dayOfWeek);
    const dayName = this.daysOfWeek.find(d => d.value === dayNumber)?.label || 'Sunday';

    const dto: CreateAvailabilityDto = {
      dayOfWeek: dayName, // Send as string: "Sunday", "Monday", etc.
      startTime: formValue.startTime + ':00', // Convert HH:mm to HH:mm:ss (TimeSpan format)
      endTime: formValue.endTime + ':00' // Convert HH:mm to HH:mm:ss (TimeSpan format)
    };

    // Validate start time is before end time
    if (formValue.startTime >= formValue.endTime) {
      this.toastService.showError('Start time must be before end time');
      return;
    }

    // Check for conflicts with existing time slots
    const conflict = this.checkTimeSlotConflict(dto);
    if (conflict) {
      return; // Error message already shown in checkTimeSlotConflict
    }

    this.addingAvailability.set(true);

    console.log('📤 Sending availability:', dto);

    this.sessionService.addTeacherAvailability(dto).subscribe({
      next: (response) => {
        console.log('✅ Availability added:', response);
        if (response.success && response.data) {
          // Add to list
          this.availabilities.update(list => [...list, response.data]);
          console.log('📋 Updated availabilities:', this.availabilities());
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
   * Check for time slot conflicts
   * Returns true if conflict exists
   */
  private checkTimeSlotConflict(newSlot: CreateAvailabilityDto): boolean {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const existingSlots = this.availabilities().filter(slot => {
      // Normalize both to day names for proper comparison
      // Backend might return numeric (0-6) or string ("Sunday", "Monday", etc.)
      let slotDayName: string;
      if (typeof slot.dayOfWeek === 'number') {
        slotDayName = dayNames[slot.dayOfWeek];
      } else {
        const parsedDay = parseInt(slot.dayOfWeek as any);
        if (!isNaN(parsedDay) && parsedDay >= 0 && parsedDay <= 6) {
          slotDayName = dayNames[parsedDay];
        } else {
          slotDayName = slot.dayOfWeek as string;
        }
      }

      // newSlot.dayOfWeek is a string like "Sunday", "Monday", etc.
      return slotDayName.toLowerCase() === newSlot.dayOfWeek.toLowerCase();
    });

    for (const existing of existingSlots) {
      // Check for exact duplicate
      if (existing.startTime === newSlot.startTime && existing.endTime === newSlot.endTime) {
        this.toastService.showError('This time slot already exists for this day');
        return true;
      }

      // Check for overlapping times
      // Convert times to minutes for easier comparison
      const newStart = this.timeToMinutes(newSlot.startTime);
      const newEnd = this.timeToMinutes(newSlot.endTime);
      const existingStart = this.timeToMinutes(existing.startTime);
      const existingEnd = this.timeToMinutes(existing.endTime);

      // Check if times overlap
      const isOverlapping =
        (newStart >= existingStart && newStart < existingEnd) || // New start is within existing slot
        (newEnd > existingStart && newEnd <= existingEnd) || // New end is within existing slot
        (newStart <= existingStart && newEnd >= existingEnd); // New slot completely contains existing slot

      if (isOverlapping) {
        const timeRange = `${this.formatTime(existing.startTime)} - ${this.formatTime(existing.endTime)}`;
        this.toastService.showError(
          `Time slot overlaps with existing slot (${timeRange})`
        );
        return true;
      }
    }

    return false;
  }

  /**
   * Convert time string (HH:mm) to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Delete availability
   */
  deleteAvailability(availability: TeacherAvailabilityDto): void {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Backend returns dayOfWeek as string ("Sunday", "Monday", etc.)
    // But handle both cases for backwards compatibility
    let dayName: string;

    if (typeof availability.dayOfWeek === 'number') {
      dayName = dayNames[availability.dayOfWeek];
    } else if (!isNaN(parseInt(availability.dayOfWeek as any)) && parseInt(availability.dayOfWeek as any) >= 0 && parseInt(availability.dayOfWeek as any) <= 6) {
      dayName = dayNames[parseInt(availability.dayOfWeek as any)];
    } else {
      dayName = availability.dayOfWeek as string;
    }

    const timeSlot = `${this.formatTime(availability.startTime)} - ${this.formatTime(availability.endTime)}`;

    this.confirmDialog.confirmDelete(`${dayName} time slot (${timeSlot})`).subscribe(confirmed => {
      if (!confirmed) return;

      this.sessionService.deleteTeacherAvailability(availability.id).subscribe({
        next: (response) => {
          if (response.success) {
            // Remove from list
            this.availabilities.update(list =>
              list.filter(a => a.id !== availability.id)
            );
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
   * Format time for display
   */
  formatTime(time: string): string {
    return time.substring(0, 5); // HH:mm
  }

  /**
   * Group availabilities by day
   */
  getAvailabilitiesByDay(): { [key: string]: TeacherAvailabilityDto[] } {
    const grouped: { [key: string]: TeacherAvailabilityDto[] } = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    this.availabilities().forEach(availability => {
      // Backend returns dayOfWeek as string ("Sunday", "Monday", etc.)
      // But handle both cases for backwards compatibility
      let dayName: string;

      if (typeof availability.dayOfWeek === 'number') {
        // Numeric format (0-6)
        dayName = dayNames[availability.dayOfWeek];
      } else if (!isNaN(parseInt(availability.dayOfWeek as any)) && parseInt(availability.dayOfWeek as any) >= 0 && parseInt(availability.dayOfWeek as any) <= 6) {
        // String numeric format ("0", "1", etc.)
        dayName = dayNames[parseInt(availability.dayOfWeek as any)];
      } else {
        // String day name format ("Sunday", "Monday", etc.) - this is the expected format
        dayName = availability.dayOfWeek as string;
      }

      if (!grouped[dayName]) {
        grouped[dayName] = [];
      }
      grouped[dayName].push(availability);
    });

    return grouped;
  }

  /**
   * Get sorted days
   */
  getSortedDays(): string[] {
    const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = this.getAvailabilitiesByDay();
    return daysOrder.filter(day => grouped[day] && grouped[day].length > 0);
  }
}
