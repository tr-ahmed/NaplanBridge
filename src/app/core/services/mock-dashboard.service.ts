/**
 * Mock Data Service for Student Dashboard
 * This service provides mock data until backend endpoints are ready
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MockDashboardService {

  /**
   * Mock Student Dashboard Data
   */
  getMockStudentDashboard(): Observable<any> {
    const mockData = {
      totalLessonsCompleted: 45,
      totalExamsCompleted: 12,
      averageScore: 87,
      activeSubscriptions: 2,
      certificatesEarned: 3,
      upcomingExams: [
        {
          id: 1,
          title: "Mathematics Final Exam",
          date: "2025-11-15T10:00:00",
          duration: 120,
          totalQuestions: 30
        },
        {
          id: 2,
          title: "Reading Comprehension Test",
          date: "2025-11-18T14:00:00",
          duration: 90,
          totalQuestions: 25
        }
      ],
      recentProgress: [
        {
          type: "LessonCompleted",
          title: "Advanced Algebra",
          date: "2025-11-01T09:30:00",
          score: 95
        },
        {
          type: "ExamCompleted",
          title: "Geometry Quiz",
          date: "2025-10-30T11:15:00",
          score: 88
        }
      ],
      achievements: [
        {
          id: 1,
          title: "Fast Learner",
          description: "Completed 5 lessons in one day",
          earnedDate: "2025-10-28T00:00:00",
          icon: "🚀"
        },
        {
          id: 2,
          title: "Quiz Master",
          description: "Scored above 90% in 3 consecutive quizzes",
          earnedDate: "2025-10-25T00:00:00",
          icon: "🏆"
        }
      ]
    };

    return of(mockData).pipe(delay(1000)); // Simulate network delay
  }

  /**
   * Mock Student Progress
   */
  getMockStudentProgress(): Observable<any> {
    const mockProgress = {
      studentId: 1,
      studentName: "John Doe",
      overallProgress: 78,
      completedLessons: 45,
      totalLessons: 58,
      subjectProgress: [
        {
          subjectId: 1,
          subjectName: "Mathematics",
          progress: 85,
          completedLessons: 18,
          totalLessons: 22,
          averageScore: 89
        },
        {
          subjectId: 2,
          subjectName: "Reading",
          progress: 72,
          completedLessons: 15,
          totalLessons: 20,
          averageScore: 84
        },
        {
          subjectId: 3,
          subjectName: "Writing",
          progress: 65,
          completedLessons: 12,
          totalLessons: 16,
          averageScore: 79
        }
      ],
      averageExamScore: 87,
      examsCompleted: 12,
      totalStudyTime: 2450 // minutes
    };

    return of(mockProgress).pipe(delay(800));
  }

  /**
   * Mock Subscriptions Summary
   */
  getMockSubscriptionsSummary(): Observable<any> {
    const mockSubs = [
      {
        id: 1,
        planName: "Mathematics Premium",
        status: "Active",
        startDate: "2025-09-01T00:00:00",
        endDate: "2025-12-01T00:00:00",
        subjectsCount: 1,
        remainingDays: 30
      },
      {
        id: 2,
        planName: "Language Arts Basic",
        status: "Active",
        startDate: "2025-10-01T00:00:00",
        endDate: "2025-11-01T00:00:00",
        subjectsCount: 2,
        remainingDays: 0 // Expired today
      }
    ];

    return of(mockSubs).pipe(delay(600));
  }

  /**
   * Mock Certificates
   */
  getMockCertificates(): Observable<any> {
    const mockCerts = [
      {
        id: 1,
        title: "Mathematics Fundamentals",
        issuedDate: "2025-10-15T00:00:00",
        certificateType: "Completion",
        verificationCode: "CERT-MATH-001",
        downloadUrl: "/certificates/cert-math-001.pdf"
      },
      {
        id: 2,
        title: "Reading Excellence",
        issuedDate: "2025-10-20T00:00:00",
        certificateType: "Achievement",
        verificationCode: "CERT-READ-002",
        downloadUrl: "/certificates/cert-read-002.pdf"
      }
    ];

    return of(mockCerts).pipe(delay(700));
  }

  /**
   * Mock Achievements
   */
  getMockAchievements(): Observable<any> {
    const mockAchievements = [
      {
        id: 1,
        title: "Fast Learner",
        description: "Completed 5 lessons in one day",
        type: "Speed",
        earnedDate: "2025-10-28T00:00:00",
        points: 50,
        icon: "🚀"
      },
      {
        id: 2,
        title: "Perfect Score",
        description: "Achieved 100% in an exam",
        type: "Excellence",
        earnedDate: "2025-10-25T00:00:00",
        points: 100,
        icon: "💯"
      },
      {
        id: 3,
        title: "Consistent Student",
        description: "Studied for 7 consecutive days",
        type: "Consistency",
        earnedDate: "2025-10-22T00:00:00",
        points: 75,
        icon: "📅"
      }
    ];

    return of(mockAchievements).pipe(delay(500));
  }
}
