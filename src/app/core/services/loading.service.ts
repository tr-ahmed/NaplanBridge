/**
 * Loading Service
 * Manages global loading state
 * Uses signals for reactive updates
 */

import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Track number of pending requests
  private pendingRequests = 0;

  // Public signal for loading state
  public isLoading = signal<boolean>(false);

  /**
   * Show loading indicator
   */
  show(): void {
    this.pendingRequests++;

    if (this.pendingRequests > 0) {
      this.isLoading.set(true);
    }
  }

  /**
   * Hide loading indicator
   */
  hide(): void {
    this.pendingRequests = Math.max(0, this.pendingRequests - 1);

    if (this.pendingRequests === 0) {
      this.isLoading.set(false);
    }
  }

  /**
   * Reset loading state (useful for error recovery)
   */
  reset(): void {
    this.pendingRequests = 0;
    this.isLoading.set(false);
  }

  /**
   * Get current loading state
   */
  getLoadingState(): boolean {
    return this.isLoading();
  }
}
