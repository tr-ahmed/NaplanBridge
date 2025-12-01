# Backend Report: Session Pending Payment Status Issue

**Date:** December 1, 2025  
**Priority:** High  
**Component:** Private Sessions / Payment System  
**Technology:** .NET 8 / ASP.NET Core / Entity Framework Core

---

## Problem Description

عند قيام ولي الأمر بحجز session خاصة والانتقال لصفحة الدفع، ثم الرجوع بدون إتمام الدفع:
- يتم حفظ الـ session في قاعدة البيانات بحالة **Unknown** أو **NULL**
- لا تظهر هذه الحجوزات في صفحة My Bookings للمستخدم
- المستخدم لا يستطيع إتمام الدفع لاحقاً

---

## Current Behavior

1. User creates a booking
2. User is redirected to payment page
3. User clicks back/cancel before completing payment
4. Session is saved with status = `Unknown` or `NULL`
5. Session does not appear in any filter (upcoming, completed, cancelled)

---

## Expected Behavior

1. User creates a booking
2. Session should be created with status = `Pending` (status = 0)
3. User is redirected to payment page
4. If user cancels/goes back:
   - Session should be deleted or marked as cancelled
   - API endpoint should handle cancellation
5. When payment is completed:
   - Update status to `Confirmed` (status = 1)

---

## Current Status Enum (.NET 8)

**File:** `Models/SessionStatus.cs` or inline in `PrivateSession.cs`

```csharp
public enum SessionStatus
{
    Pending = 0,      // ⏳ Awaiting payment
    Confirmed = 1,    // ✅ Paid and confirmed
    Completed = 2,    // ✔️ Session finished
    Cancelled = 3,    // ❌ Cancelled by user
    NoShow = 4        // 🚫 Student didn't attend (optional)
}
```

**Note:** Based on existing reports, status values are 0-4. The issue is sessions with **NULL** or unexpected status values.

---

## Required Backend Changes (.NET 8)

### 1. Ensure Default Status on Session Creation

**File:** `Controllers/SessionsController.cs` (or `Services/SessionService.cs`)

**Current problematic code (example):**
```csharp
[HttpPost("book")]
[Authorize(Roles = "Parent")]
public async Task<IActionResult> BookSession([FromBody] BookSessionDto dto)
{
    var session = new PrivateSession
    {
        TeacherId = dto.TeacherId,
        StudentId = dto.StudentId,
        ScheduledDateTime = dto.ScheduledDateTime,
        DurationMinutes = dto.DurationMinutes,
        Price = dto.Price,
        // Status = ??, // ❌ May be null or not set
        CreatedAt = DateTime.UtcNow
    };

    _context.PrivateSessions.Add(session);
    await _context.SaveChangesAsync();

    // Create Stripe checkout session
    var checkoutUrl = await _stripeService.CreateCheckoutSession(session);

    return Ok(new { sessionId = session.Id, checkoutUrl });
}
```

**Should be:**
```csharp
[HttpPost("book")]
[Authorize(Roles = "Parent")]
public async Task<IActionResult> BookSession([FromBody] BookSessionDto dto)
{
    var session = new PrivateSession
    {
        TeacherId = dto.TeacherId,
        StudentId = dto.StudentId,
        ScheduledDateTime = dto.ScheduledDateTime,
        DurationMinutes = dto.DurationMinutes,
        Price = dto.Price,
        Status = SessionStatus.Pending,  // ✅ Explicitly set to Pending
        CreatedAt = DateTime.UtcNow
    };

    _context.PrivateSessions.Add(session);
    await _context.SaveChangesAsync();

    // Create Stripe checkout session
    var checkoutUrl = await _stripeService.CreateCheckoutSession(session);

    return Ok(new ApiResponse<BookingResponseDto>
    {
        Success = true,
        Data = new BookingResponseDto
        {
            SessionId = session.Id,
            StripeCheckoutUrl = checkoutUrl,
            StripeSessionId = session.StripeSessionId
        },
        Message = "Session booking initiated. Please complete payment."
    });
}
```

