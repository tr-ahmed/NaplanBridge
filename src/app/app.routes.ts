import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.routes').then(m => m.AUTH_ROUTES),
  },





  
  {
    path: 'student',
    loadChildren: () =>
      import('./student/student.routes').then(m => m.STUDENT_ROUTES),
  },
  {
    path: 'parent',
    loadChildren: () =>
      import('./parent/parent.routes').then(m => m.PARENT_ROUTES),
  },
  {
    path: 'teacher',
    loadChildren: () =>
      import('./teacher/teacher.routes').then(m => m.TEACHER_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' }
];
