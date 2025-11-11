# 🔧 Backend Change Report

**Date:** November 6, 2025  
**Feature:** Advanced Analytics Dashboard  
**Status:** Required - New Implementation  
**Priority:** High

---

## 1. Reason for Change

The Advanced Analytics component in the frontend currently uses mock data. Real-time analytics data is required to provide administrators with accurate insights into:
- Student enrollment trends
- Course performance metrics
- Revenue analytics by period
- Top performing students and popular courses
- Subscription trends (new, renewals, cancellations)

---

## 2. Required New Endpoints

### 2.1 Get Advanced Analytics Data

**Endpoint:** `GET /api/Analytics/advanced`

**Query Parameters:**
- `period` (required): `week` | `month` | `year`
- `reportType` (required): `overview` | `students` | `courses` | `revenue`
- `startDate` (optional): `yyyy-MM-dd`
- `endDate` (optional): `yyyy-MM-dd`

**Controller:** `AnalyticsController`

**Action:** `GetAdvancedAnalytics`

**Description:** Returns comprehensive analytics data based on selected period and report type.

**Response Schema:**
```json
{
  "period": "month",
  "reportType": "overview",
  "overview": {
    "totalStudents": 1250,
    "previousStudents": 1180,
    "activeStudents": 980,
    "previousActive": 920,
    "totalRevenue": 45600,
    "previousRevenue": 42300,
    "coursesCompleted": 3450,
    "previousCompleted": 3200,
    "averageScore": 85.5,
    "previousScore": 83.2
  },
  "studentMetrics": {
    "enrollments": [120, 135, 150, 145, 160, 155, 170],
    "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
    "topPerformers": [
      {
        "name": "Ahmed Ali",
        "score": 95.5,
        "progress": 98
      }
    ],
    "engagementRate": 87.5
  },
  "courseMetrics": {
    "completionRates": [85, 90, 78, 92],
    "courseNames": ["Math", "Science", "English", "Arabic"],
    "mostPopular": [
      {
        "name": "Mathematics Year 7",
        "enrollments": 245,
        "rating": 4.8
      }
    ]
  },
  "revenueMetrics": {
    "daily": [1200, 1350, 980, 1450],
    "monthly": [35000, 38000, 42000, 45600],
    "yearly": [480000, 520000],
    "labels": ["Jan", "Feb", "Mar", "Apr"],
    "byPlan": {
      "Monthly": 25000,
      "Term": 15000,
      "Yearly": 5600
    },
    "subscriptionTrends": {
      "new": 145,
      "renewals": 320,
      "cancellations": 25
    }
  }
}
```

---

### 2.2 Get Chart Data

**Endpoint:** `GET /api/Analytics/charts`

**Query Parameters:**
- `period` (required): `week` | `month` | `year`
- `reportType` (required): `overview` | `students` | `courses` | `revenue`

**Controller:** `AnalyticsController`

**Action:** `GetChartData`

**Description:** Returns formatted data specifically for chart rendering.

**Response Schema:**
```json
{
  "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
  "datasets": [
    {
      "label": "Enrollments",
      "data": [120, 135, 150, 145],
      "color": "#3B82F6",
      "backgroundColor": "rgba(59, 130, 246, 0.1)"
    },
    {
      "label": "Completions",
      "data": [110, 125, 140, 135],
      "color": "#10B981",
      "backgroundColor": "rgba(16, 185, 129, 0.1)"
    }
  ]
}
```

---

### 2.3 Export to PDF

**Endpoint:** `POST /api/Analytics/export/pdf`

**Request Body:**
```json
{
  "period": "month",
  "reportType": "overview",
  "data": { /* analytics data object */ }
}
```

**Controller:** `AnalyticsController`

**Action:** `ExportToPDF`

**Description:** Generates and returns a PDF report of the analytics data.

**Response:** Binary file (application/pdf)

---

### 2.4 Export to Excel

**Endpoint:** `POST /api/Analytics/export/excel`

**Request Body:**
```json
{
  "period": "month",
  "reportType": "overview",
  "data": { /* analytics data object */ }
}
```

