import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TimeSlot,
  GetTimeSlotsRequest,
  TutoringPriceResponse,
  CreateTutoringOrderRequest,
  CreateTutoringOrderResponse,
  BookingConfirmationDto,
  TutoringPlanDto,
  TutoringSessionDto,
  // New v2.0 imports
  TeachersWithPriorityResponse,
  UpdateTeacherPriorityDto,
  CreateTeacherAvailabilityDto,
  UpdateTeacherAvailabilityDto,
  TeacherAvailabilityResponseDto,
  AvailabilityOperationResponse,
  GetAvailableSlotsRequest,
  SmartSchedulingResponse,
  NewPriceCalculationRequest,
  NewPriceCalculationResponse,
  TeacherSessionsResponse,
  TeacherSessionDetailsDto,
  CancelSessionWithOptionsRequest,
  CancelSessionResponse,
  RescheduleSessionRequest,
  RescheduleSessionResponse,
  AlternativeSlotsResponse,
  // Session Display imports
  SessionFilters,
  StudentSessionsResponse,
  TeacherSessionsResponse2
} from '../../models/tutoring.models';
import { SubjectTermsResponse } from '../../models/term.models';

@Injectable({
  providedIn: 'root'
})
export class TutoringService {
  private apiUrl = `${environment.apiBaseUrl}/Tutoring`;
  private adminUrl = `${environment.apiBaseUrl}/Admin`;
  private teacherUrl = `${environment.apiBaseUrl}/Teacher`;

  constructor(private http: HttpClient) { }

  // ==================== ADMIN APIs - Teacher Priority ====================

  /**
   * Get all teachers with priority (Admin)
   */
  getTeachersWithPriority(
    sortBy: string = 'priority',
    orderBy: string = 'desc',
    page: number = 1,
    pageSize: number = 20
  ): Observable<TeachersWithPriorityResponse> {
    const params = new HttpParams()
      .set('sortBy', sortBy)
      .set('orderBy', orderBy)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<TeachersWithPriorityResponse>(`${this.adminUrl}/Teachers`, { params });
  }

  /**
   * Update teacher priority (Admin)
   */
  updateTeacherPriority(teacherId: number, priority: number): Observable<any> {
    const dto: UpdateTeacherPriorityDto = { priority };
    return this.http.put(`${this.adminUrl}/Teachers/${teacherId}/Priority`, dto);
  }

  /**
   * Get tutoring system statistics (Admin)
   * Endpoint: GET /api/Admin/Tutoring/Stats
   */
  getTutoringStats(): Observable<{
    totalRevenue: number;
    totalOrders: number;
    totalSessions: number;
    completedSessions: number;
    activeStudents: number;
    activeTeachers: number;
    averageOrderValue: number;
  }> {
    return this.http.get<any>(`${this.adminUrl}/Tutoring/Stats`);
  }

  // Update discount settings (Admin)
  updateDiscountSettings(settings: any): Observable<any> {
    return this.http.put<any>(`${this.adminUrl}/Tutoring/DiscountSettings`, settings);
  }

  // ==================== TEACHER APIs - Availability ====================

  /**
   * Create availability slot (Teacher)
   */
  createAvailability(dto: CreateTeacherAvailabilityDto): Observable<AvailabilityOperationResponse> {
    return this.http.post<AvailabilityOperationResponse>(`${this.teacherUrl}/Availability`, dto);
  }

  /**
   * Get teacher's availability slots (Teacher)
   */
  getTeacherAvailability(
    includeInactive: boolean = false,
    dayOfWeek?: number,
    subjectId?: number
  ): Observable<{ data: TeacherAvailabilityResponseDto[] }> {
    let params = new HttpParams().set('includeInactive', includeInactive.toString());
    if (dayOfWeek !== undefined) params = params.set('dayOfWeek', dayOfWeek.toString());
    if (subjectId !== undefined) params = params.set('subjectId', subjectId.toString());

    return this.http.get<{ data: TeacherAvailabilityResponseDto[] }>(`${this.teacherUrl}/Availability`, { params });
  }

