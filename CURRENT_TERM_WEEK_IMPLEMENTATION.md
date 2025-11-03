# 🎯 Current Term/Week Detection Feature

## ✅ Feature Overview

**New Endpoint:** `GET /api/StudentSubjects/student/{studentId}/current-term-week`  
**Purpose:** Automatically determine which term and week a student should be viewing based on their active subscription dates  
**Status:** ✅ **IMPLEMENTED**

---

## 🔧 Implementation Details

### Files Created/Modified

1. **Created:** `API/DTOs/Subscription/CurrentTermWeekDto.cs`
2. **Modified:** `API/Services/Interfaces/ISubscriptionService.cs`
3. **Modified:** `API/Services/Implementations/SubscriptionService.cs`
4. **Modified:** `API/Controllers/StudentSubjectsController.cs`

---

## 📋 API Specification

### Endpoint

```
GET /api/StudentSubjects/student/{studentId}/current-term-week?subjectId={subjectId}
```

### Authorization
- **Roles:** Student, Parent, Admin
- **Authentication:** Required (Bearer token)

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | int | ✅ Yes | The ID of the student |
| `subjectId` | int | ❌ No | Optional: Filter by specific subject |

### Request Example

```http
GET /api/StudentSubjects/student/8/current-term-week?subjectId=5
Authorization: Bearer {your_jwt_token}
```

---

## 📤 Response Schema

### Success Response (200 OK)