**Controller:** `AnalyticsController`

**Action:** `ExportToExcel`

**Description:** Generates and returns an Excel report of the analytics data.

**Response:** Binary file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

---

## 3. Suggested Backend Implementation

### 3.1 Create AnalyticsController

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace NaplanBridge.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpGet("advanced")]
        public async Task<ActionResult<AdvancedAnalyticsDto>> GetAdvancedAnalytics(
            [FromQuery] string period,
            [FromQuery] string reportType,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var analytics = await _analyticsService.GetAdvancedAnalyticsAsync(
                period, reportType, startDate, endDate);
            return Ok(analytics);
        }

        [HttpGet("charts")]
        public async Task<ActionResult<ChartDataDto>> GetChartData(
            [FromQuery] string period,
            [FromQuery] string reportType)
        {
            var chartData = await _analyticsService.GetChartDataAsync(period, reportType);
            return Ok(chartData);
        }

        [HttpPost("export/pdf")]
        public async Task<IActionResult> ExportToPDF([FromBody] ExportRequest request)
        {
            var pdfBytes = await _analyticsService.GeneratePDFReportAsync(request);
            return File(pdfBytes, "application/pdf", $"analytics_{DateTime.Now:yyyyMMdd}.pdf");
        }

        [HttpPost("export/excel")]
        public async Task<IActionResult> ExportToExcel([FromBody] ExportRequest request)
        {
            var excelBytes = await _analyticsService.GenerateExcelReportAsync(request);
            return File(excelBytes, 
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"analytics_{DateTime.Now:yyyyMMdd}.xlsx");
        }
    }
}
```

### 3.2 Create IAnalyticsService Interface

```csharp
public interface IAnalyticsService
{
    Task<AdvancedAnalyticsDto> GetAdvancedAnalyticsAsync(
        string period, 
        string reportType, 
        DateTime? startDate = null, 
        DateTime? endDate = null);
    
    Task<ChartDataDto> GetChartDataAsync(string period, string reportType);
    
    Task<byte[]> GeneratePDFReportAsync(ExportRequest request);
    
    Task<byte[]> GenerateExcelReportAsync(ExportRequest request);
}
```

### 3.3 Data Aggregation Logic

The service should:

1. **Query database** for:
   - Student enrollments and activity
   - Course completion rates
   - Order/payment data for revenue
   - Exam scores and performance metrics

2. **Calculate metrics** such as:
   - Period-over-period growth percentages
   - Average scores and completion rates
   - Revenue by subscription plan
   - Top performers and popular courses

3. **Group data by period**:
   - Week: Last 7 days, grouped by day
   - Month: Last 30 days, grouped by day or week
   - Year: Last 12 months, grouped by month

---

## 4. Database Impact

**No new tables required.**

Queries will use existing tables:
- `AspNetUsers` (Students, Teachers, Parents)
- `StudentSubjects` (Enrollments, subscriptions)
- `Orders` (Revenue data)
- `StudentExams` (Exam performance)
- `Subjects`, `Lessons` (Course data)
- `Progress` (Completion tracking)

**Recommended Indexes** (for performance):
```sql
CREATE INDEX IX_StudentSubjects_CreatedAt ON StudentSubjects(CreatedAt);
CREATE INDEX IX_Orders_CreatedAt_IsPaid ON Orders(CreatedAt, IsPaid);
CREATE INDEX IX_StudentExams_CompletedAt_Score ON StudentExams(CompletedAt, TotalScore);
CREATE INDEX IX_Progress_CompletedAt ON Progress(CompletedAt);
```

---

## 5. Files to Create or Modify

### New Files:
- `Controllers/AnalyticsController.cs`
- `Services/AnalyticsService.cs`
- `Services/IAnalyticsService.cs`
- `DTOs/AdvancedAnalyticsDto.cs`
- `DTOs/ChartDataDto.cs`
- `DTOs/ExportRequest.cs`

### Modified Files:
- `Program.cs` or `Startup.cs` (register AnalyticsService)

---

## 6. Request and Response Examples

### Example 1: Get Monthly Overview Analytics

**Request:**
```http
GET /api/Analytics/advanced?period=month&reportType=overview
Authorization: Bearer {token}
```

**Response:**
```json
{
  "period": "month",
  "reportType": "overview",
  "overview": {
    "totalStudents": 1250,
    "previousStudents": 1180,
    "activeStudents": 980,
    "previousActive": 920,
    "totalRevenue": 45600,
    "previousRevenue": 42300,
    "coursesCompleted": 3450,
    "previousCompleted": 3200,
    "averageScore": 85.5,
    "previousScore": 83.2
  }
}
```

### Example 2: Get Student Metrics

**Request:**
```http
GET /api/Analytics/advanced?period=week&reportType=students
Authorization: Bearer {token}
```

**Response:**
```json
{
  "period": "week",
  "reportType": "students",
  "studentMetrics": {
    "enrollments": [120, 135, 150, 145, 160, 155, 170],
    "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "topPerformers": [
      {
        "name": "Ahmed Ali",
        "score": 95.5,
        "progress": 98
      },
      {
        "name": "Sara Mohamed",
        "score": 94.2,
        "progress": 95
      }
    ],
    "engagementRate": 87.5
  }
}
```

### Example 3: Export to PDF

**Request:**
```http
POST /api/Analytics/export/pdf
Authorization: Bearer {token}
Content-Type: application/json

