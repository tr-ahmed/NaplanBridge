# دليل الإصلاحات المطلوبة - NaplanBridge Platform

## 🎯 الهدف
إكمال تطبيق جميع الـ case scenarios المتبقية من API Documentation

---

## 1️⃣ إضافة واجهة Register Teacher (Admin Only) 🔴

### الموقع المقترح
```
/src/app/admin/register-teacher/
  ├── register-teacher.component.ts
  ├── register-teacher.component.html
  └── register-teacher.component.scss
```

### المتطلبات
```typescript
// register-teacher.component.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';

export class RegisterTeacherComponent {
  registerForm = this.fb.group({
    userName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    age: ['', [Validators.required, Validators.min(22), Validators.max(70)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0-9]{9}$/)]]
  });

  onSubmit() {
    if (this.registerForm.valid) {
      // POST /api/account/register-teacher
      // Requires: Admin role + JWT token
      this.adminService.registerTeacher(this.registerForm.value).subscribe({
        next: (result) => {
          this.toastService.showSuccess('Teacher registered successfully');
          this.router.navigate(['/admin/users']);
        },
        error: (err) => {
          this.toastService.showError('Failed to register teacher');
        }
      });
    }
  }
}
```

### HTML Template
```html
<form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="max-w-2xl mx-auto">
  <h2 class="text-2xl font-bold mb-6">Register New Teacher</h2>
  
  <!-- Username -->
  <div class="mb-4">
    <label class="block mb-2">Username *</label>
    <input type="text" formControlName="userName" 
           class="w-full border rounded px-3 py-2"
           placeholder="teacher_john">
    @if (registerForm.get('userName')?.invalid && registerForm.get('userName')?.touched) {
      <small class="text-red-500">Username is required (min 3 characters)</small>
    }
  </div>

  <!-- Email -->
  <div class="mb-4">
    <label class="block mb-2">Email *</label>
    <input type="email" formControlName="email" 
           class="w-full border rounded px-3 py-2"
           placeholder="teacher@naplan.edu">
    @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
      <small class="text-red-500">Valid email is required</small>
    }
  </div>

  <!-- Password -->
  <div class="mb-4">
    <label class="block mb-2">Password *</label>
    <input type="password" formControlName="password" 
           class="w-full border rounded px-3 py-2">
    @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
      <small class="text-red-500">Password must be at least 6 characters</small>
    }
  </div>

  <!-- Age -->
  <div class="mb-4">
    <label class="block mb-2">Age *</label>
    <input type="number" formControlName="age" 
           class="w-full border rounded px-3 py-2"
           min="22" max="70">
    @if (registerForm.get('age')?.invalid && registerForm.get('age')?.touched) {
      <small class="text-red-500">Age must be between 22 and 70</small>
    }
  </div>

  <!-- Phone Number -->
  <div class="mb-4">
    <label class="block mb-2">Phone Number *</label>
    <input type="tel" formControlName="phoneNumber" 
           class="w-full border rounded px-3 py-2"
           placeholder="01234567890">
    @if (registerForm.get('phoneNumber')?.invalid && registerForm.get('phoneNumber')?.touched) {
      <small class="text-red-500">Valid Egyptian phone number is required</small>
    }
  </div>

  <!-- Submit Button -->
  <button type="submit" 
          [disabled]="registerForm.invalid || loading()"
          class="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700">
    @if (loading()) {
      <span>Registering...</span>
    } @else {
      <span>Register Teacher</span>
    }
  </button>
</form>
```

### إضافة Route
```typescript
// In admin.routes.ts
{
  path: 'register-teacher',
  loadComponent: () => import('./register-teacher/register-teacher.component')
    .then(c => c.RegisterTeacherComponent),
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Admin'] }
}
```

---

## 2️⃣ إضافة واجهة Term Instructors Management 🔴

### الموقع المقترح
```
/src/app/admin/term-instructors/
  ├── term-instructors.component.ts
  ├── term-instructors.component.html
  └── term-instructors.component.scss
```

