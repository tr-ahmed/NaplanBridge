/**
 * Interface for Course data
 */
export interface Course {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  instructor: string;
  rating: number;
  studentsCount: number;
  isEnrolled?: boolean;
  tags: string[];
  week?: number;
  term?: number;
  subject?: string;
}

/**
 * Interface for Subject data
 */
export interface Subject {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  color: string;
  totalLessons: number;
  completedLessons: number;
  lastLessonId?: number;
  progressPercentage: number;
  isEnrolled: boolean;
  enrollmentDate?: Date;
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
  course: Course;
  quantity: number;
  addedDate: Date;
}

/**
 * Interface for Cart management
 */
export interface Cart {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}
