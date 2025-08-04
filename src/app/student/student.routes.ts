import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { roleGuard } from '../auth/role.guard';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [roleGuard('student')]
  }
];
