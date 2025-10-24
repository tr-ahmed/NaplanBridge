# مشروع NaplanBridge - خطة التطوير الشاملة
## Angular 17 Frontend Development Plan

---

## ✅ **المرحلة 1: Models & Interfaces** - مكتملة

تم إنشاء/تحديث جميع الـ Models بناءً على Backend API Documentation:

### ملفات الـ Models المكتملة:

1. **`common.models.ts`** ✅
   - PaginationParams, PagedResult
   - ApiError, ValidationError
   - HealthCheckResponse
   - ApiResponse, MessageResponse

2. **`user.models.ts`** ✅
   - UserRole types (Admin, Teacher, Parent, Student, Member)
   - Authentication DTOs (Login, Register for all roles)
   - UserProfile, UpdateProfileDto
   - ParentStudent relationship

3. **`category.models.ts`** ✅
   - Category, Year, SubjectName models
   - Create/Update DTOs for each

4. **`subject.models.ts`** ✅
   - Subject with pricing, subscriptions, stats
   - SubjectEnrollment
   - Create/Update DTOs
   - SubjectFilterParams

5. **`term.models.ts`** ✅
   - Term with Term-Level Data (price, poster, description, duration)
   - TermInstructor (Many-to-Many relationship)
   - Week models
   - TeacherTermInfo
   - Create/Update DTOs

6. **`lesson.models.ts`** ✅ (محدّث)
   - Lesson with Bunny.net video integration
   - VideoProvider types (Cloudinary, BunnyStorage, BunnyStream)
   - LessonQuestion with QuestionType (Text, MCQ, MultiSelect, TrueFalse)
   - Resource models
   - VideoUploadResponse, VideoPlayerConfig
   - LessonProgress

7. **`exam.models.ts`** ✅
   - ExamType (Lesson, Monthly, Term, Year)
   - QuestionType (Text, MCQ, MultiSelect, TrueFalse)
   - Exam, ExamQuestion, ExamQuestionOption
   - StudentExamSession, ExamSubmission
   - ExamResult with auto/manual grading
   - ExamStatistics for teachers
   - GradeTextAnswerDto

8. **`subscription.models.ts`** ✅ (محدّث)
   - PlanType (SingleTerm, MultiTerm, FullYear, SubjectAnnual)
   - SubscriptionPlan with includedTermIds
   - StudentSubscription
   - AccessibleSubject/Term/Lesson
   - AccessCheckResponse
   - Create/Update DTOs

9. **`payment.models.ts`** ✅
   - Cart, CartItem
   - Order, OrderItem with OrderStatus
   - Payment models with Stripe integration
   - CheckoutSessionResponse
   - PaymentTransaction, PaymentHistory
   - Invoice models
   - Coupon, Refund models

10. **`progress.models.ts`** ✅
    - StudentProgress, SubjectProgress, TermProgress
    - LessonProgress with video tracking
    - DashboardStats (Student, Teacher, Parent, Admin)
    - LessonAnalytics, ExamAnalytics
    - ProgressReport, Leaderboard

---

## 🔨 **المرحلة 2: Core Services** - جاري العمل

### Services المطلوبة:

#### 1. **ApiService (Base Service)** 🔄
```typescript
// src/app/core/services/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) {}
  
  // GET with pagination
  get<T>(endpoint: string, params?: any): Observable<T>
  getPaginated<T>(endpoint: string, params: PaginationParams): Observable<PagedResult<T>>
  
  // POST, PUT, DELETE
  post<T>(endpoint: string, body: any): Observable<T>
  put<T>(endpoint: string, body: any): Observable<T>
  delete<T>(endpoint: string): Observable<T>
  
  // Upload files
  upload<T>(endpoint: string, formData: FormData): Observable<T>
  
  // Handle errors
  private handleError(error: HttpErrorResponse): Observable<never>
}
```

#### 2. **AuthService** 🔄
```typescript
// Features needed:
- login(credentials: LoginDto): Observable<UserDto>
- registerParent(dto: ParentRegisterDto): Observable<UserDto>
- registerTeacher(dto: TeacherRegisterDto): Observable<UserDto>
- registerStudent(dto: StudentRegisterDto): Observable<UserDto>
- logout(): void
- getCurrentUser(): UserDto | null
- getUserRoles(): UserRole[]
- hasRole(role: UserRole): boolean
- isAuthenticated(): boolean
- getToken(): string | null
- refreshToken(): Observable<UserDto>
```

