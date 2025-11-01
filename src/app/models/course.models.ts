/**
 * Course Models
 * Import SubscriptionPlanSummary from subject.models.ts
 */
import { SubscriptionPlanSummary } from './subject.models';

/**
 * Interface for Course data
 */
export interface Course {
  id: number;
  yearId: number;
  subjectNameId: number;
  subjectName: string;
  categoryId: number;
  categoryName: string;
  categoryDescription: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  posterUrl: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  weekNumber: number;
  termNumber: number;
  studentCount: number;
  termIds: number[];
  weekIds: number[];

  // Subscription Plans (required for cart functionality)
  subscriptionPlans?: SubscriptionPlanSummary[];

  // Legacy fields for backwards compatibility
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  instructor?: string;
  rating?: number;
  studentsCount?: number;
  isEnrolled?: boolean;
  tags?: string[];
  week?: number;
  term?: number;
  subject?: string;
}

/**
 * Interface for Course Filter options
 */
export interface CourseFilter {
  term?: number;
  subject?: string;
  category?: string;
  level?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  // New fields for API compatibility
  yearId?: number;
  subjectNameId?: number;
  categoryId?: number;
  termIds?: number[];
  weekIds?: number[];
}

/**
 * Interface for Course Enrollment
 */
export interface CourseEnrollment {
  courseId: number;
  studentId: number;
  enrollmentDate: Date;
  progress: number;
  status: 'active' | 'completed' | 'paused';
}

/**
 * Interface for Course Category
 */
export interface CourseCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

/**
 * Interface for Shopping Cart Item
 */
export interface CartItem {
  // Legacy support for old structure
  course?: Course;
  quantity: number;
  addedDate?: Date;
  selectedPlan?: {
    id: number;
    name: string;
    price: number;
    duration: number;
    features: string[];
  };
  _backendData?: {
    cartItemId: number;
    subscriptionPlanId: number;
    studentId: number;
  };

  // ✅ NEW FIELDS from backend (preferred structure)
  cartItemId?: number;
  subscriptionPlanId?: number;
  planName?: string;
  studentId?: number;
  price?: number;

  // Subject/Year/Term identifiers
  subjectId?: number;
  subjectName?: string;
  yearId?: number;
  yearNumber?: number;
  termId?: number;
  termNumber?: number;
  planType?: string;
}

/**
 * Interface for Cart management
 */
export interface Cart {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}
