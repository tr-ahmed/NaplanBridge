import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  verifying = signal(false);
  verified = signal(false);
  error = signal('');
  email = signal('');

  ngOnInit(): void {
    const email = this.route.snapshot.queryParams['email'];
    const token = this.route.snapshot.queryParams['token'];

    if (email && token) {
      this.email.set(email);
      this.verifyEmail(email, token);
    } else {
      this.error.set('Invalid verification link. Please check your email and try again.');
    }
  }

  verifyEmail(email: string, token: string): void {
    this.verifying.set(true);

    this.authService.verifyEmail({ email, token }).subscribe({
      next: (response) => {
        this.verifying.set(false);
        this.verified.set(true);
        this.toastService.showSuccess(response.message || 'Email verified successfully!');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login'], {
            queryParams: { email: email }
          });
        }, 3000);
      },
      error: (error) => {
        this.verifying.set(false);
        const errorMessage = error.error?.message || 'Failed to verify email. Please try again.';
        this.error.set(errorMessage);
        this.toastService.showError(errorMessage);
      }
    });
  }

  resendVerification(): void {
    const email = this.email();

    if (!email) {
      this.toastService.showError('Email address not found');
      return;
    }

    this.authService.resendVerificationEmail({ email }).subscribe({
      next: (response) => {
        this.toastService.showSuccess(response.message || 'Verification email sent!');
      },
      error: (error) => {
        this.toastService.showError('Failed to send verification email');
      }
    });
  }
}
