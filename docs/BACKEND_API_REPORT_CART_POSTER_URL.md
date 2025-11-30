# 📌 BACKEND REPORT - Cart API Missing PosterUrl

## 📋 Report Details
**Date:** November 22, 2025  
**Reported By:** Frontend Team  
**Priority:** Medium  
**Status:** ⏳ Pending Backend Fix

---

## 🔍 Issue Description

### Endpoint Affected
```
GET /api/cart
```

### Current Behavior
When fetching cart items via `GET /api/cart`, the response **does not include the `posterUrl` field** from the Subject entity.

**Current Response Structure:**
```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 1,
      "subscriptionPlanId": 2,
      "subscriptionPlanName": "Algebra - Term 1 & 2",
      "studentId": 5,
      "studentName": "Ali Ahmed",
      "quantity": 1,
      "unitPrice": 49.99,
      "totalPrice": 49.99,
      "subjectName": "Algebra"
      // ❌ Missing: posterUrl
      // ❌ Missing: imageUrl
    }
  ],
  "totalAmount": 49.99,
  "itemCount": 1
}
```

### Expected Behavior
Cart items should include the `posterUrl` from the related Subject entity to display subject images in the shopping cart.

**Expected Response Structure:**
```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 1,
      "subscriptionPlanId": 2,
      "subscriptionPlanName": "Algebra - Term 1 & 2",
      "studentId": 5,
      "studentName": "Ali Ahmed",
      "quantity": 1,
      "unitPrice": 49.99,
      "totalPrice": 49.99,
      "subjectName": "Algebra",
      "posterUrl": "https://cloudinary.com/algebra-poster.jpg",  // ✅ Added
      "yearId": 7,                                                // ✅ Added (bonus)
      "termNumber": 1,                                            // ✅ Added (bonus)
      "level": "Intermediate",                                    // ✅ Added (bonus)
      "duration": 120                                             // ✅ Added (bonus)
    }
  ],
  "totalAmount": 49.99,
  "itemCount": 1
}
```

---

## 💥 Impact on Frontend

### Current Frontend Workaround
The frontend currently generates placeholder images when `posterUrl` is missing:

```typescript
// Workaround in courses.service.ts
let posterUrl = backendItem.posterUrl || 
               backendItem.imageUrl || 
               backendItem.subjectPosterUrl ||
               backendItem.subject?.posterUrl ||
               '';

if (!posterUrl) {
  const subjectName = backendItem.subjectName || backendItem.planName || 'Subject';
  const encodedName = encodeURIComponent(subjectName.replace(/ /g, '+'));
  posterUrl = `https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=${encodedName}`;
}
```

### Why This Is Not Ideal
1. ❌ **Poor User Experience**: Generic placeholder images instead of actual subject posters
2. ❌ **Inconsistent Branding**: Users see placeholder text instead of professional subject images
3. ❌ **Extra Frontend Logic**: Frontend has to handle missing data with workarounds
4. ❌ **Performance**: Relies on external placeholder service (via.placeholder.com)

---

## 🎯 Requested Changes

### Required Changes

#### 1. Update CartItemDto / Cart Response Model
Add `posterUrl` field to cart item response:

```csharp
public class CartItemDto
{
    public int Id { get; set; }
    public int SubscriptionPlanId { get; set; }
    public string SubscriptionPlanName { get; set; }
    public string SubjectName { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public int Quantity { get; set; }
    
    // ✅ ADD THIS
    public string? PosterUrl { get; set; }
}
```

#### 2. Update Cart Controller / Service
Include Subject's `posterUrl` when fetching cart items:

```csharp
// In CartService or CartController
var cartItems = await _context.CartItems
    .Include(ci => ci.SubscriptionPlan)
        .ThenInclude(sp => sp.Subject)  // ✅ Include Subject
    .Where(ci => ci.CartId == cartId)
    .Select(ci => new CartItemDto
    {
        Id = ci.Id,
        SubscriptionPlanId = ci.SubscriptionPlanId,
        SubscriptionPlanName = ci.SubscriptionPlan.Name,
        SubjectName = ci.SubscriptionPlan.Subject.SubjectName,
        UnitPrice = ci.SubscriptionPlan.Price,
        TotalPrice = ci.SubscriptionPlan.Price * ci.Quantity,
        Quantity = ci.Quantity,
        
        // ✅ ADD THIS - Get posterUrl from Subject
        PosterUrl = ci.SubscriptionPlan.Subject.PosterUrl
    })
    .ToListAsync();
```

### Optional (But Recommended) Changes

Add more useful fields to improve cart display:

```csharp
public class CartItemDto
{
    // ... existing fields ...
    
    // Optional but helpful fields
    public string? PosterUrl { get; set; }
    public int? YearId { get; set; }
    public int? TermNumber { get; set; }
    public string? Level { get; set; }
    public int? Duration { get; set; }
    public string? CategoryName { get; set; }
}
```

---

## 🧪 Testing Instructions

### Test Case 1: Cart with Items
```http
GET /api/cart
Authorization: Bearer {valid-token}
```

**Expected Response:**
- Each cart item should have a `posterUrl` field
- `posterUrl` should match the Subject's poster image URL
- If Subject has no poster, `posterUrl` should be `null` (frontend will handle fallback)

### Test Case 2: Empty Cart
```http
GET /api/cart
Authorization: Bearer {valid-token}
```

**Expected Response:**
```json
{
  "id": 1,
  "userId": 1,
  "items": [],
  "totalAmount": 0,
  "itemCount": 0
}
```

### Test Case 3: Add to Cart and Verify
```http
POST /api/cart/items
Authorization: Bearer {valid-token}
Content-Type: application/json

{
  "subscriptionPlanId": 2,
  "studentId": 5,
  "quantity": 1
}
```

Then fetch cart and verify `posterUrl` is included:
```http
GET /api/cart
Authorization: Bearer {valid-token}
```

---

## 📊 Database Schema Verification

Please verify the relationship path:

```
CartItem
  → SubscriptionPlan
    → Subject
      → PosterUrl ✅
```

If the relationship is different, please provide the correct path.

---

## 🔄 Frontend Impact After Fix

Once this is implemented, the frontend can:

1. ✅ Remove placeholder image workaround
2. ✅ Display actual subject posters in cart
3. ✅ Improve user experience with real images
4. ✅ Simplify cart loading logic

---

## 📞 Contact

**Frontend Developer:** Ahmed Hamdi  
**Question/Clarification:** Available for discussion

---

## ✅ Acceptance Criteria

- [ ] `GET /api/cart` response includes `posterUrl` for each cart item
- [ ] `posterUrl` matches the Subject's poster image
- [ ] `posterUrl` is `null` if Subject has no poster (not empty string)
- [ ] Existing cart functionality still works (no breaking changes)
- [ ] All cart-related tests pass

---

## 📝 Related Documentation

- **API Documentation:** `backend docs/PAYMENT_SUBSCRIPTION_GUIDE.md`
- **Frontend Workaround:** `src/app/core/services/courses.service.ts` (lines 437-451)
- **Cart Component:** `src/app/features/cart/cart.component.html` (line 43)

---

**Status:** ⏳ Awaiting Backend Team Response

Please confirm when this enhancement is:
1. ✅ Reviewed and approved
2. ✅ Implemented and deployed
3. ✅ Ready for frontend testing

**Reply with:** `✔ BACKEND FIX CONFIRMED` when ready.
