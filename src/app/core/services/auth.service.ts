// auth.service.ts
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { ParentApiService } from './parent-api.service';
import { LoginRequest, ParentRegisterRequest, AuthResponse } from '../../models/auth.models';
import { jwtDecode } from 'jwt-decode';

/**
 * Interface for JWT Token Payload with custom claims
 */
interface JwtPayload {
  nameid: string;              // userId (GUID or int)
  unique_name: string;         // userName
  email?: string;              // email
  studentId?: string;          // ✅ Student.Id (from Students table) - for cart operations
  yearId?: string;             // ✅ Year.Id - for year filtering
  role: string | string[];     // user roles
  exp: number;                 // expiration timestamp
  iat?: number;                // issued at timestamp
  nbf?: number;                // not before timestamp
}

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
    const firstName = localStorage.getItem('firstName');
    const roles = localStorage.getItem('userRoles');
    const selectedRole = localStorage.getItem('selectedRole');
    const userId = localStorage.getItem('userId');
    const userProfile = localStorage.getItem('userProfile');
    let yearId = localStorage.getItem('yearId');
    let studentId = localStorage.getItem('studentId');

    if (token && userName && roles && userId && userProfile) {
      // ✅ Decode JWT token to extract studentId and yearId from claims
      try {
        const decoded = jwtDecode<JwtPayload>(token);

        // ✅ Override with values from token (source of truth)
        if (decoded.studentId) {
          studentId = decoded.studentId;
          localStorage.setItem('studentId', studentId);
        }

        if (decoded.yearId) {
          yearId = decoded.yearId;
          localStorage.setItem('yearId', yearId);
        }

        console.log('🔐 Decoded JWT Token:', {
          userId: decoded.nameid,
          userName: decoded.unique_name,
          studentId: decoded.studentId,
          yearId: decoded.yearId,
          roles: decoded.role
        });
      } catch (error) {
        console.error('❌ Failed to decode JWT token:', error);
      }

      const user: AuthResponse = {
        userName,
        firstName: firstName || '',
        token,
        roles: JSON.parse(roles),
        userId: parseInt(userId),
        userProfile: JSON.parse(userProfile),
        yearId: yearId ? parseInt(yearId) : undefined,
        studentId: studentId ? parseInt(studentId) : undefined
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
    // ✅ Decode JWT token to extract studentId and yearId
    try {
      const decoded = jwtDecode<JwtPayload>(user.token);

      // ✅ Extract studentId and yearId from token claims
      if (decoded.studentId) {
        user.studentId = parseInt(decoded.studentId);
      }

      // ✅ Override yearId from token if present (token is source of truth)
      if (decoded.yearId) {
        user.yearId = parseInt(decoded.yearId);
      }

      console.log('🔐 Decoded JWT Token:', {
        userId: decoded.nameid,
        userName: decoded.unique_name,
        studentId: decoded.studentId,
        yearId: decoded.yearId,
        roles: decoded.role
      });
    } catch (error) {
      console.error('❌ Failed to decode JWT token:', error);
    }

    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    this.userRoles.set(user.roles);

    this.currentUserSubject.next(user);

    localStorage.setItem('authToken', user.token);
    localStorage.setItem('userName', user.userName);
    localStorage.setItem('firstName', user.firstName); // Store firstName
    localStorage.setItem('userRoles', JSON.stringify(user.roles));

    // Store new authentication data from backend
    localStorage.setItem('userId', user.userId.toString());
    localStorage.setItem('userProfile', JSON.stringify(user.userProfile));

    // ✅ Store studentId for easy access (from token)
    if (user.studentId) {
      localStorage.setItem('studentId', user.studentId.toString());
    }

    // Store yearId for students
    if (user.yearId) {
      localStorage.setItem('yearId', user.yearId.toString());
    }
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
    localStorage.removeItem('firstName');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('selectedRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('yearId');
    localStorage.removeItem('studentId');  // ✅ Clear studentId on logout

    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Get current user ID from localStorage or current user
   */
  getUserId(): number | null {
    const currentUser = this.currentUser();
    if (currentUser && currentUser.userId) {
      return currentUser.userId;
    }

    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : null;
  }

  /**
   * Get current user profile
   */
  getUserProfile(): any | null {
    const currentUser = this.currentUser();
    if (currentUser && currentUser.userProfile) {
      return currentUser.userProfile;
    }

    const userProfile = localStorage.getItem('userProfile');
    return userProfile ? JSON.parse(userProfile) : null;
  }

  /**
   * Get student's year ID (for students only)
   */
  getYearId(): number | null {
    const currentUser = this.currentUser();
    if (currentUser && currentUser.yearId) {
      return currentUser.yearId;
    }

    const yearId = localStorage.getItem('yearId');
    return yearId ? parseInt(yearId) : null;
  }

  /**
   * Get student ID from JWT token
   * IMPORTANT: This is Student.Id (from Students table), NOT User.Id
   * Use this for API calls that require studentId parameter
   */
  getStudentId(): number | null {
    // First, try from current user (already decoded in setCurrentUser)
    const currentUser = this.currentUser();
    if (currentUser?.studentId) {
      return currentUser.studentId;
    }

    // Fallback: Decode token again
    const token = this.getToken();
    if (!token) {
      console.warn('⚠️ No auth token found');
      return null;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);

      if (decoded.studentId) {
        const studentId = parseInt(decoded.studentId);
        console.log('✅ Student.Id from token:', studentId);
        return studentId;
      }

      console.warn('⚠️ studentId claim not found in token');
      return null;
    } catch (error) {
      console.error('❌ Failed to decode token for studentId:', error);
      return null;
    }
  }

  hasRole(role: string): boolean {
    const roles = this.userRoles();
    return roles.some(userRole =>
      userRole.toLowerCase() === role.toLowerCase()
    );
  }

  /**
   * Get current user data (including decoded JWT claims)
   * Returns user object with all available information
   */
  getCurrentUser(): AuthResponse | null {
    // First, try from signal (most up-to-date)
    const user = this.currentUser();
    if (user) {
      return user;
    }

    // Fallback: reconstruct from localStorage
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const userRoles = localStorage.getItem('userRoles');
      const userName = localStorage.getItem('userName');
      const userId = localStorage.getItem('userId');

      return {
        token,
        userName: decoded.unique_name || userName || '',
        userId: parseInt(decoded.nameid || userId || '0'),
        roles: userRoles ? JSON.parse(userRoles) : [],
        studentId: decoded.studentId ? parseInt(decoded.studentId) : undefined,
        yearId: decoded.yearId ? parseInt(decoded.yearId) : undefined,
        userProfile: this.getUserProfile()
      } as AuthResponse;
    } catch (error) {
      console.error('❌ Error reconstructing user from token:', error);
      return null;
    }
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  getPrimaryRole(): string | null {
    const roles = this.userRoles() || [];
    if (!roles || roles.length === 0) return null;

    // Filter out Member role
    const filteredRoles = roles.filter(r => r?.toLowerCase() !== 'member');
    if (filteredRoles.length === 0) return null;

    // Role priority
    const rolePriority = ['admin', 'teacher', 'parent', 'student'];

    for (const priorityRole of rolePriority) {
      if (filteredRoles.some(userRole => userRole?.toLowerCase() === priorityRole)) {
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
        this.router.navigate(['/teacher/content-management']);
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

  /**
   * Request password reset - sends reset instructions to user's email
   * @param email User's email address
   */
  requestPasswordReset(email: string): Observable<{ success: boolean; message?: string }> {
    return this.parentApiService.requestPasswordReset(email).pipe(
      map(result => {
        if (result.success) {
          return { success: true, message: 'Reset instructions sent to your email' };
        } else {
          return { success: false, message: result.error };
        }
      })
    );
  }

  /**
   * Reset password with token and new password
   * @param email User's email
   * @param newPassword New password to set
   * @param token Reset token from email link
   */
  resetPassword(email: string, newPassword: string, token: string): Observable<{ success: boolean; message?: string }> {
    return this.parentApiService.resetPassword(email, newPassword, token).pipe(
      map(result => {
        if (result.success) {
          return { success: true, message: 'Password reset successfully' };
        } else {
          return { success: false, message: result.error };
        }
      })
    );
  }
}
