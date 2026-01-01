import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import {
  SmartSchedulingResponse,
  GetAvailableSlotsRequest,
  SmartSchedulingStudentSelection,
  SmartSchedulingSubjectSelection,
  ScheduledTeacherDto,
  ScheduledSlotDto,
  TeachingType,
  HoursOption
} from '../../../models/tutoring.models';

@Component({
  selector: 'app-step5-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step5-schedule.component.html',
  styleUrls: ['./step5-schedule.component.scss']
})
export class Step5ScheduleComponent implements OnInit {
  students: { id: number; name: string; academicYearId: number }[] = [];
  scheduleResponse: SmartSchedulingResponse | null = null;
  selectedSlots = new Set<string>();
  loading = false;
  noScheduleFound = false;

  // Swap Modal State
  swapModalOpen = false;
  currentSwapSlot: ScheduledSlotDto | null = null;
  currentSwapTeacherId: number | null = null;
  currentSwapSubjectId: number | null = null;
  availableAlternativeSlots: ScheduledSlotDto[] = [];
  // Map of original slot unique key (availabilityId_dateTime) -> new slot (for tracking swaps)
  // Using composite key because availabilityId alone is not unique (same availability can generate multiple dated slots)
  swappedSlots = new Map<string, ScheduledSlotDto>();

  // Preferences
  startDate = '';
  endDate = '';
  preferredTimeRange = '';
  selectedDays: boolean[] = [false, true, false, true, false, true, false]; // Default: Mon, Wed, Sat
  daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // UI State
  preferencesExpanded = true;

  // Collapsible subjects state: Map of "studentId_subjectId" -> isExpanded
  expandedSubjects = new Set<string>();
  hoveredSubject: string | null = null;
  firstSubjectsInitialized = false;

  // Cached schedule data to prevent re-calculation on every render
  cachedStudentSchedules: Map<number, Array<{
    subjectId: number;
    subjectName: string;
    teachingType: string;
    slots: Array<{ slot: ScheduledSlotDto; teacherId: number }>;
  }>> = new Map();

  // Slot Reservation State
  reservationSessionToken: string | null = null;
  reservationExpiresAt: Date | null = null;
  reservationTimer: any = null;
  reservationRemainingMinutes: number = 0;
  reservationRemainingSeconds: number = 0;
  reservingSlots: boolean = false;

  // Unavailable Subjects Warning
  unavailableSubjectsModalOpen: boolean = false;
  unavailableSubjects: Array<{
    studentId: number;
    studentName: string;
    subjectId: number;
    subjectName: string;
    teachingType: string;
    requestedSessions: number;
    availableSessions: number;
    message: string;
  }> = [];

  constructor(
    private stateService: TutoringStateService,
    private tutoringService: TutoringService,
    private contentService: ContentService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.restoreState();
    this.setDefaultDates();
    this.loadSmartSchedule();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.students = Array.isArray(state.students) ? state.students : [];
  }

