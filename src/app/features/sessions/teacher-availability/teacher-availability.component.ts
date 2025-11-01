/**
 * Teacher Availability Management Component
 * For teachers to manage their available booking times
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SessionService } from '../../../core/services/session.service';
import { ToastService } from '../../../core/services/toast.service';
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './teacher-availability.component.html',
  styleUrl: './teacher-availability.component.scss'
})
export class TeacherAvailabilityComponent implements OnInit {
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);
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
  daysOfWeek = Object.values(DayOfWeek);

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
      pricePerSession: [50, [Validators.required, Validators.min(1)]],
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

    // Load settings
    this.sessionService.getTeacherSettings().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.settings.set(response.data);
          this.patchSettingsForm(response.data);
        }
        this.loadAvailabilities();
      },
      error: (error) => {
        console.error('Error loading settings:', error);
        this.toastService.showError('Failed to load settings');
        this.loading.set(false);
      }
    });
  }

  /**
   * Load teacher availabilities
   */
  private loadAvailabilities(): void {
    this.sessionService.getTeacherAvailability().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availabilities.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading availabilities:', error);
        this.toastService.showError('Failed to load available time slots');
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
      pricePerSession: data.pricePerSession,
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
      this.toastService.showWarning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    this.savingSettings.set(true);

    const dto: UpdateSessionSettingsDto = this.settingsForm.value;

    this.sessionService.updateTeacherSettings(dto).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.settings.set(response.data);
          this.toastService.showSuccess('تم حفظ الإعدادات بنجاح');
          this.showSettingsForm.set(false);
        }
        this.savingSettings.set(false);
      },
      error: (error) => {
        console.error('Error saving settings:', error);
        this.toastService.showError('فشل في حفظ الإعدادات');
        this.savingSettings.set(false);
      }
    });
  }

  /**
   * Add availability
   */
  addAvailability(): void {
    if (this.availabilityForm.invalid) {
      this.toastService.showWarning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    this.addingAvailability.set(true);

    const formValue = this.availabilityForm.value;
    const dto: CreateAvailabilityDto = {
      dayOfWeek: formValue.dayOfWeek,
      startTime: `${formValue.startTime}:00`,
      endTime: `${formValue.endTime}:00`
    };

    this.sessionService.addTeacherAvailability(dto).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Add to list
          this.availabilities.update(list => [...list, response.data]);
          this.toastService.showSuccess('تم إضافة الموعد بنجاح');
          this.showAvailabilityForm.set(false);
          this.availabilityForm.reset();
        }
        this.addingAvailability.set(false);
      },
      error: (error) => {
        console.error('Error adding availability:', error);
        this.toastService.showError('فشل في إضافة الموعد');
        this.addingAvailability.set(false);
      }
    });
  }

  /**
   * Delete availability
   */
  deleteAvailability(availability: TeacherAvailabilityDto): void {
    if (!confirm(`Do you want to delete the ${availability.dayOfWeek} time slot?`)) {
      return;
    }

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

    this.availabilities().forEach(availability => {
      const day = availability.dayOfWeek;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(availability);
    });

    return grouped;
  }

  /**
   * Get sorted days
   */
  getSortedDays(): string[] {
    const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = this.getAvailabilitiesByDay();
    return daysOrder.filter(day => grouped[day]);
  }
}
