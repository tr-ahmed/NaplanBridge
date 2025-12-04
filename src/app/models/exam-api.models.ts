/**
 * Exam API Models - New Version
 * Complete models matching the latest backend API
 */

import { ExamType, QuestionType } from './exam.models';

// Re-export for convenience
export { ExamType, QuestionType };

// ============================================
// EXAM DTOs
// ============================================

export interface ExamDto {
  id: number;
  title: string;
  description?: string;
  examType: ExamType;
  subjectId: number;
  subjectName?: string;
  subject?: string;  // ✅ NEW - Subject name in responses
  className?: string;  // ✅ NEW - Class/Year name
  termId?: number | null;
  lessonId?: number | null;
  weekId?: number | null;
  yearId?: number | null;
  durationInMinutes: number;
  totalMarks: number;  // ✅ FIXED - Now returns correct value
  passingMarks: number;
  startTime: string;  // ISO 8601 DateTime
  endTime: string;    // ISO 8601 DateTime
  startDate?: string;  // ✅ NEW - Alternative name from backend
  endDate?: string;    // ✅ NEW - Alternative name from backend
  isPublished: boolean;
  createdAt?: string;
  createdById?: number;
  createdBy?: UserBasicInfo;
  questions?: ExamQuestionDto[];
  // ✅ NEW - Statistics fields
  totalSubmissions?: number;
  pendingGrading?: number;
  averageScore?: number;
}

export interface UserBasicInfo {
  id: number;
  userName: string;
  email: string;
}

export interface ExamQuestionDto {
  id: number;
  questionText: string;
  questionType: QuestionType;
  marks: number;
  order: number;
  isMultipleSelect: boolean;
  options: QuestionOptionDto[];
}

export interface QuestionOptionDto {
  id: number;
  optionText: string;
  isCorrect: boolean;
  order: number;
}

// ============================================
// CREATE/UPDATE DTOs
// ============================================

export interface CreateExamDto {
  title: string;
  description?: string;
  examType: ExamType;
  subjectId: number;
  lessonId?: number | null;
  termId?: number | null;
  weekId?: number | null;
  yearId?: number | null;
  durationInMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startTime: string | null;  // ✅ Can be null for exams without time restrictions
  endTime: string | null;    // ✅ Can be null for exams without time restrictions
  isPublished: boolean;
  questions: CreateQuestionDto[];
}

export interface CreateQuestionDto {
  questionText: string;
  questionType: QuestionType;
  marks: number;
  order: number;
  isMultipleSelect: boolean;
  options: CreateOptionDto[];
}

export interface CreateOptionDto {
  optionText: string;
  isCorrect: boolean;
  order: number;
}

export interface UpdateExamDto {
  title?: string;
  description?: string;
  durationInMinutes?: number;
  totalMarks?: number;
  passingMarks?: number;
  startTime?: string | null;  // ✅ Can be null or undefined
  endTime?: string | null;    // ✅ Can be null or undefined
  isPublished?: boolean;
}

export interface UpdateQuestionDto {
  questionText?: string;
  marks?: number;
  order?: number;
}

// ============================================
// TEACHER DTOs
// ============================================

export interface TeacherExamDto {
  id: number;
  examId?: number; // Legacy support
  title: string;
  description?: string;
  subjectName: string;
  examType: ExamType;
  durationInMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  totalSubmissions: number;
  gradedCount: number;
  pendingGradingCount: number;
  averageScore: number;
  passRate: number;
}

export interface ExamSubmissionDto {
  studentExamId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  startedAt: string;
  submittedAt: string;
  isCompleted: boolean;
  isGraded: boolean;
  totalScore?: number | null;
  totalMarks: number;
  autoGradedScore?: number;
  scorePercentage?: number;
  isPassed?: boolean;
  pendingManualGrading: boolean;
}

export interface SubmissionDetailDto {
  studentExamId: number;
  examId: number;
  examTitle: string;
  studentId: number;
  studentName: string;
  startedAt: string;
  submittedAt: string;
  totalMarks: number;
  currentScore: number;
  passingMarks: number;
  isGraded: boolean;
  questions: SubmissionQuestionDto[];
  generalFeedback?: string | null;
}

export interface SubmissionQuestionDto {
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  marks: number;
  studentAnswer?: string;
  correctAnswer?: string;
  studentSelectedOptions?: string[];
  correctOptions?: string[];
  isCorrect?: boolean | null;
  earnedScore: number;
  teacherFeedback?: string | null;
  requiresManualGrading: boolean;
}