  setDefaultDates(): void {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7); // Start in 1 week

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3); // 3 months duration

    this.startDate = startDate.toISOString().split('T')[0];
    this.endDate = endDate.toISOString().split('T')[0];
  }

  loadSmartSchedule(): void {
    this.loading = true;
    this.noScheduleFound = false;

    const state = this.stateService.getState();

    // Build student selections for API (with per-subject term info)
    const studentSelections: SmartSchedulingStudentSelection[] = this.students.map(student => {
      const subjectIds = state.studentSubjects.get(student.id) || new Set();

      const subjects: SmartSchedulingSubjectSelection[] = Array.from(subjectIds).map(subjectId => {
        const key = `${student.id}_${subjectId}`;
        const teachingType = state.subjectTeachingTypes.get(key) || TeachingType.OneToOne;
        const hours = (state.subjectHours.get(key) || 10) as HoursOption;

        // Get term info from state (could be object or number depending on format)
        const storedTerm = state.subjectTerms.get(key);

        // Extract academicTermId properly (handle both old number format and new object format)
        let academicTermId: number | null = null;
        if (storedTerm) {
          if (typeof storedTerm === 'number') {
            // Old format: just a number
            academicTermId = storedTerm;
          } else if (typeof storedTerm === 'object' && storedTerm !== null) {
            // New format: object with termId and academicTermId
            academicTermId = (storedTerm as any).academicTermId ?? null;
          }
        }

        // Determine if subject is global (no term required)
        const isGlobal = academicTermId === null;

        console.log(`📚 Subject ${subjectId}: academicTermId=${academicTermId}, isGlobal=${isGlobal}`);

        return {
          subjectId,
          teachingType,
          hours,
          academicTermId,  // ✅ Now properly a number, not an object
          isGlobal
        };
      });

      return {
        studentId: student.id,
        subjects
      };
    });

    // Build preferred days
    const preferredDays = this.selectedDays
      .map((selected, index) => selected ? index : -1)
      .filter(day => day >= 0);

    // Build time range
    let timeRange: { start: string; end: string } | undefined;
    if (this.preferredTimeRange === 'morning') {
      timeRange = { start: '09:00:00', end: '12:00:00' };
    } else if (this.preferredTimeRange === 'afternoon') {
      timeRange = { start: '12:00:00', end: '17:00:00' };
    } else if (this.preferredTimeRange === 'evening') {
      timeRange = { start: '17:00:00', end: '21:00:00' };
    }

    // Convert dates to ISO 8601 format
    const startDateTime = new Date(this.startDate);
    startDateTime.setHours(0, 0, 0, 0);

    const endDateTime = new Date(this.endDate);
    endDateTime.setHours(23, 59, 59, 999);

    const request: GetAvailableSlotsRequest = {
      studentSelections,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      preferredDays: preferredDays.length > 0 ? preferredDays : undefined,
      preferredTimeRange: timeRange
    };

    this.tutoringService.getAvailableSlotsSmart(request).subscribe({
      next: (response) => {
        // Debug logging - remove in production
        console.log('📅 Smart Schedule Response:', response);
        console.log('📊 Summary:', {
          total: response.summary.totalSessions,
          matched: response.summary.matchedSessions,
          unmatched: response.summary.unmatchedSessions,
          consistentTeacher: response.summary.consistentTeacherPerSubject,
          splitSubjects: response.summary.splitSubjects?.length || 0
        });
        console.log('👨‍🏫 Teachers count:', response.recommendedSchedule.teachers.length);
        response.recommendedSchedule.teachers.forEach((t, i) => {
          console.log(`  Teacher ${i + 1}: ${t.teacherName} (Priority: ${t.priority})`);
          t.subjectSchedules.forEach(s => {
            console.log(`    📚 ${s.subjectName}: ${s.assignedSessions}/${s.totalSessions} sessions, ${s.slots.length} slots`);
          });
        });

        this.scheduleResponse = response;
        this.loading = false;

        // Only show "no schedule found" if teachers array is truly empty
        if (!response.recommendedSchedule.teachers.length) {
          this.noScheduleFound = true;
          console.warn('⚠️ No teachers found in recommendedSchedule');
        } else {
          this.noScheduleFound = false;
          // Build cached data first, then initialize expanded subjects
          this.buildCachedSchedules();
          this.initializeFirstSubjects();
          // Check for unavailable subjects and show warning
          this.checkUnavailableSubjects();
        }
      },
      error: (err) => {
        console.error('❌ Error loading smart schedule:', err);
        console.error('Error details:', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        this.loading = false;
        this.noScheduleFound = true;
      }
    });
  }

  formatDate(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getDayName(dayOfWeek: number): string {
    return this.daysOfWeek[dayOfWeek];
  }

  getTotalSessions(teacher: ScheduledTeacherDto): number {
    return teacher.subjectSchedules.reduce((total, s) => total + s.assignedSessions, 0);
  }

  formatDayNum(dateTime: string): string {
    const date = new Date(dateTime);
    return date.getDate().toString();
  }

  formatMonth(dateTime: string): string {
    const date = new Date(dateTime);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
  }

  // Group all slots by subject (merging from multiple teachers)
  getGroupedSubjectSlots(): Array<{
    subjectId: number;
    subjectName: string;
    teachingType: string;
    slots: Array<{ slot: ScheduledSlotDto; teacherId: number }>;
  }> {
    if (!this.scheduleResponse) return [];

    const subjectMap = new Map<number, {
      subjectId: number;
      subjectName: string;
      teachingType: string;
      slots: Array<{ slot: ScheduledSlotDto; teacherId: number }>;
    }>();

    // Collect all slots from all teachers, grouped by subject
    this.scheduleResponse.recommendedSchedule.teachers.forEach(teacher => {
      teacher.subjectSchedules.forEach(schedule => {
        if (!subjectMap.has(schedule.subjectId)) {
          subjectMap.set(schedule.subjectId, {
            subjectId: schedule.subjectId,
            subjectName: schedule.subjectName,
            teachingType: schedule.teachingType,
            slots: []
          });
        }

        const subjectData = subjectMap.get(schedule.subjectId)!;
        schedule.slots.forEach(slot => {
          subjectData.slots.push({ slot, teacherId: teacher.teacherId });
        });
      });
    });

    // Convert to array and sort slots by date
    const result = Array.from(subjectMap.values());
    result.forEach(subject => {
      subject.slots.sort((a, b) =>
        new Date(this.getDisplaySlot(a.slot).dateTime).getTime() -
        new Date(this.getDisplaySlot(b.slot).dateTime).getTime()
      );
    });

    return result;
  }

  // Get subjects and slots for a specific student
  getSubjectsForStudent(studentId: number): Array<{
    subjectId: number;
    subjectName: string;
    teachingType: string;
    slots: Array<{ slot: ScheduledSlotDto; teacherId: number }>;
  }> {
    // Return cached data if available
    if (this.cachedStudentSchedules.has(studentId)) {
      return this.cachedStudentSchedules.get(studentId)!;
    }
    return [];
  }

  // Build cached data for all students (called once after schedule loads)
  // Now uses studentId from backend response for correct grouping
  buildCachedSchedules(): void {
    this.cachedStudentSchedules.clear();

    if (!this.scheduleResponse) return;

    // Group schedules by studentId from the response
    this.students.forEach(student => {
      const studentSubjects: Array<{
        subjectId: number;
        subjectName: string;
        teachingType: string;
        slots: Array<{ slot: ScheduledSlotDto; teacherId: number }>;
      }> = [];

      // Collect all subjects for this student from all teachers
      this.scheduleResponse!.recommendedSchedule.teachers.forEach(teacher => {
        teacher.subjectSchedules
          .filter(schedule => schedule.studentId === student.id)
          .forEach(schedule => {
            // Check if we already have this subject for this student
            let existingSubject = studentSubjects.find(s => s.subjectId === schedule.subjectId);

            if (!existingSubject) {
              existingSubject = {
                subjectId: schedule.subjectId,
                subjectName: schedule.subjectName,
                teachingType: schedule.teachingType,
                slots: []
              };
              studentSubjects.push(existingSubject);
            }

            // Add slots from this teacher
            schedule.slots.forEach(slot => {
              existingSubject!.slots.push({
                slot: slot,
                teacherId: teacher.teacherId
              });
            });
          });
      });

      // Sort slots by date
      studentSubjects.forEach(subject => {
        subject.slots.sort((a, b) =>
          new Date(a.slot.dateTime).getTime() - new Date(b.slot.dateTime).getTime()
        );
      });

      this.cachedStudentSchedules.set(student.id, studentSubjects);
    });

    console.log('📚 Built cached schedules for', this.cachedStudentSchedules.size, 'students');
  }

  // Initialize first subject of each student as expanded
  initializeFirstSubjects(): void {
    this.firstSubjectsInitialized = true;
    console.log('🔓 Initializing first subjects, students:', this.students.length);
    console.log('📚 Cached schedules:', this.cachedStudentSchedules.size);

    this.students.forEach(student => {
      const studentSubjects = this.cachedStudentSchedules.get(student.id) || [];
      console.log(`👤 Student ${student.id} has ${studentSubjects.length} subjects`);
      if (studentSubjects.length > 0) {
        const key = `${student.id}_${studentSubjects[0].subjectId}`;
        this.expandedSubjects.add(key);
        console.log(`✅ Expanded: ${key}`);
      }
    });
    console.log('📂 Total expanded subjects:', this.expandedSubjects.size);
    // Force UI update
    this.cdr.detectChanges();
  }

  // Check for subjects that don't have full sessions available
  checkUnavailableSubjects(): void {
    if (!this.scheduleResponse?.summary?.subjectAvailability) {
      console.log('ℹ️ No subjectAvailability data in response');
      return;
    }

    // Find subjects that are NOT fully covered
    const unavailable = this.scheduleResponse.summary.subjectAvailability
      .filter(sa => !sa.isFullyCovered);

    if (unavailable.length === 0) {
      console.log('✅ All subjects are fully covered');
      return;
    }

    console.log('⚠️ Found unavailable subjects:', unavailable);

    // Build list with student info
    this.unavailableSubjects = unavailable.map(sa => {
      // Try to find student name
      const student = this.students.find(s => s.id === sa.studentId);
      return {
        studentId: sa.studentId || 0,
        studentName: sa.studentName || student?.name || 'Unknown Student',
        subjectId: sa.subjectId,
        subjectName: sa.subjectName,
        teachingType: sa.teachingType,
        requestedSessions: sa.requestedSessions,
        availableSessions: sa.availableSessions,
        message: sa.message
      };
    });

    // Inline banner shows automatically via *ngIf
    // No need to trigger modal anymore
  }

  // Continue booking after acknowledging unavailable subjects
  continueWithAvailableSubjects(): void {
    // Remove unavailable subjects from state
    this.removeUnavailableSubjectsFromState();
    this.unavailableSubjectsModalOpen = false;
    console.log('👍 User chose to continue with available subjects - unavailable removed from state');
  }

  // Remove unavailable subjects from the state service
  removeUnavailableSubjectsFromState(): void {
    // For each unavailable subject, remove it completely from state
    this.unavailableSubjects.forEach(item => {
      this.stateService.removeSubjectFromStudent(item.studentId, item.subjectId);
    });
    console.log('✅ State updated - unavailable subjects removed');
  }

  // Dismiss warning banner and remove unavailable subjects
  dismissWarningAndRemoveSubjects(): void {
    this.removeUnavailableSubjectsFromState();
    this.unavailableSubjects = [];
    console.log('👋 Warning banner dismissed, subjects removed');
  }

  // Cancel booking due to unavailable subjects
  cancelDueToUnavailableSubjects(): void {
    this.unavailableSubjectsModalOpen = false;
    // Go back to subject selection
    this.stateService.setCurrentStep(2); // Step 2 is subject selection
  }

  // Check if a subject is expanded
  isSubjectExpanded(studentId: number, subjectId: number): boolean {
    const key = `${studentId}_${subjectId}`;
    return this.expandedSubjects.has(key);
  }

  // Toggle subject expanded/collapsed
  toggleSubject(studentId: number, subjectId: number): void {
    const key = `${studentId}_${subjectId}`;
    if (this.expandedSubjects.has(key)) {
      this.expandedSubjects.delete(key);
    } else {
      this.expandedSubjects.add(key);
    }
  }

  getTeacherDisplayName(teacher: ScheduledTeacherDto): string {
    return teacher.teacherName || `Teacher #${teacher.teacherId}`;
  }

  getTeacherInitial(teacher: ScheduledTeacherDto): string {
    const name = teacher.teacherName || '';
    return name.length > 0 ? name.charAt(0).toUpperCase() : 'T';
  }

  isSlotSelected(slot: ScheduledSlotDto): boolean {
    // Check if this slot has been removed/deselected by the user
    return this.selectedSlots.has(slot.availabilityId.toString());
  }

  toggleSlot(teacherId: number, subjectId: number, slot: ScheduledSlotDto): void {
    // Use availabilityId as unique identifier for the slot
    const key = slot.availabilityId.toString();
    if (this.selectedSlots.has(key)) {
      this.selectedSlots.delete(key);
    } else {
      this.selectedSlots.add(key);
    }
  }

  canProceed(): boolean {
    return this.scheduleResponse !== null &&
      this.scheduleResponse.recommendedSchedule.teachers.length > 0;
  }

  previousStep(): void {
    // Cancel any reservations before going back
    this.cancelReservationsAndGoBack();
  }

  cancelReservationsAndGoBack(): void {
    if (this.reservationSessionToken) {
      this.tutoringService.cancelReservations(this.reservationSessionToken).subscribe({
        next: () => {
          this.clearReservationState();
          this.stateService.previousStep();
        },
        error: () => {
          this.clearReservationState();
          this.stateService.previousStep();
        }
      });
    } else {
      this.stateService.previousStep();
    }
  }

  nextStep(): void {
    if (this.canProceed()) {
      this.proceedToPayment();
    }
  }

  // Reserve slots before proceeding to payment
  proceedToPayment(): void {
    if (this.reservingSlots) return;

    // Auto-remove unavailable subjects before proceeding
    if (this.unavailableSubjects.length > 0) {
      console.log('🗑️ Auto-removing unavailable subjects before payment...');
      this.removeUnavailableSubjectsFromState();
      this.unavailableSubjects = [];
    }

    // Collect all slots to reserve from all teachers
    const slotsToReserve: Array<{
      availabilityId: number;
      dateTime: string;
      teacherId: number;
      subjectId: number;
      teachingType: string;
    }> = [];

    if (this.scheduleResponse) {
      this.scheduleResponse.recommendedSchedule.teachers.forEach(teacher => {
        teacher.subjectSchedules.forEach(schedule => {
          schedule.slots.forEach(slot => {
            // Use swapped slot if exists
            const displaySlot = this.getDisplaySlot(slot);
            slotsToReserve.push({
              availabilityId: displaySlot.availabilityId,
              dateTime: displaySlot.dateTime,
              teacherId: teacher.teacherId,
              subjectId: schedule.subjectId,
              teachingType: schedule.teachingType
            });
          });
        });
      });
    }

    if (slotsToReserve.length === 0) {
      console.warn('No slots to reserve');
      return;
    }

    this.reservingSlots = true;
    console.log('🔒 Reserving', slotsToReserve.length, 'slots...');

    this.tutoringService.reserveSlots({
      slots: slotsToReserve,
      expirationMinutes: 15
    }).subscribe({
      next: (result) => {
        this.reservingSlots = false;
        if (result.success) {
          console.log('✅ Slots reserved successfully, token:', result.sessionToken);
          this.reservationSessionToken = result.sessionToken;
          this.reservationExpiresAt = new Date(result.expiresAt);
          this.startReservationTimer();

          // ✅ Save session token to state for step6 to use
          this.stateService.setReservationSessionToken(result.sessionToken);

          // Proceed to next step (payment)
          this.stateService.nextStep();
        } else {
          console.error('❌ Some slots not available:', result.failedSlots);
          alert(`Some slots are no longer available. Please refresh and try again.`);
        }
      },
      error: (err) => {
        this.reservingSlots = false;
        console.error('❌ Error reserving slots:', err);
        alert('Failed to reserve slots. Please try again.');
      }
    });
  }

  // Timer for reservation countdown
  startReservationTimer(): void {
    if (this.reservationTimer) {
      clearInterval(this.reservationTimer);
    }

    this.reservationTimer = setInterval(() => {
      if (!this.reservationExpiresAt) {
        this.stopReservationTimer();
        return;
      }

      const remaining = this.reservationExpiresAt.getTime() - Date.now();

      if (remaining <= 0) {
        this.stopReservationTimer();
        this.clearReservationState();
        alert('Your reservation has expired. Please select slots again.');
        // Reload the schedule
        this.loadSmartSchedule();
      } else {
        this.reservationRemainingMinutes = Math.floor(remaining / 60000);
        this.reservationRemainingSeconds = Math.floor((remaining % 60000) / 1000);
      }
    }, 1000);
  }

  stopReservationTimer(): void {
    if (this.reservationTimer) {
      clearInterval(this.reservationTimer);
      this.reservationTimer = null;
    }
  }

  clearReservationState(): void {
    this.stopReservationTimer();
    this.reservationSessionToken = null;
    this.reservationExpiresAt = null;
    this.reservationRemainingMinutes = 0;
    this.reservationRemainingSeconds = 0;
  }

  // Extend reservation if user needs more time
  extendReservation(): void {
    if (!this.reservationSessionToken) return;

    this.tutoringService.extendReservations(this.reservationSessionToken, 10).subscribe({
      next: (result) => {
        if (result.success) {
          this.reservationExpiresAt = new Date(result.newExpiresAt);
          console.log('⏰ Reservation extended to:', result.newExpiresAt);
        }
      },
      error: (err) => {
        console.error('Failed to extend reservation:', err);
      }
    });
  }

  // Swap Modal Methods
  loadingAlternatives = false;

  openSwapModal(teacherId: number, subjectId: number, slot: ScheduledSlotDto, event: Event): void {
    event.stopPropagation();

    this.currentSwapSlot = slot;
    this.currentSwapTeacherId = teacherId;
    this.currentSwapSubjectId = subjectId;
    this.availableAlternativeSlots = [];
    this.loadingAlternatives = true;
    this.swapModalOpen = true;

    // Get all currently assigned slot IDs to exclude them
    const excludeSlotIds: number[] = [];
    if (this.scheduleResponse) {
      this.scheduleResponse.recommendedSchedule.teachers.forEach(teacher => {
        teacher.subjectSchedules.forEach(schedule => {
          schedule.slots.forEach(s => {
            excludeSlotIds.push(s.availabilityId);
          });
        });
      });
    }

    // Get teaching type and term info for this subject
    const state = this.stateService.getState();
    const student = this.students[0];
    let teachingType = 'OneToOne';
    let termId: number | null = null;
    let isGlobal = false;

    if (student) {
      const key = `${student.id}_${subjectId}`;
      const tt = state.subjectTeachingTypes.get(key);
      if (tt) teachingType = tt;

      // Get term info for per-subject date resolution
      termId = state.subjectTerms.get(key) || null;
      isGlobal = termId === null;
    }

    console.log(`🔄 Loading alternatives: termId=${termId}, isGlobal=${isGlobal}`);

    // Call the Alternative Slots API with per-subject term info
    this.tutoringService.getAlternativeSlots(
      teacherId,
      subjectId,
      teachingType,
      this.startDate,  // Fallback for global subjects
      this.endDate,    // Fallback for global subjects
      excludeSlotIds,
      termId,          // Per-subject term
      isGlobal         // Is this a global subject?
    ).subscribe({
      next: (response) => {
        console.log('📅 Alternative slots response:', response);

        // Convert AlternativeSlotDto to ScheduledSlotDto format
        this.availableAlternativeSlots = response.alternativeSlots.map(alt => ({
          availabilityId: alt.availabilityId,
          dateTime: alt.dateTime,
          dayOfWeek: alt.dayOfWeek,
          duration: alt.duration,
          isPreferred: alt.isPreferred,
          conflictingBookings: 0
        }));

        this.loadingAlternatives = false;
        console.log('Found', this.availableAlternativeSlots.length, 'alternative slots');
      },
      error: (err) => {
        console.error('Error fetching alternative slots:', err);
        this.loadingAlternatives = false;

        // Fallback: show other existing slots
        this.showFallbackAlternatives(teacherId, subjectId, slot);
      }
    });
  }

  showFallbackAlternatives(teacherId: number, subjectId: number, slot: ScheduledSlotDto): void {
    if (this.scheduleResponse) {
      const currentTeacher = this.scheduleResponse.recommendedSchedule.teachers
        .find(t => t.teacherId === teacherId);

      if (currentTeacher) {
        const currentSchedule = currentTeacher.subjectSchedules
          .find(s => s.subjectId === subjectId);

        if (currentSchedule) {
          const currentDateTime = this.getDisplaySlot(slot).dateTime;
          this.availableAlternativeSlots = currentSchedule.slots
            .filter(s => s.dateTime !== currentDateTime)
            .filter(s => !this.isSlotSwapped(s));
        }
      }
    }
  }

  closeSwapModal(): void {
    this.swapModalOpen = false;
    this.currentSwapSlot = null;
    this.currentSwapTeacherId = null;
    this.currentSwapSubjectId = null;
    this.availableAlternativeSlots = [];
  }

  swapSlot(newSlot: ScheduledSlotDto): void {
    if (this.currentSwapSlot) {
      // Store the swap: original slot -> new slot
      // Use composite key (availabilityId + dateTime) since availabilityId alone is not unique
      const key = this.getSlotKey(this.currentSwapSlot);
      this.swappedSlots.set(key, newSlot);
      console.log('Swapped slot:', key, '->', newSlot.dateTime);
    }
    this.closeSwapModal();
  }

  // Generate unique key for a slot (availabilityId + dateTime)
  // This is necessary because the same availability can generate multiple dated slots
  getSlotKey(slot: ScheduledSlotDto): string {
    return `${slot.availabilityId}_${slot.dateTime}`;
  }

  // Get the display slot (either original or swapped)
  getDisplaySlot(slot: ScheduledSlotDto): ScheduledSlotDto {
    const key = this.getSlotKey(slot);
    return this.swappedSlots.get(key) || slot;
  }

  // Check if a slot has been swapped
  isSlotSwapped(slot: ScheduledSlotDto): boolean {
    const key = this.getSlotKey(slot);
    return this.swappedSlots.has(key);
  }
}