---

### 2. Add Payment Cancellation Endpoint

**File:** `Controllers/SessionsController.cs`

```csharp
/// <summary>
/// Handles payment cancellation when user exits Stripe checkout
/// Called from: /payment/cancel?session_id={stripeSessionId}&type=session-booking
/// </summary>
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
            return NotFound(new ApiResponse<bool>
            {
                Success = false,
                Message = "Session not found"
            });
        }

        // 2. Verify user owns this session (security check)
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var parent = await _context.Parents
            .FirstOrDefaultAsync(p => p.UserId == int.Parse(userId));

        if (parent == null || session.ParentId != parent.Id)
        {
            return Forbid();
        }

        // 3. Only allow cancellation for Pending sessions
        if (session.Status != SessionStatus.Pending)
        {
            return BadRequest(new ApiResponse<bool>
            {
                Success = false,
                Message = "Only pending sessions can be cancelled"
            });
        }

        // 4. Delete the session (or mark as Cancelled)
        // Option A: Delete completely
        _context.PrivateSessions.Remove(session);
        
        // Option B: Mark as cancelled (keeps record for audit)
        // session.Status = SessionStatus.Cancelled;
        // session.CancelledAt = DateTime.UtcNow;
        // session.CancellationReason = "Payment cancelled by user";

        await _context.SaveChangesAsync();

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Data = true,
            Message = "Session booking cancelled successfully"
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error cancelling session payment");
        return StatusCode(500, new ApiResponse<bool>
        {
            Success = false,
            Message = "An error occurred while cancelling the booking"
        });
    }
}
```

---

### 3. Update Model to Ensure Status is Never Null

**File:** `Models/PrivateSession.cs`

```csharp
public class PrivateSession
{
    public int Id { get; set; }
    public int TeacherId { get; set; }
    public int StudentId { get; set; }
    public int ParentId { get; set; }
    public DateTime ScheduledDateTime { get; set; }
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
    
    // ✅ Ensure Status always has a default value
    public SessionStatus Status { get; set; } = SessionStatus.Pending;
    
    public string? GoogleMeetLink { get; set; }
    public string? StripeSessionId { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
    public int? Rating { get; set; }
    public string? Feedback { get; set; }
    
    // Optional: For audit trail
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    // Navigation properties
    public Teacher Teacher { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Parent Parent { get; set; } = null!;
}
```

---

### 4. Update Database Migration (if needed)

**Create Migration:**

```bash
dotnet ef migrations add FixSessionStatusDefault
```

**Migration File:** `Migrations/XXXXXX_FixSessionStatusDefault.cs`

```csharp
public partial class FixSessionStatusDefault : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // 1. Set default value for Status column
        migrationBuilder.AlterColumn<int>(
            name: "Status",
            table: "PrivateSessions",
            nullable: false,
            defaultValue: 0); // SessionStatus.Pending

        // 2. Fix existing NULL status sessions
        migrationBuilder.Sql(
            "UPDATE PrivateSessions SET Status = 0 WHERE Status IS NULL OR Status NOT IN (0, 1, 2, 3, 4)"
        );

        // 3. Optional: Add cancellation fields
        migrationBuilder.AddColumn<DateTime>(
            name: "CancelledAt",
            table: "PrivateSessions",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "CancellationReason",
            table: "PrivateSessions",
            maxLength: 500,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "CancelledAt", table: "PrivateSessions");
        migrationBuilder.DropColumn(name: "CancellationReason", table: "PrivateSessions");
        
        migrationBuilder.AlterColumn<int>(
            name: "Status",
            table: "PrivateSessions",
            nullable: true);
    }
}
```

**Apply Migration:**
```bash
dotnet ef database update
```

---

### 5. Update API Response DTOs

**File:** `DTOs/PrivateSessionDto.cs`

