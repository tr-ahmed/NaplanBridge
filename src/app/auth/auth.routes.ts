import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

// ✅ تعريف جميع المسارات الخاصة بالمصادقة (تسجيل الدخول + إنشاء حساب)
export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' } // ✅ لو دخل على /auth بس يروح للـ Login
];
