/**
 * Subscription Guard
 * Checks if student has active subscription to access content
 * For Teachers: Checks if teacher has permission for the subject
 * Based on Backend API Access Control
 */

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, catchError, of, switchMap } from 'rxjs';
import { SubscriptionService } from '../services/subscription.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../services/toast.service';
import { LessonsService } from '../services/lessons.service';
import { TeacherContentService } from '../services/teacher-content.service';

export const subscriptionGuard: CanActivateFn = (route, state) => {
  const subscriptionService = inject(SubscriptionService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const lessonsService = inject(LessonsService);
  const teacherContentService = inject(TeacherContentService);

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

  // Get user roles
  const userRoles = currentUser.roles || currentUser.role || [];
  const rolesArray = Array.isArray(userRoles) ? userRoles : [userRoles];

  // Admin has full access
  if (rolesArray.some((r: string) => ['Admin', 'admin'].includes(r))) {
    console.log('✅ Subscription guard: Admin access granted');
    return true;
  }

  // Teacher: Check if they have permission for the subject
  if (rolesArray.some((r: string) => ['Teacher', 'teacher'].includes(r))) {
    console.log('🔒 Subscription guard: Checking teacher access for', contentType, contentId);

    // For lessons, we need to get the lesson's subject first
    if (contentType === 'lesson') {
      return lessonsService.getLessonById(parseInt(contentId)).pipe(
        switchMap((lesson: any) => {
          // Try to get subjectId from multiple possible locations
          const subjectId = lesson?.subjectId || lesson?.termId;

          if (!lesson) {
            console.error('❌ Lesson not found');
            toastService.showError('Lesson not found');
            router.navigate(['/teacher/dashboard']);
            return of(false);
          }

          // If no subjectId, allow access - backend will validate
          if (!subjectId) {
            console.log('⚠️ No subjectId found in lesson, allowing access (backend will validate)');
            return of(true);
          }

          // Check if teacher has permission for this subject
          return teacherContentService.getMySubjects().pipe(
            map(subjectIds => {
              const hasAccess = subjectIds.includes(subjectId);
              if (hasAccess) {
                console.log('✅ Teacher has access to subject:', subjectId);
                return true;
              } else {
                console.warn('❌ Teacher does not have access to subject:', subjectId);
                toastService.showWarning('You do not have permission to access this lesson');
                router.navigate(['/teacher/dashboard']);
                return false;
              }
            }),
            catchError(error => {
              console.error('Error checking teacher subjects:', error);
              // Allow access - backend will do final validation
              return of(true);
            })
          );
        }),
        catchError(error => {
          // If we get 403 from backend, it means no access
          if (error.status === 403) {
            toastService.showWarning(error.error?.message || 'You do not have permission to access this lesson');
            router.navigate(['/teacher/dashboard']);
            return of(false);
          }
          console.error('Error loading lesson for teacher check:', error);
          // Allow access - backend will do final validation
          return of(true);
        })
      );
    }

    // For subjects, check directly
    if (contentType === 'subject') {
      return teacherContentService.getMySubjects().pipe(
        map(subjectIds => {
          const hasAccess = subjectIds.includes(parseInt(contentId));
          if (hasAccess) {
            console.log('✅ Teacher has access to subject:', contentId);
            return true;
          } else {
            console.warn('❌ Teacher does not have access to subject:', contentId);
            toastService.showWarning('You do not have permission to access this subject');
            router.navigate(['/teacher/dashboard']);
            return false;
          }
        }),
        catchError(error => {
          console.error('Error checking teacher subjects:', error);
          // Allow access - backend will do final validation
          return of(true);
        })
      );
    }

    // For other content types, allow access (backend will validate)
    console.log('✅ Teacher access granted (backend will validate)');
    return true;
  }

  // Get student ID - try multiple sources
  const studentId = currentUser.studentId || currentUser.id;

  if (!studentId) {
    console.error('Subscription guard: No studentId found');
    toastService.showError('Unable to verify access. Please try again.');
    router.navigate(['/']);
    return false;
  }

  console.log('🔒 Subscription guard checking access:', { contentType, contentId, studentId });

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
