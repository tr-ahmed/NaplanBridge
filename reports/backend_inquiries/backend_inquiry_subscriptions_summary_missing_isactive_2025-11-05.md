# ❓ Backend Inquiry Report

## Date: November 5, 2025
## Topic: Missing `isActive` Field in Subscriptions Summary Endpoint
## Priority: 🔴 HIGH
## Status: ⏳ AWAITING BACKEND RESPONSE

---

## 1. Inquiry Topic

The endpoint `/api/StudentSubjects/student/{studentId}/subscriptions-summary` is **missing the `isActive` field** in its response, which is critical for determining active subscriptions.

---

## 2. Reason for Inquiry

### Current Issue:
The Parent Dashboard cannot distinguish between **active** and **inactive/expired** subscriptions because the API response does not include an `isActive` flag.

### Frontend Console Evidence:
```javascript
🔍 Child 1 - Subscription check: {
  subjectName: 'Algebra Year 7 - Term 1',
  isActive: undefined,           // ❌ Missing!
  hasIsActiveField: false,       // ❌ Field doesn't exist
  allFields: [
    'subjectId',
    'subjectName', 
    'subscriptionStartDate',
    'subscriptionEndDate',
    'price',
    'yearName',
    'categoryName',
    'termNumber',
    'weekNumber'
  ]
}
```

### Current API Response Structure:
```json
{
  "subjectId": 5,
  "subjectName": "Algebra Year 7 - Term 1",
  "subscriptionStartDate": "2024-09-01T00:00:00",
  "subscriptionEndDate": "2025-06-30T00:00:00",
  "price": 499.00,
  "yearName": "Year 7",
  "categoryName": "Mathematics",
  "termNumber": 1,
  "weekNumber": 1
}
```

**❌ Missing Field:** `isActive`

---

## 3. Impact on Frontend

### Current Problems:
1. ✅ API returns 4 subscriptions for student
2. ❌ Cannot determine which are active
3. ❌ Dashboard shows "0 Active Subscriptions" (incorrect)
4. ❌ Parent Dashboard displays "No Active Subscription" for all children
5. ❌ My Subscriptions page cannot filter active subscriptions
6. ❌ Order History cannot show subscription status

### User Experience Impact:
- Parents see "0 active subscriptions" even though subscriptions exist
- Cannot distinguish between current and expired subscriptions
- Billing and renewal decisions are impossible
- Misleading dashboard statistics

---

## 4. Requested Details from Backend Team

### Required Changes:

#### Option 1: Add `isActive` Boolean Field (Recommended)
```json
{
  "subjectId": 5,
  "subjectName": "Algebra Year 7 - Term 1",
  "isActive": true,  // ← ADD THIS FIELD
  "subscriptionStartDate": "2024-09-01T00:00:00",
  "subscriptionEndDate": "2025-06-30T00:00:00",
  "price": 499.00,
  "yearName": "Year 7",
  "categoryName": "Mathematics",
  "termNumber": 1,
  "weekNumber": 1
}
```

**Logic for `isActive`:**
```csharp
isActive = DateTime.Now >= subscriptionStartDate && 
           DateTime.Now <= subscriptionEndDate
```

#### Option 2: Add `status` String Field
```json
{
  "status": "Active",  // or "Expired", "Cancelled", "Pending"
  // ... other fields
}
```

#### Option 3: Return Subscription Status Object
```json
{
  "isActive": true,
  "status": "Active",
  "daysRemaining": 180,
  "isExpiringSoon": false,
  // ... other fields
}
```

---

## 5. Specific Questions for Backend Team

### Question 1: Field Availability
**Q:** Does the `StudentSubjects` table have an `IsActive` column?  
**Expected Answer:** Yes/No  
**If No:** Can it be calculated from `SubscriptionStartDate` and `SubscriptionEndDate`?

### Question 2: Endpoint Modification
**Q:** Can the `/api/StudentSubjects/student/{studentId}/subscriptions-summary` endpoint be updated to include:
- `isActive` (boolean)
- Or `status` (string: "Active", "Expired", "Cancelled")

**Expected Answer:** Yes, will be added in next update

