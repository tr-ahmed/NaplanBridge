import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  email = signal('');
  isVerifying = signal(false);
  isResending = signal(false);
  verificationSent = signal(false);
  verified = signal(false);
  error = signal('');

  ngOnInit(): void {
    // Get email from query params
    const email = this.route.snapshot.queryParams['email'];
    if (email) {
      this.email.set(email);
    }

    // Get token from query params (if coming from email)
    const token = this.route.snapshot.queryParams['token'];

    if (email && token) {
      // Auto-verify
      this.verifyEmail(token);
    }
  }

  verifyEmail(token: string): void {
    const email = this.email();
    if (!email) {
      this.error.set('Email address not found');
      return;
    }

    this.isVerifying.set(true);

    this.authService.verifyEmail({ email, token }).subscribe({
      next: (response) => {
        this.isVerifying.set(false);
        this.verified.set(true);
        this.toastService.showSuccess(response.message || 'Email verified successfully!');

        // Wait 2 seconds then navigate to login
        setTimeout(() => {
          this.router.navigate(['/auth/login'], {
            queryParams: { email: email }
          });
        }, 2000);
      },
      error: (error) => {
        this.isVerifying.set(false);
        const errorMessage = error.error?.message || 'Verification failed';
        this.error.set(errorMessage);
        this.toastService.showError(errorMessage);
      }
    });
  }

  resendVerificationEmail(): void {
    const email = this.email();
    if (!email) {
      this.toastService.showError('Please enter your email');
      return;
    }

    this.isResending.set(true);

    this.authService.resendVerificationEmail({ email }).subscribe({
      next: (response) => {
        this.isResending.set(false);
        this.verificationSent.set(true);
        this.error.set(''); // Clear any previous errors
        this.toastService.showSuccess(response.message || 'Verification email sent!');
      },
      error: (error) => {
        this.isResending.set(false);
        this.toastService.showError('Failed to send email');
      }
    });
  }
}
