// ============================================
// Tutoring System Models
// ============================================

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
  GroupTutoring = 'GroupTutoring'
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
  pricePerSession: number;
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

export interface TutoringSelectionState {
  // Step 1
  teachingType: TeachingType;
  academicYearId?: number | null; // Optional - each student has their own year

  // Step 2
  students: StudentInfo[];

  // Step 3
  studentSubjects: Map<number, Set<number>>; // studentId -> Set of subjectIds

  // Step 4
  studentSubjectPlans: Map<string, TutoringPlan>; // "studentId_subjectId" -> plan

  // Step 5
  studentSubjectTimeSlots: Map<string, number[]>; // "studentId_subjectId" -> timeSlotIds

  // Current step
  currentStep: number;

  // Price calculation
  priceCalculation: TutoringPriceResponse | null;
}