#### 3. **CategoryService** 📝
```typescript
- getCategories(): Observable<Category[]>
- getCategoryById(id: number): Observable<Category>
- createCategory(dto: CreateCategoryDto): Observable<Category>
- updateCategory(id: number, dto: UpdateCategoryDto): Observable<Category>
- deleteCategory(id: number): Observable<void>

// Years
- getYears(): Observable<Year[]>
- createYear(dto: CreateYearDto): Observable<Year>
- updateYear(id: number, dto: UpdateYearDto): Observable<Year>
- deleteYear(id: number): Observable<void>

// Subject Names
- getSubjectNames(): Observable<SubjectName[]>
- getSubjectNamesByCategory(categoryId: number): Observable<SubjectName[]>
- createSubjectName(dto: CreateSubjectNameDto): Observable<SubjectName>
- updateSubjectName(id: number, dto: UpdateSubjectNameDto): Observable<SubjectName>
- deleteSubjectName(id: number): Observable<void>
```

#### 4. **SubjectService** 📝
```typescript
- getSubjects(params: SubjectFilterParams): Observable<PagedResult<Subject>>
- getSubjectById(id: number): Observable<Subject>
- getSubjectsByCategory(categoryId: number): Observable<Subject[]>
- getSubjectsByYear(yearId: number): Observable<Subject[]>
- createSubject(dto: FormData): Observable<Subject>
- updateSubject(id: number, dto: FormData): Observable<Subject>
- deleteSubject(id: number): Observable<void>
- getSubjectEnrollment(id: number): Observable<SubjectEnrollment>
```

#### 5. **TermService** 📝
```typescript
- getTerms(): Observable<Term[]>
- getTermById(id: number): Observable<Term>
- getTermsBySubject(subjectId: number): Observable<Term[]>
- createTerm(dto: CreateTermDto): Observable<Term>
- updateTerm(id: number, dto: UpdateTermDto): Observable<Term>
- deleteTerm(id: number): Observable<void>

// Term Instructors
- getTermInstructors(termId: number): Observable<TermInstructor[]>
- getTeacherTerms(teacherId: number): Observable<TeacherTermInfo[]>
- assignInstructor(termId: number, dto: CreateTermInstructorDto): Observable<void>
- removeInstructor(termId: number, instructorId: number): Observable<void>
- updateInstructorRole(termId: number, instructorId: number, dto: UpdateTermInstructorDto): Observable<void>
```

#### 6. **LessonService** 📝
```typescript
- getLessons(): Observable<Lesson[]>
- getLessonById(id: number): Observable<LessonDetails>
- getLessonsByWeek(weekId: number): Observable<Lesson[]>
- createLesson(dto: FormData): Observable<Lesson>
- updateLesson(id: number, dto: FormData): Observable<Lesson>
- deleteLesson(id: number): Observable<void>

// Video Upload
- uploadVideo(videoFile: File, provider: VideoProvider): Observable<VideoUploadResponse>

// Lesson Questions
- getLessonQuestions(lessonId: number): Observable<LessonQuestion[]>
- createLessonQuestion(dto: CreateLessonQuestionDto): Observable<LessonQuestion>
- updateLessonQuestion(id: number, dto: UpdateLessonQuestionDto): Observable<LessonQuestion>
- deleteLessonQuestion(id: number): Observable<void>

// Resources
- getLessonResources(lessonId: number): Observable<Resource[]>
- createResource(dto: FormData): Observable<Resource>
- updateResource(id: number, dto: FormData): Observable<Resource>
- deleteResource(id: number): Observable<void>
```

#### 7. **ExamService** 📝
```typescript
- getExams(): Observable<Exam[]>
- getExamById(id: number): Observable<ExamDetails>
- createExam(dto: CreateExamDto): Observable<Exam>
- updateExam(id: number, dto: UpdateExamDto): Observable<Exam>
- deleteExam(id: number): Observable<void>

// Student Exam Flow
- startExam(examId: number): Observable<StudentExamSession>
- submitExam(examId: number, submission: ExamSubmission): Observable<ExamResult>
- getExamResult(studentExamId: number): Observable<ExamResult>
- getStudentExamHistory(studentId: number, examId: number): Observable<StudentExamHistory>

// Teacher Grading
- gradeTextAnswer(dto: GradeTextAnswerDto): Observable<void>
- bulkGrade(dto: BulkGradeDto): Observable<void>
- getPendingGrading(teacherId: number): Observable<ExamResult[]>

// Statistics
- getExamStatistics(examId: number): Observable<ExamStatistics>
```

