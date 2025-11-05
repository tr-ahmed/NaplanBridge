# ❓ Backend Inquiry Report: Term-Based Subscription Plans Endpoint

**Date:** November 5, 2025  
**Feature:** Add to Cart for Locked Terms  
**Status:** 🔴 **MISSING ENDPOINT**  
**Priority:** 🔴 HIGH (Production Blocker)

---

## 1. Inquiry Topic

Request a new endpoint to fetch available subscription plans for a specific subject and term.

---

## 2. Current Situation

### Problem:
The frontend lessons page shows locked terms with "Add to Cart" buttons, but we **cannot determine which subscription plans are available** for that specific term without an appropriate endpoint.

### Current Flow (Incomplete):
```
1. Student sees Term 4 is locked
2. Clicks "Add to Cart"
3. ❌ Frontend doesn't know:
   - Which plans cover Term 4?
   - What are the prices?
   - Which plan IDs to add to cart?
4. ❌ Currently redirects to pricing page (not ideal)
```

### Desired Flow (Production):
```
1. Student sees Term 4 is locked
2. Clicks "Add to Cart"
3. ✅ Frontend fetches available plans for Term 4
4. ✅ Shows modal with plan options and prices
5. ✅ Student selects a plan
6. ✅ Frontend calls /api/Cart/items with subscriptionPlanId
7. ✅ Item added to cart
8. ✅ Success message shown
```

---

## 3. Required Endpoint

### Proposed Endpoint:

```
GET /api/SubscriptionPlans/subject/{subjectId}/term/{termNumber}/available-plans
```

**or**

```
GET /api/SubscriptionPlans/for-term?subjectId={subjectId}&termNumber={termNumber}
```

---

## 4. Expected Response Structure

```json
{
  "subjectId": 1,
  "subjectName": "Algebra Year 7",
  "termNumber": 4,
  "termName": "Term 4",
  "availablePlans": [
    {
      "planId": 101,
      "planName": "Single Term - Term 4 Only",
      "planType": "SingleTerm",
      "description": "Access to Term 4 lessons only",
      "price": 29.99,
      "currency": "AUD",
      "duration": "3 months",
      "features": [
        "27 Lessons",
        "12 Weeks of Content",
        "Downloadable Resources",
        "Progress Tracking"
      ],
      "isActive": true,
      "isRecommended": false,
      "discountPercentage": 0,
      "originalPrice": null
    },
    {
      "planId": 102,
      "planName": "Multi-Term Package (Terms 3 & 4)",
      "planType": "MultiTerm",
      "description": "Access to Terms 3 and 4",
      "price": 49.99,
      "currency": "AUD",
      "duration": "6 months",
      "features": [
        "50+ Lessons",
        "24 Weeks of Content",
        "Save 15%",
        "All resources included"
      ],
      "isActive": true,
      "isRecommended": true,
      "discountPercentage": 15,
      "originalPrice": 59.98
    },
    {
      "planId": 103,
      "planName": "Full Year Access",
      "planType": "FullYear",
      "description": "Access to all 4 terms for the year",
      "price": 89.99,
      "currency": "AUD",
      "duration": "12 months",
      "features": [
        "100+ Lessons",
        "48 Weeks of Content",
        "Save 25%",
        "Best Value",
        "All resources included"
      ],
      "isActive": true,
      "isRecommended": false,
      "discountPercentage": 25,
      "originalPrice": 119.96
    }
  ]
}
```

---

## 5. Business Logic Requirements

### Filtering Logic:

The endpoint should return plans that:

1. ✅ **Include the requested term**
   - SingleTerm plan for that specific term
   - MultiTerm plans that include that term
   - FullYear plans for that year
   - SubjectAnnual plans for that subject

2. ✅ **Are currently active**
   - `IsActive = true`

3. ✅ **Match the subject**
   - Plans associated with the requested `subjectId`

4. ✅ **Match the year** (if applicable)
   - FullYear plans should match the subject's year

5. ✅ **Sort by recommendation**
   - Recommended plans first
   - Then by price (ascending)

### Example Scenarios:

#### Scenario 1: Student wants Term 4
**Request:** `GET /api/SubscriptionPlans/subject/1/term/4/available-plans`

**Should Return:**
- Single Term 4 plan ($29.99)
- Multi-Term 3&4 plan ($49.99) ← Recommended
- Full Year plan ($89.99)

#### Scenario 2: Student wants Term 1
**Request:** `GET /api/SubscriptionPlans/subject/1/term/1/available-plans`

**Should Return:**
- Single Term 1 plan ($29.99)
- Multi-Term 1&2 plan ($49.99) ← Recommended
- Full Year plan ($89.99)

---

## 6. Alternative: Enhanced Existing Endpoint

If creating a new endpoint is not preferred, consider **enhancing** the existing:

```
GET /api/SubscriptionPlans
```

**Add Query Parameters:**
```
GET /api/SubscriptionPlans?subjectId={id}&termNumber={num}&includeApplicable=true
```

This would return all plans applicable to that subject/term combination.

---

## 7. Database Schema Assumptions

Based on typical structure, we assume:

```sql
SubscriptionPlans Table:
- Id (PK)
- Name
- PlanType (SingleTerm, MultiTerm, FullYear, SubjectAnnual)
- Price
- SubjectId (FK, nullable for FullYear)
- YearId (FK, for FullYear)
- TermId (FK, for SingleTerm)
- IncludedTermIds (JSON/CSV, for MultiTerm)
- IsActive
- Description
- Features (JSON)
```

