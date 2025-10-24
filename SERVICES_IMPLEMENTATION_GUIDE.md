# Services Implementation - Installation Guide

## ✅ Services Created Successfully

تم إنشاء جميع الـ Core Services المطلوبة:

### 1. **base-api.service.ts** ✅
- Base HTTP service with error handling
- Pagination support
- File upload/download
- Health check methods

### 2. **category.service.ts** ✅
- Categories CRUD
- Years CRUD
- Subject Names CRUD
- Full API integration

### 3. **subject.service.ts** ✅
- Subject CRUD with pagination
- Filter by category/year/term/week
- File upload for posters
- Enrollment statistics

### 4. **term.service.ts** ✅
- Term CRUD with Term-Level Data support
- Week CRUD
- **Term Instructors management (NEW)**
  - Assign/Remove instructors
  - Update instructor roles (Primary/Assistant)
  - Get teacher terms

### 5. **lesson.service.ts** ✅
- Lesson CRUD with video upload
- **Bunny.net video integration**
- Lesson questions CRUD
- Resources CRUD
- Download resources

### 6. **exam.service.ts** ✅
- Exam CRUD with all question types
- Student exam sessions (start/submit)
- **Manual grading for text answers**
- Exam statistics and analytics
- Pending grading management

### 7. **cart.service.ts** ✅
- Cart management
- Add/Update/Remove items
- Cart count signals for UI
- Quick add methods

### 8. **payment.service.ts** ✅
- Order creation from cart
- **Stripe checkout integration**
- Payment history
- Invoice management
- Coupon/discount system
- Refund requests

### 9. **progress.service.ts** ✅
- Student/Subject/Term/Lesson progress
- Dashboard statistics (Student, Teacher, Parent, Admin)
- Lesson analytics
- Progress reports
- Leaderboard
- Study time tracking
- Achievements

### 10. **video.service.ts** ✅
- **Bunny.net HLS player integration**
- Plyr UI controls
- Auto-save video progress
- Quality selection
- Fullscreen support
- Error recovery

---

## 📦 Required NPM Packages Installation

قبل تشغيل المشروع، يجب تثبيت المكتبات التالية:

```bash
# Navigate to project directory
cd "d:\Private\Ahmed Hamdi\angular\my-angular-app"

# Install video player libraries (Bunny.net HLS support)
npm install hls.js
npm install plyr
npm install @types/hls.js --save-dev

# Install Stripe for payment integration
npm install @stripe/stripe-js

# Install date manipulation library
npm install date-fns

# Install charts library (optional for analytics)
npm install chart.js ng2-charts

# Install icons library (optional)
npm install @ng-icons/core @ng-icons/heroicons
```

---

## 🔧 TypeScript Configuration Update

أضف التالي إلى `tsconfig.json` للسماح بالـ import:

```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

---

## 🎨 Plyr CSS Import

أضف الـ Plyr CSS إلى `angular.json`:

```json
{
  "projects": {
    "my-angular-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.scss",
              "node_modules/plyr/dist/plyr.css"
            ]
          }
        }
      }
    }
  }
}
```

أو أضفه في `src/styles.scss`:

```scss
@import 'plyr/dist/plyr.css';
```

---

## ⚙️ Environment Configuration Update

حدّث `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://naplanbridge.runasp.net/api',
  useMock: false,
  
  // Stripe Configuration
  stripePublishableKey: 'pk_test_YOUR_STRIPE_KEY',
  
  // Bunny.net Configuration
  bunnyStreamUrl: 'https://naplan.b-cdn.net',
  
  // Cache Expiration Times (milliseconds)
  cacheExpiration: {
    categories: 24 * 60 * 60 * 1000,  // 24 hours
    years: 24 * 60 * 60 * 1000,       // 24 hours
    subjects: 60 * 60 * 1000,         // 1 hour
    terms: 60 * 60 * 1000,            // 1 hour
    plans: 30 * 60 * 1000             // 30 minutes
  }
};
```

---

## 📝 Next Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Update AuthService
تحديث `auth.service.ts` لاستخدام `base-api.service.ts`

### 3. Create HTTP Interceptors
```bash
# Auth Interceptor
ng generate interceptor core/interceptors/auth --functional

