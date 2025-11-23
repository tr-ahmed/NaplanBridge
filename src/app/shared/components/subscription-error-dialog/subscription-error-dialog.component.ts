/**
 * Subscription Error Dialog Component
 * Displays validation errors when adding subscription plans to cart
 * Provides contextual action buttons based on error type
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SubscriptionErrorAction = 'view-cart' | 'view-subscriptions' | 'none';

@Component({
  selector: 'app-subscription-error-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-error-dialog.component.html',
  styleUrls: ['./subscription-error-dialog.component.scss']
})
export class SubscriptionErrorDialogComponent {
  @Input() isOpen = false;
  @Input() errorMessage = '';
  @Input() actionButton?: string;
  @Input() actionType: SubscriptionErrorAction = 'none';

  @Output() actionClicked = new EventEmitter<SubscriptionErrorAction>();
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  doAction(): void {
    if (this.actionType !== 'none') {
      this.actionClicked.emit(this.actionType);
    }
    this.close();
  }

  /**
   * Parse error message to determine action type
   */
  static determineActionType(errorMessage: string): SubscriptionErrorAction {
    const msg = errorMessage.toLowerCase();

    if (msg.includes('already in your cart') || msg.includes('already in cart')) {
      return 'view-cart';
    }

    if (msg.includes('annual subscription') ||
        msg.includes('full year subscription') ||
        msg.includes('active subscription')) {
      return 'view-subscriptions';
    }

    if (msg.includes('already has') && msg.includes('cart')) {
      return 'view-cart';
    }

    return 'none';
  }

  /**
   * Get action button text based on error type
   */
  static getActionButtonText(actionType: SubscriptionErrorAction): string | undefined {
    switch (actionType) {
      case 'view-cart':
        return 'View Cart';
      case 'view-subscriptions':
        return 'View Active Subscriptions';
      default:
        return undefined;
    }
  }
}