---

## 8. Frontend Integration Plan

Once endpoint is available:

### Step 1: Create Service Method
```typescript
// courses.service.ts
getAvailablePlansForTerm(
  subjectId: number, 
  termNumber: number
): Observable<TermPlansResponse> {
  return this.http.get<TermPlansResponse>(
    `/api/SubscriptionPlans/subject/${subjectId}/term/${termNumber}/available-plans`
  );
}
```

### Step 2: Update Component
```typescript
// lessons.component.ts
addTermToCart(): void {
  const term = this.selectedTerm();
  const subjectId = this.currentSubjectId();
  
  // Fetch available plans
  this.coursesService.getAvailablePlansForTerm(subjectId, term.termNumber)
    .subscribe(response => {
      // Show modal with plans
      this.showPlanSelectionModal(response.availablePlans);
    });
}

selectPlan(planId: number): void {
  const studentId = this.authService.getCurrentUser()?.studentId;
  
  // Add to cart
  this.cartService.addToCart({
    subscriptionPlanId: planId,
    studentId: studentId,
    quantity: 1
  }).subscribe({
    next: () => {
      alert('Plan added to cart!');
      // Update cart count
    },
    error: (err) => {
      alert('Failed to add to cart');
    }
  });
}
```

### Step 3: Create Plan Selection Modal
```html
<!-- plan-selection-modal.component.html -->
<div class="modal">
  <h2>Choose Your Plan</h2>
  
  @for (plan of plans; track plan.planId) {
    <div class="plan-card" [class.recommended]="plan.isRecommended">
      <h3>{{ plan.planName }}</h3>
      <p class="price">${{ plan.price }}</p>
      
      @if (plan.discountPercentage > 0) {
        <span class="discount">Save {{ plan.discountPercentage }}%</span>
      }
      
      <ul>
        @for (feature of plan.features; track feature) {
          <li>{{ feature }}</li>
        }
      </ul>
      
      <button (click)="selectPlan(plan.planId)">
        Add to Cart
      </button>
    </div>
  }
</div>
```

---

## 9. Testing Requirements

### Test Cases:

1. ✅ **Single term request**
   - Returns plans including that term
   - Prices are correct
   - Active plans only

2. ✅ **Multiple applicable plans**
   - Returns all matching plans
   - Sorted by recommendation

3. ✅ **No plans available**
   - Returns empty array
   - Provides helpful message

4. ✅ **Invalid subject/term**
   - Returns 404 with error message

5. ✅ **Inactive plans**
   - Should not be included

---

## 10. API Contract Example

### Request:
```http
GET /api/SubscriptionPlans/subject/1/term/4/available-plans
Authorization: Bearer {token}
```

### Success Response (200):
```json
{
  "subjectId": 1,
  "subjectName": "Algebra Year 7",
  "termNumber": 4,
  "termName": "Term 4",
  "availablePlans": [
    {
      "planId": 101,
      "planName": "Single Term - Term 4",
      "planType": "SingleTerm",
      "price": 29.99,
      "isRecommended": false
    },
    {
      "planId": 102,
      "planName": "Full Year Access",
      "planType": "FullYear",
      "price": 89.99,
      "isRecommended": true
    }
  ]
}
```

### No Plans Available (200):
```json
{
  "subjectId": 1,
  "termNumber": 4,
  "availablePlans": [],
  "message": "No subscription plans available for this term"
}
```

### Error Response (404):
```json
{
  "error": "Subject or term not found",
  "statusCode": 404
}
```

---

## 11. Performance Considerations

- **Caching:** Consider caching plan data (5-10 minutes)
- **Database Query:** Should be optimized with proper indexes
- **Response Size:** Keep under 50KB for fast loading

---

## 12. Security Considerations

- ✅ Require authentication (JWT token)
- ✅ Validate student has access to view plans
- ✅ Don't expose inactive/hidden plans
- ✅ Validate subject/term exists

---

## 13. Backward Compatibility

This is a **new endpoint**, so no breaking changes expected.

Existing `/api/SubscriptionPlans` endpoint remains unchanged.

---

## 14. Documentation Requirements

Please provide:
- [ ] Swagger documentation for new endpoint
- [ ] Example requests/responses
- [ ] Error codes and meanings
- [ ] Business logic explanation

---

## 15. Timeline

**Priority:** HIGH (Production Blocker)

**Estimated Frontend Work:** 2-3 days after endpoint is available
- Day 1: Service integration + modal component
- Day 2: Testing + UI polish
- Day 3: Bug fixes + production deployment

---

## 16. Questions for Backend Team

1. **Endpoint URL:** What's the preferred naming convention?
2. **Response Format:** Is the proposed structure acceptable?
3. **Filtering Logic:** Should we exclude sold-out plans?
4. **Pricing:** Should we calculate discounts on backend or frontend?
5. **Caching:** What cache strategy do you recommend?
6. **Rate Limiting:** Any concerns with frequent calls to this endpoint?

---

**Requested By:** Frontend Team  
**Date:** November 5, 2025  
**Status:** ⏳ Awaiting Backend Implementation  
**Tracking:** Backend Ticket #TBD
