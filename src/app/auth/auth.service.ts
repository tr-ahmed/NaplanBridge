import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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
    private http: HttpClient
  ) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  // ✅ Login method using API
  login(email: string, password: string, rememberMe = false): Observable<boolean> {
    const loginData: LoginRequest = { email, password };

    return this.http.post<LoginResponse>('/api/Account/login', loginData).pipe(
      map((response: LoginResponse) => {
        // Store authentication data
        localStorage.setItem('token', response.token);
        localStorage.setItem('userName', response.userName);
        localStorage.setItem('roles', JSON.stringify(response.roles));
        localStorage.setItem('currentUser', JSON.stringify({
          userName: response.userName,
          email: email,
          roles: response.roles
        }));

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Update auth status
        this.authStatusSubject.next(true);

        // Navigate based on user role
        this.navigateBasedOnRole(response.roles);

        return true; // Return success
      }),
      catchError((error) => {
        console.error('Login failed:', error);
        this.authStatusSubject.next(false);
        return of(false);
      })
    );
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
    return userData ? JSON.parse(userData) : null;
  }

  // ✅ Get remembered email
  getRememberedEmail(): string | null {
    return localStorage.getItem('rememberedEmail');
  }
}
