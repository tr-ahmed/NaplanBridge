import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true; // ✅ User is authenticated
  } else {
    console.warn('User not authenticated, redirecting to login');
    router.navigate(['/auth/login']); // ✅ Redirect to login
    return false;
  }
};
