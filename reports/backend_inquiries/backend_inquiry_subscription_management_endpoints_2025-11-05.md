# ❓ Backend Inquiry Report

## Date: November 5, 2025
## Topic: Missing Subscription Management Endpoints
## Priority: 🟡 MEDIUM
## Status: ⏳ AWAITING BACKEND RESPONSE

---

## 1. Inquiry Topic

Request implementation of **3 missing endpoints** for subscription management features in the My Subscriptions page.

---

## 2. Reason for Inquiry

The **My Subscriptions** page (`/parent/subscriptions`) has been fully implemented on the frontend with the following buttons:

1. ✅ **View Details** - Working (navigates to student dashboard)
2. ✅ **Upgrade** - Working (navigates to subjects page)
3. ⚠️ **Auto-Renew Toggle** - Local only (no backend persistence)
4. ⚠️ **Download Invoice** - Placeholder (no backend endpoint)
5. ⚠️ **Cancel Subscription** - Conditional (endpoint may not exist)

**Current Issue:**
Three features cannot be fully implemented because the backend endpoints are either missing or unclear.

---

## 3. Frontend Implementation Status

### Current Frontend Code:

#### Auto-Renew Toggle (Local Only):
```typescript
toggleAutoRenew(subscription: SubscriptionWithDetails): void {
  // ⚠️ Only updates local state - changes not persisted
  const updated = subscriptions.map(s =>
    s.id === subscription.id ? { ...s, autoRenew: !s.autoRenew } : s
  );
  this.subscriptions.set(updated);
  
  alert('Auto-renewal enabled (local change only)\n\n' +
        'Note: Backend endpoint required to persist this change.');
}
```

#### Download Invoice (Placeholder):
```typescript
downloadInvoice(subscription: SubscriptionWithDetails): void {
  // ⚠️ Shows alert instead of downloading file
  alert(`Invoice for ${subscription.planName}\n\n` +
        `Student: ${subscription.studentName}\n` +
        `Amount: $${subscription.totalAmount}\n` +
        `Note: Invoice download feature requires backend implementation.`);
}
```

#### Cancel Subscription (Conditional):
```typescript
cancelSubscription(): void {
  // ⚠️ Checks if method exists before calling
  if (typeof this.subscriptionService.cancelSubscription === 'function') {
    this.subscriptionService.cancelSubscription(sub.id, reason).subscribe(...);
  } else {
    alert('Cancel subscription feature requires backend implementation.');
  }
}
```

---

## 4. Requested Backend Endpoints

### Endpoint 1: Toggle Auto-Renewal ⚠️ HIGH PRIORITY

#### Endpoint Details:
```http
PUT /api/StudentSubjects/{id}/auto-renew
Authorization: Bearer {token}
Content-Type: application/json
```

#### Request Body:
```json
{
  "autoRenew": true
}
```

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Auto-renewal updated successfully",
  "studentSubjectId": 123,
  "autoRenew": true
}
```

#### Business Logic:
- Update `StudentSubjects` table: `AutoRenew` column
- Only allow Parent or Admin roles
- Validate subscription is Active
- Return error if subscription is Expired or Cancelled

#### Suggested Implementation:
```csharp
// File: API/Controllers/StudentSubjectsController.cs

[HttpPut("{id}/auto-renew")]
[Authorize(Roles = "Parent,Admin")]
public async Task<IActionResult> UpdateAutoRenew(int id, [FromBody] AutoRenewDto dto)
{
    var studentSubject = await _context.StudentSubjects
        .FirstOrDefaultAsync(ss => ss.Id == id);
    
    if (studentSubject == null)
        return NotFound("Subscription not found");
    
    // Check if subscription is active
    if (DateTime.Now > studentSubject.EndDate)
        return BadRequest("Cannot modify expired subscription");
    
    studentSubject.AutoRenew = dto.AutoRenew;
    await _context.SaveChangesAsync();
    
    return Ok(new {
        success = true,
        message = "Auto-renewal updated successfully",
        studentSubjectId = id,
        autoRenew = dto.AutoRenew
    });
}

// DTO
public class AutoRenewDto
{
    public bool AutoRenew { get; set; }
}
```

---

### Endpoint 2: Download Invoice 📄 MEDIUM PRIORITY

#### Endpoint Details:
```http
GET /api/Orders/{orderId}/invoice
Authorization: Bearer {token}
Accept: application/pdf
```

#### Response (200 OK):
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice-{orderId}.pdf"

[PDF Binary Data]
```

#### Alternative (if PDF generation not ready):
```http
GET /api/Orders/{orderId}/invoice-data
Authorization: Bearer {token}
```

#### Response (200 OK):
```json
{
  "orderId": 123,
  "orderDate": "2024-11-01T10:30:00Z",
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
  "paymentDate": "2024-11-01T10:35:00Z",
  "transactionId": "ch_1234567890"
}
```

