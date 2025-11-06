# 🔧 Backend Change Report

**Date:** November 6, 2025  
**Feature:** Detailed Financial Report with Payment Source Breakdown  
**Status:** Required - New Implementation  
**Priority:** High

---

## 1. Reason for Change

The current financial reporting system (`/api/Reports/financial`) provides basic revenue information but lacks detailed breakdown of payment sources and transaction context.

**Business Requirement:**
Administrators need a comprehensive financial report that clearly shows:
- Whether payments came from **Private Sessions** or **Course Subscriptions**
- For Session payments: Student name, Subject, Year level, and Teacher name
- For Subscription payments: Student name, Subject, Year level, Plan details
- Date range filtering and export capabilities

**Current Gap:**
Existing endpoints don't provide this level of detail with complete context for each transaction.

---

## 2. Required New Endpoints

### 2.1 Get Detailed Financial Report

**Endpoint:** `GET /api/Reports/financial/detailed`

**Query Parameters:**
- `startDate` (required): `yyyy-MM-dd`
- `endDate` (required): `yyyy-MM-dd`
- `paymentSource` (optional): `Session` | `Subscription` | `All` (default: All)
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 50)

**Controller:** `ReportsController`

**Action:** `GetDetailedFinancialReport`

**Authorization:** Admin role required

**Description:** Returns paginated detailed financial transactions with full context including payment source, student info, and related entity details.

**Response Schema:**
```json
{
  "transactions": [
    {
      "transactionId": 12345,
      "orderId": 789,
      "date": "2025-11-06T14:30:00Z",
      "amount": 150.00,
      "currency": "AUD",
      "paymentStatus": "Paid",
      "paymentSource": "Session", // or "Subscription"
      
      // Student Information
      "student": {
        "id": 101,
        "fullName": "Ahmed Ali Mohamed",
        "email": "ahmed@example.com"
      },
      
      // Payment Source Details (Session)
      "sessionDetails": {
        "sessionId": 456,
        "subject": "Mathematics",
        "year": "Year 7",
        "teacher": {
          "id": 25,
          "fullName": "John Smith",
          "email": "john.smith@naplanbridge.com"
        },
        "sessionDate": "2025-11-10T15:00:00Z",
        "duration": 60
      },
      
      // OR Payment Source Details (Subscription)
      "subscriptionDetails": {
        "subscriptionId": 789,
        "subject": "English",
        "year": "Year 8",
        "planType": "Monthly",
        "planName": "Year 8 English - Monthly",
        "startDate": "2025-11-01",
        "endDate": "2025-11-30",
        "termNumber": 1
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 50,
    "totalItems": 250,
    "totalPages": 5
  },
  "summary": {
    "totalRevenue": 37500.00,
    "totalSessions": 125,
    "sessionsRevenue": 18750.00,
    "totalSubscriptions": 125,
    "subscriptionsRevenue": 18750.00,
    "currency": "AUD"
  }
}
```

---

### 2.2 Export Detailed Financial Report

**Endpoint:** `GET /api/Reports/financial/detailed/export`

**Query Parameters:**
- `startDate` (required): `yyyy-MM-dd`
- `endDate` (required): `yyyy-MM-dd`
- `paymentSource` (optional): `Session` | `Subscription` | `All`
- `format` (optional): `excel` | `pdf` | `csv` (default: excel)

**Controller:** `ReportsController`

**Action:** `ExportDetailedFinancialReport`

**Authorization:** Admin role required

**Description:** Exports detailed financial report in the specified format.

**Response:** Binary file (Excel/PDF/CSV)

---

### 2.3 Get Financial Summary by Source

**Endpoint:** `GET /api/Reports/financial/summary-by-source`

**Query Parameters:**
- `startDate` (required): `yyyy-MM-dd`
- `endDate` (required): `yyyy-MM-dd`

**Controller:** `ReportsController`

**Action:** `GetFinancialSummaryBySource`

**Authorization:** Admin role required

**Description:** Returns aggregated financial summary grouped by payment source.

