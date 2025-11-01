# ❓ Backend Inquiry Report - Student Subscription Enrollment Check

## Date: November 1, 2025

---

## 1. Inquiry Topic

**Check if student is enrolled in a specific subject**

---

## 2. Reason for Inquiry

On the **Courses page**, we display subject/course cards with an "Add to Cart" button. However, if a student **already has an active subscription** for that subject, they should see "✓ Enrolled" instead of "Add to Cart".

Currently, the frontend has no way to check if a student is enrolled in a subject.

---

## 3. Current Problem

**Frontend behavior:**
- Shows "Add to Cart" for **all subjects**
- Even if student is already subscribed

**Expected behavior:**
- Show "✓ Enrolled" if student has active subscription
- Show "Add to Cart" only if student is NOT enrolled

---

## 4. Required Backend Endpoint

### Option 1: Check Single Subject Enrollment

**Endpoint**: `GET /api/StudentSubjects/student/{studentId}/has-access/subject/{subjectId}`

**From Swagger** (appears to exist):
```json
"/api/StudentSubjects/student/{studentId}/has-access/subject/{subjectId}": {
  "get": {
    "tags": ["StudentSubjects"],
    "parameters": [
      {
        "name": "studentId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      },
      {
        "name": "subjectId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "integer",
          "format": "int32"
        }
      }
    ]
  }
}
```

**Question**: Does this endpoint return:
- Boolean: `{ hasAccess: true }`
- Or detailed subscription info: `{ hasAccess: true, subscription: {...} }`

**Request Example**:
```http
GET /api/StudentSubjects/student/8/has-access/subject/5
Authorization: Bearer {token}
```

**Expected Response**:
```json
{
  "hasAccess": true,
  "subscriptionId": 123,
  "planName": "Mathematics - Term 1",
  "expiresAt": "2025-12-31T23:59:59"
}
```

Or simpler:
```json
{
  "hasAccess": true
}
```

---

### Option 2: Get All Student Subscriptions (Summary)

**Endpoint**: `GET /api/StudentSubjects/student/{studentId}/subscriptions-summary`

**From Swagger** (appears to exist):
```json
"/api/StudentSubjects/student/{studentId}/subscriptions-summary": {
  "get": {
    "tags": ["StudentSubjects"]
  }
}
```

**Question**: Does this return a list of active subscriptions?

**Request Example**:
```http
GET /api/StudentSubjects/student/8/subscriptions-summary
Authorization: Bearer {token}
```

**Expected Response**:
```json
{
  "activeSubscriptions": [
    {
      "subjectId": 5,
      "subjectName": "Mathematics",
      "planId": 10,
      "planName": "Mathematics - Term 1",
      "status": "Active",
      "expiresAt": "2025-12-31"
    },
    {
      "subjectId": 7,
      "subjectName": "English",
      "planId": 15,
      "planName": "English - Full Year",
      "status": "Active",
      "expiresAt": "2025-12-31"
    }
  ],
  "totalActive": 2
}
```

---

## 5. Requested Details from Backend Team

### A. Endpoint Confirmation

1. **Does `/api/StudentSubjects/student/{studentId}/has-access/subject/{subjectId}` exist and work?**
2. **What does it return?** (Response schema)
3. **Does it require authorization?** (Bearer token)
4. **Does it check active subscriptions only or all subscriptions?**

### B. Alternative Endpoint

1. **Does `/api/StudentSubjects/student/{studentId}/subscriptions-summary` exist?**
2. **What does it return?** (List of active subscriptions?)
3. **Can we use it to check enrollment status?**

### C. Response Schema

Please provide:
- **Full response schema** for both endpoints
- **Example successful response**
- **Example when student has no subscriptions**
- **Error responses** (if any)

---

## 6. Frontend Implementation Plan

### Approach 1: Check Each Subject Individually

```typescript
// courses.component.ts
isEnrolled(course: Course): boolean {
  const currentUser = this.authService.getCurrentUser();
  
  if (!currentUser?.studentId) return false;
  
  // Call API to check enrollment
  this.http.get<{ hasAccess: boolean }>(
    `${apiUrl}/StudentSubjects/student/${currentUser.studentId}/has-access/subject/${course.id}`
  ).subscribe(response => {
    return response.hasAccess;
  });
}
```

**Issue**: This would make **multiple API calls** (one per subject card on page)

---

### Approach 2: Load All Subscriptions Once

