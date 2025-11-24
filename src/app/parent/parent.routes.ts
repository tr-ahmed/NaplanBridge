import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from '../auth/auth.guard';
import { roleGuard } from '../auth/role.guard';
// Define all parent routes

export const PARENT_ROUTES: Routes = [
  { path: '', component: DashboardComponent, canActivate: [authGuard] }
];