  /**
   * Update availability slot (Teacher)
   */
  updateAvailability(id: number, dto: UpdateTeacherAvailabilityDto): Observable<AvailabilityOperationResponse> {
    return this.http.put<AvailabilityOperationResponse>(`${this.teacherUrl}/Availability/${id}`, dto);
  }

  /**
   * Delete availability slot (Teacher)
   */
  deleteAvailability(id: number): Observable<AvailabilityOperationResponse> {
    return this.http.delete<AvailabilityOperationResponse>(`${this.teacherUrl}/Availability/${id}`);
  }

  // ==================== TEACHER APIs - Session Management ====================

  /**
   * Get teacher's sessions with filters (Teacher)
   */
  getTeacherSessionsV2(
    status?: string,
    startDate?: string,
    endDate?: string,
    sessionType?: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Observable<TeacherSessionsResponse> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (status) params = params.set('status', status);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (sessionType) params = params.set('sessionType', sessionType);

    return this.http.get<TeacherSessionsResponse>(`${this.apiUrl}/Teacher/Sessions`, { params });
  }

  /**
   * Cancel session with options (Teacher)
   */
  cancelSessionWithOptions(sessionId: number, dto: CancelSessionWithOptionsRequest): Observable<CancelSessionResponse> {
    return this.http.put<CancelSessionResponse>(`${this.apiUrl}/Teacher/Sessions/${sessionId}/Cancel`, dto);
  }

  /**
   * Reschedule session (Teacher)
   */
  rescheduleSession(sessionId: number, dto: RescheduleSessionRequest): Observable<RescheduleSessionResponse> {
    return this.http.put<RescheduleSessionResponse>(`${this.apiUrl}/Teacher/Sessions/${sessionId}/Reschedule`, dto);
  }

  // ==================== PARENT APIs - Smart Scheduling ====================

  /**
   * Get available slots with smart scheduling (Parent)
   */
  getAvailableSlotsSmart(request: GetAvailableSlotsRequest): Observable<SmartSchedulingResponse> {
    return this.http.post<SmartSchedulingResponse>(`${this.apiUrl}/AvailableSlots`, request);
  }

  /**
   * Calculate price with new discount structure (Parent)
   */
  calculatePriceV2(request: NewPriceCalculationRequest): Observable<NewPriceCalculationResponse> {
    return this.http.post<NewPriceCalculationResponse>(`${this.apiUrl}/CalculatePrice`, request);
  }

  /**
   * Get alternative slots for swapping (Parent)
   * Used when user wants to change a scheduled slot to a different time
   */
  getAlternativeSlots(
    teacherId: number,
    subjectId: number,
    teachingType: string,
    startDate: string,
    endDate: string,
    excludeSlotIds?: number[]
  ): Observable<AlternativeSlotsResponse> {
    let params = new HttpParams()
      .set('teacherId', teacherId.toString())
      .set('subjectId', subjectId.toString())
      .set('teachingType', teachingType)
      .set('startDate', startDate)
      .set('endDate', endDate);

    if (excludeSlotIds && excludeSlotIds.length > 0) {
      excludeSlotIds.forEach(id => {
        params = params.append('excludeSlotIds', id.toString());
      });
    }

    return this.http.get<AlternativeSlotsResponse>(`${this.apiUrl}/AlternativeSlots`, { params });
  }

  /**
   * Get available terms for a subject (Parent)
   * For global subjects: returns requiresTermSelection = false
   * For term-based subjects: returns available terms array
   * Endpoint: GET /api/Tutoring/subjects/{subjectId}/terms
   */
  getSubjectTerms(subjectId: number): Observable<SubjectTermsResponse> {
    return this.http.get<SubjectTermsResponse>(`${this.apiUrl}/subjects/${subjectId}/terms`);
  }

  // ==================== STUDENT APIs - Session Display ====================

