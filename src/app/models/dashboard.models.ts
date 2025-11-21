/**
 * Dashboard Models
 * Based on Backend API Implementation
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

export interface RecentActivity {
  type: 'ExamTaken' | 'LessonProgress' | 'LessonCompleted' | 'CertificateEarned' | 'AchievementUnlocked' | 'SubscriptionActivated';
  title: string;
  date: string;
  description: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
