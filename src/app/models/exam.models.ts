/**
 * Exam and Assessment Models
 * Based on Backend API Documentation - PAYMENT_EXAMS_UPDATE_REPORT.md
 */

// ============================================
// Exam Types and Question Types
// ============================================

export type ExamType = 'Lesson' | 'Monthly' | 'Term' | 'Year';

export const ExamTypes = {
  LESSON: 'Lesson' as ExamType,    // Quiz after a specific lesson
  MONTHLY: 'Monthly' as ExamType,  // Monthly assessment
  TERM: 'Term' as ExamType,        // Final exam for a term
  YEAR: 'Year' as ExamType         // Annual exam
};

export type QuestionType = 'Text' | 'MultipleChoice' | 'MultipleSelect' | 'TrueFalse';

export const QuestionTypes = {
  TEXT: 'Text' as QuestionType,
  MULTIPLE_CHOICE: 'MultipleChoice' as QuestionType,
  MULTIPLE_SELECT: 'MultipleSelect' as QuestionType,
  TRUE_FALSE: 'TrueFalse' as QuestionType
};

// ============================================
// Exam Models
// ============================================

export interface Exam {
  id: number;
  title: string;
  description?: string;
  examType: ExamType;

  // Relations
  subjectId?: number;
  subjectName?: string;
  termId?: number;
  weekId?: number;
  lessonId?: number;

  // Exam Details
  durationInMinutes: number;
  totalMarks: number;
  passingMarks: number;

  // Schedule
  startTime?: string | Date;
  endTime?: string | Date;

  // Status
  isPublished: boolean;

  // Stats
  questionCount: number;
  attemptCount?: number;
  averageScore?: number;
}

export interface ExamDetails extends Exam {
  questions?: ExamQuestion[];
}

// ============================================
// Exam Question Models
// ============================================

export interface ExamQuestion {
  id: number;
  questionText: string;
  questionType: QuestionType;
  marks: number;
  order: number;

  // Options for MCQ/MultiSelect/TrueFalse
  options?: ExamQuestionOption[];

  // For manual grading
  requiresManualGrading?: boolean;
}

export interface ExamQuestionOption {
  id: number;
  questionId: number;
  optionText: string;
  isCorrect: boolean; // Only visible to teachers/admins
}

// ============================================
// Student Exam Session Models
// ============================================

export interface StudentExamSession {
  studentExamId: number;
  examId: number;
  title: string;
  examType: ExamType;
  startedAt: string | Date;
  durationInMinutes: number;
  questions: ExamQuestionForStudent[];
}

export interface ExamQuestionForStudent {
  id: number;
  questionText: string;
  questionType: QuestionType;
  marks: number;
  order: number;
  options?: ExamQuestionOptionForStudent[]; // Without isCorrect field
}

export interface ExamQuestionOptionForStudent {
  id: number;
  optionText: string;
}

// ============================================
// Exam Submission Models
// ============================================

export interface ExamSubmission {
  studentExamId: number;
  answers: ExamAnswer[];
}

export interface ExamAnswer {
  questionId: number;

  // For MultipleChoice and TrueFalse
  selectedOptionId?: number;

  // For MultipleSelect
  selectedOptionIds?: number[];

  // For Text
  textAnswer?: string;
}

// ============================================
// Exam Result Models
// ============================================

export interface ExamResult {
  studentExamId: number;
  examId: number;
  examTitle: string;
  examType: ExamType;

  // Scores
  totalMarks: number;
  obtainedMarks: number;
  autoGradedMarks: number;
  manualGradingRequired: boolean;
  percentage: number;
  passed: boolean;

  // Timestamps
  submittedAt: string | Date;
  gradedAt?: string | Date;

  // Question-level results
  questions: ExamQuestionResult[];
}

export interface ExamQuestionResult {
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  marks: number;
  obtainedMarks: number | null;
  isCorrect: boolean | null;

  // Answers
  correctAnswer?: string;
  studentAnswer?: string;

  // Manual grading
  requiresManualGrading?: boolean;
  teacherFeedback?: string;
}

// ============================================
// Student Exam History
// ============================================

export interface StudentExamHistory {
  examId: number;
  examTitle: string;
  examType: ExamType;
  attempts: ExamAttempt[];
  bestScore?: number;
  latestScore?: number;
}

export interface ExamAttempt {
  studentExamId: number;
  attemptNumber: number;
  score: number;
  percentage: number;
  passed: boolean;
  submittedAt: string | Date;
  gradedAt?: string | Date;
}

// ============================================
// Create/Update Exam DTOs
// ============================================

export interface CreateExamDto {
  title: string;
  description?: string;
  examType: ExamType;

  subjectId?: number;
  termId?: number;
  weekId?: number;
  lessonId?: number;

  durationInMinutes: number;
  totalMarks: number;
  passingMarks: number;

  startTime?: string;
  endTime?: string;

  questions: CreateExamQuestionDto[];
}

export interface CreateExamQuestionDto {
  questionText: string;
  questionType: QuestionType;
  marks: number;
  order: number;
  options?: CreateExamQuestionOptionDto[];
}

export interface CreateExamQuestionOptionDto {
  optionText: string;
  isCorrect: boolean;
}

export interface UpdateExamDto {
  title?: string;
  description?: string;
  durationInMinutes?: number;
  totalMarks?: number;
  passingMarks?: number;
  startTime?: string;
  endTime?: string;
  isPublished?: boolean;
}

// ============================================
// Teacher Grading Models
// ============================================

export interface GradeTextAnswerDto {
  studentExamId: number;
  questionId: number;
  obtainedMarks: number;
  teacherFeedback?: string;
}

export interface BulkGradeDto {
  grades: GradeTextAnswerDto[];
}

// ============================================
// Exam Statistics (for Teachers/Admins)
// ============================================

export interface ExamStatistics {
  examId: number;
  examTitle: string;

  totalAttempts: number;
  completedAttempts: number;
  pendingGrading: number;

  averageScore: number;
  highestScore: number;
  lowestScore: number;

  passRate: number;

  questionStats: ExamQuestionStatistics[];
}

export interface ExamQuestionStatistics {
  questionId: number;
  questionText: string;
  questionType: QuestionType;

  totalAttempts: number;
  correctAttempts: number;
  averageMarks: number;

  // For MCQ
  optionStats?: OptionStatistics[];
}

export interface OptionStatistics {
  optionId: number;
  optionText: string;
  selectedCount: number;
  percentage: number;
  isCorrect: boolean;
}
