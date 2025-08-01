import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private router: Router) {}

  // ✅ دالة تسجيل حساب جديد (Fake مبدئيًا)
  register(name: string, email: string, password: string) {
    const user = { name, email, password, role: 'student' }; // مبدئيًا الطالب فقط
    localStorage.setItem('user', JSON.stringify(user));
    alert('✅ تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن');
    this.router.navigate(['/auth/login']);
  }

  // ✅ دالة تسجيل الدخول
  login(email: string, password: string) {
    const userData = localStorage.getItem('user');

    if (!userData) {
      alert('⚠️ لا يوجد مستخدم مسجل! قم بإنشاء حساب أولاً');
      return;
    }

    const user = JSON.parse(userData);

    if (user.email === email && user.password === password) {
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('role', user.role);
      this.router.navigate(['/admin']);
    } else {
      alert('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
}
