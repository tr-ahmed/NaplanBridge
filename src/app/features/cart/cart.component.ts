import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Cart, CartItem } from '../../models/course.models';
import { CoursesService } from '../../core/services/courses.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cart = signal<Cart>({ items: [], totalAmount: 0, totalItems: 0 });
  loading = signal(false);

  constructor(private coursesService: CoursesService) {}

  ngOnInit(): void {
    this.coursesService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => this.cart.set(cart));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update item quantity
   */
  updateQuantity(courseId: number, quantity: number): void {
    this.coursesService.updateCartItemQuantity(courseId, quantity);
  }

  /**
   * Remove item from cart
   */
  removeItem(courseId: number): void {
    this.coursesService.removeFromCart(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.coursesService.clearCart();
    }
  }

  /**
   * Enroll in all courses
   */
  enrollInAll(): void {
    if (confirm(`Are you sure you want to enroll in all courses for $${this.cart().totalAmount}?`)) {
      this.loading.set(true);

      // Simulate enrollment process
      const enrollmentPromises = this.cart().items.map(item =>
        this.coursesService.enrollInCourse(item.course.id).toPromise()
      );

      Promise.all(enrollmentPromises)
        .then(() => {
          alert('Successfully enrolled in all courses!');
          this.coursesService.clearCart();
        })
        .catch(() => {
          alert('Some enrollments failed. Please try again.');
        })
        .finally(() => {
          this.loading.set(false);
        });
    }
  }

  /**
   * Get discount percentage
   */
  getDiscountPercentage(originalPrice: number, currentPrice: number): number {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }
}