export interface GradeSubmissionDto {
  questionGrades: QuestionGradeDto[];
  generalFeedback?: string;
}

export interface QuestionGradeDto {
  questionId: number;
  score: number;
  feedback?: string;
}

// ============================================
// STUDENT DTOs
// ============================================

export interface UpcomingExamDto {
  id: number;
  title: string;
  description?: string;
  subjectId: number;
  subject: string;           // Backend: "subject" property (Subject name)
  subjectName?: string;      // Alternative property name
  yearId?: number;
  yearNumber?: number;
  startDate: string;         // Backend: "startDate"
  endDate: string;           // Backend: "endDate"
  durationInMinutes: number;
  totalMarks: number;
  passingMarks?: number;
  examType: string | ExamType;  // Backend returns string, frontend uses enum
  isPublished?: boolean;
  isAvailableNow?: boolean;
  remainingTime?: string;
}

// ✅ Updated to match ACTUAL backend response
export interface ExamHistoryDto {
  studentExamId: number;         // ✅ REQUIRED - Primary key for viewing results
  examId: number;
  examTitle: string;
  completedDate: string;        // Backend sends this (not submittedAt)
  score: number;                 // Decimal (0.75 for 75%)
  totalMarks: number;
  totalQuestions: number;
  correctAnswers: number;        // Count of correct questions
  status: string;                // "Completed", "Pending", etc.
}

// ❌ OLD DTO (keeping for reference, but not used)
export interface ExamHistoryDto_OLD {
  studentExamId: number;
  examId: number;
  examTitle: string;
  subjectName: string;
  examType: ExamType;
  startedAt: string;
  submittedAt: string;
  isCompleted: boolean;
  isGraded: boolean;
  totalScore?: number;
  totalMarks: number;
  scorePercentage?: number;
  passingMarks: number;
  isPassed?: boolean;
  grade?: string;
  teacherFeedback?: string;
}

export interface StartExamResponseDto {
  studentExamId: number;
  examId: number;
  examTitle: string;
  title?: string;
  examType?: ExamType;
  durationMinutes?: number;  // Backend field name
  durationInMinutes?: number;  // Frontend compatibility
  startedAt: string;
  endTime: string;
  totalMarks: number;
  totalQuestions?: number;
  message?: string;
  questions?: ExamQuestionDto[];
}

export interface SubmitExamDto {
  studentExamId: number;
  answers: ExamAnswerDto[];
}

export interface ExamAnswerDto {
  examQuestionId: number;
  questionType: QuestionType;
  selectedOptionId?: number;
  selectedOptionIds?: number[];
  answerText?: string;
}

export interface SubmitExamResponseDto {
  studentExamId: number;
  examTitle: string;
  submittedAt: string;
  totalScore?: number;
  totalMarks: number;
  scorePercentage?: number;
  passingMarks: number;
  isPassed?: boolean;
  isAutoGraded: boolean;
  pendingManualGrading: boolean;
  message: string;
  autoGradedQuestions: number;
  manualGradingRequired: number;
}

export interface ExamResultDto {
  studentExamId: number;
  examId: number;
  examTitle: string;
  subjectName: string;
  submittedAt: string;
  gradedAt?: string;
  totalScore: number;
  totalMarks: number;
  scorePercentage: number;
  passingMarks: number;
  isPassed: boolean;
  grade?: string;
  correctAnswersCount: number;
  wrongAnswersCount: number;
  generalFeedback?: string;
  questionResults: QuestionResultDto[];
}

export interface QuestionResultDto {
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  marks: number;
  earnedScore: number;
  studentAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean | null;
  feedback?: string;
}

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UpcomingExamsResponse {
  upcomingCount: number;
  exams: UpcomingExamDto[];
}

// ✅ NEW: Response for /student/{studentId}/all endpoint
export interface AllExamsResponse {
  totalCount: number;
  exams: UpcomingExamDto[];  // Same structure as upcoming exams
}

// ============================================
// ✅ NEW: EXAM RESUME DTOs (v1.1)
// ============================================

/**
 * Response for checking in-progress exam
 * GET /api/Exam/{examId}/check-in-progress
 */
export interface CheckInProgressResponse {
  hasInProgressExam: boolean;
  previousAttemptExpired?: boolean;
  studentExamId?: number;
  examId?: number;
  examTitle?: string;
  startedAt?: string;
  remainingTimeSeconds?: number;
  totalQuestions?: number;
  answeredQuestions?: number;
  questions?: QuestionForStudentDto[];
  savedAnswers?: SavedAnswerDto[];
}

