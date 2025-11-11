# ❓ Backend Inquiry Report

**Date:** November 5, 2025  
**Reporter:** Frontend Development Team  
**Priority:** High  
**Status:** Pending Backend Team Response

---

## 1. Inquiry Topic

**Missing Subscription Plans for Terms 2, 3, and 4**

The endpoint `/api/Plans/subject/{subjectId}/term/{termNumber}/available` returns empty plans array for all terms except Term 1.

---

## 2. Reason for Inquiry

During frontend testing of the subscription system, we discovered that:

- **Term 1:** Returns plans successfully ✅
- **Term 2:** Returns `availablePlans: []` ❌
- **Term 3:** Returns `availablePlans: []` ❌
- **Term 4:** Returns `availablePlans: []` ❌

**Actual API Response for Term 3:**
```json
{
  "subjectId": 1,
  "subjectName": "Algebra",
  "termNumber": 3,
  "termName": "Term 3",
  "availablePlans": []
}
```

**Expected Behavior:**
All terms should return available subscription plans, similar to Term 1.

---

## 3. Requested Details from Backend Team

### 3.1 Data Availability
- Are subscription plans **seeded** in the database for Terms 2, 3, and 4?
- Is there a database constraint limiting plans to Term 1 only?
- Should the plans be **term-specific** or **shared across all terms**?

### 3.2 Endpoint Logic
- Does the endpoint `/api/Plans/subject/{subjectId}/term/{termNumber}/available` filter plans by `termNumber`?
- Is there a missing JOIN or WHERE clause causing empty results for terms > 1?
- Should the endpoint return **all available plans** regardless of term, or **term-specific plans**?

### 3.3 Business Logic Clarification
Please clarify the intended behavior:

**Option A: Term-Specific Plans**
- Each term has its own set of plans (e.g., "Term 2 - Single Term", "Term 2 - Full Year")
- Database should have separate plan records for each term

**Option B: Shared Plans Across Terms**
- Same plans apply to all terms
- Endpoint should return plans regardless of `termNumber` parameter
- The `termNumber` is only used for context/display purposes

---

## 4. Current Frontend Workaround

To unblock development, we implemented a **temporary fallback** in the frontend:

```typescript
// If no plans found for the requested term, fallback to term 1
if (response.availablePlans.length === 0) {
  this.plansService.getAvailablePlansForTerm(subjectId, 1)
    .subscribe(fallbackResponse => {
      // Use term 1 plans but display correct term info
      this.showPlansModal.set(true);
    });
}
```

**⚠️ This is a temporary solution and should be removed once backend is fixed.**

---

## 5. Impact on Frontend

### Current Issues:
- Students cannot purchase subscriptions for Terms 2, 3, or 4 without the fallback
- Inconsistent user experience across different terms
- Potential confusion if Term 1 plans have different pricing than other terms

### Affected Components:
- `LessonsComponent` - Subscription purchase flow
- `PlansService` - API integration
- `CoursesComponent` - Term selection and access control

---

## 6. Proposed Backend Solutions

### Solution A: Seed Plans for All Terms
```sql
-- Ensure plans exist for all terms
INSERT INTO Plans (SubjectId, TermNumber, PlanName, Price, ...) 
VALUES 
  (1, 2, 'Term 2 - Single Term', 29.99, ...),
  (1, 3, 'Term 3 - Single Term', 29.99, ...),
  (1, 4, 'Term 4 - Single Term', 29.99, ...);
```

### Solution B: Modify Endpoint to Return All Plans
```csharp
// PlansController.cs
[HttpGet("subject/{subjectId}/term/{termNumber}/available")]
public async Task<IActionResult> GetAvailablePlansForTerm(int subjectId, int termNumber)
{
    // Option 1: Return all plans regardless of term
    var plans = await _context.Plans
        .Where(p => p.SubjectId == subjectId && p.IsActive)
        .ToListAsync();
    
    // OR Option 2: Filter by term if plans are term-specific
    var plans = await _context.Plans
        .Where(p => p.SubjectId == subjectId && p.TermNumber == termNumber && p.IsActive)
        .ToListAsync();
    
    return Ok(new {
        subjectId,
        termNumber,
        availablePlans = plans
    });
}
```

---

## 7. Testing Requirements

After backend fix, please verify:

1. **Endpoint returns plans for all terms:**
   - `GET /api/Plans/subject/1/term/1/available` ✅
   - `GET /api/Plans/subject/1/term/2/available` ✅
   - `GET /api/Plans/subject/1/term/3/available` ✅
   - `GET /api/Plans/subject/1/term/4/available` ✅

2. **Consistent plan structure** across all terms

3. **Database seeding** includes plans for all terms

4. **Response format** matches Swagger documentation

---

## 8. Requested Timeline

- **Urgency:** High - Blocking subscription feature for 75% of terms
- **Requested Response:** Within 2 business days
- **Implementation:** Within 1 week

---

## 9. Contact Information

**Frontend Team:**
- Implementation: `LessonsComponent` and `PlansService`
- Temporary workaround location: `lessons.component.ts:760-780`

**Backend Team:**
- Required action: Fix endpoint or seed database
- Files likely affected: 
  - `Controllers/PlansController.cs`
  - `Migrations/SeedData.cs`
  - `Models/Plan.cs`

---

## 10. Additional Notes

- This issue was discovered during Term 2, 3, and 4 testing
- Frontend logs show consistent empty array responses
- No error messages in backend logs (successful 200 responses)
- Issue appears to be **data-related** rather than code logic error

---

**Next Steps:**
1. Backend team reviews database and endpoint logic
2. Backend team provides clarification on intended behavior
3. Backend team implements fix
4. Frontend team removes workaround and retests
5. Update Swagger documentation if behavior changes

---

**Report Generated:** November 5, 2025  
**Report ID:** `backend_inquiry_plans_missing_terms_2025-11-05`
