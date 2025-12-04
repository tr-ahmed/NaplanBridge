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
    router.navigate(['/auth/login']);
    return false;
  }

  // Check if user has teacher role
  const hasTeacherRole = authService.hasRole('teacher');

  if (!hasTeacherRole) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