```json
{
  "studentId": 8,
  "currentTermId": 2,
  "currentTermNumber": 2,
  "currentTermName": "Term 2",
  "currentWeekId": 15,
  "currentWeekNumber": 5,
  "termStartDate": "2025-04-01T00:00:00Z",
  "termEndDate": null,
  "weekStartDate": null,
  "weekEndDate": null,
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

### No Access Response (200 OK)

```json
{
  "studentId": 8,
  "currentTermId": null,
  "currentTermNumber": null,
  "currentTermName": null,
  "currentWeekId": null,
  "currentWeekNumber": null,
  "termStartDate": null,
  "termEndDate": null,
  "weekStartDate": null,
  "weekEndDate": null,
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

### Error Response (500)

```json
{
  "message": "An error occurred while retrieving current term and week",
  "error": "Detailed error message"
}
```

---

## 🎯 Use Cases

### Use Case 1: Full Year Subscription

**Scenario:**
- Student: Ali Ahmed (ID: 8)
- Subscription: "Mathematics Year 7 - Full Year"
- Subscription dates: 2025-01-01 to 2025-12-31
- Today: 2025-11-01 (November 1)

**Request:**
```http
GET /api/StudentSubjects/student/8/current-term-week?subjectId=5
```

**Expected Response:**
```json
{
  "studentId": 8,
  "currentTermId": 4,
  "currentTermNumber": 4,
  "currentTermName": "Term 4",
  "currentWeekNumber": 3,
  "subscriptionType": "FullYear",
  "hasAccess": true,
  "subjectId": 5,
  "subjectName": "Mathematics"
}
```

**Frontend Action:**
```typescript
// Navigate to current term and week
router.navigate(['/lessons'], {
  queryParams: {
    subjectId: 5,
    termId: 4,
    weekId: response.currentWeekId
  }
});
```

---

### Use Case 2: Single Term Subscription

**Scenario:**
- Student: Sara Ali (ID: 9)
- Subscription: "English Year 8 - Term 2 Only"
- Subscription dates: 2025-04-01 to 2025-06-30
- Today: 2025-05-15

**Request:**
```http
GET /api/StudentSubjects/student/9/current-term-week?subjectId=7
```

**Expected Response:**
```json
{
  "studentId": 9,
  "currentTermId": 2,
  "currentTermNumber": 2,
  "currentTermName": "Term 2",
  "currentWeekNumber": 7,
  "totalWeeksInTerm": 12,
  "weeksRemaining": 5,
  "progressPercentage": 58,
  "subscriptionType": "SingleTerm",
  "hasAccess": true,
  "subjectId": 7,
  "subjectName": "English"
}
```

---

### Use Case 3: No Active Subscription

**Scenario:**
- Student: New student (ID: 10)
- No active subscriptions

**Request:**
```http
GET /api/StudentSubjects/student/10/current-term-week
```

**Expected Response:**
```json
{
  "studentId": 10,
  "hasAccess": false,
  "message": "No active subscription found"
}
```

**Frontend Action:**
```typescript
if (!response.hasAccess) {
  // Show "Enroll Now" button
  alert('No active subscription found for this subject');
  router.navigate(['/pricing']);
}
```

---

### Use Case 4: Multiple Subjects

**Scenario:**
- Student has subscriptions to multiple subjects
- Want to get current term/week for specific subject

**Request (Without subjectId - Returns first available):**
```http
GET /api/StudentSubjects/student/8/current-term-week
```

**Request (With subjectId - Returns specific subject):**
```http
GET /api/StudentSubjects/student/8/current-term-week?subjectId=5
```

---

## 🔍 Business Logic

### How Current Term is Determined

1. **Get Active Subscriptions**
   - Filter by `studentId`
   - Status = `Active`
   - `StartDate <= Today <= EndDate`
   - Optional: Filter by `subjectId`

2. **Determine Current Term (Priority Order)**

   **For Full Year / Subject Annual:**
   - Find term where `term.StartDate <= Today`
   - Order by most recent start date
   - This ensures we get the correct current term

   **For Single Term:**
   - Use the term directly from subscription plan

   **For Multi-Term:**
   - Parse `IncludedTermIds` (e.g., "1,2" or "3,4")
   - Find term where `term.StartDate <= Today`
   - Order by most recent start date

3. **Calculate Current Week**
   ```
   daysSinceTermStart = (Today - Term.StartDate).Days
   currentWeekNumber = (daysSinceTermStart / 7) + 1
   ```

4. **Get Week Entity**
   - Try to find `Week` where `WeekNumber = currentWeekNumber`
   - If not found, return first week of term

5. **Calculate Progress**
   ```
   progressPercentage = (currentWeekNumber / totalWeeksInTerm) * 100
   weeksRemaining = totalWeeksInTerm - currentWeekNumber
   ```

---

## 🎨 Frontend Integration Example

### TypeScript Interface

```typescript
// Add to your models/subscription.models.ts

export interface CurrentTermWeekDto {
  studentId: number;
  currentTermId: number | null;
  currentTermNumber: number | null;
  currentTermName: string | null;
  currentWeekId: number | null;
  currentWeekNumber: number | null;
  termStartDate: string | null;
  termEndDate: string | null;
  weekStartDate: string | null;
  weekEndDate: string | null;
  totalWeeksInTerm: number | null;
  weeksRemaining: number | null;
  progressPercentage: number | null;
  subscriptionType: string | null;
  hasAccess: boolean;
  message: string | null;
  subjectId: number | null;
  subjectName: string | null;
}
```

### Angular Service

```typescript
// courses.service.ts
getCurrentTermWeek(studentId: number, subjectId?: number): Observable<CurrentTermWeekDto> {
  let url = `${this.baseUrl}/StudentSubjects/student/${studentId}/current-term-week`;
  
  if (subjectId) {
    url += `?subjectId=${subjectId}`;
  }
  
  return this.http.get<CurrentTermWeekDto>(url).pipe(
    catchError(error => {
      console.error('Error fetching current term/week:', error);
      return throwError(() => error);
    })
  );
}
```

### Component Usage

```typescript
// courses.component.ts
viewLessons(course: Course): void {
  const studentId = this.authService.getCurrentUser()?.studentId;
  
  if (!studentId) {
    this.router.navigate(['/login']);
    return;
  }

  this.isLoading = true;
  
  this.coursesService.getCurrentTermWeek(studentId, course.id)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (termWeek) => {
        if (!termWeek.hasAccess) {
          this.toastService.showWarning(
            termWeek.message || 'No active subscription found for this subject'
          );
          return;
        }

        console.log('📚 Navigating to current term:', {
          term: termWeek.currentTermName,
          week: termWeek.currentWeekNumber,
          progress: `${termWeek.progressPercentage}%`
        });

        this.router.navigate(['/lessons'], {
          queryParams: {
            subjectId: course.subjectNameId,
            yearId: course.yearId,
            termId: termWeek.currentTermId,
            weekId: termWeek.currentWeekId,
            courseId: course.id
          }
        });
      },
      error: (error) => {
        console.error('Error loading current term/week:', error);
        this.toastService.showError('Failed to load course content');
      }
    });
}
```

### Display Progress

```typescript
// dashboard.component.ts
loadStudentProgress(): void {
  const studentId = this.authService.getCurrentUser()?.studentId;
  
  if (!studentId) return;
  
  this.coursesService.getCurrentTermWeek(studentId)
    .subscribe({
      next: (termWeek) => {
        if (termWeek.hasAccess) {
          this.currentProgress = {
            term: termWeek.currentTermName,
            week: `Week ${termWeek.currentWeekNumber}`,
            progress: termWeek.progressPercentage,
            weeksRemaining: termWeek.weeksRemaining,
            subject: termWeek.subjectName
          };
        }
      },
      error: (error) => {
        console.error('Error loading progress:', error);
      }
    });
}
```

```html
<!-- dashboard.component.html -->
@if (currentProgress) {
  <div class="progress-card">
    <h3>{{ currentProgress.subject }}</h3>
    <p>{{ currentProgress.term }} - {{ currentProgress.week }}</p>
    <div class="progress-bar">
      <div class="progress-fill" [style.width.%]="currentProgress.progress"></div>
    </div>
    <span>
      {{ currentProgress.progress }}% Complete - 
      {{ currentProgress.weeksRemaining }} weeks remaining
    </span>
  </div>
}
```

---

## ✅ Benefits

### 1. Accuracy
- ✅ Backend calculates based on actual database dates
- ✅ Handles all subscription types (Full Year, Single Term, Multi-Term)
- ✅ No frontend date calculation errors

### 2. User Experience
- ✅ Students always see relevant content
- ✅ No confusion about which term to view
- ✅ Automatic navigation to current lessons
- ✅ Progress tracking

### 3. Maintainability
- ✅ Centralized logic in backend
- ✅ Easy to adjust calculation rules
- ✅ Frontend stays simple
- ✅ Testable business logic

### 4. Flexibility
- ✅ Works with all subscription types
- ✅ Handles multiple subjects per student
- ✅ Optional subject filtering
- ✅ Future-proof design

---

## 🧪 Testing Checklist

- [x] Code compiles successfully
- [x] Build passes
- [x] DTO created with all required fields
- [x] Service interface updated
- [x] Service implementation added
- [x] Controller endpoint added
- [x] Authorization configured
- [ ] Unit tests created
- [ ] Integration tests created
- [ ] Test with Full Year subscription
- [ ] Test with Single Term subscription
- [ ] Test with Multi-Term subscription
- [ ] Test with no active subscription
- [ ] Test with expired subscription
- [ ] Test with multiple subjects
- [ ] Test with subjectId filter
- [ ] Test with invalid studentId
- [ ] Verify response format
- [ ] Test frontend integration

---

## 🚀 Testing Commands

### Using cURL

```bash
# Test with valid student and subject
curl -X GET "https://naplan2.runasp.net/api/StudentSubjects/student/8/current-term-week?subjectId=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test without subjectId (returns first available)
curl -X GET "https://naplan2.runasp.net/api/StudentSubjects/student/8/current-term-week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with no subscription
curl -X GET "https://naplan2.runasp.net/api/StudentSubjects/student/999/current-term-week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. **Request:**
   - Method: `GET`
   - URL: `{{baseUrl}}/api/StudentSubjects/student/8/current-term-week`
   - Headers: `Authorization: Bearer {{token}}`
   - Query Params: `subjectId=5` (optional)

2. **Expected Status:** `200 OK`

3. **Verify Response:**
   - `hasAccess` is boolean
   - If `true`, check `currentTermId` and `currentWeekId` are not null
   - If `false`, check `message` field explains why

---

## 📊 Database Schema Requirements

### Required Tables

The endpoint relies on these tables and relationships:

```
StudentSubjects
├── StudentId (FK → Students)
├── SubscriptionPlanId (FK → SubscriptionPlans)
├── StartDate (DateTime)
├── EndDate (DateTime)
└── IsActive (bool)

SubscriptionPlans
├── Id
├── PlanType (SingleTerm, MultiTerm, FullYear, SubjectAnnual)
├── SubjectId (FK, nullable)
├── TermId (FK, nullable)
├── YearId (FK, nullable)
└── IncludedTermIds (string, for MultiTerm)

Terms
├── Id
├── TermNumber (1-4)
├── StartDate (DateOnly)
├── SubjectId (FK → Subjects)
└── Name (calculated: "Term {TermNumber}")

Weeks
├── Id
├── WeekNumber (1-12)
└── TermId (FK → Terms)
```

---

## 🎯 Edge Cases Handled

1. **No Active Subscription**
   - Returns `hasAccess = false`
   - Message: "No active subscription found"

2. **Subscription Not Started Yet**
   - Returns first term and week
   - `hasAccess = true` only if within date range

3. **Subscription Expired**
   - Not included in active subscriptions
   - Returns `hasAccess = false`

4. **Term Without Start Date**
   - Falls back to first week of term
   - Uses first available term

5. **Week Doesn't Exist in Database**
   - Falls back to first week of term
   - Still calculates week number from term start

6. **Multiple Subscriptions**
   - Prioritizes Full Year → Multi-Term → Single Term
   - Uses `subjectId` filter to narrow down

7. **Between Terms (Holidays)**
   - Returns the most recent term that has started
   - Does not return future terms

---

## 📝 Future Enhancements

### Potential Improvements

1. **End Date Calculation**
   - Add `EndDate` to Terms table
   - Calculate exact term end dates

2. **Week Date Ranges**
   - Add `StartDate` and `EndDate` to Weeks table
   - Return exact week date ranges

3. **Holiday Handling**
   - Add school holidays table
   - Exclude holidays from week calculations

4. **Timezone Support**
   - Store term dates with timezone
   - Convert to student's local timezone

5. **Caching**
   - Cache current term/week per student
   - Invalidate on subscription changes

6. **Notification System**
   - Notify students when new term/week starts
   - Send reminders about upcoming terms

---

## 🔗 Related Documentation

- **Backend Inquiry:** `/reports/backend_inquiries/backend_inquiry_current_term_week_detection_2025-11-01.md`
- **API Documentation:** Check Swagger UI at `/swagger`
- **Frontend Integration:** See code examples above

---

## ✅ Summary

| Aspect | Status |
|--------|--------|
| **DTO Created** | ✅ Yes |
| **Interface Updated** | ✅ Yes |
| **Service Implemented** | ✅ Yes |
| **Controller Added** | ✅ Yes |
| **Authorization** | ✅ Configured |
| **Build Status** | ✅ Success |
| **Documentation** | ✅ Complete |
| **Ready for Testing** | ✅ Yes |
| **Production Ready** | ⏳ Pending Tests |

---

**Feature Implemented:** November 2, 2025  
**Build Status:** ✅ Success  
**API Base URL:** `https://naplan2.runasp.net`  
**Next Steps:** Frontend integration and testing

---

## 🎉 Conclusion

The Current Term/Week detection feature is now fully implemented and ready for testing. This solves the critical issue where students were always redirected to Term 1 regardless of their actual subscription status.

**The backend is ready!** Frontend team can now integrate this endpoint to provide accurate term/week navigation for students. 🚀