```typescript
// courses.component.ts
private loadStudentSubscriptions(): void {
  const currentUser = this.authService.getCurrentUser();
  
  if (!currentUser?.studentId) return;
  
  // Load all active subscriptions once
  this.http.get<SubscriptionsSummary>(
    `${apiUrl}/StudentSubjects/student/${currentUser.studentId}/subscriptions-summary`
  ).subscribe(response => {
    this.enrolledSubjectIds = response.activeSubscriptions.map(sub => sub.subjectId);
  });
}

isEnrolled(course: Course): boolean {
  return this.enrolledSubjectIds.includes(course.id);
}
```

**Preferred**: ✅ This approach makes **only 1 API call** on page load

---

## 7. Use Cases

### Use Case 1: Parent viewing courses for student

```
1. Parent logs in
2. Parent navigates to /courses
3. Frontend calls: GET /api/StudentSubjects/student/8/subscriptions-summary
4. Gets list of enrolled subjects: [5, 7, 12]
5. For each course card:
   - If course.id IN enrolledSubjectIds → Show "✓ Enrolled"
   - Else → Show "Add to Cart"
```

### Use Case 2: Student viewing courses

```
1. Student logs in (studentId from token)
2. Student navigates to /courses
3. Frontend calls: GET /api/StudentSubjects/student/{studentId}/subscriptions-summary
4. Same logic as above
```

---

## 8. UI Impact

### Current UI (Before Fix):
```
┌─────────────────────────┐
│ Mathematics             │
│ Year 7 - 4 Terms        │
│ Starting from AUD 12.99 │
│                         │
│ [View Lessons] [Add to Cart] │  ← Wrong (student already enrolled)
└─────────────────────────┘
```

### Expected UI (After Fix):
```
┌─────────────────────────┐
│ Mathematics             │
│ Year 7 - 4 Terms        │
│ Starting from AUD 12.99 │
│                         │
│ [View Lessons] [✓ Enrolled] │  ← Correct (disabled button)
└─────────────────────────┘
```

---

## 9. Testing Scenarios

**Test 1: Student with active subscriptions**
```
Given: Student enrolled in Mathematics & English
When: Viewing courses page
Then: 
  - Mathematics card shows "✓ Enrolled"
  - English card shows "✓ Enrolled"
  - Science card shows "Add to Cart"
```

**Test 2: Student with no subscriptions**
```
Given: New student with no enrollments
When: Viewing courses page
Then: All cards show "Add to Cart"
```

**Test 3: Expired subscription**
```
Given: Student had Mathematics subscription that expired
When: Viewing courses page
Then: Mathematics card shows "Add to Cart" (not enrolled anymore)
```

---

## 10. Priority

**🟡 MEDIUM-HIGH**

**Why**:
- Prevents duplicate purchases
- Better UX (student knows what they're enrolled in)
- Avoids backend cart validation errors

**Impact**:
- Currently students can add same subject to cart
- Backend rejects it with error
- Better to prevent at UI level

---

## 11. Questions Summary

1. ✅ Does `/api/StudentSubjects/student/{studentId}/has-access/subject/{subjectId}` exist?
2. ✅ What does it return? (Response schema)
3. ✅ Does `/api/StudentSubjects/student/{studentId}/subscriptions-summary` exist?
4. ✅ What does it return? (List of subscriptions?)
5. ✅ Which endpoint is recommended for checking enrollments?
6. ✅ Does it check only **active** subscriptions or all?
7. ✅ Are there any rate limits or caching recommendations?

---

## 12. Temporary Frontend Solution

Until backend response received, implemented placeholder:

```typescript
// courses.component.ts
isEnrolled(course: Course): boolean {
  // TODO: Implement subscription check with backend API
  return false; // Placeholder - always shows "Add to Cart"
}
```

**HTML Updated**:
```html
@if (isEnrolled(course)) {
  <button disabled class="...">✓ Enrolled</button>
} @else if (isInCart(course.id)) {
  <button (click)="removeFromCart(course.id)">Remove from Cart</button>
} @else {
  <button (click)="addToCart(course)">Add to Cart</button>
}
```

---

**Report Generated**: November 1, 2025  
**Frontend Status**: ⏳ UI updated, awaiting backend endpoint details  
**Backend Action Required**: ❓ Provide endpoint documentation for subscription checking

---

**Next Steps**:
1. Backend team confirms endpoint existence
2. Backend provides response schema
3. Frontend implements API integration
4. Test enrollment detection flow
5. Deploy to production