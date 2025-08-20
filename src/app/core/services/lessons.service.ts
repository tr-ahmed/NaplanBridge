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
  private useMock = true; // Set to true for development with mock data

  // Loading states
  public loading = signal(false);
  public error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get all lessons
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
   */
  updateProgress(
    lessonId: number,
    studentId: number,
    progress: number,
    timeSpent: number,
    currentPosition?: number
  ): Observable<boolean> {
    const endpoint = ApiNodes.updateLessonProgress;
    const url = `${this.baseUrl}${endpoint.url.replace(':id', lessonId.toString())}`;

    const progressData = {
      studentId,
      progress,
      timeSpent,
      currentPosition
    };

    if (this.useMock) {
      console.log('Mock: Updating progress', progressData);
      return of(true);
    }

    return this.http.put<any>(url, progressData).pipe(
      map(() => true),
      catchError(() => of(true))
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
   * Rate a lesson
   */
  rateLesson(lessonId: number, rating: number, comment?: string): Observable<boolean> {
    const endpoint = ApiNodes.ratLesson;
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
        averageRating: mockLessons.reduce((total, sl) => total + sl.lesson.rating, 0) / mockLessons.length,
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
      if (filter.subject && lesson.subject !== filter.subject) return false;
      if (filter.difficulty && lesson.difficulty !== filter.difficulty) return false;
      if (filter.isCompleted !== undefined && lesson.isCompleted !== filter.isCompleted) return false;
      if (filter.term && lesson.term !== filter.term) return false;
      if (filter.week && lesson.week !== filter.week) return false;
      return true;
    });
  }

  private getMockLessons(): Lesson[] {
    return [
      {
        id: 1,
        title: 'مقدمة في الرياضيات',
        description: 'تعلم أساسيات الرياضيات والعمليات الحسابية الأساسية',
        subject: 'Mathematics',
        courseName: 'الرياضيات الأساسية',
        courseId: 1,
        duration: 45,
        difficulty: 'Easy',
        order: 1,
        term: 1,
        week: 1,
        isCompleted: true,
        isLocked: false,
        thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://example.com/video1.mp4',
        rating: 4.5,
        totalRatings: 12,
        resources: [
          {
            id: 1,
            name: 'مرجع الرياضيات الأساسية',
            type: 'pdf',
            url: '/assets/resources/math-basics.pdf',
            downloadable: true
          },
          {
            id: 2,
            name: 'تمارين الرياضيات',
            type: 'exercise',
            url: '/student/exercises/1',
            downloadable: false
          }
        ],
        prerequisites: [],
        learningObjectives: [
          'فهم العمليات الحسابية الأساسية',
          'حل المسائل الرياضية البسيطة'
        ],
        lastAccessedAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        id: 2,
        title: 'قواعد اللغة الإنجليزية',
        description: 'تعلم قواعد اللغة الإنجليزية الأساسية والنحو',
        subject: 'English',
        courseName: 'اللغة الإنجليزية الأساسية',
        courseId: 2,
        duration: 60,
        difficulty: 'Medium',
        order: 2,
        term: 1,
        week: 2,
        isCompleted: false,
        isLocked: false,
        thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://example.com/video2.mp4',
        rating: 4.2,
        totalRatings: 8,
        resources: [
          {
            id: 3,
            name: 'كتاب قواعد اللغة الإنجليزية',
            type: 'pdf',
            url: '/assets/resources/english-grammar.pdf',
            downloadable: true
          },
          {
            id: 4,
            name: 'اختبار القواعد',
            type: 'quiz',
            url: '/student/quizzes/1',
            downloadable: false
          }
        ],
        prerequisites: [],
        learningObjectives: [
          'فهم القواعد النحوية الأساسية',
          'تكوين جمل صحيحة نحوياً'
        ],
        lastAccessedAt: new Date(Date.now() - 172800000) // 2 days ago
      },
      {
        id: 3,
        title: 'علوم الطبيعة',
        description: 'استكشاف عالم العلوم والظواهر الطبيعية',
        subject: 'Science',
        courseName: 'العلوم الطبيعية',
        courseId: 3,
        duration: 50,
        difficulty: 'Medium',
        order: 3,
        term: 1,
        week: 3,
        isCompleted: false,
        isLocked: false,
        thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://example.com/video3.mp4',
        rating: 4.7,
        totalRatings: 15,
        resources: [
          {
            id: 5,
            name: 'كتاب العلوم الطبيعية',
            type: 'pdf',
            url: '/assets/resources/natural-sciences.pdf',
            downloadable: true
          },
          {
            id: 6,
            name: 'تجارب علمية',
            type: 'exercise',
            url: '/student/experiments/1',
            downloadable: false
          }
        ],
        prerequisites: [],
        learningObjectives: [
          'فهم الظواهر الطبيعية',
          'إجراء تجارب علمية بسيطة'
        ],
        lastAccessedAt: new Date(Date.now() - 259200000) // 3 days ago
      },
      {
        id: 4,
        title: 'التاريخ والجغرافيا',
        description: 'تعلم تاريخ وجغرافية أستراليا والعالم',
        subject: 'HASS',
        courseName: 'الدراسات الاجتماعية',
        courseId: 4,
        duration: 40,
        difficulty: 'Easy',
        order: 4,
        term: 1,
        week: 4,
        isCompleted: true,
        isLocked: false,
        thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://example.com/video4.mp4',
        rating: 4.3,
        totalRatings: 10,
        resources: [
          {
            id: 7,
            name: 'أطلس أستراليا',
            type: 'pdf',
            url: '/assets/resources/australia-atlas.pdf',
            downloadable: true
          }
        ],
        prerequisites: [],
        learningObjectives: [
          'معرفة تاريخ أستراليا',
          'فهم الجغرافيا الأسترالية'
        ],
        lastAccessedAt: new Date(Date.now() - 345600000) // 4 days ago
      },
      {
        id: 5,
        title: 'الرياضيات المتقدمة',
        description: 'مفاهيم رياضية متقدمة والجبر الأساسي',
        subject: 'Mathematics',
        courseName: 'الرياضيات المتقدمة',
        courseId: 5,
        duration: 70,
        difficulty: 'Hard',
        order: 5,
        term: 2,
        week: 1,
        isCompleted: false,
        isLocked: false,
        thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://example.com/video5.mp4',
        rating: 4.6,
        totalRatings: 6,
        resources: [
          {
            id: 8,
            name: 'كتاب الجبر',
            type: 'pdf',
            url: '/assets/resources/algebra.pdf',
            downloadable: true
          },
          {
            id: 9,
            name: 'تمارين الجبر',
            type: 'exercise',
            url: '/student/exercises/2',
            downloadable: false
          }
        ],
        prerequisites: [1],
        learningObjectives: [
          'فهم مفاهيم الجبر الأساسي',
          'حل المعادلات الخطية'
        ]
      },
      {
        id: 6,
        title: 'الكتابة الإبداعية',
        description: 'تطوير مهارات الكتابة الإبداعية باللغة الإنجليزية',
        subject: 'English',
        courseName: 'الكتابة الإبداعية',
        courseId: 6,
        duration: 55,
        difficulty: 'Hard',
        order: 6,
        term: 2,
        week: 2,
        isCompleted: false,
        isLocked: true,
        thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://example.com/video6.mp4',
        rating: 4.8,
        totalRatings: 4,
        resources: [
          {
            id: 10,
            name: 'دليل الكتابة الإبداعية',
            type: 'pdf',
            url: '/assets/resources/creative-writing.pdf',
            downloadable: true
          }
        ],
        prerequisites: [2],
        learningObjectives: [
          'كتابة نصوص إبداعية',
          'تطوير الأسلوب الشخصي في الكتابة'
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
        progress: lesson.isCompleted ? 100 : Math.floor(Math.random() * 80),
        timeSpent: Math.floor(Math.random() * 30),
        isCompleted: lesson.isCompleted,
        attempts: Math.floor(Math.random() * 3) + 1,
        completedAt: lesson.isCompleted ? new Date() : undefined,
        currentPosition: Math.floor(Math.random() * lesson.duration * 60)
      },
      canAccess: !lesson.isLocked,
      nextLesson: undefined,
      previousLesson: undefined
    }));
  }
}
