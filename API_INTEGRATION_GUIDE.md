# 🔌 API Integration Guide - NaplanBridge Frontend

## ✅ ما تم إنجازه

تم إعداد Frontend للعمل مع Backend API الحقيقي مع دعم Mock Data Fallback!

---

## 📋 الملفات المُحدّثة

### 1. **Environment Files** ⚙️

#### `src/environments/environment.ts` (Development)
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://naplanbridge.runasp.net/api',
  useMock: false, // Set to true to use mock data only
  enableMockFallback: true, // Enable fallback to mock data on API failure
  apiTimeout: 10000, // API request timeout in milliseconds
  stripePublishableKey: 'pk_test_YOUR_KEY',
  bunnyNet: {
    apiKey: 'YOUR_BUNNY_API_KEY',
    libraryId: 'YOUR_LIBRARY_ID',
    pullZone: 'YOUR_PULL_ZONE',
    storageZone: 'YOUR_STORAGE_ZONE'
  }
};
```

#### `src/environments/environment.prod.ts` (Production)
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://naplanbridge.runasp.net/api',
  useMock: false,
  enableMockFallback: false, // Disable in production
  apiTimeout: 15000,
  stripePublishableKey: 'pk_live_YOUR_LIVE_KEY',
  bunnyNet: { /* ... */ }
};
```

---

### 2. **Mock Data Service** 🎭

**File:** `src/app/core/services/mock-data.service.ts`

**Features:**
- ✅ Wraps API calls with automatic fallback
- ✅ Provides mock data for all entities
- ✅ Configurable delay for realistic simulation
- ✅ Automatic error handling
- ✅ Smart role detection from email

**Usage Example:**
```typescript
// In any service
return this.mockData.withMockFallback(
  this.http.get<User[]>(`${apiUrl}/users`),
  this.mockData.getMockUsers() // fallback data
);
```

---

### 3. **Updated AuthService** 🔐

**File:** `src/app/auth/auth.service.ts`

**Changes:**
- ✅ Integrated MockDataService
- ✅ Added timeout handling
- ✅ Smart role detection from email
- ✅ Automatic fallback on API failure
- ✅ Stores auth data properly

**Login Flow:**
```typescript
1. Check if useMock = true → Return mock data immediately
2. Try API call with timeout (10s)
3. On success → Store auth data, navigate
4. On failure + fallback enabled → Use mock data
5. On failure + no fallback → Return error
```

**Test Credentials (Mock):**
```
Admin:   admin@test.com / any password
Teacher: teacher@test.com / any password
Parent:  parent@test.com / any password
Student: student@test.com / any password
```

---

## 🎯 كيفية الاستخدام

### **Scenario 1: Development مع API حقيقي**
```typescript
// environment.ts
useMock: false,
enableMockFallback: true
```
- يحاول الاتصال بالـ API الحقيقي
- إذا فشل، يستخدم Mock Data
- مثالي للتطوير

### **Scenario 2: Testing مع Mock Data فقط**
```typescript
// environment.ts
useMock: true,
enableMockFallback: true
```
- يستخدم Mock Data مباشرة
- لا يحاول الاتصال بالـ API
- مثالي للاختبار السريع

### **Scenario 3: Production**
```typescript
// environment.prod.ts
useMock: false,
enableMockFallback: false
```
- يستخدم API الحقيقي فقط
- لا fallback
- يُظهر الأخطاء للمستخدم

---

## 📊 Mock Data المتوفر

### **Users & Auth:**
```typescript
getMockUser(role)           // User with specific role
```

### **Subjects & Lessons:**
```typescript
getMockSubjects()           // 6 subjects
getMockLessons(subjectId)   // 10 lessons per subject
```

### **Exams:**
```typescript
getMockExams()              // 5 exams
getMockExamQuestions(id)    // 5 questions per exam
```

### **Subscription & Payment:**
```typescript
getMockSubscriptionPlans()  // 4 subscription plans
getMockCart()               // Shopping cart with items
```

### **Statistics:**
```typescript
getMockStudentStats()       // Student dashboard stats
getMockTeacherStats()       // Teacher dashboard stats
getMockAdminStats()         // Admin dashboard stats
```

### **Notifications:**
```typescript
getMockNotifications()      // 5 notifications
```

---

## 🔧 خطوات التكامل المتبقية

### **للخدمات الأخرى (Services):**

يجب تحديث هذه الخدمات بنفس النمط:

1. **Import MockDataService:**
```typescript
import { MockDataService } from './mock-data.service';
```