```csharp
public class PrivateSessionDto
{
    public int Id { get; set; }
    public int TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int ParentId { get; set; }
    public string ParentName { get; set; } = string.Empty;
    public DateTime ScheduledDateTime { get; set; }
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
    
    // ✅ Status should always be a valid enum value (0-4)
    public SessionStatus Status { get; set; }
    
    // Optional: Include readable status text
    public string StatusText => GetStatusText(Status);
    
    public string? GoogleMeetLink { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? Notes { get; set; }
    public int? Rating { get; set; }
    public string? Feedback { get; set; }

    private static string GetStatusText(SessionStatus status)
    {
        return status switch
        {
            SessionStatus.Pending => "Pending Payment",
            SessionStatus.Confirmed => "Confirmed",
            SessionStatus.Completed => "Completed",
            SessionStatus.Cancelled => "Cancelled",
            SessionStatus.NoShow => "No Show",
            _ => "Unknown"
        };
    }
}
```

---

## API Endpoints Summary

### Existing Endpoints (Should Already Work)
✅ `POST /api/Sessions/book` - Creates session with Status=Pending  
✅ `POST /api/Sessions/confirm-payment/{stripeSessionId}` - Updates to Confirmed  
✅ `GET /api/Sessions/parent/bookings` - Returns all parent bookings  

### New Required Endpoint
🆕 `POST /api/Sessions/cancel-payment/{stripeSessionId}` - Deletes/cancels pending session

---

## Testing Checklist

- [ ] Create a new booking without completing payment
- [ ] Verify session is saved with Status = 0 (Pending)
- [ ] Click back/cancel on Stripe page
- [ ] Verify cancel endpoint is called
- [ ] Verify session is deleted or status updated to Cancelled
- [ ] Verify session does NOT appear in My Bookings (if deleted)
- [ ] Verify session appears as Cancelled (if status updated)
- [ ] Complete a payment successfully
- [ ] Verify session status updates to 1 (Confirmed)
- [ ] Check database: no sessions with NULL status

---

## Database Schema Verification

```sql
-- Check for sessions with invalid status
SELECT Id, Status, ScheduledDateTime, CreatedAt
FROM PrivateSessions
WHERE Status IS NULL OR Status NOT IN (0, 1, 2, 3, 4);

-- Fix any existing invalid sessions
UPDATE PrivateSessions 
SET Status = 0  -- Pending
WHERE Status IS NULL OR Status NOT IN (0, 1, 2, 3, 4);

-- Verify constraint
ALTER TABLE PrivateSessions 
ALTER COLUMN Status INT NOT NULL DEFAULT 0;
```

---

## Frontend Changes Already Implemented ✅

1. Added handling for "Pending Payment" status (Status = 0)
2. Display sessions with Unknown/NULL status as "Pending Payment"
3. Orange badge with payment icon for pending payment sessions
4. "Complete Payment Now" button to redirect to payment page
5. Warning message indicating payment is required

**Frontend Files Updated:**
- ✅ `my-bookings.component.ts` - Status handling
- ✅ `my-bookings.component.html` - UI display

---

## Priority

**HIGH** - This affects user experience significantly as users cannot complete their bookings after starting the payment process.

---

## Related Files (.NET 8)

**Backend:**
- `Models/PrivateSession.cs`
- `Models/SessionStatus.cs` (or enum in PrivateSession.cs)
- `Controllers/SessionsController.cs`
- `Services/StripeService.cs`
- `DTOs/PrivateSessionDto.cs`
- `Migrations/XXXXXX_FixSessionStatusDefault.cs`

**Frontend:**
- `my-bookings.component.ts` ✅ Updated
- `my-bookings.component.html` ✅ Updated

---

## Notes

- ✅ System uses .NET 8 / ASP.NET Core / Entity Framework Core
- ✅ Status values: 0=Pending, 1=Confirmed, 2=Completed, 3=Cancelled, 4=NoShow
- ⚠️ Ensure Status column has NOT NULL constraint with default value 0
- ⚠️ Add cancellation endpoint to handle payment abandonment
- 💡 Consider adding cleanup job to delete/cancel sessions pending >24 hours

---

**END OF REPORT**
