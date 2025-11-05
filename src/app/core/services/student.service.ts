/**
 * Student Service
 * Handles student-related API calls including recent activities
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './base-api.service';

// ============================================
// Recent Activities DTOs
// ============================================

export interface RecentActivitiesResponse {
  success: boolean;
  message: string;
  data: RecentActivity[];
}

export interface RecentActivity {
  type: 'ExamTaken' | 'LessonProgress' | 'CertificateEarned' | 'AchievementUnlocked';
  title: string;
  date: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private api = inject(ApiService);

  /**
   * Get recent activities for a student
   * Endpoint: GET /api/Student/{studentId}/recent-activities
   */
  getRecentActivities(studentId: number): Observable<RecentActivity[]> {
    return this.api.get<RecentActivity[]>(`Student/${studentId}/recent-activities`);
  }

  /**
   * Get activity icon based on type
   */
  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'ExamTaken': '📝',
      'LessonProgress': '🎥',
      'CertificateEarned': '🏆',
      'AchievementUnlocked': '🎖️',
      'exam': '📝',
      'lesson': '🎥',
      'achievement': '🏆',
      'certificate': '📜',
      'default': '📚'
    };
    return icons[type] || icons['default'];
  }

  /**
   * Get activity color based on type
   */
  getActivityColor(type: string): string {
    const colors: { [key: string]: string } = {
      'ExamTaken': 'blue',
      'LessonProgress': 'green',
      'CertificateEarned': 'gold',
      'AchievementUnlocked': 'purple',
      'exam': 'blue',
      'lesson': 'green',
      'achievement': 'purple',
      'certificate': 'gold',
      'default': 'gray'
    };
    return colors[type] || colors['default'];
  }
}
