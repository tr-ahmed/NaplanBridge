/**
 * Student List Enhancement Service
 * Additional features for student management
 */

import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface StudentFilter {
  yearId?: number;
  classId?: number;
  status?: 'active' | 'inactive' | 'all';
  searchTerm?: string;
}

export interface StudentDetails {
  id: number;
  userName: string;
  email: string;
  age: number;
  yearId: number;
  yearName: string;
  avatar?: string;
  enrollmentDate: Date;
  status: 'active' | 'inactive';

  // Performance metrics
  performance: {
    overallProgress: number;
    completedLessons: number;
    totalLessons: number;
    averageExamScore: number;
    examsCompleted: number;
    totalExams: number;
    studyTime: number; // in minutes
    lastActive: Date;
  };

  // Subscription info
  subscription?: {
    planName: string;
    status: string;
    expiryDate: Date;
  };
}

export interface BulkOperation {
  type: 'activate' | 'deactivate' | 'delete' | 'assign-class';
  studentIds: number[];
  value?: any;
}

@Injectable({
  providedIn: 'root'
})
export class StudentListEnhancementService {
  // State
  selectedStudents = signal<number[]>([]);
  filterApplied = signal<StudentFilter>({});

  /**
   * Get filtered students
   */
  getFilteredStudents(filter: StudentFilter): Observable<StudentDetails[]> {
    this.filterApplied.set(filter);

    // Mock data - replace with real API
    const mockStudents: StudentDetails[] = this.getMockStudents();

    let filtered = mockStudents;

    // Apply filters
    if (filter.yearId) {
      filtered = filtered.filter(s => s.yearId === filter.yearId);
    }
    if (filter.status && filter.status !== 'all') {
      filtered = filtered.filter(s => s.status === filter.status);
    }
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.userName.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term)
      );
    }

    return of(filtered).pipe(delay(300));
  }

  /**
   * Get student details
   */
  getStudentDetails(studentId: number): Observable<StudentDetails | null> {
    const students = this.getMockStudents();
    const student = students.find(s => s.id === studentId);
    return of(student || null).pipe(delay(200));
  }

  /**
   * Export students to CSV
   */
  exportToCSV(students: StudentDetails[]): void {
    const headers = [
      'ID', 'Username', 'Email', 'Age', 'Year', 'Status',
      'Enrollment Date', 'Progress %', 'Avg Score', 'Study Time (hrs)'
    ];

    const rows = students.map(student => [
      student.id,
      student.userName,
      student.email,
      student.age,
      student.yearName,
      student.status,
      new Date(student.enrollmentDate).toLocaleDateString(),
      student.performance.overallProgress,
      student.performance.averageExamScore,
      (student.performance.studyTime / 60).toFixed(1)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    this.downloadCSV(csvContent, `students-export-${Date.now()}.csv`);
  }

  /**
   * Export to Excel (CSV format)
   */
  exportToExcel(students: StudentDetails[]): void {
    this.exportToCSV(students); // Same as CSV for now
  }

  /**
   * Bulk operation
   */
  performBulkOperation(operation: BulkOperation): Observable<{ success: boolean; affected: number }> {
    console.log('Bulk operation:', operation);

    // Mock operation
    return of({
      success: true,
      affected: operation.studentIds.length
    }).pipe(delay(500));
  }

  /**
   * Toggle student selection
   */
  toggleStudentSelection(studentId: number): void {
    const current = this.selectedStudents();
    const index = current.indexOf(studentId);

    if (index > -1) {
      // Remove
      this.selectedStudents.set(current.filter(id => id !== studentId));
    } else {
      // Add
      this.selectedStudents.set([...current, studentId]);
    }
  }

  /**
   * Select all students
   */
  selectAll(studentIds: number[]): void {
    this.selectedStudents.set(studentIds);
  }

  /**
   * Deselect all
   */
  deselectAll(): void {
    this.selectedStudents.set([]);
  }

  /**
   * Get analytics for student
   */
  getStudentAnalytics(studentId: number): Observable<any> {
    // Mock analytics data
    return of({
      weeklyProgress: [65, 70, 72, 75, 78, 82, 85],
      examScores: [88, 92, 85, 90, 87, 94, 91],
      studyTimeByDay: [45, 60, 55, 70, 65, 80, 75],
      subjectPerformance: {
        'Mathematics': 88,
        'English': 92,
        'Science': 85,
        'History': 90
      },
      recentActivity: [
        { date: new Date(), type: 'lesson', description: 'Completed Math Lesson 5' },
        { date: new Date(Date.now() - 86400000), type: 'exam', description: 'Scored 92% in English Exam' },
        { date: new Date(Date.now() - 172800000), type: 'lesson', description: 'Watched Science Video' }
      ]
    }).pipe(delay(300));
  }

  /**
   * Download CSV helper
   */
  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Mock students data
   */
  private getMockStudents(): StudentDetails[] {
    return [
      {
        id: 1,
        userName: 'ahmed_hassan',
        email: 'ahmed@example.com',
        age: 12,
        yearId: 7,
        yearName: 'Year 7',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg',
        enrollmentDate: new Date('2024-09-01'),
        status: 'active',
        performance: {
          overallProgress: 85,
          completedLessons: 78,
          totalLessons: 120,
          averageExamScore: 88,
          examsCompleted: 12,
          totalExams: 15,
          studyTime: 2400, // 40 hours
          lastActive: new Date()
        },
        subscription: {
          planName: 'Full Academic Year',
          status: 'Active',
          expiryDate: new Date('2025-06-30')
        }
      },
      {
        id: 2,
        userName: 'sara_mohamed',
        email: 'sara@example.com',
        age: 10,
        yearId: 5,
        yearName: 'Year 5',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg',
        enrollmentDate: new Date('2024-09-01'),
        status: 'active',
        performance: {
          overallProgress: 78,
          completedLessons: 47,
          totalLessons: 60,
          averageExamScore: 85,
          examsCompleted: 8,
          totalExams: 10,
          studyTime: 1800, // 30 hours
          lastActive: new Date(Date.now() - 86400000)
        },
        subscription: {
          planName: 'Terms 1 & 2',
          status: 'Active',
          expiryDate: new Date('2025-01-31')
        }
      },
      {
        id: 3,
        userName: 'omar_ali',
        email: 'omar@example.com',
        age: 8,
        yearId: 3,
        yearName: 'Year 3',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg',
        enrollmentDate: new Date('2024-09-01'),
        status: 'active',
        performance: {
          overallProgress: 92,
          completedLessons: 110,
          totalLessons: 120,
          averageExamScore: 94,
          examsCompleted: 14,
          totalExams: 15,
          studyTime: 3000, // 50 hours
          lastActive: new Date()
        },
        subscription: {
          planName: 'Full Academic Year',
          status: 'Active',
          expiryDate: new Date('2025-06-30')
        }
      },
      {
        id: 4,
        userName: 'layla_khaled',
        email: 'layla@example.com',
        age: 14,
        yearId: 9,
        yearName: 'Year 9',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg',
        enrollmentDate: new Date('2024-09-15'),
        status: 'active',
        performance: {
          overallProgress: 65,
          completedLessons: 45,
          totalLessons: 100,
          averageExamScore: 78,
          examsCompleted: 6,
          totalExams: 12,
          studyTime: 1500, // 25 hours
          lastActive: new Date(Date.now() - 172800000)
        },
        subscription: {
          planName: 'Term 1',
          status: 'Active',
          expiryDate: new Date('2024-12-31')
        }
      },
      {
        id: 5,
        userName: 'youssef_ibrahim',
        email: 'youssef@example.com',
        age: 16,
        yearId: 11,
        yearName: 'Year 11',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg',
        enrollmentDate: new Date('2024-08-20'),
        status: 'inactive',
        performance: {
          overallProgress: 45,
          completedLessons: 30,
          totalLessons: 110,
          averageExamScore: 72,
          examsCompleted: 4,
          totalExams: 12,
          studyTime: 900, // 15 hours
          lastActive: new Date(Date.now() - 604800000) // 7 days ago
        }
      }
    ];
  }
}
