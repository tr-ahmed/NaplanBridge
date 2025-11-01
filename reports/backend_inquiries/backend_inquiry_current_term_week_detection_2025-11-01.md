# ❓ Backend Inquiry Report - Current Term/Week Detection

## Date: November 1, 2025

---

## 1. Inquiry Topic

**Create endpoint to determine student's current term and week based on subscription dates**

---

## 2. Reason for Inquiry

### Current Problem:

On the **Courses page**, when a student clicks "View Lessons" or the "✓ Enrolled" button:
- ❌ Frontend doesn't know which term the student should be viewing
- ❌ Currently defaults to Term 1 (wrong if student is in Term 2, 3, or 4)
- ❌ No way to determine current week within the term

**Example Scenario:**
```
Student subscription: "Algebra Year 7 - Full Year" (4 Terms)
Today's date: November 1, 2025

Question: Is the student in Term 1, 2, 3, or 4?
Answer: Frontend has NO way to know!

Current behavior: Always opens Term 1 (wrong!)
Expected behavior: Open current term based on today's date
```

---

## 3. Requested Endpoint

### **Option 1: Get Current Term/Week for Student (Recommended)**

**Endpoint**: `GET /api/StudentSubjects/student/{studentId}/current-term-week`

**Purpose**: Return the current term and week that the student should be viewing based on:
- Student's active subscription
- Today's date
- Term start/end dates
- Week calculation within term

**Authorization**: Student, Parent, Admin

**Request Example**:
```http
GET /api/StudentSubjects/student/8/current-term-week
Authorization: Bearer {token}
```

**Response Schema**:
```json
{
  "studentId": 8,
  "currentTermId": 2,
  "currentTermNumber": 2,
  "currentTermName": "Term 2",
  "currentWeekId": 15,
  "currentWeekNumber": 5,
  "termStartDate": "2025-04-01T00:00:00Z",
  "termEndDate": "2025-06-30T23:59:59Z",
  "weekStartDate": "2025-04-29T00:00:00Z",
  "weekEndDate": "2025-05-05T23:59:59Z",
  "totalWeeksInTerm": 12,
  "weeksRemaining": 7,
  "progressPercentage": 42,
  "subscriptionType": "FullYear",
  "hasAccess": true
}
```

---

### **Option 2: Get Current Term/Week for Subject**

**Endpoint**: `GET /api/StudentSubjects/student/{studentId}/subject/{subjectId}/current-term-week`

**Purpose**: Same as Option 1 but specific to a subject (for students with multiple subscriptions)

---

## 4. Backend Logic Suggestions

### A. Calculate Current Term

```csharp
public async Task<CurrentTermWeekDto> GetCurrentTermWeek(int studentId, int? subjectId = null)
{
    var today = DateTime.UtcNow;
    
    // 1. Get student's active subscription(s)
    var activeSubscriptions = await _context.StudentSubjects
        .Include(ss => ss.SubscriptionPlan)
            .ThenInclude(sp => sp.Term)
        .Where(ss => ss.StudentId == studentId && 
                     ss.IsActive && 
                     ss.StartDate <= today && 
                     ss.EndDate >= today)
        .ToListAsync();
    
    if (subjectId.HasValue)
    {
        activeSubscriptions = activeSubscriptions
            .Where(ss => ss.SubscriptionPlan.SubjectId == subjectId)
            .ToList();
    }
    
    if (!activeSubscriptions.Any())
    {
        return new CurrentTermWeekDto { HasAccess = false };
    }
    
    // 2. Determine current term based on today's date
    Term currentTerm = null;
    
    // If Full Year subscription
    if (activeSubscriptions.Any(ss => ss.SubscriptionPlan.PlanType == PlanType.FullYear))
    {
        // Find which term we're in based on term dates
        currentTerm = await _context.Terms
            .Where(t => t.StartDate <= today && t.EndDate >= today)
            .FirstOrDefaultAsync();
    }
    // If Single/Multi Term subscription
    else
    {
        var subscription = activeSubscriptions.First();
        currentTerm = subscription.SubscriptionPlan.Term;
    }
    
    if (currentTerm == null)
    {
        return new CurrentTermWeekDto { HasAccess = false };
    }
    
    // 3. Calculate current week within the term
    var daysSinceTermStart = (today - currentTerm.StartDate).Days;
    var currentWeekNumber = (daysSinceTermStart / 7) + 1;
    
    // 4. Get the Week entity (if exists)
    var currentWeek = await _context.Weeks
        .Where(w => w.TermId == currentTerm.Id && w.WeekNumber == currentWeekNumber)
        .FirstOrDefaultAsync();
    
    // 5. Calculate progress
    var totalDaysInTerm = (currentTerm.EndDate - currentTerm.StartDate).Days;
    var progressPercentage = (int)((daysSinceTermStart / (double)totalDaysInTerm) * 100);
    
    return new CurrentTermWeekDto
    {
        StudentId = studentId,
        CurrentTermId = currentTerm.Id,
        CurrentTermNumber = currentTerm.TermNumber,
        CurrentTermName = currentTerm.Name,
        CurrentWeekId = currentWeek?.Id,
        CurrentWeekNumber = currentWeekNumber,
        TermStartDate = currentTerm.StartDate,
        TermEndDate = currentTerm.EndDate,
        WeekStartDate = currentWeek?.StartDate,
        WeekEndDate = currentWeek?.EndDate,
        TotalWeeksInTerm = await _context.Weeks.CountAsync(w => w.TermId == currentTerm.Id),
        WeeksRemaining = (int)((currentTerm.EndDate - today).Days / 7),
        ProgressPercentage = progressPercentage,
        SubscriptionType = activeSubscriptions.First().SubscriptionPlan.PlanType.ToString(),
        HasAccess = true
    };
}
```

