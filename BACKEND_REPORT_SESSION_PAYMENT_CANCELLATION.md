# 📌 BACKEND REPORT - Session Payment Cancellation Issue

## 📅 Date: December 1, 2025
## 🎯 Priority: HIGH - Data Integrity Issue

---

## 🐛 Problem Description

When a parent books a private session and cancels the payment on the Stripe checkout page, the session is incorrectly flagged as booked and appears in "My Bookings" with status "Unknown".

### 🔴 Current Behavior (WRONG):

1. Parent clicks "Book Session" → Session created in database (Status = ?)
2. Parent redirected to Stripe payment page
3. **Parent clicks "Cancel" or closes Stripe page**
4. Stripe redirects to: `/payment/cancel`
5. **Session remains in database with unknown/pending status**
6. Session appears in "My Bookings" page with tag: **"Unknown"**
7. Session cannot be used, cancelled, or cleaned up

### ✅ Expected Behavior (CORRECT):

1. Parent clicks "Book Session" → Session created (Status = PendingPayment)
2. Parent redirected to Stripe payment page
3. **Parent clicks "Cancel" or closes Stripe page**
4. Stripe redirects to: `/payment/cancel?session_id={CHECKOUT_SESSION_ID}&type=session-booking`
5. **Backend endpoint called to handle cancellation**
6. **Session deleted from database OR status updated to "Cancelled"**
7. Session does NOT appear in "My Bookings"

---

## 🔍 Root Cause Analysis

### Issue 1: Missing Cancellation Handler

**Endpoint Missing:**
```
GET/POST /api/Sessions/cancel-payment/{stripeSessionId}
```

Currently, when payment is cancelled:
- Frontend redirects to `/payment/cancel`
- **No API call is made to backend**
- Session remains in limbo state

### Issue 2: Unknown Status Value

**Current Status Enum (Backend):**
```csharp
// Expected enum values:
public enum SessionStatus 
{
    Pending = 0,          // ⏳ Awaiting payment
    Confirmed = 1,        // ✅ Paid and confirmed
    Completed = 2,        // ✔️ Session finished
    Cancelled = 3         // ❌ Cancelled by user
}
```

**Problem:** Backend is returning a status value that doesn't match these (possibly `null`, `4`, or a string like `"PendingPayment"`).

**Frontend Mapping:**
```typescript
const statusMap = {
  '0': 'Pending',
  '1': 'Confirmed',
  '2': 'Completed',
  '3': 'Cancelled'
};
return statusMap[statusStr] || 'Unknown';  // ← Returns "Unknown"
```

---

## 🛠️ Required Backend Changes

### Change 1: Add Payment Cancellation Endpoint ⭐ CRITICAL

**Create new endpoint:**

```csharp
// In SessionsController.cs

[HttpPost("cancel-payment/{stripeSessionId}")]
[Authorize(Roles = "Parent")]
public async Task<IActionResult> CancelSessionPayment(string stripeSessionId)
{
    try
    {
        // 1. Find session by Stripe session ID
        var session = await _context.PrivateSessions
            .FirstOrDefaultAsync(s => s.StripeSessionId == stripeSessionId);
        
        if (session == null)
        {
            return NotFound(new { success = false, message = "Session not found" });
        }
        
        // 2. Verify user owns this session
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (session.ParentId.ToString() != userId)
        {
            return Forbid();
        }
        
        // 3. Only cancel if payment is still pending
        if (session.Status != SessionStatus.Pending && 
            session.Status != SessionStatus.PendingPayment)
        {
            return BadRequest(new { 
                success = false, 
                message = "Cannot cancel - payment already processed" 
            });
        }
        
        // Option A: Delete the session (recommended for unpaid bookings)
        _context.PrivateSessions.Remove(session);
        await _context.SaveChangesAsync();
        
        // Option B: Mark as cancelled (if you want to keep records)
        // session.Status = SessionStatus.Cancelled;
        // session.CancellationReason = "Payment cancelled by user";
        // session.CancelledAt = DateTime.UtcNow;
        // await _context.SaveChangesAsync();
        
        return Ok(new { 
            success = true, 
            message = "Session booking cancelled successfully",
            data = true
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error cancelling session payment");
        return StatusCode(500, new { 
            success = false, 
            message = "Failed to cancel session" 
        });
    }
}
```

### Change 2: Update Stripe Checkout Creation

**Modify session booking endpoint:**

```csharp
// In SessionBookingService.cs or SessionsController.cs

// When creating Stripe checkout session:
var options = new SessionCreateOptions
{
    SuccessUrl = $"{frontendUrl}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&type=session-booking",
    CancelUrl = $"{frontendUrl}/payment/cancel?session_id={{CHECKOUT_SESSION_ID}}&type=session-booking",
    //                                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                                                        ADD THIS PARAMETER
    // ... rest of options
};
```

### Change 3: Fix Status Enum Consistency ⭐ CRITICAL

**Ensure database uses correct status values:**

```csharp
// When creating new session booking:
var newSession = new PrivateSession
{
    // ... other fields
    Status = SessionStatus.Pending,  // ← Must be 0 (not null, not 4)
    CreatedAt = DateTime.UtcNow
};
```

**Verify PrivateSession entity:**

```csharp
public class PrivateSession
{
    // ...
    [Required]
    public SessionStatus Status { get; set; } = SessionStatus.Pending;  // ← Default value
    
    public string? StripeSessionId { get; set; }  // ← Must be populated
    // ...
}
```

### Change 4: Add Webhook Handler (Optional but Recommended)

**Handle Stripe webhook for checkout.session.expired:**