  /**
   * Get student's sessions with filters (Student)
   * Endpoint: GET /api/Tutoring/student/sessions
   */
  getStudentSessions(filters?: SessionFilters): Observable<StudentSessionsResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
      params = params.set('pageNumber', (filters.pageNumber || 1).toString());
      params = params.set('pageSize', (filters.pageSize || 10).toString());
    }

    return this.http.get<StudentSessionsResponse>(
      `${this.apiUrl}/student/sessions`,
      { params }
    );
  }

  /**
   * Get teacher's sessions with filters (new format)
   * Endpoint: GET /api/Tutoring/teacher/sessions
   */
  getTeacherSessionsNew(filters?: SessionFilters): Observable<TeacherSessionsResponse2> {
    let params = new HttpParams();

    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
      params = params.set('pageNumber', (filters.pageNumber || 1).toString());
      params = params.set('pageSize', (filters.pageSize || 10).toString());
    }

    return this.http.get<TeacherSessionsResponse2>(
      `${this.apiUrl}/teacher/sessions`,
      { params }
    );
  }

  // ==================== LEGACY APIs (Keep for backward compatibility) ====================

  /**
   * Get available time slots for booking
   */
  getAvailableTimeSlots(request: GetTimeSlotsRequest): Observable<TimeSlot[]> {
    let params = new HttpParams()
      .set('academicYearId', request.academicYearId.toString());

    if (request.subjectId) {
      params = params.set('subjectId', request.subjectId.toString());
    }
    if (request.startDate) {
      params = params.set('startDate', request.startDate);
    }
    if (request.endDate) {
      params = params.set('endDate', request.endDate);
    }
    if (request.teachingType) {
      params = params.set('teachingType', request.teachingType);
    }

    return this.http.get<TimeSlot[]>(`${this.apiUrl}/time-slots`, { params });
  }

  /**
   * Calculate tutoring price (Legacy)
   */
  calculatePrice(request: any): Observable<TutoringPriceResponse> {
    return this.http.post<TutoringPriceResponse>(`${this.apiUrl}/calculate-price`, request);
  }

  /**
   * Create tutoring order and get Stripe checkout URL
   */
  createOrder(request: any): Observable<CreateTutoringOrderResponse> {
    // Use the new V2 endpoint that matches CalculatePrice format
    return this.http.post<CreateTutoringOrderResponse>(`${this.apiUrl}/create-order-v2`, request);
  }

  /**
   * Get booking confirmation details
   */
  getBookingConfirmation(orderId: number): Observable<BookingConfirmationDto> {
    return this.http.get<BookingConfirmationDto>(`${this.apiUrl}/booking/${orderId}`);
  }

  /**
   * Get all active tutoring plans
   */
  getTutoringPlans(): Observable<TutoringPlanDto[]> {
    return this.http.get<TutoringPlanDto[]>(`${this.apiUrl}/plans`);
  }

  // ==================== TEACHER LEGACY APIs ====================

  /**
   * Get teacher's tutoring sessions with optional filters (Legacy)
   */
  getTeacherSessions(status?: string, startDate?: string, endDate?: string): Observable<TutoringSessionDto[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<TutoringSessionDto[]>(`${this.apiUrl}/teacher/sessions`, { params });
  }

  /**
   * Start a tutoring session
   */
  startSession(sessionId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/teacher/session/${sessionId}/start`, {});
  }

  /**
   * Complete a tutoring session
   */
  completeSession(sessionId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/teacher/session/${sessionId}/complete`, {});
  }

  /**
   * Cancel a tutoring session
   */
  cancelSession(sessionId: number, reason?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/teacher/session/${sessionId}/cancel`, { reason });
  }

  /**
   * Update meeting link for a session
   */
  updateMeetingLink(sessionId: number, meetingLink: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/teacher/session/${sessionId}/meeting-link`, { meetingLink });
  }

  /**
   * Update session notes
   */
  updateSessionNotes(sessionId: number, notes: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/teacher/session/${sessionId}/notes`, { notes });
  }

  // ==================== ADMIN APIs ====================

  /**
   * Get admin reports with optional period filter
   */
  getAdminReports(period?: string, startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (period) params = params.set('period', period);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get(`${this.apiUrl}/admin/reports`, { params });
  }

  /**
   * Get all orders with filters
   */
  getAdminOrders(status?: string, searchQuery?: string, pageNumber: number = 1, pageSize: number = 50): Observable<any> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (status) params = params.set('status', status);
    if (searchQuery) params = params.set('searchQuery', searchQuery);

    return this.http.get(`${this.apiUrl}/admin/orders`, { params });
  }

  /**
   * Get top performing teachers
   */
  getTopTeachers(period?: string, top: number = 10): Observable<any> {
    let params = new HttpParams().set('top', top.toString());
    if (period) params = params.set('period', period);

    return this.http.get(`${this.apiUrl}/admin/top-teachers`, { params });
  }

  /**
   * Get popular subjects
   */
  getPopularSubjects(period?: string): Observable<any> {
    let params = new HttpParams();
    if (period) params = params.set('period', period);

    return this.http.get(`${this.apiUrl}/admin/popular-subjects`, { params });
  }

  /**
   * Get all discount settings
   */
  getDiscountSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/discounts`);
  }

  /**
   * Update group discount
   */
  updateGroupDiscount(isActive: boolean, percentage: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/discounts/group`, { isActive, percentage });
  }

  /**
   * Update multiple students discount
   */
  updateStudentsDiscount(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/discounts/students`, settings);
  }

  /**
   * Update multiple subjects discount
   */
  updateSubjectsDiscount(isActive: boolean, percentagePerSubject: number, maxPercentage: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/discounts/subjects`, {
      isActive,
      percentagePerSubject,
      maxPercentage
    });
  }

  /**
   * Update plan discounts
   */
  updatePlanDiscounts(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/discounts/plans`, settings);
  }

  /**
   * Update order status (Admin only)
   */
  updateOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/order/${orderId}/status`, { status });
  }

  // ==================== ADDITIONAL HELPER METHODS ====================

  /**
   * Get available tutors
   */
  getAvailableTutors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/available-tutors`);
  }

  /**
   * Get date range helper
   */
  getDateRange(days: number): { fromDate: string; toDate: string } {
    const today = new Date();
    const toDate = new Date(today);
    toDate.setDate(today.getDate() + days);

    return {
      fromDate: today.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0]
    };
  }

  /**
   * Get tutor available slots
   */
  getTutorAvailableSlots(teacherId: number, fromDate: string, toDate: string): Observable<any> {
    let params = new HttpParams()
      .set('teacherId', teacherId.toString())
      .set('fromDate', fromDate)
      .set('toDate', toDate);

    return this.http.get(`${this.apiUrl}/tutor/available-slots`, { params });
  }

  /**
   * Get next 7 days
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
   * Book a tutoring session
   */
  bookTutoring(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/book`, dto);
  }

  /**
   * Get parent bookings
   */
  getParentBookings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/parent/bookings`);
  }

  /**
   * Check if session is upcoming
   */
  isUpcoming(dateTime: string): boolean {
    const sessionDate = new Date(dateTime);
    const now = new Date();
    return sessionDate > now;
  }

  /**
   * Format session date time
   */
  formatSessionDateTime(dateTime: string): { date: string; time: string; dayOfWeek: string } {
    const dt = new Date(dateTime);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      date: dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      dayOfWeek: daysOfWeek[dt.getDay()]
    };
  }

  /**
   * Get minutes until session
   */
  getMinutesUntilSession(dateTime: string): number {
    const sessionDate = new Date(dateTime);
    const now = new Date();
    const diffMs = sessionDate.getTime() - now.getTime();
    return Math.floor(diffMs / 60000);
  }

  /**
   * Get student upcoming sessions
   */
  getStudentUpcomingSessions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/student/upcoming-sessions`);
  }

  // ==================== ADMIN APIs - Analytics & Reports ====================

  /**
   * Get comprehensive tutoring analytics report
   */
  getTutoringReports(startDate: string, endDate: string, period?: string): Observable<any> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    if (period) {
      params = params.set('period', period);
    }

    return this.http.get(`${this.adminUrl}/Tutoring/Reports`, { params });
  }

  /**
   * Get tutoring summary (quick stats)
   */
  getTutoringSummary(period: string = 'month'): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get(`${this.adminUrl}/Tutoring/Reports/Summary`, { params });
  }

  /**
   * Get revenue breakdown by subject
   */
  getRevenueBySubject(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get(`${this.adminUrl}/Tutoring/Reports/Revenue`, { params });
  }

  /**
   * Get teacher performance metrics
   */
  getTeacherPerformance(startDate: string, endDate: string, sortBy: string = 'revenue', order: string = 'desc'): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('sortBy', sortBy)
      .set('order', order);

    return this.http.get(`${this.adminUrl}/Tutoring/Reports/Teachers`, { params });
  }

  /**
   * Get student engagement analytics
   */
  getStudentEngagement(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get(`${this.adminUrl}/Tutoring/Reports/Students`, { params });
  }

  /**
   * Get booking trends over time
   */
  getBookingTrends(startDate: string, endDate: string, granularity: string = 'day'): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('granularity', granularity);

    return this.http.get(`${this.adminUrl}/Tutoring/Reports/Trends`, { params });
  }

  /**
   * Get cancellation analytics
   */
  getCancellationAnalytics(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get(`${this.adminUrl}/Tutoring/Reports/Cancellations`, { params });
  }

  /**
   * Get peak booking times
   */
  getPeakTimes(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get(`${this.adminUrl}/Tutoring/Reports/PeakTimes`, { params });
  }

  /**
   * Get discount rules configuration
   */
  getDiscountRules(): Observable<any> {
    return this.http.get(`${this.adminUrl}/Tutoring/DiscountRules`);
  }

  /**
   * Update discount rules configuration
   */
  updateDiscountRules(rules: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/Tutoring/DiscountRules`, rules);
  }

  /**
   * Export reports (PDF or Excel)
   */
  exportReports(format: 'pdf' | 'excel', startDate: string, endDate: string, sections?: string): Observable<Blob> {
    let params = new HttpParams()
      .set('format', format)
      .set('startDate', startDate)
      .set('endDate', endDate);

    if (sections) {
      params = params.set('sections', sections);
    }

    return this.http.get(`${this.adminUrl}/Tutoring/Reports/Export`, {
      params,
      responseType: 'blob'
    });
  }

  // ==================== SLOT RESERVATION APIs ====================

  /**
   * Reserve slots temporarily before payment
   */
  reserveSlots(request: {
    slots: Array<{
      availabilityId: number;
      dateTime: string;
      teacherId: number;
      subjectId: number;
      teachingType: string;
    }>;
    expirationMinutes?: number;
  }): Observable<{
    success: boolean;
    sessionToken: string;
    expiresAt: string;
    reservedSlots: Array<{
      reservationId: number;
      availabilityId: number;
      dateTime: string;
      teacherId: number;
      subjectId: number;
    }>;
    failedSlots: any[];
  }> {
    return this.http.post<any>(`${this.apiUrl}/ReserveSlots`, request);
  }

  /**
   * Cancel temporary slot reservations
   */
  cancelReservations(sessionToken: string): Observable<{ success: boolean }> {
    return this.http.post<any>(`${this.apiUrl}/CancelReservations`, { sessionToken });
  }

  /**
   * Extend slot reservations
   */
  extendReservations(sessionToken: string, additionalMinutes: number = 10): Observable<{
    success: boolean;
    newExpiresAt: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/ExtendReservations`, {
      sessionToken,
      additionalMinutes
    });
  }

  /**
   * Check if a specific slot is available
   */
  checkSlotAvailability(teacherId: number, dateTime: string): Observable<{
    isAvailable: boolean;
    teacherId: number;
    dateTime: string;
    reservedBy?: string;
    expiresAt?: string;
  }> {
    const params = new HttpParams()
      .set('teacherId', teacherId.toString())
      .set('dateTime', dateTime);
    return this.http.get<any>(`${this.apiUrl}/CheckSlotAvailability`, { params });
  }
}
