// ============================================================================
// 📝 LOGGER SERVICE USAGE EXAMPLE
// ============================================================================
// This file shows how to use the centralized LoggerService in any component

import { Component, OnInit, inject } from '@angular/core';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-example',
  template: `<h1>Example Component</h1>`
})
export class ExampleComponent implements OnInit {
  // Method 1: Using inject() function (Modern approach)
  private logger = inject(LoggerService);

  // Method 2: Constructor injection (Traditional approach)
  // constructor(private logger: LoggerService) {}

  ngOnInit(): void {
    // ============================================================================
    // BASIC USAGE
    // ============================================================================

    // General logging (enabled only in development)
    this.logger.log('Component initialized');
    this.logger.log('User data:', { id: 1, name: 'Ahmed' });

    // Warnings (always enabled, even in production)
    this.logger.warn('This feature is deprecated');

    // Errors (always enabled, even in production)
    this.logger.error('API call failed:', new Error('Network error'));

    // Info messages (enabled only in development)
    this.logger.info('Loading data from cache');

    // Debug messages (enabled only in development)
    this.logger.debug('Detailed debug information:', {
      timestamp: new Date(),
      navigator: navigator.userAgent
    });

    // ============================================================================
    // ADVANCED USAGE
    // ============================================================================

    // Table logging - Great for arrays and objects
    const users = [
      { id: 1, name: 'Ahmed', role: 'Admin' },
      { id: 2, name: 'Sara', role: 'User' },
      { id: 3, name: 'Mohamed', role: 'User' }
    ];
    this.logger.table(users);

    // Grouped logging - Organize related logs
    this.logger.group('Authentication Flow');
    this.logger.log('Step 1: Checking credentials');
    this.logger.log('Step 2: Validating token');
    this.logger.log('Step 3: Loading user profile');
    this.logger.groupEnd();

    // Conditional logging - For expensive operations
    if (this.logger.isDebugEnabled()) {
      // This only runs in development
      const expensiveData = this.calculateComplexData();
      this.logger.log('Expensive calculation:', expensiveData);
    }

    // ============================================================================
    // REAL-WORLD EXAMPLES
    // ============================================================================

    this.loadUserData();
    this.processPayment();
  }

  private loadUserData(): void {
    this.logger.group('👤 Loading User Data');

    try {
      this.logger.log('📡 Fetching from API...');

      // Simulate API call
      const userData = { id: 1, name: 'Ahmed', email: 'ahmed@example.com' };

      this.logger.log('✅ User loaded successfully:', userData);
      this.logger.groupEnd();

    } catch (error) {
      this.logger.error('❌ Failed to load user:', error);
      this.logger.groupEnd();
    }
  }

  private processPayment(): void {
    this.logger.group('💳 Payment Processing');

    const paymentData = {
      amount: 99.99,
      currency: 'USD',
      method: 'credit_card'
    };

    this.logger.log('Payment details:', paymentData);
    this.logger.info('Connecting to payment gateway...');

    // Simulate payment processing
    const success = true;

    if (success) {
      this.logger.log('✅ Payment successful!');
    } else {
      this.logger.error('❌ Payment failed!');
    }

    this.logger.groupEnd();
  }

  private calculateComplexData(): any {
    // Expensive calculation that should only run in debug mode
    return {
      processingTime: '150ms',
      memoryUsage: '45MB',
      cacheHitRate: '85%'
    };
  }
}

// ============================================================================
// 🎯 MIGRATION FROM console.log TO LoggerService
// ============================================================================

/*
// BEFORE (Old way):
console.log('User loaded:', user);
console.warn('Warning message');
console.error('Error:', error);
console.table(data);
console.group('Group');
console.groupEnd();

// AFTER (New way with LoggerService):
this.logger.log('User loaded:', user);
this.logger.warn('Warning message');
this.logger.error('Error:', error);
this.logger.table(data);
this.logger.group('Group');
this.logger.groupEnd();

// ============================================================================
// 💡 BENEFITS
// ============================================================================

1. ✅ Automatic enable/disable based on environment
   - Development: All logs visible
   - Production: Only errors and warnings

2. ✅ Better performance in production
   - No console.log overhead
   - No string interpolation overhead

3. ✅ Centralized control
   - Change logging behavior in one place
   - Easy to add remote logging (Sentry, LogRocket, etc.)

4. ✅ Type-safe
   - Full TypeScript support
   - Intellisense and autocomplete

5. ✅ Extensible
   - Easy to add log levels
   - Easy to add log persistence
   - Easy to add structured logging

// ============================================================================
// ⚙️ CONFIGURATION
// ============================================================================

// Development (environment.ts):
enableDebugLogging: true  // Show all logs

// Production (environment.prod.ts):
enableDebugLogging: false  // Hide debug logs (errors/warnings still shown)

*/
