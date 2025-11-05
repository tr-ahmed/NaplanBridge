# ❌ Backend Bug Report: Term Access Endpoint

**Date:** November 5, 2025  
**Endpoint:** `GET /api/StudentSubjects/student/{studentId}/subject/{subjectId}/term-access`  
**Status:** ✅ **FIXED** (December 2025)

---

## 🎉 UPDATE: Bug Fixed!

**Fixed Date:** December 2025  
**Status:** ✅ Resolved

The backend team has fixed this issue. The endpoint now correctly returns `hasAccess` status based on actual subscriptions.

**Root Cause:** Full Year subscriptions were not checking if the subscription year matched the subject's year.

**Fix:** Added year validation in `CheckTermAccessFixed()` method.

See: `PER_TERM_ACCESS_VERIFICATION.md` for complete fix details.

---

## 🐛 Original Bug Report (November 5, 2025)

---

## 🐛 Bug Description

The endpoint is returning `hasAccess: true` for **ALL terms**, even though the student only has subscriptions for specific terms.

---

## 📊 Expected vs Actual Behavior

### Student Subscriptions (from Dashboard):
```
- Algebra Year 7 - Term 1 ✅
- Algebra Year 7 - Term 3 ✅
```

### Expected Response:
```json
{
  "studentId": 1,
  "subjectId": 1,
  "subjectName": "Algebra",
  "currentTermNumber": 4,
  "terms": [
    {
      "termNumber": 1,
      "termName": "Term 1",
      "hasAccess": true,    ✅ Subscribed
      "subscriptionType": "SingleTerm"
    },
    {
      "termNumber": 2,
      "termName": "Term 2",
      "hasAccess": false,   🔒 NOT subscribed
      "subscriptionType": null
    },
    {
      "termNumber": 3,
      "termName": "Term 3",
      "hasAccess": true,    ✅ Subscribed
      "subscriptionType": "SingleTerm"
    },
    {
      "termNumber": 4,
      "termName": "Term 4",
      "hasAccess": false,   🔒 NOT subscribed
      "subscriptionType": null
    }
  ]
}
```

### Actual Response (BUG):
```json
{
  "studentId": 1,
  "subjectId": 1,
  "subjectName": "Algebra",
  "currentTermNumber": 4,
  "terms": [
    {
      "termNumber": 1,
      "termName": "Term 1",
      "hasAccess": true,    ❌ Wrong (but actually correct)
      "subscriptionType": "???"
    },
    {
      "termNumber": 2,
      "termName": "Term 2",
      "hasAccess": true,    ❌ WRONG! Should be false
      "subscriptionType": "???"
    },
    {
      "termNumber": 3,
      "termName": "Term 3",
      "hasAccess": true,    ❌ Wrong (but actually correct)
      "subscriptionType": "???"
    },
    {
      "termNumber": 4,
      "termName": "Term 4",
      "hasAccess": true,    ❌ WRONG! Should be false
      "subscriptionType": "???"
    }
  ]
}
```

**Result:** Frontend shows "Start Lesson" button for ALL terms, even non-subscribed ones.

---

## 🔍 Root Cause Analysis

### Possible Issues:

1. **Missing Subscription Check:**
   ```csharp
   // ❌ Current (wrong)
   public async Task<TermAccessStatusDto> GetTermAccessStatus(int studentId, int subjectId)
   {
       var terms = await _context.Terms
           .Where(t => t.SubjectId == subjectId)
           .Select(t => new TermAccessDto
           {
               TermId = t.Id,
               TermNumber = t.TermNumber,
               TermName = t.Name,
               HasAccess = true,  // ❌ Always true!
               // ...
           })
           .ToListAsync();
   }
   ```

