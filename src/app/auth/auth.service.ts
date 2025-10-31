import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { MockDataService } from '../core/services/mock-data.service';

interface LoginResponse {
  userName: string;
  token: string;
  roles: string[];
}

interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStatusSubject = new BehaviorSubject<boolean>(this.hasToken());
  public authStatus$ = this.authStatusSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient,
    private mockDataService: MockDataService
  ) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('authToken');
  }

  // ✅ Login method using API with mock fallback
  login(email: string, password: string, rememberMe = false): Observable<boolean> {
    // Determine role from email for mock data
    let mockRole = 'Student';
    if (email.includes('admin')) mockRole = 'Admin';
    else if (email.includes('teacher')) mockRole = 'Teacher';
    else if (email.includes('parent')) mockRole = 'Parent';

    // Create mock response
    const mockResponse: LoginResponse = this.mockDataService.getMockUser(mockRole);

    // If using mock mode only
    if (environment.useMock) {
      console.log('🎭 Using Mock Login (Mock Mode Enabled)');
      return this.mockDataService.mockSuccess(mockResponse, 1000).pipe(
        map((response: LoginResponse) => {
          this.storeAuthData(response, email, rememberMe);
          return true;
        })
      );
    }

    // Try API call with fallback to mock
    const loginData: LoginRequest = { email, password };
    const loginUrl = `${environment.apiBaseUrl}/Account/login`;

    console.log('🔍 Attempting API Login...');
    console.log('API URL:', loginUrl);

    const apiCall = this.http.post<LoginResponse>(loginUrl, loginData).pipe(
      timeout(environment.apiTimeout || 10000),
      map((response: LoginResponse) => {
        console.log('✅ API Login Successful');
        this.storeAuthData(response, email, rememberMe);
        return true;
      }),
      catchError((error) => {
        console.error('❌ API Login Failed:', error.message);

        // Check if fallback is enabled
        if (environment.enableMockFallback) {
          console.warn('⚠️ Falling back to Mock Data');
          return of(mockResponse).pipe(
            map((response: LoginResponse) => {
              this.storeAuthData(response, email, rememberMe);
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
  private storeAuthData(response: LoginResponse, email: string, rememberMe: boolean): void {
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('userName', response.userName);
    localStorage.setItem('roles', JSON.stringify(response.roles));

    // Extract user ID from token
    // 🔓 Decode token to extract user data
    try {
      const payload = JSON.parse(atob(response.token.split('.')[1]));
      
      console.log('🔓 Decoding JWT Token...');
      console.log('📦 Raw token payload:', payload);
      
      const userData = {
        id: payload.nameid || payload.sub,  // User.Id (AspNetUsers.Id) for authentication
        studentId: payload.studentId ? parseInt(payload.studentId) : undefined,  // Student.Id for cart/orders
        userName: response.userName,
        email: email,
        roles: response.roles,
        role: response.roles, // Also store as 'role' for compatibility
        yearId: payload.yearId ? parseInt(payload.yearId) : undefined
      };
      
      console.log('✅ Mapped user object:', userData);
      console.log('🆔 User.Id (nameid):', userData.id, '- Use for authentication');
      console.log('🎓 Student.Id (studentId):', userData.studentId, '- Use for cart/orders');
      
      if (!userData.studentId && response.roles.includes('Student')) {
        console.warn('⚠️ Student role but no studentId in token! Cart may not work.');
      }
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
    } catch (e) {
      console.error('❌ Failed to parse token:', e);
      // Fallback: store basic user data
      localStorage.setItem('currentUser', JSON.stringify({
        id: null,
        userName: response.userName,
        email: email,
        roles: response.roles,
        role: response.roles
      }));
    }

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    this.authStatusSubject.next(true);
    this.navigateBasedOnRole(response.roles);
  }

  // ✅ Navigate based on user role
  private navigateBasedOnRole(roles: string[]): void {
    if (roles.includes('Admin')) {
      this.router.navigate(['/admin/dashboard']);
    } else if (roles.includes('Teacher')) {
      this.router.navigate(['/teacher/dashboard']);
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
    alert('✅ Account created successfully! You can now log in.');
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
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      return JSON.parse(userData);
    }

    // Fallback: decode token to get user data
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      return decoded;
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

      console.log('🔓 Decoding JWT Token...');
      console.log('📦 Raw token payload:', parsed);
      console.log('🔑 Token claims:', {
        'nameid (User.Id)': parsed.nameid,
        'studentId (Student.Id)': parsed.studentId,
        'unique_name': parsed.unique_name,
        'email': parsed.email,
        'role': parsed.role,
        'yearId': parsed.yearId,
        'hasStudentId': 'studentId' in parsed,
        'hasYearId': 'yearId' in parsed
      });

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

      console.log('✅ Mapped user object:', user);
      console.log('🆔 User.Id (nameid):', user.id, '→ Use for authentication');
      console.log('🎓 Student.Id (studentId):', user.studentId, '→ Use for cart/orders');

      if (parsed.studentId) {
        console.log('✅ studentId claim found:', parsed.studentId);
      } else {
        console.warn('⚠️ studentId NOT found in token! Cart will not work for students.');
      }

      if (!parsed.yearId) {
        console.warn('⚠️ yearId NOT found in token! Year filtering disabled.');
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
