import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-newsletter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './newsletter.component.html',
  styleUrl: './newsletter.component.scss'
})
export class NewsletterComponent {
  private toastService = inject(ToastService);
  email: string = '';

  onSubmit() {
    if (this.email) {
      // Handle newsletter subscription logic here
      console.log('Newsletter subscription for:', this.email);

      // You can add your subscription logic here
      // For example: call a service to subscribe the user

      // Reset form after submission
      this.email = '';

      // Show success message
      this.toastService.showSuccess('Thank you for subscribing to our newsletter!');
    }
  }

  onTermsClick() {
    // Handle terms and conditions navigation
    console.log('Navigate to terms and conditions');
  }
}