### Question 3: Alternative Endpoints
**Q:** Is there another endpoint that returns subscription status?  
**Expected Answer:** Endpoint URL if exists

### Question 4: Database Schema
**Q:** What is the current schema for `StudentSubjects` table?  
**Requested Info:**
```sql
-- Please provide table schema
CREATE TABLE StudentSubjects (
    Id INT PRIMARY KEY,
    StudentId INT,
    SubjectId INT,
    SubscriptionStartDate DATETIME,
    SubscriptionEndDate DATETIME,
    IsActive BIT,  -- Does this exist?
    Status NVARCHAR(50),  -- Does this exist?
    -- ... other columns
)
```

### Question 5: Business Logic
**Q:** How should the system determine if a subscription is active?
- Based on dates only?
- Based on payment status?
- Based on manual activation/deactivation?
- Combination of factors?

**Expected Answer:** Clear business rules

---

## 6. Suggested Backend Implementation

### Controller: `StudentSubjectsController.cs`

#### Current Implementation (Assumed):
```csharp
[HttpGet("student/{studentId}/subscriptions-summary")]
public async Task<IActionResult> GetSubscriptionsSummary(int studentId)
{
    var subscriptions = await _context.StudentSubjects
        .Where(ss => ss.StudentId == studentId)
        .Select(ss => new SubscriptionSummaryDto
        {
            SubjectId = ss.SubjectId,
            SubjectName = ss.Subject.Name,
            SubscriptionStartDate = ss.SubscriptionStartDate,
            SubscriptionEndDate = ss.SubscriptionEndDate,
            Price = ss.Price,
            YearName = ss.Subject.Year.Name,
            CategoryName = ss.Subject.Category.Name,
            TermNumber = ss.TermNumber,
            WeekNumber = ss.WeekNumber
        })
        .ToListAsync();
    
    return Ok(subscriptions);
}
```

#### Suggested Implementation (With `isActive`):
```csharp
[HttpGet("student/{studentId}/subscriptions-summary")]
public async Task<IActionResult> GetSubscriptionsSummary(int studentId)
{
    var now = DateTime.UtcNow;
    
    var subscriptions = await _context.StudentSubjects
        .Where(ss => ss.StudentId == studentId)
        .Select(ss => new SubscriptionSummaryDto
        {
            SubjectId = ss.SubjectId,
            SubjectName = ss.Subject.Name,
            IsActive = now >= ss.SubscriptionStartDate && 
                      now <= ss.SubscriptionEndDate,  // ← ADD THIS
            SubscriptionStartDate = ss.SubscriptionStartDate,
            SubscriptionEndDate = ss.SubscriptionEndDate,
            Price = ss.Price,
            YearName = ss.Subject.Year.Name,
            CategoryName = ss.Subject.Category.Name,
            TermNumber = ss.TermNumber,
            WeekNumber = ss.WeekNumber
        })
        .ToListAsync();
    
    return Ok(subscriptions);
}
```

#### DTO Update Required:
```csharp
// File: DTOs/SubscriptionSummaryDto.cs
public class SubscriptionSummaryDto
{
    public int SubjectId { get; set; }
    public string SubjectName { get; set; }
    public bool IsActive { get; set; }  // ← ADD THIS
    public DateTime SubscriptionStartDate { get; set; }
    public DateTime SubscriptionEndDate { get; set; }
    public decimal Price { get; set; }
    public string YearName { get; set; }
    public string CategoryName { get; set; }
    public int TermNumber { get; set; }
    public int WeekNumber { get; set; }
}
```

---

## 7. Expected Response After Fix

```json
[
  {
    "subjectId": 5,
    "subjectName": "Algebra Year 7 - Term 1",
    "isActive": true,  // ✅ NOW INCLUDED
    "subscriptionStartDate": "2024-09-01T00:00:00",
    "subscriptionEndDate": "2025-06-30T00:00:00",
    "price": 499.00,
    "yearName": "Year 7",
    "categoryName": "Mathematics",
    "termNumber": 1,
    "weekNumber": 1
  },
  {
    "subjectId": 8,
    "subjectName": "Physics Year 8 - Term 2",
    "isActive": false,  // ✅ Expired subscription
    "subscriptionStartDate": "2023-09-01T00:00:00",
    "subscriptionEndDate": "2024-06-30T00:00:00",
    "price": 399.00,
    "yearName": "Year 8",
    "categoryName": "Science",
    "termNumber": 2,
    "weekNumber": 1
  }
]
```

