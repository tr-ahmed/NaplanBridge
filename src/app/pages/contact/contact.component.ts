import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  contactForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;

  contactInfo = [
    {
      icon: 'fas fa-envelope',
      title: 'Email',
      value: 'support@naplanbridge.com',
      link: 'mailto:support@naplanbridge.com'
    },
    {
      icon: 'fas fa-phone',
      title: 'Phone',
      value: '+61 2 1234 5678',
      link: 'tel:+61212345678'
    },
    {
      icon: 'fas fa-map-marker-alt',
      title: 'Address',
      value: 'Sydney, NSW, Australia',
      link: null
    },
    {
      icon: 'fas fa-clock',
      title: 'Business Hours',
      value: 'Mon - Fri: 9AM - 6PM AEST',
      link: null
    }
  ];

  reasons = [
    'General Inquiry',
    'Technical Support',
    'Course Information',
    'Billing Question',
    'Partnership Opportunity',
    'Report a Problem',
    'Other'
  ];

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      subject: ['', Validators.required],
      reason: ['General Inquiry', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitSuccess = false;
      this.submitError = false;

      // Simulate API call
      setTimeout(() => {
        console.log('Contact Form Submitted:', this.contactForm.value);
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.contactForm.reset({
          reason: 'General Inquiry'
        });

        // Hide success message after 5 seconds
        setTimeout(() => {
          this.submitSuccess = false;
        }, 5000);
      }, 1500);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'This field is required';
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('minLength')) {
      const minLength = field.errors?.['minlength']?.requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    return '';
  }
}
