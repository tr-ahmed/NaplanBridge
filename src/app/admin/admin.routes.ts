import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from '../auth/auth.guard';
import { roleGuard } from '../auth/role.guard';
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [roleGuard('admin')] // ✅ مسموح للأدمن فقط
  }
];
