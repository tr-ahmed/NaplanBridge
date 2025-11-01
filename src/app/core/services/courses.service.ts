import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { Course, CourseFilter, Cart, CartItem, CourseCategory } from '../../models/course.models';
import { ApiNodes } from '../api/api-nodes';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  private readonly baseUrl = environment.apiBaseUrl || 'https://naplan2.runasp.net/api';
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

  // Plan selection modal state
  private showPlanModalSubject = new BehaviorSubject<{show: boolean, course: Course | null}>({
    show: false,
    course: null
  });
  public showPlanModal$ = this.showPlanModalSubject.asObservable();

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

    return this.http.get<any>(url).pipe(
      map(response => {
        // Handle both paginated response and direct array
        const courses = response.items || response;
        console.log('📦 API Response:', {
          type: response.items ? 'Paginated' : 'Direct Array',
          totalCount: response.totalCount || courses.length,
          receivedCount: courses.length,
          page: response.page,
          pageSize: response.pageSize
        });
        return this.filterCourses(courses, filter);
      }),
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
    console.log('🛒 Starting addToCart for course:', course.id, course.name || course.subjectName);

    // ✅ Check if course has subscription plans
    if (!course.subscriptionPlans || course.subscriptionPlans.length === 0) {
      console.warn('⚠️ No subscription plans available for this course');
      this.toastService.showError('No subscription plans available for this subject');
      return of(false);
    }

    // ✅ Always show modal for plan selection (even if single plan)
    console.log('📋 Opening plan selection modal with', course.subscriptionPlans.length, 'plans');
    this.showPlanModalSubject.next({ show: true, course });
    return of(true); // Modal will handle the actual add
  }

  /**
   * Add specific plan to cart (internal method)
   * Called when user selects a plan from modal or when there's only one plan
   */
  addPlanToCartInternal(planId: number, course: Course): Observable<boolean> {
    const url = `${this.baseUrl}/Cart/items`; // ✅ Correct endpoint

    // Get current user for studentId
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.showWarning('Please log in to add items to your cart');
      return of(false);
    }

    // 🎯 CRITICAL: Use Student.Id for cart, NOT User.Id
    // ⚠️ Common Mistake: Using currentUser.id (User.Id) instead of currentUser.studentId (Student.Id)

    let studentId: number;

    if (currentUser.studentId) {
      // ✅ CORRECT: Use studentId from token (Student.Id from Students table)
      studentId = currentUser.studentId;
      console.log('✅ Using Student.Id from token:', studentId);
      console.log('📊 This is the correct ID for cart/orders');
    } else {
      // ⚠️ FALLBACK: This should not happen for students
      // Token should always have studentId for student role
      console.error('❌ studentId NOT found in token!');
      console.error('❌ Cannot add to cart without Student.Id');
      console.error('🔧 User needs to re-login to get new token with studentId');

      this.toastService.showError('Student ID not found. Please logout and login again.');
      return of(false);
    }

    console.log('🛒 Adding to cart:', {
      url,
      subscriptionPlanId: planId,
      studentId: studentId,  // ✅ Student.Id (e.g., 1)
      userId: currentUser.id,  // ℹ️ User.Id (e.g., "8") - for reference only
      studentIdType: typeof studentId,
      quantity: 1,
      note: 'Using Student.Id from Students table, NOT User.Id from AspNetUsers'
    });

    // ✅ Use correct API format with subscriptionPlanId
    return this.http.post<any>(url, {
      subscriptionPlanId: planId,
      studentId: studentId,
      quantity: 1
    }).pipe(
      tap(() => {
        console.log('📦 Cart API call initiated...');
      }),
      switchMap((response) => {
        console.log('✅ Cart API Success Response:', response);
        console.log('✅ Status: Item added to cart successfully');

        const courseName = course.name || course.subjectName;
        this.toastService.showSuccess(`${courseName} has been added to your cart successfully!`);

        // ✅ CRITICAL: Reload cart from backend to update UI
        console.log('🔄 Reloading cart from backend to update UI...');
        return this.loadCartFromBackend(studentId).pipe(
          map(() => true)
        );
      }),
      catchError((error) => {
        console.error('❌ Cart API Error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.error?.message,
          details: error.error?.details,
          traceId: error.error?.traceId
        });

        // ✅ Better error messages with backend feedback
        if (error.status === 401) {
          this.toastService.showWarning('Please log in to sync your cart with the server');
        } else if (error.status === 400) {
          const msg = error.error?.message || 'Invalid data';
          this.toastService.showError(msg);
        } else if (error.status === 404) {
          const msg = error.error?.message || 'Selected plan not found';
          this.toastService.showError(msg);
        } else if (error.status === 409) {
          const msg = error.error?.message || 'This plan is already in your cart';
          this.toastService.showWarning(msg);
        } else if (error.status === 500) {
          const msg = error.error?.message || 'Server error, please try again later';
          this.toastService.showError(msg);
          console.error('🔧 Backend needs investigation. TraceId:', error.error?.traceId);
        } else {
          this.toastService.showError('Failed to sync with server');
        }

        return of(false); // Return false on error
      })
    );
  }

  /**
   * Load cart from backend API
   */
  loadCartFromBackend(studentId?: number): Observable<Cart> {
    const url = `${this.baseUrl}/Cart`;

    console.log('📥 Loading cart from backend for studentId:', studentId);

    return this.http.get<any>(url).pipe(
      map((response) => {
        console.log('✅ Cart loaded from backend (RAW):', response);
        console.log('📊 Response structure:', {
          hasItems: 'items' in response,
          hasCartItems: 'cartItems' in response,
          hasData: 'data' in response,
          itemsLength: response.items?.length || response.cartItems?.length || 0
        });

        // Transform backend response to Cart model
        // Handle different possible response structures
        let items = [];
        if (response.data?.items) {
          items = response.data.items;
        } else if (response.items) {
          items = response.items;
        } else if (response.cartItems) {
          items = response.cartItems;
        }

        console.log('📦 Extracted items:', items);
        console.log('🔢 Items count:', items.length);

        const cart: Cart = {
          items: items,
          totalAmount: response.totalAmount || response.total || response.data?.totalAmount || 0,
          totalItems: items.length
        };

        console.log('✅ Transformed cart:', cart);

        // Update local cart
        this.cartSubject.next(cart);
        this.saveCartToStorage();

        return cart;
      }),
      catchError((error) => {
        console.error('❌ Failed to load cart from backend:', error);

        // Return empty cart on error
        const emptyCart: Cart = {
          items: [],
          totalAmount: 0,
          totalItems: 0
        };

        return of(emptyCart);
      })
    );
  }

  /**
   * Show plan selection modal
   */
  openPlanSelectionModal(course: Course): void {
    this.showPlanModalSubject.next({ show: true, course });
  }

  /**
   * Close plan selection modal
   */
  closePlanSelectionModal(): void {
    this.showPlanModalSubject.next({ show: false, course: null });
  }

  /**
   * Handle plan selection from modal
   */
  onPlanSelected(planId: number, course: Course): Observable<boolean> {
    this.closePlanSelectionModal();
    return this.addPlanToCartInternal(planId, course);
  }

  /**
   * Refresh cart item count
   */
  private refreshCartCount(): void {
    // This will be updated when we integrate with CartService
    // For now, it updates the local cart
    const currentCart = this.cartSubject.value;
    currentCart.totalItems = currentCart.items.length;
    this.cartSubject.next(currentCart);
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
