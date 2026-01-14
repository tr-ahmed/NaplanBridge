import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-check-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './check-email.component.html',
  styleUrl: './check-email.component.scss'
})
export class CheckEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  email = signal<string>('');
  type = signal<string>('registration'); // 'registration' or 'password-reset'
  isResending = signal<boolean>(false);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email.set(params['email'] || '');
      this.type.set(params['type'] || 'registration');

      // If no email provided, redirect to login
      if (!this.email()) {
        this.toastService.showWarning('Email address not found');
        this.router.navigate(['/auth/login']);
      }
    });
  }

  /**
   * Resend verification email
   */
  resendEmail(): void {
    if (!this.email()) {
      this.toastService.showError('Email address not found');
      return;
    }

    if (this.type() === 'registration') {
      this.isResending.set(true);

      this.authService.resendVerificationEmail({ email: this.email() }).subscribe({
        next: (response) => {
          this.isResending.set(false);
          this.toastService.showSuccess(
            response.message || 'Verification email resent! Please check your inbox.',
            8000
          );
        },
        error: (error) => {
          this.isResending.set(false);
          this.toastService.showError(
            error.error?.message || 'Failed to resend verification email. Please try again.',
            5000
          );
        }
      });
    }
  }

  /**
   * Navigate to login page
   */
  goToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { email: this.email() }
    });
  }
}
