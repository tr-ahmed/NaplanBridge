import { Routes } from '@angular/router';
import { ContentManagementComponent } from './dashboard/dashboard.component';
import { roleGuard } from '../auth/role.guard';

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    component: ContentManagementComponent,
    canActivate: [roleGuard('teacher')] // Only teachers allowed
  }
];
