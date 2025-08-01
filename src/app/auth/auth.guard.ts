import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true; // ✅ مسموح يدخل
  } else {
    router.navigate(['/auth/login']); // ✅ رجّعه لتسجيل الدخول
    return false;
  }
};
