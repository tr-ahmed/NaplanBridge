# ❓ Backend Inquiry Report - Cart Item Details Enhancement

## Date: November 1, 2025

---

## 1. Inquiry Topic

**Cart endpoint needs to return more detailed subject/plan information for accurate UI matching**

---

## 2. Reason for Inquiry

### Current Problem:

On the **Courses page**, when checking if a subject is in the cart, we're experiencing **false matches** because the cart items don't return enough information to accurately identify which subject/plan is in the cart.

**Example Issue:**
- User adds **"Algebra Year 7"** to cart
- UI shows **both "Algebra"** AND **"Physics"** with "Remove from Cart" button
- This is because we can only match by partial subject name, not by exact subject ID

---

## 3. Current Cart API Response

### Endpoint: `GET /api/Cart`

**Current Response Structure** (from frontend model):
```json
{
  "items": [
    {
      "course": {
        "id": 1,
        "name": "Algebra",
        "subjectName": "Algebra Year 7 - Term 1",
        "price": 29.99
      },
      "quantity": 1
    }
  ],
  "totalAmount": 29.99,
  "totalItems": 1
}
```

**Problem**: The `course` object in cart items doesn't have clear identifiers:
- ❌ No `subjectId` field
- ❌ No `yearId` field  
- ❌ No `termId` field
- ❌ Only `name`/`subjectName` which varies in format

---

## 4. Required Information

### Enhanced Cart Item Response Needed:

```json
{
  "items": [
    {
      "cartItemId": 123,
      "subscriptionPlanId": 10,
      "studentId": 8,
      "planName": "Algebra Year 7 - Term 1",
      "price": 29.99,
      "quantity": 1,
      
      // ✅ NEW FIELDS NEEDED:
      "subjectId": 5,           // ← Subject identifier
      "subjectName": "Algebra",  // ← Clean subject name (without year/term)
      "yearId": 7,              // ← Year identifier
      "yearName": "Year 7",     // ← Display name
      "termId": 1,              // ← Term identifier (if applicable)
      "termName": "Term 1",     // ← Term display name (if applicable)
      "planType": "SingleTerm", // ← Plan type (SingleTerm, FullYear, etc.)
      
      "addedDate": "2025-11-01T10:00:00Z"
    }
  ],
  "itemCount": 1,
  "totalAmount": 29.99
}
```

---

## 5. Why This Information is Needed

### Current Frontend Logic (Problematic):

```typescript
// ❌ Current approach - unreliable string matching
isInCart(courseId: number): boolean {
  const course = this.courses.find(c => c.id === courseId);
  const subjectName = course.subjectName; // "Algebra"
  
  return cart.items.some(item => {
    const itemName = item.course.subjectName; // "Algebra Year 7 - Term 1"
    // Trying to match "Algebra" with "Algebra Year 7 - Term 1"
    // Also accidentally matches "Algebra" with "Physics" sometimes!
    return itemName.includes(subjectName);
  });
}
```

### Desired Frontend Logic (Reliable):

```typescript
// ✅ Desired approach - exact ID matching
isInCart(courseId: number): boolean {
  const course = this.courses.find(c => c.id === courseId);
  
  return cart.items.some(item => {
    // Exact match by subject ID and year ID
    return item.subjectId === course.id && 
           item.yearId === course.yearId;
  });
}
```

---

## 6. Backend Implementation Suggestion

### Option 1: Enhance CartItemDto (Recommended)

**File**: `API/DTOs/CartItemDto.cs`

```csharp
public class CartItemDto
{
    public int CartItemId { get; set; }
    public int SubscriptionPlanId { get; set; }
    public int StudentId { get; set; }
    
    // Plan details
    public string PlanName { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    
    // ✅ ADD THESE NEW FIELDS:
    public int? SubjectId { get; set; }       // From SubscriptionPlan.SubjectId
    public string SubjectName { get; set; }    // From Subject.SubjectName
    public int? YearId { get; set; }          // From SubscriptionPlan.YearId or Subject.YearId
    public string YearName { get; set; }      // From Year.Name (e.g., "Year 7")
    public int? TermId { get; set; }          // From SubscriptionPlan.TermId
    public string TermName { get; set; }      // From Term.Name (e.g., "Term 1")
    public string PlanType { get; set; }      // From SubscriptionPlan.PlanType
    
    public DateTime AddedDate { get; set; }
}
```

