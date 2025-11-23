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
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
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
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'faq',
    loadComponent: () => import('./pages/faqs/faqs.component').then(m => m.FaqsComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/terms/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./pages/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent)
  },
  {
    path: 'terms-of-use',
    loadComponent: () => import('./pages/terms-of-use/terms-of-use.component').then(m => m.TermsOfUseComponent)
  },
  {
    path: 'cookie-policy',
    loadComponent: () => import('./pages/cookie-policy/cookie-policy.component').then(m => m.CookiePolicyComponent)
  },
  {
    path: 'terms-of-service',
    redirectTo: 'terms-of-use',
    pathMatch: 'full'
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
    loadComponent: () => import('./features/lesson-detail/lesson-detail.component').then(m => m.LessonDetailComponent)
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
    path: 'parent/student/:id',
    loadComponent: () => import('./features/student-details/student-details.component').then(m => m.StudentDetailsComponent),
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
    path: 'profile/edit',
    loadComponent: () => import('./features/profile-edit/profile-edit.component').then(m => m.ProfileEditComponent),
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

  // Student Exams
  // Removed - using newer student routes below

  // Student Subscriptions
  {
    path: 'student/subscriptions',
    loadComponent: () => import('./features/student-subscriptions/student-subscriptions.component').then(m => m.StudentSubscriptionsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('student')]
  },

  // Admin Dashboard
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')],
    data: { hideHeader: true, hideFooter: true }
  },

  // Admin Content Management
  {
    path: 'admin/content',
    loadComponent: () => import('./features/content-management/content-management-redesigned').then(m => m.ContentManagementComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
      ,  data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/lesson-management/:id',
    loadComponent: () => import('./features/content-management/lesson-management.component').then(m => m.LessonManagementComponent),
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
    loadComponent: () => import('./features/lesson-detail/lesson-detail.component').then(m => m.LessonDetailComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
      ,  data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/analytics-dashboard',
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
    loadComponent: () => import('./features/subscriptions/subscriptions.component').then(m => m.SubscriptionsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')],
    data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/teacher-permissions',
    loadComponent: () => import('./features/admin/teacher-permissions/teacher-permissions-admin.component').then(m => m.TeacherPermissionsAdminComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')],
    data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/assign-teacher',
    loadComponent: () => import('./features/admin/assign-teacher/assign-teacher.component').then(m => m.AssignTeacherComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')],
    data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/video-settings',
    loadComponent: () => import('./admin/video-settings/video-settings.component').then(m => m.VideoSettingsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')],
    data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/templates',
    loadComponent: () => import('./admin/template-list/template-list.component').then(m => m.TemplateListComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')],
    data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'admin/templates/edit/:id',
    loadComponent: () => import('./admin/template-editor/template-editor.component').then(m => m.TemplateEditorComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('admin')],
    data: { hideHeader: true, hideFooter: true }
  },

  // Teacher Dashboard
  {
    path: 'teacher/dashboard',
    loadComponent: () => import('./features/teacher-dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent),
    canActivate: [authGuard]
  },

  // Teacher Questions Dashboard
  {
    path: 'teacher/questions',
    loadComponent: () => import('./features/teacher/student-questions/student-questions.component').then(m => m.StudentQuestionsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('teacher')],
    data: { hideHeader: false, hideFooter: false }
  },

  // Teacher Exams Management (Full Management like Admin)
  {
    path: 'teacher/exams',
    loadComponent: () => import('./features/teacher/teacher-exam-management/teacher-exam-management.component').then(m => m.TeacherExamManagementComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('teacher')],
    data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'teacher/exam/create',
    loadComponent: () => import('./features/create-edit-exam/create-edit-exam.component').then(m => m.CreateEditExamComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('teacher')],
    data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'teacher/exam/edit/:id',
    loadComponent: () => import('./features/create-edit-exam/create-edit-exam.component').then(m => m.CreateEditExamComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('teacher')],
    data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'teacher/exams/:id/submissions',
    loadComponent: () => import('./features/teacher/exam-grading/exam-grading.component').then(m => m.ExamGradingComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('teacher')],
    data: { hideHeader: true, hideFooter: true }
  },

  // Teacher Content Management - Redesigned
  {
    path: 'teacher/content-management',
    loadComponent: () => import('./features/teacher/content-management/teacher-content-management-redesigned').then(m => m.TeacherContentManagementRedesignedComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('teacher')],
    data: { hideHeader: true, hideFooter: true }
  },

  // Teacher Content Management - Old (redirect to new)
  {
    path: 'teacher/content-management-old',
    loadComponent: () => import('./features/teacher/content-management/teacher-content-management.component').then(m => m.TeacherContentManagementComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('teacher')],
    data: { hideHeader: true, hideFooter: true }
  },

  // Student Exams
  {
    path: 'student/exams',
    loadComponent: () => import('./features/student/student-exams/student-exams.component').then(m => m.StudentExamsComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('student')],
    data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'student/exam/:id',
    loadComponent: () => import('./features/student/exam-taking/exam-taking.component').then(m => m.ExamTakingComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('student')],
    data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'student/exam/:id/start',
    loadComponent: () => import('./features/student/exam-taking/exam-taking.component').then(m => m.ExamTakingComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('student')],
    data: { hideHeader: true, hideFooter: true }
  },
  {
    path: 'student/exam-result/:id',
    loadComponent: () => import('./features/student/exam-result/exam-result.component').then(m => m.ExamResultComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('student')],
    data: { hideHeader: true, hideFooter: true }
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
