// auth.service.ts
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { ParentApiService } from './parent-api.service';
import { LoginRequest, ParentRegisterRequest, AuthResponse } from '../../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Signals for reactive authentication state
  isAuthenticated = signal(false);
  currentUser = signal<AuthResponse | null>(null);
  userRoles = signal<string[]>([]);

  // Role selection signals
  isRoleSelected = signal(false);
  selectedRole = signal<string | null>(null);

  constructor(
    private parentApiService: ParentApiService,
    private router: Router
  ) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const token = localStorage.getItem('authToken');
    const userName = localStorage.getItem('userName');
    const roles = localStorage.getItem('userRoles');
    const selectedRole = localStorage.getItem('selectedRole');

    if (token && userName && roles) {
      const user: AuthResponse = {
        userName,
        token,
        roles: JSON.parse(roles)
      };

      this.setCurrentUser(user);

      // Initialize role selection state
      if (selectedRole) {
        this.selectedRole.set(selectedRole);
        this.isRoleSelected.set(true);
      }
    }
  }

  login(loginRequest: LoginRequest): Observable<{ success: boolean; message?: string }> {
    return this.parentApiService.login(loginRequest).pipe(
      map(result => {
        if (result.success) {
          this.setCurrentUser(result.data);
          return { success: true };
        } else {
          return { success: false, message: result.error };
        }
      })
    );
  }

  register(registerRequest: ParentRegisterRequest): Observable<{ success: boolean; message?: string }> {
    return this.parentApiService.registerParent(registerRequest).pipe(
      map(result => {
        if (result.success) {
          this.setCurrentUser(result.data);
          return { success: true };
        } else {
          return { success: false, message: result.error };
        }
      })
    );
  }

  private setCurrentUser(user: AuthResponse): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    this.userRoles.set(user.roles);

    this.currentUserSubject.next(user);

    localStorage.setItem('authToken', user.token);
    localStorage.setItem('userName', user.userName);
    localStorage.setItem('userRoles', JSON.stringify(user.roles));
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.userRoles.set([]);
    this.selectedRole.set(null);
    this.isRoleSelected.set(false);

    this.currentUserSubject.next(null);

    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('selectedRole');

    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  hasRole(role: string): boolean {
    const roles = this.userRoles();
    return roles.some(userRole =>
      userRole.toLowerCase() === role.toLowerCase()
    );
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  getPrimaryRole(): string | null {
    const roles = this.userRoles() || [];
    if (!roles || roles.length === 0) return null;

    // Filter out Member role
    const filteredRoles = roles.filter(r => r.toLowerCase() !== 'member');
    if (filteredRoles.length === 0) return null;

    // Role priority
    const rolePriority = ['admin', 'teacher', 'parent', 'student'];

    for (const priorityRole of rolePriority) {
      if (filteredRoles.some(userRole => userRole.toLowerCase() === priorityRole)) {
        return priorityRole.charAt(0).toUpperCase() + priorityRole.slice(1);
      }
    }

    // Fallback to first available role
    return filteredRoles[0];
  }

  selectUserRole(role: string): void {
    if (!this.hasRole(role)) {
      throw new Error('User does not have this role');
    }

    this.selectedRole.set(role);
    this.isRoleSelected.set(true);
    localStorage.setItem('selectedRole', role);

    this.navigateToDashboard(role);
  }

   navigateToDashboard(role: string): void {
    switch(role.toLowerCase()) {
      case 'admin':
        this.router.navigate(['/admin/users']);
        break;
      case 'teacher':
        this.router.navigate(['/teacher/dashboard']);
        break;
      case 'parent':
        this.router.navigate(['/parent/dashboard']);
        break;
      case 'student':
        this.router.navigate(['/student/dashboard']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }
// Add this method to your AuthService
navigateToUserDashboard(): void {
  // If user already selected a role, use that
  if (this.isRoleSelected() && this.selectedRole()) {
    this.navigateToDashboard(this.selectedRole()!);
    return;
  }

  // Otherwise, determine primary role and navigate
  const primaryRole = this.getPrimaryRole();
  if (primaryRole) {
    this.navigateToDashboard(primaryRole.toLowerCase());
  } else {
    // Fallback for users with only Member role or no roles
    this.router.navigate(['/home']);
  }
}
  refreshToken(): Observable<boolean> {
    return new Observable(observer => {
      observer.next(false);
      observer.complete();
    });
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
}