### المتطلبات
```typescript
// term-instructors.component.ts
export class TermInstructorsComponent implements OnInit {
  termId = signal<number>(0);
  term = signal<Term | null>(null);
  instructors = signal<TermInstructor[]>([]);
  availableTeachers = signal<Teacher[]>([]);
  loading = signal<boolean>(false);

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.termId.set(+params['id']);
      this.loadTermInstructors();
      this.loadAvailableTeachers();
    });
  }

  loadTermInstructors() {
    // GET /api/terms/{termId}/instructors
    this.termService.getTermInstructors(this.termId()).subscribe({
      next: (instructors) => {
        this.instructors.set(instructors);
      }
    });
  }

  loadAvailableTeachers() {
    // GET /api/teachers (all teachers)
    this.teacherService.getAllTeachers().subscribe({
      next: (teachers) => {
        this.availableTeachers.set(teachers);
      }
    });
  }

  assignInstructor(teacherId: number, isPrimary: boolean) {
    // POST /api/terms/{termId}/instructors
    this.termService.assignInstructor(this.termId(), {
      instructorId: teacherId,
      isPrimary: isPrimary
    }).subscribe({
      next: () => {
        this.toastService.showSuccess('Instructor assigned successfully');
        this.loadTermInstructors();
      },
      error: (err) => {
        this.toastService.showError('Failed to assign instructor');
      }
    });
  }

  removeInstructor(instructorId: number) {
    // DELETE /api/terms/{termId}/instructors/{instructorId}
    if (confirm('Are you sure you want to remove this instructor?')) {
      this.termService.removeInstructor(this.termId(), instructorId).subscribe({
        next: () => {
          this.toastService.showSuccess('Instructor removed successfully');
          this.loadTermInstructors();
        },
        error: (err) => {
          this.toastService.showError('Failed to remove instructor');
        }
      });
    }
  }

  updateInstructorRole(instructorId: number, isPrimary: boolean) {
    // PUT /api/terms/{termId}/instructors/{instructorId}
    this.termService.updateInstructorRole(this.termId(), instructorId, {
      isPrimary: isPrimary
    }).subscribe({
      next: () => {
        this.toastService.showSuccess('Instructor role updated');
        this.loadTermInstructors();
      }
    });
  }
}
```

### HTML Template
```html
<div class="container mx-auto p-6">
  <h2 class="text-2xl font-bold mb-6">Manage Term Instructors</h2>

  <!-- Current Instructors -->
  <div class="mb-8">
    <h3 class="text-xl font-semibold mb-4">Current Instructors</h3>
    
    @if (instructors().length === 0) {
      <p class="text-gray-500">No instructors assigned yet</p>
    } @else {
      <div class="grid gap-4">
        @for (instructor of instructors(); track instructor.instructorId) {
          <div class="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <h4 class="font-semibold">{{ instructor.instructorName }}</h4>
              <p class="text-sm text-gray-600">{{ instructor.instructorEmail }}</p>
              <span class="text-xs px-2 py-1 rounded"
                    [class.bg-blue-100]="instructor.isPrimary"
                    [class.bg-gray-100]="!instructor.isPrimary">
                {{ instructor.isPrimary ? 'Primary Instructor' : 'Assistant' }}
              </span>
            </div>
            
            <div class="flex gap-2">
              <!-- Toggle Primary/Assistant -->
              <button (click)="updateInstructorRole(instructor.instructorId, !instructor.isPrimary)"
                      class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                {{ instructor.isPrimary ? 'Make Assistant' : 'Make Primary' }}
              </button>
              
              <!-- Remove -->
              <button (click)="removeInstructor(instructor.instructorId)"
                      class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                Remove
              </button>
            </div>
          </div>
        }
      </div>
    }
  </div>

  <!-- Add New Instructor -->
  <div>
    <h3 class="text-xl font-semibold mb-4">Add Instructor</h3>
    
    <div class="border rounded-lg p-4">
      <label class="block mb-2">Select Teacher</label>
      <select #teacherSelect class="w-full border rounded px-3 py-2 mb-4">
        <option value="">-- Select Teacher --</option>
        @for (teacher of availableTeachers(); track teacher.id) {
          <option [value]="teacher.id">{{ teacher.name }} ({{ teacher.email }})</option>
        }
      </select>

      <label class="flex items-center mb-4">
        <input type="checkbox" #isPrimaryCheckbox class="mr-2">
        <span>Assign as Primary Instructor</span>
      </label>

      <button (click)="assignInstructor(+teacherSelect.value, isPrimaryCheckbox.checked)"
              [disabled]="!teacherSelect.value"
              class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        Assign Instructor
      </button>
    </div>
  </div>
</div>
```

