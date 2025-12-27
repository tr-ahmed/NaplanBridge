// ============================================
// Tutoring System Models - v2.0 Flexible Booking
// ============================================

// ============================================
// Session Filters & Response (Student/Teacher/Parent)
// ============================================

export interface SessionFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  pageNumber?: number;
  pageSize?: number;
}

export interface StudentSessionDto {
  id: number;
  teacherName: string;
  subjectName: string;
  dateTime: string;
  duration: number;
  status: string;
  meetingLink: string | null;
  notes: string | null;
}

export interface StudentSessionsResponse {
  sessions: StudentSessionDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface TeacherSessionDto2 {
  id: number;
  studentName: string;
  subjectName: string;
  teacherName: string;
  dateTime: string;
  duration: number;
  status: string;
  meetingLink: string | null;
  notes: string | null;
}

export interface TeacherSessionsResponse2 {
  sessions: TeacherSessionDto2[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// Enums
export enum TutoringPlan {
  Hours10 = '10hrs',
  Hours20 = '20hrs',
  Hours30 = '30hrs'
}

export enum TutoringOrderStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Confirmed = 'Confirmed',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Refunded = 'Refunded'
}

export enum TutoringSessionStatus {
  Scheduled = 'Scheduled',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Rescheduled = 'Rescheduled',
  NoShow = 'NoShow'
}

export enum TeachingType {
  OneToOne = 'OneToOne',
  GroupTutoring = 'Group'
}

export enum SessionType {
  OneToOne = 'OneToOne',
  Group = 'Group',
  BookingFirst = 'BookingFirst'
}

export type HoursOption = 10 | 20 | 30;

// ============================================
// Pagination
// ============================================

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
}

// ============================================
// Teacher Priority (Admin)
// ============================================

export interface UpdateTeacherPriorityDto {
  priority: number; // 1-10
}

export interface TeacherWithPriorityDto {
  id: number;
  name: string;
  email: string;
  priority: number;
  subjects: string[];
  isActive: boolean;
  totalBookings: number;
  avgRating: number;
}

export interface TeachersWithPriorityResponse {
  data: TeacherWithPriorityDto[];
  pagination: PaginationInfo;
}

// ============================================
// Teacher Availability
// ============================================

export interface CreateTeacherAvailabilityDto {
  dayOfWeek: number; // 0-6
  startTime: string; // "HH:mm:ss"
  endTime: string;
  sessionType: SessionType;
  maxStudents?: number; // 2-10, required for Group
  subjectId?: number;
}

export interface UpdateTeacherAvailabilityDto extends CreateTeacherAvailabilityDto {
  isActive: boolean;
}

export interface UpcomingSessionDto {
  date: string;
  studentCount: number;
  studentNames: string[];
}

export interface TeacherAvailabilityResponseDto {
  id: number;
  teacherId: number;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  maxStudents?: number;
  subjectId?: number;
  subjectName?: string;
  isActive: boolean;
  currentBookings: number;
  upcomingSessions: UpcomingSessionDto[];
  createdAt: string;
}

export interface AvailabilityConflictDto {
  id: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityOperationResponse {
  success: boolean;
  message: string;
  data?: TeacherAvailabilityResponseDto;
  conflicts?: AvailabilityConflictDto[];
  upcomingBookingsCount?: number;
  nextBookingDate?: string;
  wasHardDeleted?: boolean;
}

// ============================================
// Smart Scheduling (Parent)
// ============================================

export interface TimeRangePreference {
  start: string; // "HH:mm:ss"
  end: string;
}

export interface SmartSchedulingSubjectSelection {
  subjectId: number;
  teachingType: TeachingType;
  hours: HoursOption;
  /**
   * Academic Term ID for this specific subject.
   * Required if isGlobal is false.
   * Backend will fetch start/end dates from AcademicTerm table.
   */
  academicTermId?: number | null;
  /**
   * Indicates if this is a global subject (no term required).
   * If true, uses request StartDate/EndDate or auto-calculates.
   * If false, academicTermId is required.
   */
  isGlobal?: boolean;
}

export interface SmartSchedulingStudentSelection {
  studentId: number;
  subjects: SmartSchedulingSubjectSelection[];
}

export interface GetAvailableSlotsRequest {
  studentSelections: SmartSchedulingStudentSelection[];
  /**
   * @deprecated Use academicTermId per subject instead.
   * Fallback dates for global subjects only.
   */
  startDate?: string;
  /**
   * @deprecated Use academicTermId per subject instead.
   * Fallback dates for global subjects only.
   */
  endDate?: string;
  preferredDays?: number[];
  preferredTimeRange?: TimeRangePreference;
}

export interface ScheduledSlotDto {
  dateTime: string;
  dayOfWeek: number;
  isPreferred: boolean;
  availabilityId: number;
  conflictingBookings: number;
}

export interface SubjectScheduleDto {
  studentId: number;
  studentName?: string;
  subjectId: number;
  subjectName: string;
  teachingType: string;
  totalSessions: number;
  /** Number of sessions assigned to this teacher */
  assignedSessions: number;
  slots: ScheduledSlotDto[];
}

export interface ScheduledTeacherDto {
  teacherId: number;
  teacherName: string;
  priority: number;
  rating: number;
  subjectSchedules: SubjectScheduleDto[];
}

export interface RecommendedScheduleDto {
  teachers: ScheduledTeacherDto[];
}

/** Alternative teacher - per subject (not for multiple subjects) */
export interface AlternativeTeacherDto {
  teacherId: number;
  teacherName: string;
  priority: number;
  rating: number;
  /** Subject this teacher can teach */
  subjectId: number;
  subjectName: string;
  availableSlots: number;
}

export interface TeacherAllocation {
  teacherId: number;
  teacherName: string;
  priority: number;
  sessionsAssigned: number;
}

export interface SplitSubjectInfo {
  subjectId: number;
  subjectName: string;
  teacherCount: number;
  reason: string;
  allocations: TeacherAllocation[];
}

export interface SubjectAvailabilityDto {
  subjectId: number;
  subjectName: string;
  teachingType: string;
  studentId?: number;
  studentName?: string;
  requestedSessions: number;
  availableSessions: number;
  shortage: number;
  isFullyCovered: boolean;
  message: string;
}

export interface SchedulingSummaryDto {
  totalSessions: number;
  matchedSessions: number;
  unmatchedSessions: number;
  /** True if all sessions for each subject are with a single teacher */
  consistentTeacherPerSubject: boolean;
  /** Subjects that had to be split between multiple teachers */
  splitSubjects: SplitSubjectInfo[];
  /** Availability status for each subject */
  subjectAvailability?: SubjectAvailabilityDto[];
}

export interface SmartSchedulingResponse {
  recommendedSchedule: RecommendedScheduleDto;
  alternativeTeachers: AlternativeTeacherDto[];
  summary: SchedulingSummaryDto;
}

// ============================================
// New Price Calculation
// ============================================

export interface NewSubjectSelectionDto {
  subjectId: number;
  subjectName: string;
  basePrice: number;
  teachingType: TeachingType;
  hours: HoursOption;
  /**
   * Subject Term ID (from Terms table) - for reference.
   */
  termId?: number | null;
  /**
   * Academic Term ID (from AcademicTerms table).
   * Required for term-based subjects.
   */
  academicTermId?: number | null;
  /**
   * Indicates if this is a global subject (no term required).
   * If true, termId and academicTermId are not needed.
   */
  isGlobal?: boolean;
}

export interface NewStudentSelectionDto {
  studentId: number;
  studentName: string;
  subjects: NewSubjectSelectionDto[];
}

export interface NewPriceCalculationRequest {
  studentSelections: NewStudentSelectionDto[];
  totalStudents?: number; // Used for Multiple Students Discount calculation
}

export interface DiscountDetailDto {
  percentage: number;
  amount: number;
  reason: string;
  basePercentage?: number;
  cappedDueToMaxDiscount?: boolean;
}

export interface SubjectDiscountsDto {
  package: DiscountDetailDto;
  group: DiscountDetailDto;
  multiStudents: DiscountDetailDto;
}

export interface SubjectPriceBreakdownDto {
  subjectId: number;
  subjectName: string;
  hours: number;
  teachingType: string;
  basePrice: number;
  discounts: SubjectDiscountsDto;
  totalDiscount: number;
  finalPrice: number;
  combinedDiscountPercentage: number;
}

export interface StudentPriceBreakdownDto {
  studentId: number;
  studentName: string;
  subjects: SubjectPriceBreakdownDto[];
  studentSubtotal: number;
  studentTotalDiscount: number;
  studentTotal: number;
}

export interface DiscountBreakdownDto {
  packageSavings: number;
  groupSavings: number;
  multiStudentsSavings: number;
  maxDiscountApplied: boolean;
  maxDiscountPercentage: number;
}

export interface NewPriceCalculationResponse {
  students: StudentPriceBreakdownDto[];
  grandTotal: number;
  totalDiscount: number;
  overallDiscountPercentage: number;
  breakdown: DiscountBreakdownDto;
}

// ============================================
// Session Management (Teacher)
// ============================================

export interface TeacherSessionDetailsDto {
  id: number;
  sessionType: string;
  studentId?: number;
  studentIds: number[];
  studentName?: string;
  studentNames: string[];
  subjectId: number;
  subjectName: string;
  dateTime: string;
  duration: number;
  status: string;
  meetingLink?: string;
  studentCount: number;
  maxStudents?: number;
  notes?: string;
}

export interface TeacherSessionsResponse {
  data: TeacherSessionDetailsDto[];
  pagination: PaginationInfo;
}

export interface CancelSessionWithOptionsRequest {
  reason: string;
  notifyStudents: boolean;
  offerReschedule: boolean;
}

export interface CancelSessionResponse {
  success: boolean;
  message: string;
  studentsNotified: boolean;
  refundInitiated: boolean;
}

export interface RescheduleSessionRequest {
  newDateTime: string;
  reason: string;
  notifyStudents: boolean;
}

export interface RescheduleSessionResponse {
  success: boolean;
  message: string;
  newDateTime: string;
  requiresStudentConfirmation: boolean;
}

// ============================================
// Alternative Slots Models (for Swap feature)
// ============================================

export interface AlternativeSlotDto {
  availabilityId: number;
  dateTime: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
  isPreferred: boolean;
  dayName: string;
}

export interface AlternativeSlotsResponse {
  teacherId: number;
  teacherName: string;
  subjectId: number;
  subjectName: string;
  teachingType: string;
  totalAvailableSlots: number;
  alternativeSlots: AlternativeSlotDto[];
}

// ============================================
// Slot Reservation Models (Temporary Booking)
// ============================================

export interface SlotToReserve {
  availabilityId: number;
  dateTime: string;
  teacherId: number;
  subjectId: number;
  teachingType: string;
}

export interface ReserveSlotsRequest {
  slots: SlotToReserve[];
  expirationMinutes?: number; // Default: 15
}

export interface ReservedSlotDto {
  reservationId: number;
  availabilityId: number;
  dateTime: string;
  teacherId: number;
  subjectId: number;
}

export interface ReserveSlotsResponse {
  success: boolean;
  sessionToken: string;
  expiresAt: string;
  reservedSlots: ReservedSlotDto[];
  failedSlots: SlotToReserve[];
}

export interface CancelReservationsRequest {
  sessionToken: string;
}

export interface ExtendReservationsRequest {
  sessionToken: string;
  additionalMinutes?: number; // Default: 10
}

export interface ExtendReservationsResponse {
  success: boolean;
  newExpiresAt: string;
}

export interface CheckSlotAvailabilityResponse {
  isAvailable: boolean;
  teacherId: number;
  dateTime: string;
  reservedBy?: string;
  expiresAt?: string;
}

// ============================================
// Time Slot Models
// ============================================

export interface TimeSlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
  teacherId?: number;
  teacherName?: string;
  maxStudents: number;
  subjectId?: number;
  subjectName?: string;
}

export interface GetTimeSlotsRequest {
  subjectId?: number;
  academicYearId: number;
  startDate?: string;
  endDate?: string;
  teachingType?: TeachingType;
}

// ============================================
// Subject & Student Selection Models
// ============================================

export interface SubjectWithPlan {
  subjectId: number;
  subjectName: string;
  plan: TutoringPlan;
  basePrice: number;
  totalPrice: number;
  selectedTimeSlotIds: number[];
  requiredSlots: number;
}

export interface StudentSubjectSelection {
  studentId: number;
  studentName: string;
  subjects: SubjectWithPlan[];
}

// ============================================
// Price Calculation Models
// ============================================

export interface CalculateTutoringPriceRequest {
  teachingType: TeachingType;
  academicYearId: number;
  studentSelections: StudentSubjectSelection[];
}

export interface SubjectPriceBreakdown {
  subjectName: string;
  plan: string;
  basePrice: number;
  finalPrice: number;
}

export interface StudentPriceBreakdown {
  studentName: string;
  subjects: SubjectPriceBreakdown[];
  studentTotal: number;
}

export interface TutoringPriceResponse {
  basePrice: number;
  groupDiscount: number;
  multipleStudentsDiscount: number;
  multipleSubjectsDiscount: number;
  planDiscount: number;
  totalDiscount: number;
  finalPrice: number;
  breakdown: StudentPriceBreakdown[];
}

// ============================================
// Order Creation Models
// ============================================

export interface CreateTutoringOrderRequest {
  teachingType: TeachingType;
  academicYearId: number;
  termId: number;
  studentSelections: StudentSubjectSelection[];
  totalStudents: number;
  expectedPrice: number;
}

export interface CreateTutoringOrderResponse {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  stripeSessionId: string;
  stripeCheckoutUrl: string;
  confirmationCode: string;
}

// ============================================
// Tutoring Plan Models
// ============================================

export interface TutoringPlanDto {
  id: number;
  name: string;
  hours: number;
  durationWeeks: number;
  discountPercent: number;
  isActive: boolean;
}

// ============================================
// Booking Confirmation Models
// ============================================

export interface TutoringSessionDto {
  id: number;
  studentName: string;
  subjectName: string;
  teacherName: string;
  dateTime: Date;
  duration: number;
  status: TutoringSessionStatus;
  meetingLink?: string;
  notes?: string;
}

export interface StudentBookingInfo {
  studentName: string;
  subjects: {
    subjectName: string;
    plan: string;
    totalSessions: number;
    price: number;
  }[];
}

export interface BookingConfirmationDto {
  orderId: number;
  orderNumber: string;
  confirmationCode: string;
  parentName: string;
  students: StudentBookingInfo[];
  totalAmount: number;
  paymentStatus: string;
  scheduledSessions: TutoringSessionDto[];
}

// ============================================
// Tutoring Session DTO (for Teacher Management)
// ============================================

export interface TutoringSessionDto {
  id: number;
  studentName: string;
  subjectName: string;
  teacherName: string;
  dateTime: Date;
  startTime: string; // Added for display purposes
  duration: number;
  status: TutoringSessionStatus;
  meetingLink?: string;
  notes?: string;
}

// ============================================
// Additional DTOs
// ============================================

export interface AvailableSlotDto {
  dateTime: string;
  isAvailable: boolean;
  teacherId?: number;
  teacherName?: string;
  reason?: string;
}

export interface BookTutoringDto {
  teacherId: number;
  studentId: number;
  scheduledDateTime: string;
  notes?: string;
}

export interface AvailableTutorDto {
  teacherId: number;
  teacherName: string;
  email: string;
  subjects: string[];
  // pricePerSession removed - managed by admin
  sessionDurationMinutes: number;
  isAcceptingBookings: boolean;
  description?: string;
  rating?: number;
  totalSessions?: number;
}

export interface PrivateTutoringDto {
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

// ============================================
// Local State Management Models
// ============================================

export interface StudentInfo {
  id: number;
  name: string;
  academicYearId: number;
  yearNumber: number;
}

export interface SubjectSelection {
  subjectId: number;
  subjectName: string;
  basePrice: number;
  teachingType: TeachingType; // Per subject
  hours: number; // 10, 20, or 30
}

export interface TutoringSelectionState {
  // Step 1: Select Students
  students: StudentInfo[];

  // Step 2: Select Subjects per Student (with multi-subject discount)
  studentSubjects: Map<number, Set<number>>; // studentId -> Set of subjectIds

  // Step 2b: Select Terms for non-global subjects
  subjectTerms: Map<string, number>; // "studentId_subjectId" -> termId
  requiresTermSelection: boolean; // True if any selected subject needs term selection

  // Step 3: Select Teaching Type per Subject
  subjectTeachingTypes: Map<string, TeachingType>; // "studentId_subjectId" -> TeachingType

  // Step 4: Select Hours per Subject
  subjectHours: Map<string, number>; // "studentId_subjectId" -> hours (10/20/30)

  // Step 5: Schedule Sessions
  studentSubjectTimeSlots: Map<string, number[]>; // "studentId_subjectId" -> timeSlotIds

  // Current step
  currentStep: number;

  // Price calculation
  priceCalculation: TutoringPriceResponse | null;

  // Step 5: Slot Reservation Token (for payment)
  reservationSessionToken: string | null;
}

