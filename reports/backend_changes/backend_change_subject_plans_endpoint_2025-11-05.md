# 🔧 Backend Change Report

**Date:** November 5, 2025  
**Feature:** Subject-Level Subscription Plans Endpoint  
**Priority:** High  
**Status:** Implementation Required

---

## 1. Reason for Change

The frontend subscription flow in the Lessons component needs to display **all available plans for a subject** (single-term, multi-term, full-year) without filtering by a specific term. This allows students to choose the plan that best fits their needs, similar to the Courses page flow.

**Current Issue:**
- Existing endpoint `/api/Plans/subject/{subjectId}/term/{termNumber}/available` requires a term number
- This limits students to only see plans relevant to the current term
- Students should be able to purchase any plan (including multi-term or full-year) from any term page

**User Story:**
> As a student viewing lessons for Term 2, I should be able to purchase a Full Year plan or a Term 3+4 plan, not just Term 2 plans.

---

## 2. Required New Endpoint

### Endpoint Details:
* **URL:** `/api/Plans/subject/{subjectId}/available`
* **Method:** `GET`
* **Controller:** `PlansController`
* **Action:** `GetAvailablePlansForSubject`
* **Description:** Returns all active subscription plans for a subject, regardless of term

### Parameters:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subjectId` | `int` | Yes | The ID of the subject |

---

## 3. Suggested Backend Implementation

### C# Controller Action

```csharp
/// <summary>
/// Get all available subscription plans for a subject (no term filter)
/// </summary>
/// <param name="subjectId">The subject ID</param>
/// <returns>List of available plans</returns>
[HttpGet("subject/{subjectId}/available")]
public async Task<IActionResult> GetAvailablePlansForSubject(int subjectId)
{
    try
    {
        // Get subject info
        var subject = await _context.Subjects
            .FirstOrDefaultAsync(s => s.Id == subjectId);
        
        if (subject == null)
        {
            return NotFound(new { message = "Subject not found" });
        }

        // Get all active plans for this subject
        var plans = await _context.Plans
            .Where(p => p.SubjectId == subjectId && p.IsActive)
            .OrderBy(p => p.DisplayOrder)  // Or order by price/popularity
            .Select(p => new
            {
                planId = p.Id,
                planName = p.Name,
                description = p.Description,
                price = p.Price,
                originalPrice = p.OriginalPrice,
                discountPercentage = p.DiscountPercentage,
                saveAmount = p.SaveAmount,
                duration = p.Duration,
                durationInMonths = p.DurationInMonths,
                features = p.Features,  // JSON array or separate table
                isRecommended = p.IsRecommended,
                termsIncluded = p.TermsIncluded,  // e.g., "1,2,3,4" or "3,4"
                accessLevel = p.AccessLevel  // e.g., "SingleTerm", "MultiTerm", "FullYear"
            })
            .ToListAsync();

        return Ok(new
        {
            subjectId = subject.Id,
            subjectName = subject.Name,
            subjectDescription = subject.Description,
            availablePlans = plans
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching plans for subject {SubjectId}", subjectId);
        return StatusCode(500, new { message = "Internal server error" });
    }
}
```

### Key Implementation Notes:

1. **No Term Filtering:** This endpoint should return ALL plans for the subject
2. **Plan Types:** Should include:
   - Single-term plans (e.g., "Term 1", "Term 2")
   - Multi-term plans (e.g., "Term 3 & 4")
   - Full-year plans (e.g., "Full Year Access")
3. **Sorting:** Order plans by `DisplayOrder`, price, or popularity
4. **Recommended Flag:** Mark the most popular/best value plan as `isRecommended`

---

## 4. Database Impact

### Required Fields in `Plans` Table:

Ensure the following columns exist:

```sql
ALTER TABLE Plans ADD COLUMN IF NOT EXISTS DisplayOrder INT DEFAULT 0;
ALTER TABLE Plans ADD COLUMN IF NOT EXISTS IsRecommended BIT DEFAULT 0;
ALTER TABLE Plans ADD COLUMN IF NOT EXISTS TermsIncluded NVARCHAR(50);
ALTER TABLE Plans ADD COLUMN IF NOT EXISTS AccessLevel NVARCHAR(50);
```

### Field Descriptions:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `DisplayOrder` | `int` | Order to display plans | `1, 2, 3` |
| `IsRecommended` | `bool` | Mark recommended plan | `true` |
| `TermsIncluded` | `string` | Comma-separated term numbers | `"3,4"` or `"1,2,3,4"` |
| `AccessLevel` | `string` | Plan type | `"SingleTerm"`, `"MultiTerm"`, `"FullYear"` |

---

## 5. Files to Modify or Create

### Backend Files:
- `Controllers/PlansController.cs` - Add new endpoint
- `Models/Plan.cs` - Ensure model has all required fields
- `DTOs/PlanDto.cs` - Create DTO if needed
- `Migrations/2025xxxx_AddPlanDisplayFields.cs` - Add new columns

### Frontend Files (Already Modified):
- `src/app/core/services/subscription-plans.service.ts` ✅
- `src/app/features/lessons/lessons.component.ts` ✅
- `src/app/features/lessons/lessons.component.html` ✅

---

## 6. Request and Response Examples

### Request Example:

```http
GET /api/Plans/subject/1/available
Authorization: Bearer {token}
```

### Response Example:

