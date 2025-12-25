# 📊 BACKEND REPORT: Tutoring Analytics & Reports Endpoints

## 📌 Overview

The Admin Tutoring Dashboard requires comprehensive analytics and reporting endpoints to display advanced statistics, performance metrics, and insights.

**Priority:** HIGH  
**Requested by:** Frontend Team  
**Date:** December 25, 2025

---

## 🔴 Required Endpoints

### 1️⃣ GET `/api/Admin/Tutoring/Reports`

**Purpose:** Fetch comprehensive tutoring analytics for a specified period

**Request Parameters:**
```json
{
  "startDate": "2025-12-01",      // Required: Start date (ISO format)
  "endDate": "2025-12-25",        // Required: End date (ISO format)
  "period": "This Month"          // Optional: Named period for caching
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 125680.00,
      "totalOrders": 342,
      "totalSessions": 1250,
      "completedSessions": 980,
      "cancelledSessions": 85,
      "pendingSessions": 185,
      "averageOrderValue": 367.49,
      "revenueGrowth": 12.5,      // % change vs previous period
      "bookingGrowth": 8.3        // % change vs previous period
    },
    "revenueBySubject": [
      {
        "subjectId": 1,
        "subjectName": "Mathematics",
        "revenue": 45200.00,
        "sessions": 320,
        "percentage": 36.0
      }
    ],
    "teacherPerformance": [
      {
        "teacherId": 1,
        "teacherName": "Dr. John Smith",
        "totalSessions": 145,
        "completedSessions": 138,
        "cancelledSessions": 7,
        "totalRevenue": 18500.00,
        "avgRating": 4.9,
        "completionRate": 95.2,
        "avgSessionDuration": 58
      }
    ],
    "bookingTrends": [
      {
        "date": "2025-12-01",
        "bookings": 25,
        "revenue": 3200.00,
        "sessions": 20
      }
    ],
    "studentEngagement": {
      "totalStudents": 156,
      "newStudents": 28,
      "returningStudents": 128,
      "avgSessionsPerStudent": 8.0,
      "topSubjects": [
        { "name": "Mathematics", "count": 89 },
        { "name": "Physics", "count": 67 }
      ]
    },
    "sessionTypeDistribution": {
      "oneToOne": 820,
      "group": 430,
      "total": 1250
    },
    "cancellationStats": {
      "total": 85,
      "byStudent": 52,
      "byTeacher": 33,
      "refundAmount": 8500.00,
      "cancellationRate": 6.8
    },
    "peakHours": [
      { "hour": 16, "bookings": 145 },
      { "hour": 17, "bookings": 138 }
    ],
    "peakDays": [
      { "day": "Saturday", "bookings": 280 },
      { "day": "Sunday", "bookings": 245 }
    ]
  }
}
```

---

### 2️⃣ GET `/api/Admin/Tutoring/Reports/Summary`

**Purpose:** Quick summary statistics (for dashboard overview)

**Request Parameters:**
```
?period=today|week|month|quarter|year
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 125680.00,
    "totalOrders": 342,
    "totalSessions": 1250,
    "completedSessions": 980,
    "activeStudents": 156,
    "activeTeachers": 28,
    "averageOrderValue": 367.49,
    "revenueGrowth": 12.5,
    "bookingGrowth": 8.3
  }
}
```

---

### 3️⃣ GET `/api/Admin/Tutoring/Reports/Revenue`

**Purpose:** Detailed revenue breakdown by subject

**Request Parameters:**
```
?startDate=2025-12-01&endDate=2025-12-25
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "subjectId": 1,
      "subjectName": "Mathematics",
      "categoryName": "STEM",
      "revenue": 45200.00,
      "sessions": 320,
      "hours": 480,
      "percentage": 36.0,
      "avgRevenuePerSession": 141.25
    }
  ],
  "total": 125680.00
}
```

---

### 4️⃣ GET `/api/Admin/Tutoring/Reports/Teachers`

**Purpose:** Teacher performance metrics

**Request Parameters:**
```
?startDate=2025-12-01&endDate=2025-12-25&sortBy=revenue|sessions|rating&order=desc
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "teacherId": 1,
      "teacherName": "Dr. John Smith",
      "email": "john@example.com",
      "subjects": ["Mathematics", "Physics"],
      "totalSessions": 145,
      "completedSessions": 138,
      "cancelledSessions": 7,
      "noShowSessions": 0,
      "totalRevenue": 18500.00,
      "avgRating": 4.9,
      "totalReviews": 125,
      "completionRate": 95.2,
      "avgSessionDuration": 58,
      "totalHours": 140,
      "uniqueStudents": 45,
      "repeatStudentRate": 78.5
    }
  ]
}
```

