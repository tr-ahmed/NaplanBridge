import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },

  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/terms/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'courses',
    loadComponent: () => import('./features/courses/courses.component').then(m => m.CoursesComponent)
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

  // Parent Dashboard
  {
    path: 'parent/dashboard',
    loadComponent: () => import('./features/students-list/students-list').then(m => m.StudentsListComponent),
    canActivate: [() => inject(AuthService).getPrimaryRole() === 'Parent']
  },

  // Student Dashboard and Routes
  {
    path: 'student',
    loadChildren: () => import('./student/student.routes').then(m => m.STUDENT_ROUTES)
  },

  // Admin Dashboard
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [() => inject(AuthService).getPrimaryRole() === 'Admin'  ]
  },



    // Admin Content Management
  {
    path: 'admin/content',
    loadComponent: () => import('./pages/content-management/content-management').then(m => m.ContentManagementComponent),
  },


  // Teacher Dashboard
  {
    path: 'teacher/dashboard',
    loadComponent: () => import('./teacher/dashboard/dashboard.component').then(m => m.ContentManagementComponent),
  },

{
  path: 'admin/subscriptions',
  loadComponent: () => import('./pages/subscriptions-admin/subscriptions-admin')
    .then(m => m.SubscriptionManagementComponent)
},


  // fallback
  { path: '**', redirectTo: '' }
];
