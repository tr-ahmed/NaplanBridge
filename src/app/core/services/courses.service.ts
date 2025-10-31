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

    console.log('🛒 Local cart updated. Checking authentication...');

    // Debug auth service injection
    console.log('🔐 AuthService instance:', !!this.authService);

    // Check localStorage directly
    const localStorageToken = localStorage.getItem('token');
    const localStorageUserName = localStorage.getItem('userName');
    const localStorageRoles = localStorage.getItem('roles');

    console.log('🔐 LocalStorage token:', localStorageToken ? localStorageToken.substring(0, 20) + '...' : 'null');
    console.log('🔐 LocalStorage userName:', localStorageUserName);
    console.log('🔐 LocalStorage roles:', localStorageRoles);

    // Check if user is authenticated before making API call
    const isAuthenticated = this.authService.isAuthenticated();
    const token = this.authService.getToken();
    const userName = this.authService.getUserName();

    console.log('🔐 Authentication status:', isAuthenticated);
    console.log('🔐 Token exists:', !!token);
    console.log('🔐 Token value:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('🔐 User name:', userName);

    // Force authentication check if user data exists but token is missing
    if (!isAuthenticated && userName) {
      console.log('🔍 User has userName but no token. This might be a token expiry issue.');
      this.toastService.showWarning('Your session has expired. Please log in again to sync your cart with the server');
      return of(true);
    }

    if (!isAuthenticated) {
      console.log('⚠️ User not authenticated, showing warning');
      this.toastService.showWarning('Please log in to sync your cart with the server');
      return of(true);
    }    // Make API call only if user is authenticated
    const endpoint = ApiNodes.addToCart;
    const url = `${this.baseUrl}${endpoint.url}`;

    console.log('🛒 Cart API Debug Info:');
    console.log('Base URL:', this.baseUrl);
    console.log('Endpoint URL:', endpoint.url);
    console.log('Full URL:', url);
    console.log('Use Mock:', this.useMock);
    console.log('Environment useMock:', environment.useMock);
    console.log('User authenticated:', this.authService.isAuthenticated());

    if (this.useMock) {
      console.log('Using mock data for cart');
      this.toastService.showSuccess('Course added to cart!');
      return of(true);
    }

    console.log('Making API call to add to cart...');

    // ✅ Check if course has subscription plans
    if (!course.subscriptionPlans || course.subscriptionPlans.length === 0) {
      console.warn('⚠️ No subscription plans available for this course');
      this.toastService.showError('لا توجد خطط اشتراك متاحة لهذه المادة');
      return of(false);
    }

    // ✅ NEW: If multiple plans, show modal for selection
    if (course.subscriptionPlans.length > 1) {
      console.log('� Multiple plans available, showing selection modal');
      this.showPlanModalSubject.next({ show: true, course });
      return of(true); // Modal will handle the actual add
    }

    // Single plan - add directly
    const defaultPlan = course.subscriptionPlans[0];

    // Check if plan is active
    if (!defaultPlan.isActive) {
      this.toastService.showError('هذه الخطة غير متاحة حالياً');
      return of(false);
    }

    console.log('📦 Using plan:', defaultPlan);

    return this.addPlanToCartInternal(defaultPlan.id, course);
  }

  /**
   * Add specific plan to cart (internal method)
   * Called when user selects a plan from modal or when there's only one plan
   */
  addPlanToCartInternal(planId: number, course: Course): Observable<boolean> {
    const url = `${this.baseUrl}/Cart/add`;

    // Get current user for studentId
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.toastService.showWarning('الرجاء تسجيل الدخول لإضافة عناصر إلى السلة');
      return of(false);
    }

    // ✅ Use correct API format with subscriptionPlanId
    return this.http.post<any>(url, {
      subscriptionPlanId: planId,
      studentId: currentUser.id,
      quantity: 1
    }).pipe(
      tap(() => {
        // ✅ Update cart badge immediately
        this.refreshCartCount();
      }),
      map((response) => {
        console.log('✅ Cart API Success:', response);
        const courseName = course.name || course.subjectName;
        this.toastService.showSuccess(`تم إضافة ${courseName} إلى السلة بنجاح!`);
        return true;
      }),
      catchError((error) => {
        console.error('❌ Failed to add to cart via API:', error);

        // ✅ Better error messages
        if (error.status === 401) {
          this.toastService.showWarning('الرجاء تسجيل الدخول لمزامنة السلة مع الخادم');
        } else if (error.status === 400) {
          this.toastService.showError(error.error?.message || 'بيانات غير صحيحة');
        } else if (error.status === 404) {
          this.toastService.showError('الخطة المحددة غير موجودة');
        } else if (error.status === 409) {
          this.toastService.showError('هذه الخطة موجودة بالفعل في السلة');
        } else if (error.status === 500) {
          this.toastService.showError('خطأ في الخادم، يرجى المحاولة لاحقاً');
        } else {
          this.toastService.showError('فشلت المزامنة مع الخادم، لكن تمت الإضافة للسلة المحلية');
        }

        return of(true); // Even if API fails, we've already updated local cart
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