---

### 5️⃣ GET `/api/Admin/Tutoring/Reports/Students`

**Purpose:** Student engagement analytics

**Request Parameters:**
```
?startDate=2025-12-01&endDate=2025-12-25
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 156,
    "newStudents": 28,
    "returningStudents": 128,
    "churnedStudents": 12,
    "avgSessionsPerStudent": 8.0,
    "avgSpendPerStudent": 805.64,
    "retentionRate": 82.1,
    "topSubjects": [
      { "name": "Mathematics", "count": 89, "percentage": 57.1 }
    ],
    "studentsByGrade": [
      { "grade": "Year 3", "count": 45 },
      { "grade": "Year 5", "count": 38 }
    ],
    "sessionFrequency": {
      "weekly": 85,
      "biweekly": 42,
      "monthly": 29
    }
  }
}
```

---

### 6️⃣ GET `/api/Admin/Tutoring/Reports/Trends`

**Purpose:** Booking and revenue trends over time

**Request Parameters:**
```
?startDate=2025-12-01&endDate=2025-12-25&granularity=day|week|month
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-12-01",
      "bookings": 25,
      "revenue": 3200.00,
      "sessions": 20,
      "newStudents": 3,
      "cancelledSessions": 2
    }
  ]
}
```

---

### 7️⃣ GET `/api/Admin/Tutoring/Reports/Cancellations`

**Purpose:** Cancellation analytics

**Request Parameters:**
```
?startDate=2025-12-01&endDate=2025-12-25
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "total": 85,
    "byStudent": 52,
    "byTeacher": 33,
    "bySystem": 0,
    "refundAmount": 8500.00,
    "cancellationRate": 6.8,
    "avgCancellationTime": 4.5,  // hours before session
    "reasons": [
      { "reason": "Schedule conflict", "count": 32 },
      { "reason": "Emergency", "count": 25 },
      { "reason": "Other", "count": 28 }
    ],
    "byDayOfWeek": [
      { "day": "Monday", "cancellations": 15 },
      { "day": "Friday", "cancellations": 18 }
    ]
  }
}
```

---

### 8️⃣ GET `/api/Admin/Tutoring/Reports/PeakTimes`

**Purpose:** Identify peak booking hours and days

**Request Parameters:**
```
?startDate=2025-12-01&endDate=2025-12-25
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "peakHours": [
      { "hour": 16, "bookings": 145, "percentage": 11.6 },
      { "hour": 17, "bookings": 138, "percentage": 11.0 }
    ],
    "peakDays": [
      { "day": "Saturday", "bookings": 280, "percentage": 22.4 },
      { "day": "Sunday", "bookings": 245, "percentage": 19.6 }
    ],
    "heatmap": [
      { "day": "Saturday", "hour": 16, "bookings": 45 },
      { "day": "Saturday", "hour": 17, "bookings": 42 }
    ]
  }
}
```

---

### 9️⃣ GET `/api/Admin/Tutoring/Reports/Export`

**Purpose:** Export reports in PDF or Excel format

**Request Parameters:**
```
?format=pdf|excel&startDate=2025-12-01&endDate=2025-12-25&sections=summary,revenue,teachers,students
```

**Expected Response:**
- Content-Type: `application/pdf` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download

---

### 🔟 PUT `/api/Admin/Tutoring/DiscountRules`

**Purpose:** Update discount rules configuration

**Request Body:**
```json
{
  "groupDiscount": {
    "isActive": true,
    "percentage": 35
  },
  "hoursDiscount": {
    "isActive": true,
    "tiers": {
      "20hours": 5,
      "30hours": 10
    }
  },
  "multiSubjectDiscount": {
    "isActive": true,
    "tiers": {
      "2subjects": 5,
      "3subjects": 10,
      "4subjects": 15,
      "5subjects": 20
    }
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Discount rules updated successfully"
}
```

---

## 📊 Data Models

