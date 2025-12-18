/**
 * Subject Models
 * Based on Backend API Documentation
 */

// ============================================
// Subject Models
// ============================================

export interface Subject {
  id: number;
  yearId: number;
  subjectNameId: number;
  subjectName: string;
  categoryId: number;
  categoryName: string;
  categoryDescription?: string;

  // Global subject flag (available to all years)
  isGlobal?: boolean;

  // Pricing
  price: number;
  originalPrice: number;
  discountPercentage: number;

  // Content
  posterUrl?: string;
  level: string;
  duration: number; // Total hours

  // Structure
  weekNumber: number;
  termNumber: number;
  termIds: number[];
  weekIds: number[];

  // Subscription Plans
  subscriptionPlans: SubscriptionPlanSummary[];

  // Stats
  studentCount: number;
}

export interface SubscriptionPlanSummary {
  id: number;
  name: string;
  description: string;
  price: number;
  planType: string;
  isActive: boolean;
}

// ============================================
// Create/Update Subject DTOs
// ============================================

export interface CreateSubjectDto {
  yearId: number;
  subjectNameId: number;
  teacherId: number;
  originalPrice: number;
  discountPercentage: number;
  level: string;
  duration: number;
  posterFile?: File;
}

export interface UpdateSubjectDto {
  yearId?: number;
  subjectNameId?: number;
  teacherId?: number;
  originalPrice?: number;
  discountPercentage?: number;
  level?: string;
  duration?: number;
  posterFile?: File;
}

// ============================================
// Subject Filters
// ============================================

export interface SubjectFilterParams {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  yearId?: number;
  searchTerm?: string;
}

// ============================================
// Subject Enrollment
// ============================================

export interface SubjectEnrollment {
  subjectId: number;
  totalStudents: number;
  activeSubscriptions: number;
  revenueGenerated: number;
}

// ============================================
// Subject Names
// ============================================

export interface SubjectName {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  isGlobal: boolean;
}

export interface CreateSubjectNameDto {
  name: string;
  categoryId: number;
  isGlobal: boolean;
}

export interface UpdateSubjectNameDto {
  name?: string;
  categoryId?: number;
  isGlobal?: boolean;
}
