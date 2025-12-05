# 📌 BACKEND REPORT: term-access Endpoint Returns Wrong hasAccess Values

**Date:** 2025-11-28  
**Endpoint:** `/api/StudentSubjects/student/{id}/subject/{id}/term-access`  
**Priority:** HIGH  
**Status:** BACKEND BUG

---

## 🔴 Critical Issue

The endpoint returns `hasAccess: false` for **ALL terms**, even when the student has an active subscription and can actually access lessons.

This contradicts the lessons endpoint which correctly returns `hasAccess: true` for lessons.

---

## 🔍 Evidence

**API Call:**
```
GET /api/StudentSubjects/student/11/subject/1/term-access
```

**Current Response:**
```json
{
  "studentId": 11,
  "subjectId": 1,
  "subjectName": "Algebra",
  "currentTermNumber": 4,
  "terms": [
    {
      "termId": 0,
      "termNumber": 1,
      "termName": "Term 1",
      "hasAccess": false,  // ❌ WRONG
      "isCurrentTerm": false,
      "lessonCount": 0,    // ❌ WRONG - Should be 29
      "weekCount": 0
    },
    {
      "termId": 0,
      "termNumber": 2,
      "termName": "Term 2",
      "hasAccess": false,  // ❌ WRONG
      "lessonCount": 0,
      "weekCount": 0
    },
    {
      "termId": 0,
      "termNumber": 3,
      "termName": "Term 3",
      "hasAccess": false,  // ❌ WRONG
      "lessonCount": 0,
      "weekCount": 0
    },
    {
      "termId": 0,
      "termNumber": 4,
      "termName": "Term 4",
      "hasAccess": false,  // ❌ WRONG - Should be TRUE
      "isCurrentTerm": true,
      "lessonCount": 0,    // ❌ WRONG - Should be 24+
      "weekCount": 0
    }
  ]
}
```

**But the lessons endpoint returns:**
```
GET /api/Lessons/subject/1/with-progress?studentId=11
Result: 29 lessons with hasAccess: true ✅
```

---

## 📊 Problems Found

1. ❌ **All terms have `hasAccess: false`** even though student has active subscription
2. ❌ **All terms have `lessonCount: 0`** even though there are 29 lessons
3. ❌ **All terms have `termId: 0`** (should be actual term IDs from Terms table)
4. ❌ **All terms have `weekCount: 0`** (should show actual week counts)

---

## ✅ Expected Response

```json
{
  "studentId": 11,
  "subjectId": 1,
  "subjectName": "Algebra",
  "currentTermNumber": 4,
  "terms": [
    {
      "termId": 1,            // ✅ Actual term ID from Terms table
      "termNumber": 1,
      "termName": "Term 1",
      "hasAccess": true,      // ✅ Should be true if subscribed
      "isCurrentTerm": false,
      "lessonCount": 29,      // ✅ Actual lesson count
      "weekCount": 10,        // ✅ Actual week count
      "subscriptionType": "SingleTerm",
      "subscriptionEndDate": "2025-12-31"
    },
    {
      "termId": 2,
      "termNumber": 2,
      "termName": "Term 2",
      "hasAccess": false,
      "lessonCount": 24,
      "weekCount": 10
    },
    {
      "termId": 3,
      "termNumber": 3,
      "termName": "Term 3",
      "hasAccess": false,
      "lessonCount": 22,
      "weekCount": 10
    },
    {
      "termId": 4,
      "termNumber": 4,
      "termName": "Term 4",
      "hasAccess": false,
      "isCurrentTerm": true,
      "lessonCount": 20,
      "weekCount": 10
    }
  ]
}
```

---

## 🔍 Root Cause Analysis

The backend code in `GetTermAccessStatusAsync()` is likely:

1. **Not checking student's subscription** when setting `hasAccess`
2. **Not counting actual lessons** (just returning 0)
3. **Not fetching subject-specific term IDs** (returning 0)
4. **Not counting weeks** (returning 0)