2. **Should Check Subscriptions:**
   ```csharp
   // ✅ Correct
   public async Task<TermAccessStatusDto> GetTermAccessStatus(int studentId, int subjectId)
   {
       // Get student's active subscriptions for this subject
       var subscriptions = await _context.Subscriptions
           .Where(s => s.StudentId == studentId 
                    && s.SubjectId == subjectId
                    && s.PaymentStatus == "Active"
                    && s.EndDate >= DateTime.UtcNow)
           .ToListAsync();
       
       var terms = await _context.Terms
           .Where(t => t.SubjectId == subjectId)
           .Select(t => new TermAccessDto
           {
               TermId = t.Id,
               TermNumber = t.TermNumber,
               TermName = t.Name,
               // ✅ Check if student has subscription for this term
               HasAccess = subscriptions.Any(sub => 
                   sub.YearId == t.YearId ||                    // Full Year
                   sub.TermId == t.Id ||                        // Single Term
                   sub.IncludedTermIds.Contains(t.Id.ToString()) // Multi-Term
               ),
               // ...
           })
           .ToListAsync();
   }
   ```

---

## 🧪 Test Cases to Verify

### Test 1: Single Term Subscription
```
Student has: Term 1 only
Expected: Term 1 = true, Terms 2,3,4 = false
```

### Test 2: Multiple Single Terms
```
Student has: Term 1 & Term 3
Expected: Terms 1,3 = true, Terms 2,4 = false
```

### Test 3: Multi-Term Package
```
Student has: Terms 3 & 4 package
Expected: Terms 3,4 = true, Terms 1,2 = false
```

### Test 4: Full Year Subscription
```
Student has: Full Year
Expected: All terms = true
```

### Test 5: No Subscription
```
Student has: Nothing
Expected: All terms = false
```

---

## 🔒 Security Impact

**CRITICAL:** Students can currently access lessons from terms they haven't paid for!

### Current Vulnerability:
1. Frontend calls: `/api/Lessons/subject/1/term-number/2/with-progress/1`
2. Backend returns lessons even if student didn't subscribe to Term 2
3. Student can start lessons without payment

### Required Fix:
Backend must validate subscription in BOTH endpoints:
1. ✅ `/api/StudentSubjects/.../term-access` - Show correct UI
2. ✅ `/api/Lessons/.../term-number/{termNumber}/...` - Block unauthorized access

---

## 📝 Recommended Backend Changes

### File: `Controllers/StudentSubjectsController.cs`

```csharp
[HttpGet("student/{studentId}/subject/{subjectId}/term-access")]
public async Task<ActionResult<TermAccessStatusDto>> GetTermAccessStatus(
    int studentId, 
    int subjectId)
{
    // 1. Get student's active subscriptions
    var activeSubscriptions = await _subscriptionService
        .GetActiveSubscriptionsForSubject(studentId, subjectId);
    
    // 2. Get all terms for the subject
    var terms = await _context.Terms
        .Where(t => t.SubjectId == subjectId)
        .OrderBy(t => t.TermNumber)
        .ToListAsync();
    
    // 3. Check access for each term
    var termAccessList = terms.Select(term => new TermAccessDto
    {
        TermId = term.Id,
        TermNumber = term.TermNumber,
        TermName = term.Name,
        StartDate = term.StartDate,
        EndDate = term.EndDate,
        IsCurrentTerm = _academicCalendarService.IsCurrentTerm(term.Id),
        LessonCount = _context.Lessons.Count(l => l.TermId == term.Id),
        WeekCount = _context.Weeks.Count(w => w.TermId == term.Id),
        
        // ✅ CRITICAL: Check actual subscription
        HasAccess = CheckTermAccess(activeSubscriptions, term),
        SubscriptionType = GetSubscriptionType(activeSubscriptions, term),
        SubscriptionPlanId = GetSubscriptionPlanId(activeSubscriptions, term),
        SubscriptionEndDate = GetSubscriptionEndDate(activeSubscriptions, term)
    }).ToList();
    
    return Ok(new TermAccessStatusDto
    {
        StudentId = studentId,
        SubjectId = subjectId,
        SubjectName = subject.Name,
        CurrentTermNumber = currentTerm?.TermNumber ?? 0,
        Terms = termAccessList
    });
}

private bool CheckTermAccess(
    List<Subscription> subscriptions, 
    Term term)
{
    return subscriptions.Any(sub =>
        // Full Year subscription
        sub.YearId == term.YearId && sub.SubscriptionPlanType == "FullYear" ||
        
        // Subject Annual subscription
        sub.SubjectId == term.SubjectId && sub.SubscriptionPlanType == "SubjectAnnual" ||
        
        // Single Term subscription
        sub.TermId == term.Id && sub.SubscriptionPlanType == "SingleTerm" ||
        
        // Multi-Term subscription
        sub.SubscriptionPlanType == "MultiTerm" && 
        sub.IncludedTermIds?.Split(',').Contains(term.Id.ToString()) == true
    );
}
```