---

## 3️⃣ إضافة Rate Limiting UI Handler 🟡

### الموقع
```typescript
// في HTTP Interceptor: /src/app/core/interceptors/functional-error.interceptor.ts
```

### الإصلاح
```typescript
export const functionalErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // Handle Rate Limiting (429)
      if (error.status === 429) {
        const retryAfter = error.error.retryAfter || 60;
        const minutes = Math.ceil(retryAfter / 60);
        const seconds = Math.ceil(retryAfter % 60);
        
        let message = 'Too many requests. Please try again';
        if (minutes > 0) {
          message += ` in ${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
          message += ` in ${seconds} second${seconds > 1 ? 's' : ''}`;
        }
        
        toastService.showWarning(message, 5000); // Show for 5 seconds
        
        // Optionally: Disable UI for retryAfter duration
        // lockUIService.lock(retryAfter * 1000);
      }
      
      // Handle other errors...
      else if (error.status === 401) {
        toastService.showError('Please login to continue');
      }
      else if (error.status === 403) {
        toastService.showError('You do not have permission to perform this action');
      }
      else if (error.status === 404) {
        toastService.showError('Resource not found');
      }
      else if (error.status === 500) {
        toastService.showError('Server error. Please try again later');
      }

      return throwError(() => error);
    })
  );
};
```

### إضافة UI Lock Service (Optional)
```typescript
// lock-ui.service.ts
@Injectable({ providedIn: 'root' })
export class LockUIService {
  private locked = signal<boolean>(false);
  private remainingTime = signal<number>(0);
  
  isLocked = computed(() => this.locked());
  timeRemaining = computed(() => this.remainingTime());

  lock(durationMs: number) {
    this.locked.set(true);
    this.remainingTime.set(Math.ceil(durationMs / 1000));

    const interval = setInterval(() => {
      const current = this.remainingTime();
      if (current <= 1) {
        this.locked.set(false);
        this.remainingTime.set(0);
        clearInterval(interval);
      } else {
        this.remainingTime.set(current - 1);
      }
    }, 1000);
  }
}
```

---

## 4️⃣ إضافة Subscription Plans Display 🟡

### الموقع المقترح
```
/src/app/features/subscription-plans/
  ├── subscription-plans.component.ts
  ├── subscription-plans.component.html
  └── subscription-plans.component.scss
```

### المتطلبات
```typescript
export class SubscriptionPlansComponent implements OnInit {
  studentId = signal<number>(0);
  availablePlans = signal<AvailablePlan[]>([]);
  loading = signal<boolean>(false);

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.studentId.set(currentUser.id);
      this.loadAvailablePlans();
    }
  }

  loadAvailablePlans() {
    // GET /api/subscriptionplans/student/{studentId}/available
    this.subscriptionService.getAvailablePlans(this.studentId()).subscribe({
      next: (plans) => {
        this.availablePlans.set(plans);
      }
    });
  }

  subscribe(planId: number) {
    // Navigate to checkout
    this.router.navigate(['/checkout', planId]);
  }
}
```

### HTML Template
```html
<div class="container mx-auto p-6">
  <h2 class="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>

  <div class="grid md:grid-cols-3 gap-6">
    @for (plan of availablePlans(); track plan.planId) {
      <div class="border rounded-lg p-6 hover:shadow-xl transition"
           [class.border-blue-500]="plan.isPopular"
           [class.border-2]="plan.isPopular">
        
        @if (plan.isPopular) {
          <span class="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
            Most Popular
          </span>
        }

        <h3 class="text-xl font-bold mt-4">{{ plan.name }}</h3>
        <p class="text-gray-600 text-sm mb-4">{{ plan.coverageDescription }}</p>

        <div class="text-4xl font-bold text-blue-600 mb-2">
          ${{ plan.price }}
          @if (plan.discount) {
            <span class="text-lg line-through text-gray-400 ml-2">
              ${{ plan.price / (1 - plan.discount / 100) | number:'1.2-2' }}
            </span>
          }
        </div>

        <p class="text-sm text-gray-500 mb-6">{{ plan.description }}</p>

        <button (click)="subscribe(plan.planId)"
                class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
          Subscribe Now
        </button>
      </div>
    }
  </div>