2. **Inject في Constructor:**
```typescript
constructor(
  private http: HttpClient,
  private mockData: MockDataService
) {}
```

3. **Wrap API Calls:**
```typescript
getItems(): Observable<Item[]> {
  const mockItems = this.mockData.getMockItems();
  
  return this.mockData.withMockFallback(
    this.http.get<Item[]>(`${apiUrl}/items`).pipe(
      timeout(environment.apiTimeout)
    ),
    mockItems
  );
}
```

---

## 📝 الخدمات التي تحتاج تحديث

### **Core Services:**
- ✅ `auth.service.ts` - مُحدّث
- ⏳ `subject.service.ts` - يحتاج تحديث الـ models
- ⏳ `lesson.service.ts` - جاهز للتحديث
- ⏳ `exam.service.ts` - جاهز للتحديث
- ⏳ `payment.service.ts` - جاهز للتحديث
- ⏳ `subscription.service.ts` - جاهز للتحديث
- ⏳ `cart.service.ts` - جاهز للتحديث
- ⏳ `order.service.ts` - جاهز للتحديث
- ⏳ `notification.service.ts` - جاهز للتحديث

---

## 🎨 UI Indicators

### **عرض حالة الاتصال:**

يمكن إضافة مؤشر في الـ UI:

```typescript
// app.component.ts
showConnectionStatus = signal<'api' | 'mock' | 'offline'>('api');

ngOnInit() {
  if (environment.useMock) {
    this.showConnectionStatus.set('mock');
  }
}
```

```html
<!-- app.component.html -->
@if (showConnectionStatus() === 'mock') {
  <div class="bg-yellow-100 text-yellow-800 px-4 py-2 text-center text-sm">
    ⚠️ Using Mock Data (Development Mode)
  </div>
}
```

---

## 🧪 Testing

### **Test Backend Connection:**

```typescript
// Test in browser console
fetch('https://naplanbridge.runasp.net/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### **Test Login:**

```typescript
// In login component
this.authService.login('admin@test.com', 'any')
  .subscribe(success => {
    console.log('Login result:', success);
  });
```

---

## 🚀 Next Steps

### **Immediate:**
1. ✅ Test login with real API
2. ✅ Verify Mock fallback works
3. ⏳ Update remaining services
4. ⏳ Add error toast notifications
5. ⏳ Add loading indicators

### **Short Term:**
1. Update all service methods
2. Fix TypeScript type errors
3. Test all features end-to-end
4. Add retry logic for failed requests
5. Implement request caching

### **Long Term:**
1. Add offline support
2. Implement request queue
3. Add analytics tracking
4. Performance monitoring
5. Error reporting service

---

## 💡 Tips & Best Practices

### **1. Always handle errors gracefully:**
```typescript
.pipe(
  catchError(error => {
    this.toastService.showError('Failed to load data');
    return of(mockData); // fallback
  })
)
```

### **2. Show loading states:**
```typescript
loading = signal<boolean>(true);

loadData() {
  this.loading.set(true);
  this.service.getData().subscribe({
    next: (data) => {
      this.data.set(data);
      this.loading.set(false);
    },
    error: () => this.loading.set(false)
  });
}
```

### **3. Use timeout for all API calls:**
```typescript
this.http.get(url).pipe(
  timeout(environment.apiTimeout),
  catchError(/* ... */)
)
```

### **4. Log API calls in development:**
```typescript
if (!environment.production) {
  console.log('API Call:', url, params);
}
```

---

## 📊 Current Status

```
✅ Environment files configured
✅ MockDataService created
✅ AuthService updated
✅ Login with fallback working
⏳ Other services need update
⏳ TypeScript types need fixing
⏳ Full testing required
```

---

## 🎯 التقدم

```
API Integration: 30% ████████░░░░░░░░░░░░░░░░░
  ✅ Setup & Configuration
  ✅ Mock Data Service
  ✅ Auth Service
  ⏳ Subject Service (in progress)
  ⏳ Lesson Service
  ⏳ Exam Service
  ⏳ Payment Services
  ⏳ Other Services
  ⏳ Error Handling
  ⏳ Testing
```

---

## 🏆 ما تم إنجازه اليوم

```
✅ Environment configuration
✅ Mock Data Service (250+ lines)
✅ Auth Service integration
✅ Smart fallback system
✅ Role-based mock data
✅ Timeout handling
✅ Comprehensive documentation
```

**Status:** Integration Framework Ready! 🚀

**Next:** Update remaining services and fix TypeScript types.

---

**Created:** October 24, 2025  
**Status:** 30% Complete  
**Estimated Completion:** 2-3 hours for all services
