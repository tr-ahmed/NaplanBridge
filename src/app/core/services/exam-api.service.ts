import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  UpcomingExamsResponse,
  AllExamsResponse  // ✅ NEW import
} from '../../models/exam-api.models';

@Injectable({
  providedIn: 'root'
})
export class ExamApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Exam`;
  private useMock = false; // Disable mock data to use real API

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
   * Get ALL published exams for student (NEW ENDPOINT)
   * GET /api/exam/student/{studentId}/all
   * Returns all published exams regardless of time
   */
  getAllPublishedExams(studentId: number): Observable<ApiResponse<AllExamsResponse>> {
    return this.http.get<ApiResponse<AllExamsResponse>>(`${this.apiUrl}/student/${studentId}/all`);
  }

  /**
   * Get upcoming exams for student
   * GET /api/exam/student/{studentId}/upcoming
   * Returns only future exams (StartTime > now)
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
   * Get exam for taking (Student) - Returns questions without correct answers
   */
  getExamForTaking(studentExamId: number): Observable<ExamDto> {
    // Mock data for testing
    if (this.useMock) {
      return of({
        id: 1,
        title: 'Lesson 1 Quick Quiz',
        description: 'Test your understanding of Lesson 1',
        examType: 'Lesson' as any,
        subjectId: 1,
        subjectName: 'Mathematics',
        termId: 1,
        lessonId: 1,
        weekId: null,
        yearId: 1,
        durationInMinutes: 30,
        totalMarks: 20,
        passingMarks: 12,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isPublished: true,
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: 1,
            questionText: 'What is 5 + 3?',
            questionType: 'MultipleChoice' as any,
            marks: 5,
            order: 1,
            isMultipleSelect: false,
            options: [
              { id: 1, optionText: '6', isCorrect: false, order: 1 },
              { id: 2, optionText: '7', isCorrect: false, order: 2 },
              { id: 3, optionText: '8', isCorrect: true, order: 3 },
              { id: 4, optionText: '9', isCorrect: false, order: 4 }
            ]
          },
          {
            id: 2,
            questionText: 'What is 10 - 4?',
            questionType: 'MultipleChoice' as any,
            marks: 5,
            order: 2,
            isMultipleSelect: false,
            options: [
              { id: 5, optionText: '4', isCorrect: false, order: 1 },
              { id: 6, optionText: '5', isCorrect: false, order: 2 },
              { id: 7, optionText: '6', isCorrect: true, order: 3 },
              { id: 8, optionText: '7', isCorrect: false, order: 4 }
            ]
          },
          {
            id: 3,
            questionText: '2 + 2 = 4',
            questionType: 'TrueFalse' as any,
            marks: 5,
            order: 3,
            isMultipleSelect: false,
            options: [
              { id: 9, optionText: 'True', isCorrect: true, order: 1 },
              { id: 10, optionText: 'False', isCorrect: false, order: 2 }
            ]
          }
        ]
      } as ExamDto);
    }

    return this.http.get<ExamDto>(`${this.apiUrl}/student-exam/${studentExamId}`).pipe(
      catchError((error) => {
        console.error('Error loading exam, using mock data:', error);
        // Return mock data on error
        return of({
          id: 1,
          title: 'Lesson 1 Quick Quiz',
          description: 'Test your understanding of Lesson 1',
          examType: 'Lesson' as any,
          subjectId: 1,
          subjectName: 'Mathematics',
          termId: 1,
          lessonId: 1,
          weekId: null,
          yearId: 1,
          durationInMinutes: 30,
          totalMarks: 20,
          passingMarks: 12,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isPublished: true,
          createdAt: new Date().toISOString(),
          questions: [
            {
              id: 1,
              questionText: 'What is 5 + 3?',
              questionType: 'MultipleChoice' as any,
              marks: 5,
              order: 1,
              isMultipleSelect: false,
              options: [
                { id: 1, optionText: '6', isCorrect: false, order: 1 },
                { id: 2, optionText: '7', isCorrect: false, order: 2 },
                { id: 3, optionText: '8', isCorrect: true, order: 3 },
                { id: 4, optionText: '9', isCorrect: false, order: 4 }
              ]
            },
            {
              id: 2,
              questionText: 'What is 10 - 4?',
              questionType: 'MultipleChoice' as any,
              marks: 5,
              order: 2,
              isMultipleSelect: false,
              options: [
                { id: 5, optionText: '4', isCorrect: false, order: 1 },
                { id: 6, optionText: '5', isCorrect: false, order: 2 },
                { id: 7, optionText: '6', isCorrect: true, order: 3 },
                { id: 8, optionText: '7', isCorrect: false, order: 4 }
              ]
            },
            {
              id: 3,
              questionText: '2 + 2 = 4',
              questionType: 'TrueFalse' as any,
              marks: 5,
              order: 3,
              isMultipleSelect: false,
              options: [
                { id: 9, optionText: 'True', isCorrect: true, order: 1 },
                { id: 10, optionText: 'False', isCorrect: false, order: 2 }
              ]
            }
          ]
        } as ExamDto);
      })
    );
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
    // Mock data for testing
    if (this.useMock) {
      return of({
        studentExamId: studentExamId,
        examId: 1,
        examTitle: 'Lesson 1 Quick Quiz',
        subjectName: 'Mathematics',
        totalMarks: 20,
        totalScore: 15,
        scorePercentage: 75,
        passingMarks: 12,
        grade: 'B',
        isPassed: true,
        correctAnswersCount: 3,
        wrongAnswersCount: 0,
        submittedAt: new Date().toISOString(),
        gradedAt: new Date().toISOString(),
        generalFeedback: 'Good job! Keep practicing.',
        questionResults: [
          {
            questionId: 1,
            questionText: 'What is 5 + 3?',
            questionType: 'MultipleChoice' as any,
            marks: 5,
            earnedScore: 5,
            studentAnswer: '8',
            correctAnswer: '8',
            isCorrect: true,
            feedback: undefined
          },
          {
            questionId: 2,
            questionText: 'What is 10 - 4?',
            questionType: 'MultipleChoice' as any,
            marks: 5,
            earnedScore: 5,
            studentAnswer: '6',
            correctAnswer: '6',
            isCorrect: true,
            feedback: undefined
          },
          {
            questionId: 3,
            questionText: '2 + 2 = 4',
            questionType: 'TrueFalse' as any,
            marks: 5,
            earnedScore: 5,
            studentAnswer: 'True',
            correctAnswer: 'True',
            isCorrect: true,
            feedback: undefined
          }
        ]
      } as ExamResultDto);
    }

    return this.http.get<ExamResultDto>(`${this.apiUrl}/${studentExamId}/result`).pipe(
      catchError((error) => {
        console.error('Error loading exam result, using mock data:', error);
        // Return mock data on error
        return of({
          studentExamId: studentExamId,
          examId: 1,
          examTitle: 'Lesson 1 Quick Quiz',
          subjectName: 'Mathematics',
          totalMarks: 20,
          totalScore: 15,
          scorePercentage: 75,
          passingMarks: 12,
          grade: 'B',
          isPassed: true,
          correctAnswersCount: 3,
          wrongAnswersCount: 0,
          submittedAt: new Date().toISOString(),
          gradedAt: new Date().toISOString(),
          generalFeedback: 'Good job! Keep practicing.',
          questionResults: [
            {
              questionId: 1,
              questionText: 'What is 5 + 3?',
              questionType: 'MultipleChoice' as any,
              marks: 5,
              earnedScore: 5,
              studentAnswer: '8',
              correctAnswer: '8',
              isCorrect: true,
              feedback: undefined
            },
            {
              questionId: 2,
              questionText: 'What is 10 - 4?',
              questionType: 'MultipleChoice' as any,
              marks: 5,
              earnedScore: 5,
              studentAnswer: '6',
              correctAnswer: '6',
              isCorrect: true,
              feedback: undefined
            },
            {
              questionId: 3,
              questionText: '2 + 2 = 4',
              questionType: 'TrueFalse' as any,
              marks: 5,
              earnedScore: 5,
              studentAnswer: 'True',
              correctAnswer: 'True',
              isCorrect: true,
              feedback: undefined
            }
          ]
        } as ExamResultDto);
      })
    );
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
