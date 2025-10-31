/**
 * Mock Data Service
 * Provides fallback mock data when API calls fail
 */

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  /**
   * Wrap API call with mock fallback
   */
  withMockFallback<T>(
    apiCall: Observable<T>,
    mockData: T,
    options: { delay?: number; logError?: boolean } = {}
  ): Observable<T> {
    const { delay: mockDelay = 500, logError = true } = options;

    // If mock mode is enabled, return mock data immediately
    if (environment.useMock) {
      console.log('🎭 Using Mock Data (Mock Mode Enabled)');
      return of(mockData).pipe(delay(mockDelay));
    }

    // If mock fallback is disabled, return API call as-is
    if (!environment.enableMockFallback) {
      return apiCall;
    }

    // Return API call with error handling that falls back to mock
    return new Observable<T>(observer => {
      const subscription = apiCall.subscribe({
        next: (data) => {
          console.log('✅ API Call Successful');
          observer.next(data);
          observer.complete();
        },
        error: (error) => {
          if (logError) {
            console.warn('⚠️ API Call Failed, Using Mock Data:', error.message);
          }
          // Fallback to mock data
          of(mockData).pipe(delay(mockDelay)).subscribe({
            next: (data) => {
              observer.next(data);
              observer.complete();
            },
            error: (err) => observer.error(err)
          });
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Get mock user data
   */
  getMockUser(role: string = 'Student') {
    return {
      id: 1,
      userName: 'MockUser',
      email: `mock.${role.toLowerCase()}@example.com`,
      token: 'mock-jwt-token-' + Math.random().toString(36).substr(2, 9),
      roles: [role, 'Member']
    };
  }

  /**
   * Get mock subjects
   */
  getMockSubjects() {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: `Subject ${i + 1}`,
      description: `Description for subject ${i + 1}`,
      categoryId: (i % 3) + 1,
      categoryName: ['Mathematics', 'Science', 'English'][i % 3],
      yearId: ((i % 3) + 7),
      yearName: `Year ${((i % 3) + 7)}`,
      price: 29.99 + (i * 10),
      posterUrl: `https://via.placeholder.com/300x200?text=Subject+${i + 1}`,
      termsCount: 4,
      lessonsCount: 48,
      isActive: true
    }));
  }

  /**
   * Get mock lessons with Bunny.net URLs
   */
  getMockLessons(subjectId: number) {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Lesson ${i + 1}`,
      description: `Description for lesson ${i + 1}`,

      // Bunny.net video URLs (HLS streaming)
      videoProvider: 'BunnyStream',
      videoUrl: `https://vz-9161a4ae-e6d.b-cdn.net/mock-video-${i + 1}/playlist.m3u8`,
      posterUrl: `https://vz-9161a4ae-e6d.b-cdn.net/mock-video-${i + 1}/thumbnail.jpg`,
      bunnyVideoId: `mock-video-${i + 1}`,
      videoDuration: 1800 + (i * 300),

      // Legacy fields for compatibility
      videoId: `mock-video-${i + 1}`,
      duration: 1800 + (i * 300),

      order: i + 1,
      weekId: Math.floor(i / 4) + 1,
      subjectId: subjectId,
      isPublished: true,
      resources: [],
      resourcesUrl: `https://example.com/resources/lesson-${i + 1}.pdf`
    }));
  }

  /**
   * Get mock exams
   */
  getMockExams() {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      title: `Exam ${i + 1}`,
      description: `Description for exam ${i + 1}`,
      examType: ['Lesson', 'Monthly', 'Term', 'Year'][i % 4],
      subjectId: (i % 3) + 1,
      subjectName: ['Algebra', 'Physics', 'English'][i % 3],
      totalMarks: 100,
      passingMarks: 50,
      durationInMinutes: 60 + (i * 15),
      startTime: new Date(2025, 9, 25, 9, 0),
      endTime: new Date(2025, 11, 31, 23, 59),
      isPublished: true,
      allowLateSubmission: i % 2 === 0,
      shuffleQuestions: true,
      showResults: true,
      maxAttempts: 3,
      questionsCount: 20
    }));
  }

  /**
   * Get mock exam questions
   */
  getMockExamQuestions(examId: number) {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      examId: examId,
      questionText: `Question ${i + 1}: Solve the following problem...`,
      questionType: ['Text', 'MultipleChoice', 'MultipleSelect', 'TrueFalse'][i % 4],
      marks: 5 + (i * 2),
      order: i + 1,
      options: i % 4 === 0 ? [] : [
        { id: 1, optionText: 'Option A', isCorrect: i % 4 === 1 },
        { id: 2, optionText: 'Option B', isCorrect: false },
        { id: 3, optionText: 'Option C', isCorrect: i % 4 === 2 },
        { id: 4, optionText: 'Option D', isCorrect: i % 4 === 3 }
      ]
    }));
  }

  /**
   * Get mock subscription plans
   */
  getMockSubscriptionPlans() {
    return Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      name: `Plan ${i + 1}`,
      description: `Description for plan ${i + 1}`,
      planType: ['SingleTerm', 'MultiTerm', 'FullYear', 'SubjectAnnual'][i],
      price: 29.99 + (i * 20),
      durationInDays: 90 * (i + 1),
      subjectId: (i % 3) + 1,
      subjectName: ['Algebra', 'Physics', 'English'][i % 3],
      includedTermIds: i === 1 ? '1,2' : null,
      isActive: true,
      features: [
        'Access to all lessons',
        'Practice exams',
        'Video tutorials',
        '24/7 support'
      ]
    }));
  }

  /**
   * Get mock cart
   */
  getMockCart() {
    return {
      id: 1,
      userId: 1,
      items: [
        {
          id: 1,
          subscriptionPlanId: 1,
          planName: 'Algebra - Term 1',
          price: 29.99,
          quantity: 1,
          subjectName: 'Algebra'
        }
      ],
      totalAmount: 29.99,
      itemCount: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get mock student stats
   */
  getMockStudentStats() {
    return {
      totalLessonsCompleted: 15,
      totalExamsCompleted: 8,
      averageScore: 85.5,
      currentStreak: 5,
      totalStudyHours: 24,
      upcomingExams: 3,
      activeSubscriptions: 2,
      certificates: 1
    };
  }

  /**
   * Get mock teacher stats
   */
  getMockTeacherStats() {
    return {
      totalStudents: 45,
      totalClasses: 6,
      pendingGrading: 12,
      upcomingClasses: 4,
      totalLessons: 120,
      avgClassScore: 78.5,
      completedGradings: 156,
      activeExams: 8
    };
  }

  /**
   * Get mock admin stats
   */
  getMockAdminStats() {
    return {
      totalUsers: 1245,
      activeUsers: 523,
      totalExams: 234,
      revenue: 45280,
      subjects: 12,
      lessons: 456,
      teachers: 45,
      students: 850
    };
  }

  /**
   * Get mock notifications
   */
  getMockNotifications() {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      title: `Notification ${i + 1}`,
      message: `This is notification message ${i + 1}`,
      type: ['info', 'success', 'warning', 'error'][i % 4],
      isRead: i % 2 === 0,
      createdAt: new Date(Date.now() - (i * 3600000)),
      link: i % 2 === 0 ? '/dashboard' : null
    }));
  }

  /**
   * Simulate successful operation
   */
  mockSuccess<T>(data: T, delayMs: number = 500): Observable<T> {
    console.log('✅ Mock Success Operation');
    return of(data).pipe(delay(delayMs));
  }

  /**
   * Simulate failed operation
   */
  mockError(message: string = 'Operation failed', delayMs: number = 500): Observable<never> {
    console.error('❌ Mock Error Operation:', message);
    return throwError(() => new Error(message)).pipe(delay(delayMs));
  }
}
