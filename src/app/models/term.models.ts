/**
 * Term Models
 * Based on Backend API Documentation with Term-Level Data
 */

// ============================================
// Term Models
// ============================================

export interface Term {
  id: number;
  subjectId: number;
  subjectName?: string;
  termNumber: number;
  startDate?: string;
  endDate?: string;

  // Term-Level Data (NEW - from TERM_LEVEL_DATA_GUIDE.md)
  price?: number;
  originalPrice?: number;
  discountPercentage?: number;
  posterUrl?: string;
  description?: string;
  durationHours?: number;

  // Instructors (NEW - from TERM_LEVEL_DATA_GUIDE.md)
  instructors?: TermInstructor[];

  // Structure
  weekIds: number[];

  // Stats
  studentsCount: number;
}

export interface TermDetails extends Term {
  weeks?: Week[];
}

// ============================================
// Term Instructor Models (NEW)
// ============================================

export interface TermInstructor {
  id?: number;
  termId: number;
  instructorId: number;
  instructorName?: string;
  name?: string; // Alternative field name
  email?: string;
  instructorEmail?: string; // Alternative field name
  isPrimary: boolean;
  role?: string;
  assignedAt?: string | Date;
}

export interface CreateTermInstructorDto {
  instructorId: number;
  isPrimary: boolean;
}

export interface UpdateTermInstructorDto {
  isPrimary: boolean;
}

export interface TeacherTermInfo {
  termId: number;
  termNumber: number;
  subjectName: string;
  subjectId: number;
  role: string;
  isPrimary: boolean;
  startDate?: string;
  endDate?: string;
  price?: number;
  studentsCount: number;
}

// ============================================
// Week Models
// ============================================

export interface Week {
  id: number;
  termId: number;
  weekNumber: number;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  lessonIds: number[];
}

// ============================================
// Create/Update DTOs
// ============================================

export interface CreateTermDto {
  subjectId: number;
  termNumber: number;
  startDate?: string;
  endDate?: string;
  price?: number;
  originalPrice?: number;
  discountPercentage?: number;
  posterUrl?: string;
  description?: string;
  durationHours?: number;
}

export interface UpdateTermDto {
  termNumber?: number;
  startDate?: string;
  endDate?: string;
  price?: number;
  originalPrice?: number;
  discountPercentage?: number;
  posterUrl?: string;
  description?: string;
  durationHours?: number;
}

export interface CreateWeekDto {
  termId: number;
  weekNumber: number;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateWeekDto {
  weekNumber?: number;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================
// Tutoring Term Selection Models
// ============================================

/**
 * Represents an available term for booking tutoring sessions
 * Used in GET /api/Tutoring/subjects/{subjectId}/terms
 */
export interface AvailableTutoringTerm {
  termId: number;
  termNumber: number;
  termName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isPast: boolean;
  daysRemaining: number;
  weeksRemaining: number;
  availableSlots: number;
}

/**
 * Response from GET /api/Tutoring/subjects/{subjectId}/terms
 * For global subjects: requiresTermSelection = false, availableTerms = null
 * For term-based subjects: requiresTermSelection = true, availableTerms = [...]
 */
export interface SubjectTermsResponse {
  subjectId: number;
  subjectName: string;
  isGlobal: boolean;
  requiresTermSelection: boolean;
  availableTerms: AvailableTutoringTerm[] | null;
}

