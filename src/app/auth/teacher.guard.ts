import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

/**
 * Teacher Guard
 * Checks if user is authenticated and has teacher role
 */
export const teacherGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if authenticated
  if (!authService.isAuthenticated()) {
    console.warn('⚠️ User not authenticated, redirecting to login');
    router.navigate(['/auth/login']);
    return false;
  }

  // Check if user has teacher role
  const hasTeacherRole = authService.hasRole('teacher');

  if (!hasTeacherRole) {
    console.warn('⚠️ User does not have teacher role');
    console.log('Current user:', authService.getCurrentUser());
    console.log('User roles:', authService.userRoles());
    router.navigate(['/']);
    return false;
  }

  console.log('✅ Teacher guard passed');
  return true;
};
