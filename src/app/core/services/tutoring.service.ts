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
  TutoringPlanDto
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
}