### Option 2: Return SubscriptionPlan Details

**Alternative**: Include full SubscriptionPlan object in response:

```csharp
public class CartItemDto
{
    public int CartItemId { get; set; }
    public int Quantity { get; set; }
    public DateTime AddedDate { get; set; }
    
    // ✅ Include full subscription plan details
    public SubscriptionPlanDto SubscriptionPlan { get; set; }
}

public class SubscriptionPlanDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public string PlanType { get; set; }
    
    public int? SubjectId { get; set; }
    public string SubjectName { get; set; }
    public int? YearId { get; set; }
    public string YearName { get; set; }
    public int? TermId { get; set; }
    public string TermName { get; set; }
}
```

---

## 7. Database Relationships

Based on the system, the relationships should be:

```
CartItem
  ↓ SubscriptionPlanId
SubscriptionPlan
  ↓ SubjectId (nullable)
  ↓ YearId (nullable)
  ↓ TermId (nullable)
Subject
  ↓ YearId
Year
  ↓ Name ("Year 7", "Year 8", etc.)
Term
  ↓ Name ("Term 1", "Term 2", etc.)
```

**Query Suggestion**:
```csharp
var cartItems = await context.CartItems
    .Where(ci => ci.StudentId == studentId)
    .Include(ci => ci.SubscriptionPlan)
        .ThenInclude(sp => sp.Subject)
            .ThenInclude(s => s.Year)
    .Include(ci => ci.SubscriptionPlan)
        .ThenInclude(sp => sp.Term)
    .Select(ci => new CartItemDto
    {
        CartItemId = ci.Id,
        SubscriptionPlanId = ci.SubscriptionPlanId,
        StudentId = ci.StudentId,
        PlanName = ci.SubscriptionPlan.Name,
        Price = ci.SubscriptionPlan.Price,
        Quantity = ci.Quantity,
        
        // NEW FIELDS:
        SubjectId = ci.SubscriptionPlan.SubjectId,
        SubjectName = ci.SubscriptionPlan.Subject != null 
            ? ci.SubscriptionPlan.Subject.SubjectName 
            : null,
        YearId = ci.SubscriptionPlan.YearId 
            ?? ci.SubscriptionPlan.Subject.YearId,
        YearName = ci.SubscriptionPlan.Subject != null 
            ? ci.SubscriptionPlan.Subject.Year.Name 
            : null,
        TermId = ci.SubscriptionPlan.TermId,
        TermName = ci.SubscriptionPlan.Term != null 
            ? ci.SubscriptionPlan.Term.Name 
            : null,
        PlanType = ci.SubscriptionPlan.PlanType.ToString(),
        
        AddedDate = ci.CreatedAt
    })
    .ToListAsync();
```

---

## 8. Use Cases

### Use Case 1: Check if subject is in cart

**Current (Broken)**:
```typescript
// Algebra in cart
// Checking: "Physics" 
// Result: ❌ Sometimes shows as "in cart" (false positive)
```

**After Fix**:
```typescript
// Algebra (subjectId: 5, yearId: 7) in cart
// Checking: Physics (subjectId: 12, yearId: 7)
// Result: ✅ Not in cart (correct)
```

---

### Use Case 2: Display cart items

**Current**:
```html
<div class="cart-item">
  <h3>{{ item.course.subjectName }}</h3>
  <!-- "Algebra Year 7 - Term 1" -->
</div>
```

**After Fix**:
```html
<div class="cart-item">
  <h3>{{ item.subjectName }}</h3>
  <!-- "Algebra" -->
  <p>{{ item.yearName }} - {{ item.termName }}</p>
  <!-- "Year 7 - Term 1" -->
  <span class="plan-type">{{ item.planType }}</span>
  <!-- "SingleTerm" -->
</div>
```

