/**
 * Progress and Statistics Models
 * Based on Backend API Documentation
 */

// ============================================
// Student Progress Models
// ============================================

export interface StudentProgress {
  studentId: number;
  studentName: string;

  // Overall Progress
  overallProgress: number; // Percentage (0-100)
  completedLessons: number;
  totalLessons: number;

  // Subject-wise Progress
  subjectProgress: SubjectProgress[];

  // Exam Performance
  averageExamScore: number;
  examsCompleted: number;
  examsPassed: number;
  examsFailed: number;

  // Time Stats
  totalStudyTime: number; // in minutes
  lastActivity?: Date;

  // Achievements
  achievements?: Achievement[];
}

export interface SubjectProgress {
  subjectId: number;
  subjectName: string;
  progress: number; // Percentage (0-100)
  completedLessons: number;
  totalLessons: number;
  completedExams?: number;
  totalExams?: number;
  averageScore?: number;
  lastAccessed?: Date;
}

export interface TermProgress {
  termId: number;
  termNumber: number;
  subjectId: number;
  subjectName: string;
  progress: number; // Percentage (0-100)
  completedLessons: number;
  totalLessons: number;
  completedExams: number;
  totalExams: number;
}

export interface WeekProgress {
  weekId: number;
  weekNumber: number;
  termId: number;
  progress: number; // Percentage (0-100)
  completedLessons: number;
  totalLessons: number;
}

// ============================================
// Lesson Progress Models
// ============================================

export interface LessonProgress {
  id: number;
  lessonId: number;
  studentId: number;

  // Progress
  isStarted: boolean;
  isCompleted: boolean;
  progress: number; // Percentage (0-100)

  // Video Progress
  lastWatchedPosition?: number; // in seconds
  videoDuration?: number;
  watchedPercentage?: number;

  // Quiz/Questions
  questionsAnswered?: number;
  totalQuestions?: number;
  questionsCorrect?: number;

  // Timestamps
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt: Date;

  // Time Spent
  timeSpent?: number; // in minutes
}

export interface UpdateLessonProgressDto {
  lessonId: number;
  progress: number;
  lastWatchedPosition?: number;
  completed?: boolean;
}

// ============================================
// Dashboard Statistics
// ============================================

export interface DashboardStats {
  // For Students
  studentStats?: StudentDashboardStats;

  // For Teachers
  teacherStats?: TeacherDashboardStats;

  // For Parents
  parentStats?: ParentDashboardStats;

  // For Admins
  adminStats?: AdminDashboardStats;
}

export interface StudentDashboardStats {
  totalLessonsCompleted: number;
  totalExamsCompleted: number;
  averageScore: number;
  currentStreak: number; // Days in a row
  totalStudyTime: number; // in minutes
  activeSubscriptions: number;
  upcomingExams: number;
  recentActivities: RecentActivity[];
}

export interface TeacherDashboardStats {
  totalStudents: number;
  totalLessons: number;
  totalExams: number;
  pendingGrading: number;
  averageClassScore: number;
  activeTerms: number;
  recentSubmissions: number;
}

export interface ParentDashboardStats {
  totalStudents: number;
  studentsProgress: StudentProgressSummary[];
  totalActiveSubscriptions: number;
  totalSpent: number;
  upcomingPayments: number;
  recentActivities: RecentActivity[];
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;

  totalSubjects: number;
  totalLessons: number;
  totalExams: number;

  activeSubscriptions: number;
  revenue: RevenueStats;

  recentRegistrations: number;
  systemHealth: 'Healthy' | 'Degraded' | 'Unhealthy';
}

// ============================================
// Supporting Models
// ============================================

export interface StudentProgressSummary {
  studentId: number;
  studentName: string;
  overallProgress: number;
  averageScore: number;
  lastActivity: Date;
  status: 'OnTrack' | 'NeedsAttention' | 'Excellent';
}

export interface RecentActivity {
  id: number;
  type: 'LessonCompleted' | 'ExamTaken' | 'ResourceAccessed' | 'SubscriptionPurchased';
  title: string;
  description?: string;
  timestamp: Date;
  relatedId?: number; // Lesson ID, Exam ID, etc.
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  iconUrl?: string;
  earnedAt: Date;
  type: 'LessonStreak' | 'PerfectScore' | 'AllLessonsCompleted' | 'FastLearner' | 'TopPerformer';
}

export interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  growthRate: number; // Percentage
  topSellingPlans: TopSellingPlan[];
}

export interface TopSellingPlan {
  planId: number;
  planName: string;
  subscriptions: number;
  revenue: number;
}

// ============================================
// Analytics Models
// ============================================

export interface LessonAnalytics {
  lessonId: number;
  lessonTitle: string;

  totalViews: number;
  uniqueStudents: number;
  averageWatchTime: number; // in minutes
  completionRate: number; // Percentage

  averageRating?: number;
  totalRatings?: number;

  popularSections?: VideoSection[];
  dropoffPoints?: VideoSection[];
}

export interface VideoSection {
  startTime: number;
  endTime: number;
  viewCount: number;
  label?: string;
}

export interface ExamAnalytics {
  examId: number;
  examTitle: string;

  totalAttempts: number;
  uniqueStudents: number;
  averageScore: number;
  passRate: number;

  questionPerformance: QuestionPerformance[];
  scoreDistribution: ScoreDistribution[];
  averageTimeSpent: number; // in minutes
}

export interface QuestionPerformance {
  questionId: number;
  questionText: string;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number; // Percentage
}

export interface ScoreDistribution {
  rangeStart: number;
  rangeEnd: number;
  count: number;
  percentage: number;
}

// ============================================
// Reports
// ============================================

export interface ProgressReport {
  studentId: number;
  studentName: string;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };

  summary: {
    totalLessonsCompleted: number;
    totalExamsTaken: number;
    averageScore: number;
    totalStudyTime: number;
  };

  subjectReports: SubjectReport[];
  examResults: ExamResult[];
  recommendations: string[];
}

export interface SubjectReport {
  subjectId: number;
  subjectName: string;
  lessonsCompleted: number;
  examsCompleted: number;
  averageScore: number;
  strengths: string[];
  weaknesses: string[];
}

export interface ExamResult {
  examId: number;
  examTitle: string;
  score: number;
  passed: boolean;
  dateTaken: Date;
  timeSpent: number;
}

// ============================================
// Leaderboard Models
// ============================================

export interface Leaderboard {
  period: 'Daily' | 'Weekly' | 'Monthly' | 'AllTime';
  category: 'OverallScore' | 'LessonsCompleted' | 'ExamsPassed' | 'StudyTime';
  entries: LeaderboardEntry[];
  currentUserRank?: number;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: number;
  studentName: string;
  score: number;
  avatarUrl?: string;
  badge?: string;
}