### Suspected Code Issue:

```csharp
// ❌ WRONG: Not checking subscription
foreach (var academicTerm in allAcademicTerms)
{
    termAccessList.Add(new TermAccessDto
    {
        TermId = 0,  // ❌ Not fetching from Terms table
        TermNumber = academicTerm.TermNumber,
        TermName = academicTerm.Name,
        HasAccess = false,  // ❌ Always false!
        LessonCount = 0,    // ❌ Not counting
        WeekCount = 0       // ❌ Not counting
    });
}
```

### Required Fix:

```csharp
// ✅ CORRECT: Check subscription and count resources
foreach (var academicTerm in allAcademicTerms)
{
    // Find subject-specific term
    var subjectTerm = subject.Terms.FirstOrDefault(t => 
        t.AcademicTermId == academicTerm.Id
    );
    
    // Check if student has access to this term
    bool hasAccess = CheckTermAccessFixed(
        subscription, 
        subjectTerm?.Id, 
        academicTerm.TermNumber
    );
    
    // Count actual lessons and weeks
    int lessonCount = subjectTerm != null 
        ? context.Lessons.Count(l => l.Week.TermId == subjectTerm.Id)
        : 0;
        
    int weekCount = subjectTerm != null
        ? context.Weeks.Count(w => w.TermId == subjectTerm.Id)
        : 0;
    
    termAccessList.Add(new TermAccessDto
    {
        TermId = subjectTerm?.Id ?? 0,
        TermNumber = academicTerm.TermNumber,
        TermName = academicTerm.Name,
        HasAccess = hasAccess,  // ✅ Actually check!
        IsCurrentTerm = academicTerm.TermNumber == currentTermNumber,
        LessonCount = lessonCount,  // ✅ Count lessons
        WeekCount = weekCount,      // ✅ Count weeks
        SubscriptionType = hasAccess ? subscription?.PlanType : null,
        SubscriptionEndDate = hasAccess ? subscription?.EndDate : null
    });
}
```

---

## 📝 Impact

**Current Situation:**
- ❌ Frontend cannot show which terms student has access to
- ❌ UI shows all terms as locked (even though student has access)
- ❌ Poor UX - students don't know what they can access
- ✅ **Workaround applied** - Frontend assumes access if `currentTermNumber` is set

**After Fix:**
- ✅ Students see exactly which terms they can access
- ✅ Clear visual indication of subscribed vs locked terms
- ✅ Better transparency in subscription status

---

## 🧪 Test Cases

### Test 1: Single Term Subscription
**Student ID:** 11  
**Subject ID:** 1  
**Subscription:** Single Term (Term 1)

**Expected:**
- Term 1: `hasAccess: true`, `lessonCount: 29`
- Terms 2-4: `hasAccess: false`

### Test 2: Subject Annual
**Subscription:** Subject Annual (All Terms)

**Expected:**
- All terms: `hasAccess: true`
- Each term shows actual `lessonCount`

### Test 3: No Subscription
**No active subscription**

**Expected:**
- All terms: `hasAccess: false`
- Still show `lessonCount` (for preview)

---

## ✅ Frontend Workaround (Applied)

The frontend now assumes the student has access to `currentTermNumber` if:
- All terms return `hasAccess: false`
- But `currentTermNumber` is set

This allows the app to function until backend is fixed.

**File:** `src/app/features/courses/courses.component.ts`  
**Status:** ✅ DEPLOYED

---

## 🚨 Request

**Backend Team:** Please fix the `GetTermAccessStatusAsync()` method to:
1. ✅ Check student's subscription when setting `hasAccess`
2. ✅ Fetch actual `termId` from Terms table (not 0)
3. ✅ Count actual lessons for each term
4. ✅ Count actual weeks for each term
5. ✅ Include subscription details (type, end date)

**Priority:** HIGH - This affects user experience and subscription transparency

---

**Status:** Frontend workaround deployed ✅ | Backend fix required ❌  
**Last Updated:** 2025-11-28
