/**
 * Student Question Models
 * Models for student-to-teacher Q&A system in lessons
 */

/**
 * DTO for creating a new student question
 */
export interface CreateStudentQuestionDto {
  lessonId: number;
  questionText: string; // 10-2000 characters
}

/**
 * DTO for updating an existing unanswered question
 */
export interface UpdateStudentQuestionDto {
  questionText: string; // 10-2000 characters
}

/**
 * DTO for teacher answering a student question
 */
export interface AnswerStudentQuestionDto {
  answerText: string; // 5-5000 characters
}

/**
 * Main student question model
 */
export interface StudentQuestionDto {
  id: number;
  lessonId: number;
  lessonTitle: string;
  studentId: number;
  studentName: string;
  questionText: string;
  answerText: string | null;
  answeredByTeacherId: number | null;
  answeredByTeacherName: string | null;
  createdAt: string; // ISO date string
  answeredAt: string | null; // ISO date string
  isAnswered: boolean;
}

/**
 * Paginated response for teacher questions list
 */
export interface PaginatedQuestionsResponse {
  data: StudentQuestionDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Query filters for fetching questions
 */
export interface StudentQuestionFilters {
  lessonId?: number;
  subjectId?: number;
  termId?: number;
  isAnswered?: boolean;
  page?: number;
  pageSize?: number;
}
