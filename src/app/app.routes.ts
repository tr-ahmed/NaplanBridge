import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { authGuard } from './auth/auth.guard';
import { RoleSelectionGuard } from './auth/role-selection/role-selection.guard';
import { StudentDetailsComponent } from './features/student-details/student-details';
import { UserProfileComponent } from './features/user-profile/user-profile';
import { UserEditComponent } from './features/user-edit/user-edit';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },

  // Authentication routes
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },

  // Role selection route (important: place before other protected routes)
  {
    path: 'select-role',
    loadComponent: () => import('./auth/role-selection/role-selection').then(m => m.RoleSelectionComponent),
    canActivate: [authGuard, RoleSelectionGuard],
    data: { hideHeader: true, hideFooter: true }
  },

  // Public routes
  {
    path: 'terms',
    loadComponent: () => import('./features/terms/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'courses',
    loadComponent: () => import('./features/courses/courses.component').then(m => m.CoursesComponent)
  },
  {
    path: 'lessons',
    loadComponent: () => import('./features/lessons/lessons.component').then(m => m.LessonsComponent)
  },
  {
    path: 'lesson/:id',
    loadComponent: () => import('./features/lesson-detail/lesson-detail').then(m => m.LessonDetail)
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
  },
  {
    path: 'add-student',
    loadComponent: () => import('./features/Add-Student/add-student').then(m => m.AddStudentComponent)
  },

  // Subscription routes
  {
    path: 'subscription/plans',
    loadComponent: () => import('./features/subscription-plans/subscription-plans.component').then(m => m.SubscriptionPlansComponent)
  },
  {
    path: 'subscription/checkout/:planId',
    loadComponent: () => import('./features/subscription-checkout/subscription-checkout.component').then(m => m.SubscriptionCheckoutComponent),
    canActivate: [authGuard]
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [authGuard]
  },

  // Parent Dashboard
  {
    path: 'parent/dashboard',
    loadComponent: () => import('./features/parent-dashboard/parent-dashboard.component').then(m => m.ParentDashboardComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('parent')]
  },
  {
    path: 'parent/orders',
    loadComponent: () => import('./features/order-history/order-history.component').then(m => m.OrderHistoryComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('parent')]
  },
  {
    path: 'parent/analytics',
    loadComponent: () => import('./features/analytics-dashboard/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('parent')]
  },
  {
    path: 'parent/subscriptions',
    loadComponent: () => import('./features/my-subscriptions/my-subscriptions.component').then(m => m.MySubscriptionsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('parent')]
  },
  {
    path: 'parent/invoice/:orderId',
    loadComponent: () => import('./features/invoice/invoice.component').then(m => m.InvoiceComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('parent')]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile-management/profile-management.component').then(m => m.ProfileManagementComponent),
    canActivate: [authGuard]
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/advanced-analytics/advanced-analytics.component').then(m => m.AdvancedAnalyticsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
  },

  // Student Dashboard
  {
    path: 'student/dashboard',
    loadComponent: () => import('./features/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('student')]
  },

  // Admin Content Management
  {
    path: 'admin/content',
    loadComponent: () => import('./features/content-management/content-management-redesigned').then(m => m.ContentManagementComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
      ,  data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/exams',
    loadComponent: () => import('./features/exam-management/exam-management.component').then(m => m.ExamManagementComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
      ,  data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/exam/create',
    loadComponent: () => import('./features/create-edit-exam/create-edit-exam.component').then(m => m.CreateEditExamComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
      ,  data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/exam/edit/:id',
    loadComponent: () => import('./features/create-edit-exam/create-edit-exam.component').then(m => m.CreateEditExamComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
      ,  data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'lesson-detail/:id',
    loadComponent: () => import('./features/lesson-detail/lesson-detail').then(m => m.LessonDetail),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
      ,  data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/analytics',
    loadComponent: () => import('./features/analytics-dashboard/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
      ,  data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/advanced-analytics',
    loadComponent: () => import('./features/advanced-analytics/advanced-analytics.component').then(m => m.AdvancedAnalyticsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
      ,  data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/financial-reports',
    loadComponent: () => import('./features/financial-reports/financial-reports.component').then(m => m.FinancialReportsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
      ,  data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./admin/user-managment/user-managment').then(m => m.UserManagmentComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
          ,  data: { hideHeader: true, hideFooter: true }

  },
  {
    path: 'admin/subscriptions',
    loadComponent: () => import('./features/subscriptions-admin/subscriptions-admin').then(m => m.SubscriptionManagementComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
          ,  data: { hideHeader: true, hideFooter: true }

  },
  {
    path: 'admin/video-settings',
    loadComponent: () => import('./admin/video-settings/video-settings.component').then(m => m.VideoSettingsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')],
    data: { hideHeader: true, hideFooter: true }
  },

  // Teacher Dashboard
  {
    path: 'teacher/dashboard',
    loadComponent: () => import('./features/teacher-dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent),
    canActivate: [authGuard]
  },

  // Teacher Content Management
  {
    path: 'teacher/content-management',
    loadComponent: () => import('./features/teacher/content-management/teacher-content-management.component').then(m => m.TeacherContentManagementComponent),
    canActivate: [authGuard]
  },

  // Teacher Exam Management
  {
    path: 'teacher/exams',
    loadComponent: () => import('./features/exam-management/exam-management.component').then(m => m.ExamManagementComponent),
    canActivate: [authGuard]
  },
  {
    path: 'teacher/exam/create',
    loadComponent: () => import('./features/create-edit-exam/create-edit-exam.component').then(m => m.CreateEditExamComponent),
    canActivate: [authGuard]
  },
  {
    path: 'teacher/exam/edit/:id',
    loadComponent: () => import('./features/create-edit-exam/create-edit-exam.component').then(m => m.CreateEditExamComponent),
    canActivate: [authGuard]
  },

  // Teacher Management Routes (Placeholder - To be implemented)
  {
    path: 'teacher/grade/:studentExamId',
    redirectTo: 'teacher/dashboard', // Temporary redirect until page is created
    pathMatch: 'full'
  },
  {
    path: 'teacher/class/:classId',
    redirectTo: 'teacher/dashboard', // Temporary redirect until page is created
    pathMatch: 'full'
  },
  {
    path: 'teacher/students',
    redirectTo: 'teacher/dashboard', // Temporary redirect until page is created
    pathMatch: 'full'
  },

{ path: 'user/:id', component: UserProfileComponent },

  { path: 'user/edit/:id', component: UserEditComponent },

  // Payment Routes
  {
    path: 'payment/success',
    loadComponent: () => import('./features/payment-success/payment-success.component').then(m => m.PaymentSuccessComponent)
  },
  {
    path: 'payment/cancel',
    loadComponent: () => import('./features/payment-cancel/payment-cancel.component').then(m => m.PaymentCancelComponent)
  },

  // Private Sessions (Booking) Routes
  {
    path: 'sessions/browse',
    loadComponent: () => import('./features/sessions/browse-teachers/browse-teachers.component').then(m => m.BrowseTeachersComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('parent')]
  },
  {
    path: 'sessions/book/:teacherId',
    loadComponent: () => import('./features/sessions/book-session/book-session.component').then(m => m.BookSessionComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('parent')]
  },
  {
    path: 'sessions/my-bookings',
    loadComponent: () => import('./features/sessions/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('parent')]
  },
  {
    path: 'sessions/availability',
    loadComponent: () => import('./features/sessions/teacher-availability/teacher-availability.component').then(m => m.TeacherAvailabilityComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('teacher')]
  },
  {
    path: 'sessions/teacher',
    loadComponent: () => import('./features/sessions/teacher-sessions/teacher-sessions.component').then(m => m.TeacherSessionsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('teacher')]
  },
  {
    path: 'sessions/student',
    loadComponent: () => import('./features/sessions/student-sessions/student-sessions.component').then(m => m.StudentSessionsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('student')]
  },

  // Fallback route
  { path: '**', redirectTo: '' }
];