---

### B. Handle Edge Cases

1. **Subscription not started yet**:
```csharp
if (today < subscription.StartDate)
{
    // Return first term/week
    return GetFirstTermWeek(subscription);
}
```

2. **Subscription expired**:
```csharp
if (today > subscription.EndDate)
{
    return new CurrentTermWeekDto { HasAccess = false };
}
```

3. **Between terms** (e.g., holidays):
```csharp
if (today > currentTerm.EndDate && today < nextTerm.StartDate)
{
    // Return next term
    return GetNextTermInfo(subscription);
}
```

4. **Student has multiple subscriptions** (different subjects):
```csharp
// Pass subjectId to filter
GET /api/StudentSubjects/student/8/subject/5/current-term-week
```

---

## 5. Use Cases

### Use Case 1: Full Year Subscription

**Scenario:**
- Student: Ali Ahmed (ID: 8)
- Subscription: "Mathematics Year 7 - Full Year"
- Subscription dates: 2025-01-01 to 2025-12-31
- Today: 2025-11-01

**Expected Response:**
```json
{
  "currentTermId": 4,
  "currentTermNumber": 4,
  "currentTermName": "Term 4",
  "currentWeekNumber": 3,
  "hasAccess": true
}
```

**Frontend Action:**
- Navigate to: `/lessons?termId=4&weekId=...`

---

### Use Case 2: Single Term Subscription

**Scenario:**
- Student: Sara Ali (ID: 9)
- Subscription: "English Year 8 - Term 2"
- Subscription dates: 2025-04-01 to 2025-06-30
- Today: 2025-05-15

**Expected Response:**
```json
{
  "currentTermId": 2,
  "currentTermNumber": 2,
  "currentWeekNumber": 7,
  "hasAccess": true
}
```

---

### Use Case 3: No Active Subscription

**Scenario:**
- Student: New student (ID: 10)
- No active subscriptions

**Expected Response:**
```json
{
  "hasAccess": false,
  "message": "No active subscription found"
}
```

**Frontend Action:**
- Show "Enroll Now" button instead of "View Lessons"

---

## 6. Database Schema Requirements

### Required Tables/Relationships:

```sql
StudentSubjects
  - StudentId (FK)
  - SubscriptionPlanId (FK)
  - StartDate
  - EndDate
  - IsActive

SubscriptionPlans
  - Id
  - PlanType (SingleTerm, MultiTerm, FullYear, SubjectAnnual)
  - SubjectId (FK, nullable)
  - TermId (FK, nullable)
  - YearId (FK, nullable)

Terms
  - Id
  - TermNumber (1, 2, 3, 4)
  - Name ("Term 1", "Term 2", etc.)
  - StartDate
  - EndDate

Weeks
  - Id
  - TermId (FK)
  - WeekNumber (1-12)
  - StartDate
  - EndDate
```

