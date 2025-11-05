# 🐛 Backend Bug Report: Duplicate Terms in Response

**Date:** November 5, 2025  
**Endpoint:** `GET /api/StudentSubjects/student/{studentId}/subject/{subjectId}/term-access`  
**Status:** ✅ **FIXED** (December 2025)  
**Priority:** 🔴 HIGH

---

## 🎉 UPDATE: Bug Fixed!

**Fixed Date:** December 2025  
**Status:** ✅ Resolved

The backend team has fixed this issue. The endpoint now returns only 4 terms from the current academic year.

**Root Cause:** Query was fetching terms from ALL years (2025, 2026, etc.) without filtering.

**Fix:** Added filter `at.AcademicYear == currentAcademicYear` to the query.

See full fix details below.

---

## � Original Bug Report (November 5, 2025)

---

## 🐛 Bug Description

The endpoint returns **duplicate term numbers** - one set for 2025 and another for 2026. This causes the frontend to display 8 terms instead of 4.

---

## 📊 Actual Response (Wrong)

```json
{
  "studentId": 1,
  "subjectId": 1,
  "subjectName": "Algebra",
  "currentTermNumber": 4,
  "terms": [
    {
      "termId": 1,
      "termNumber": 1,
      "termName": "Term 1",
      "hasAccess": true,
      "subscriptionType": "FullYear",
      "startDate": "2025-01-01",
      "endDate": "2025-03-31",
      "isCurrentTerm": false
    },
    {
      "termId": 0,
      "termNumber": 1,        // ❌ DUPLICATE termNumber 1
      "termName": "Term 1",
      "hasAccess": false,
      "startDate": "2026-01-01", // Different year
      "endDate": "2026-03-31",
      "isCurrentTerm": false
    },
    {
      "termId": 2,
      "termNumber": 2,
      "hasAccess": true,
      "startDate": "2025-04-01"
    },
    {
      "termId": 0,
      "termNumber": 2,        // ❌ DUPLICATE termNumber 2
      "hasAccess": false,
      "startDate": "2026-04-01" // Different year
    },
    // ... same pattern for Terms 3 & 4
  ]
}
```

**Problem:** 8 terms returned instead of 4!

---

## ✅ Expected Response (Correct)

```json
{
  "studentId": 1,
  "subjectId": 1,
  "subjectName": "Algebra",
  "currentTermNumber": 4,
  "terms": [
    {
      "termId": 1,
      "termNumber": 1,
      "termName": "Term 1",
      "hasAccess": true,
      "subscriptionType": "FullYear",
      "startDate": "2025-01-01",
      "endDate": "2025-03-31",
      "isCurrentTerm": false
    },
    {
      "termId": 2,
      "termNumber": 2,
      "termName": "Term 2",
      "hasAccess": true,
      "subscriptionType": "FullYear",
      "startDate": "2025-04-01",
      "endDate": "2025-06-30",
      "isCurrentTerm": false
    },
    {
      "termId": 3,
      "termNumber": 3,
      "termName": "Term 3",
      "hasAccess": true,
      "subscriptionType": "FullYear",
      "startDate": "2025-07-01",
      "endDate": "2025-09-30",
      "isCurrentTerm": false
    },
    {
      "termId": 4,
      "termNumber": 4,
      "termName": "Term 4",
      "hasAccess": true,
      "subscriptionType": "FullYear",
      "startDate": "2025-10-01",
      "endDate": "2025-12-31",
      "isCurrentTerm": true
    }
  ]
}
```

**Result:** 4 terms only (current academic year)

---

## 🔍 Root Cause

The backend is iterating over **all academic terms** (including future years) instead of filtering by the **current academic year**.

### Current Logic (Wrong):

```csharp
// ❌ Gets ALL academic terms (2025, 2026, 2027, etc.)
var academicTerms = await context.AcademicTerms
    .Where(at => at.IsActive)
    .OrderBy(at => at.TermNumber)
    .ToListAsync();

// Then loops through ALL of them
foreach (var academicTerm in academicTerms)
{
    // Creates entry for EVERY year's Term 1, Term 2, etc.
    termAccessList.Add(...);
}
```

---

## ✅ Recommended Fix

### Option A: Filter by Current Academic Year (Recommended)

