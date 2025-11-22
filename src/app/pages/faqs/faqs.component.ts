import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FAQ {
  question: string;
  answer: string;
  category: string;
  isOpen?: boolean;
}

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faqs.component.html',
  styleUrls: ['./faqs.component.scss']
})
export class FaqsComponent {
  categories = ['All', 'General', 'Courses', 'Payment', 'Technical', 'Account'];
  selectedCategory = 'All';

  faqs: FAQ[] = [
    // General
    {
      category: 'General',
      question: 'What is NAPLAN Bridge?',
      answer: 'NAPLAN Bridge is an online learning platform designed to help students prepare for their NAPLAN assessments. We provide comprehensive courses, practice tests, and personalized learning paths to ensure student success.',
      isOpen: false
    },
    {
      category: 'General',
      question: 'How does NAPLAN Bridge work?',
      answer: 'Students can enroll in courses, access video lessons, complete interactive exercises, take practice tests, and track their progress through our intuitive dashboard. Our platform adapts to each student\'s learning pace and style.',
      isOpen: false
    },
    {
      category: 'General',
      question: 'Who can use NAPLAN Bridge?',
      answer: 'NAPLAN Bridge is designed for students in Years 3, 5, 7, and 9 who are preparing for NAPLAN assessments. Parents and teachers can also create accounts to monitor student progress.',
      isOpen: false
    },

    // Courses
    {
      category: 'Courses',
      question: 'What subjects do you cover?',
      answer: 'We cover all NAPLAN assessment areas including Reading, Writing, Language Conventions (Spelling, Grammar & Punctuation), and Numeracy. Each subject includes comprehensive lessons and practice materials.',
      isOpen: false
    },
    {
      category: 'Courses',
      question: 'How long do I have access to a course?',
      answer: 'Once you enroll in a course, you have unlimited access for the duration of your subscription. You can learn at your own pace and revisit materials as many times as needed.',
      isOpen: false
    },
    {
      category: 'Courses',
      question: 'Are the courses self-paced?',
      answer: 'Yes! All our courses are self-paced, allowing students to learn at their own speed. However, we also provide recommended learning paths and schedules to help students stay on track.',
      isOpen: false
    },
    {
      category: 'Courses',
      question: 'Do you offer practice tests?',
      answer: 'Absolutely! We provide numerous practice tests that simulate the actual NAPLAN format. These include timed tests, detailed explanations, and performance analytics.',
      isOpen: false
    },

    // Payment
    {
      category: 'Payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and PayPal. All payments are processed securely through our encrypted payment gateway.',
      isOpen: false
    },
    {
      category: 'Payment',
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied with our service within the first 30 days of purchase, contact our support team for a full refund.',
      isOpen: false
    },
    {
      category: 'Payment',
      question: 'Can I upgrade or downgrade my subscription?',
      answer: 'Yes, you can change your subscription plan at any time from your account settings. Changes will take effect in the next billing cycle.',
      isOpen: false
    },
    {
      category: 'Payment',
      question: 'Is there a free trial?',
      answer: 'Yes! We offer a 7-day free trial for new users. You can explore all features and courses before committing to a paid subscription.',
      isOpen: false
    },

    // Technical
    {
      category: 'Technical',
      question: 'What devices can I use to access NAPLAN Bridge?',
      answer: 'NAPLAN Bridge works on all devices including desktop computers, laptops, tablets, and smartphones. We support all modern web browsers (Chrome, Firefox, Safari, Edge).',
      isOpen: false
    },
    {
      category: 'Technical',
      question: 'Do I need to download any software?',
      answer: 'No downloads required! NAPLAN Bridge is entirely web-based. Simply log in through your browser and start learning.',
      isOpen: false
    },
    {
      category: 'Technical',
      question: 'What if I experience technical issues?',
      answer: 'Our technical support team is available 24/7 to help with any issues. You can contact us via email, live chat, or phone. We also have a comprehensive help center with troubleshooting guides.',
      isOpen: false
    },
    {
      category: 'Technical',
      question: 'Can I use NAPLAN Bridge offline?',
      answer: 'Some content can be downloaded for offline access through our mobile app. However, most interactive features require an internet connection for the best learning experience.',
      isOpen: false
    },

    // Account
    {
      category: 'Account',
      question: 'How do I create an account?',
      answer: 'Click the "Sign Up" button, fill in your details (name, email, password), and verify your email address. You can then choose a subscription plan and start learning immediately.',
      isOpen: false
    },
    {
      category: 'Account',
      question: 'Can I share my account with others?',
      answer: 'Each account is designed for individual use. However, parent accounts can manage multiple student profiles under one subscription, making it perfect for families with multiple children.',
      isOpen: false
    },
    {
      category: 'Account',
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page, enter your email address, and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.',
      isOpen: false
    },
    {
      category: 'Account',
      question: 'Can I delete my account?',
      answer: 'Yes, you can delete your account from the account settings page. Please note that this action is permanent and all your data will be removed from our system.',
      isOpen: false
    }
  ];

  get filteredFaqs(): FAQ[] {
    if (this.selectedCategory === 'All') {
      return this.faqs;
    }
    return this.faqs.filter(faq => faq.category === this.selectedCategory);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    // Close all FAQs when switching categories
    this.faqs.forEach(faq => faq.isOpen = false);
  }

  toggleFaq(faq: FAQ): void {
    faq.isOpen = !faq.isOpen;
  }
}
