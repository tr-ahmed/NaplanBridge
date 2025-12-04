/**
 * Logger Utility
 * Centralized logging with environment-based control
 */

import { environment } from '../../../environments/environment';

export class Logger {
  /**
   * Log info messages (only in development)
   */
  static log(...args: any[]): void {
    if (!environment.production && environment.enableDebugLogging) {
      console.log(...args);
    }
  }

  /**
   * Log warning messages
   */
  static warn(...args: any[]): void {
    if (!environment.production) {
      console.warn(...args);
    }
  }

  /**
   * Log error messages (always logged)
   */
  static error(...args: any[]): void {
    console.error(...args);
  }

  /**
   * Log info messages
   */
  static info(...args: any[]): void {
    if (!environment.production && environment.enableDebugLogging) {
      console.info(...args);
    }
  }
}
