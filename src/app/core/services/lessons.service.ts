import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Lesson, StudentLesson, LessonProgress, LessonFilter, StudentLessonStats } from '../../models/lesson.models';
import { ApiNodes } from '../api/api-nodes';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LessonsService {
  private readonly baseUrl = environment.apiBaseUrl || 'http://localhost:5000';
  private useMock =  environment.useMock || false; // Set to true for development with mock data

  // Loading states
  public loading = signal(false);
  public error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get lessons by subject ID
   */
  getLessonsBySubjectId(subjectId: number): Observable<Lesson[]> {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = ApiNodes.getLessonsBySubjectId;
    const url = `${this.baseUrl}${endpoint.url.replace(':subjectId', subjectId.toString())}`;

    if (this.useMock) {
      return of(this.getMockLessons()).pipe(
        map(lessons => lessons.filter(lesson => (lesson as any).subjectId === subjectId)),
        tap(() => this.loading.set(false))
      );
    }

    return this.http.get<Lesson[]>(url).pipe(
      tap(() => this.loading.set(false)),
      catchError((error: HttpErrorResponse) => {
        console.warn('API call failed, using mock data:', error);
        this.error.set('Failed to load lessons, showing offline data');
        this.loading.set(false);
        return of(this.getMockLessons().filter(lesson => (lesson as any).subjectId === subjectId));
      })
    );
  }

  /**
   * Get all lessons (legacy method for backward compatibility)
   */
  getLessons(filter?: LessonFilter): Observable<Lesson[]> {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = ApiNodes.getAllLessons;
    const url = `${this.baseUrl}${endpoint.url}`;

    if (this.useMock) {
      return of(this.getMockLessons()).pipe(
        map(lessons => this.filterLessons(lessons, filter)),
        tap(() => this.loading.set(false))
      );
    }

    return this.http.get<Lesson[]>(url).pipe(
      map(lessons => this.filterLessons(lessons, filter)),
      tap(() => this.loading.set(false)),
      catchError((error: HttpErrorResponse) => {
        console.warn('API call failed, using mock data:', error);
        this.error.set('Failed to load lessons, showing offline data');
        this.loading.set(false);
        return of(this.filterLessons(this.getMockLessons(), filter));
      })
    );
  }

  /**
   * Get a specific lesson by ID
   */
  getLessonById(id: number): Observable<Lesson | null> {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = ApiNodes.getLessonById;
    const url = `${this.baseUrl}${endpoint.url.replace(':id', id.toString())}`;

    if (this.useMock) {
      const lesson = this.getMockLessons().find(l => l.id === id) || null;
      return of(lesson).pipe(
        tap(() => this.loading.set(false))
      );
    }

    return this.http.get<Lesson>(url).pipe(
      tap(() => this.loading.set(false)),
      catchError((error: HttpErrorResponse) => {
        console.warn('API call failed, using mock data:', error);
        this.error.set('Failed to load lesson details');
        this.loading.set(false);
        const lesson = this.getMockLessons().find(l => l.id === id) || null;
        return of(lesson);
      })
    );
  }

  /**
   * Get student lessons with progress
   */
  getStudentLessons(studentId: number): Observable<StudentLesson[]> {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = ApiNodes.getStudentLessons;
    const url = `${this.baseUrl}${endpoint.url.replace(':studentId', studentId.toString())}`;

    if (this.useMock) {
      return of(this.getMockStudentLessons()).pipe(
        tap(() => this.loading.set(false))
      );
    }

    return this.http.get<StudentLesson[]>(url).pipe(
      tap(() => this.loading.set(false)),
      catchError((error: HttpErrorResponse) => {
        console.warn('API call failed, using mock data:', error);
        this.error.set('Failed to load student lessons');
        this.loading.set(false);
        return of(this.getMockStudentLessons());
      })
    );
  }

  /**
   * Update lesson progress
   * Smart implementation: Creates progress if it doesn't exist (404), then updates
   * Uses: POST /api/Progress/students/{studentId}/lessons/{lessonId} (create)
   *       PUT /api/Progress/students/{studentId}/lessons/{lessonId} (update)
   */
  updateProgress(
    lessonId: number,
    studentId: number,
    progress: number,
    timeSpent: number,
    currentPosition?: number
  ): Observable<boolean> {
    // ✅ Backend expects: progressNumber (not progress), and currentPosition as int
    const progressData = {
      progressNumber: progress,
      timeSpent,
      currentPosition: currentPosition ? Math.floor(currentPosition) : 0
    };

    if (this.useMock) {
      console.log('Mock: Updating progress', progressData);
      return of(true);
    }

    // Build URL for both create and update (same endpoint, different methods)
    const url = `${this.baseUrl}${ApiNodes.updateLessonProgress.url
      .replace(':studentId', studentId.toString())
      .replace(':lessonId', lessonId.toString())}`;

    console.log('📤 Updating progress (PUT):', {
      url,
      method: 'PUT (direct)',
      studentId,
      lessonId,
      data: progressData,
      dataTypes: {
        progressNumber: typeof progressData.progressNumber,
        timeSpent: typeof progressData.timeSpent,
        currentPosition: typeof progressData.currentPosition
      }
    });

    // ✅ Use PUT directly - Backend creates if not exists, updates if exists
    return this.http.put<any>(url, progressData).pipe(
      map(() => {
        console.log('✅ Progress saved successfully');
        return true;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to save progress:', {
          status: error.status,
          statusText: error.statusText,
          url: url,
          error: error.error,
          message: error.message
        });

        if (error.status === 401 || error.status === 403) {
          console.error('❌ Authentication/Authorization error. Check your login status.');
        }

        return of(false);
      })
    );
  }

  /**
   * Mark lesson as completed
   */
  markAsCompleted(lessonId: number, studentId: number): Observable<boolean> {
    return this.updateProgress(lessonId, studentId, 100, 0).pipe(
      tap(() => {
        // Update local mock data if needed
        const mockLessons = this.getMockStudentLessons();
        const lesson = mockLessons.find(sl => sl.lesson.id === lessonId);
        if (lesson) {
          lesson.lesson.isCompleted = true;
          lesson.progress.isCompleted = true;
          lesson.progress.progress = 100;
          lesson.progress.completedAt = new Date();
        }
      })
    );
  }

  /**
   * ✅ NEW: Get lessons by subject with progress (supports guest mode)
   * @param subjectId - Subject ID
   * @param studentId - Optional student ID (omit for guest mode)
   */
  getLessonsBySubjectWithProgress(subjectId: number, studentId?: number): Observable<Lesson[]> {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = ApiNodes.getLessonsBySubjectWithProgress;
    let url = `${this.baseUrl}${endpoint.url.replace(':subjectId', subjectId.toString())}`;

    // ✅ Add studentId to URL only if provided (for authenticated users)
    if (studentId) {
      url = url.replace(':studentId?', studentId.toString());
    } else {
      // Remove optional parameter for guest mode
      url = url.replace('/:studentId?', '');
    }

    console.log('📚 Fetching lessons with progress:', { subjectId, studentId, isGuest: !studentId, url });

    return this.http.get<Lesson[]>(url).pipe(
      tap((lessons) => {
        console.log(`✅ Loaded ${lessons.length} lessons (guest: ${!studentId})`);
        this.loading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to load lessons:', error);
        this.error.set('Failed to load lessons');
        this.loading.set(false);
        return of([]);
      })
    );
  }

  /**
   * ✅ NEW: Get lessons by term with progress (supports guest mode)
   * @param termId - Term ID
   * @param studentId - Optional student ID (omit for guest mode)
   */
  getLessonsByTermWithProgress(termId: number, studentId?: number): Observable<Lesson[]> {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = ApiNodes.getLessonsByTermWithProgress;
    let url = `${this.baseUrl}${endpoint.url.replace(':termId', termId.toString())}`;

    // ✅ Add studentId to URL only if provided
    if (studentId) {
      url = url.replace(':studentId?', studentId.toString());
    } else {
      url = url.replace('/:studentId?', '');
    }

    console.log('📚 Fetching term lessons with progress:', { termId, studentId, isGuest: !studentId, url });

    return this.http.get<Lesson[]>(url).pipe(
      tap((lessons) => {
        console.log(`✅ Loaded ${lessons.length} term lessons (guest: ${!studentId})`);
        this.loading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to load term lessons:', error);
        this.error.set('Failed to load lessons');
        this.loading.set(false);
        return of([]);
      })
    );
  }

  /**
   * ✅ NEW: Get lessons by term number with progress (supports guest mode)
   * @param subjectId - Subject ID
   * @param termNumber - Term number (1-4)
   * @param studentId - Optional student ID (omit for guest mode)
   */
  getLessonsByTermNumberWithProgress(subjectId: number, termNumber: number, studentId?: number): Observable<Lesson[]> {
    this.loading.set(true);
    this.error.set(null);

    // Use the subject endpoint and filter by termNumber in frontend
    const endpoint = ApiNodes.getLessonsBySubjectWithProgress;

    const url = `${this.baseUrl}${endpoint.url.replace(':subjectId', subjectId.toString())}`;

    // Add studentId as query parameter if provided
    const params: any = {};
    if (studentId) {
      params.studentId = studentId.toString();
    }

    console.log('📚 Fetching term number lessons with progress:', {
      subjectId,
      termNumber,
      studentId: studentId || 'guest',
      isGuest: !studentId,
      url,
      params
    });

    return this.http.get<Lesson[]>(url, { params }).pipe(
      map((lessons) => {
        // Filter lessons by termNumber
        const filteredLessons = lessons.filter(lesson => lesson.termNumber === termNumber);
        console.log(`✅ Loaded ${filteredLessons.length} lessons for term ${termNumber} (total: ${lessons.length}, guest: ${!studentId})`);
        return filteredLessons;
      }),
      tap(() => {
        this.loading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to load term number lessons:', error);
        this.error.set('Failed to load lessons');
        this.loading.set(false);
        return of([]);
      })
    );
  }

  /**
   * Rate a lesson
   */
  rateLesson(lessonId: number, rating: number, comment?: string): Observable<boolean> {
    const endpoint = ApiNodes.rateLesson;
    const url = `${this.baseUrl}${endpoint.url.replace(':id', lessonId.toString())}`;

    const ratingData = {
      rating,
      comment
    };

    if (this.useMock) {
      console.log('Mock: Rating lesson', ratingData);
      return of(true);
    }

    return this.http.post<any>(url, ratingData).pipe(
      map(() => true),
      catchError(() => of(true))
    );
  }

  /**
   * Get student statistics
   */
  getStudentStatistics(studentId: number): Observable<StudentLessonStats> {
    const endpoint = ApiNodes.getStudentLessonStats;
    const url = `${this.baseUrl}${endpoint.url.replace(':studentId', studentId.toString())}`;

    if (this.useMock) {
      const mockLessons = this.getMockStudentLessons();
      const stats: StudentLessonStats = {
        completedLessons: mockLessons.filter(sl => sl.lesson.isCompleted).length,
        totalLessons: mockLessons.length,
        completionRate: 0,
        totalTimeSpent: mockLessons.reduce((total, sl) => total + sl.progress.timeSpent, 0),
        averageRating: mockLessons.reduce((total, sl) => total + (sl.lesson.rating || 0), 0) / mockLessons.length,
        currentStreak: 5
      };
      stats.completionRate = (stats.completedLessons / stats.totalLessons) * 100;

      return of(stats);
    }

    return this.http.get<StudentLessonStats>(url).pipe(
      catchError(() => {
        const stats: StudentLessonStats = {
          completedLessons: 0,
          totalLessons: 0,
          completionRate: 0,
          totalTimeSpent: 0,
          averageRating: 0,
          currentStreak: 0
        };
        return of(stats);
      })
    );
  }

  // Private helper methods

  private filterLessons(lessons: Lesson[], filter?: LessonFilter): Lesson[] {
    if (!filter) return lessons;

    return lessons.filter(lesson => {
      // Handle both old and new subject filtering
      if (filter.subject && lesson.subject !== filter.subject) return false;
      if (filter.subjectId && (lesson as any).subjectId !== filter.subjectId) return false;

      // Handle both old and new difficulty filtering
      if (filter.difficulty && lesson.difficulty !== filter.difficulty) return false;

      // Handle completion status
      if (filter.isCompleted !== undefined && lesson.isCompleted !== filter.isCompleted) return false;

      // Handle both old and new term filtering
      if (filter.term && lesson.term !== filter.term) return false;
      if (filter.termId && lesson.termId !== filter.termId) return false;

      // Handle both old and new week filtering
      if (filter.week && lesson.week !== filter.week) return false;
      if (filter.weekId && lesson.weekId !== filter.weekId) return false;

      return true;
    });
  }

  private getMockLessons(): any[] {
    return [
      {
        id: 1,
        title: 'Introduction to Mathematics',
        description: 'Learn the fundamentals of mathematics and basic arithmetic operations',
        posterUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://example.com/video1.mp4',
        weekId: 1,
        termId: 1,
        // Optional fields
        subject: 'Mathematics',
        courseName: 'Basic Mathematics',
        courseId: 1,
        duration: 45,
        difficulty: 'Easy',
        order: 1,
        term: 1,
        week: 1,
        isCompleted: true,
        isLocked: false,
        thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        rating: 4.5,
        totalRatings: 12,
        resources: [
          {
            id: 1,
            name: 'Basic Mathematics Reference',
            type: 'PDF' as any,
            url: '/assets/resources/math-basics.pdf',
            downloadable: true
          } as any,
          {
            id: 2,
            name: 'Mathematics Exercises',
            type: 'Other' as any,
            url: '/student/exercises/1',
            downloadable: false
          } as any
        ],
        prerequisites: [],
        learningObjectives: [
          'Understand basic arithmetic operations',
          'Solve simple mathematical problems'
        ],
        lastAccessedAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        id: 2,
        title: 'English Grammar Basics',
        description: 'Learn fundamental English grammar rules and sentence structure',
        posterUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://example.com/video2.mp4',
        weekId: 2,
        subjectId: 2,
        termId: 1,
        // Optional fields
        subject: 'English',
        courseName: 'Basic English Language',
        courseId: 2,
        duration: 60,
        difficulty: 'Medium',
        order: 2,
        term: 1,
        week: 2,
        isCompleted: false,
        isLocked: false,
        thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        rating: 4.2,
        totalRatings: 8,
        resources: [
          {
            id: 3,
            name: 'English Grammar Book',
            type: 'pdf',
            url: '/assets/resources/english-grammar.pdf',
            downloadable: true
          },
          {
            id: 4,
            name: 'Grammar Quiz',
            type: 'quiz',
            url: '/student/quizzes/1',
            downloadable: false
          }
        ],
        prerequisites: [],
        learningObjectives: [
          'Understand basic grammatical rules',
          'Form grammatically correct sentences'
        ],
        lastAccessedAt: new Date(Date.now() - 172800000) // 2 days ago
      },
      {
        id: 3,
        title: 'Natural Sciences',
        description: 'Explore the world of science and natural phenomena',
        posterUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://example.com/video3.mp4',
        weekId: 3,
        subjectId: 3,
        termId: 1,
        // Optional fields
        subject: 'Science',
        courseName: 'Natural Sciences',
        courseId: 3,
        duration: 50,
        difficulty: 'Medium',
        order: 3,
        term: 1,
        week: 3,
        isCompleted: false,
        isLocked: false,
        thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        rating: 4.7,
        totalRatings: 15,
        resources: [
          {
            id: 5,
            name: 'Natural Sciences Book',
            type: 'pdf',
            url: '/assets/resources/natural-sciences.pdf',
            downloadable: true
          },
          {
            id: 6,
            name: 'Scientific Experiments',
            type: 'exercise',
            url: '/student/experiments/1',
            downloadable: false
          }
        ],
        prerequisites: [],
        learningObjectives: [
          'Understand natural phenomena',
          'Conduct simple scientific experiments'
        ],
        lastAccessedAt: new Date(Date.now() - 259200000) // 3 days ago
      },
      {
        id: 4,
        title: 'History and Geography',
        description: 'Learn about Australian and world history and geography',
        posterUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://example.com/video4.mp4',
        weekId: 4,
        subjectId: 4,
        termId: 1,
        // Optional fields
        subject: 'HASS',
        courseName: 'Social Studies',
        courseId: 4,
        duration: 40,
        difficulty: 'Easy',
        order: 4,
        term: 1,
        week: 4,
        isCompleted: true,
        isLocked: false,
        rating: 4.3,
        totalRatings: 10,
        resources: [
          {
            id: 7,
            name: 'Australian Atlas',
            type: 'pdf',
            url: '/assets/resources/australia-atlas.pdf',
            downloadable: true
          }
        ],
        prerequisites: [],
        learningObjectives: [
          'Know Australian history',
          'Understand Australian geography'
        ],
        lastAccessedAt: new Date(Date.now() - 345600000) // 4 days ago
      },
      {
        id: 5,
        title: 'Advanced Mathematics',
        description: 'Advanced mathematical concepts and basic algebra',
        posterUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://example.com/video5.mp4',
        weekId: 1,
        subjectId: 1,
        termId: 2,
        // Optional fields
        subject: 'Mathematics',
        courseName: 'Advanced Mathematics',
        courseId: 5,
        duration: 70,
        difficulty: 'Hard',
        order: 5,
        term: 2,
        week: 1,
        isCompleted: false,
        isLocked: false,
        rating: 4.6,
        totalRatings: 6,
        resources: [
          {
            id: 8,
            name: 'Algebra Textbook',
            type: 'pdf',
            url: '/assets/resources/algebra.pdf',
            downloadable: true
          },
          {
            id: 9,
            name: 'Algebra Exercises',
            type: 'exercise',
            url: '/student/exercises/2',
            downloadable: false
          }
        ],
        prerequisites: [1],
        learningObjectives: [
          'Understand basic algebra concepts',
          'Solve linear equations'
        ]
      },
      {
        id: 6,
        title: 'Creative Writing',
        description: 'Develop creative writing skills in English',
        posterUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://example.com/video6.mp4',
        weekId: 2,
        subjectId: 2,
        termId: 2,
        // Optional fields
        subject: 'English',
        courseName: 'Creative Writing',
        courseId: 6,
        duration: 55,
        difficulty: 'Hard',
        order: 6,
        term: 2,
        week: 2,
        isCompleted: false,
        isLocked: true,
        rating: 4.8,
        totalRatings: 4,
        resources: [
          {
            id: 10,
            name: 'Creative Writing Guide',
            type: 'pdf',
            url: '/assets/resources/creative-writing.pdf',
            downloadable: true
          }
        ],
        prerequisites: [2],
        learningObjectives: [
          'Write creative texts',
          'Develop personal writing style'
        ]
      }
    ];
  }

  private getMockStudentLessons(): StudentLesson[] {
    const lessons = this.getMockLessons();

    return lessons.map(lesson => ({
      lesson,
      progress: {
        lessonId: lesson.id,
        studentId: 1,
        userId: 1,
        progress: lesson.isCompleted ? 100 : Math.floor(Math.random() * 80),
        timeSpent: Math.floor(Math.random() * 30),
        isCompleted: lesson.isCompleted || false,
        completed: lesson.isCompleted || false,
        attempts: Math.floor(Math.random() * 3) + 1,
        completedAt: lesson.isCompleted ? new Date() : undefined,
        updatedAt: new Date(),
        currentPosition: Math.floor(Math.random() * (lesson.duration || 60) * 60)
      },
      canAccess: !lesson.isLocked,
      nextLesson: undefined,
      previousLesson: undefined
    })) as any;
  }

  /**
   * Get lesson questions (quiz) by lesson ID
   */
  getLessonQuestions(lessonId: number): Observable<any[]> {
    this.loading.set(true);
    this.error.set(null);

    const url = `${this.baseUrl}/LessonQuestions/lesson/${lessonId}`;

    return this.http.get<any[]>(url).pipe(
      tap(() => this.loading.set(false)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading lesson questions:', error);
        this.error.set('Failed to load quiz questions');
        this.loading.set(false);
        return of([]);
      })
    );
  }

  /**
   * Submit answer to a lesson question
   * POST /api/LessonQuestions/answer
   */
  submitQuestionAnswer(questionId: number, selectedOptionIds: number[]): Observable<any> {
    const url = `${this.baseUrl}/LessonQuestions/answer`;

    return this.http.post<any>(url, {
      questionId,
      selectedOptionIds
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error submitting answer:', error);
        return of({ success: false, isCorrect: false, error: error.message });
      })
    );
  }
}
