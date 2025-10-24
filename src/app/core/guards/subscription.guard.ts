/**
 * Subscription Guard
 * Checks if student has active subscription to access content
 * Based on Backend API Access Control
 */

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, catchError, of } from 'rxjs';
import { SubscriptionService } from '../services/subscription.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../services/toast.service';

export const subscriptionGuard: CanActivateFn = (route, state) => {
  const subscriptionService = inject(SubscriptionService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  // Get current user
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    toastService.showError('Please login to access this content');
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Get content type and ID from route params
  const contentType = route.data['contentType'] as 'subject' | 'term' | 'lesson' | 'exam';
  const contentId = route.params['id'];

  if (!contentType || !contentId) {
    console.error('Subscription guard: Missing contentType or contentId');
    return true; // Allow access if configuration is missing
  }

  // For non-student roles, allow access
  const userRoles = currentUser.roles || [];
  if (userRoles.includes('Admin') || userRoles.includes('Teacher')) {
    return true;
  }

  // Get student ID (for students, use current user ID; for parents, they can't directly access)
  const studentId = currentUser.id; // Adjust based on your user model

  // Check access based on content type
  let accessCheck$;

  switch (contentType) {
    case 'subject':
      accessCheck$ = subscriptionService.hasAccessToSubject(studentId, parseInt(contentId));
      break;
    case 'term':
      accessCheck$ = subscriptionService.hasAccessToTerm(studentId, parseInt(contentId));
      break;
    case 'lesson':
      accessCheck$ = subscriptionService.hasAccessToLesson(studentId, parseInt(contentId));
      break;
    case 'exam':
      accessCheck$ = subscriptionService.hasAccessToExam(studentId, parseInt(contentId));
      break;
    default:
      return true;
  }

  return accessCheck$.pipe(
    map(response => {
      if (response.hasAccess) {
        return true;
      } else {
        // Show message and redirect to subscription plans
        const reason = response.reason || 'You need an active subscription to access this content';
        toastService.showWarning(reason);

        router.navigate(['/subscriptions'], {
          queryParams: {
            returnUrl: state.url,
            contentType: contentType,
            contentId: contentId
          }
        });

        return false;
      }
    }),
    catchError(error => {
      console.error('Error checking subscription access:', error);
      toastService.showError('Unable to verify subscription. Please try again.');
      router.navigate(['/']);
      return of(false);
    })
  );
};