**Response Schema:**
```json
{
  "period": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-30"
  },
  "summary": {
    "totalRevenue": 37500.00,
    "currency": "AUD",
    "sources": [
      {
        "source": "Sessions",
        "count": 125,
        "revenue": 18750.00,
        "percentage": 50.0,
        "averageTransactionValue": 150.00
      },
      {
        "source": "Subscriptions",
        "count": 125,
        "revenue": 18750.00,
        "percentage": 50.0,
        "averageTransactionValue": 150.00
      }
    ]
  },
  "topTeachers": [
    {
      "teacherId": 25,
      "teacherName": "John Smith",
      "sessionsCount": 45,
      "sessionsRevenue": 6750.00
    }
  ],
  "topSubjects": [
    {
      "subjectId": 10,
      "subjectName": "Mathematics Year 7",
      "totalRevenue": 12000.00,
      "sessionsRevenue": 5000.00,
      "subscriptionsRevenue": 7000.00
    }
  ]
}
```

---

## 3. Suggested Backend Implementation

### 3.1 Create DTOs

**DetailedFinancialTransactionDto.cs**
```csharp
public class DetailedFinancialTransactionDto
{
    public int TransactionId { get; set; }
    public int OrderId { get; set; }
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; }
    public string PaymentStatus { get; set; }
    public string PaymentSource { get; set; } // "Session" or "Subscription"
    
    public StudentInfoDto Student { get; set; }
    public SessionDetailsDto? SessionDetails { get; set; }
    public SubscriptionDetailsDto? SubscriptionDetails { get; set; }
}

public class StudentInfoDto
{
    public int Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
}

public class SessionDetailsDto
{
    public int SessionId { get; set; }
    public string Subject { get; set; }
    public string Year { get; set; }
    public TeacherInfoDto Teacher { get; set; }
    public DateTime SessionDate { get; set; }
    public int Duration { get; set; }
}

public class TeacherInfoDto
{
    public int Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
}

public class SubscriptionDetailsDto
{
    public int SubscriptionId { get; set; }
    public string Subject { get; set; }
    public string Year { get; set; }
    public string PlanType { get; set; }
    public string PlanName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TermNumber { get; set; }
}

public class DetailedFinancialReportDto
{
    public List<DetailedFinancialTransactionDto> Transactions { get; set; }
    public PaginationDto Pagination { get; set; }
    public FinancialSummaryDto Summary { get; set; }
}

public class FinancialSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalSessions { get; set; }
    public decimal SessionsRevenue { get; set; }
    public int TotalSubscriptions { get; set; }
    public decimal SubscriptionsRevenue { get; set; }
    public string Currency { get; set; }
}
```

---

### 3.2 Update ReportsController

```csharp
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportsService _reportsService;

    public ReportsController(IReportsService reportsService)
    {
        _reportsService = reportsService;
    }

    [HttpGet("financial/detailed")]
    public async Task<ActionResult<DetailedFinancialReportDto>> GetDetailedFinancialReport(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] string? paymentSource = "All",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (startDate > endDate)
            return BadRequest("Start date must be before end date");

        var report = await _reportsService.GetDetailedFinancialReportAsync(
            startDate, endDate, paymentSource, page, pageSize);
        
        return Ok(report);
    }

    [HttpGet("financial/detailed/export")]
    public async Task<IActionResult> ExportDetailedFinancialReport(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] string? paymentSource = "All",
        [FromQuery] string format = "excel")
    {
        var fileBytes = await _reportsService.ExportDetailedFinancialReportAsync(
            startDate, endDate, paymentSource, format);

        var contentType = format.ToLower() switch
        {
            "pdf" => "application/pdf",
            "csv" => "text/csv",
            _ => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        };

        var extension = format.ToLower() switch
        {
            "pdf" => "pdf",
            "csv" => "csv",
            _ => "xlsx"
        };

        return File(fileBytes, contentType, 
            $"financial_report_{DateTime.Now:yyyyMMdd}.{extension}");
    }

    [HttpGet("financial/summary-by-source")]
    public async Task<ActionResult<FinancialSummaryBySourceDto>> GetFinancialSummaryBySource(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var summary = await _reportsService.GetFinancialSummaryBySourceAsync(
            startDate, endDate);
        
        return Ok(summary);
    }
}
```

---

### 3.3 Implement IReportsService