/**
 * Question format for student (without correct answers)
 */
export interface QuestionForStudentDto {
  questionId: number;
  questionText: string;
  marks: number;
  questionType: QuestionType;
  isMultipleSelect: boolean;
  options: OptionForStudentDto[];
}

/**
 * Option format for student (without isCorrect)
 */
export interface OptionForStudentDto {
  optionId: number;
  optionText: string;
}

/**
 * Saved answer format
 */
export interface SavedAnswerDto {
  questionId: number;
  selectedOptionIds?: number[];
  answerText?: string;
}

/**
 * Response for exam status check
 * GET /api/Exam/student-exam/{studentExamId}/status
 */
export interface StudentExamStatusDto {
  studentExamId: number;
  examId: number;
  status: 'NotStarted' | 'InProgress' | 'Completed' | 'Expired';
  canContinue: boolean;
  startedAt: string;
  remainingTimeSeconds: number;
  examData?: ExamDataForResumeDto | null;
  savedAnswers: SavedAnswerDto[];
}

/**
 * Exam data for resume
 */
export interface ExamDataForResumeDto {
  examTitle: string;
  durationInMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  questions: QuestionForStudentDto[];
}

/**
 * Response for saving answers
 * POST /api/Exam/student-exam/{studentExamId}/save-answers
 */
export interface SaveAnswersResponseDto {
  savedAt: string;
  questionsUpdated: number;
  remainingTimeSeconds: number;
}

// ============================================
// UI HELPERS
// ============================================

export const EXAM_TYPE_LABELS: { [key: number]: string } = {
  1: 'Lesson Exam',
  2: 'Monthly Exam',
  3: 'Term Exam',
  4: 'Annual Exam'
};

export const QUESTION_TYPE_LABELS: { [key: number]: string } = {
  1: 'Text Question',
  2: 'Multiple Choice',
  3: 'Multiple Select',
  4: 'True/False'
};

export const EXAM_TYPE_ICONS: { [key: number]: string } = {
  1: 'fa-book-open',
  2: 'fa-calendar-week',
  3: 'fa-calendar-alt',
  4: 'fa-graduation-cap'
};

export const QUESTION_TYPE_ICONS: { [key: number]: string } = {
  1: 'fa-align-left',
  2: 'fa-check-circle',
  3: 'fa-check-square',
  4: 'fa-toggle-on'
};

export function getGradeFromPercentage(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C+';
  if (percentage >= 50) return 'C';
  return 'F';
}

export function getGradeColor(grade?: string): string {
  switch (grade) {
    case 'A': return '#10b981';
    case 'B+': return '#3b82f6';
    case 'B': return '#6366f1';
    case 'C+': return '#f59e0b';
    case 'C': return '#f97316';
    case 'F': return '#ef4444';
    default: return '#6b7280';
  }
}

export function getExamTypeLabel(type: ExamType): string {
  const labels: Record<string, string> = {
    [ExamType.Lesson]: 'Lesson Exam',
    [ExamType.Monthly]: 'Monthly Exam',
    [ExamType.Term]: 'Term Exam',
    [ExamType.Year]: 'Annual Exam'
  };
  return labels[type as string] || 'Exam';
}

export function getQuestionTypeLabel(type: QuestionType): string {
  const labels: Record<string, string> = {
    [QuestionType.Text]: 'Essay Question',
    [QuestionType.MultipleChoice]: 'Multiple Choice',
    [QuestionType.MultipleSelect]: 'Multiple Select',
    [QuestionType.TrueFalse]: 'True/False'
  };
  return labels[type as string] || 'Question';
}

export function getExamTypeIcon(type: ExamType): string {
  const icons: Record<string, string> = {
    [ExamType.Lesson]: 'fa-book',
    [ExamType.Monthly]: 'fa-calendar-alt',
    [ExamType.Term]: 'fa-graduation-cap',
    [ExamType.Year]: 'fa-trophy'
  };
  return icons[type as string] || 'fa-file-alt';
}

export function getQuestionTypeIcon(type: QuestionType): string {
  const icons: Record<string, string> = {
    [QuestionType.Text]: 'fa-align-left',
    [QuestionType.MultipleChoice]: 'fa-list-ul',
    [QuestionType.MultipleSelect]: 'fa-check-square',
    [QuestionType.TrueFalse]: 'fa-question-circle'
  };
  return icons[type as string] || 'fa-question';
}