```csharp
// ✅ Get current academic year
var currentDate = DateTime.UtcNow;
var currentAcademicYear = await context.AcademicYears
    .FirstOrDefaultAsync(ay => 
        ay.StartDate <= currentDate && 
        ay.EndDate >= currentDate);

if (currentAcademicYear == null)
{
    return NotFound("No active academic year found");
}

// ✅ Get only terms for current year
var academicTerms = await context.AcademicTerms
    .Where(at => 
        at.IsActive && 
        at.AcademicYearId == currentAcademicYear.Id  // ✅ Filter by year
    )
    .OrderBy(at => at.TermNumber)
    .ToListAsync();

// Now loop through ONLY current year's terms (4 terms)
foreach (var academicTerm in academicTerms)
{
    // Process only current year terms
    var subjectTerm = subjectTerms.FirstOrDefault(st => 
        st.AcademicTermId == academicTerm.Id);
    
    termAccessList.Add(...);
}
```

---

### Option B: Use Subject's Year

```csharp
// Get subject with its year
var subject = await context.Subjects
    .Include(s => s.Year)
    .FirstOrDefaultAsync(s => s.Id == subjectId);

// Get terms for subject's year only
var academicTerms = await context.AcademicTerms
    .Where(at => 
        at.IsActive && 
        at.YearId == subject.YearId  // ✅ Match subject's year
    )
    .OrderBy(at => at.TermNumber)
    .ToListAsync();
```

---

### Option C: Group by Year and Return Current Year Only

```csharp
// Get all terms
var academicTerms = await context.AcademicTerms
    .Where(at => at.IsActive)
    .OrderBy(at => at.TermNumber)
    .ToListAsync();

// ✅ Group by year
var termsByYear = academicTerms
    .GroupBy(at => at.StartDate.Year)
    .ToDictionary(g => g.Key, g => g.ToList());

// ✅ Get current year only
var currentYear = DateTime.UtcNow.Year;
var currentYearTerms = termsByYear.ContainsKey(currentYear) 
    ? termsByYear[currentYear] 
    : new List<AcademicTerm>();

// Process only current year's terms
foreach (var academicTerm in currentYearTerms)
{
    termAccessList.Add(...);
}
```

---

## 🧪 Test Cases

### Test 1: Current Academic Year
**Setup:** Database has terms for 2025, 2026, 2027  
**Expected:** Return only 2025 terms (4 terms)  
**Current Result:** ❌ Returns 8 terms (2025 + 2026)

### Test 2: Subject Year Match
**Setup:** Subject is Year 7, Query Year 7 terms  
**Expected:** Return Year 7 terms only (4 terms)  
**Current Result:** ❌ Returns multiple years

### Test 3: Mid-Year Query
**Setup:** Current date is July 2025 (Term 3)  
**Expected:** Return 2025 terms with Term 3 as current  
**Current Result:** ❌ Returns 2025 + 2026 terms

---

## 📊 Database Schema Verification

Check if terms have proper year association:

```sql
-- Check AcademicTerms structure
SELECT 
    at.Id,
    at.TermNumber,
    at.Name,
    at.StartDate,
    at.EndDate,
    at.AcademicYearId,
    ay.Name AS YearName
FROM AcademicTerms at
LEFT JOIN AcademicYears ay ON at.AcademicYearId = ay.Id
WHERE at.IsActive = 1
ORDER BY at.StartDate, at.TermNumber;

-- Expected: Terms grouped by year
-- 2025: Terms 1-4
-- 2026: Terms 1-4
-- etc.
```

---

## 🎯 Impact Analysis

### Frontend Impact:

**Current Behavior:**
```typescript
// Frontend receives 8 terms
terms = [
  { termNumber: 1, hasAccess: true },  // 2025
  { termNumber: 1, hasAccess: false }, // 2026 - Duplicate!
  { termNumber: 2, hasAccess: true },  // 2025
  { termNumber: 2, hasAccess: false }, // 2026 - Duplicate!
  // ...
]

// UI shows 8 buttons instead of 4
```

**After Fix:**
```typescript
// Frontend receives 4 terms (correct)
terms = [
  { termNumber: 1, hasAccess: true },
  { termNumber: 2, hasAccess: true },
  { termNumber: 3, hasAccess: true },
  { termNumber: 4, hasAccess: true }
]

// UI shows 4 buttons (correct)
```

