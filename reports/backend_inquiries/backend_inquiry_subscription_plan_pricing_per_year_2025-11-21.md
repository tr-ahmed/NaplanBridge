# ❓ Backend Inquiry Report

**Date:** 2025-11-21  
**Topic:** Subscription Plan Pricing Structure per Year and Discount Management  
**Submitted By:** Frontend Team  
**Priority:** High

---

## 1. Inquiry Topic

Clarify the pricing structure for **Subscription Plans** and how to handle **different prices** and **discount percentages** based on **Year Level** (Year 7 - Year 12).

---

## 2. Current Situation

### Current Implementation:
The `CreateSubscriptionPlanDto` and `SubscriptionPlan` model currently has:
```csharp
public class CreateSubscriptionPlanDto 
{
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal Price { get; set; }           // ❌ Single price for all years
    public PlanType PlanType { get; set; }
    public int? SubjectId { get; set; }
    public int? TermId { get; set; }
    public int? YearId { get; set; }             // Only used in FullYear plans
    public string? IncludedTermIds { get; set; }
    public bool IsActive { get; set; }
}
```

### Problem Identified:
1. **Single Term Plan** (planType = 1):
   - Has: `SubjectId` + `TermId`
   - Missing: `YearId` (not linked to specific year)
   - Issue: **Price is the same for all years** (Year 7 vs Year 12)

2. **Multi Term Plan** (planType = 2):
   - Has: `SubjectId` + `IncludedTermIds`
   - Missing: `YearId`
   - Issue: **Cannot set different prices** for Year 7 vs Year 10

3. **Subject Annual Plan** (planType = 4):
   - Has: `SubjectId`
   - Missing: `YearId`
   - Issue: **Same price for all years**

4. **Discount Management:**
   - No field for discount percentage
   - No way to apply year-based discounts

---

## 3. Business Requirement

The admin needs to:

1. **Set different prices for different year levels:**
   ```
   Example:
   - Mathematics Term 1 (Year 7) = $49.99
   - Mathematics Term 1 (Year 8) = $59.99
   - Mathematics Term 1 (Year 12) = $79.99
   ```

2. **Apply discount percentages:**
   ```
   Example:
   - Mathematics Term 1 (Year 7) = $49.99 with 10% discount
   - Multi Term Plan (Year 9) = $89.99 with 15% discount
   ```

3. **Flexible pricing structure:**
   - Base price per year level
   - Optional discount per plan
   - Final price calculation

---

## 4. Requested Details from Backend Team

### Question 1: Year Association for All Plan Types
**Current behavior:**
- `YearId` is only used in **Full Year** plans (planType = 3)
- Other plan types (Single Term, Multi Term, Subject Annual) don't have year association

**Question:**
Should **all plan types** include `YearId` to link them to specific year levels?

**Suggested approach:**
```csharp
public class CreateSubscriptionPlanDto 
{
    // ... existing fields
    public int YearId { get; set; }  // ✅ Required for ALL plan types
}
```

**Impact:**
- Single Term: Mathematics Term 1 **Year 7**
- Multi Term: Mathematics Terms 1&2 **Year 8**
- Subject Annual: Mathematics Full Year **Year 9**

---

### Question 2: Pricing Structure Options

**Option A: Simple Price per Plan (Current)**
```csharp
public decimal Price { get; set; }  // One price, no year differentiation
```
- ❌ Same price for all years
- ❌ No discount support

**Option B: Year-Based Pricing Table**
```csharp
public class SubscriptionPlan 
{
    // ... existing fields
    public List<PlanPricing> YearPricing { get; set; }
}

public class PlanPricing 
{
    public int YearId { get; set; }
    public decimal BasePrice { get; set; }
    public decimal? DiscountPercentage { get; set; }
    public decimal FinalPrice => BasePrice * (1 - (DiscountPercentage ?? 0) / 100);
}
```
- ✅ Different prices per year
- ✅ Discount support
- ✅ Flexible

**Option C: Year-Specific Plans**
```
Create separate plans for each year:
- "Mathematics Term 1 - Year 7" (planId = 1, yearId = 1, price = $49.99)
- "Mathematics Term 1 - Year 8" (planId = 2, yearId = 2, price = $59.99)
```
- ⚠️ More database records
- ⚠️ More admin work

