import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ExamDto,
  CreateExamDto,
  UpdateExamDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  TeacherExamDto,
  ExamSubmissionDto,
  SubmissionDetailDto,
  GradeSubmissionDto,
  UpcomingExamDto,
  ExamHistoryDto,
  StartExamResponseDto,
  SubmitExamDto,
  SubmitExamResponseDto,
  ExamResultDto,
  ApiResponse,
  UpcomingExamsResponse
} from '../../models/exam-api.models';

@Injectable({
  providedIn: 'root'
})
export class ExamApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/exam`;

  constructor(private http: HttpClient) {}

  // ============================================
  // ADMIN & TEACHER ENDPOINTS
  // ============================================

  /**
   * Get all exams (Admin, Teacher)
   */
  getAllExams(): Observable<ExamDto[]> {
    return this.http.get<ExamDto[]>(this.apiUrl);
  }

  /**
   * Get exam by ID
   */
  getExamById(examId: number): Observable<ExamDto> {
    return this.http.get<ExamDto>(`${this.apiUrl}/${examId}`);
  }

  /**
   * Create new exam (Admin, Teacher)
   */
  createExam(exam: CreateExamDto): Observable<ExamDto> {
    return this.http.post<ExamDto>(this.apiUrl, exam);
  }

  /**
   * Update exam (Admin, Teacher)
   */
  updateExam(examId: number, exam: UpdateExamDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${examId}`, exam);
  }

  /**
   * Delete exam (Admin, Teacher)
   */
  deleteExam(examId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${examId}`);
  }

  /**
   * Get exams by subject
   */
  getExamsBySubject(subjectId: number): Observable<ExamDto[]> {
    return this.http.get<ExamDto[]>(`${this.apiUrl}/subject/${subjectId}`);
  }

  /**
   * Get exams by term
   */
  getExamsByTerm(termId: number): Observable<ExamDto[]> {
    return this.http.get<ExamDto[]>(`${this.apiUrl}/term/${termId}`);
  }

  /**
   * Get exams by year
   */
  getExamsByYear(yearId: number): Observable<ExamDto[]> {
    return this.http.get<ExamDto[]>(`${this.apiUrl}/year/${yearId}`);
  }

  /**
   * Add question to exam
   */
  addQuestion(examId: number, question: CreateQuestionDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/${examId}/questions`, question);
  }

  /**
   * Update question
   */
  updateQuestion(questionId: number, question: UpdateQuestionDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/questions/${questionId}`, question);
  }

  /**
   * Delete question
   */
  deleteQuestion(questionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/questions/${questionId}`);
  }

  // ============================================
  // TEACHER ENDPOINTS
  // ============================================

  /**
   * Get my exams (Teacher)
   */
  getMyExams(): Observable<ApiResponse<TeacherExamDto[]>> {
    return this.http.get<ApiResponse<TeacherExamDto[]>>(`${this.apiUrl}/my-exams`);
  }

  /**
   * Get exam submissions (Teacher, Admin)
   */
  getExamSubmissions(examId: number): Observable<ApiResponse<ExamSubmissionDto[]>> {
    return this.http.get<ApiResponse<ExamSubmissionDto[]>>(`${this.apiUrl}/${examId}/submissions`);
  }

  /**
   * Get submission details for grading
   */
  getSubmissionDetail(studentExamId: number): Observable<ApiResponse<SubmissionDetailDto>> {
    return this.http.get<ApiResponse<SubmissionDetailDto>>(`${this.apiUrl}/submissions/${studentExamId}`);
  }

  /**
   * Grade submission (Teacher, Admin)
   */
  gradeSubmission(studentExamId: number, grading: GradeSubmissionDto): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/submissions/${studentExamId}/grade`, grading);
  }

  // ============================================
  // STUDENT ENDPOINTS
  // ============================================

  /**
   * Get upcoming exams for student
   */
  getUpcomingExams(studentId: number): Observable<ApiResponse<UpcomingExamsResponse>> {
    return this.http.get<ApiResponse<UpcomingExamsResponse>>(`${this.apiUrl}/student/${studentId}/upcoming`);
  }

  /**
   * Get exam history for student
   */
  getExamHistory(studentId: number): Observable<ApiResponse<ExamHistoryDto[]>> {
    return this.http.get<ApiResponse<ExamHistoryDto[]>>(`${this.apiUrl}/student/${studentId}/history`);
  }

  /**
   * Start exam (Student)
   */
  startExam(examId: number): Observable<StartExamResponseDto> {
    return this.http.post<StartExamResponseDto>(`${this.apiUrl}/${examId}/start`, {});
  }

  /**
   * Submit exam answers (Student)
   */
  submitExam(submission: SubmitExamDto): Observable<SubmitExamResponseDto> {
    return this.http.post<SubmitExamResponseDto>(`${this.apiUrl}/submit`, submission);
  }

  /**
   * Get exam result (Student, Parent, Admin)
   */
  getExamResult(studentExamId: number): Observable<ExamResultDto> {
    return this.http.get<ExamResultDto>(`${this.apiUrl}/${studentExamId}/result`);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Check if exam is available now
   */
  isExamAvailable(exam: ExamDto | UpcomingExamDto): boolean {
    const now = new Date();
    const start = new Date((exam as UpcomingExamDto).startDate || (exam as ExamDto).startTime);
    const end = new Date((exam as UpcomingExamDto).endDate || (exam as ExamDto).endTime);

    return now >= start && now <= end;
  }

  /**
   * Get remaining time for exam
   */
  getRemainingTime(endTime: string): string {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'انتهى';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} يوم`;
    if (hours > 0) return `${hours} ساعة`;
    return `${minutes} دقيقة`;
  }

  /**
   * Calculate auto-graded score
   */
  calculateAutoGrade(questions: any[], answers: any[]): number {
    let score = 0;

    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.examQuestionId);
      if (!question) return;

      // Only auto-grade objective questions
      if (question.questionType === 1) return; // Skip text questions

      // Check answer correctness
      const isCorrect = this.checkAnswer(question, answer);
      if (isCorrect) {
        score += question.marks;
      }
    });

    return score;
  }

  /**
   * Check if answer is correct
   */
  private checkAnswer(question: any, answer: any): boolean {
    switch (question.questionType) {
      case 2: // Multiple Choice
        return question.options.some((opt: any) =>
          opt.id === answer.selectedOptionId && opt.isCorrect
        );

      case 3: // Multiple Select
        const correctIds = question.options
          .filter((opt: any) => opt.isCorrect)
          .map((opt: any) => opt.id)
          .sort();
        const selectedIds = (answer.selectedOptionIds || []).sort();
        return JSON.stringify(correctIds) === JSON.stringify(selectedIds);

      case 4: // True/False
        return question.options.some((opt: any) =>
          opt.id === answer.selectedOptionId && opt.isCorrect
        );

      default:
        return false;
    }
  }
}