</div>
```

---

## 5️⃣ إضافة Year Exam Type Support 🟡

### الموقع
```typescript
// في create-edit-exam.component.ts
```

### الإصلاح
```typescript
// Update examTypes array
examTypes: ExamType[] = ['Lesson', 'Monthly', 'Term', 'Year'];

// في HTML template
<select formControlName="examType" class="form-control">
  <option value="Lesson">Lesson Quiz</option>
  <option value="Monthly">Monthly Assessment</option>
  <option value="Term">Term Final Exam</option>
  <option value="Year">Year Final Exam</option>
</select>

// Show/hide fields based on exam type
@if (examForm.get('examType')?.value === 'Lesson') {
  <div class="form-group">
    <label>Lesson</label>
    <select formControlName="lessonId">
      <!-- lessons dropdown -->
    </select>
  </div>
}

@if (examForm.get('examType')?.value === 'Term' || examForm.get('examType')?.value === 'Monthly') {
  <div class="form-group">
    <label>Term</label>
    <select formControlName="termId">
      <!-- terms dropdown -->
    </select>
  </div>
}

@if (examForm.get('examType')?.value === 'Year') {
  <div class="form-group">
    <label>Academic Year</label>
    <select formControlName="yearId">
      <!-- years dropdown -->
    </select>
  </div>
}
```

---

## 6️⃣ إضافة Health Check Dashboard 🟢

### الموقع المقترح
```
/src/app/admin/health-check/
  ├── health-check.component.ts
  └── health-check.component.html
```

### المتطلبات
```typescript
export class HealthCheckComponent implements OnInit {
  healthStatus = signal<HealthStatus | null>(null);

  ngOnInit() {
    this.checkHealth();
    
    // Auto-refresh every 30 seconds
    setInterval(() => this.checkHealth(), 30000);
  }

  checkHealth() {
    // GET /health
    this.http.get<HealthStatus>('/health').subscribe({
      next: (status) => {
        this.healthStatus.set(status);
      }
    });
  }
}
```

### HTML
```html
<div class="container mx-auto p-6">
  <h2 class="text-2xl font-bold mb-6">System Health Status</h2>

  @if (healthStatus(); as status) {
    <div class="mb-4 p-4 rounded"
         [class.bg-green-100]="status.status === 'Healthy'"
         [class.bg-red-100]="status.status !== 'Healthy'">
      <span class="text-2xl font-bold">{{ status.status }}</span>
    </div>

    <div class="grid gap-4">
      @for (check of status.checks; track check.name) {
        <div class="border rounded p-4">
          <div class="flex justify-between">
            <span class="font-semibold">{{ check.name }}</span>
            <span [class.text-green-600]="check.status === 'Healthy'"
                  [class.text-red-600]="check.status !== 'Healthy'">
              {{ check.status }}
            </span>
          </div>
          <small class="text-gray-500">{{ check.duration }}ms</small>
        </div>
      }
    </div>
  }
</div>
```

---

## 📝 ملخص الأولويات

### يجب تنفيذها الآن 🔴
1. Register Teacher Interface (Admin)
2. Term Instructors Management (Admin)
3. Rate Limiting UI Handler

### يُنصح بتنفيذها قريباً 🟡
4. Subscription Plans Display
5. Year Exam Type Support

### يمكن تأجيلها 🟢
6. Health Check Dashboard
7. Enhanced Error Messages
8. Subscription History for Parents

---

**تم إعداد الدليل بواسطة:** GitHub Copilot  
**التاريخ:** 30 أكتوبر 2025