**Which approach does the backend prefer?**

---

### Question 3: Discount Management

**Current situation:**
- No discount field in `SubscriptionPlan`
- No discount code system

**Questions:**
1. Should discount be:
   - **Per plan** (10% off this specific plan)
   - **Per order** (discount code applied at checkout)
   - **Both**?

2. Should we add to `CreateSubscriptionPlanDto`:
   ```csharp
   public decimal? DiscountPercentage { get; set; }  // e.g., 10.0 for 10%
   public decimal? DiscountAmount { get; set; }      // e.g., $5.00 off
   ```

3. How should discount be calculated:
   ```csharp
   // Option A: Percentage
   FinalPrice = BasePrice * (1 - DiscountPercentage / 100)
   
   // Option B: Fixed Amount
   FinalPrice = BasePrice - DiscountAmount
   
   // Option C: Both (use whichever is better)
   FinalPrice = Min(
       BasePrice * (1 - DiscountPercentage / 100),
       BasePrice - DiscountAmount
   )
   ```

---

### Question 4: API Endpoint Updates

**Current endpoint:**
```
POST /api/SubscriptionPlans
```

**If we add year-based pricing, should we:**

**Option A: Update existing endpoint**
```csharp
[HttpPost]
public async Task<IActionResult> CreatePlan([FromBody] CreateSubscriptionPlanDto dto)
{
    // dto now includes:
    // - YearId (required for all plan types)
    // - DiscountPercentage (optional)
}
```

**Option B: New endpoint for pricing**
```csharp
[HttpPost("{planId}/pricing")]
public async Task<IActionResult> AddPlanPricing(
    int planId, 
    [FromBody] PlanPricingDto dto
)
{
    // Add year-specific pricing after plan creation
}
```

**Option C: Separate pricing table**
```csharp
POST /api/PlanPricing
{
    "planId": 5,
    "yearId": 1,
    "basePrice": 49.99,
    "discountPercentage": 10.0
}
```

**Which approach is recommended?**

---

### Question 5: Database Schema Impact

**Current schema (assumed):**
```sql
CREATE TABLE SubscriptionPlans (
    Id INT PRIMARY KEY,
    Name NVARCHAR(255),
    Description NVARCHAR(MAX),
    Price DECIMAL(18,2),        -- Single price
    PlanType INT,
    SubjectId INT NULL,
    TermId INT NULL,
    YearId INT NULL,            -- Only for FullYear
    IsActive BIT
);
```

**Proposed changes:**

**Option A: Add fields to existing table**
```sql
ALTER TABLE SubscriptionPlans 
ADD YearId INT NOT NULL,               -- Now required for all
    DiscountPercentage DECIMAL(5,2) NULL,
    DiscountAmount DECIMAL(18,2) NULL;
```

**Option B: New PlanPricing table**
```sql
CREATE TABLE PlanPricing (
    Id INT PRIMARY KEY,
    PlanId INT NOT NULL FOREIGN KEY REFERENCES SubscriptionPlans(Id),
    YearId INT NOT NULL FOREIGN KEY REFERENCES Years(Id),
    BasePrice DECIMAL(18,2) NOT NULL,
    DiscountPercentage DECIMAL(5,2) NULL,
    DiscountAmount DECIMAL(18,2) NULL,
    FinalPrice AS (BasePrice - ISNULL(DiscountAmount, 0)) PERSISTED,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UNIQUE(PlanId, YearId)
);
```

**Which schema approach is preferred?**

---

## 5. Frontend Requirements

Based on the backend decision, the frontend needs to:

### If YearId becomes required for all plan types:
1. Update UI to show **Year dropdown** for:
   - Single Term (currently hidden)
   - Multi Term (currently hidden)
   - Subject Annual (currently hidden)

2. Update `CreateSubscriptionPlanDto` interface:
   ```typescript
   export interface CreateSubscriptionPlanDto {
     name: string;
     description: string;
     price: number;
     planType: PlanType;
     yearId: number;          // ✅ Now required for ALL types
     subjectId?: number;
     termId?: number;
     discountPercentage?: number;  // ✅ New field
   }
   ```

