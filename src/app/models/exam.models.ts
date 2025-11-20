/**
 * Exam System Models
 * Complete models for Admin, Teacher, and Student exam system
 * Based on API Documentation
 */

// ============================================
// ENUMS
// ============================================

export enum ExamType {
  Lesson = 'Lesson',    // Lesson Exam
  Monthly = 'Monthly',   // Monthly Exam
  Term = 'Term',         // Term Exam
  Year = 'Year'          // Annual Exam
}

export enum QuestionType {
  Text = 'Text',                     // Text Question
  MultipleChoice = 'MultipleChoice', // Multiple Choice
  MultipleSelect = 'MultipleSelect', // Multiple Select
  TrueFalse = 'TrueFalse'           // True/False
}

// Legacy support
export type ExamTypeString = 'Lesson' | 'Monthly' | 'Term' | 'Year';
export type QuestionTypeString = 'Text' | 'MultipleChoice' | 'MultipleSelect' | 'TrueFalse';

export const ExamTypes = {
  LESSON: 'Lesson' as ExamTypeString,
  MONTHLY: 'Monthly' as ExamTypeString,
  TERM: 'Term' as ExamTypeString,
  YEAR: 'Year' as ExamTypeString
};

export const QuestionTypes = {
  TEXT: 'Text' as QuestionTypeString,
  MULTIPLE_CHOICE: 'MultipleChoice' as QuestionTypeString,
  MULTIPLE_SELECT: 'MultipleSelect' as QuestionTypeString,
  TRUE_FALSE: 'TrueFalse' as QuestionTypeString
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
