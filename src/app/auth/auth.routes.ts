import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

// ✅ تعريف جميع المسارات الخاصة بالمصادقة (تسجيل الدخول + إنشاء حساب)
export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' } // ✅ لو دخل على /auth بس يروح للـ Login
];
