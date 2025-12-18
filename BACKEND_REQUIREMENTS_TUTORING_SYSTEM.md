# 🔧 Backend Requirements - Tutoring System

**Date:** December 18, 2025  
**Frontend Status:** ✅ Complete  
**Backend Status:** ⚠️ Required Implementation  

---

## 📋 Overview

هذا الملف يحتوي على **كل الـ APIs والـ DTOs المطلوبة** من الباك إند لتشغيل نظام الـ Tutoring بالكامل.

---

## 🗂️ Table of Contents

1. [Parent Booking APIs](#1-parent-booking-apis)
2. [Teacher Session Management APIs](#2-teacher-session-management-apis)
3. [Admin Reports APIs](#3-admin-reports-apis)
4. [Admin Discount Management APIs](#4-admin-discount-management-apis)
5. [DTOs & Models](#5-dtos--models)
6. [Database Schema](#6-database-schema)
7. [Stripe Integration](#7-stripe-integration)

---

## 1. Parent Booking APIs

### 1.1 Get Available Time Slots
**Endpoint:** `GET /api/Tutoring/time-slots`

**Query Parameters:**
```csharp
public class GetTimeSlotsRequest
{
    public int AcademicYearId { get; set; }
    public string TeachingType { get; set; } // "OneToOne" or "GroupTutoring"
    public int? SubjectId { get; set; } // Optional
    public DateTime? StartDate { get; set; } // Optional
    public DateTime? EndDate { get; set; } // Optional
}
```

**Response:**
```csharp
public class TimeSlotDto
{
    public int Id { get; set; }
    public string DayOfWeek { get; set; } // "Monday", "Tuesday", etc.
    public string StartTime { get; set; } // "09:00"
    public string EndTime { get; set; } // "10:00"
    public int Duration { get; set; } // 60 minutes
    public bool IsAvailable { get; set; }
    public int? TeacherId { get; set; }
    public string? TeacherName { get; set; }
    public int MaxStudents { get; set; }
    public int? SubjectId { get; set; }
    public string? SubjectName { get; set; }
}
```

**Example Response:**
```json
[
  {
    "id": 1,
    "dayOfWeek": "Monday",
    "startTime": "09:00",
    "endTime": "10:00",
    "duration": 60,
    "isAvailable": true,
    "teacherId": 5,
    "teacherName": "Mr. Smith",
    "maxStudents": 3,
    "subjectId": null,
    "subjectName": null
  }
]
```

---

### 1.2 Calculate Price
**Endpoint:** `POST /api/Tutoring/calculate-price`

**Request Body:**
```csharp
public class CalculateTutoringPriceRequest
{
    public string TeachingType { get; set; } // "OneToOne" or "GroupTutoring"
    public int AcademicYearId { get; set; }
    public List<StudentSubjectSelection> StudentSelections { get; set; }
}

public class StudentSubjectSelection
{
    public int StudentId { get; set; }
    public string StudentName { get; set; }
    public List<SubjectWithPlan> Subjects { get; set; }
}

public class SubjectWithPlan
{
    public int SubjectId { get; set; }
    public string SubjectName { get; set; }
    public string Plan { get; set; } // "10hrs", "20hrs", "30hrs"
    public decimal BasePrice { get; set; }
    public decimal TotalPrice { get; set; }
    public List<int> SelectedTimeSlotIds { get; set; }
    public int RequiredSlots { get; set; }
}
```

**Response:**
```csharp
public class TutoringPriceResponse
{
    public decimal BasePrice { get; set; }
    public decimal GroupDiscount { get; set; }
    public decimal MultipleStudentsDiscount { get; set; }
    public decimal MultipleSubjectsDiscount { get; set; }
    public decimal PlanDiscount { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal FinalPrice { get; set; }
    public List<StudentPriceBreakdown> Breakdown { get; set; }
}

public class StudentPriceBreakdown
{
    public string StudentName { get; set; }
    public List<SubjectPriceBreakdown> Subjects { get; set; }
    public decimal StudentTotal { get; set; }
}

public class SubjectPriceBreakdown
{
    public string SubjectName { get; set; }
    public string Plan { get; set; }
    public decimal BasePrice { get; set; }
    public decimal FinalPrice { get; set; }
}
```

**Example Request:**
```json
{
  "teachingType": "GroupTutoring",
  "academicYearId": 1,
  "studentSelections": [
    {
      "studentId": 1,
      "studentName": "Ahmed",
      "subjects": [
        {
          "subjectId": 1,
          "subjectName": "Mathematics",
          "plan": "20hrs",
          "basePrice": 100,
          "totalPrice": 190,
          "selectedTimeSlotIds": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
          "requiredSlots": 20
        }
      ]
    }
  ]
}
```

**Example Response:**
```json
{
  "basePrice": 1240,
  "groupDiscount": 434,
  "multipleStudentsDiscount": 80,
  "multipleSubjectsDiscount": 45,
  "planDiscount": 50,
  "totalDiscount": 609,
  "finalPrice": 631,
  "breakdown": [
    {
      "studentName": "Ahmed",
      "subjects": [
        {
          "subjectName": "Mathematics",
          "plan": "20hrs",
          "basePrice": 200,
          "finalPrice": 190
        }
      ],
      "studentTotal": 190
    }
  ]
}
```

---

### 1.3 Create Tutoring Order
**Endpoint:** `POST /api/Tutoring/create-order`

**Request Body:**
```csharp
public class CreateTutoringOrderRequest
{
    public string TeachingType { get; set; }
    public int AcademicYearId { get; set; }
    public int TermId { get; set; }
    public List<StudentSubjectSelection> StudentSelections { get; set; }
    public int TotalStudents { get; set; }
    public decimal ExpectedPrice { get; set; }
}
```

**Response:**
```csharp
public class CreateTutoringOrderResponse
{
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } // "TUT-000123"
    public decimal TotalAmount { get; set; }
    public string StripeSessionId { get; set; }
    public string StripeCheckoutUrl { get; set; }
    public string ConfirmationCode { get; set; } // "TUT-ABC123"
}
```

**Example Response:**
```json
{
  "orderId": 123,
  "orderNumber": "TUT-000123",
  "totalAmount": 631.00,
  "stripeSessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "stripeCheckoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
  "confirmationCode": "TUT-ABC123"
}
```

---

### 1.4 Get Booking Confirmation
**Endpoint:** `GET /api/Tutoring/booking-confirmation/{orderId}`

**Response:**
```csharp
public class BookingConfirmationDto
{
    public int OrderId { get; set; }
    public string OrderNumber { get; set; }
    public string ConfirmationCode { get; set; }
    public string ParentName { get; set; }
    public List<StudentBookingInfo> Students { get; set; }
    public decimal TotalAmount { get; set; }
    public string PaymentStatus { get; set; }
    public List<TutoringSessionDto> ScheduledSessions { get; set; }
}

public class StudentBookingInfo
{
    public string StudentName { get; set; }
    public List<SubjectBookingInfo> Subjects { get; set; }
}

public class SubjectBookingInfo
{
    public string SubjectName { get; set; }
    public string Plan { get; set; }
    public int TotalSessions { get; set; }
}
```

---

## 2. Teacher Session Management APIs

### 2.1 Get Teacher Sessions
**Endpoint:** `GET /api/Tutoring/teacher/sessions`

**Query Parameters:**
```csharp
public class GetTeacherSessionsRequest
{
    public string? Status { get; set; } // "Scheduled", "InProgress", "Completed", "Cancelled"
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
```

**Response:**
```csharp
public class TutoringSessionDto
{
    public int Id { get; set; }
    public string StudentName { get; set; }
    public string SubjectName { get; set; }
    public string TeacherName { get; set; }
    public DateTime DateTime { get; set; }
    public int Duration { get; set; } // minutes
    public string Status { get; set; } // "Scheduled", "InProgress", "Completed", "Cancelled"
    public string? MeetingLink { get; set; }
    public string? Notes { get; set; }
}
```

**Example Response:**
```json
[
  {
    "id": 1,
    "studentName": "Ahmed Ali",
    "subjectName": "Mathematics",
    "teacherName": "Mr. Smith",
    "dateTime": "2025-01-15T09:00:00",
    "duration": 60,
    "status": "Scheduled",
    "meetingLink": "https://zoom.us/j/123456789",
    "notes": null
  }
]
```

---

### 2.2 Start Session
**Endpoint:** `PUT /api/Tutoring/teacher/session/{id}/start`

**Response:**
```csharp
public class SessionActionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public TutoringSessionDto Session { get; set; }
}
```

---

### 2.3 Complete Session
**Endpoint:** `PUT /api/Tutoring/teacher/session/{id}/complete`

**Response:** Same as Start Session

---

### 2.4 Cancel Session
**Endpoint:** `PUT /api/Tutoring/teacher/session/{id}/cancel`

**Request Body:**
```csharp
public class CancelSessionRequest
{
    public string Reason { get; set; }
}
```

**Response:** Same as Start Session

---

### 2.5 Update Meeting Link
**Endpoint:** `PUT /api/Tutoring/teacher/session/{id}/meeting-link`

**Request Body:**
```csharp
public class UpdateMeetingLinkRequest
{
    public string MeetingLink { get; set; }
}
```

---

### 2.6 Update Session Notes
**Endpoint:** `PUT /api/Tutoring/teacher/session/{id}/notes`

**Request Body:**
```csharp
public class UpdateSessionNotesRequest
{
    public string Notes { get; set; }
}
```

---

## 3. Admin Reports APIs

### 3.1 Get Reports Summary
**Endpoint:** `GET /api/Tutoring/admin/reports`

**Query Parameters:**
```csharp
public class GetReportsRequest
{
    public string Period { get; set; } // "Today", "ThisWeek", "ThisMonth", "ThisQuarter", "ThisYear"
    public DateTime? StartDate { get; set; } // For custom period
    public DateTime? EndDate { get; set; } // For custom period
}
```

**Response:**
```csharp
public class TutoringReportDto
{
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalSessions { get; set; }
    public int CompletedSessions { get; set; }
    public int CancelledSessions { get; set; }
    public int ActiveStudents { get; set; }
    public int ActiveTeachers { get; set; }
    public decimal AverageOrderValue { get; set; }
    public decimal ConversionRate { get; set; }
    
    // Charts data
    public List<RevenueByMonth> RevenueByMonth { get; set; }
    public TeachingTypeDistribution TeachingTypeDistribution { get; set; }
    public PlanDistribution PlanDistribution { get; set; }
}

public class RevenueByMonth
{
    public string Month { get; set; }
    public decimal Revenue { get; set; }
}

public class TeachingTypeDistribution
{
    public int OneToOneCount { get; set; }
    public int GroupCount { get; set; }
    public decimal OneToOnePercentage { get; set; }
    public decimal GroupPercentage { get; set; }
}

public class PlanDistribution
{
    public int Hours10Count { get; set; }
    public int Hours20Count { get; set; }
    public int Hours30Count { get; set; }
    public decimal Hours10Percentage { get; set; }
    public decimal Hours20Percentage { get; set; }
    public decimal Hours30Percentage { get; set; }
}
```

---

### 3.2 Get Recent Orders
**Endpoint:** `GET /api/Tutoring/admin/orders`

**Query Parameters:**
```csharp
public class GetOrdersRequest
{
    public string? Status { get; set; }
    public string? SearchQuery { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}
```

**Response:**
```csharp
public class OrdersListResponse
{
    public List<OrderSummaryDto> Orders { get; set; }
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}

public class OrderSummaryDto
{
    public int OrderId { get; set; }
    public string OrderNumber { get; set; }
    public string ParentName { get; set; }
    public int StudentsCount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

---

### 3.3 Get Top Teachers
**Endpoint:** `GET /api/Tutoring/admin/top-teachers`

**Query Parameters:**
```csharp
public class GetTopTeachersRequest
{
    public string Period { get; set; }
    public int Top { get; set; } = 10;
}
```

**Response:**
```csharp
public class TopTeacherDto
{
    public int TeacherId { get; set; }
    public string TeacherName { get; set; }
    public int TotalSessions { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageRating { get; set; }
    public int Rank { get; set; }
}
```

---

### 3.4 Get Popular Subjects
**Endpoint:** `GET /api/Tutoring/admin/popular-subjects`

**Query Parameters:**
```csharp
public class GetPopularSubjectsRequest
{
    public string Period { get; set; }
}
```

**Response:**
```csharp
public class PopularSubjectDto
{
    public int SubjectId { get; set; }
    public string SubjectName { get; set; }
    public int TotalSessions { get; set; }
    public decimal Percentage { get; set; }
}
```

---

## 4. Admin Discount Management APIs

### 4.1 Get All Discounts
**Endpoint:** `GET /api/Tutoring/admin/discounts`

**Response:**
```csharp
public class DiscountSettingsDto
{
    public GroupDiscountSettings GroupDiscount { get; set; }
    public MultipleStudentsDiscountSettings MultipleStudentsDiscount { get; set; }
    public MultipleSubjectsDiscountSettings MultipleSubjectsDiscount { get; set; }
    public PlanDiscountsSettings PlanDiscounts { get; set; }
}

public class GroupDiscountSettings
{
    public bool IsActive { get; set; }
    public decimal Percentage { get; set; }
}

public class MultipleStudentsDiscountSettings
{
    public bool IsActive { get; set; }
    public decimal TwoStudentsPercentage { get; set; }
    public decimal ThreeStudentsPercentage { get; set; }
    public decimal FourPlusStudentsPercentage { get; set; }
    public decimal MaxPercentage { get; set; }
}

public class MultipleSubjectsDiscountSettings
{
    public bool IsActive { get; set; }
    public decimal PercentagePerSubject { get; set; }
    public decimal MaxPercentage { get; set; }
}

public class PlanDiscountsSettings
{
    public bool Hours20IsActive { get; set; }
    public decimal Hours20Percentage { get; set; }
    public bool Hours30IsActive { get; set; }
    public decimal Hours30Percentage { get; set; }
}
```

**Example Response:**
```json
{
  "groupDiscount": {
    "isActive": true,
    "percentage": 35
  },
  "multipleStudentsDiscount": {
    "isActive": true,
    "twoStudentsPercentage": 5,
    "threeStudentsPercentage": 10,
    "fourPlusStudentsPercentage": 15,
    "maxPercentage": 20
  },
  "multipleSubjectsDiscount": {
    "isActive": true,
    "percentagePerSubject": 5,
    "maxPercentage": 20
  },
  "planDiscounts": {
    "hours20IsActive": true,
    "hours20Percentage": 5,
    "hours30IsActive": true,
    "hours30Percentage": 10
  }
}
```

---

### 4.2 Update Group Discount
**Endpoint:** `PUT /api/Tutoring/admin/discounts/group`

**Request Body:**
```csharp
public class UpdateGroupDiscountRequest
{
    public bool IsActive { get; set; }
    public decimal Percentage { get; set; }
}
```

---

### 4.3 Update Multiple Students Discount
**Endpoint:** `PUT /api/Tutoring/admin/discounts/students`

**Request Body:**
```csharp
public class UpdateStudentsDiscountRequest
{
    public bool IsActive { get; set; }
    public decimal TwoStudentsPercentage { get; set; }
    public decimal ThreeStudentsPercentage { get; set; }
    public decimal FourPlusStudentsPercentage { get; set; }
    public decimal MaxPercentage { get; set; }
}
```

---

### 4.4 Update Multiple Subjects Discount
**Endpoint:** `PUT /api/Tutoring/admin/discounts/subjects`

**Request Body:**
```csharp
public class UpdateSubjectsDiscountRequest
{
    public bool IsActive { get; set; }
    public decimal PercentagePerSubject { get; set; }
    public decimal MaxPercentage { get; set; }
}
```

---

### 4.5 Update Plan Discounts
**Endpoint:** `PUT /api/Tutoring/admin/discounts/plans`

**Request Body:**
```csharp
public class UpdatePlanDiscountsRequest
{
    public bool Hours20IsActive { get; set; }
    public decimal Hours20Percentage { get; set; }
    public bool Hours30IsActive { get; set; }
    public decimal Hours30Percentage { get; set; }
}
```

---

## 5. DTOs & Models

### Enums:

```csharp
public enum TutoringPlan
{
    Hours10,
    Hours20,
    Hours30
}

public enum TutoringOrderStatus
{
    Pending,
    Paid,
    Confirmed,
    InProgress,
    Completed,
    Cancelled,
    Refunded
}

public enum TutoringSessionStatus
{
    Scheduled,
    InProgress,
    Completed,
    Cancelled,
    Rescheduled,
    NoShow
}

public enum TeachingType
{
    OneToOne,
    GroupTutoring
}
```

---

## 6. Database Schema

### Required Tables:

#### 6.1 TutoringOrders
```sql
CREATE TABLE TutoringOrders (
    Id INT PRIMARY KEY IDENTITY,
    OrderNumber NVARCHAR(50) UNIQUE NOT NULL,
    ParentId INT NOT NULL,
    TeachingType NVARCHAR(50) NOT NULL,
    AcademicYearId INT NOT NULL,
    TermId INT NOT NULL,
    TotalStudents INT NOT NULL,
    BasePrice DECIMAL(18,2) NOT NULL,
    TotalDiscount DECIMAL(18,2) NOT NULL,
    FinalPrice DECIMAL(18,2) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    StripeSessionId NVARCHAR(200),
    ConfirmationCode NVARCHAR(50),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2,
    
    FOREIGN KEY (ParentId) REFERENCES Users(Id),
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id),
    FOREIGN KEY (TermId) REFERENCES Terms(Id)
);
```

#### 6.2 TutoringOrderStudents
```sql
CREATE TABLE TutoringOrderStudents (
    Id INT PRIMARY KEY IDENTITY,
    OrderId INT NOT NULL,
    StudentId INT NOT NULL,
    StudentName NVARCHAR(100) NOT NULL,
    
    FOREIGN KEY (OrderId) REFERENCES TutoringOrders(Id) ON DELETE CASCADE
);
```

#### 6.3 TutoringOrderSubjects
```sql
CREATE TABLE TutoringOrderSubjects (
    Id INT PRIMARY KEY IDENTITY,
    OrderId INT NOT NULL,
    OrderStudentId INT NOT NULL,
    SubjectId INT NOT NULL,
    SubjectName NVARCHAR(100) NOT NULL,
    Plan NVARCHAR(20) NOT NULL,
    BasePrice DECIMAL(18,2) NOT NULL,
    FinalPrice DECIMAL(18,2) NOT NULL,
    RequiredSlots INT NOT NULL,
    
    FOREIGN KEY (OrderId) REFERENCES TutoringOrders(Id) ON DELETE CASCADE,
    FOREIGN KEY (OrderStudentId) REFERENCES TutoringOrderStudents(Id),
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id)
);
```

#### 6.4 TutoringSessions
```sql
CREATE TABLE TutoringSessions (
    Id INT PRIMARY KEY IDENTITY,
    OrderId INT NOT NULL,
    OrderSubjectId INT NOT NULL,
    StudentId INT NOT NULL,
    SubjectId INT NOT NULL,
    TeacherId INT NOT NULL,
    TimeSlotId INT NOT NULL,
    ScheduledDateTime DATETIME2 NOT NULL,
    Duration INT NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    MeetingLink NVARCHAR(500),
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2,
    
    FOREIGN KEY (OrderId) REFERENCES TutoringOrders(Id),
    FOREIGN KEY (OrderSubjectId) REFERENCES TutoringOrderSubjects(Id),
    FOREIGN KEY (TeacherId) REFERENCES Users(Id),
    FOREIGN KEY (TimeSlotId) REFERENCES TutoringTimeSlots(Id)
);
```

#### 6.5 TutoringTimeSlots
```sql
CREATE TABLE TutoringTimeSlots (
    Id INT PRIMARY KEY IDENTITY,
    DayOfWeek NVARCHAR(20) NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Duration INT NOT NULL,
    MaxStudents INT NOT NULL,
    TeacherId INT,
    SubjectId INT,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    FOREIGN KEY (TeacherId) REFERENCES Users(Id),
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id)
);
```

#### 6.6 TutoringDiscountSettings
```sql
CREATE TABLE TutoringDiscountSettings (
    Id INT PRIMARY KEY IDENTITY,
    SettingKey NVARCHAR(100) UNIQUE NOT NULL,
    SettingValue NVARCHAR(MAX) NOT NULL, -- JSON
    IsActive BIT NOT NULL DEFAULT 1,
    UpdatedBy INT,
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    FOREIGN KEY (UpdatedBy) REFERENCES Users(Id)
);

-- Initial Data
INSERT INTO TutoringDiscountSettings (SettingKey, SettingValue, IsActive) VALUES
('GroupDiscount', '{"IsActive":true,"Percentage":35}', 1),
('MultipleStudentsDiscount', '{"IsActive":true,"TwoStudentsPercentage":5,"ThreeStudentsPercentage":10,"FourPlusStudentsPercentage":15,"MaxPercentage":20}', 1),
('MultipleSubjectsDiscount', '{"IsActive":true,"PercentagePerSubject":5,"MaxPercentage":20}', 1),
('PlanDiscounts', '{"Hours20IsActive":true,"Hours20Percentage":5,"Hours30IsActive":true,"Hours30Percentage":10}', 1);
```

---

## 7. Stripe Integration

### 7.1 Create Stripe Checkout Session

في الـ `CreateOrder` API:

```csharp
public async Task<CreateTutoringOrderResponse> CreateOrder(CreateTutoringOrderRequest request)
{
    // 1. Create order in database
    var order = await _dbContext.TutoringOrders.AddAsync(new TutoringOrder
    {
        // ... order details
    });
    await _dbContext.SaveChangesAsync();
    
    // 2. Create Stripe Checkout Session
    var options = new SessionCreateOptions
    {
        PaymentMethodTypes = new List<string> { "card" },
        LineItems = new List<SessionLineItemOptions>
        {
            new SessionLineItemOptions
            {
                PriceData = new SessionLineItemPriceDataOptions
                {
                    Currency = "usd",
                    ProductData = new SessionLineItemPriceDataProductDataOptions
                    {
                        Name = $"Tutoring Order {order.OrderNumber}",
                        Description = $"{request.TotalStudents} students, {GetTotalSubjects(request)} subjects"
                    },
                    UnitAmount = (long)(request.ExpectedPrice * 100), // Convert to cents
                },
                Quantity = 1,
            },
        },
        Mode = "payment",
        SuccessUrl = $"https://yourapp.com/parent/tutoring/success?orderId={order.Id}",
        CancelUrl = $"https://yourapp.com/parent/tutoring/cancel?orderId={order.Id}",
        ClientReferenceId = order.OrderNumber,
        Metadata = new Dictionary<string, string>
        {
            { "orderId", order.Id.ToString() },
            { "orderNumber", order.OrderNumber }
        }
    };
    
    var service = new SessionService();
    var session = await service.CreateAsync(options);
    
    // 3. Update order with Stripe session ID
    order.StripeSessionId = session.Id;
    await _dbContext.SaveChangesAsync();
    
    // 4. Return response
    return new CreateTutoringOrderResponse
    {
        OrderId = order.Id,
        OrderNumber = order.OrderNumber,
        TotalAmount = order.FinalPrice,
        StripeSessionId = session.Id,
        StripeCheckoutUrl = session.Url,
        ConfirmationCode = order.ConfirmationCode
    };
}
```

### 7.2 Stripe Webhook Handler

```csharp
[HttpPost("webhook")]
public async Task<IActionResult> StripeWebhook()
{
    var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
    
    try
    {
        var stripeEvent = EventUtility.ConstructEvent(
            json,
            Request.Headers["Stripe-Signature"],
            _stripeWebhookSecret
        );
        
        if (stripeEvent.Type == Events.CheckoutSessionCompleted)
        {
            var session = stripeEvent.Data.Object as Session;
            var orderId = int.Parse(session.Metadata["orderId"]);
            
            // Update order status
            var order = await _dbContext.TutoringOrders.FindAsync(orderId);
            order.Status = "Paid";
            order.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            
            // Create tutoring sessions
            await CreateTutoringSessions(order);
            
            // Send confirmation email
            await SendConfirmationEmail(order);
        }
        
        return Ok();
    }
    catch (Exception ex)
    {
        return BadRequest(new { error = ex.Message });
    }
}
```

---

## 8. Price Calculation Logic

### Implementation Example:

```csharp
public class TutoringPriceCalculator
{
    private readonly TutoringDiscountSettings _discountSettings;
    
    public TutoringPriceResponse CalculatePrice(CalculateTutoringPriceRequest request)
    {
        decimal basePrice = CalculateBasePrice(request);
        decimal groupDiscount = 0;
        decimal multipleStudentsDiscount = 0;
        decimal multipleSubjectsDiscount = 0;
        decimal planDiscount = 0;
        
        // 1. Group Tutoring Discount
        if (request.TeachingType == "GroupTutoring" && _discountSettings.GroupDiscount.IsActive)
        {
            groupDiscount = basePrice * (_discountSettings.GroupDiscount.Percentage / 100);
        }
        
        // 2. Multiple Students Discount
        if (_discountSettings.MultipleStudentsDiscount.IsActive)
        {
            var studentsCount = request.StudentSelections.Count;
            decimal percentage = 0;
            
            if (studentsCount == 2)
                percentage = _discountSettings.MultipleStudentsDiscount.TwoStudentsPercentage;
            else if (studentsCount == 3)
                percentage = _discountSettings.MultipleStudentsDiscount.ThreeStudentsPercentage;
            else if (studentsCount >= 4)
                percentage = _discountSettings.MultipleStudentsDiscount.FourPlusStudentsPercentage;
            
            percentage = Math.Min(percentage, _discountSettings.MultipleStudentsDiscount.MaxPercentage);
            multipleStudentsDiscount = (basePrice - groupDiscount) * (percentage / 100);
        }
        
        // 3. Multiple Subjects Discount (per student)
        if (_discountSettings.MultipleSubjectsDiscount.IsActive)
        {
            foreach (var student in request.StudentSelections)
            {
                if (student.Subjects.Count >= 2)
                {
                    var subjectCount = student.Subjects.Count;
                    var percentage = subjectCount * _discountSettings.MultipleSubjectsDiscount.PercentagePerSubject;
                    percentage = Math.Min(percentage, _discountSettings.MultipleSubjectsDiscount.MaxPercentage);
                    
                    var studentTotal = student.Subjects.Sum(s => s.BasePrice);
                    multipleSubjectsDiscount += studentTotal * (percentage / 100);
                }
            }
        }
        
        // 4. Plan Discounts
        foreach (var student in request.StudentSelections)
        {
            foreach (var subject in student.Subjects)
            {
                if (subject.Plan == "20hrs" && _discountSettings.PlanDiscounts.Hours20IsActive)
                {
                    planDiscount += subject.BasePrice * (_discountSettings.PlanDiscounts.Hours20Percentage / 100);
                }
                else if (subject.Plan == "30hrs" && _discountSettings.PlanDiscounts.Hours30IsActive)
                {
                    planDiscount += subject.BasePrice * (_discountSettings.PlanDiscounts.Hours30Percentage / 100);
                }
            }
        }
        
        var totalDiscount = groupDiscount + multipleStudentsDiscount + multipleSubjectsDiscount + planDiscount;
        var finalPrice = basePrice - totalDiscount;
        
        return new TutoringPriceResponse
        {
            BasePrice = basePrice,
            GroupDiscount = groupDiscount,
            MultipleStudentsDiscount = multipleStudentsDiscount,
            MultipleSubjectsDiscount = multipleSubjectsDiscount,
            PlanDiscount = planDiscount,
            TotalDiscount = totalDiscount,
            FinalPrice = finalPrice,
            Breakdown = CreateBreakdown(request, finalPrice)
        };
    }
    
    private decimal CalculateBasePrice(CalculateTutoringPriceRequest request)
    {
        decimal total = 0;
        foreach (var student in request.StudentSelections)
        {
            foreach (var subject in student.Subjects)
            {
                total += subject.BasePrice;
            }
        }
        return total;
    }
}
```

---

## 9. Summary Checklist

### APIs to Implement:

#### Parent Booking: (5 endpoints)
- [ ] `GET /api/Tutoring/time-slots`
- [ ] `POST /api/Tutoring/calculate-price`
- [ ] `POST /api/Tutoring/create-order`
- [ ] `GET /api/Tutoring/booking-confirmation/{orderId}`
- [ ] `POST /api/Tutoring/webhook` (Stripe)

#### Teacher Management: (6 endpoints)
- [ ] `GET /api/Tutoring/teacher/sessions`
- [ ] `PUT /api/Tutoring/teacher/session/{id}/start`
- [ ] `PUT /api/Tutoring/teacher/session/{id}/complete`
- [ ] `PUT /api/Tutoring/teacher/session/{id}/cancel`
- [ ] `PUT /api/Tutoring/teacher/session/{id}/meeting-link`
- [ ] `PUT /api/Tutoring/teacher/session/{id}/notes`

#### Admin Reports: (4 endpoints)
- [ ] `GET /api/Tutoring/admin/reports`
- [ ] `GET /api/Tutoring/admin/orders`
- [ ] `GET /api/Tutoring/admin/top-teachers`
- [ ] `GET /api/Tutoring/admin/popular-subjects`

#### Admin Discounts: (5 endpoints)
- [ ] `GET /api/Tutoring/admin/discounts`
- [ ] `PUT /api/Tutoring/admin/discounts/group`
- [ ] `PUT /api/Tutoring/admin/discounts/students`
- [ ] `PUT /api/Tutoring/admin/discounts/subjects`
- [ ] `PUT /api/Tutoring/admin/discounts/plans`

**Total:** 20 API endpoints

### Database Tables:
- [ ] TutoringOrders
- [ ] TutoringOrderStudents
- [ ] TutoringOrderSubjects
- [ ] TutoringSessions
- [ ] TutoringTimeSlots
- [ ] TutoringDiscountSettings

**Total:** 6 tables

### Additional Requirements:
- [ ] Stripe Integration
- [ ] Email Notifications
- [ ] Price Calculation Engine
- [ ] Session Scheduling Logic
- [ ] Report Generation

---

## 10. Testing Endpoints

### Postman Collection Example:

```json
{
  "info": {
    "name": "Tutoring System APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Parent Booking",
      "item": [
        {
          "name": "Get Time Slots",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/Tutoring/time-slots?academicYearId=1&teachingType=GroupTutoring"
          }
        },
        {
          "name": "Calculate Price",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/Tutoring/calculate-price",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"teachingType\": \"GroupTutoring\",\n  \"academicYearId\": 1,\n  \"studentSelections\": []\n}"
            }
          }
        }
      ]
    }
  ]
}
```

---

## 📞 Questions or Issues?

إذا كان في أي استفسارات أو مشاكل في التنفيذ، يرجى التواصل.

---

**Date Created:** December 18, 2025  
**Frontend Version:** Complete  
**Backend Status:** Pending Implementation  
**Priority:** High  

---

*End of Backend Requirements Document*
