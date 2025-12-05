/**
 * Dashboard Models
 * Based on Backend API Implementation - Updated January 30, 2025
 */

export interface ExamHistory {
  examId: number;
  examTitle: string;
  completedDate: string;
  score: number;
  totalMarks: number;
  totalQuestions: number;
  correctAnswers: number;
  status: string;
}

/**
 * Enhanced Recent Activity with Navigation Support
 * Backend: GET /api/Student/{studentId}/recent-activities
 */
export interface RecentActivity {
  id: number;
  type: 'ExamTaken' | 'LessonProgress' | 'LessonCompleted' | 'CertificateEarned' | 'AchievementUnlocked' | 'SubscriptionActivated';
  title: string;
  date: string;
  description: string;
  lessonId?: number;      // For navigation to lesson
  examId?: number;        // For navigation to exam
  subjectId?: number;     // For filtering
  subjectName?: string;   // For display
  progress?: number;      // Lesson progress (0-100)
  score?: number;         // Exam score percentage
  metadata?: ActivityMetadata;
}

export interface ActivityMetadata {
  termId?: number;
  weekId?: number;
}

/**
 * In-Progress Lesson
 * Backend: GET /api/Lessons/student/{studentId}/in-progress
 */
export interface InProgressLesson {
  lessonId: number;
  title: string;
  description: string;
  subjectId: number;
  subjectName?: string;
  termId?: number;
  termNumber?: number;
  weekId?: number;
  weekNumber?: number;
  progress: number;
  lastAccessedAt?: string;
  duration: number;
  timeSpent: number;
  posterUrl?: string;
  videoUrl?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

