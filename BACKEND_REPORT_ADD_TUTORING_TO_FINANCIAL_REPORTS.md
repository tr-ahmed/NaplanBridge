# 📌 BACKEND REPORT: Add Tutoring to Financial Reports

## Issue Summary

The **Admin Financial Reports** (`/api/Reports/financial/detailed`, `/api/Reports/financial/summary-by-source`, `/api/Reports/financial/detailed/export`) currently only show revenue from two sources:
1. **Session** – Legacy private tutoring sessions
2. **Subscription** – Subject plan subscriptions

The new **Tutoring Packages** system (smart scheduling tutoring with packages, discounts, and multiple students/subjects) is **NOT included** in the financial reports.

---

## Current State

### Existing `paymentSource` Values
```csharp
public enum PaymentSource
{
    Session,       // Legacy private tutoring
    Subscription   // Subject subscriptions
}
```

### Missing Source
```csharp
Tutoring  // New Tutoring Packages system (TutoringOrders, TutoringPackages, TutoringSessions)
```

---

## Expected Behavior

### 1. Add `Tutoring` as a New Payment Source

Update `PaymentSource` enum (or string values):
```csharp
public enum PaymentSource
{
    Session,       // Legacy private tutoring
    Subscription,  // Subject subscriptions  
    Tutoring       // NEW: Tutoring Packages system
}
```

### 2. Include Tutoring Orders in Financial Reports

The backend should query the `TutoringOrders` table for successful payments and include them in the financial report.

#### Tutoring Data to Include:

| Field | Source |
|-------|--------|
| `transactionId` | TutoringOrder.Id |
| `orderId` | TutoringOrder.Id |
| `date` | TutoringOrder.CreatedAt or PaidAt |
| `amount` | TutoringOrder.TotalAmount |
| `currency` | TutoringOrder.Currency (default: "AUD") |
| `paymentStatus` | TutoringOrder.Status |
| `paymentSource` | `"Tutoring"` |
| `student` | TutoringOrder.Parent → Students |

#### TutoringDetails DTO (New)
```csharp
public class TutoringDetailsDto
{
    public int TutoringOrderId { get; set; }
    public string PackageSummary { get; set; }  // e.g., "3 Students × 2 Subjects × 4 Hours"
    public int TotalHours { get; set; }
    public int TotalStudents { get; set; }
    public int TotalSubjects { get; set; }
    public decimal Discount { get; set; }       // Total discount applied
    public string DiscountBreakdown { get; set; } // e.g., "Package: 5%, Multi-Subject: 3%"
}
```

### 3. Update DTOs

#### DetailedFinancialTransactionDto
```csharp
public class DetailedFinancialTransactionDto
{
    // ... existing fields ...
    public string PaymentSource { get; set; }  // "Session" | "Subscription" | "Tutoring"
    public SessionDetailsDto? SessionDetails { get; set; }
    public SubscriptionDetailsDto? SubscriptionDetails { get; set; }
    public TutoringDetailsDto? TutoringDetails { get; set; }  // NEW
}
```

#### FinancialSummaryDto
```csharp
public class FinancialSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalSessions { get; set; }
    public decimal SessionsRevenue { get; set; }
    public int TotalSubscriptions { get; set; }
    public decimal SubscriptionsRevenue { get; set; }
    // NEW: Tutoring
    public int TotalTutoringOrders { get; set; }
    public decimal TutoringRevenue { get; set; }
    public string Currency { get; set; }
}
```

### 4. Update Filter Options

The `paymentSource` filter should support:
- `All` – All sources (Sessions + Subscriptions + Tutoring)
- `Session` – Legacy sessions only
- `Subscription` – Subscriptions only
- `Tutoring` – Tutoring packages only

---

## API Endpoints to Update

### 1. `GET /api/Reports/financial/detailed`

**Query Parameters:**
```
startDate: string
endDate: string
paymentSource: "All" | "Session" | "Subscription" | "Tutoring"
page: number
pageSize: number
```

**Response Changes:**
- Include `TutoringDetails` when `paymentSource` is `"Tutoring"`
- Include tutoring in `summary.totalTutoringOrders` and `summary.tutoringRevenue`
- Update `summary.totalRevenue` to include tutoring revenue

### 2. `GET /api/Reports/financial/summary-by-source`

**Response Changes:**
- Add "Tutoring" in `sources[]` array with:
  - `source: "Tutoring"`
  - `count: number` (number of tutoring orders)
  - `revenue: number`
  - `percentage: number`
  - `averageTransactionValue: number`

### 3. `GET /api/Reports/financial/detailed/export`

**Changes:**
- Include Tutoring transactions in Excel/PDF/CSV exports
- Add columns for tutoring-specific data (students count, subjects count, hours, discount)

---

## Database Context

### Tutoring Tables to Query
```sql
-- Main order table
TutoringOrders (
    Id, ParentId, TotalAmount, OriginalAmount, 
    DiscountAmount, Currency, Status, SessionToken,
    CreatedAt, UpdatedAt, PaidAt
)

-- Package details (per student)
TutoringPackages (
    Id, TutoringOrderId, StudentId, SubjectId,
    TeacherId, WeeklyHours, TotalWeeks, PricePerHour,
    TotalPrice, Status, ...
)

-- Individual sessions
TutoringSessions (
    Id, TutoringPackageId, ScheduledDate, 
    ScheduledTime, Duration, Status, ...
)
```

### Query Logic
```csharp
// Get all successful tutoring orders in date range
var tutoringOrders = await _context.TutoringOrders
    .Include(o => o.Parent)
        .ThenInclude(p => p.Students)
    .Include(o => o.Packages)
        .ThenInclude(p => p.Subject)
    .Where(o => o.Status == "Paid" || o.Status == "Completed")
    .Where(o => o.PaidAt >= startDate && o.PaidAt <= endDate)
    .ToListAsync();
```

---

## Impact

### Frontend Ready
The frontend `financial-reports.component.html` is already designed to handle multiple payment sources. It just needs:
1. A new filter option: `<option value="Tutoring">Tutoring Only</option>`
2. A new summary card for "Tutoring Revenue"
3. Display of `tutoringDetails` in the transaction details column

### Business Value
- Complete financial visibility across all revenue streams
- Accurate revenue reporting for the new tutoring package system
- Better financial planning and analysis

---

## Request

Please implement the following:

1. ✅ Add `"Tutoring"` as a valid `PaymentSource` value
2. ✅ Create `TutoringDetailsDto` 
3. ✅ Update `DetailedFinancialTransactionDto` to include `TutoringDetails`
4. ✅ Update `FinancialSummaryDto` to include tutoring counts and revenue
5. ✅ Modify `/api/Reports/financial/detailed` to query and include `TutoringOrders`
6. ✅ Modify `/api/Reports/financial/summary-by-source` to include tutoring in sources
7. ✅ Modify `/api/Reports/financial/detailed/export` to include tutoring data
8. ✅ Update filter logic to support `paymentSource = "Tutoring"`

---

## Confirmation Required

```
✔ BACKEND FIX CONFIRMED
```

Once confirmed, I will update the frontend to:
- Add the "Tutoring Only" filter option
- Add a "Tutoring Revenue" summary card
- Display tutoring details in the transactions table
