import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Cart, CartItem } from '../../models/course.models';
import { CoursesService } from '../../core/services/courses.service';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';

// Student interface for the cart component
interface Student {
  id: number;
  userName: string;
  age: number;
  year: number;
}

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

  // Student selection properties
  students = signal<Student[]>([]);
  loadingStudents = signal(false);
  selectedStudentId = signal<number | null>(null);

  // User role detection
  isStudent = signal<boolean>(false);
  currentUserRole = signal<string>('');

  constructor(
    private coursesService: CoursesService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.coursesService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => this.cart.set(cart));

    // Check user role (this will call loadStudents if needed)
    this.checkUserRole();
    
    // Load cart from backend
    this.loadCartFromBackend();
  }

  /**
   * Load cart from backend API
   */
  private loadCartFromBackend(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      console.warn('⚠️ No user logged in, skipping cart load');
      return;
    }

    console.log('📥 Loading cart from backend...');
    this.loading.set(true);

    this.coursesService.loadCartFromBackend(currentUser.studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          console.log('✅ Cart loaded successfully:', cart);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('❌ Failed to load cart:', error);
          this.loading.set(false);
        }
      });
  }

  /**
   * Check if current user is a Student
   */
  private checkUserRole(): void {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      // Handle role as array or string
      let userRole = currentUser.role;

      // If role is an array, get the first role or check if 'Student' exists
      if (Array.isArray(userRole)) {
        // Check if 'Student' role exists in array
        const hasStudentRole = userRole.some(r =>
          typeof r === 'string' && r.toLowerCase() === 'student'
        );
        this.isStudent.set(hasStudentRole);
        this.currentUserRole.set(userRole.join(', '));
      } else if (typeof userRole === 'string') {
        // Handle single role as string
        this.currentUserRole.set(userRole);
        this.isStudent.set(userRole.toLowerCase() === 'student');
      }

      // If student, auto-select their Student.Id (NOT User.Id)
      if (this.isStudent() && currentUser.studentId) {
        this.selectedStudentId.set(currentUser.studentId);
        console.log('✅ Student detected - Auto-selected Student.Id:', currentUser.studentId);
        console.log('🎓 Using Student.Id for cart (NOT User.Id)');
      } else if (this.isStudent() && !currentUser.studentId) {
        console.error('❌ Student role but no studentId! Please re-login.');
      }

      console.log('🔍 Cart - User Role Check:', {
        roles: currentUser.role,
        isStudent: this.isStudent(),
        userId: currentUser.id,  // User.Id (authentication)
        studentId: currentUser.studentId,  // Student.Id (cart)
        selectedStudentId: this.selectedStudentId(),
        willLoadStudents: !this.isStudent()
      });

      // ✅ Load students after role check (only for parents)
      if (!this.isStudent()) {
        console.log('👨‍👩‍👧 Parent detected - Loading children...');
        this.loadStudents();
      } else {
        console.log('🎓 Student detected - Skipping student list load');
      }
    }
  }  ngOnDestroy(): void {
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
      // Don't reset student selection if user is a student (they can't change it)
      if (!this.isStudent()) {
        this.selectedStudentId.set(null);
      }
    }
  }

  /**
   * Enroll in all courses
   */
  enrollInAll(): void {
    // Check if student is selected
    if (this.selectedStudentId() === null) {
      alert('Please select the student you want to enroll in the courses');
      return;
    }

    const selectedStudent = this.students().find(s => s.id === this.selectedStudentId());
    if (!selectedStudent) {
      alert('The selected student is invalid');
      return;
    }

    const confirmMessage = `Are you sure you want to enroll student "${selectedStudent.userName}" in all courses for $${this.cart().totalAmount}?`;

    if (confirm(confirmMessage)) {
      this.loading.set(true);

      // Simulate enrollment process with student information
      const enrollmentPromises = this.cart().items.map(item =>
        this.coursesService.enrollInCourse(item.course.id).toPromise()
      );

      Promise.all(enrollmentPromises)
        .then(() => {
          alert(`Student "${selectedStudent.userName}" has been successfully enrolled in all courses!`);
          this.coursesService.clearCart();
          // Reset student selection
          this.selectedStudentId.set(null);
        })
        .catch(() => {
          alert('Failed to enroll in some courses. Please try again.');
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

  /**
   * Load students for the current parent
   */
  private loadStudents(): void {
    this.loadingStudents.set(true);

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('Auth token not found');
      this.loadingStudents.set(false);
      return;
    }

    let parentId: number;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      parentId = Number(payload.nameid);
    } catch (e) {
      console.error('Invalid token format');
      this.loadingStudents.set(false);
      return;
    }

    if (!parentId) {
      console.error('Parent ID not found in token');
      this.loadingStudents.set(false);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const url = `${environment.apiBaseUrl}/User/get-children/${parentId}`;

    this.http.get<Student[]>(url, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (students) => {
          console.log('Raw students data:', students);

          // Check for duplicate IDs
          const ids = students.map(s => s.id);
          const uniqueIds = new Set(ids);
          if (ids.length !== uniqueIds.size) {
            console.warn('⚠️ Duplicate student IDs detected!', ids);
          }

          this.students.set(students);
          // Reset selection first
          this.selectedStudentId.set(null);

          // Auto-select first student if only one exists
          if (students.length === 1) {
            this.selectedStudentId.set(students[0].id);
            console.log('Auto-selected student:', students[0].userName, 'with ID:', students[0].id);
          } else if (students.length > 1) {
            console.log('Multiple students found:', students.length, 'students. Please select one manually.');
          }

          this.loadingStudents.set(false);
        },
        error: (error) => {
          console.error('Error loading students:', error);
          this.students.set([]);
          this.loadingStudents.set(false);
        }
      });
  }

  /**
   * Select a student for enrollment
   */
  selectStudent(studentId: number): void {
    console.log('Attempting to select student with ID:', studentId);

    // Validate that the student ID exists in our list
    const student = this.students().find(s => s.id === studentId);
    if (!student) {
      console.error('Student not found with ID:', studentId);
      return;
    }

    // If the same student is clicked again, deselect them
    if (this.selectedStudentId() === studentId) {
      console.log('Deselecting student:', student.userName);
      this.selectedStudentId.set(null);
    } else {
      // Select the new student (only one can be selected at a time)
      console.log('Selecting student:', student.userName, 'with ID:', studentId);
      this.selectedStudentId.set(studentId);
    }
  }

  /**
   * Clear student selection (only for parents)
   */
  clearStudentSelection(): void {
    // Don't allow students to clear selection (they can't change it)
    if (!this.isStudent()) {
      this.selectedStudentId.set(null);
    }
  }

  /**
   * Get student initials for avatar
   */
  getStudentInitials(userName: string): string {
    if (!userName) return 'S';

    const words = userName.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Track by function for student list to avoid duplicate key errors
   */
  trackByStudentIndex(index: number, student: Student): string {
    // Use a combination of index and id to ensure uniqueness
    return `${index}-${student.id || 'unknown'}-${student.userName || 'unnamed'}`;
  }
}
