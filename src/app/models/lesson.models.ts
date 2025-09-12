/**
 * Interface for Lesson data
 */
export interface Lesson {
  id: number;
  title: string;
  description: string;
  courseId: number;
  courseName: string;
  videoUrl?: string;
  posterUrl?: string; // Video poster/thumbnail for video player
  duration: number; // in minutes
  order: number;
  isCompleted: boolean;
  rating: number;
  totalRatings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  subject: string;
  term: number;
  week: number;
  thumbnailUrl?: string; // General lesson thumbnail for cards/lists
  resources: LessonResource[];
  isLocked: boolean;
  completedAt?: Date;
  lastAccessedAt?: Date;
  prerequisites?: number[]; // lesson IDs that must be completed first
  learningObjectives?: string[]; // learning goals for this lesson
}

/**
 * Interface for Lesson Resource (PDFs, exercises, etc.)
 */
export interface LessonResource {
  id: number;
  name: string;
  type: 'pdf' | 'exercise' | 'quiz' | 'worksheet';
  url: string;
  downloadable: boolean;
}

/**
 * Interface for Lesson Rating
 */
export interface LessonRating {
  id: number;
  lessonId: number;
  studentId: number;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt: Date;
}

/**
 * Interface for Lesson Progress
 */
export interface LessonProgress {
  lessonId: number;
  studentId: number;
  progress: number; // 0-100 percentage
  timeSpent: number; // in minutes
  currentPosition?: number; // video position in seconds
  isCompleted: boolean;
  completedAt?: Date;
  attempts: number;
}

/**
 * Interface for Student's enrolled lessons with progress
 */
export interface StudentLesson {
  lesson: Lesson;
  progress: LessonProgress;
  canAccess: boolean;
  nextLesson?: Lesson;
  previousLesson?: Lesson;
}

/**
 * Interface for Lesson Filter options
 */
export interface LessonFilter {
  courseId?: number;
  subject?: string;
  term?: number;
  week?: number;
  difficulty?: string;
  isCompleted?: boolean;
  rating?: number;
}

/**
 * Interface for Student Lesson Statistics
 */
export interface StudentLessonStats {
  completedLessons: number;
  totalLessons: number;
  completionRate: number; // percentage
  totalTimeSpent: number; // in minutes
  averageRating: number;
  currentStreak: number; // consecutive days of study
}
