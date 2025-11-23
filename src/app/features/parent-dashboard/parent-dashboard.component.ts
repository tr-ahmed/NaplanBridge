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
import { DashboardService } from '../../core/services/dashboard.service';
import { UserService, ChildDto } from '../../core/services/user.service';
import { OrderService, ParentOrderSummary } from '../../core/services/order.service';
import { StudentService } from '../../core/services/student.service';
import { forkJoin, catchError, of, map } from 'rxjs';

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
  lastOrderDate: Date | null;
  monthlySpent: number;
  orderCount: number;
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
  private dashboardService = inject(DashboardService);
  private userService = inject(UserService);
  private orderService = inject(OrderService);
  private studentService = inject(StudentService);

  // Signals
  dashboardData = signal<ParentDashboardData>({
    children: [],
    totalSpent: 0,
    activeSubscriptions: 0,
    alerts: [],
    lastOrderDate: null,
    monthlySpent: 0,
    orderCount: 0
  });
  loading = signal(true);
  selectedChild = signal<Child | null>(null);
  parentId = signal<number | null>(null);

  ngOnInit(): void {
    this.getParentIdFromToken();
    this.loadDashboardData();
  }

  /**
   * Get parent ID from JWT token
   */
  private getParentIdFromToken(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.parentId.set(Number(payload.nameid));
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }

  /**
   * Load all dashboard data from API
   */
  private loadDashboardData(): void {
    this.loading.set(true);

    const parentId = this.parentId();
    if (!parentId) {
      console.error('Parent ID not found');
      this.loading.set(false);
      return;
    }

    // Load parent dashboard data, children, and order summary
    forkJoin({
      dashboard: this.dashboardService.getParentDashboard().pipe(
        catchError(error => {
          console.error('Error loading parent dashboard:', error);
          return of({ children: [], totalChildren: 0, overallProgress: 0, recentActivities: [] });
        })
      ),
      children: this.userService.getChildren(parentId).pipe(
        catchError(error => {
          console.error('Error loading children:', error);
          return of([]);
        })
      ),
      orderSummary: this.orderService.getParentSummary().pipe(
        catchError(error => {
          console.error('Error loading order summary:', error);
          return of({ totalSpent: 0, orderCount: 0, lastOrderDate: null, orders: [] });
        })
      ),
      monthlyOrders: this.orderService.getCurrentMonthOrders().pipe(
        catchError(error => {
          console.error('Error loading monthly orders:', error);
          return of({ totalSpent: 0, totalOrderCount: 0, lastOrderDate: null, orders: [], currentPage: 1, pageSize: 10, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
        })
      )
    }).subscribe({
      next: ({ dashboard, children, orderSummary, monthlyOrders }) => {
        console.log('💰 Order Summary Received:', {
          totalSpent: orderSummary.totalSpent,
          orderCount: orderSummary.orderCount,
          lastOrderDate: orderSummary.lastOrderDate,
          ordersCount: orderSummary.orders?.length || 0,
          monthlySpent: monthlyOrders.totalSpent
        });
        this.loadChildrenDetails(children, orderSummary, monthlyOrders.totalSpent);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading.set(false);
      }
    });
  }

  /**
   * Load detailed information for each child
   */
  private loadChildrenDetails(children: ChildDto[], orderSummary: ParentOrderSummary, monthlySpent: number = 0): void {
    if (children.length === 0) {
      this.dashboardData.set({
        children: [],
        totalSpent: orderSummary.totalSpent,
        activeSubscriptions: 0,
        alerts: [],
        lastOrderDate: orderSummary.lastOrderDate ? new Date(orderSummary.lastOrderDate) : null,
        monthlySpent,
        orderCount: orderSummary.orderCount
      });
      this.loading.set(false);
      return;
    }

    // Load progress, subscriptions, exams and activities for each child
    const childRequests = children.map(child => {
      return forkJoin({
        child: of(child),
        progress: this.progressService.getStudentProgress(child.id).pipe(
          catchError(() => of(null))
        ),
        subscriptions: this.dashboardService.getStudentSubscriptionsSummary(child.id).pipe(
          catchError(() => of([]))
        ),
        exams: this.examService.getExams().pipe(
          catchError(() => of([]))
        ),
        recentActivities: this.studentService.getRecentActivities(child.id).pipe(
          catchError(() => of([]))
        )
      });
    });

    forkJoin(childRequests).subscribe({
      next: (childrenData) => {
        console.log('🔍 Parent Dashboard - Raw API Response:', childrenData);

        const processedChildren: Child[] = childrenData.map(data => {
          const child = data.child;
          const progress = data.progress;

          // ✅ NEW: API now returns { totalActiveSubscriptions, subscriptions: [...] }
          let subscriptions: any[] = [];
          if (data.subscriptions && typeof data.subscriptions === 'object') {
            // Extract subscriptions array from response object
            if (Array.isArray(data.subscriptions.subscriptions)) {
              subscriptions = data.subscriptions.subscriptions;
            } else if (Array.isArray(data.subscriptions)) {
              subscriptions = data.subscriptions;
            }
          }

          const exams = Array.isArray(data.exams) ? data.exams : [];
          const activities = Array.isArray(data.recentActivities) ? data.recentActivities : [];

          console.log(`🔍 Processing child ${child.userName}:`, {
            childId: child.id,
            totalSubscriptions: subscriptions.length,
            activeCount: subscriptions.filter((s: any) => s.isActive === true).length,
            subscriptions: subscriptions.map((s: any) => ({
              planName: s.planName,
              isActive: s.isActive,
              daysRemaining: s.daysRemaining
            }))
          });

          // Calculate overall progress
          const overallProgress = progress?.overallProgress || 0;

          // Get active subscription - filter for active subscriptions only
          const activeSubscriptions = subscriptions.filter((sub: any) => sub.isActive === true);
          const activeSubscription = activeSubscriptions.length > 0
            ? activeSubscriptions.map((s: any) => s.planName || s.subjectName).join(', ')
            : 'No Active Subscription';

          console.log(`👤 ${child.userName} subscriptions:`, {
            total: subscriptions.length,
            active: activeSubscriptions.length,
            displayText: activeSubscription,
            allSubs: subscriptions.map((s: any) => ({
              name: s.planName || s.subjectName,
              isActive: s.isActive
            }))
          });

          // Count upcoming exams
          const upcomingExams = exams.filter((exam: any) =>
            new Date(exam.startDate) > new Date()
          ).length;

          // Map recent activities
          const recentActivity: Activity[] = activities.slice(0, 3).map((activity: any) => ({
            type: activity.type || 'lesson',
            description: activity.description || 'Recent activity',
            date: new Date(activity.date || Date.now()),
            icon: this.getActivityIcon(activity.type)
          }));

          return {
            id: child.id,
            name: child.userName,
            grade: `Year ${child.year || 'N/A'}`,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(child.userName)}&background=4F46E5&color=fff`,
            overallProgress,
            activeSubscription,
            upcomingExams,
            recentActivity
          };
        });

        // ✅ Calculate totals using NEW isActive field from backend
        console.log('🔢 Calculating active subscriptions with new isActive field...');
        const activeSubscriptions = childrenData.reduce((sum, data) => {
          // Extract subscriptions array from API response
          let subscriptions: any[] = [];
          if (data.subscriptions && typeof data.subscriptions === 'object') {
            if (Array.isArray(data.subscriptions.subscriptions)) {
              subscriptions = data.subscriptions.subscriptions;
            } else if (Array.isArray(data.subscriptions)) {
              subscriptions = data.subscriptions;
            }
          }

          // ✅ Use backend's isActive field directly
          const activeCount = subscriptions.filter((sub: any) => sub.isActive === true).length;

          console.log(`  ✅ ${data.child.userName}: ${activeCount} active / ${subscriptions.length} total`);
          return sum + activeCount;
        }, 0);

        console.log('📊 Active subscriptions TOTAL:', {
          totalChildren: childrenData.length,
          activeSubscriptions,
          perChild: childrenData.map((d: any) => {
            let subs: any[] = [];
            if (d.subscriptions?.subscriptions) {
              subs = d.subscriptions.subscriptions;
            } else if (Array.isArray(d.subscriptions)) {
              subs = d.subscriptions;
            }
            return {
              name: d.child.userName,
              active: subs.filter((s: any) => s.isActive).length,
              total: subs.length
            };
          })
        });        // Generate alerts
        const alerts = this.generateAlerts(processedChildren);

        console.log('📊 Final Dashboard Data:', {
          totalSpent: orderSummary.totalSpent,
          activeSubscriptions,
          orderCount: orderSummary.orderCount,
          monthlySpent,
          childrenCount: processedChildren.length
        });

        this.dashboardData.set({
          children: processedChildren,
          totalSpent: orderSummary.totalSpent,
          activeSubscriptions,
          alerts,
          lastOrderDate: orderSummary.lastOrderDate ? new Date(orderSummary.lastOrderDate) : null,
          monthlySpent,
          orderCount: orderSummary.orderCount
        });

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading children details:', error);
        this.loading.set(false);
      }
    });
  }

  /**
   * Get icon for activity type
   */
  private getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'exam': '📝',
      'lesson': '🎥',
      'achievement': '🏆',
      'default': '📚'
    };
    return icons[type] || icons['default'];
  }

  /**
   * Generate alerts based on children data
   */
  private generateAlerts(children: Child[]): Alert[] {
    const alerts: Alert[] = [];

    children.forEach(child => {
      // Check for low progress
      if (child.overallProgress < 50) {
        alerts.push({
          type: 'warning',
          message: `${child.name}'s progress is below 50%`,
          actionUrl: '/student/dashboard',
          actionText: 'View Details'
        });
      }

      // Check for no active subscription
      if (child.activeSubscription === 'No Active Subscription') {
        alerts.push({
          type: 'info',
          message: `${child.name} has no active subscription`,
          actionUrl: '/parent/subscriptions',
          actionText: 'Subscribe Now'
        });
      }

      // Check for good progress
      if (child.overallProgress >= 90) {
        alerts.push({
          type: 'success',
          message: `${child.name} is doing great with ${child.overallProgress}% progress! 🎉`,
          actionUrl: '/student/dashboard',
          actionText: 'View Progress'
        });
      }
    });

    return alerts.slice(0, 5); // Limit to 5 alerts
  }

  /**
   * Navigate to child settings
   * ✅ Backend endpoint ready: /api/Parent/student/{id}/details
   */
  selectChild(child: Child): void {
    this.selectedChild.set(child);
    // Navigate to student details page with settings tab
    this.router.navigate(['/parent/student', child.id], {
      queryParams: { tab: 'settings' }
    });
  }

  /**
   * Navigate to child's details page
   * ✅ Backend endpoint ready: /api/Parent/student/{id}/details
   */
  viewChildDashboard(childId: number): void {
    // Navigate to dedicated student details page
    this.router.navigate(['/parent/student', childId]);
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
    this.router.navigate(['/add-student']);
  }

  /**
   * Navigate to subscription plans
   */
  viewSubscriptionPlans(): void {
    this.router.navigate(['/courses']);
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

  /**
   * Get subscription list as array
   */
  getSubscriptionList(subscriptionText: string): string[] {
    if (!subscriptionText || subscriptionText === 'No Active Subscription') {
      return [];
    }
    return subscriptionText.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(subscriptionText: string): number {
    return this.getSubscriptionList(subscriptionText).length;
  }

  /**
   * Add subscription for child
   */
  addSubscription(childId: number): void {
    this.router.navigate(['/parent/subscriptions'], { queryParams: { childId } });
  }
}