### If separate pricing table is used:
1. Add new UI section for "Pricing by Year"
2. Create table to manage pricing:
   ```
   Year 7: $49.99 (10% discount)
   Year 8: $59.99 (15% discount)
   Year 9: $69.99 (no discount)
   ```

---

## 6. Example Scenarios

### Scenario 1: Single Term Plan with Year
```json
{
  "name": "Mathematics Term 1 - Year 7",
  "description": "Access to Mathematics Term 1 for Year 7 students",
  "planType": 1,
  "subjectId": 5,
  "termId": 12,
  "yearId": 1,              // ✅ Now included
  "price": 49.99,
  "discountPercentage": 10  // ✅ 10% discount
}
```

### Scenario 2: Multi Term Plan with Year
```json
{
  "name": "Mathematics Terms 1&2 - Year 8",
  "planType": 2,
  "subjectId": 5,
  "includedTermIds": "12,13",
  "yearId": 2,              // ✅ Now included
  "price": 89.99,
  "discountPercentage": 15
}
```

### Scenario 3: Multiple Pricing per Plan
```json
// Plan created first
POST /api/SubscriptionPlans
{
  "name": "Mathematics Term 1",
  "planType": 1,
  "subjectId": 5,
  "termId": 12
}

// Then add pricing for each year
POST /api/PlanPricing
[
  { "planId": 1, "yearId": 1, "price": 49.99, "discount": 10 },
  { "planId": 1, "yearId": 2, "price": 59.99, "discount": 15 },
  { "planId": 1, "yearId": 3, "price": 69.99, "discount": 0 }
]
```

---

## 7. Urgency and Impact

**Priority Level:** 🔴 High

**Impact on Frontend:**
- ✅ Cannot proceed with pricing management UI until backend structure is clarified
- ✅ Current implementation allows only one price for all years
- ✅ No discount management capability

**Blocker:**
- Admin cannot create realistic subscription plans without year-based pricing
- Cannot apply promotional discounts

---

## 8. Requested Response Format

Please provide the following:

1. **Decision on pricing structure:**
   - Simple price per plan (current)
   - Year-based pricing table
   - Other approach?

2. **Updated DTOs and Models:**
   - Full `CreateSubscriptionPlanDto` structure
   - Any new models (e.g., `PlanPricingDto`)

3. **API endpoint changes:**
   - Updated endpoints
   - Request/response examples

4. **Database migration required:**
   - SQL script or migration name
   - Any breaking changes

5. **Implementation timeline:**
   - When can frontend expect these changes?
   - Should frontend use temporary solution meanwhile?

---

## 9. Temporary Frontend Solution

While waiting for backend decision, should the frontend:

**Option A:** Keep current structure
- One price for all years
- No discount field
- Wait for backend update

**Option B:** Add yearId to all plan types
- Update UI to show Year dropdown
- Keep single price
- Add discount field (optional)

**Option C:** Create separate plans per year
- "Mathematics Term 1 - Year 7"
- "Mathematics Term 1 - Year 8"
- etc.

**Which temporary approach is recommended?**

---

## 10. Follow-up Action Required

Once backend team provides answers:

1. Frontend will update:
   - `subscription.models.ts` (DTOs)
   - `subscriptions.component.ts` (logic)
   - `subscriptions.component.html` (UI)
   - `subscription-plans.service.ts` (API calls)

2. Testing scenarios will be created
3. Documentation will be updated

---

## Contact Information

**Frontend Team:** GitHub Copilot / Angular Team  
**Backend Team:** Laravel/.NET API Team  
**Awaiting Response From:** Backend Team Lead

---

**Status:** ⏳ Awaiting Backend Response

---

## Appendix: Related Files

**Frontend:**
- `src/app/models/subscription.models.ts`
- `src/app/core/services/subscription-plans.service.ts`
- `src/app/features/subscriptions/subscriptions.component.ts`

**Backend (Expected):**
- `Controllers/SubscriptionPlansController.cs`
- `DTOs/CreateSubscriptionPlanDto.cs`
- `Models/SubscriptionPlan.cs`
- `Models/PlanPricing.cs` (if new table)

**Swagger Documentation:**
- `/swagger/index.html` - POST /api/SubscriptionPlans
