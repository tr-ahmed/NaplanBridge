# ❓ Backend Inquiry Report: Invoice Endpoint 404 Error

**Date:** November 5, 2025  
**Topic:** Order Not Found on Invoice Endpoint  
**Priority:** 🟡 MEDIUM  
**Status:** ⏳ REQUIRES BACKEND INVESTIGATION

---

## 1. Issue Summary

The invoice download endpoint `/api/Orders/{orderId}/invoice` is returning **404 Not Found** when trying to retrieve invoice data for Order ID 2, despite the endpoint being documented in Swagger.

---

## 2. Error Details

### Frontend Request:
```http
GET https://naplan2.runasp.net/api/Orders/2/invoice
Authorization: Bearer {parent_token}
```

### Backend Response:
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "message": "Order not found"
}
```

### Console Logs:
```javascript
📄 Loading invoice for order: 2
📄 Downloading invoice: {orderId: 2, url: 'https://naplan2.runasp.net/api/Orders/2/invoice'}
GET https://naplan2.runasp.net/api/Orders/2/invoice 404 (Not Found)
Backend error 404: {message: 'Order not found'}
❌ Download invoice error: {status: 404}
❌ Failed to load invoice: {status: 404}
```

---

## 3. Endpoint Verification

### From Swagger Documentation:

```yaml
/api/Orders/{orderId}/invoice:
  get:
    summary: Get invoice for order
    parameters:
      - name: orderId
        in: path
        required: true
        schema:
          type: integer
    responses:
      '200':
        description: Success
      '404':
        description: Not Found
```

**Endpoint Exists:** ✅ Confirmed in Swagger  
**Authorization:** Required (Parent/Admin)  
**Issue:** Order ID 2 not found in database

---

## 4. Possible Causes

### Cause 1: Order Does Not Exist ⚠️ MOST LIKELY
```sql
-- Order ID 2 might not exist in Orders table
SELECT * FROM Orders WHERE Id = 2;
-- Result: No rows returned
```

### Cause 2: Parent Ownership Check
```csharp
// Backend might be filtering by parent ownership
var order = await _context.Orders
    .Where(o => o.Id == orderId && o.ParentId == currentParentId)
    .FirstOrDefaultAsync();

// If order belongs to different parent → 404
```

### Cause 3: Soft Delete
```csharp
// Order might be soft-deleted
var order = await _context.Orders
    .Where(o => o.Id == orderId && !o.IsDeleted)
    .FirstOrDefaultAsync();
```

### Cause 4: Wrong Navigation
```typescript
// Frontend might be passing wrong order ID
const orderId = (subscription as any).orderId || subscription.id;
// subscription.id = 2 (StudentSubject ID)
// subscription.orderId = undefined → Falls back to subscription.id
```

---

## 5. Questions for Backend Team

### Question 1: Order Existence
**Q:** Does Order ID 2 exist in the database?

```sql
-- Please run this query
SELECT Id, CreatedAt, TotalAmount, Status, ParentId
FROM Orders
WHERE Id = 2;
```

**Expected Information:**
- Order ID
- Creation date
- Total amount
- Payment status
- Parent ID

---

### Question 2: Order-Subscription Relationship
**Q:** What is the relationship between `StudentSubjects` and `Orders`?

**Current Frontend Logic:**
```typescript
// We're using subscription ID as fallback
const orderId = (subscription as any).orderId || subscription.id;
```

**Is there a field like:**
- `StudentSubjects.OrderId`?
- `Orders.StudentSubjectId`?
- Junction table `OrderItems`?

**Please provide:**
1. Database schema for `StudentSubjects` table
2. Database schema for `Orders` table
3. How to find Order ID from StudentSubject ID

---

### Question 3: Sample Order IDs
**Q:** Can you provide sample valid Order IDs for testing?

**Request:**
```sql
-- Get recent orders with invoices
SELECT TOP 5 
    o.Id AS OrderId,
    o.CreatedAt,
    o.TotalAmount,
    o.Status,
    ss.Id AS SubscriptionId,
    ss.StudentId