---

## 7. Alternative: Frontend Calculation

**If backend endpoint not possible**, frontend can calculate:

```typescript
// Get subscription start/end dates from backend
const subscription = {
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  planType: 'FullYear'
};

// Calculate current term (assuming 3 months per term)
const today = new Date();
const start = new Date(subscription.startDate);
const monthsSinceStart = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
const currentTerm = Math.floor(monthsSinceStart / 3) + 1; // 1, 2, 3, or 4
```

**Problems with frontend calculation:**
- ❌ Not accurate (months have different days)
- ❌ Doesn't account for holidays
- ❌ Can't sync with actual term dates in database
- ❌ Multiple subscriptions hard to handle

**Conclusion**: Backend endpoint is much better! ✅

---

## 8. Frontend Implementation (After Endpoint Available)

```typescript
// In courses.component.ts
viewLessons(course: Course): void {
  const studentId = this.authService.getCurrentUser()?.studentId;
  
  if (!studentId) {
    this.router.navigate(['/login']);
    return;
  }

  // Call new backend endpoint
  this.coursesService.getCurrentTermWeek(studentId, course.id)
    .subscribe(termWeek => {
      if (!termWeek.hasAccess) {
        alert('No active subscription found for this subject');
        return;
      }

      console.log('📚 Navigating to current term:', termWeek);

      this.router.navigate(['/lessons'], {
        queryParams: {
          subjectId: course.subjectNameId,
          yearId: course.yearId,
          termId: termWeek.currentTermId,    // ← Backend calculated!
          weekId: termWeek.currentWeekId,     // ← Backend calculated!
          courseId: course.id
        }
      });
    });
}

// In courses.service.ts
getCurrentTermWeek(studentId: number, courseId?: number): Observable<CurrentTermWeekDto> {
  const url = courseId
    ? `${this.baseUrl}/StudentSubjects/student/${studentId}/subject/${courseId}/current-term-week`
    : `${this.baseUrl}/StudentSubjects/student/${studentId}/current-term-week`;
  
  return this.http.get<CurrentTermWeekDto>(url);
}
```

---

## 9. Benefits of This Approach

### ✅ Accuracy
- Backend knows exact term dates from database
- Handles holidays and breaks correctly
- Synced with actual academic calendar

### ✅ Flexibility
- Works with Full Year, Single Term, Multi Term subscriptions
- Handles multiple subjects per student
- Easy to add future subscription types

### ✅ User Experience
- Student always sees current term content
- No confusion about which term to view
- Seamless navigation to relevant lessons

### ✅ Maintainability
- Logic centralized in backend
- Easy to adjust term calculation rules
- Frontend stays simple and clean

---

## 10. Priority

**🔴 HIGH**

**Why**:
- Critical for user experience
- Students currently see wrong content (Term 1 always)
- Blocks proper learning flow
- Needed before production release

---

## 11. Questions for Backend Team

1. ✅ Can you create the endpoint `GET /api/StudentSubjects/student/{studentId}/current-term-week`?
2. ✅ Can you include both termId and weekId in response?
3. ✅ How do you handle "between terms" periods (holidays)?
4. ✅ What happens if student has multiple subscriptions to different subjects?
5. ✅ Should we pass subjectId as query param or separate endpoint?
6. ✅ What's the response format for students with no active subscription?
7. ✅ Can you include subscription expiry date and progress percentage?

---

# 🚀 Quick Start: Current Term/Week Endpoint

**For Frontend Developers**

---

## 📋 TL;DR

**New endpoint to get which term and week a student should be viewing:**

```
GET /api/StudentSubjects/student/{studentId}/current-term-week?subjectId={subjectId}
```

---

## ⚡ Quick Examples

### 1. TypeScript Service Method

