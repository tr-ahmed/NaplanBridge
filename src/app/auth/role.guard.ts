import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

export function roleGuard(expectedRole: string): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.hasRole(expectedRole)) {
      return true;
    }

    router.navigate(['/auth/login']);
    return false;
  };
}

/**
 * Guard that allows access if user has any of the specified roles
 */
export function roleGuardAny(expectedRoles: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.hasAnyRole(expectedRoles)) {
      return true;
    }

    router.navigate(['/auth/login']);
    return false;
  };
}
