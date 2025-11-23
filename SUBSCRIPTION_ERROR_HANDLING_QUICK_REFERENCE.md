# Quick Reference - Subscription Error Handling

## 🚀 Quick Start

### 1. Import the Error Dialog Component

```typescript
import { 
  SubscriptionErrorDialogComponent, 
  SubscriptionErrorAction 
} from './shared/components/subscription-error-dialog/subscription-error-dialog.component';
```

### 2. Add to Component Imports

```typescript
@Component({
  imports: [CommonModule, SubscriptionErrorDialogComponent],
  // ...
})
```

### 3. Add Signals to Component

```typescript
export class YourComponent {
  showErrorDialog = signal<boolean>(false);
  errorMessage = signal<string>('');
  errorAction = signal<SubscriptionErrorAction>('none');
  errorActionButton = signal<string | undefined>(undefined);
}
```

### 4. Handle Cart Errors

```typescript
this.cartService.addToCart(dto).subscribe({
  next: (response) => {
    // Success handling
  },
  error: (error) => {
    if (error.status === 400 && error.message) {
      // Determine action and button
      const actionType = SubscriptionErrorDialogComponent.determineActionType(error.message);
      const actionButton = SubscriptionErrorDialogComponent.getActionButtonText(actionType);
      
      // Show error dialog
      this.errorMessage.set(error.message);
      this.errorAction.set(actionType);
      this.errorActionButton.set(actionButton);
      this.showErrorDialog.set(true);
    }
  }
});
```

### 5. Handle Dialog Actions

```typescript
onErrorAction(action: SubscriptionErrorAction): void {
  const studentId = this.selectedStudentId || this.authService.getCurrentUserId();
  
  switch (action) {
    case 'view-cart':
      this.router.navigate(['/cart']);
      break;
    case 'view-subscriptions':
      this.router.navigate(['/subscriptions', studentId]);
      break;
  }
  
  this.showErrorDialog.set(false);
}

onCloseErrorDialog(): void {
  this.showErrorDialog.set(false);
}
```

### 6. Add Dialog to Template

```html
<app-subscription-error-dialog
  [isOpen]="showErrorDialog()"
  [errorMessage]="errorMessage()"
  [actionButton]="errorActionButton()"
  [actionType]="errorAction()"
  (actionClicked)="onErrorAction($event)"
  (closed)="onCloseErrorDialog()">
</app-subscription-error-dialog>
```

---

## 🎯 Error Types

### Same Plan in Cart
```
Error: "This plan is already in your cart..."
Action: view-cart
Button: "View Cart"
```

### Multiple Plans Same Subject
```
Error: "...already has 'X' for this subject in the cart..."
Action: view-cart
Button: "View Cart"
```

### Active Subscription Exists
```
Error: "...already has an active subscription..."
Action: view-subscriptions
Button: "View Active Subscriptions"
```

### Annual/Full Year Coverage
```
Error: "...Annual subscription...includes all terms..."
Action: view-subscriptions
Button: "View Active Subscriptions"
```

---

## 📊 Active Subscriptions Component

### Import

```typescript
import { ActiveSubscriptionsComponent } from './shared/components/active-subscriptions';
```

### Usage

```html
<app-active-subscriptions 
  [studentId]="studentId">
</app-active-subscriptions>
```

### Features
- ✅ Shows all active subscriptions
- ✅ Displays expiry dates with countdown
- ✅ Color-coded badges (green/yellow/red)
- ✅ Refresh functionality
- ✅ Empty state with CTA

---

## 🔧 Helper Methods

### Determine Action Type
```typescript
const actionType = SubscriptionErrorDialogComponent.determineActionType(errorMessage);
// Returns: 'view-cart' | 'view-subscriptions' | 'none'
```

### Get Action Button Text
```typescript
const buttonText = SubscriptionErrorDialogComponent.getActionButtonText(actionType);
// Returns: 'View Cart' | 'View Active Subscriptions' | undefined
```

---

## 📱 Example: Complete Component

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from './core/services/cart.service';
import { 
  SubscriptionErrorDialogComponent, 
  SubscriptionErrorAction 
} from './shared/components/subscription-error-dialog';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, SubscriptionErrorDialogComponent],
  template: `
    <button (click)="addToCart()">Add to Cart</button>
    
    <app-subscription-error-dialog
      [isOpen]="showErrorDialog()"
      [errorMessage]="errorMessage()"
      [actionButton]="errorActionButton()"
      [actionType]="errorAction()"
      (actionClicked)="onErrorAction($event)"
      (closed)="onCloseErrorDialog()">
    </app-subscription-error-dialog>
  `
})
export class ExampleComponent {
  showErrorDialog = signal<boolean>(false);
  errorMessage = signal<string>('');
  errorAction = signal<SubscriptionErrorAction>('none');
  errorActionButton = signal<string | undefined>(undefined);

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  addToCart(): void {
    this.cartService.addToCart({
      subscriptionPlanId: 1,
      studentId: 123,
      quantity: 1
    }).subscribe({
      next: (response) => {
        console.log('Added to cart!');
      },
      error: (error) => {
        if (error.status === 400 && error.message) {
          const actionType = SubscriptionErrorDialogComponent.determineActionType(error.message);
          const actionButton = SubscriptionErrorDialogComponent.getActionButtonText(actionType);
          
          this.errorMessage.set(error.message);
          this.errorAction.set(actionType);
          this.errorActionButton.set(actionButton);
          this.showErrorDialog.set(true);
        }
      }
    });
  }

  onErrorAction(action: SubscriptionErrorAction): void {
    switch (action) {
      case 'view-cart':
        this.router.navigate(['/cart']);
        break;
      case 'view-subscriptions':
        this.router.navigate(['/subscriptions', 123]);
        break;
    }
    this.showErrorDialog.set(false);
  }

  onCloseErrorDialog(): void {
    this.showErrorDialog.set(false);
  }
}
```

---

## ✅ Checklist

- [ ] Import `SubscriptionErrorDialogComponent`
- [ ] Add component to imports array
- [ ] Create error state signals
- [ ] Update error handling in `addToCart`
- [ ] Add error action handler
- [ ] Add close handler
- [ ] Add dialog to template
- [ ] Test all error scenarios

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2025-01-27
