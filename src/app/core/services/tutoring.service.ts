import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TimeSlot,
  GetTimeSlotsRequest,
  CalculateTutoringPriceRequest,
  TutoringPriceResponse,
  CreateTutoringOrderRequest,
  CreateTutoringOrderResponse,
  BookingConfirmationDto,
  TutoringPlanDto,
  TutoringSessionDto
} from '../../models/tutoring.models';

@Injectable({
  providedIn: 'root'
})
export class TutoringService {
  private apiUrl = `${environment.apiBaseUrl}/Tutoring`;

  constructor(private http: HttpClient) {}

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
   * Calculate tutoring price with all discounts
   */
  calculatePrice(request: CalculateTutoringPriceRequest): Observable<TutoringPriceResponse> {
    return this.http.post<TutoringPriceResponse>(`${this.apiUrl}/calculate-price`, request);
  }

  /**
   * Create tutoring order and get Stripe checkout URL
   */
  createOrder(request: CreateTutoringOrderRequest): Observable<CreateTutoringOrderResponse> {
    return this.http.post<CreateTutoringOrderResponse>(`${this.apiUrl}/create-order`, request);
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

  // ==================== TEACHER APIs ====================

  /**
   * Get teacher's tutoring sessions with optional filters
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
}