```csharp
public interface IReportsService
{
    Task<DetailedFinancialReportDto> GetDetailedFinancialReportAsync(
        DateTime startDate, 
        DateTime endDate, 
        string paymentSource, 
        int page, 
        int pageSize);
    
    Task<byte[]> ExportDetailedFinancialReportAsync(
        DateTime startDate, 
        DateTime endDate, 
        string paymentSource, 
        string format);
    
    Task<FinancialSummaryBySourceDto> GetFinancialSummaryBySourceAsync(
        DateTime startDate, 
        DateTime endDate);
}

public class ReportsService : IReportsService
{
    private readonly ApplicationDbContext _context;

    public ReportsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DetailedFinancialReportDto> GetDetailedFinancialReportAsync(
        DateTime startDate, 
        DateTime endDate, 
        string paymentSource, 
        int page, 
        int pageSize)
    {
        // Get all paid orders in date range
        var ordersQuery = _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Subscription)
                    .ThenInclude(s => s.Subject)
                        .ThenInclude(sub => sub.Year)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.PrivateSession)
                    .ThenInclude(ps => ps.Subject)
                        .ThenInclude(s => s.Year)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.PrivateSession)
                    .ThenInclude(ps => ps.Teacher)
            .Include(o => o.Student)
            .Where(o => 
                o.OrderStatus == OrderStatus.Paid &&
                o.CreatedAt >= startDate &&
                o.CreatedAt <= endDate);

        // Apply payment source filter
        if (paymentSource != "All")
        {
            if (paymentSource == "Session")
            {
                ordersQuery = ordersQuery.Where(o => 
                    o.OrderItems.Any(oi => oi.PrivateSessionId != null));
            }
            else if (paymentSource == "Subscription")
            {
                ordersQuery = ordersQuery.Where(o => 
                    o.OrderItems.Any(oi => oi.SubscriptionId != null));
            }
        }

        // Get total count
        var totalItems = await ordersQuery.CountAsync();

        // Get paginated orders
        var orders = await ordersQuery
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Transform to DTOs
        var transactions = new List<DetailedFinancialTransactionDto>();
        
        foreach (var order in orders)
        {
            foreach (var item in order.OrderItems)
            {
                var transaction = new DetailedFinancialTransactionDto
                {
                    TransactionId = item.Id,
                    OrderId = order.Id,
                    Date = order.CreatedAt,
                    Amount = item.Price,
                    Currency = "AUD",
                    PaymentStatus = order.OrderStatus.ToString(),
                    Student = new StudentInfoDto
                    {
                        Id = order.StudentId,
                        FullName = order.Student.FullName,
                        Email = order.Student.Email
                    }
                };

                // Determine payment source and add details
                if (item.PrivateSessionId != null)
                {
                    transaction.PaymentSource = "Session";
                    transaction.SessionDetails = new SessionDetailsDto
                    {
                        SessionId = item.PrivateSession.Id,
                        Subject = item.PrivateSession.Subject.Name,
                        Year = item.PrivateSession.Subject.Year.Name,
                        Teacher = new TeacherInfoDto
                        {
                            Id = item.PrivateSession.TeacherId,
                            FullName = item.PrivateSession.Teacher.FullName,
                            Email = item.PrivateSession.Teacher.Email
                        },
                        SessionDate = item.PrivateSession.StartTime,
                        Duration = item.PrivateSession.DurationMinutes
                    };
                }
                else if (item.SubscriptionId != null)
                {
                    transaction.PaymentSource = "Subscription";
                    transaction.SubscriptionDetails = new SubscriptionDetailsDto
                    {
                        SubscriptionId = item.Subscription.Id,
                        Subject = item.Subscription.Subject.Name,
                        Year = item.Subscription.Subject.Year.Name,
                        PlanType = item.Subscription.SubscriptionPlan.PlanType.ToString(),
                        PlanName = item.Subscription.SubscriptionPlan.Name,
                        StartDate = item.Subscription.StartDate,
                        EndDate = item.Subscription.EndDate,
                        TermNumber = item.Subscription.TermNumber ?? 0
                    };
                }

                transactions.Add(transaction);
            }
        }

        // Calculate summary
        var summary = new FinancialSummaryDto
        {
            TotalRevenue = transactions.Sum(t => t.Amount),
            TotalSessions = transactions.Count(t => t.PaymentSource == "Session"),
            SessionsRevenue = transactions
                .Where(t => t.PaymentSource == "Session")
                .Sum(t => t.Amount),
            TotalSubscriptions = transactions.Count(t => t.PaymentSource == "Subscription"),
            SubscriptionsRevenue = transactions
                .Where(t => t.PaymentSource == "Subscription")
                .Sum(t => t.Amount),
            Currency = "AUD"
        };

        return new DetailedFinancialReportDto
        {
            Transactions = transactions,
            Pagination = new PaginationDto
            {
                CurrentPage = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling((double)totalItems / pageSize)
            },
            Summary = summary
        };
    }

    // Implement export methods using EPPlus/QuestPDF
    // Similar to Advanced Analytics export implementation
}
```

