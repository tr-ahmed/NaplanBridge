import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from '../auth/auth.guard';
import { roleGuard } from '../auth/role.guard';
// ✅ تعريف جميع المسارات الخاصة بالوالدين

export const PARENT_ROUTES: Routes = [
  { path: '', component: DashboardComponent, canActivate: [authGuard] }
];
