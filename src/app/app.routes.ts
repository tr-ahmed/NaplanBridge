import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { authGuard } from './auth/auth.guard';
import { RoleSelectionGuard } from './auth/role-selection/role-selection.guard';

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
    path: 'subscription/plans',
    loadComponent: () => import('./features/subscription-plans/subscription-plans.component').then(m => m.SubscriptionPlansComponent)
  },
  {
    path: 'subscription/checkout/:planId',
    loadComponent: () => import('./features/subscription-checkout/subscription-checkout.component').then(m => m.SubscriptionCheckoutComponent),
    canActivate: [authGuard]
  },

  // Parent Dashboard
  {
    path: 'parent/dashboard',
    loadComponent: () => import('./features/students-list/students-list').then(m => m.StudentsListComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('parent')]
  },

  // Student Dashboard and Routes (commented out until student routes are created)
  // {
  //   path: 'student',
  //   loadChildren: () => import('./student/student.routes').then(m => m.STUDENT_ROUTES),
  //   canActivate: [authGuard, () => inject(AuthService).hasRole('student')]
  // },

  // Admin Content Management
  {
    path: 'admin/content',
    loadComponent: () => import('./features/content-management/content-management').then(m => m.ContentManagementComponent),
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

  // Teacher Dashboard
  {
    path: 'teacher/dashboard',
    loadComponent: () => import('./teacher/dashboard/dashboard.component').then(m => m.ContentManagementComponent),
    canActivate: [authGuard, () => inject(AuthService).hasRole('teacher')]
          ,  data: { hideHeader: true, hideFooter: true }

  },

  // Fallback route
  { path: '**', redirectTo: '' }
];
