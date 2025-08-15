import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { ParentApiService } from './parent-api.service';
import { LoginRequest, ParentRegisterRequest, AuthResponse } from '../../models/auth.models';

/**
 * Enhanced authentication service that handles login, registration, and user state
 */
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

  constructor(
    private parentApiService: ParentApiService,
    private router: Router
  ) {
    // Initialize authentication state from localStorage
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state from stored data
   */
  private initializeAuthState(): void {
    const token = localStorage.getItem('authToken');
    const userName = localStorage.getItem('userName');
    const roles = localStorage.getItem('userRoles');

    if (token && userName && roles) {
      const user: AuthResponse = {
        userName,
        token,
        roles: JSON.parse(roles)
      };

      this.setCurrentUser(user);
    }
  }

  /**
   * Login with email and password
   */
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

  /**
   * Register a new parent account
   */
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

  /**
   * Set the current authenticated user
   */
  private setCurrentUser(user: AuthResponse): void {
    // Update signals
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    this.userRoles.set(user.roles);

    // Update BehaviorSubject for observables
    this.currentUserSubject.next(user);

    // Store in localStorage
    localStorage.setItem('authToken', user.token);
    localStorage.setItem('userName', user.userName);
    localStorage.setItem('userRoles', JSON.stringify(user.roles));
  }

  /**
   * Logout the current user
   */
  logout(): void {
    // Clear signals
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.userRoles.set([]);

    // Clear BehaviorSubject
    this.currentUserSubject.next(null);

    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRoles');

    // Navigate to login
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get the current authentication token
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    const roles = this.userRoles();
    return roles.some(userRole =>
      userRole.toLowerCase() === role.toLowerCase()
    );
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Get user's primary role for navigation purposes
   */
getPrimaryRole(): string | null {
  const roles = this.userRoles() || [];
  if (!roles || roles.length === 0) return null;

  // فلترة Member
  const filteredRoles = roles.filter(r => r.toLowerCase() !== 'member');
  if (filteredRoles.length === 0) return null;

  // أولوية الأدوار
  const rolePriority = ['admin', 'teacher', 'parent', 'student'];

  for (const priorityRole of rolePriority) {
    if (filteredRoles.some(userRole => userRole.toLowerCase() === priorityRole)) {
      return priorityRole.charAt(0).toUpperCase() + priorityRole.slice(1); // Admin, Teacher, ...
    }
  }

  // fallback → لو فيه أي رول غريب
  return filteredRoles[0];
}


  /**
   * Navigate user to appropriate dashboard based on their role
   */
  navigateToUserDashboard(): void {
    const primaryRole = this.getPrimaryRole();

    switch (primaryRole) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'teacher':
        this.router.navigate(['/teacher/dashboard']);
        break;
      case 'parent':
        this.router.navigate(['/students']);
        break;
      case 'student':
        this.router.navigate(['/student/dashboard']);
        break;
      default:
        this.router.navigate(['/home']);
        break;
    }
  }

  /**
   * Refresh authentication token (if refresh endpoint exists)
   */
  refreshToken(): Observable<boolean> {
    // TODO: Implement token refresh when API endpoint is available
    // For now, return false to indicate refresh not available
    return new Observable(observer => {
      observer.next(false);
      observer.complete();
    });
  }

  /**
   * Check if the current token is expired (basic check)
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Basic JWT token expiration check
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp < currentTime;
    } catch (error) {
      // If we can't parse the token, consider it expired
      return true;
    }
  }
}
