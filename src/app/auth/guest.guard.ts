/**
 * Guest Guard
 * Prevents authenticated users from accessing login/registration pages
 * Redirects to dashboard based on their role
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true; // ✅ User is not authenticated, allow access to login/register
  } else {
    // User is already logged in, redirect to appropriate dashboard
    const user = authService.getCurrentUser();
    
    switch (user?.role) {
      case 'Admin':
        router.navigate(['/admin/dashboard']);
        break;
      case 'Teacher':
        router.navigate(['/teacher/dashboard']);
        break;
      case 'Student':
        router.navigate(['/student/dashboard']);
        break;
      case 'Parent':
        router.navigate(['/parent/dashboard']);
        break;
      default:
        router.navigate(['/']);
    }
    
    return false; // ❌ Prevent access to login/register
  }
};