#### Business Logic:
- Find Order by ID
- Verify order belongs to authenticated parent
- Generate PDF invoice (using library like iText or QuestPDF)
- Include: Order details, items, amounts, payment info
- Return PDF file or invoice data

#### Suggested Implementation:
```csharp
// File: API/Controllers/OrdersController.cs

[HttpGet("{orderId}/invoice")]
[Authorize(Roles = "Parent,Admin")]
public async Task<IActionResult> GetInvoice(int orderId)
{
    var order = await _context.Orders
        .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.SubscriptionPlan)
        .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Student)
                .ThenInclude(s => s.User)
        .FirstOrDefaultAsync(o => o.Id == orderId);
    
    if (order == null)
        return NotFound("Order not found");
    
    // Verify ownership (parent can only download their own invoices)
    var parentId = GetCurrentUserId();
    if (order.UserId != parentId)
        return Forbid();
    
    // Option 1: Return invoice data (if PDF generation not ready)
    var invoiceData = new {
        orderId = order.Id,
        orderDate = order.CreatedAt,
        totalAmount = order.TotalAmount,
        status = order.OrderStatus.ToString(),
        items = order.OrderItems.Select(oi => new {
            studentName = oi.Student?.User?.UserName ?? "Unknown",
            planName = oi.SubscriptionPlan?.Name ?? "Unknown",
            price = oi.UnitPrice
        }),
        paymentMethod = order.PaymentMethod,
        paymentDate = order.UpdatedAt
    };
    
    return Ok(invoiceData);
    
    // Option 2: Generate and return PDF (future implementation)
    // var pdfBytes = await _invoiceService.GeneratePdfAsync(order);
    // return File(pdfBytes, "application/pdf", $"invoice-{orderId}.pdf");
}
```

---

### Endpoint 3: Cancel Subscription ❌ HIGH PRIORITY

#### Endpoint Details:
```http
DELETE /api/StudentSubjects/{id}
or
PUT /api/StudentSubjects/{id}/cancel
Authorization: Bearer {token}
Content-Type: application/json
```

#### Request Body (if using PUT):
```json
{
  "reason": "Too expensive / Not using / Found alternative / Other"
}
```

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "studentSubjectId": 123,
  "status": "Cancelled",
  "cancelledAt": "2025-11-05T14:30:00Z",
  "refundAmount": 0.00,
  "refundNote": "No refund for cancelled subscriptions"
}
```

#### Business Logic:
- Find StudentSubject by ID
- Verify parent owns this subscription
- Check subscription status (can only cancel Active subscriptions)
- Update status to "Cancelled"
- Disable auto-renewal
- Calculate refund (if applicable based on cancellation policy)
- Log cancellation reason
- Send notification to parent and student

#### Suggested Implementation:
```csharp
// File: API/Controllers/StudentSubjectsController.cs

[HttpPut("{id}/cancel")]
[Authorize(Roles = "Parent,Admin")]
public async Task<IActionResult> CancelSubscription(int id, [FromBody] CancelSubscriptionDto dto)
{
    var studentSubject = await _context.StudentSubjects
        .Include(ss => ss.Student)
        .FirstOrDefaultAsync(ss => ss.Id == id);
    
    if (studentSubject == null)
        return NotFound("Subscription not found");
    
    // Verify ownership
    var parentId = GetCurrentUserId();
    if (studentSubject.Student.ParentId != parentId)
        return Forbid("You can only cancel your own children's subscriptions");
    
    // Check if already cancelled
    if (studentSubject.Status == SubscriptionStatus.Cancelled)
        return BadRequest("Subscription is already cancelled");
    
    // Update status
    studentSubject.Status = SubscriptionStatus.Cancelled;
    studentSubject.AutoRenew = false;
    studentSubject.UpdatedAt = DateTime.UtcNow;
    
    // Log cancellation
    var cancellationLog = new SubscriptionCancellation
    {
        StudentSubjectId = id,
        CancelledBy = parentId,
        CancelledAt = DateTime.UtcNow,
        Reason = dto.Reason
    };
    _context.SubscriptionCancellations.Add(cancellationLog);
    
    await _context.SaveChangesAsync();
    
    return Ok(new {
        success = true,
        message = "Subscription cancelled successfully",
        studentSubjectId = id,
        status = "Cancelled",
        cancelledAt = DateTime.UtcNow,
        refundAmount = 0.00,
        refundNote = "No refund for cancelled subscriptions"
    });
}

// DTO
public class CancelSubscriptionDto
{
    [Required]
    public string Reason { get; set; }
}
```

---

## 5. Database Schema Changes (If Needed)

### Option 1: Add Columns to StudentSubjects Table

```sql
-- Add AutoRenew column if not exists
ALTER TABLE StudentSubjects
ADD AutoRenew BIT DEFAULT 0;

