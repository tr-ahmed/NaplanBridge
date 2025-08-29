import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Subject } from '../../models/course.models';

@Injectable({
  providedIn: 'root'
})
export class SubjectsService {

  private mockSubjects: Subject[] = [
    {
      id: 1,
      name: 'الرياضيات',
      description: 'تعلم أساسيات الرياضيات والجبر والهندسة',
      imageUrl: '/assets/img/subjects/math.jpg',
      color: '#3B82F6',
      totalLessons: 24,
      completedLessons: 8,
      lastLessonId: 8,
      progressPercentage: 33,
      isEnrolled: true,
      enrollmentDate: new Date('2024-01-15')
    },
    {
      id: 2,
      name: 'العلوم',
      description: 'استكشف عالم الفيزياء والكيمياء والأحياء',
      imageUrl: '/assets/img/subjects/science.jpg',
      color: '#10B981',
      totalLessons: 18,
      completedLessons: 5,
      lastLessonId: 5,
      progressPercentage: 28,
      isEnrolled: true,
      enrollmentDate: new Date('2024-01-10')
    },
    {
      id: 3,
      name: 'اللغة الإنجليزية',
      description: 'طور مهاراتك في القراءة والكتابة والمحادثة',
      imageUrl: '/assets/img/subjects/english.jpg',
      color: '#8B5CF6',
      totalLessons: 30,
      completedLessons: 12,
      lastLessonId: 12,
      progressPercentage: 40,
      isEnrolled: true,
      enrollmentDate: new Date('2024-01-05')
    },
    {
      id: 4,
      name: 'التاريخ',
      description: 'تعرف على تاريخ الحضارات والثقافات',
      imageUrl: '/assets/img/subjects/history.jpg',
      color: '#F59E0B',
      totalLessons: 15,
      completedLessons: 0,
      lastLessonId: undefined,
      progressPercentage: 0,
      isEnrolled: true,
      enrollmentDate: new Date('2024-02-01')
    }
  ];

  constructor() { }

  /**
   * Get all enrolled subjects for a student
   */
  getEnrolledSubjects(studentId: number): Observable<Subject[]> {
    return of(this.mockSubjects.filter(subject => subject.isEnrolled));
  }

  /**
   * Get a specific subject by ID
   */
  getSubjectById(id: number): Observable<Subject | undefined> {
    return of(this.mockSubjects.find(subject => subject.id === id));
  }

  /**
   * Update subject progress
   */
  updateSubjectProgress(subjectId: number, completedLessons: number, lastLessonId: number): Observable<void> {
    const subject = this.mockSubjects.find(s => s.id === subjectId);
    if (subject) {
      subject.completedLessons = completedLessons;
      subject.lastLessonId = lastLessonId;
      subject.progressPercentage = Math.round((completedLessons / subject.totalLessons) * 100);
    }
    return of();
  }

  /**
   * Get subjects statistics for dashboard
   */
  getSubjectsStats(studentId: number): Observable<{
    totalSubjects: number;
    completedSubjects: number;
    totalLessons: number;
    completedLessons: number;
    overallProgress: number;
  }> {
    const enrolledSubjects = this.mockSubjects.filter(s => s.isEnrolled);
    const totalSubjects = enrolledSubjects.length;
    const completedSubjects = enrolledSubjects.filter(s => s.progressPercentage === 100).length;
    const totalLessons = enrolledSubjects.reduce((sum, s) => sum + s.totalLessons, 0);
    const completedLessons = enrolledSubjects.reduce((sum, s) => sum + s.completedLessons, 0);
    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return of({
      totalSubjects,
      completedSubjects,
      totalLessons,
      completedLessons,
      overallProgress
    });
  }
}
