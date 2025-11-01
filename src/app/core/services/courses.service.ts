import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { Course, CourseFilter, Cart, CartItem, CourseCategory, CurrentTermWeekDto } from '../../models/course.models';
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

  /**
   * Get current cart value synchronously
   */
  getCartValue(): Cart {
    return this.cartSubject.value;
  }

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
  addPlanToCartInternal(planId: number, course: Course, planName?: string): Observable<boolean> {
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

    // ✅ CRITICAL: Load cart from backend first to get latest data
    console.log('📥 Loading cart from backend before validation...');

    return this.loadCartFromBackend(studentId).pipe(
      switchMap((loadedCart) => {
        console.log('✅ Cart loaded for validation:', loadedCart);

        // Extract year from plan name (most accurate) or course name or yearId
        const planYearMatch = planName ? planName.match(/Year\s+(\d+)/i) : null;
        const courseYearMatch = (course.subjectName || course.name || '').match(/Year\s+(\d+)/i);
        const courseYear = planYearMatch ? parseInt(planYearMatch[1]) :
                          (courseYearMatch ? parseInt(courseYearMatch[1]) : course.yearId);

        // Now check if subject already exists in cart
        console.log('🔍 Checking for duplicate subject in cart...');
        console.log('📚 New course:', {
          id: course.id,
          name: course.subjectName || course.name,
          planName: planName,
          yearId: course.yearId,
          extractedYear: courseYear
        });
        console.log('🛒 Current cart items:', loadedCart.items.map((item: any) => ({
          id: item.course?.id,
          name: item.course?.subjectName || item.course?.name,
          yearId: item.course?.yearId
        })));

        const subjectAlreadyInCart = loadedCart.items.some((item: any) => {
          // Extract subject name from cart item (remove term info)
          const itemSubjectName = (item.course?.subjectName || item.course?.name || '').split(' - ')[0].trim();
          const newSubjectName = (course.subjectName || course.name || '').split(' - ')[0].trim();

          // Extract year from name (most reliable source)
          const itemYearMatch = (item.course?.subjectName || item.course?.name || '').match(/Year\s+(\d+)/i);
          const itemYear = itemYearMatch ? parseInt(itemYearMatch[1]) : item.course?.yearId;

          // Use the extracted year from course name (not yearId which might be wrong)
          const newYear = courseYear;

          // Check if same subject and same year
          const isSameSubject = itemSubjectName.toLowerCase().includes(newSubjectName.toLowerCase()) ||
                               newSubjectName.toLowerCase().includes(itemSubjectName.toLowerCase());
          const isSameYear = itemYear === newYear;

          console.log('🔄 Comparing:', {
            itemSubjectName,
            newSubjectName,
            isSameSubject,
            itemYear,
            newYear,
            isSameYear,
            match: isSameSubject && isSameYear
          });

          return isSameSubject && isSameYear;
        });

        if (subjectAlreadyInCart) {
          console.warn('⚠️ Subject already in cart for this year');
          this.toastService.showWarning('This subject is already in your cart for this year. Please remove the existing plan first if you want to change it.');
          return of(false);
        }

        console.log('✅ No duplicate found, proceeding to add...');

        return this.addPlanToCartBackend(planId, studentId, course);
      })
    );
  }

  /**
   * Actually add plan to backend (extracted method)
   */
  private addPlanToCartBackend(planId: number, studentId: number, course: Course): Observable<boolean> {
    const url = `${this.baseUrl}/Cart/items`;

    console.log('🛒 Adding to cart:', {
      url,
      subscriptionPlanId: planId,
      studentId: studentId,  // ✅ Student.Id (e.g., 1)
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
        let rawItems = [];
        if (response.data?.items) {
          rawItems = response.data.items;
        } else if (response.items) {
          rawItems = response.items;
        } else if (response.cartItems) {
          rawItems = response.cartItems;
        }

        console.log('📦 Extracted raw items:', rawItems);
        console.log('🔢 Items count:', rawItems.length);

        // Log first item structure to see what backend returns
        if (rawItems.length > 0) {
          console.log('🔍 First item structure:', JSON.stringify(rawItems[0], null, 2));
        }

        // Transform backend items to frontend CartItem structure
        // Backend: { cartItemId, subscriptionPlanId, planName, price, quantity, studentId, subjectId, yearId, termId }
        // Frontend: CartItem with both legacy (course) and new (subjectId, yearId) fields
        const items: CartItem[] = rawItems.map((backendItem: any) => ({
          // Legacy course structure (for backward compatibility)
          course: {
            id: backendItem.subscriptionPlanId || backendItem.courseId,
            subjectName: backendItem.planName || backendItem.courseName || 'Unknown Course',
            name: backendItem.planName || backendItem.courseName || 'Unknown Course',
            posterUrl: backendItem.imageUrl || backendItem.posterUrl || '',
            description: backendItem.description || backendItem.planName || '',
            categoryName: backendItem.categoryName || '',
            teacherName: backendItem.teacherName || '',
            instructor: backendItem.teacherName || backendItem.instructor,
            duration: backendItem.duration,
            price: backendItem.price,
            originalPrice: backendItem.originalPrice,
            level: backendItem.level,
            tags: backendItem.tags || []
          },
          quantity: backendItem.quantity || 1,
          selectedPlan: {
            id: backendItem.subscriptionPlanId,
            name: backendItem.planName || 'Standard Plan',
            price: backendItem.price,
            duration: backendItem.duration || 30,
            features: []
          },

          // ✅ NEW FIELDS from enhanced backend response
          cartItemId: backendItem.cartItemId,
          subscriptionPlanId: backendItem.subscriptionPlanId,
          planName: backendItem.planName,
          studentId: backendItem.studentId,
          price: backendItem.price,

          // Subject/Year/Term identifiers
          subjectId: backendItem.subjectId,
          subjectName: backendItem.subjectName,
          yearId: backendItem.yearId,
          yearNumber: backendItem.yearNumber,
          termId: backendItem.termId,
          termNumber: backendItem.termNumber,
          planType: backendItem.planType,

          // Keep backend fields for reference
          _backendData: {
            cartItemId: backendItem.cartItemId,
            subscriptionPlanId: backendItem.subscriptionPlanId,
            studentId: backendItem.studentId
          }
        } as any));

        console.log('✅ Transformed items:', items);

        // Log first transformed item with new fields
        if (items.length > 0) {
          console.log('🔍 First transformed item:', {
            subjectId: items[0].subjectId,
            subjectName: items[0].subjectName,
            yearId: items[0].yearId,
            yearNumber: items[0].yearNumber,
            termId: items[0].termId,
            termNumber: items[0].termNumber,
            planType: items[0].planType,
            cartItemId: items[0].cartItemId
          });
        }

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
    // Get plan name from window (set by modal component)
    const planName = (window as any).__selectedPlanName;
    return this.addPlanToCartInternal(planId, course, planName);
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
  removeFromCart(itemIdToRemove: number): Observable<boolean> {
    console.log('🗑️ Removing itemId:', itemIdToRemove, 'from cart');

    // Check if user is authenticated before making API call
    if (!this.authService.isAuthenticated()) {
      this.toastService.showWarning('Please log in to sync your cart with the server');
      return of(true);
    }

    // ⚠️ CRITICAL: Find cart item by cartItemId directly
    const currentCart = this.cartSubject.value;
    console.log('📦 Current cart items:', currentCart.items);

    const cartItem = currentCart.items.find((item: any) => {
      // Try to get cartItemId from multiple possible locations
      const itemCartId =
        item.cartItemId ||                       // Direct field (new structure)
        item._backendData?.cartItemId ||         // Backend data reference
        item.id;                                 // Fallback

      console.log('🔍 Checking item cartItemId:', itemCartId, 'against target:', itemIdToRemove);
      return itemCartId === itemIdToRemove;
    });

    if (!cartItem) {
      console.warn('⚠️ Cart item not found for cartItemId:', itemIdToRemove);
      console.warn('📦 Available cart items:', currentCart.items.map((i: any) => ({
        cartItemId: i.cartItemId || i._backendData?.cartItemId,
        subjectId: i.subjectId,
        subjectName: i.subjectName
      })));
      this.toastService.showError('Item not found in cart');
      return of(false);
    }

    // Use the itemIdToRemove directly as cartItemId
    const cartItemId = itemIdToRemove;

    console.log('🗑️ Removing cartItemId:', cartItemId, 'from backend');

    // Use correct backend endpoint: DELETE /api/Cart/items/{cartItemId}
    const url = `${this.baseUrl}/Cart/items/${cartItemId}`;

    return this.http.delete<any>(url).pipe(
      switchMap(() => {
        console.log('✅ Item removed from backend successfully');
        this.toastService.showSuccess('Course removed from cart!');

        // Reload cart from backend to sync
        const currentUser = this.authService.getCurrentUser();
        return this.loadCartFromBackend(currentUser?.studentId).pipe(
          map(() => true)
        );
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
    const item = currentCart.items.find((item: any) =>
      item.course?.id === courseId || item.subscriptionPlanId === courseId
    );

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
   * Now checks by subject name and year instead of ID
   */
  isInCart(courseId: number): boolean {
    const cart = this.cartSubject.value;

    if (!cart.items || cart.items.length === 0) {
      return false;
    }

    // First try to match by ID (for plans already in cart)
    const matchById = cart.items.some((item: any) => {
      const itemCourseId =
        item.course?.id ||                        // Transformed frontend structure
        item._backendData?.subscriptionPlanId ||  // Backend data reference
        item.subscriptionPlanId;                  // Direct backend structure

      return itemCourseId === courseId;
    });

    if (matchById) {
      return true;
    }

    // If no ID match, check by subject name and year
    // This handles the case where we're checking from the courses page
    // but the cart has different plan IDs for the same subject
    return false; // Will be handled by the courses component directly
  }

  /**
   * Check if a subject is in cart by name and year
   */
  isSubjectInCart(subjectName: string, yearId?: number): boolean {
    const cart = this.cartSubject.value;

    if (!cart.items || cart.items.length === 0) {
      return false;
    }

    console.log('🔍 isSubjectInCart checking (legacy method):', {
      subjectName,
      yearId,
      cartItemsCount: cart.items.length
    });

    // Note: This is the legacy method. Prefer using exact ID matching from cart items.
    // This method is kept for backward compatibility.

    return cart.items.some((item: any) => {
      // New structure with IDs (preferred)
      if (item.subjectName && item.yearId !== undefined) {
        const match = item.subjectName.toLowerCase() === subjectName.toLowerCase() &&
                     (!yearId || item.yearId === yearId);

        console.log('� Checking cart item (new structure):', {
          itemSubjectName: item.subjectName,
          targetSubjectName: subjectName,
          itemYearId: item.yearId,
          targetYearId: yearId,
          match
        });

        return match;
      }

      // Legacy structure (old way)
      const itemFullName = (item.course?.subjectName || item.course?.name || '').trim();
      const itemSubjectName = itemFullName.split(' - ')[0].trim().toLowerCase();
      const baseSubjectName = subjectName.split(' - ')[0].trim().toLowerCase();
      const itemNameNoYear = itemSubjectName.replace(/year\s*\d+/gi, '').trim();
      const courseNameNoYear = baseSubjectName.replace(/year\s*\d+/gi, '').trim();

      return itemNameNoYear === courseNameNoYear;
    });
  }  /**
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
    cart.totalAmount = cart.items.reduce((total, item: any) => {
      // New structure with price field
      if (item.price !== undefined) {
        return total + (item.price * item.quantity);
      }
      // Legacy structure with course.price
      return total + ((item.course?.price || 0) * item.quantity);
    }, 0);
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

  /**
   * Get current term and week for a student
   * Determines which term/week student should be viewing based on subscription dates
   * @param studentId - The ID of the student
   * @param subjectId - Optional: Filter by specific subject
   * @returns Observable of CurrentTermWeekDto
   */
  getCurrentTermWeek(studentId: number, subjectId?: number): Observable<CurrentTermWeekDto> {
    let url = `${this.baseUrl}/StudentSubjects/student/${studentId}/current-term-week`;
    
    if (subjectId) {
      url += `?subjectId=${subjectId}`;
    }

    console.log('📅 Fetching current term/week:', { studentId, subjectId, url });

    return this.http.get<CurrentTermWeekDto>(url).pipe(
      tap(result => {
        console.log('✅ Current term/week response:', {
          hasAccess: result.hasAccess,
          currentTerm: result.currentTermName,
          currentWeek: result.currentWeekNumber,
          progress: result.progressPercentage,
          subject: result.subjectName
        });
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error fetching current term/week:', error);
        
        // Return a default "no access" response on error
        const defaultResponse: CurrentTermWeekDto = {
          studentId,
          currentTermId: null,
          currentTermNumber: null,
          currentTermName: null,
          currentWeekId: null,
          currentWeekNumber: null,
          termStartDate: null,
          termEndDate: null,
          weekStartDate: null,
          weekEndDate: null,
          totalWeeksInTerm: null,
          weeksRemaining: null,
          progressPercentage: null,
          subscriptionType: null,
          hasAccess: false,
          message: error.status === 404 
            ? 'Student not found' 
            : error.status === 401
            ? 'Please log in to continue'
            : 'Unable to load subscription information',
          subjectId: subjectId || null,
          subjectName: null
        };

        return of(defaultResponse);
      })
    );
  }
}
