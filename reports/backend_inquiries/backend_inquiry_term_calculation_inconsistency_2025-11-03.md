# ❓ Backend Inquiry Report - Term Calculation Inconsistency

**Date:** November 3, 2025  
**Issue Type:** Business Logic / Data Model Design  
**Affected Endpoint:** `/api/StudentSubjects/student/{studentId}/current-term-week`  
**Priority:** **High** - Affects core business logic

---

## 1. Inquiry Topic

**Inconsistent term calculation across subjects** - Current term should be uniform across all subjects based on calendar date, but backend returns different term IDs for different subjects.

---

## 2. Problem Description

### Current Behavior:
The endpoint `/api/StudentSubjects/student/{studentId}/current-term-week` returns different `currentTermId` values for different subjects, even though they should all be in the same term based on the current date.

### Examples from Console Logs:

#### Algebra (SubjectId: 1):
```json
{
  "hasAccess": true,
  "currentTerm": "Term 3",
  "currentTermNumber": 3,
  "currentTermId": 3,
  "currentWeek": 1,
  "subject": "Algebra"
}
```

#### Reading Comprehension (SubjectId: 3):
```json
{
  "hasAccess": true,
  "currentTerm": "Term 3",
  "currentTermNumber": 3,
  "currentTermId": 11,
  "currentWeek": 1,
  "subject": "Reading Comprehension"
}
```

