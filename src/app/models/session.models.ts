/**
 * Session Models and DTOs for Private Sessions (Booking System)
 * Based on API endpoints: /api/Sessions/*
 */

/**
 * Private Session - الحصة الخاصة
 */
export interface PrivateSession {
  id: number;
  teacherId: number;
  teacherName: string;
  studentId: number;
  studentName: string;
  parentId: number;
  parentName: string;
  scheduledDateTime: string; // ISO 8601 format
  durationMinutes: number;
  price: number;
  status: SessionStatus;
  googleMeetLink?: string;
  createdAt: string;
  notes?: string;
  rating?: number;
  feedback?: string;
}

/**
 * Session Status
 */
export enum SessionStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  NoShow = 'NoShow'
}

/**
 * Teacher Session Settings - إعدادات المعلم للحصص الخاصة
 */
export interface TeacherSessionSettings {
  id: number;
  teacherId: number;
  sessionDurationMinutes: number;
  bufferTimeMinutes: number;
  pricePerSession: number;
  isAcceptingBookings: boolean;
  maxSessionsPerDay?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update Session Settings DTO
 */
export interface UpdateSessionSettingsDto {
  sessionDurationMinutes: number;
  bufferTimeMinutes: number;
  pricePerSession: number;
  isAcceptingBookings: boolean;
  maxSessionsPerDay?: number;
  description?: string;
}

/**
 * Teacher Availability - مواعيد المعلم المتاحة
 */
export interface TeacherAvailability {
  id: number;
  teacherId: number;
  dayOfWeek: DayOfWeek;
  startTime: string; // Format: "HH:mm:ss"
  endTime: string;   // Format: "HH:mm:ss"
  isActive: boolean;
}

/**
 * Days of Week
 */
export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6
}

/**
 * Create Availability DTO
 */
export interface CreateAvailabilityDto {
  dayOfWeek: string; // Day name: "Sunday", "Monday", etc.
  startTime: string; // Format: "HH:mm:ss" (TimeSpan format)
  endTime: string;   // Format: "HH:mm:ss" (TimeSpan format)
}

/**
 * Available Teacher - المعلمون المتاحون للحجز
 */
export interface AvailableTeacher {
  teacherId: number;
  teacherName: string;
  email: string;
  subjects: string[];
  pricePerSession: number;
  sessionDurationMinutes: number;
  isAcceptingBookings: boolean;
  description?: string;
  rating?: number;
  totalSessions?: number;
}

/**
 * Available Slot - الأوقات المتاحة للحجز
 */
export interface AvailableSlot {
  dateTime: string; // ISO 8601 format
  isAvailable: boolean;
  reason?: string; // If not available, reason why
}

/**
 * Book Session DTO - لحجز حصة جديدة
 */
export interface BookSessionDto {
  teacherId: number;
  studentId: number;
  scheduledDateTime: string; // ISO 8601 format
  notes?: string;
}

/**
 * Booking Response - رد الحجز
 */
export interface BookingResponse {
  sessionId: number;
  stripeCheckoutUrl: string;
  stripeSessionId: string;
}

/**
 * Session DTOs from API Response
 */
export interface TeacherSessionSettingsDto {
  id: number;
  sessionDurationMinutes: number;
  bufferTimeMinutes: number;
  pricePerSession: number;
  isAcceptingBookings: boolean;
  maxSessionsPerDay?: number;
  description?: string;
}

export interface TeacherAvailabilityDto {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface PrivateSessionDto {
  id: number;
  teacherId: number;
  teacherName: string;
  studentId: number;
  studentName: string;
  parentId: number;
  parentName: string;
  scheduledDateTime: string;
  durationMinutes: number;
  price: number;
  status: string;
  googleMeetLink?: string;
  createdAt: string;
  notes?: string;
  rating?: number;
  feedback?: string;
}

export interface AvailableTeacherDto {
  teacherId: number;
  teacherName: string;
  email: string;
  subjects: string[];
  pricePerSession: number;
  sessionDurationMinutes: number;
  isAcceptingBookings: boolean;
  description?: string;
}

export interface AvailableSlotDto {
  dateTime: string;
  isAvailable: boolean;
  reason?: string;
}

export interface BookingResponseDto {
  sessionId: number;
  stripeCheckoutUrl: string;
  stripeSessionId: string;
}

/**
 * API Response Wrapper
 */
export interface SessionApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Filter and Query Options
 */
export interface SessionFilters {
  status?: SessionStatus;
  fromDate?: string;
  toDate?: string;
  teacherId?: number;
  studentId?: number;
}

/**
 * Session Statistics
 */
export interface SessionStatistics {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  cancelledSessions: number;
  totalRevenue: number;
  averageRating?: number;
}

/**
 * Exception Day - أيام الإجازات والاستثناءات للمعلم
 */
export interface ExceptionDayDto {
  id: number;
  teacherId: number;
  startDate: string;  // ISO date format (YYYY-MM-DD)
  endDate: string;    // ISO date format (YYYY-MM-DD)
  reason?: string;
  createdAt: string;
}

/**
 * Create Exception DTO
 */
export interface CreateExceptionDto {
  startDate: string;  // ISO date format (YYYY-MM-DD)
  endDate?: string;   // Optional - defaults to startDate if not provided
  reason?: string;
}

