/**
 * Session Service - إدارة الحصص الخاصة (Private Sessions)
 * Handles all API calls for booking system
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './base-api.service';
import {
  PrivateSession,
  TeacherSessionSettings,
  UpdateSessionSettingsDto,
  TeacherAvailability,
  CreateAvailabilityDto,
  AvailableTeacher,
  AvailableSlot,
  BookSessionDto,
  BookingResponse,
  SessionApiResponse,
  TeacherSessionSettingsDto,
  TeacherAvailabilityDto,
  PrivateSessionDto,
  AvailableTeacherDto,
  AvailableSlotDto,
  BookingResponseDto
} from '../../models/session.models';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private api = inject(ApiService);

  // ============================================
  // Teacher Endpoints - للمعلمين
  // ============================================

  /**
   * Get teacher session settings
   * GET /api/Sessions/teacher/settings
   */
  getTeacherSettings(): Observable<SessionApiResponse<TeacherSessionSettingsDto>> {
    return this.api.get<SessionApiResponse<TeacherSessionSettingsDto>>('Sessions/teacher/settings');
  }

  /**
   * Update teacher session settings
   * PUT /api/Sessions/teacher/settings
   */
  updateTeacherSettings(dto: UpdateSessionSettingsDto): Observable<SessionApiResponse<TeacherSessionSettingsDto>> {
    return this.api.put<SessionApiResponse<TeacherSessionSettingsDto>>('Sessions/teacher/settings', dto);
  }

  /**
   * Get teacher availability slots
   * GET /api/Sessions/teacher/availability
   */
  getTeacherAvailability(): Observable<SessionApiResponse<TeacherAvailabilityDto[]>> {
    return this.api.get<SessionApiResponse<TeacherAvailabilityDto[]>>('Sessions/teacher/availability');
  }

  /**
   * Add teacher availability slot
   * POST /api/Sessions/teacher/availability
   */
  addTeacherAvailability(dto: CreateAvailabilityDto): Observable<SessionApiResponse<TeacherAvailabilityDto>> {
    return this.api.post<SessionApiResponse<TeacherAvailabilityDto>>('Sessions/teacher/availability', dto);
  }

  /**
   * Delete teacher availability slot
   * DELETE /api/Sessions/teacher/availability/{id}
   */
  deleteTeacherAvailability(availabilityId: number): Observable<SessionApiResponse<boolean>> {
    return this.api.delete<SessionApiResponse<boolean>>(`Sessions/teacher/availability/${availabilityId}`);
  }

  /**
   * Get teacher upcoming sessions
   * GET /api/Sessions/teacher/upcoming
   */
  getTeacherUpcomingSessions(): Observable<SessionApiResponse<PrivateSessionDto[]>> {
    return this.api.get<SessionApiResponse<PrivateSessionDto[]>>('Sessions/teacher/upcoming');
  }

  /**
   * Get teacher session history
   * GET /api/Sessions/teacher/history
   */
  getTeacherSessionHistory(): Observable<SessionApiResponse<PrivateSessionDto[]>> {
    return this.api.get<SessionApiResponse<PrivateSessionDto[]>>('Sessions/teacher/history');
  }

  /**
   * Update session meeting link (Google Meet)
   * PUT /api/Sessions/{sessionId}/meeting-link
   */
  updateSessionMeetingLink(sessionId: number, meetingLink: string): Observable<SessionApiResponse<boolean>> {
    return this.api.put<SessionApiResponse<boolean>>(`Sessions/${sessionId}/meeting-link`, { meetingLink });
  }

  /**
   * Mark session as completed
   * PUT /api/Sessions/{sessionId}/complete
   */
  markSessionAsCompleted(sessionId: number): Observable<SessionApiResponse<boolean>> {
    return this.api.put<SessionApiResponse<boolean>>(`Sessions/${sessionId}/complete`, {});
  }

  // ============================================
  // Parent Endpoints - لأولياء الأمور
  // ============================================

  /**
   * Get all available teachers for booking
   * GET /api/Sessions/teachers/available
   */
  getAvailableTeachers(): Observable<SessionApiResponse<AvailableTeacherDto[]>> {
    return this.api.get<SessionApiResponse<AvailableTeacherDto[]>>('Sessions/teachers/available');
  }

  /**
   * Get available slots for a specific teacher
   * GET /api/Sessions/teachers/{teacherId}/slots?fromDate={date}&toDate={date}
   */
  getTeacherAvailableSlots(
    teacherId: number,
    fromDate: string,
    toDate: string
  ): Observable<SessionApiResponse<AvailableSlotDto[]>> {
    return this.api.get<SessionApiResponse<AvailableSlotDto[]>>(
      `Sessions/teachers/${teacherId}/slots?fromDate=${fromDate}&toDate=${toDate}`
    );
  }

  /**
   * Book a session with a teacher
   * POST /api/Sessions/book
   */
  bookSession(dto: BookSessionDto): Observable<SessionApiResponse<BookingResponseDto>> {
    return this.api.post<SessionApiResponse<BookingResponseDto>>('Sessions/book', dto);
  }

  /**
   * Get parent bookings
   * GET /api/Sessions/parent/bookings
   */
  getParentBookings(): Observable<SessionApiResponse<PrivateSessionDto[]>> {
    return this.api.get<SessionApiResponse<PrivateSessionDto[]>>('Sessions/parent/bookings');
  }

  /**
   * Cancel a session
   * PUT /api/Sessions/{sessionId}/cancel
   */
  cancelSession(sessionId: number, reason: string): Observable<SessionApiResponse<boolean>> {
    return this.api.put<SessionApiResponse<boolean>>(`Sessions/${sessionId}/cancel`, reason);
  }

  // ============================================
  // Student Endpoints - للطلاب
  // ============================================

  /**
   * Get student upcoming sessions
   * GET /api/Sessions/student/upcoming
   */
  getStudentUpcomingSessions(): Observable<SessionApiResponse<PrivateSessionDto[]>> {
    return this.api.get<SessionApiResponse<PrivateSessionDto[]>>('Sessions/student/upcoming');
  }

  /**
   * Join a session (get session details with Google Meet link)
   * GET /api/Sessions/{sessionId}/join
   */
  joinSession(sessionId: number): Observable<SessionApiResponse<PrivateSessionDto>> {
    return this.api.get<SessionApiResponse<PrivateSessionDto>>(`Sessions/${sessionId}/join`);
  }

  // ============================================
  // Payment Confirmation
  // ============================================

  /**
   * Confirm payment for a session booking
   * POST /api/Sessions/confirm-payment/{stripeSessionId}
   */
  confirmPayment(stripeSessionId: string): Observable<SessionApiResponse<boolean>> {
    return this.api.post<SessionApiResponse<boolean>>(`Sessions/confirm-payment/${stripeSessionId}`, {});
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Format date for API (ISO 8601)
   */
  formatDateForApi(date: Date): string {
    return date.toISOString();
  }

  /**
   * Format time for API (HH:mm:ss)
   */
  formatTimeForApi(hours: number, minutes: number): string {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }

  /**
   * Parse time from API format (HH:mm:ss) to readable format
   */
  parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  /**
   * Check if session is upcoming (not started yet)
   */
  isUpcoming(scheduledDateTime: string): boolean {
    return new Date(scheduledDateTime) > new Date();
  }

  /**
   * Check if session is today
   */
  isToday(scheduledDateTime: string): boolean {
    const sessionDate = new Date(scheduledDateTime);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  }

  /**
   * Get time until session starts (in minutes)
   */
  getMinutesUntilSession(scheduledDateTime: string): number {
    const now = new Date();
    const sessionTime = new Date(scheduledDateTime);
    return Math.floor((sessionTime.getTime() - now.getTime()) / (1000 * 60));
  }

  /**
   * Check if can join session (within 15 minutes before start)
   */
  canJoinSession(scheduledDateTime: string): boolean {
    const minutesUntil = this.getMinutesUntilSession(scheduledDateTime);
    return minutesUntil <= 15 && minutesUntil >= -60; // Can join 15 min before and up to 60 min after
  }

  /**
   * Format session date and time for display
   */
  formatSessionDateTime(dateTime: string): { date: string; time: string; dayOfWeek: string } {
    const dt = new Date(dateTime);
    const date = dt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const time = dt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const dayOfWeek = dt.toLocaleDateString('en-US', { weekday: 'long' });

    return { date, time, dayOfWeek };
  }

  /**
   * Get next 7 days for booking
   */
  getNext7Days(): Date[] {
    const days: Date[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    return days;
  }

  /**
   * Get date range for availability query
   */
  getDateRange(daysAhead: number = 14): { fromDate: string; toDate: string } {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    return {
      fromDate: today.toISOString(),
      toDate: futureDate.toISOString()
    };
  }
}