```json
{
  "subjectId": 1,
  "subjectName": "Algebra",
  "subjectDescription": "Year 7 Algebra",
  "availablePlans": [
    {
      "planId": 1,
      "planName": "Algebra Year 7 - Term 1",
      "description": "Complete access to Term 1 content",
      "price": 29.99,
      "originalPrice": null,
      "discountPercentage": null,
      "saveAmount": null,
      "duration": "3 months",
      "durationInMonths": 3,
      "features": [
        "10+ Lessons",
        "12 Weeks of Content",
        "Downloadable Resources",
        "Progress Tracking",
        "Certificate of Completion"
      ],
      "isRecommended": false,
      "termsIncluded": "1",
      "accessLevel": "SingleTerm"
    },
    {
      "planId": 2,
      "planName": "Algebra Year 7 - Term 3 & 4",
      "description": "Access to Terms 3 and 4 (Second Semester) - Save 15%",
      "price": 54.99,
      "originalPrice": 63.98,
      "discountPercentage": 14,
      "saveAmount": 8.99,
      "duration": "6 months",
      "durationInMonths": 6,
      "features": [
        "20+ Lessons",
        "24+ Weeks of Content",
        "Downloadable Resources",
        "Progress Tracking",
        "Certificate of Completion"
      ],
      "isRecommended": true,
      "termsIncluded": "3,4",
      "accessLevel": "MultiTerm"
    },
    {
      "planId": 3,
      "planName": "Algebra Year 7 - Full Year",
      "description": "Complete year access to all Algebra content - Save 25%",
      "price": 89.99,
      "originalPrice": 119.99,
      "discountPercentage": 25,
      "saveAmount": 30.00,
      "duration": "12 months",
      "durationInMonths": 12,
      "features": [
        "40+ Lessons",
        "Full Year Access",
        "All 4 Terms Included",
        "Downloadable Resources",
        "Progress Tracking",
        "Certificate of Completion"
      ],
      "isRecommended": false,
      "termsIncluded": "1,2,3,4",
      "accessLevel": "FullYear"
    }
  ]
}
```

### Error Response (404):

```json
{
  "message": "Subject not found"
}
```

### Error Response (500):

```json
{
  "message": "Internal server error"
}
```

---

## 7. Testing Requirements

### Unit Tests:
1. Test with valid `subjectId` - should return plans
2. Test with invalid `subjectId` - should return 404
3. Test with subject having no plans - should return empty array
4. Test plan ordering (by `DisplayOrder` or price)
5. Test `isRecommended` flag is correctly set

### Integration Tests:
1. Verify response format matches contract
2. Verify all plan types are returned (single, multi, full-year)
3. Verify features array is populated
4. Verify price calculations are correct

### Manual Testing:
```bash
# Test endpoint
curl -X GET "https://naplan2.runasp.net/api/Plans/subject/1/available" \
  -H "Authorization: Bearer {token}"

# Should return all plans for Algebra (subject 1)
```

---

## 8. Frontend Integration Status

✅ **Frontend is ready and waiting for this endpoint**

The frontend has been updated to:
- Call the new endpoint: `GET /api/Plans/subject/{subjectId}/available`
- Display all plans in a responsive modal
- Handle plan selection and cart addition
- Show recommended plans with special styling

**Frontend Service Method:**
```typescript
getAvailablePlansForSubject(subjectId: number): Observable<any> {
  const url = `${this.apiUrl}/subject/${subjectId}/available`;
  return this.http.get<any>(url);
}
```

---

## 9. Migration Plan

### Phase 1: Database Update
1. Add new columns to `Plans` table
2. Populate `DisplayOrder`, `IsRecommended`, `TermsIncluded`, `AccessLevel`
3. Seed data with all plan types for each subject

### Phase 2: Backend Implementation
1. Create new controller action
2. Add validation and error handling
3. Write unit tests

### Phase 3: Testing & Deployment
1. Test endpoint in development
2. Verify response format
3. Deploy to staging
4. Frontend team validates integration
5. Deploy to production

---

## 10. Timeline Estimate

| Task | Estimated Time | Status |
|------|----------------|--------|
| Database Migration | 1 hour | Pending |
| Controller Implementation | 2 hours | Pending |
| Unit Tests | 1 hour | Pending |
| Integration Testing | 1 hour | Pending |
| Code Review | 1 hour | Pending |
| **Total** | **6 hours** | **Pending** |

**Requested Completion:** Within 2-3 business days

---

## 11. Backward Compatibility

**Impact on Existing Endpoints:** None

The existing endpoint `/api/Plans/subject/{subjectId}/term/{termNumber}/available` should remain unchanged for backward compatibility.

**New Endpoint Only:** This is an additional endpoint, not a replacement.

---

## 12. Success Criteria

✅ Endpoint returns all plans for a subject  
✅ Response format matches specified contract  
✅ Frontend can successfully fetch and display plans  
✅ Students can purchase any plan from any term page  
✅ Recommended plans are correctly flagged  
✅ All tests pass  
✅ No breaking changes to existing endpoints  

---

## 13. Additional Notes

- This change improves UX by giving students more flexibility in plan selection
- Aligns Lessons page behavior with Courses page behavior
- Removes artificial restrictions on plan availability per term
- May increase conversion rates by showing all options upfront

---

**Report Generated:** November 5, 2025  
**Report ID:** `backend_change_subject_plans_endpoint_2025-11-05`  
**Priority:** High - Blocking improved subscription flow
