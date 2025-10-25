/**
 * Parent Dashboard Component
 * Main dashboard for parents to monitor their children's progress
 * Shows children list, subscriptions, upcoming exams, and quick actions
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { ExamService } from '../../core/services/exam.service';

// Interfaces
interface Child {
  id: number;
  name: string;
  grade: string;
  avatar?: string;
  overallProgress: number;
  activeSubscription: string;
  upcomingExams: number;
  recentActivity: Activity[];
}

interface Activity {
  type: 'exam' | 'lesson' | 'achievement';
  description: string;
  date: Date;
  icon: string;
}

interface Alert {
  type: 'info' | 'warning' | 'success' | 'danger';
  message: string;
  actionUrl?: string;
  actionText?: string;
}

interface ParentDashboardData {
  children: Child[];
  totalSpent: number;
  activeSubscriptions: number;
  alerts: Alert[];
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './parent-dashboard.component.html',
  styleUrl: './parent-dashboard.component.scss'
})
export class ParentDashboardComponent implements OnInit {
  // Services
  private router = inject(Router);
  private progressService = inject(ProgressService);
  private subscriptionService = inject(SubscriptionService);
  private examService = inject(ExamService);

  // Signals
  dashboardData = signal<ParentDashboardData>({
    children: [],
    totalSpent: 0,
    activeSubscriptions: 0,
    alerts: []
  });
  loading = signal(true);
  selectedChild = signal<Child | null>(null);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Load all dashboard data
   */
  private loadDashboardData(): void {
    this.loading.set(true);

    // Simulate API call with mock data
    setTimeout(() => {
      this.dashboardData.set(this.getMockDashboardData());
      this.loading.set(false);
    }, 500);
  }

  /**
   * Get mock dashboard data
   */
  private getMockDashboardData(): ParentDashboardData {
    return {
      children: [
        {
          id: 1,
          name: 'Ahmed Hassan',
          grade: 'Year 7',
          avatar: 'https://ui-avatars.com/api/?name=Ahmed+Hassan&background=4F46E5&color=fff',
          overallProgress: 85,
          activeSubscription: 'Full Academic Year',
          upcomingExams: 3,
          recentActivity: [
            {
              type: 'exam',
              description: 'Completed Mathematics Exam - Score: 92%',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              icon: '📝'
            },
            {
              type: 'lesson',
              description: 'Watched Science Lesson: Photosynthesis',
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              icon: '🎥'
            },
            {
              type: 'achievement',
              description: 'Earned "Quick Learner" Badge',
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              icon: '🏆'
            }
          ]
        },
        {
          id: 2,
          name: 'Sara Hassan',
          grade: 'Year 5',
          avatar: 'https://ui-avatars.com/api/?name=Sara+Hassan&background=EC4899&color=fff',
          overallProgress: 78,
          activeSubscription: 'Terms 1 & 2 Package',
          upcomingExams: 2,
          recentActivity: [
            {
              type: 'lesson',
              description: 'Watched English Lesson: Grammar Basics',
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              icon: '🎥'
            },
            {
              type: 'exam',
              description: 'Completed English Exam - Score: 88%',
              date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
              icon: '📝'
            }
          ]
        },
        {
          id: 3,
          name: 'Omar Hassan',
          grade: 'Year 3',
          avatar: 'https://ui-avatars.com/api/?name=Omar+Hassan&background=10B981&color=fff',
          overallProgress: 92,
          activeSubscription: 'Full Academic Year',
          upcomingExams: 1,
          recentActivity: [
            {
              type: 'achievement',
              description: 'Earned "Perfect Score" Badge',
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              icon: '🏆'
            },
            {
              type: 'exam',
              description: 'Completed Math Exam - Score: 100%',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              icon: '📝'
            }
          ]
        }
      ],
      totalSpent: 1247.50,
      activeSubscriptions: 3,
      alerts: [
        {
          type: 'warning',
          message: 'Ahmed\'s subscription expires in 15 days',
          actionUrl: '/parent/subscriptions',
          actionText: 'Renew Now'
        },
        {
          type: 'info',
          message: 'New exam scheduled for Sara - Mathematics on Oct 30',
          actionUrl: '/student/dashboard',
          actionText: 'View Details'
        },
        {
          type: 'success',
          message: 'Omar achieved 100% in last Math exam! 🎉',
          actionUrl: '/student/dashboard',
          actionText: 'View Results'
        }
      ]
    };
  }

  /**
   * Select a child to view details
   */
  selectChild(child: Child): void {
    this.selectedChild.set(child);
  }

  /**
   * Navigate to child's dashboard
   */
  viewChildDashboard(childId: number): void {
    this.router.navigate(['/student/dashboard'], { 
      queryParams: { studentId: childId } 
    });
  }

  /**
   * Navigate to manage subscriptions
   */
  manageSubscriptions(): void {
    this.router.navigate(['/parent/subscriptions']);
  }

  /**
   * Navigate to add new child
   */
  addNewChild(): void {
    this.router.navigate(['/parent/add-student']);
  }

  /**
   * Navigate to subscription plans
   */
  viewSubscriptionPlans(): void {
    this.router.navigate(['/subscription-plans']);
  }

  /**
   * Get progress color based on percentage
   */
  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  /**
   * Get alert icon based on type
   */
  getAlertIcon(type: Alert['type']): string {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      danger: '🚨'
    };
    return icons[type] || 'ℹ️';
  }

  /**
   * Get alert CSS class based on type
   */
  getAlertClass(type: Alert['type']): string {
    const classes = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      danger: 'bg-red-50 border-red-200 text-red-800'
    };
    return classes[type] || classes.info;
  }

  /**
   * Format date to relative time
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.loadDashboardData();
  }
}