---

## 8. Related Endpoints That May Need Similar Updates

These endpoints might also benefit from `isActive` field:

1. `/api/StudentSubjects/student/{studentId}/available-subjects`
2. `/api/Dashboard/parent` - Parent dashboard endpoint
3. `/api/Dashboard/student` - Student dashboard endpoint
4. `/api/Subjects/{id}/enrollment` - Enrollment details

**Question:** Do these endpoints also need the `isActive` field?

---

## 9. Testing Requirements

After backend implementation, please provide:

### Test Case 1: Active Subscription
```json
// Student with active subscription (current date within range)
GET /api/StudentSubjects/student/1/subscriptions-summary

Expected: isActive = true
```

### Test Case 2: Expired Subscription
```json
// Student with expired subscription (current date > end date)
GET /api/StudentSubjects/student/2/subscriptions-summary

Expected: isActive = false
```

### Test Case 3: Future Subscription
```json
// Student with future subscription (current date < start date)
GET /api/StudentSubjects/student/3/subscriptions-summary

Expected: isActive = false (or true, depending on business logic)
```

### Test Case 4: Mixed Subscriptions
```json
// Student with both active and expired subscriptions
GET /api/StudentSubjects/student/4/subscriptions-summary

Expected: Mix of isActive = true and isActive = false
```

---

## 10. Alternative Workaround (Not Recommended)

If backend changes are delayed, frontend can calculate `isActive`:

```typescript
// ❌ NOT RECOMMENDED - Should be done in backend
const isActive = (sub: any) => {
  const now = new Date();
  const start = new Date(sub.subscriptionStartDate);
  const end = new Date(sub.subscriptionEndDate);
  return now >= start && now <= end;
};
```

**Why Not Recommended:**
- Business logic in frontend
- Timezone issues
- Inconsistent across different clients
- No single source of truth
- Harder to maintain

---

## 11. Documentation Update Required

After implementation, please update:

1. **Swagger Documentation**
   - Add `isActive` field to response schema
   - Update example responses

2. **API Documentation**
   - Document `isActive` calculation logic
   - Explain when subscription is considered "active"

3. **Frontend API Integration Guide**
   - Update `API_DOCUMENTATION_FOR_FRONTEND.md`
   - Provide updated response examples

---

## 12. Timeline Request

**Urgency:** 🔴 HIGH - Blocking Parent Dashboard functionality

**Requested Timeline:**
- Backend fix implementation: **2-3 days**
- Testing and deployment: **1-2 days**
- Frontend integration: **1 day** (ready immediately after backend deployment)

**Total:** ~1 week maximum

---

## 13. Contact Information

**Frontend Developer:** GitHub Copilot  
**Date Reported:** November 5, 2025  
**Affected Components:**
- Parent Dashboard
- My Subscriptions Page
- Order History
- Analytics Dashboard

**Awaiting Response From:** Backend Team / API Developer

---

## 14. Summary

### Current State:
- ❌ API returns subscriptions without `isActive` field
- ❌ Frontend cannot determine active vs expired subscriptions
- ❌ Dashboard shows incorrect statistics (0 active subscriptions)

### Required Action:
- ✅ Add `isActive` boolean field to subscriptions-summary endpoint
- ✅ Calculate based on current date vs start/end dates
- ✅ Update DTO and response schema
- ✅ Update Swagger documentation

### Expected Outcome:
- ✅ Frontend displays correct active subscription count
- ✅ Parents can see which subscriptions are currently active
- ✅ Better user experience and accurate billing information

---

**Status:** ⏳ AWAITING BACKEND TEAM RESPONSE

**Please respond with:**
1. Confirmation of field addition
2. Expected implementation timeline
3. Any alternative solutions if field cannot be added
4. Updated API documentation once deployed

---

**Report Generated:** November 5, 2025  
**Report ID:** INQUIRY-SUBSCRIPTIONS-001  
**Priority:** HIGH  
**Component:** StudentSubjects API
