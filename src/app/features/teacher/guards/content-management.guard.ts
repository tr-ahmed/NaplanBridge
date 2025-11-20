import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TeacherPermissionService } from '../services/teacher-permission.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Guard to check if teacher has permission to manage content for a subject
 */
@Injectable({
  providedIn: 'root'
})
export class ContentManagementGuard {
  private router = inject(Router);
  private permissionService = inject(TeacherPermissionService);
  private toastService = inject(ToastService);

  canActivate = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
    const subjectId = route.queryParams['subjectId'];

    if (!subjectId) {
      this.toastService.showWarning('يرجى اختيار مادة');
      this.router.navigate(['/teacher/content']);
      return false;
    }

    // Get current teacher ID (from localStorage)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const teacherId = user?.id;

    if (!teacherId) {
      this.toastService.showError('يرجى تسجيل الدخول');
      this.router.navigate(['/login']);
      return false;
    }

    // Check permission
    this.permissionService.checkPermission(teacherId, subjectId, 'create')
      .subscribe(
        (response) => {
          if (!response.data) {
            this.toastService.showError('ليس لديك صلاحية للوصول لهذه المادة');
            this.router.navigate(['/teacher/content']);
          }
        },
        (error) => {
          console.error('Error checking permission:', error);
          this.router.navigate(['/teacher/content']);
        }
      );

    return true;
  };
}

/**
 * Guard for Admin access - only admin can access teacher assignment page
 */
export const AdminGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const toastService = inject(ToastService);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (user?.role !== 'Admin' && user?.role !== 'SuperAdmin') {
    toastService.showError('ليس لديك صلاحية للوصول لهذه الصفحة');
    router.navigate(['/']);
    return false;
  }

  return true;
};

/**
 * Guard for Teacher access
 */
export const TeacherGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const toastService = inject(ToastService);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (user?.role !== 'Teacher' && user?.role !== 'Admin') {
    toastService.showError('يجب أن تكون معلماً للوصول لهذه الصفحة');
    router.navigate(['/']);
    return false;
  }

  return true;
};