```typescript
// Add to your courses.service.ts or subscription.service.ts

interface CurrentTermWeekDto {
  studentId: number;
  currentTermId: number | null;
  currentTermNumber: number | null;
  currentTermName: string | null;
  currentWeekId: number | null;
  currentWeekNumber: number | null;
  termStartDate: string | null;
  totalWeeksInTerm: number | null;
  weeksRemaining: number | null;
  progressPercentage: number | null;
  subscriptionType: string | null;
  hasAccess: boolean;
  message: string | null;
  subjectId: number | null;
  subjectName: string | null;
}

getCurrentTermWeek(studentId: number, subjectId?: number): Observable<CurrentTermWeekDto> {
  let url = `${this.apiUrl}/StudentSubjects/student/${studentId}/current-term-week`;
  if (subjectId) {
    url += `?subjectId=${subjectId}`;
  }
  return this.http.get<CurrentTermWeekDto>(url);
}
```

---

### 2. Component Usage (View Lessons Button)

```typescript
// In your courses.component.ts

viewLessons(course: any): void {
  const studentId = this.authService.getCurrentUser()?.studentId;
  
  if (!studentId) {
    this.router.navigate(['/login']);
    return;
  }

  this.coursesService.getCurrentTermWeek(studentId, course.id)
    .subscribe({
      next: (result) => {
        if (!result.hasAccess) {
          // No subscription - show message
          this.toastService.showWarning(
            result.message || 'No active subscription found for this subject'
          );
          return;
        }

        // Has subscription - navigate to current term/week
        console.log('📚 Navigating to current term:', result);
        
        this.router.navigate(['/lessons'], {
          queryParams: {
            subjectId: course.subjectNameId,
            yearId: course.yearId,
            termId: result.currentTermId,
            weekId: result.currentWeekId,
            courseId: course.id
          }
        });
      },
      error: (err) => {
        console.error('Error loading current term/week:', err);
        this.toastService.showError('Failed to load course information');
      }
    });
}
```

---

### 3. Display Progress on Dashboard

```typescript
// In your dashboard.component.ts

export class DashboardComponent implements OnInit {
  currentProgress: any;
  isLoading = false;

  ngOnInit(): void {
    this.loadCurrentProgress();
  }

  loadCurrentProgress(): void {
    const studentId = this.authService.getCurrentUser()?.studentId;
    
    if (!studentId) return;

    this.isLoading = true;
    this.coursesService.getCurrentTermWeek(studentId)
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result.hasAccess) {
            this.currentProgress = {
              subject: result.subjectName,
              term: result.currentTermName,
              week: `Week ${result.currentWeekNumber}`,
              progress: result.progressPercentage,
              weeksLeft: result.weeksRemaining
            };
          }
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }
}
```

```html
<!-- In your dashboard.component.html -->
<div *ngIf="currentProgress" class="progress-card">
  <h3>{{ currentProgress.subject }}</h3>
  <p>{{ currentProgress.term }} - {{ currentProgress.week }}</p>
  <div class="progress-bar">
    <div class="progress-fill" [style.width.%]="currentProgress.progress"></div>
  </div>
  <span>{{ currentProgress.progress }}% Complete - {{ currentProgress.weeksLeft }} weeks remaining</span>
</div>
```

---

## 🎯 Response Examples

### ✅ Has Access

```json
{
  "studentId": 8,
  "currentTermId": 2,
  "currentTermNumber": 2,
  "currentTermName": "Term 2",
  "currentWeekId": 15,
  "currentWeekNumber": 5,
  "termStartDate": "2025-04-01T00:00:00Z",
  "totalWeeksInTerm": 12,
  "weeksRemaining": 7,
  "progressPercentage": 42,
  "subscriptionType": "FullYear",
  "hasAccess": true,
  "message": null,
  "subjectId": 5,
  "subjectName": "Mathematics"
}
```

### ❌ No Access

```json
{
  "studentId": 8,
  "currentTermId": null,
  "currentTermNumber": null,
  "currentTermName": null,
  "currentWeekId": null,
  "currentWeekNumber": null,
  "termStartDate": null,
  "totalWeeksInTerm": null,
  "weeksRemaining": null,
  "progressPercentage": null,
  "subscriptionType": null,
  "hasAccess": false,
  "message": "No active subscription found",
  "subjectId": null,
  "subjectName": null
}
```

---

## 🔑 Key Points

1. **Always check `hasAccess` first**
   ```typescript
   if (!result.hasAccess) {
     // Show enroll button or redirect to pricing
     return;
   }
   ```

2. **Use termId and weekId for navigation**
   ```typescript
   queryParams: {
     termId: result.currentTermId,
     weekId: result.currentWeekId
   }
   ```