{
  "period": "month",
  "reportType": "overview",
  "data": { /* analytics data */ }
}
```

**Response:**
Binary PDF file

---

## 7. Dependencies Required

### NuGet Packages:

1. **For PDF Generation:**
   ```bash
   Install-Package iTextSharp
   # OR
   Install-Package PdfSharpCore
   ```

2. **For Excel Generation:**
   ```bash
   Install-Package EPPlus
   # OR
   Install-Package ClosedXML
   ```

---

## 8. Security & Performance Considerations

### Security:
- ✅ Endpoint restricted to Admin role only
- ✅ Input validation for period and reportType parameters
- ✅ Date range validation (prevent excessive ranges)
- ✅ Rate limiting on export endpoints

### Performance:
- ✅ Add caching for frequently accessed analytics (5-15 minutes)
- ✅ Use database indexes on date columns
- ✅ Consider background jobs for large data exports
- ✅ Implement pagination for detailed reports

---

## 9. Testing Checklist

### Unit Tests:
- [ ] Test GetAdvancedAnalytics with different periods
- [ ] Test GetAdvancedAnalytics with different report types
- [ ] Test date range calculations
- [ ] Test metric calculations

### Integration Tests:
- [ ] Test full analytics endpoint flow
- [ ] Test PDF generation
- [ ] Test Excel generation
- [ ] Test with actual database data

### Performance Tests:
- [ ] Test with large datasets (10,000+ records)
- [ ] Test concurrent requests
- [ ] Test export file sizes

---

## 10. Implementation Priority

1. **Phase 1 (Critical):** 
   - GET `/api/Analytics/advanced` endpoint
   - GET `/api/Analytics/charts` endpoint
   - Basic overview and student metrics

2. **Phase 2 (High):**
   - Course and revenue metrics
   - Date range filtering

3. **Phase 3 (Medium):**
   - PDF export functionality
   - Excel export functionality

---

## 11. Frontend Integration Notes

Once backend is implemented, update Frontend:

**File:** `src/app/core/services/advanced-analytics.service.ts`

Replace mock data methods with real API calls:
```typescript
getAnalytics(period, reportType): Observable<AnalyticsData> {
  const params = new HttpParams()
    .set('period', period)
    .set('reportType', reportType);
  
  return this.http.get<AnalyticsData>(
    `${environment.apiBaseUrl}/Analytics/advanced`,
    { params }
  );
}
```

---

## 12. Estimated Development Time

- **Backend Development:** 3-5 days
- **Testing & QA:** 1-2 days
- **Frontend Integration:** 1 day
- **Total:** 5-8 days

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
5. Notify frontend team when ready for integration
