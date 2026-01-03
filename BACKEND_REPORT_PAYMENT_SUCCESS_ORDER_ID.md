# Backend Report: Payment Success Missing Order ID

**Date:** January 3, 2026  
**Priority:** HIGH  
**Status:** NEEDS BACKEND FIX

## Problem

When a customer completes a payment, the Order Number displayed on the success page shows a fixed value (like #1) instead of the actual order ID from the payment transaction.

### Current Behavior

1. User completes payment via Stripe
2. Redirected to `/payment-success?session_id=cs_test_xxx`
3. Frontend calls `GET /api/Payment/success?session_id={sessionId}`
4. Backend response does NOT include `orderId`
5. Frontend falls back to hardcoded value or localStorage fallback
6. User sees incorrect order number

### Expected Behavior

1. Backend should return the actual `orderId` in the payment success response
2. User should see their real order number (e.g., #1234, #1235, etc.)
3. Order details should load with real transaction data

## Technical Details

### Frontend Implementation (COMPLETED ✅)

**File:** `src/app/features/payment-success/payment-success.component.ts`

The frontend has been updated to:

1. Accept `orderId` from backend response
2. Fall back to pending order (localStorage) if available
3. Add detailed logging to track order ID source
4. Only show generic success if NO order ID is available anywhere

```typescript
// Set order ID if available from response or pending order
if (response.orderId) {
  console.log("✅ Using order ID from backend response:", response.orderId);
  this.orderId.set(response.orderId);
  this.loadOrderDetails(response.orderId);
} else if (this.pendingOrder?.orderId) {
  console.log("✅ Using order ID from pending order (localStorage):", this.pendingOrder.orderId);
  this.orderId.set(this.pendingOrder.orderId);
  this.loadOrderDetails(this.pendingOrder.orderId);
} else if (!this.orderId()) {
  console.warn("⚠️ No order ID available from backend or localStorage");
  this.orderDetails.set({
    totalAmount: this.pendingOrder?.amount || 0,
    items: [],
  });
}
```

### Backend Changes Required ❌

**Endpoint:** `GET /api/Payment/success`

**Current Response:**

```csharp
return Ok(new
{
    success = true,
    message = "Payment successful! Your subscriptions are being activated.",
    sessionId = sessionId
});
```

**Required Response:**

```csharp
return Ok(new
{
    success = true,
    message = "Payment successful! Your subscriptions are being activated.",
    sessionId = sessionId,
    orderId = order.Id  // ⬅️ ADD THIS
});
```

### Implementation Steps for Backend

1. **Locate the Payment Success Endpoint**

   - File: `Controllers/PaymentController.cs`
   - Method: `GET /api/Payment/success`

2. **Retrieve Order ID from Stripe Session**

   ```csharp
   [HttpGet("success")]
   public async Task<IActionResult> Success([FromQuery] string session_id)
   {
       try
       {
           // Get Stripe session
           var service = new SessionService();
           var session = await service.GetAsync(session_id);

           // Get order ID from metadata or database
           var orderId = session.Metadata["orderId"];
           // OR find order by session ID
           var order = await _context.Orders
               .FirstOrDefaultAsync(o => o.StripeSessionId == session_id);

           if (order == null)
           {
               return BadRequest(new {
                   success = false,
                   message = "Order not found"
               });
           }

           // Process subscriptions...

           return Ok(new
           {
               success = true,
               message = "Payment successful! Your subscriptions are being activated.",
               sessionId = session_id,
               orderId = order.Id  // ⬅️ INCLUDE THIS
           });
       }
       catch (Exception ex)
       {
           _logger.LogError(ex, "Error processing payment success");
           return StatusCode(500, new {
               success = false,
               message = "Error processing payment"
           });
       }
   }
   ```

3. **Update Response Model**
   ```csharp
   public class PaymentSuccessResponse
   {
       public bool Success { get; set; }
       public string Message { get; set; }
       public string SessionId { get; set; }
       public int OrderId { get; set; }  // ⬅️ ADD THIS
   }
   ```

## Testing Checklist

After backend implementation:

- [ ] Complete a test payment
- [ ] Check browser console logs for:
  - `✅ Using order ID from backend response: [actual number]`
- [ ] Verify Order Number displays correctly (e.g., #1234)
- [ ] Verify order details load successfully
- [ ] Test with both cart checkout and session booking
- [ ] Verify email receipt includes correct order number

## Impact

**User Experience:**

- Users cannot track their orders accurately
- Support team cannot identify transactions easily
- Receipts may show incorrect order references

**Business Impact:**

- Poor user experience after payment
- Increased support tickets
- Difficulty reconciling payments

## References

- Frontend File: `src/app/features/payment-success/payment-success.component.ts`
- Frontend Service: `src/app/core/services/payment.service.ts`
- API Endpoint: `GET /api/Payment/success?session_id={sessionId}`
