/**
 * Interface for Lesson data
 */
export interface Lesson {
  id: number;
  title: string;
  description: string;
  courseId: number;
  courseName: string;
  subjectId: number;
  subjectName: string;
  videoUrl?: string;
  duration: number; // in minutes
  order: number;
  isCompleted: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  term: number;
  week: number;
  thumbnailUrl?: string;
  resources: LessonResource[];
  isLocked: boolean;
  completedAt?: Date;
  lastAccessedAt?: Date;
  prerequisites?: number[]; // lesson IDs that must be completed first
  learningObjectives?: string[]; // learning goals for this lesson
  messages?: LessonMessage[]; // messages between student and teacher
}

/**
 * Interface for messages between student and teacher in a lesson
 */
export interface LessonMessage {
  id: number;
  lessonId: number;
  senderId: number;
  senderName: string;
  senderType: 'student' | 'teacher';
  message: string;
  createdAt: Date;
  isRead: boolean;
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
 * Interface for Lesson Rating - REMOVED as per requirements
 */
// Rating system removed - no longer needed

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
  subjectId?: number;
  term?: number;
  week?: number;
  difficulty?: string;
  isCompleted?: boolean;
}

/**
 * Interface for Student Lesson Statistics
 */
export interface StudentLessonStats {
  completedLessons: number;
  totalLessons: number;
  completionRate: number; // percentage
  totalTimeSpent: number; // in minutes
  currentStreak: number; // consecutive days of study
}
