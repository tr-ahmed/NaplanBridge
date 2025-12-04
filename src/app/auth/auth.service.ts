import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { MockDataService } from '../core/services/mock-data.service';
import { ToastService } from '../core/services/toast.service';

interface LoginResponse {
  userName: string;
  token: string;
  roles: string[];
}

interface LoginRequest {
  identifier: string; // Can be email, username, or phone number
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStatusSubject = new BehaviorSubject<boolean>(this.hasToken());
  public authStatus$ = this.authStatusSubject.asObservable();
  private toastService = inject(ToastService);

  constructor(
    private router: Router,
    private http: HttpClient,
    private mockDataService: MockDataService
  ) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('authToken');
  }

  // ✅ Login method using API with mock fallback
  login(identifier: string, password: string, rememberMe = false): Observable<boolean> {
    // Determine role from identifier for mock data
    let mockRole = 'Student';
    if (identifier.includes('admin')) mockRole = 'Admin';
    else if (identifier.includes('teacher')) mockRole = 'Teacher';
    else if (identifier.includes('parent')) mockRole = 'Parent';

    // Create mock response
    const mockResponse: LoginResponse = this.mockDataService.getMockUser(mockRole);

    // If using mock mode only
    if (environment.useMock) {
      console.log('🎭 Using Mock Login (Mock Mode Enabled)');
      return this.mockDataService.mockSuccess(mockResponse, 1000).pipe(
        map((response: LoginResponse) => {
          this.storeAuthData(response, identifier, rememberMe);
          return true;
        })
      );
    }

    // Try API call with fallback to mock
    const loginData: LoginRequest = { identifier, password };
    const loginUrl = `${environment.apiBaseUrl}/Account/login`;



    const apiCall = this.http.post<LoginResponse>(loginUrl, loginData).pipe(
      timeout(environment.apiTimeout || 10000),
      map((response: LoginResponse) => {

        this.storeAuthData(response, identifier, rememberMe);
        return true;
      }),
      catchError((error) => {
        console.error('❌ API Login Failed:', error.message);

        // Check if fallback is enabled
        if (environment.enableMockFallback) {
          console.warn('⚠️ Falling back to Mock Data');
          return of(mockResponse).pipe(
            map((response: LoginResponse) => {
              this.storeAuthData(response, identifier, rememberMe);
              return true;
            })
          );
        }

        // No fallback, return error
        this.authStatusSubject.next(false);
        return of(false);
      })
    );

    return apiCall;
  }

  /**
   * Store authentication data
   */
  private storeAuthData(response: LoginResponse, identifier: string, rememberMe: boolean): void {
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('userName', response.userName);
    localStorage.setItem('roles', JSON.stringify(response.roles));

    // Extract user ID from token
    // 🔓 Decode token to extract user data
    try {
      const payload = JSON.parse(atob(response.token.split('.')[1]));



      const userData = {
        id: payload.nameid || payload.sub,  // User.Id (AspNetUsers.Id) for authentication
        studentId: payload.studentId ? parseInt(payload.studentId) : undefined,  // Student.Id for cart/orders
        userName: response.userName,
        identifier: identifier, // Store the identifier used for login
        roles: response.roles,
        role: response.roles, // Also store as 'role' for compatibility
        yearId: payload.yearId ? parseInt(payload.yearId) : undefined
      };

      if (!environment.production) {
        const isStudent = response.roles.includes('Student');
        if (isStudent) {

        } else {

        }
      }

      localStorage.setItem('currentUser', JSON.stringify(userData));
    } catch (e) {
      console.error('❌ Failed to parse token:', e);
      // Fallback: store basic user data
      localStorage.setItem('currentUser', JSON.stringify({
        id: null,
        userName: response.userName,
        identifier: identifier,
        roles: response.roles,
        role: response.roles
      }));
    }

    if (rememberMe) {
      localStorage.setItem('rememberedIdentifier', identifier);
    } else {
      localStorage.removeItem('rememberedIdentifier');
    }

    this.authStatusSubject.next(true);
    this.navigateBasedOnRole(response.roles);
  }

  // ✅ Navigate based on user role
  private navigateBasedOnRole(roles: string[]): void {
    if (roles.includes('Admin')) {
      this.router.navigate(['/admin/dashboard']);
    } else if (roles.includes('Teacher')) {
      this.router.navigate(['/teacher/content-management']);
    } else if (roles.includes('Parent')) {
      this.router.navigate(['/parent/dashboard']);
    } else {
      this.router.navigate(['/student/dashboard']);
    }
  }

  // ✅ Register a new account (keeping existing for now)
  register(user: {
    name: string;
    email: string;
    password: string;
    phone: string;
    age: number | null;
  }): void {
    const userData = {
      ...user,
      role: 'student'
    };

    localStorage.setItem('user', JSON.stringify(userData));
    this.toastService.showSuccess('Account created successfully! You can now log in.');
    this.router.navigate(['/auth/login']);
  }

  // ✅ Logout method
  logout(): void {
    localStorage.clear();
    this.authStatusSubject.next(false);
    this.router.navigate(['/auth/login']);
  }

  // ✅ Check if the user is authenticated
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  // ✅ Get current user role
  getRole(): string[] {
    const roles = localStorage.getItem('roles');
    return roles ? JSON.parse(roles) : [];
  }

  // ✅ Get current user name
  getUserName(): string | null {
    return localStorage.getItem('userName');
  }

  // ✅ Get current user data
  getCurrentUser(): any {
    // Always decode from JWT token first (most reliable source)
    const token = this.getToken();
    if (token) {
      try {
        const decoded = this.decodeToken(token);
        // Verify it's our application token, not Google OAuth token
        if (decoded && decoded.id && !decoded.iss?.includes('google')) {
          return decoded;
        }
      } catch (e) {
        console.warn('⚠️ Failed to decode token:', e);
      }
    }

    // Fallback: check localStorage currentUser
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        // Ignore Google OAuth tokens stored incorrectly
        if (parsed && !parsed.iss?.includes('google')) {
          return parsed;
        } else {
          console.warn('⚠️ Google OAuth token found in currentUser, removing...');
          localStorage.removeItem('currentUser');
        }
      } catch (e) {
        console.error('❌ Failed to parse currentUser:', e);
        localStorage.removeItem('currentUser');
      }
    }

    return null;
  }

  // ✅ Get authentication token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      const parsed = JSON.parse(decoded);

      // Reduced logging for cleaner console
      if (!environment.production) {
        console.log('🔓 User authenticated:', parsed.unique_name, '| Role:', parsed.role);
      }

      // 🎯 CRITICAL: Map JWT claims to user object
      // ⚠️ DO NOT confuse these IDs:
      // - id (nameid): User.Id from AspNetUsers → Use for authentication
      // - studentId: Student.Id from Students → Use for cart/orders

      const user = {
        id: parsed.nameid || parsed.sub,  // User.Id (authentication)
        studentId: parsed.studentId ? parseInt(parsed.studentId) : undefined,  // Student.Id (cart/orders)
        userName: parsed.unique_name || parsed.username,
        email: parsed.email,
        role: Array.isArray(parsed.role) ? parsed.role : [parsed.role],
        yearId: parsed.yearId ? parseInt(parsed.yearId) : undefined
      };

      // Only show warnings for Student role
      const isStudent = user.role.includes('Student');

      if (!environment.production) {
        // Detailed logging in development only
        if (isStudent) {
          console.log('🎓 Student logged in:', user.userName);
          if (!parsed.studentId) {
            console.warn('⚠️ studentId NOT found in token! Cart will not work.');
          }
          if (!parsed.yearId) {
            console.warn('⚠️ yearId NOT found in token! Year filtering disabled.');
          }
        } else {
          console.log('👤 User logged in:', user.userName, '| Role:', user.role.join(', '));
        }
      }

      return user;
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
      return null;
    }
  }

  // ✅ Get remembered email
  getRememberedEmail(): string | null {
    return localStorage.getItem('rememberedEmail');
  }
}