-- Add Status column if not exists (or use existing IsActive)
ALTER TABLE StudentSubjects
ADD Status NVARCHAR(50) DEFAULT 'Active';
-- Possible values: Active, Expired, Cancelled, Pending
```

### Option 2: Create Cancellation Log Table

```sql
CREATE TABLE SubscriptionCancellations (
    Id INT PRIMARY KEY IDENTITY(1,1),
    StudentSubjectId INT NOT NULL,
    CancelledBy INT NOT NULL,
    CancelledAt DATETIME2 NOT NULL,
    Reason NVARCHAR(500),
    RefundAmount DECIMAL(18,2) DEFAULT 0,
    FOREIGN KEY (StudentSubjectId) REFERENCES StudentSubjects(Id),
    FOREIGN KEY (CancelledBy) REFERENCES AspNetUsers(Id)
);
```

---

## 6. Alternative Solutions (If Endpoints Cannot Be Created)

### For Auto-Renew:
- Could use existing update endpoint: `PUT /api/StudentSubjects/{id}`
- Just need to include `autoRenew` field in the request body

### For Invoice:
- Could return invoice data as JSON instead of PDF
- Frontend can format and display in a modal
- PDF generation can be added later

### For Cancellation:
- Could use soft delete: `DELETE /api/StudentSubjects/{id}`
- Or disable subscription by setting `IsActive = false`

---

## 7. Frontend Integration Plan

Once backend endpoints are ready:

### Step 1: Update Services
```typescript
// File: subscription.service.ts

updateAutoRenew(id: number, autoRenew: boolean): Observable<any> {
  return this.http.put(`${this.apiUrl}/StudentSubjects/${id}/auto-renew`, 
    { autoRenew });
}

downloadInvoice(orderId: number): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/Orders/${orderId}/invoice`, 
    { responseType: 'blob' });
}

cancelSubscription(id: number, reason: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/StudentSubjects/${id}/cancel`, 
    { reason });
}
```

### Step 2: Update Component
```typescript
// Remove placeholder alerts
// Call actual API methods
// Handle success/error responses
// Update UI accordingly
```

---

## 8. Testing Requirements

### Test Case 1: Auto-Renew Toggle
```
Given: Active subscription
When: Toggle auto-renew ON
Then: Backend persists change, returns success
And: Next billing cycle subscription will auto-renew

Given: Active subscription
When: Toggle auto-renew OFF
Then: Backend persists change, returns success
And: Subscription will not auto-renew after expiry
```

### Test Case 2: Download Invoice
```
Given: Completed order with payment
When: Click "Download Invoice"
Then: PDF file downloads OR invoice data displays
And: Invoice contains all order details

Given: Unpaid order
When: Click "Download Invoice"
Then: Show appropriate message (not available until paid)
```

### Test Case 3: Cancel Subscription
```
Given: Active subscription
When: Cancel with reason
Then: Status changes to "Cancelled"
And: AutoRenew is disabled
And: Parent receives confirmation

Given: Already cancelled subscription
When: Try to cancel again
Then: Show error "Already cancelled"
```

---

## 9. Priority and Timeline

### High Priority:
1. **Cancel Subscription** - Users need ability to cancel
2. **Auto-Renew Toggle** - Important for subscription management

### Medium Priority:
1. **Download Invoice** - Nice to have, but not critical

### Suggested Timeline:
- **Auto-Renew & Cancel:** 3-5 days
- **Invoice Download:** 1-2 weeks (if PDF generation needed)

---

## 10. Questions for Backend Team

### Question 1: Auto-Renew Logic
**Q:** How should auto-renewal work?
- Automatically charge card X days before expiry?
- Send notification to parent before renewal?
- What happens if payment fails?

### Question 2: Cancellation Policy
**Q:** What is the refund policy for cancellations?
- No refunds?
- Prorated refunds?
- Full refund within X days?

### Question 3: Invoice Generation
**Q:** Is PDF generation available?
- If yes, which library is being used?
- If no, can we return JSON data first?

### Question 4: Database Schema
**Q:** Does StudentSubjects table have these columns?
- `AutoRenew` (bit/boolean)?
- `Status` (varchar/string)?
- Or should we use existing `IsActive` field?

---

## 11. Summary

### Current State:
- ✅ Frontend UI complete
- ⚠️ 3 features need backend endpoints
- 📊 All buttons functional (with placeholders)

### Required Backend Work:
1. **Auto-Renew Toggle** - New endpoint needed
2. **Download Invoice** - New endpoint needed
3. **Cancel Subscription** - Endpoint may exist, needs verification

### Expected Outcome:
Once endpoints are implemented:
- ✅ Full subscription management
- ✅ Better user experience
- ✅ Complete feature parity

---

**Status:** ⏳ AWAITING BACKEND TEAM RESPONSE

**Please provide:**
1. Confirmation if these endpoints will be implemented
2. Expected implementation timeline
3. Answers to questions above
4. Database schema information

---

**Report Generated:** November 5, 2025  
**Report ID:** INQUIRY-SUBSCRIPTIONS-MANAGEMENT-001  
**Priority:** MEDIUM  
**Components:** My Subscriptions Page, Subscription Management