---

### Use Case 3: Remove from cart by exact match

**Current (Broken)**:
```typescript
// User clicks "Remove" on "Algebra"
// Code searches cart for "Algebra"
// Might accidentally find "Physics" if name matching is off
```

**After Fix**:
```typescript
// User clicks "Remove" on "Algebra" (id: 5, year: 7)
// Code searches cart for subjectId: 5 AND yearId: 7
// Finds exact match, removes correct item
```

---

## 9. Impact Analysis

### Frontend Changes Required:

1. **Update Cart Model**:
```typescript
export interface CartItem {
  cartItemId: number;
  subscriptionPlanId: number;
  studentId: number;
  planName: string;
  price: number;
  quantity: number;
  
  // NEW FIELDS:
  subjectId?: number;
  subjectName?: string;
  yearId?: number;
  yearName?: string;
  termId?: number;
  termName?: string;
  planType?: string;
  
  addedDate: string;
}
```

2. **Update isInCart() Logic**:
```typescript
isInCart(courseId: number): boolean {
  const course = this.courses.find(c => c.id === courseId);
  
  return this.cart.items.some(item => 
    item.subjectId === course.id && 
    item.yearId === course.yearId
  );
}
```

3. **Update removeFromCart() Logic**:
```typescript
removeFromCart(courseId: number): void {
  const course = this.courses.find(c => c.id === courseId);
  
  const cartItem = this.cart.items.find(item =>
    item.subjectId === course.id &&
    item.yearId === course.yearId
  );
  
  if (cartItem) {
    this.cartService.removeItem(cartItem.cartItemId);
  }
}
```

---

## 10. Testing Scenarios

**Test 1: Add "Algebra Year 7" to cart**
```
Expected Cart Response:
{
  "items": [{
    "subjectId": 5,
    "subjectName": "Algebra",
    "yearId": 7,
    "yearName": "Year 7"
  }]
}

Expected UI:
- Algebra card: "Remove from Cart" ✅
- Physics card: "Add to Cart" ✅
```

**Test 2: Add multiple subjects**
```
Cart: ["Algebra Year 7", "Physics Year 7"]

Expected:
- Algebra card: "Remove from Cart" ✅
- Physics card: "Remove from Cart" ✅
- English card: "Add to Cart" ✅
```

---

## 11. Priority

**🔴 HIGH**

**Why**:
- Current UI shows incorrect cart status
- Users see "Remove from Cart" on items they didn't add
- Can't remove items correctly
- Poor user experience

---

## 12. Questions for Backend Team

1. ✅ Can you add `SubjectId`, `YearId`, `TermId` to `GET /api/Cart` response?
2. ✅ Can you add clean `SubjectName`, `YearName`, `TermName` fields?
3. ✅ Can you add `PlanType` field to identify plan types?
4. ✅ What is the current structure of `SubscriptionPlan` in database?
5. ✅ Are there any performance concerns with additional joins?
6. ✅ Should we return full `SubscriptionPlan` object or flatten the fields?

---

## 13. Alternative Workaround (If Backend Can't Change)

If backend changes are not possible immediately, we can:

1. **Match by Plan ID** instead of subject name:
```typescript
// Store planId → courseId mapping when adding to cart
isInCart(courseId: number): boolean {
  const course = this.courses.find(c => c.id === courseId);
  const expectedPlanId = course.subscriptionPlans[0].id;
  
  return this.cart.items.some(item => 
    item.subscriptionPlanId === expectedPlanId
  );
}
```

But this requires the course object to have subscription plans, which may not always be available.

---

**Report Generated**: November 1, 2025  
**Frontend Status**: ⚠️ **BLOCKED** - Waiting for enhanced cart response  
**Backend Action Required**: ✅ **HIGH PRIORITY** - Add subject/year/term identifiers to cart items

---

**Recommendation**: Implement **Option 1** (Enhanced CartItemDto) as it provides all needed information without major structural changes.