#### 8. **SubscriptionService** 📝
```typescript
- getSubscriptionPlans(): Observable<SubscriptionPlan[]>
- getAvailablePlans(studentId: number): Observable<AvailablePlan[]>
- getStudentSubscriptions(studentId: number): Observable<StudentSubscription[]>
- getActiveSubscriptions(studentId: number): Observable<StudentSubscription[]>

// Access Control
- hasAccessToSubject(studentId: number, subjectId: number): Observable<AccessCheckResponse>
- hasAccessToLesson(studentId: number, lessonId: number): Observable<AccessCheckResponse>
- hasAccessToExam(studentId: number, examId: number): Observable<AccessCheckResponse>

// Admin/Teacher Management
- createPlan(dto: CreateSubscriptionPlanDto): Observable<SubscriptionPlan>
- updatePlan(id: number, dto: UpdateSubscriptionPlanDto): Observable<SubscriptionPlan>
- deactivatePlan(id: number): Observable<void>
```

#### 9. **CartService** 📝
```typescript
- getCart(): Observable<Cart>
- addToCart(dto: AddToCartDto): Observable<AddToCartResponse>
- updateCartItem(itemId: number, dto: UpdateCartItemDto): Observable<Cart>
- removeFromCart(itemId: number): Observable<Cart>
- clearCart(): Observable<void>
- getCartItemCount(): Observable<number>
```

#### 10. **PaymentService** 📝
```typescript
- createOrderFromCart(): Observable<CreateOrderFromCartResponse>
- createCheckoutSession(dto: CreateCheckoutSessionDto): Observable<CheckoutSessionResponse>
- getOrderDetails(orderId: number): Observable<Order>
- getOrderHistory(userId: number): Observable<Order[]>
- getPaymentHistory(userId: number): Observable<PaymentHistory>
- requestRefund(dto: RefundRequest): Observable<RefundResponse>
- applyCoupon(dto: ApplyCouponDto): Observable<CouponAppliedResponse>
```

#### 11. **ProgressService** 📝
```typescript
- getStudentProgress(studentId: number): Observable<StudentProgress>
- updateLessonProgress(dto: UpdateLessonProgressDto): Observable<LessonProgress>
- getLessonProgress(studentId: number, lessonId: number): Observable<LessonProgress>
- getSubjectProgress(studentId: number, subjectId: number): Observable<SubjectProgress>
- getProgressReport(studentId: number, startDate: Date, endDate: Date): Observable<ProgressReport>

// Dashboard Stats
- getStudentDashboardStats(studentId: number): Observable<StudentDashboardStats>
- getTeacherDashboardStats(teacherId: number): Observable<TeacherDashboardStats>
- getParentDashboardStats(parentId: number): Observable<ParentDashboardStats>
- getAdminDashboardStats(): Observable<AdminDashboardStats>

// Analytics
- getLessonAnalytics(lessonId: number): Observable<LessonAnalytics>
- getExamAnalytics(examId: number): Observable<ExamAnalytics>
```

#### 12. **VideoService** 📝
```typescript
// Bunny.net HLS Integration
- initializePlayer(config: VideoPlayerConfig): void
- destroyPlayer(): void
- playVideo(videoUrl: string, provider: VideoProvider): void
- pauseVideo(): void
- getCurrentTime(): number
- setCurrentTime(time: number): void
- getVideoDuration(): number
- updateProgress(lessonId: number, position: number): Observable<void>
```

#### 13. **NotificationService** (موجود - يحتاج تحديث)
```typescript
- getNotifications(): Observable<Notification[]>
- markAsRead(notificationId: number): Observable<void>
- markAllAsRead(): Observable<void>
- getUnreadCount(): Observable<number>
```

#### 14. **ToastService** ✅ (موجود)

---

## 🎯 **المرحلة 3: HTTP Interceptors**

### Interceptors المطلوبة:

1. **AuthInterceptor** 🔄
   - Add JWT token to all requests
   - Handle 401 Unauthorized (redirect to login)
   - Handle 403 Forbidden

2. **ErrorInterceptor** 📝
   - Global error handling
   - Show toast notifications
   - Log errors to console (dev mode)
   - Handle rate limiting (429)

3. **LoadingInterceptor** 📝
   - Show/hide global loading spinner
   - Track ongoing requests

4. **CacheInterceptor** (Optional) 📝
   - Cache GET requests
   - Invalidate cache on mutations

---

## 🛡️ **المرحلة 4: Guards & Resolvers**

### Guards:

1. **AuthGuard** ✅ (موجود - يحتاج مراجعة)
2. **RoleGuard** ✅ (موجود - يحتاج مراجعة)
3. **SubscriptionGuard** 📝 (جديد)
   - Check if student has active subscription for content

### Resolvers:

1. **SubjectResolver** 📝
2. **LessonResolver** 📝
3. **ExamResolver** 📝
4. **DashboardResolver** 📝

---

## 📱 **المرحلة 5: Components & Features**

### Admin Features (`/src/app/admin/`):

#### Components:
1. **AdminDashboardComponent** 📝
   - Overview stats
   - Quick actions
   - Recent activities
   - System health

2. **UserManagementComponent** 📝
   - List all users (Students, Teachers, Parents)
   - Create/Edit users
   - Assign roles
   - Deactivate users

3. **ContentManagementComponent** 📝
   - Manage Categories
   - Manage Years
   - Manage Subjects
   - Manage Terms (with Instructors)
   - Manage Weeks
   - Manage Lessons
   - Upload videos

4. **ExamManagementComponent** 📝
   - Create/Edit exams
   - Add questions
   - View statistics
   - Export results

5. **SubscriptionManagementComponent** 📝
   - Create/Edit subscription plans
   - View active subscriptions
   - Revenue reports

6. **ReportsComponent** 📝
   - Student progress reports
   - Revenue reports
   - System analytics

### Teacher Features (`/src/app/teacher/`):

#### Components:
1. **TeacherDashboardComponent** 📝
   - My terms
   - My students
   - Pending grading
   - Recent activities

2. **MyTermsComponent** 📝
   - List assigned terms
   - View term details
   - Manage lessons

3. **LessonManagementComponent** 📝
   - Create/Edit lessons
   - Upload videos (Bunny.net)
   - Add resources
   - Add quiz questions

4. **ExamManagementComponent** 📝
   - Create exams
   - View submissions
   - Grade text answers
   - View statistics

5. **StudentProgressComponent** 📝
   - View student progress
   - Filter by subject/term
   - Generate reports

### Parent Features (`/src/app/parent/`):

#### Components:
1. **ParentDashboardComponent** 📝
   - My students overview
   - Payment history
   - Upcoming payments

2. **ManageStudentsComponent** 📝
   - Add student
   - View student list
   - View progress for each

3. **SubscriptionsComponent** 📝
   - Browse plans
   - Active subscriptions
   - Purchase new

4. **PaymentHistoryComponent** 📝
   - View past payments
   - Download invoices
   - Request refunds

5. **CartComponent** 📝
   - View cart items
   - Update quantities
   - Proceed to checkout

6. **CheckoutComponent** 📝
   - Review order
   - Apply coupon
   - Stripe payment integration

### Student Features (`/src/app/features/`):

#### Components:
1. **StudentDashboardComponent** 📝
   - My subjects
   - My progress
   - Upcoming exams
   - Recent activities

2. **BrowseSubjectsComponent** 📝
   - Filter by category/year
   - View subject details
   - Subscribe

3. **SubjectDetailsComponent** 📝
   - Terms overview
   - Lessons list
   - Exams list
   - Progress tracking

4. **LessonPlayerComponent** 📝
   - Video player (Bunny.net HLS)
   - Lesson resources
   - Quiz questions
   - Progress tracking

5. **ExamTakingComponent** 📝
   - Timer
   - Questions display (all types)
   - Submit exam
   - View results

6. **MyProgressComponent** 📝
   - Overall progress
   - Subject-wise progress
   - Exam results
   - Certificates/Achievements

7. **MySubscriptionsComponent** 📝
   - Active subscriptions
   - Expiry dates
   - Renew/Upgrade

---

## 🎨 **المرحلة 6: Shared Components**

### Shared UI Components (`/src/app/shared/`):

1. **HeaderComponent** ✅ (موجود - يحتاج تحديث)
   - Role-based navigation
   - Notifications dropdown
   - Cart icon (for parents)
   - User menu

2. **FooterComponent** ✅ (موجود)

3. **LoadingSpinnerComponent** 📝
4. **PaginationComponent** 📝
5. **ModalComponent** 📝
6. **ConfirmDialogComponent** 📝
7. **VideoPlayerComponent** 📝 (Bunny.net HLS)
8. **QuestionDisplayComponent** 📝
9. **ProgressBarComponent** 📝
10. **StatsCardComponent** 📝
11. **EmptyStateComponent** 📝
12. **ErrorStateComponent** 📝

---

## 🛣️ **المرحلة 7: Routing Updates**

### Update `app.routes.ts`:

