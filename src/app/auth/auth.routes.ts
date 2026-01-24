import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { CheckEmailComponent } from './check-email/check-email.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';

// ✅ تعريف جميع المسارات الخاصة بالمصادقة (تسجيل الدخول + إنشاء حساب)
export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'check-email', component: CheckEmailComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' } // ✅ لو دخل على /auth بس يروح للـ Login
];
