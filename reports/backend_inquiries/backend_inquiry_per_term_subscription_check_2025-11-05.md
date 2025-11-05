# ❓ Backend Inquiry Report

**Date:** November 5, 2025  
**Topic:** Per-Term Subscription Access Verification  
**Reporter:** Frontend Team (Angular)  
**Priority:** High

---

## 1. Inquiry Topic

How to verify student subscription/access status for **each individual term** of a subject?

---

## 2. Reason for Inquiry

### Current Situation:

The frontend currently uses:
```
GET /api/StudentSubjects/student/{studentId}/current-term-week?subjectId={subjectId}
```

**Response Example:**
```json
{
  "hasAccess": true,
  "currentTermNumber": 4,
  "currentTermName": "Term 4",
  "subscriptionType": "SingleTerm",
  "message": null
}
```

### Problem:

This endpoint only returns information about the **current term**. It doesn't provide access status for other terms (Term 1, 2, 3).

### User Story:

**Student Subscriptions:**
- Algebra Year 7 - Term 1 ✅
- Algebra Year 7 - Term 3 ✅
- Physics Year 7 - Term 3 & 4 ✅

**Expected Behavior:**

When viewing "Algebra Year 7" lessons page:
- **Term 1**: Show lessons with "Start Lesson" button ✅ (subscribed)
- **Term 2**: Show lessons with "Subscribe to Access" button 🔒 (not subscribed)
- **Term 3**: Show lessons with "Start Lesson" button ✅ (subscribed)
- **Term 4**: Show lessons with "Subscribe to Access" button 🔒 (not subscribed)

**Current Behavior:**

The frontend cannot determine which terms are accessible because the API only returns current term info.

---

## 3. Security Concern

**Critical Issue:** Students can currently bypass subscription checks by:

1. Manually changing URL parameters:
   ```
   /lessons?subjectId=1&termNumber=2  ← Not subscribed to Term 2
   ```

2. The frontend loads lessons successfully even without subscription

3. Buttons show "Start Lesson" instead of "Subscribe to Access"

**This is a security vulnerability!**

---

## 4. Requested Details from Backend Team

### Option A: New Endpoint (Recommended)

Create a new endpoint that returns subscription status for **all terms** of a subject:

```
GET /api/StudentSubjects/student/{studentId}/subject/{subjectId}/term-access
```

**Suggested Response:**
```json
{
  "studentId": 1,
  "subjectId": 1,
  "subjectName": "Algebra Year 7",
  "currentTermNumber": 4,
  "terms": [
    {
      "termNumber": 1,
      "termName": "Term 1",
      "hasAccess": true,
      "subscriptionType": "SingleTerm",
      "startDate": "2025-01-01",
      "endDate": "2025-03-31"
    },
    {
      "termNumber": 2,
      "termName": "Term 2",
      "hasAccess": false,
      "subscriptionType": null,
      "startDate": "2025-04-01",
      "endDate": "2025-06-30"
    },
    {
      "termNumber": 3,
      "termName": "Term 3",
      "hasAccess": true,
      "subscriptionType": "SingleTerm",
      "startDate": "2025-07-01",
      "endDate": "2025-09-30"
    },
    {
      "termNumber": 4,
      "termName": "Term 4",
      "hasAccess": false,
      "subscriptionType": null,
      "startDate": "2025-10-01",
      "endDate": "2025-12-31"
    }
  ]
}
```

---

### Option B: Modify Existing Endpoint

Update the current endpoint to include all terms:

```
GET /api/StudentSubjects/student/{studentId}/current-term-week?subjectId={subjectId}&includeAllTerms=true
```

**Modified Response:**
```json
{
  "hasAccess": true,
  "currentTermNumber": 4,
  "currentTermName": "Term 4",
  "currentWeekNumber": 6,
  "subscriptionType": "SingleTerm",
  "allTerms": [
    {
      "termNumber": 1,
      "hasAccess": true
    },
    {
      "termNumber": 2,
      "hasAccess": false
    },
    {
      "termNumber": 3,
      "hasAccess": true
    },
    {
      "termNumber": 4,
      "hasAccess": true
    }
  ]
}
```

---

### Option C: Existing Endpoint (Check if Available)

Is there already an endpoint that provides this functionality?

Possible candidates:
- `/api/StudentSubjects/student/{studentId}/subscriptions-summary`
- `/api/StudentSubjects/student/{studentId}/has-access/subject/{subjectId}`

**Please confirm:**
- Does any existing endpoint return per-term access status?
- What is the response structure?
- Example request/response?

---

## 5. Required Backend Logic

The backend should:

1. **Query student subscriptions** for the given subject
2. **Check subscription type:**
   - `FullYear` → Access to all 4 terms
   - `SingleTerm` → Access to specific term only
   - `MultipleTerm` → Access to multiple specific terms
3. **Return access status** for each term (1-4)
4. **Validate subscription dates** (start/end dates)
5. **Handle expired subscriptions**

---

## 6. Frontend Usage

Once the endpoint is available, the frontend will:

```typescript
// Load term access status
this.coursesService.getTermAccessStatus(studentId, subjectId)
  .subscribe(response => {
    // Update available terms with access status
    const terms = response.terms.map(t => ({
      id: t.termId,
      termNumber: t.termNumber,
      name: t.termName,
      hasAccess: t.hasAccess,
      isCurrentTerm: t.termNumber === response.currentTermNumber
    }));
    
    this.availableTerms.set(terms);
  });
```

---

## 7. Security Implementation

**Backend Validation Required:**

When a student requests lessons for a specific term:

```
GET /api/Lessons/subject/{subjectId}/term-number/{termNumber}/with-progress/{studentId}
```

**The backend MUST:**

1. ✅ Verify student has active subscription for that term
2. ✅ Check subscription dates (not expired)
3. ✅ Return 403 Forbidden if no access
4. ❌ **Do NOT** rely only on frontend checks

**Example Error Response:**
```json
{
  "statusCode": 403,
  "message": "You do not have an active subscription for this term",
  "details": {
    "subjectId": 1,
    "termNumber": 2,
    "subscriptionRequired": true,
    "availableSubscriptions": [1, 3, 4]
  }
}
```

---

## 8. Impact Analysis

### Frontend Impact:
- Update `courses.service.ts` with new endpoint
- Update `lessons.component.ts` to use per-term access
- Update UI to show/hide terms based on subscription
- Add proper error handling for 403 responses

### Backend Impact:
- Create new endpoint OR modify existing one
- Add subscription validation logic
- Add proper authorization checks
- Update Swagger documentation

### Testing Required:
- ✅ Student with Full Year subscription → Access all terms
- ✅ Student with Single Term subscription → Access one term only
- ✅ Student with Multiple Terms subscription → Access specific terms
- ✅ Student with no subscription → No access (403)
- ✅ Student tries to access via URL manipulation → Blocked (403)
- ✅ Expired subscription → No access (403)

---

## 9. Timeline

**Urgency:** High - Security vulnerability

**Requested Delivery:**
- Backend endpoint: ASAP (security issue)
- Swagger documentation: With endpoint
- Frontend integration: After backend deployment

---

## 10. Questions for Backend Team

1. Is there an existing endpoint that provides per-term access status?
2. Which option (A, B, or C) is preferred for implementation?
3. What is the database structure for subscriptions?
   - Does `StudentSubjects` table store term-level subscriptions?
   - Is there a separate `Subscriptions` table?
4. How are "Multiple Term" subscriptions stored? (e.g., Term 3 & 4)
5. What should happen when a student has both Full Year and Single Term subscriptions?
6. Should the backend automatically block lesson requests for unauthorized terms?
7. What HTTP status code should be returned for unauthorized access?
   - 403 Forbidden?
   - 401 Unauthorized?
   - Custom error code?

---

## 11. Additional Notes

### Current Workaround (Temporary):

The frontend currently assumes:
```typescript
if (subscriptionType === 'FullYear') {
  hasAccess = true; // All terms
} else if (subscriptionType === 'SingleTerm') {
  hasAccess = bt.termNumber === currentTermNumber; // Current term only
}
```

**This is NOT secure** and should be replaced with proper backend validation.

---

## 12. Related Endpoints

These endpoints may need updates:

- `/api/Lessons/subject/{subjectId}/term-number/{termNumber}/with-progress/{studentId}`
  - Add subscription validation
  - Return 403 if no access

- `/api/StudentSubjects/student/{studentId}/has-access/subject/{subjectId}`
  - Does this check per-term access?
  - Or just subject-level access?

- `/api/StudentSubjects/student/{studentId}/subscriptions-summary`
  - Does this include term details?
  - Can it be used for per-term checks?

---

## 13. Contact Information

**Frontend Team:**
- Component: `lessons.component.ts`
- Service: `courses.service.ts`
- Issue: Term access verification

**Waiting for:**
- Backend endpoint details
- Response structure confirmation
- Security implementation confirmation

---

**Status:** ⏳ Awaiting Backend Team Response  
**Priority:** 🔴 High (Security Issue)  
**Created:** November 5, 2025  
**Last Updated:** November 5, 2025