3. **Handle null values**
   ```typescript
   const termName = result.currentTermName || 'Unknown Term';
   const weekNum = result.currentWeekNumber || 1;
   ```

4. **Add loading state**
   ```typescript
   isLoading = true;
   this.coursesService.getCurrentTermWeek(studentId).subscribe({
     next: (result) => { this.isLoading = false; },
     error: () => { this.isLoading = false; }
   });
   ```

---

## 🐛 Error Handling

```typescript
this.coursesService.getCurrentTermWeek(studentId, subjectId)
  .pipe(
    catchError(err => {
      console.error('Error:', err);
      
      if (err.status === 401) {
        // Unauthorized - redirect to login
        this.router.navigate(['/login']);
      } else if (err.status === 404) {
        // Student not found
        this.toastService.showError('Student not found');
      } else {
        // General error
        this.toastService.showError('Failed to load content');
      }
      
      return of(null);
    })
  )
  .subscribe(result => {
    if (result && result.hasAccess) {
      // Navigate to lessons
    }
  });
```

---

## 📱 Mobile/Responsive Example

```typescript
// For mobile, show compact progress
getProgressDisplay(result: CurrentTermWeekDto): string {
  if (!result.hasAccess) return 'Not Enrolled';

  return `${result.currentTermName}, Week ${result.currentWeekNumber} (${result.progressPercentage}%)`;
}
```

---

## 🎨 UI Suggestions

### Loading State
```html
<button (click)="viewLessons(course)" [disabled]="isLoading" class="btn-primary">
  @if (isLoading) {
    <span class="spinner"></span>
  }
  <span>{{ isLoading ? 'Loading...' : 'View Lessons' }}</span>
</button>
```

### Progress Display
```html
@if (termWeek?.hasAccess) {
  <div class="course-progress">
    <div class="term-badge">{{ termWeek.currentTermName }}</div>
    <div class="week-info">Week {{ termWeek.currentWeekNumber }} of {{ termWeek.totalWeeksInTerm }}</div>
    <div class="progress-bar">
      <div class="progress-fill" [style.width.%]="termWeek.progressPercentage"></div>
    </div>
  </div>
}
```

### No Access State
```html
@if (termWeek && !termWeek.hasAccess) {
  <div class="no-access">
    <p>{{ termWeek.message }}</p>
    <button (click)="enrollNow()" class="btn-primary">
      Enroll Now
    </button>
  </div>
}
```

---

## ✅ Testing Checklist

- [ ] Test with student who has Full Year subscription
- [ ] Test with student who has Single Term subscription
- [ ] Test with student who has no subscription
- [ ] Test with multiple subjects
- [ ] Test with expired subscription
- [ ] Test error handling (401, 404, 500)
- [ ] Test loading states
- [ ] Test mobile view
- [ ] Test with subjectId parameter
- [ ] Test without subjectId parameter
- [ ] Test navigation to lessons page
- [ ] Test progress display on dashboard

---

## 🔗 Related Components

### Components to Update:

1. **CoursesComponent** (`/courses`)
   - Update `viewLessons()` method
   - Use endpoint to get current term

2. **LessonsComponent** (`/lessons`)
   - Receive termId and weekId from query params
   - Filter lessons by these IDs

3. **DashboardComponent** (`/dashboard`)
   - Show current progress
   - Display week countdown

4. **EnrolledCoursesComponent**
   - Show "Continue Learning" button
   - Navigate to current term/week

---

## 💬 Questions?

**Backend endpoint ready?** ⏳ In Progress  
**Authorization required?** ✅ Yes (JWT token with studentId claim)  
**Supports all subscription types?** ✅ Yes (FullYear, SingleTerm, MultiTerm)  
**Returns null values if no access?** ✅ Yes (check `hasAccess` field)  
**Can filter by subject?** ✅ Yes (optional `subjectId` query param)

---

**Report Generated**: November 1, 2025  
**Frontend Status**: ⏳ **READY TO IMPLEMENT** - Waiting for backend endpoint  
**Backend Action Required**: ✅ **HIGH PRIORITY** - Create term/week detection endpoint

---

**Recommendation**: Implement backend endpoint for accurate term/week calculation based on subscription dates and current date. This is essential for proper content navigation.

---

**Happy Coding! 🚀**