---

## 🔧 Recommended Implementation

**File:** `API/Services/Implementations/SubscriptionService.cs`

**Method:** `GetTermAccessStatusAsync`

```csharp
public async Task<TermAccessStatusDto> GetTermAccessStatusAsync(
    int studentId, 
    int subjectId)
{
    // 1. Get subject with year
    var subject = await context.Subjects
        .Include(s => s.Year)
        .FirstOrDefaultAsync(s => s.Id == subjectId);
    
    if (subject == null)
        return null;

    // 2. Get current academic year
    var currentDate = DateTime.UtcNow;
    var currentAcademicYear = await context.AcademicYears
        .FirstOrDefaultAsync(ay => 
            ay.StartDate <= currentDate && 
            ay.EndDate >= currentDate);

    // 3. Get active subscriptions
    var activeSubscriptions = await context.Subscriptions
        .Include(s => s.SubscriptionPlan)
        .Where(s => 
            s.StudentId == studentId &&
            s.PaymentStatus == "Active" &&
            s.EndDate >= currentDate &&
            (s.SubjectId == subjectId || s.YearId == subject.YearId))
        .ToListAsync();

    // 4. Get terms for CURRENT YEAR ONLY
    var academicTerms = await context.AcademicTerms
        .Where(at => 
            at.IsActive && 
            at.AcademicYearId == currentAcademicYear.Id  // ✅ KEY FIX
        )
        .OrderBy(at => at.TermNumber)
        .ToListAsync();

    // 5. Get subject-specific terms
    var subjectTerms = await context.Terms
        .Where(t => t.SubjectId == subjectId)
        .ToListAsync();

    // 6. Build response (now only 4 terms)
    var termAccessList = new List<TermAccessDto>();
    
    foreach (var academicTerm in academicTerms)
    {
        var subjectTerm = subjectTerms.FirstOrDefault(st => 
            st.AcademicTermId == academicTerm.Id);

        if (subjectTerm != null)
        {
            var (hasAccess, subscriptionType, planId, endDate) = 
                CheckTermAccessFixed(
                    activeSubscriptions, 
                    academicTerm.TermNumber, 
                    subjectTerm.Id, 
                    subject.YearId
                );

            termAccessList.Add(new TermAccessDto
            {
                TermId = subjectTerm.Id,
                TermNumber = academicTerm.TermNumber,
                TermName = academicTerm.Name,
                HasAccess = hasAccess,
                SubscriptionType = subscriptionType,
                StartDate = academicTerm.StartDate.ToString("yyyy-MM-dd"),
                EndDate = academicTerm.EndDate.ToString("yyyy-MM-dd"),
                IsCurrentTerm = IsCurrentTerm(academicTerm),
                LessonCount = context.Lessons.Count(l => l.TermId == subjectTerm.Id),
                WeekCount = context.Weeks.Count(w => w.TermId == subjectTerm.Id),
                SubscriptionPlanId = planId,
                SubscriptionEndDate = endDate
            });
        }
    }

    return new TermAccessStatusDto
    {
        StudentId = studentId,
        SubjectId = subjectId,
        SubjectName = subject.Name,
        CurrentTermNumber = GetCurrentTermNumber(academicTerms),
        Terms = termAccessList
    };
}
```

---

## ✅ Acceptance Criteria

After fix, verify:

- [ ] Response contains exactly 4 terms (1, 2, 3, 4)
- [ ] All terms are from current academic year
- [ ] No duplicate term numbers
- [ ] `hasAccess` is correct for each term
- [ ] `isCurrentTerm` is set correctly
- [ ] Subscription status is accurate
- [ ] Frontend displays 4 term buttons

---

## 🚀 Testing Command

```bash
# Test the endpoint
curl -X GET \
  'https://naplan2.runasp.net/api/StudentSubjects/student/1/subject/1/term-access' \
  -H 'Authorization: Bearer {token}'

# Expected response:
# - 4 terms only
# - termNumbers: 1, 2, 3, 4 (no duplicates)
# - All from 2025 (current year)
```

---

**Priority:** 🔴 HIGH  
**Impact:** UI Rendering Bug  
**Severity:** Medium  
**Status:** ⏳ Pending Fix  
**Assigned To:** Backend Team  
**Created:** November 5, 2025  
**Reporter:** Frontend Team