```typescript
export const routes: Routes = [
  // Public
  { path: '', loadComponent: () => import('./features/home/home').then(m => m.HomeComponent) },
  { path: 'auth/login', ... },
  { path: 'auth/register', ... },
  { path: 'select-role', ... },
  
  // Admin
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    children: [
      { path: 'dashboard', ... },
      { path: 'users', ... },
      { path: 'content', ... },
      { path: 'exams', ... },
      { path: 'subscriptions', ... },
      { path: 'reports', ... }
    ]
  },
  
  // Teacher
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Teacher'] },
    children: [
      { path: 'dashboard', ... },
      { path: 'terms', ... },
      { path: 'lessons', ... },
      { path: 'exams', ... },
      { path: 'students', ... }
    ]
  },
  
  // Parent
  {
    path: 'parent',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Parent'] },
    children: [
      { path: 'dashboard', ... },
      { path: 'students', ... },
      { path: 'subscriptions', ... },
      { path: 'payments', ... },
      { path: 'cart', ... },
      { path: 'checkout', ... }
    ]
  },
  
  // Student
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Student'] },
    children: [
      { path: 'dashboard', ... },
      { path: 'subjects', ... },
      { path: 'subject/:id', ... },
      { path: 'lesson/:id', ... },
      { path: 'exam/:id', ... },
      { path: 'progress', ... },
      { path: 'subscriptions', ... }
    ]
  },
  
  // 404
  { path: '**', redirectTo: '' }
];
```

---

## ⚙️ **المرحلة 8: Configuration Updates**

### Update `environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:5001/api',
  stripePublishableKey: 'pk_test_...',
  bunnyStreamUrl: 'https://naplan.b-cdn.net',
  cacheExpiration: {
    categories: 24 * 60 * 60 * 1000, // 24 hours
    years: 24 * 60 * 60 * 1000,
    subjects: 60 * 60 * 1000, // 1 hour
    plans: 30 * 60 * 1000 // 30 minutes
  }
};
```

### Update `app.config.ts`:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loadingInterceptor
      ])
    ),
    provideAnimations(),
    // Add services
    AuthService,
    ApiService,
    CategoryService,
    SubjectService,
    TermService,
    LessonService,
    ExamService,
    SubscriptionService,
    CartService,
    PaymentService,
    ProgressService,
    VideoService,
    ToastService,
    NotificationService
  ]
};
```

---

## 📦 **المرحلة 9: External Libraries**

### Required NPM Packages:

```bash
# Video Player (Bunny.net HLS support)
npm install hls.js plyr

# Stripe Payment
npm install @stripe/stripe-js

# Charts & Visualization
npm install chart.js ng2-charts

# Date manipulation
npm install date-fns

# Icons (if not using Tailwind)
npm install @ng-icons/core @ng-icons/heroicons
```

---

## 🎯 **المرحلة 10: Testing & Quality**

### Unit Tests:
- Services unit tests
- Components unit tests
- Guards unit tests

### E2E Tests:
- User flows (login, browse, purchase, take exam)
- Role-based access testing

### Performance:
- Lazy loading verification
- Bundle size optimization
- Lighthouse score > 90

---

## 📋 **Checklist Summary**

### Phase 1: Foundation ✅
- [x] All Models created/updated
- [ ] Core Services implemented
- [ ] HTTP Interceptors configured
- [ ] Guards & Resolvers implemented

### Phase 2: Admin Features ⏳
- [ ] Admin Dashboard
- [ ] User Management
- [ ] Content Management
- [ ] Exam Management
- [ ] Subscription Management
- [ ] Reports

### Phase 3: Teacher Features ⏳
- [ ] Teacher Dashboard
- [ ] Lesson Management
- [ ] Exam Creation & Grading
- [ ] Student Progress Tracking

### Phase 4: Parent Features ⏳
- [ ] Parent Dashboard
- [ ] Student Management
- [ ] Subscription Purchase
- [ ] Cart & Checkout
- [ ] Payment History

### Phase 5: Student Features ⏳
- [ ] Student Dashboard
- [ ] Browse & Subscribe
- [ ] Video Player (Bunny.net)
- [ ] Take Exams
- [ ] Track Progress

### Phase 6: Polish & Deploy 🚀
- [ ] UI/UX polish with Tailwind CSS
- [ ] Responsive design
- [ ] Loading/Error states
- [ ] Testing
- [ ] Documentation
- [ ] Deployment

---

## 📝 **Next Steps**

يُوصى بالبدء بالترتيب التالي:

1. ✅ Complete Core Services (ApiService, AuthService, etc.)
2. Update HTTP Interceptors
3. Start with Student Features (most critical user flow)
4. Implement Payment & Subscription system
5. Build Admin panel
6. Build Teacher features
7. Build Parent features
8. Testing & Polish

---

**Last Updated:** `{{ date }}`
**Version:** 1.0
**Status:** In Progress 🔨
