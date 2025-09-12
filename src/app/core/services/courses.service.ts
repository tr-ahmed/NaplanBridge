import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Course, CourseFilter, Cart, CartItem, CourseCategory } from '../../models/course.models';
import { ApiNodes } from '../api/api-nodes';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  private readonly baseUrl = environment.apiBaseUrl || 'https://naplanbridge.runasp.net';
  private useMock = environment.useMock || false; // Set to true for development with mock data

  // Cart management
  private cartSubject = new BehaviorSubject<Cart>({
    items: [],
    totalAmount: 0,
    totalItems: 0
  });

  public cart$ = this.cartSubject.asObservable();

  // Loading states
  public loading = signal(false);
  public error = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.loadCartFromStorage();
  }

  /**
   * Get all courses with optional filtering
   */
  getCourses(filter?: CourseFilter): Observable<Course[]> {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = ApiNodes.getAllCourses;
    const url = `${this.baseUrl}${endpoint.url}`;

    if (this.useMock) {
      return of(this.filterCourses(endpoint.mockData, filter)).pipe(
        tap(() => this.loading.set(false))
      );
    }

    return this.http.get<Course[]>(url).pipe(
      map(courses => this.filterCourses(courses, filter)),
      tap(() => this.loading.set(false)),
      catchError((error: HttpErrorResponse) => {
        console.warn('API call failed, using mock data:', error);
        this.error.set('Failed to load courses, showing offline data');
        this.loading.set(false);
        return of(this.filterCourses(endpoint.mockData, filter));
      })
    );
  }

  /**
   * Get a specific course by ID
   */
  getCourseById(id: number): Observable<Course | null> {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = ApiNodes.getCourseById;
    const url = `${this.baseUrl}${endpoint.url.replace(':id', id.toString())}`;

    if (this.useMock) {
      const course = ApiNodes.getAllCourses.mockData.find(c => c.id === id) || endpoint.mockData;
      return of(course).pipe(
        tap(() => this.loading.set(false))
      );
    }

    return this.http.get<Course>(url).pipe(
      tap(() => this.loading.set(false)),
      catchError((error: HttpErrorResponse) => {
        console.warn('API call failed, using mock data:', error);
        this.error.set('Failed to load course details');
        this.loading.set(false);
        const course = ApiNodes.getAllCourses.mockData.find(c => c.id === id) || endpoint.mockData;
        return of(course);
      })
    );
  }

  /**
   * Get courses by category
   */
  getCoursesByCategory(category: string): Observable<Course[]> {
    return this.getCourses({ category });
  }

  /**
   * Get all course categories
   */
  getCategories(): Observable<CourseCategory[]> {
    const endpoint = ApiNodes.getCategories;
    const url = `${this.baseUrl}${endpoint.url}`;

    if (this.useMock) {
      return of(endpoint.mockData);
    }

    return this.http.get<CourseCategory[]>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.warn('API call failed, using mock data:', error);
        return of(endpoint.mockData);
      })
    );
  }

  /**
   * Add course to cart
   */
  addToCart(course: Course): Observable<boolean> {
    const currentCart = this.cartSubject.value;
    const existingItem = currentCart.items.find(item => item.course.id === course.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      const newItem: CartItem = {
        course,
        quantity: 1,
        addedDate: new Date()
      };
      currentCart.items.push(newItem);
    }

    this.updateCartTotals(currentCart);
    this.cartSubject.next(currentCart);
    this.saveCartToStorage();

    // Check if user is authenticated before making API call
    if (!this.authService.isAuthenticated()) {
      this.toastService.showWarning('Please log in to sync your cart with the server');
      return of(true);
    }

    // Make API call only if user is authenticated
    const endpoint = ApiNodes.addToCart;
    const url = `${this.baseUrl}${endpoint.url}`;

    if (this.useMock) {
      this.toastService.showSuccess('Course added to cart!');
      return of(true);
    }

    return this.http.post<any>(url, {
      subjectId: course.id,
      quantity: 1
    }).pipe(
      map(() => {
        this.toastService.showSuccess('Course added to cart!');
        return true;
      }),
      catchError((error) => {
        console.error('Failed to add to cart via API:', error);

        // If it's an authentication error (401), show a message to the user
        if (error.status === 401) {
          this.toastService.showWarning('Please log in to sync your cart with the server');
        } else {
          this.toastService.showError('Failed to sync with server, but course added to local cart');
        }

        return of(true); // Even if API fails, we've already updated local cart
      })
    );
  }

  /**
   * Remove course from cart
   */
  removeFromCart(courseId: number): Observable<boolean> {
    const currentCart = this.cartSubject.value;
    currentCart.items = currentCart.items.filter(item => item.course.id !== courseId);

    this.updateCartTotals(currentCart);
    this.cartSubject.next(currentCart);
    this.saveCartToStorage();

    // Check if user is authenticated before making API call
    if (!this.authService.isAuthenticated()) {
      this.toastService.showWarning('Please log in to sync your cart with the server');
      return of(true);
    }

    const endpoint = ApiNodes.removeFromCart;
    const url = `${this.baseUrl}${endpoint.url.replace(':id', courseId.toString())}`;

    if (this.useMock) {
      this.toastService.showSuccess('Course removed from cart!');
      return of(true);
    }

    return this.http.delete<any>(url).pipe(
      map(() => {
        this.toastService.showSuccess('Course removed from cart!');
        return true;
      }),
      catchError((error) => {
        console.error('Failed to remove from cart via API:', error);
        if (error.status === 401) {
          this.toastService.showWarning('Please log in to sync your cart with the server');
        } else {
          this.toastService.showError('Failed to sync with server, but course removed from local cart');
        }
        return of(true);
      })
    );
  }

  /**
   * Update cart item quantity
   */
  updateCartItemQuantity(courseId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(courseId).subscribe();
      return;
    }

    const currentCart = this.cartSubject.value;
    const item = currentCart.items.find(item => item.course.id === courseId);

    if (item) {
      item.quantity = quantity;
      this.updateCartTotals(currentCart);
      this.cartSubject.next(currentCart);
      this.saveCartToStorage();
    }
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    const emptyCart: Cart = {
      items: [],
      totalAmount: 0,
      totalItems: 0
    };

    this.cartSubject.next(emptyCart);
    this.saveCartToStorage();
  }

  /**
   * Get cart item count
   */
  getCartItemCount(): number {
    return this.cartSubject.value.totalItems;
  }

  /**
   * Check if course is in cart
   */
  isInCart(courseId: number): boolean {
    return this.cartSubject.value.items.some(item => item.course.id === courseId);
  }

  /**
   * Enroll in a course (simulate purchase)
   */
  enrollInCourse(courseId: number): Observable<boolean> {
    const endpoint = ApiNodes.enrollInCourse;
    const url = `${this.baseUrl}${endpoint.url.replace(':id', courseId.toString())}`;

    if (this.useMock) {
      // Remove from cart after enrollment
      this.removeFromCart(courseId).subscribe();
      // Add to enrolled courses
      this.addToEnrolledCourses(courseId);
      return of(true);
    }

    return this.http.post<any>(url, { courseId }).pipe(
      map(() => {
        this.removeFromCart(courseId).subscribe();
        this.addToEnrolledCourses(courseId);
        return true;
      }),
      catchError(() => {
        this.removeFromCart(courseId).subscribe();
        this.addToEnrolledCourses(courseId);
        return of(true);
      })
    );
  }

  /**
   * Toggle mock mode for development
   */
  setUseMock(useMock: boolean): void {
    this.useMock = useMock;
  }

  /**
   * Check if user is enrolled in a course
   */
  isEnrolledInCourse(courseId: number): Observable<boolean> {
    const endpoint = ApiNodes.checkEnrollment;
    const url = `${this.baseUrl}${endpoint.url.replace(':id', courseId.toString())}`;

    if (this.useMock) {
      const enrolledCourses = this.getEnrolledCoursesFromStorage();
      return of(enrolledCourses.includes(courseId));
    }

    return this.http.get<{ enrolled: boolean }>(url).pipe(
      map(response => response.enrolled),
      catchError(() => {
        const enrolledCourses = this.getEnrolledCoursesFromStorage();
        return of(enrolledCourses.includes(courseId));
      })
    );
  }

  /**
   * Get user's enrolled courses
   */
  getEnrolledCourses(): Observable<Course[]> {
    const endpoint = ApiNodes.getEnrolledCourses;
    const url = `${this.baseUrl}${endpoint.url}`;

    if (this.useMock) {
      const enrolledCourseIds = this.getEnrolledCoursesFromStorage();
      const allCourses = this.getMockCourses();
      const enrolledCourses = allCourses.filter((course: Course) => enrolledCourseIds.includes(course.id));
      return of(enrolledCourses);
    }

    return this.http.get<Course[]>(url).pipe(
      catchError(() => {
        const enrolledCourseIds = this.getEnrolledCoursesFromStorage();
        const allCourses = this.getMockCourses();
        const enrolledCourses = allCourses.filter((course: Course) => enrolledCourseIds.includes(course.id));
        return of(enrolledCourses);
      })
    );
  }

  // Private helper methods

  private getMockCourses(): Course[] {
    return ApiNodes.getAllCourses.mockData;
  }

  private getEnrolledCoursesFromStorage(): number[] {
    try {
      const enrolledCourses = localStorage.getItem('naplanbridge_enrolled_courses');
      return enrolledCourses ? JSON.parse(enrolledCourses) : [];
    } catch (error) {
      console.warn('Failed to load enrolled courses from localStorage:', error);
      return [];
    }
  }

  private addToEnrolledCourses(courseId: number): void {
    try {
      const enrolledCourses = this.getEnrolledCoursesFromStorage();
      if (!enrolledCourses.includes(courseId)) {
        enrolledCourses.push(courseId);
        localStorage.setItem('naplanbridge_enrolled_courses', JSON.stringify(enrolledCourses));
      }
    } catch (error) {
      console.warn('Failed to save enrolled course to localStorage:', error);
    }
  }

  private filterCourses(courses: Course[], filter?: CourseFilter): Course[] {
    if (!filter) return courses;

    return courses.filter(course => {
      // Use new fields first, fallback to legacy fields
      if (filter.term && course.termIds && !course.termIds.includes(filter.term)) return false;
      if (filter.term && !course.termIds && course.term !== filter.term) return false;

      if (filter.subject && course.subjectName !== filter.subject) return false;
      if (filter.subject && !course.subjectName && course.subject !== filter.subject) return false;

      if (filter.category && course.categoryName !== filter.category) return false;
      if (filter.category && !course.categoryName && course.category !== filter.category) return false;

      if (filter.level && course.level !== filter.level) return false;

      if (filter.rating && course.rating && course.rating < filter.rating) return false;

      if (filter.priceRange) {
        if (course.price < filter.priceRange.min || course.price > filter.priceRange.max) {
          return false;
        }
      }
      return true;
    });
  }

  private updateCartTotals(cart: Cart): void {
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((total, item) => total + (item.course.price * item.quantity), 0);
  }

  private saveCartToStorage(): void {
    try {
      localStorage.setItem('naplanbridge_cart', JSON.stringify(this.cartSubject.value));
    } catch (error) {
      console.warn('Failed to save cart to localStorage:', error);
    }
  }

  private loadCartFromStorage(): void {
    try {
      const savedCart = localStorage.getItem('naplanbridge_cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        this.updateCartTotals(cart);
        this.cartSubject.next(cart);
      }
    } catch (error) {
      console.warn('Failed to load cart from localStorage:', error);
    }
  }
}