FROM Orders o
LEFT JOIN OrderItems oi ON o.Id = oi.OrderId
LEFT JOIN StudentSubjects ss ON oi.StudentSubjectId = ss.Id
ORDER BY o.CreatedAt DESC;
```

This will help us test with real data.

---

### Question 4: Invoice Data Structure
**Q:** What fields are available in the invoice response?

**Expected Response Structure:**
```json
{
  "orderId": 123,
  "orderDate": "2025-11-05T10:00:00Z",
  "totalAmount": 499.00,
  "status": "Paid",
  "items": [
    {
      "studentName": "Ali Ahmed",
      "planName": "Algebra Year 7 - Term 1",
      "price": 499.00
    }
  ],
  "paymentMethod": "Credit Card",
  "paymentDate": "2025-11-05T10:05:00Z",
  "transactionId": "ch_1234567890"
}
```

**Questions:**
1. Are all these fields populated?
2. Which fields might be null?
3. Any additional fields available?

---

## 6. Frontend Current Implementation

### How We Get Order ID:
```typescript
// my-subscriptions.component.ts
downloadInvoice(subscription: SubscriptionWithDetails): void {
  // Get orderId - use subscription ID as fallback
  const orderId = (subscription as any).orderId || subscription.id;
  
  // Navigate to invoice page
  this.router.navigate(['/parent/invoice', orderId]);
}
```

**Problem:** `subscription` object doesn't have `orderId` property!

---

### Subscription Data Structure:
```typescript
interface SubscriptionWithDetails {
  id: number;              // StudentSubject ID (not Order ID!)
  studentId: number;
  studentName: string;
  planId: number;
  planName: string;
  status: string;
  autoRenew: boolean;
  startDate: string;
  endDate: string;
  totalAmount: number;
  // ❌ Missing: orderId property!
}
```

---

## 7. Recommended Solutions

### Solution 1: Add OrderId to Subscription Response ✅ RECOMMENDED

**Backend Change:**
```csharp
// In StudentSubjectsController or wherever subscriptions are fetched
public class SubscriptionDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; }
    public int PlanId { get; set; }
    public string PlanName { get; set; }
    public string Status { get; set; }
    public bool AutoRenew { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TotalAmount { get; set; }
    
    // ✅ Add this
    public int? OrderId { get; set; }  // Link to Orders table
}

// In query
var subscriptions = await _context.StudentSubjects
    .Include(ss => ss.Order)  // If navigation exists
    .Select(ss => new SubscriptionDto
    {
        Id = ss.Id,
        StudentId = ss.StudentId,
        // ... other fields
        OrderId = ss.OrderId  // ✅ Include OrderId
    })
    .ToListAsync();
```

**Frontend Update:**
```typescript
// Then we can use it reliably
const orderId = subscription.orderId;
if (!orderId) {
  alert('No order found for this subscription');
  return;
}
this.router.navigate(['/parent/invoice', orderId]);
```

---

### Solution 2: Create Lookup Endpoint

**Backend:**
```csharp
[HttpGet("subscriptions/{subscriptionId}/order")]
public async Task<IActionResult> GetOrderForSubscription(int subscriptionId)
{
    var order = await _context.Orders
        .Where(o => o.StudentSubjects.Any(ss => ss.Id == subscriptionId))
        .FirstOrDefaultAsync();
    
    if (order == null)
        return NotFound("No order found for this subscription");
    
    return Ok(new { orderId = order.Id });
}
```

**Frontend:**
```typescript
getOrderIdForSubscription(subscriptionId: number): Observable<number> {
  return this.http.get<{orderId: number}>(
    `${this.baseUrl}/StudentSubjects/subscriptions/${subscriptionId}/order`
  ).pipe(map(response => response.orderId));
}
```

---

### Solution 3: Accept Subscription ID in Invoice Endpoint

**Backend:**
```csharp
[HttpGet("subscriptions/{subscriptionId}/invoice")]
public async Task<IActionResult> GetInvoiceBySubscription(int subscriptionId)
{
    var subscription = await _context.StudentSubjects
        .Include(ss => ss.Order)
        .FirstOrDefaultAsync(ss => ss.Id == subscriptionId);
    
    if (subscription?.Order == null)
        return NotFound("No order found for this subscription");
    
    // Return invoice data
    return Ok(GenerateInvoiceDto(subscription.Order));
}
```

---

## 8. Database Schema Questions

### Current Understanding:
```
Students ──┐
           ├──→ StudentSubjects ──?──→ Orders
