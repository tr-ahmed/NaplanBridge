import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private router: Router) {}

  // ✅ Register a new account
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

  // ✅ Login method
  login(email: string, password: string, rememberMe = false): boolean {
    const userData = localStorage.getItem('user');

    if (!userData) {
      alert('⚠️ No registered user found! Please sign up first.');
      return false;
    }

    const user = JSON.parse(userData);

    if (user.email === email && user.password === password) {
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('role', user.role);
      localStorage.setItem('currentUser', JSON.stringify(user));

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      this.router.navigate(['/home']);
      return true;
    } else {
      return false;
    }
  }

  // ✅ Logout method
  logout(): void {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }

  // ✅ Check if the user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // ✅ Get current user role
  getRole(): string | null {
    return localStorage.getItem('role');
  }
}