# Error Interceptor
ng generate interceptor core/interceptors/error --functional

# Loading Interceptor
ng generate interceptor core/interceptors/loading --functional
```

### 4. Create Guards
```bash
# Subscription Guard
ng generate guard core/guards/subscription --functional
```

### 5. Update app.config.ts
```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loadingInterceptor
      ])
    ),
    provideAnimations()
  ]
};
```

### 6. Start Creating Components
ابدأ بإنشاء الـ Components حسب الأولويات:
1. Student Features (Lesson Player, Exam Taking)
2. Parent Features (Cart, Checkout)
3. Teacher Features (Content Management, Grading)
4. Admin Features (Dashboard, Management)

---

## 🧪 Testing Services

بعد تثبيت المكتبات، اختبر الـ Services:

```typescript
// في أي component
import { inject } from '@angular/core';
import { CategoryService } from './core/services/category.service';

export class TestComponent {
  private categoryService = inject(CategoryService);
  
  ngOnInit() {
    // Test get categories
    this.categoryService.getCategories().subscribe({
      next: (categories) => console.log('Categories:', categories),
      error: (error) => console.error('Error:', error)
    });
  }
}
```

---

## 📚 API Integration Checklist

- [x] Base API Service with error handling
- [x] Category/Year/Subject Name Service
- [x] Subject Service with pagination
- [x] Term Service with Instructors
- [x] Lesson Service with Bunny.net
- [x] Exam Service with grading
- [x] Subscription Service with access control
- [x] Cart Service
- [x] Payment Service with Stripe
- [x] Progress Service with analytics
- [x] Video Service with HLS
- [ ] Auth Service update
- [ ] HTTP Interceptors
- [ ] Guards implementation

---

## 🎯 Usage Examples

### Example 1: Browse and Subscribe
```typescript
// Get available plans for student
this.subscriptionService.getAvailablePlans(studentId).subscribe(plans => {
  console.log('Available plans:', plans);
});

// Add to cart
this.cartService.addToCart({
  subscriptionPlanId: planId,
  studentId: studentId,
  quantity: 1
}).subscribe(response => {
  console.log('Added to cart:', response);
});

// Proceed to checkout
this.paymentService.createOrderFromCart().subscribe(order => {
  console.log('Order created:', order);
  
  // Create Stripe checkout
  this.paymentService.createCheckoutSession({
    orderId: order.id,
    successUrl: 'http://localhost:4200/payment/success',
    cancelUrl: 'http://localhost:4200/payment/cancel'
  }).subscribe(session => {
    // Redirect to Stripe
    window.location.href = session.sessionUrl;
  });
});
```

### Example 2: Watch Lesson with Progress Tracking
```typescript
// In lesson-player.component.ts
ngAfterViewInit() {
  const videoElement = this.videoElementRef.nativeElement;
  
  this.videoService.initializePlayer({
    videoUrl: this.lesson.videoUrl,
    posterUrl: this.lesson.posterUrl,
    provider: this.lesson.videoProvider,
    startTime: this.lastWatchedPosition
  }, videoElement, this.lesson.id);
  
  // Listen to video end event
  this.videoService.onVideoEnded.subscribe(() => {
    console.log('Lesson completed!');
  });
}
```

### Example 3: Take Exam
```typescript
// Start exam
this.examService.startExam(examId).subscribe(session => {
  this.examSession = session;
  this.startTimer(session.durationInMinutes);
});

// Submit exam
this.examService.submitExam(examId, {
  studentExamId: this.examSession.studentExamId,
  answers: this.collectAnswers()
}).subscribe(result => {
  console.log('Exam result:', result);
  this.showResults(result);
});
```

---

## ✅ Summary

تم إنشاء **10 Services** كاملة تغطي:
- ✅ Content Management (Categories, Subjects, Terms, Lessons)
- ✅ Assessment System (Exams with all question types)
- ✅ Subscription & Access Control
- ✅ Payment & Cart (with Stripe)
- ✅ Progress Tracking & Analytics
- ✅ Video Player (Bunny.net HLS)

**الخطوة التالية**: تثبيت المكتبات المطلوبة وإنشاء الـ Interceptors والـ Components.

---

**Created:** 2025-10-24
**Status:** Ready for NPM Install ✅