Parents ───┘
```

### Need Clarification:
1. **Is there `StudentSubjects.OrderId` column?**
2. **Is there `Orders.StudentSubjectId` column?**
3. **Is there `OrderItems` junction table?**
4. **How is the relationship structured?**

### Please Provide:
```sql
-- StudentSubjects table structure
EXEC sp_help 'StudentSubjects';

-- Orders table structure
EXEC sp_help 'Orders';

-- OrderItems table structure (if exists)
EXEC sp_help 'OrderItems';
```

---

## 9. Testing Requirements

### Test Case 1: Valid Order ID
```bash
# Request with known valid order
GET /api/Orders/1/invoice
Authorization: Bearer {parent_token}

# Expected: 200 OK with invoice data
```

### Test Case 2: Invalid Order ID
```bash
# Request with non-existent order
GET /api/Orders/99999/invoice

# Expected: 404 Not Found with clear message
```

### Test Case 3: Wrong Parent
```bash
# Parent A tries to access Parent B's order
GET /api/Orders/123/invoice
Authorization: Bearer {parent_a_token}

# Expected: 403 Forbidden or 404 Not Found
```

### Test Case 4: Get Order ID from Subscription
```bash
# If new endpoint is created
GET /api/StudentSubjects/subscriptions/2/order

# Expected: {"orderId": 123}
```

---

## 10. Immediate Workaround (Frontend)

Until backend provides solution, show better error message:

```typescript
downloadInvoice(subscription: SubscriptionWithDetails): void {
  const orderId = (subscription as any).orderId;
  
  if (!orderId) {
    alert(`
      ⚠️ Invoice Not Available
      
      This subscription does not have an associated order.
      
      Possible reasons:
      - Subscription was created manually
      - Order data is missing
      - Database relationship issue
      
      Please contact support for assistance.
      
      Subscription ID: ${subscription.id}
    `);
    return;
  }
  
  this.router.navigate(['/parent/invoice', orderId]);
}
```

---

## 11. Impact Analysis

### Current Impact:
- ❌ Parents cannot view/download invoices
- ❌ No visibility into payment history
- ❌ Poor user experience (404 error)
- ❌ Unclear error messages

### Business Impact:
- 📉 Reduced transparency
- 📉 More support tickets
- 📉 Customer dissatisfaction

### Priority:
- 🟡 **MEDIUM** - Feature is broken but not critical
- Users can still make payments
- Only affects invoice viewing

---

## 12. Related Endpoints to Check

Similar issues might exist in:

```http
GET /api/Orders/{orderId}                    ← Check ownership
GET /api/Orders/parent/summary               ← Check data structure
GET /api/Orders/parent/summary/paged         ← Check if includes OrderId
```

All parent-facing order endpoints should be tested.

---

## 13. Summary

### Problem:
- Invoice endpoint returns 404
- Frontend using wrong ID (SubscriptionId instead of OrderId)
- Missing OrderId in subscription data

### Root Cause:
- Database relationship unclear
- SubscriptionDto missing OrderId field
- Frontend has no way to get OrderId

### Solution Needed:
1. ✅ **Add OrderId to subscription response** (Recommended)
2. OR Create lookup endpoint
3. OR Accept subscription ID in invoice endpoint

### Questions:
1. Does Order ID 2 exist?
2. What's the Orders↔Subscriptions relationship?
3. Sample valid Order IDs for testing?
4. Complete invoice response structure?

---

## 14. Next Steps

**For Backend Team:**
1. Answer the 4 main questions above
2. Choose one of the 3 solutions
3. Provide database schema details
4. Give sample valid Order IDs for testing

**For Frontend Team:**
5. Wait for backend clarification
6. Implement chosen solution
7. Add better error handling
8. Test with real data

---

**Status:** ⏳ Waiting for Backend Response  
**Priority:** 🟡 MEDIUM  
**Blocking:** Invoice feature  
**Timeline:** Depends on backend solution choice

---

**Report Generated:** November 5, 2025  
**Report ID:** INQUIRY-INVOICE-404-002  
**Related Report:** `backend_inquiry_auto_renew_permission_403_2025-11-05.md`
