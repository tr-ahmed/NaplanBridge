// role-selection.guard.ts
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleSelectionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Redirect to login if not authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // If user has only one non-Member role, redirect directly
    const roles = this.authService.userRoles();
    const nonMemberRoles = roles.filter(role => role.toLowerCase() !== 'member');
    
    if (nonMemberRoles.length === 1) {
      this.authService.selectUserRole(nonMemberRoles[0]);
      return false;
    }

    // If user already selected a role, redirect to dashboard
    if (this.authService.isRoleSelected()) {
      const selectedRole = this.authService.selectedRole();
      if (selectedRole) {
        this.authService.navigateToDashboard(selectedRole);
        return false;
      }
    }

    // Allow access to role selection page
    return true;
  }
}