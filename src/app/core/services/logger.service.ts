import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Logger Service - Centralized logging utility
 * Controls all console.log statements based on environment configuration
 *
 * Usage:
 * - Inject LoggerService in your component/service
 * - Use logger.log(), logger.warn(), logger.error() instead of console methods
 *
 * Benefits:
 * - Automatic enable/disable based on environment
 * - Easy to add logging levels, file logging, or remote logging later
 * - Better performance in production (no-op functions)
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly isEnabled: boolean;

  constructor() {
    this.isEnabled = environment.enableDebugLogging;
  }

  /**
   * Log general information (replaces console.log)
   * Only logs when enableDebugLogging is true in environment
   */
  log(...args: any[]): void {
    if (this.isEnabled) {
      console.log(...args);
    }
  }

  /**
   * Log warnings (always enabled, even in production)
   * Use for important warnings that should be visible
   */
  warn(...args: any[]): void {
    console.warn(...args);
  }

  /**
   * Log errors (always enabled, even in production)
   * Use for error tracking
   */
  error(...args: any[]): void {
    console.error(...args);
  }

  /**
   * Log information messages (only in debug mode)
   */
  info(...args: any[]): void {
    if (this.isEnabled) {
      console.info(...args);
    }
  }

  /**
   * Log debug messages (only in debug mode)
   */
  debug(...args: any[]): void {
    if (this.isEnabled) {
      console.debug(...args);
    }
  }

  /**
   * Log tables (only in debug mode)
   * Useful for displaying arrays/objects in table format
   */
  table(data: any): void {
    if (this.isEnabled) {
      console.table(data);
    }
  }

  /**
   * Group related logs together (only in debug mode)
   */
  group(label: string): void {
    if (this.isEnabled) {
      console.group(label);
    }
  }

  /**
   * End a log group (only in debug mode)
   */
  groupEnd(): void {
    if (this.isEnabled) {
      console.groupEnd();
    }
  }

  /**
   * Check if debug logging is enabled
   */
  isDebugEnabled(): boolean {
    return this.isEnabled;
  }
}