#### Grammar (SubjectId: 5):
```json
{
  "hasAccess": false,
  "currentTerm": null,
  "currentTermId": null
}
```
*(Note: termId 8 was used in navigation, suggesting there's data but no access)*

### The Issue:
- **currentTermNumber** is correctly `3` for all subjects (when there's access)
- **currentTermId** varies: `3`, `11`, `8`, etc.
- This causes **navigation issues** when switching between subjects
- Frontend tries to load lessons for termId `11` in one subject, then `3` in another

---

## 3. Expected Behavior

### Business Logic:
Terms should be **global/shared across all subjects** and calculated based on **calendar dates**, not per-subject.

**Example Structure:**
```
Academic Year 2025:
├── Term 1: Jan 1 - Mar 31 (id=1, applies to ALL subjects)
├── Term 2: Apr 1 - Jun 30 (id=2, applies to ALL subjects)
├── Term 3: Jul 1 - Sep 30 (id=3, applies to ALL subjects)
└── Term 4: Oct 1 - Dec 31 (id=4, applies to ALL subjects)
```

### Current Date Logic:
```
Today = November 3, 2025
→ Current Term = Term 3 (for ALL subjects)
→ currentTermId = 3 (same for ALL subjects)
```

---

## 4. Root Cause Analysis Needed

### Questions for Backend Team:

1. **Database Design:**
   - Are Terms stored per-subject or globally?
   - Schema: `Terms` table structure?
   - Are there foreign keys: `SubjectId → TermId`?

2. **Term Calculation Logic:**
   - How is `currentTermId` calculated?
   - Is it based on calendar dates or subject-specific data?
   - Why do different subjects return different term IDs for the same term number?

3. **Data Seeding:**
   - Are terms seeded separately for each subject?
   - Should we consolidate terms into a global table?

4. **Business Requirements:**
   - Should all subjects follow the same academic calendar?
   - Or are subjects allowed to have independent term schedules?

---

## 5. Impact on Frontend

### Current Issues:

1. **Navigation Confusion:**
   - User navigates from Algebra (termId=3) to Reading (termId=11)
   - Frontend tries to load lessons for termId=11
   - Results in "No lessons found" or incorrect data

2. **Term Selector Mismatch:**
   - Term selector shows Term 3 as "current" in one subject
   - But uses termId=11 instead of termId=3
   - Causes API calls to fail or return empty results

3. **User Experience:**
   - Inconsistent behavior when switching subjects
   - Cannot reliably navigate between terms
   - Access control becomes unpredictable

### Frontend Logs Evidence:
```javascript
// Algebra - works fine
termId: 3, lessons found

// Reading Comprehension - termId mismatch
termId: 11, "No lessons found for term: 11"

// Grammar - no access but termId exists
termId: 8, "No lessons found for term: 8"
```

---

## 6. Proposed Solutions

### Option A: **Global Terms (Recommended)**
Make terms global across all subjects:

**Database Changes:**
```sql
-- Single Terms table (global)
CREATE TABLE Terms (
    Id INT PRIMARY KEY,
    TermNumber INT,
    Name VARCHAR(50),
    StartDate DATE,
    EndDate DATE
);

-- Remove SubjectId from Terms
-- Terms are now shared across all subjects
```

**Benefits:**
- ✅ Consistent term IDs across subjects
- ✅ Single source of truth for academic calendar
- ✅ Simpler logic and maintenance
- ✅ Easier to manage term dates

---

### Option B: **Normalized Term Numbers**
Keep per-subject terms but add global term number mapping:

**Database Changes:**
```sql
-- Add AcademicTermNumber to Terms table
ALTER TABLE Terms ADD COLUMN AcademicTermNumber INT;

-- Map all "Term 3" entries to AcademicTermNumber=3
UPDATE Terms SET AcademicTermNumber = TermNumber;
```

**API Changes:**
```csharp
// Return both IDs
public class CurrentTermWeekDto {
    public int CurrentTermId { get; set; }      // Subject-specific: 3, 11, 8, etc.
    public int GlobalTermNumber { get; set; }    // Global: 1, 2, 3, 4
    public DateTime TermStartDate { get; set; }
    public DateTime TermEndDate { get; set; }
}
```

**Benefits:**
- ✅ Backward compatible
- ✅ Maintains existing data structure
- ⚠️ More complex logic

---

### Option C: **Current Date-Based Calculation**
Calculate current term based on system date (not data):

```csharp
public int GetCurrentTermNumber(DateTime date) {
    var startOfYear = new DateTime(date.Year, 1, 1);
    var dayOfYear = (date - startOfYear).Days;
    
    // Each term = 90 days approximately
    if (dayOfYear < 90) return 1;
    if (dayOfYear < 180) return 2;
    if (dayOfYear < 270) return 3;
    return 4;
}
```

**Benefits:**
- ✅ No database changes needed
- ✅ Always accurate based on date
- ⚠️ Requires configuration for term dates

---

## 7. Immediate Workaround (Frontend)

Until backend is fixed, frontend can:

```typescript
// Use termNumber instead of termId for navigation
navigateToTerm(termNumber: number, subjectId: number) {
  // Fetch terms for subject
  // Find term with matching termNumber
  // Use that term's ID for API calls
}
```

**Limitation:** Requires extra API call per navigation.

---

## 8. Request for Backend Team

Please provide:

1. ✅ **Clarification** on intended term design:
   - Should terms be global or per-subject?
   - What's the business requirement?

2. ✅ **Database Schema** for Terms table:
   ```sql
   -- Show current structure
   SHOW CREATE TABLE Terms;
   ```

3. ✅ **Migration Plan** if changes are needed:
   - How to consolidate terms?
   - Data migration strategy?

4. ✅ **Updated API Response** structure (if changed)

5. ✅ **Timeline** for implementation

---

## 9. Testing Scenarios

Once fixed, test:

1. **Same Term Across Subjects:**
   - Student accesses multiple subjects
   - All should show same currentTermId for same termNumber

2. **Date-Based Term Calculation:**
   - Change system date
   - Verify all subjects reflect new current term

3. **Term Navigation:**
   - Navigate between terms in one subject
   - Switch to another subject
   - Verify term context is maintained

---

## Contact Information

**Frontend Developer:** AI Assistant  
**Date Reported:** November 3, 2025  
**Priority:** High  
**Blocking:** Term navigation feature across multiple subjects
