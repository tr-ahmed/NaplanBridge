/**
 * Admin Dashboard Component
 * Main dashboard for system administrators
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/services/toast.service';

interface StatCard {
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: string;
  color: string;
  bgColor: string;
}

interface RecentActivity {
  id: number;
  type: 'user' | 'exam' | 'payment' | 'system';
  message: string;
  timestamp: Date;
  user?: string;
  icon: string;
  color: string;
}

interface SystemAlert {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

interface UserStats {
  total: number;
  students: number;
  teachers: number;
  parents: number;
  admins: number;
  activeToday: number;
}

interface ExamStats {
  total: number;
  published: number;
  pending: number;
  completed: number;
  averageScore: number;
}

interface FinancialStats {
  totalRevenue: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayments: number;
  completedPayments: number;
}

interface ContentStats {
  subjects: number;
  lessons: number;
  videos: number;
  totalDuration: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State
  loading = signal<boolean>(true);

  // Data
  statsCards = signal<StatCard[]>([]);
  recentActivities = signal<RecentActivity[]>([]);
  systemAlerts = signal<SystemAlert[]>([]);

  userStats = signal<UserStats>({
    total: 0,
    students: 0,
    teachers: 0,
    parents: 0,
    admins: 0,
    activeToday: 0
  });

  examStats = signal<ExamStats>({
    total: 0,
    published: 0,
    pending: 0,
    completed: 0,
    averageScore: 0
  });

  financialStats = signal<FinancialStats>({
    totalRevenue: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayments: 0,
    completedPayments: 0
  });

  contentStats = signal<ContentStats>({
    subjects: 0,
    lessons: 0,
    videos: 0,
    totalDuration: 0
  });

  // Quick Actions
  quickActions: QuickAction[] = [
    {
      title: 'User Management',
      description: 'Manage users and roles',
      icon: 'users',
      color: 'blue',
      route: '/admin/users'
    },
    {
      title: 'Content Management',
      description: 'Manage subjects and lessons',
      icon: 'content',
      color: 'green',
      route: '/admin/content'
    },
    {
      title: 'Exam Management',
      description: 'Manage exams and results',
      icon: 'exam',
      color: 'purple',
      route: '/admin/exams'
    },
    {
      title: 'Analytics Dashboard',
      description: 'View detailed analytics',
      icon: 'analytics',
      color: 'indigo',
      route: '/admin/analytics'
    },
    {
      title: 'Advanced Analytics',
      description: 'Advanced reports & insights',
      icon: 'chart',
      color: 'pink',
      route: '/admin/advanced-analytics'
    },
    {
      title: 'Detailed Financial Reports',
      description: 'Transactions by source',
      icon: 'report',
      color: 'orange',
      route: '/admin/financial-reports'
    },
    {
      title: 'Financial Reports',
      description: 'View payment reports',
      icon: 'money',
      color: 'yellow',
      route: '/admin/finance'
    },
    {
      title: 'System Settings',
      description: 'Configure system',
      icon: 'settings',
      color: 'gray',
      route: '/admin/settings'
    }
  ];

  // Computed
  activeAlerts = computed(() =>
    this.systemAlerts().filter(a => !a.dismissed)
  );

  recentActivitiesFiltered = computed(() =>
    this.recentActivities().slice(0, 10)
  );

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.role === 'Admin') {
      this.loadDashboardData();
    } else {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Load all dashboard data
   */
  private loadDashboardData(): void {
    this.loading.set(true);

    // Mock data
    setTimeout(() => {
      this.loadStatsCards();
      this.loadUserStats();
      this.loadExamStats();
      this.loadFinancialStats();
      this.loadContentStats();
      this.loadRecentActivities();
      this.loadSystemAlerts();

      this.loading.set(false);
    }, 1000);
  }

  /**
   * Load stats cards
   */
  private loadStatsCards(): void {
    this.statsCards.set([
      {
        title: 'Total Users',
        value: 1245,
        change: 12.5,
        changeType: 'increase',
        icon: 'users',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Active Exams',
        value: 87,
        change: 8.2,
        changeType: 'increase',
        icon: 'exam',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      {
        title: 'Revenue (This Month)',
        value: 45280,
        change: 15.3,
        changeType: 'increase',
        icon: 'money',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100'
      },
      {
        title: 'System Health',
        value: 98,
        change: 2.1,
        changeType: 'decrease',
        icon: 'health',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      }
    ]);
  }

  /**
   * Load user statistics
   */
  private loadUserStats(): void {
    this.userStats.set({
      total: 1245,
      students: 850,
      teachers: 45,
      parents: 340,
      admins: 10,
      activeToday: 523
    });
  }

  /**
   * Load exam statistics
   */
  private loadExamStats(): void {
    this.examStats.set({
      total: 234,
      published: 87,
      pending: 23,
      completed: 124,
      averageScore: 76.5
    });
  }

  /**
   * Load financial statistics
   */
  private loadFinancialStats(): void {
    this.financialStats.set({
      totalRevenue: 456780,
      thisMonth: 45280,
      lastMonth: 39240,
      pendingPayments: 12,
      completedPayments: 456
    });
  }

  /**
   * Load content statistics
   */
  private loadContentStats(): void {
    this.contentStats.set({
      subjects: 12,
      lessons: 456,
      videos: 789,
      totalDuration: 45678
    });
  }

  /**
   * Load recent activities
   */
  private loadRecentActivities(): void {
    const activities: RecentActivity[] = [
      {
        id: 1,
        type: 'user',
        message: 'New student registered: Ahmed Hassan',
        timestamp: new Date('2025-10-24T14:30:00'),
        user: 'Ahmed Hassan',
        icon: 'user-add',
        color: 'blue'
      },
      {
        id: 2,
        type: 'exam',
        message: 'Teacher created new exam: Math Week 5',
        timestamp: new Date('2025-10-24T13:15:00'),
        user: 'Sarah Johnson',
        icon: 'exam',
        color: 'green'
      },
      {
        id: 3,
        type: 'payment',
        message: 'Payment received: $120 from Parent Account',
        timestamp: new Date('2025-10-24T12:45:00'),
        user: 'John Smith',
        icon: 'money',
        color: 'yellow'
      },
      {
        id: 4,
        type: 'system',
        message: 'System backup completed successfully',
        timestamp: new Date('2025-10-24T10:00:00'),
        icon: 'check',
        color: 'purple'
      },
      {
        id: 5,
        type: 'user',
        message: 'Teacher account activated: Mike Brown',
        timestamp: new Date('2025-10-24T09:30:00'),
        user: 'Mike Brown',
        icon: 'user-check',
        color: 'blue'
      },
      {
        id: 6,
        type: 'exam',
        message: 'Exam graded: Science Monthly Test',
        timestamp: new Date('2025-10-23T18:20:00'),
        user: 'Teacher Lisa',
        icon: 'grade',
        color: 'green'
      },
      {
        id: 7,
        type: 'payment',
        message: 'Subscription renewed: Premium Plan',
        timestamp: new Date('2025-10-23T16:45:00'),
        user: 'Parent David',
        icon: 'renew',
        color: 'yellow'
      },
      {
        id: 8,
        type: 'user',
        message: 'Password reset requested by student',
        timestamp: new Date('2025-10-23T15:10:00'),
        user: 'Student Emma',
        icon: 'lock',
        color: 'orange'
      }
    ];

    this.recentActivities.set(activities);
  }

  /**
   * Load system alerts
   */
  private loadSystemAlerts(): void {
    const alerts: SystemAlert[] = [
      {
        id: 1,
        type: 'warning',
        message: 'Server storage is 85% full. Consider upgrading.',
        timestamp: new Date('2025-10-24T10:00:00'),
        dismissed: false
      },
      {
        id: 2,
        type: 'info',
        message: 'System maintenance scheduled for next Sunday at 2:00 AM.',
        timestamp: new Date('2025-10-24T09:00:00'),
        dismissed: false
      },
      {
        id: 3,
        type: 'success',
        message: 'Database backup completed successfully.',
        timestamp: new Date('2025-10-24T08:00:00'),
        dismissed: false
      }
    ];

    this.systemAlerts.set(alerts);
  }

  /**
   * Dismiss alert
   */
  dismissAlert(alertId: number): void {
    this.systemAlerts.update(alerts =>
      alerts.map(a => a.id === alertId ? { ...a, dismissed: true } : a)
    );
    this.toastService.showSuccess('Alert dismissed');
  }

  /**
   * Refresh dashboard
   */
  refresh(): void {
    this.loadDashboardData();
    this.toastService.showSuccess('Dashboard refreshed');
  }

  /**
   * Navigate to quick action
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Get alert color class
   */
  getAlertColorClass(type: string): string {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  }

  /**
   * Get activity icon class
   */
  getActivityIconClass(color: string): string {
    const baseClasses = 'w-10 h-10 rounded-full flex items-center justify-center';
    switch (color) {
      case 'blue':
        return `${baseClasses} bg-blue-100 text-blue-600`;
      case 'green':
        return `${baseClasses} bg-green-100 text-green-600`;
      case 'yellow':
        return `${baseClasses} bg-yellow-100 text-yellow-600`;
      case 'purple':
        return `${baseClasses} bg-purple-100 text-purple-600`;
      case 'orange':
        return `${baseClasses} bg-orange-100 text-orange-600`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format duration
   */
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  /**
   * Get change icon
   */
  getChangeIcon(type: 'increase' | 'decrease'): string {
    return type === 'increase' ? '↑' : '↓';
  }

  /**
   * Get change color
   */
  getChangeColor(type: 'increase' | 'decrease'): string {
    return type === 'increase' ? 'text-green-600' : 'text-red-600';
  }
}