---

## 4. Database Impact

**No new tables required.**

**Existing Tables Used:**
- `Orders` - Payment transactions
- `OrderItems` - Line items with foreign keys
- `PrivateSessions` - Session details
- `Subscriptions` - Subscription details
- `Subjects` - Subject information
- `Years` - Year level information
- `AspNetUsers` - Student and teacher information

**Recommended Indexes (if not already present):**
```sql
CREATE INDEX IX_Orders_CreatedAt_Status 
ON Orders(CreatedAt, OrderStatus);

CREATE INDEX IX_OrderItems_PrivateSessionId 
ON OrderItems(PrivateSessionId) 
WHERE PrivateSessionId IS NOT NULL;

CREATE INDEX IX_OrderItems_SubscriptionId 
ON OrderItems(SubscriptionId) 
WHERE SubscriptionId IS NOT NULL;
```

---

## 5. Files to Create or Modify

### New Files:
- `DTOs/DetailedFinancialTransactionDto.cs`
- `DTOs/StudentInfoDto.cs`
- `DTOs/SessionDetailsDto.cs`
- `DTOs/TeacherInfoDto.cs`
- `DTOs/SubscriptionDetailsDto.cs`
- `DTOs/DetailedFinancialReportDto.cs`
- `DTOs/FinancialSummaryDto.cs`
- `DTOs/FinancialSummaryBySourceDto.cs`
- `Services/IReportsService.cs` (if doesn't exist)
- `Services/ReportsService.cs` (if doesn't exist)

### Modified Files:
- `Controllers/ReportsController.cs` (add new actions)
- `Program.cs` (register IReportsService if new)

---

## 6. Request and Response Examples

### Example 1: Get Detailed Report for All Payments

**Request:**
```http
GET /api/Reports/financial/detailed?startDate=2025-11-01&endDate=2025-11-30&page=1&pageSize=10
Authorization: Bearer {token}
```

**Response:**
```json
{
  "transactions": [
    {
      "transactionId": 1001,
      "orderId": 500,
      "date": "2025-11-15T10:30:00Z",
      "amount": 150.00,
      "currency": "AUD",
      "paymentStatus": "Paid",
      "paymentSource": "Session",
      "student": {
        "id": 25,
        "fullName": "Sarah Johnson",
        "email": "sarah.j@example.com"
      },
      "sessionDetails": {
        "sessionId": 789,
        "subject": "Mathematics",
        "year": "Year 7",
        "teacher": {
          "id": 15,
          "fullName": "John Smith",
          "email": "john.smith@naplanbridge.com"
        },
        "sessionDate": "2025-11-20T14:00:00Z",
        "duration": 60
      }
    },
    {
      "transactionId": 1002,
      "orderId": 501,
      "date": "2025-11-16T11:45:00Z",
      "amount": 200.00,
      "currency": "AUD",
      "paymentStatus": "Paid",
      "paymentSource": "Subscription",
      "student": {
        "id": 30,
        "fullName": "Ahmed Ali",
        "email": "ahmed.ali@example.com"
      },
      "subscriptionDetails": {
        "subscriptionId": 456,
        "subject": "English",
        "year": "Year 8",
        "planType": "Monthly",
        "planName": "Year 8 English - Monthly Plan",
        "startDate": "2025-11-01",
        "endDate": "2025-11-30",
        "termNumber": 1
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 45,
    "totalPages": 5
  },
  "summary": {
    "totalRevenue": 6750.00,
    "totalSessions": 25,
    "sessionsRevenue": 3750.00,
    "totalSubscriptions": 20,
    "subscriptionsRevenue": 3000.00,
    "currency": "AUD"
  }
}
```

---

### Example 2: Filter by Sessions Only

**Request:**
```http
GET /api/Reports/financial/detailed?startDate=2025-11-01&endDate=2025-11-30&paymentSource=Session
Authorization: Bearer {token}
```

---

### Example 3: Export to Excel

**Request:**
```http
GET /api/Reports/financial/detailed/export?startDate=2025-11-01&endDate=2025-11-30&format=excel
Authorization: Bearer {token}
```

**Response:** Excel file download with sheets:
- **Transactions** - Detailed list
- **Summary** - Aggregated statistics
- **By Source** - Sessions vs Subscriptions breakdown
- **Top Teachers** - Ranked by revenue
- **Top Subjects** - Ranked by revenue

---

## 7. Frontend Integration Requirements

### Create FinancialReportsService

**Location:** `src/app/core/services/financial-reports.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class FinancialReportsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/Reports/financial`;

  getDetailedReport(
    startDate: string,
    endDate: string,
    paymentSource: 'All' | 'Session' | 'Subscription' = 'All',
    page: number = 1,
    pageSize: number = 50
  ): Observable<DetailedFinancialReportDto> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('paymentSource', paymentSource)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<DetailedFinancialReportDto>(
      `${this.apiUrl}/detailed`,
      { params }
    );
  }

  exportReport(
    startDate: string,
    endDate: string,
    paymentSource: 'All' | 'Session' | 'Subscription' = 'All',
    format: 'excel' | 'pdf' | 'csv' = 'excel'
  ): Observable<Blob> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('paymentSource', paymentSource)
      .set('format', format);

    return this.http.get(
      `${this.apiUrl}/detailed/export`,
      { params, responseType: 'blob' }
    );
  }
}
```

### Create Financial Reports Component

**Location:** `src/app/features/financial-reports/`

Features:
- Date range picker
- Payment source filter (All/Sessions/Subscriptions)
- Paginated table with all transaction details
- Export buttons (Excel/PDF/CSV)
- Summary cards showing totals by source

---

## 8. Security & Validation

### Authorization:
- ✅ Admin role required for all endpoints
- ✅ JWT Bearer authentication

### Validation:
- ✅ Date range validation (startDate <= endDate)
- ✅ Date range limit (max 1 year) to prevent performance issues
- ✅ PaymentSource enum validation
- ✅ Page and pageSize validation

### Performance:
- ✅ Pagination for large datasets
- ✅ Database indexes on filtered columns
- ✅ Efficient query with Include() for related data
- ✅ Consider caching for export operations

---

## 9. Testing Checklist

### Unit Tests:
- [ ] Test GetDetailedFinancialReport with various filters
- [ ] Test pagination logic
- [ ] Test date range validation
- [ ] Test payment source filtering
- [ ] Test summary calculations

### Integration Tests:
- [ ] Test full endpoint flow with real database
- [ ] Test with sessions only
- [ ] Test with subscriptions only
- [ ] Test with mixed data
- [ ] Test export functionality

### Performance Tests:
- [ ] Test with large datasets (10,000+ transactions)
- [ ] Test export generation time
- [ ] Test concurrent requests

---

## 10. Implementation Priority

**Phase 1 (Critical):**
- GET `/api/Reports/financial/detailed` endpoint
- DTOs and service implementation
- Basic pagination

**Phase 2 (High):**
- Summary by source endpoint
- Excel export

**Phase 3 (Medium):**
- PDF export
- CSV export
- Advanced filtering

---

## 11. Estimated Development Time

- **Backend Implementation:** 3-4 days
  - DTOs: 0.5 day
  - Service logic: 1.5 days
  - Controller: 0.5 day
  - Export functionality: 1 day
- **Testing & QA:** 1-2 days
- **Frontend Implementation:** 2-3 days
- **Total:** 6-9 days

---

**Prepared by:** AI Assistant  
**Review Required:** Backend Team Lead  
**Approval Required:** Technical Architect  

---

**Next Steps:**
1. Review and approve this specification
2. Create backend tasks/tickets
3. Implement endpoints in priority order
4. Update Swagger documentation
5. Create frontend component
6. Integration testing
7. Deploy to staging
8. Production deployment
