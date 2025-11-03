/**
 * Payment Cancel Component
 * Shown when user cancels payment or payment fails
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-cancel.component.html',
  styleUrl: './payment-cancel.component.scss'
})
export class PaymentCancelComponent {
  private router = inject(Router);

  /**
   * Go back to cart
   */
  backToCart(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Try checkout again
   */
  tryAgain(): void {
    this.router.navigate(['/checkout']);
  }

  /**
   * Go to home
   */
  goHome(): void {
    this.router.navigate(['/']);
  }
}