### ReportSummary
```csharp
public class ReportSummary
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int TotalSessions { get; set; }
    public int CompletedSessions { get; set; }
    public int CancelledSessions { get; set; }
    public int PendingSessions { get; set; }
    public decimal AverageOrderValue { get; set; }
    public decimal RevenueGrowth { get; set; }
    public decimal BookingGrowth { get; set; }
}
```

### RevenueBySubject
```csharp
public class RevenueBySubject
{
    public int SubjectId { get; set; }
    public string SubjectName { get; set; }
    public decimal Revenue { get; set; }
    public int Sessions { get; set; }
    public decimal Percentage { get; set; }
}
```

### TeacherPerformance
```csharp
public class TeacherPerformance
{
    public int TeacherId { get; set; }
    public string TeacherName { get; set; }
    public int TotalSessions { get; set; }
    public int CompletedSessions { get; set; }
    public int CancelledSessions { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AvgRating { get; set; }
    public decimal CompletionRate { get; set; }
    public int AvgSessionDuration { get; set; }
}
```

---

## 🗄️ Database Queries (Examples)

### Revenue Summary
```sql
SELECT 
    SUM(o.TotalAmount) as TotalRevenue,
    COUNT(DISTINCT o.Id) as TotalOrders,
    COUNT(s.Id) as TotalSessions,
    SUM(CASE WHEN s.Status = 'Completed' THEN 1 ELSE 0 END) as CompletedSessions
FROM TutoringOrders o
LEFT JOIN TutoringSessions s ON o.Id = s.OrderId
WHERE o.CreatedAt BETWEEN @StartDate AND @EndDate
```

### Revenue by Subject
```sql
SELECT 
    sub.Id as SubjectId,
    sub.SubjectName,
    SUM(os.Price * os.Hours) as Revenue,
    COUNT(s.Id) as Sessions,
    (SUM(os.Price * os.Hours) / (SELECT SUM(TotalAmount) FROM TutoringOrders WHERE CreatedAt BETWEEN @StartDate AND @EndDate) * 100) as Percentage
FROM TutoringOrderSubjects os
JOIN Subjects sub ON os.SubjectId = sub.Id
JOIN TutoringOrders o ON os.OrderId = o.Id
LEFT JOIN TutoringSessions s ON os.Id = s.OrderSubjectId
WHERE o.CreatedAt BETWEEN @StartDate AND @EndDate
GROUP BY sub.Id, sub.SubjectName
ORDER BY Revenue DESC
```

### Teacher Performance
```sql
SELECT 
    t.Id as TeacherId,
    CONCAT(t.FirstName, ' ', t.LastName) as TeacherName,
    COUNT(s.Id) as TotalSessions,
    SUM(CASE WHEN s.Status = 'Completed' THEN 1 ELSE 0 END) as CompletedSessions,
    SUM(CASE WHEN s.Status = 'Cancelled' THEN 1 ELSE 0 END) as CancelledSessions,
    SUM(s.TeacherEarning) as TotalRevenue,
    AVG(r.Rating) as AvgRating,
    (SUM(CASE WHEN s.Status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(s.Id)) as CompletionRate
FROM Teachers t
JOIN TutoringSessions s ON t.Id = s.TeacherId
LEFT JOIN SessionReviews r ON s.Id = r.SessionId
WHERE s.ScheduledDate BETWEEN @StartDate AND @EndDate
GROUP BY t.Id, t.FirstName, t.LastName
ORDER BY TotalRevenue DESC
```

---

## ⚡ Performance Recommendations

1. **Caching:** Cache report data for common periods (Today, This Week, This Month)
2. **Background Jobs:** Pre-calculate daily/weekly summaries using background jobs
3. **Pagination:** Paginate teacher and student lists for large datasets
4. **Indexes:** Ensure proper indexes on:
   - `TutoringOrders.CreatedAt`
   - `TutoringSessions.ScheduledDate`
   - `TutoringSessions.Status`
   - `TutoringSessions.TeacherId`

---

## 🔐 Security

- All endpoints require Admin role authentication
- Add rate limiting for export endpoints
- Validate date ranges (max 1 year)

---

## ✅ Frontend Ready

The frontend implementation is complete and waiting for these endpoints. Once available:

1. Update `TutoringService` with API calls
2. Remove mock data generation
3. Test with real data

---

## 📞 Contact

For questions or clarifications, contact the Frontend team.

**Status:** ⏳ Waiting for Backend Implementation
