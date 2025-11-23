/**
 * Student Details Models
 * For Parent viewing student information
 * Based on Backend API: /api/Parent/student/{studentId}/*
 */

// ============================================
// Main Response Types
// ============================================

export interface StudentDetailsResponse {
  success: boolean;
  data: StudentDetailsForParent;
}

export interface StudentSubscriptionsResponse {
  success: boolean;
  data: StudentSubscriptionsForParent;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    userName: string;
    email: string;
    age: number;
    year: number;
  };
}

export interface StudentProgressBySubjectResponse {
  success: boolean;
  data: StudentProgressBySubject;
}

// ============================================
// Student Details
// ============================================

export interface StudentDetailsForParent {
  student: StudentInfo;
  progress: StudentProgress;
  activeSubscriptions: ActiveSubscription[];
  subjects: SubjectProgress[];
  upcomingExams: UpcomingExam[];
  recentActivities: RecentActivity[];
  stats: StudentStats;
}

export interface StudentInfo {
  id: number;
  userName: string;
  email: string;
  age: number;
  yearId: number;
  yearName: string;
  avatar: string | null;
  createdAt: string;
}

export interface StudentProgress {
  overallProgress: number;
  completedLessons: number;
  totalLessons: number;
  averageScore: number;
  timeSpent: number;
  lastActivityDate: string | null;
}

export interface ActiveSubscription {
  id: number;
  planId: number;
  planName: string;
  planType: string;
  subject: string;
  subjectId: number;
  yearId: number;
  startDate: string;
  expiryDate: string;
  daysRemaining: number;
  isActive: boolean;
  price: number;
}

export interface SubjectProgress {
  subjectId: number;
  subjectName: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  hasActiveSubscription: boolean;
  lastAccessed: string | null;
}

export interface UpcomingExam {
  examId: number;
  title: string;
  subject: string;
  startDate: string;
  duration: number;
  totalMarks: number;
  status: string;
}

export interface RecentActivity {
  id: number;
  type: 'lesson' | 'exam';
  description: string;
  subject: string;
  date: string;
  progress: number;
  score: number | null;
}

export interface StudentStats {
  totalTimeSpent: number;
  averageScore: number;
  completionRate: number;
  strongestSubject: string;
  weakestSubject: string;
  totalExamsTaken: number;
  totalExamsPassed: number;
}

// ============================================
// Subscriptions
// ============================================

export interface StudentSubscriptionsForParent {
  active: SubscriptionDetail[];
  expired: SubscriptionDetail[];
  totalActive: number;
  totalExpired: number;
  totalSpent: number;
}

export interface SubscriptionDetail {
  id: number;
  planId: number;
  planName: string;
  planType: string;
  subject: string;
  subjectId: number;
  yearId: number;
  startDate: string;
  expiryDate: string;
  daysRemaining: number | null;
  isActive: boolean;
  price: number;
  coverage: string | null;
  autoRenew: boolean;
}

// ============================================
// Profile Update
// ============================================

export interface UpdateStudentProfileRequest {
  userName?: string;
  email?: string;
  age?: number;
  yearId?: number;
}

// ============================================
// Subject Progress
// ============================================

export interface StudentProgressBySubject {
  subjectId: number;
  subjectName: string;
  yearId: number;
  overallProgress: number;
  lessons: LessonProgress[];
  exams: ExamResult[];
  stats: SubjectStats;
}

export interface LessonProgress {
  lessonId: number;
  lessonName: string;
  progress: number;
  completed: boolean;
  score: number | null;
  timeSpent: number;
  lastAccessed: string | null;
}

export interface ExamResult {
  examId: number;
  examTitle: string;
  score: number | null;
  maxScore: number;
  percentage: number | null;
  takenAt: string | null;
  passed: boolean;
}

export interface SubjectStats {
  completedLessons: number;
  totalLessons: number;
  averageScore: number;
  totalTimeSpent: number;
  lastActivityDate: string | null;
}