---

### File: `Controllers/LessonsController.cs`

Add authorization check:

```csharp
[HttpGet("subject/{subjectId}/term-number/{termNumber}/with-progress/{studentId}")]
public async Task<ActionResult<IEnumerable<LessonWithProgressDto>>> GetLessonsByTermNumber(
    int subjectId,
    int termNumber,
    int studentId)
{
    // ✅ SECURITY: Check if student has access to this term
    var hasAccess = await _subscriptionService
        .HasAccessToTerm(studentId, subjectId, termNumber);
    
    if (!hasAccess)
    {
        return Forbid(new
        {
            StatusCode = 403,
            Message = "You do not have an active subscription for this term",
            Details = new
            {
                SubjectId = subjectId,
                TermNumber = termNumber,
                SubscriptionRequired = true
            }
        });
    }
    
    // Continue with lesson retrieval...
    var lessons = await _lessonsService
        .GetLessonsByTermNumberWithProgress(subjectId, termNumber, studentId);
    
    return Ok(lessons);
}
```

---

## 🚀 Testing Instructions

After fixing, test with:

```bash
# Test 1: Get term access (should show correct access)
curl -H "Authorization: Bearer {token}" \
  https://naplan2.runasp.net/api/StudentSubjects/student/1/subject/1/term-access

# Expected: Terms 1,3 = true, Terms 2,4 = false

# Test 2: Try to access non-subscribed term (should fail)
curl -H "Authorization: Bearer {token}" \
  https://naplan2.runasp.net/api/Lessons/subject/1/term-number/2/with-progress/1

# Expected: 403 Forbidden
```

---

## 📊 Database Query to Check

```sql
-- Check student's subscriptions
SELECT 
    s.Id,
    s.StudentId,
    s.SubjectId,
    s.TermId,
    s.YearId,
    sp.Name AS PlanName,
    sp.PlanType,
    sp.IncludedTermIds,
    s.StartDate,
    s.EndDate,
    s.PaymentStatus
FROM Subscriptions s
JOIN SubscriptionPlans sp ON s.SubscriptionPlanId = sp.Id
WHERE s.StudentId = 1 
  AND s.SubjectId = 1
  AND s.PaymentStatus = 'Active'
  AND s.EndDate >= GETUTCDATE()
ORDER BY s.StartDate DESC;
```

---

## ✅ Acceptance Criteria

- [ ] Endpoint returns correct `hasAccess` status per term
- [ ] Students with Term 1 subscription: Only Term 1 accessible
- [ ] Students with Term 1 & 3: Only Terms 1,3 accessible
- [ ] Students with Full Year: All terms accessible
- [ ] Lesson endpoint returns 403 for unauthorized terms
- [ ] Frontend shows correct "Subscribe" vs "Start Lesson" buttons

---

**Priority:** 🔴 **CRITICAL - Security Issue**  
**Severity:** High (Payment bypass vulnerability)  
**Assigned To:** Backend Team  
**Status:** ⏳ Pending Fix  
**Created:** November 5, 2025  
**Reporter:** Frontend Team

---

## 📎 Related Files

- Frontend: `src/app/features/lessons/lessons.component.ts`
- Frontend: `src/app/core/services/courses.service.ts`
- Backend: `Controllers/StudentSubjectsController.cs`
- Backend: `Controllers/LessonsController.cs`
- Backend: `Services/SubscriptionService.cs`
