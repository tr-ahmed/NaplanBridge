import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'lessons',
    loadComponent: () => import('./lessons/lessons.component').then(m => m.LessonsComponent)
  },
  {
    path: 'lessons/:id',
    loadComponent: () => import('./lesson-detail/lesson-detail.component').then(m => m.LessonDetailComponent)
  }
];