```csharp
// In StripeWebhookController.cs

[HttpPost("webhook")]
public async Task<IActionResult> HandleStripeWebhook()
{
    var json = await new StreamReader(Request.Body).ReadToEndAsync();
    
    try
    {
        var stripeEvent = EventUtility.ConstructEvent(
            json, 
            Request.Headers["Stripe-Signature"], 
            _webhookSecret
        );
        
        if (stripeEvent.Type == Events.CheckoutSessionExpired)
        {
            var session = stripeEvent.Data.Object as Session;
            
            // Find and delete/cancel the session
            var privateSession = await _context.PrivateSessions
                .FirstOrDefaultAsync(s => s.StripeSessionId == session.Id);
            
            if (privateSession != null && 
                privateSession.Status == SessionStatus.Pending)
            {
                _context.PrivateSessions.Remove(privateSession);
                await _context.SaveChangesAsync();
            }
        }
        
        return Ok();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Stripe webhook error");
        return BadRequest();
    }
}
```

---

## 🧪 Testing Checklist

After implementing the changes, test:

### Test 1: Payment Cancellation
1. ✅ Login as Parent
2. ✅ Book a private session
3. ✅ On Stripe page, click "Back" or close tab
4. ✅ Verify redirected to `/payment/cancel?session_id=cs_test_...&type=session-booking`
5. ✅ Verify session is deleted from database
6. ✅ Verify session does NOT appear in "My Bookings"

### Test 2: Session Status Values
1. ✅ Book a session → Check database: `Status = 0` (Pending)
2. ✅ Complete payment → Check database: `Status = 1` (Confirmed)
3. ✅ Verify frontend shows correct status (not "Unknown")

### Test 3: Successful Payment Flow (Regression Test)
1. ✅ Book session → Complete payment → Verify works as before
2. ✅ Check "My Bookings" → Session shows as "Confirmed"
3. ✅ Verify Google Meet link is present

---

## 📊 Database Verification Queries

### Check for orphaned sessions:
```sql
-- Find sessions with no payment that are older than 1 hour
SELECT 
    Id, 
    StudentId, 
    TeacherId, 
    Status, 
    StripeSessionId,
    CreatedAt,
    PaidAt
FROM PrivateSessions
WHERE Status = 0 
  AND PaidAt IS NULL
  AND CreatedAt < DATEADD(HOUR, -1, GETUTCDATE())
ORDER BY CreatedAt DESC;
```

### Check for unknown status values:
```sql
-- Find sessions with invalid status
SELECT 
    Id, 
    Status, 
    COUNT(*) as Count
FROM PrivateSessions
WHERE Status NOT IN (0, 1, 2, 3)
GROUP BY Id, Status;
```

### Cleanup orphaned sessions (if needed):
```sql
-- ⚠️ Run with caution - deletes unpaid sessions older than 24 hours
DELETE FROM PrivateSessions
WHERE Status = 0 
  AND PaidAt IS NULL
  AND CreatedAt < DATEADD(HOUR, -24, GETUTCDATE());
```

---

## 🚀 Frontend Changes (Already Ready)

The frontend is already prepared to handle payment cancellation. Once backend implements the endpoint, it will automatically work.

**Current Frontend Code:**
```typescript
// payment-cancel.component.ts
// Currently just shows cancellation message
// Need to add API call to backend cancellation endpoint
```

**Required Frontend Update:**
```typescript
ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    const sessionId = params['session_id'];
    const type = params['type'];
    
    if (sessionId && type === 'session-booking') {
      // Call backend to cancel session
      this.sessionService.cancelPayment(sessionId).subscribe({
        next: () => console.log('Session cancelled'),
        error: (err) => console.error('Cancellation failed', err)
      });
    }
  });
}
```

---

## 💡 Impact Assessment

### User Impact:
- **HIGH** - Users see "Unknown" sessions that cannot be managed
- Sessions occupy database space unnecessarily
- Confusing UX - users don't know what "Unknown" means

### Data Impact:
- **MEDIUM** - Orphaned records in database
- Potential for duplicate bookings if user retries

### Business Impact:
- **LOW** - No financial loss (payment not completed)
- But affects user trust and system reliability

---

## 📝 Summary

### Root Causes:
1. ❌ Missing payment cancellation endpoint
2. ❌ Stripe CancelUrl doesn't include `&type=session-booking`
3. ❌ Backend returning invalid status values (not 0-3)
4. ❌ No cleanup mechanism for abandoned bookings

### Required Actions:
1. ✅ Create `POST /api/Sessions/cancel-payment/{stripeSessionId}` endpoint
2. ✅ Update Stripe CancelUrl to include payment type
3. ✅ Fix SessionStatus enum consistency (ensure 0-3 only)
4. ✅ Add Stripe webhook handler for expired checkouts (optional)

### Estimated Time:
- Backend implementation: **2-3 hours**
- Testing: **1 hour**
- Frontend update: **30 minutes**
- **Total: 4 hours**

---

## 📞 Contact

**Reported by:** Frontend Team  
**Date:** December 1, 2025  
**Status:** ⏳ Awaiting Backend Implementation  

**Please confirm when:**
1. ✅ Endpoint is implemented
2. ✅ Deployed to staging/production
3. ✅ Ready for testing

---

## ✅ Definition of DONE

This issue is resolved when:

| Requirement | Status |
|-------------|--------|
| Payment cancellation endpoint exists | ⏳ Pending |
| Stripe CancelUrl includes `&type=session-booking` | ⏳ Pending |
| Cancelled sessions are deleted/marked cancelled | ⏳ Pending |
| No "Unknown" status appears in UI | ⏳ Pending |
| All tests pass | ⏳ Pending |
| Deployed to production | ⏳ Pending |

**Once all items are ✅, issue is RESOLVED.**
