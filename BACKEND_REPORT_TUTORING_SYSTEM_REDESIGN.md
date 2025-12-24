# 📌 BACKEND REPORT: Complete Tutoring System Redesign

---

## 🔴 **PRIORITY: CRITICAL**
## **DATE:** December 24, 2025
## **SYSTEM:** NaplanBridge Tutoring Platform

---

## 📋 **Overview**

Complete redesign of the tutoring booking system to provide maximum flexibility:

### **New Flow:**
```
1. Select Students (with Add New button)
2. Select Subjects per Student (5% discount per additional subject, max 20%)
3. Select Teaching Type per Subject (OneToOne or Group - 35% discount)
4. Select Hours per Subject (10/20/30 hours with additional discounts)
5. Smart Scheduling (based on teacher priority 1-10)
```

---

## 🗄️ **DATABASE CHANGES**

### **1. Teachers Table - Add Priority Field**

```sql
-- Add Priority column
ALTER TABLE Teachers
ADD Priority INT NOT NULL DEFAULT 5;

-- Add constraint
ALTER TABLE Teachers
ADD CONSTRAINT CK_Teachers_Priority CHECK (Priority BETWEEN 1 AND 10);

-- Add index for performance
CREATE INDEX IX_Teachers_Priority ON Teachers(Priority DESC);

-- Add comment
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Teacher priority for smart scheduling (1-10, where 10 is highest priority)', 
    @level0type = N'Schema', @level0name = 'dbo',
    @level1type = N'Table',  @level1name = 'Teachers',
    @level2type = N'Column', @level2name = 'Priority';
```

**Description:**
- Priority range: 1-10 (10 = highest priority for scheduling)
- Default value: 5 (medium priority)
- Used by smart scheduling algorithm to prioritize teachers
- Index created for efficient sorting

---

### **2. TeacherAvailability Table (NEW)**

```sql
CREATE TABLE TeacherAvailability (
    Id INT PRIMARY KEY IDENTITY(1,1),
    TeacherId INT NOT NULL,
    DayOfWeek INT NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
    StartTime TIME(0) NOT NULL,
    EndTime TIME(0) NOT NULL,
    SessionType NVARCHAR(20) NOT NULL,
    MaxStudents INT NULL,
    SubjectId INT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2(0) NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2(0) NOT NULL DEFAULT GETDATE(),
    
    -- Foreign Keys
    CONSTRAINT FK_TeacherAvailability_Teacher 
        FOREIGN KEY (TeacherId) REFERENCES Teachers(Id) ON DELETE CASCADE,
    CONSTRAINT FK_TeacherAvailability_Subject 
        FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT CK_TeacherAvailability_SessionType 
        CHECK (SessionType IN ('OneToOne', 'Group', 'BookingFirst')),
    CONSTRAINT CK_TeacherAvailability_DayOfWeek 
        CHECK (DayOfWeek BETWEEN 0 AND 6),
    CONSTRAINT CK_TeacherAvailability_TimeRange 
        CHECK (EndTime > StartTime),
    CONSTRAINT CK_TeacherAvailability_MaxStudents CHECK (
        (SessionType = 'Group' AND MaxStudents IS NOT NULL AND MaxStudents BETWEEN 2 AND 10) OR
        (SessionType != 'Group' AND MaxStudents IS NULL)
    )
);

-- Indexes
CREATE INDEX IX_TeacherAvailability_Teacher 
    ON TeacherAvailability(TeacherId);
CREATE INDEX IX_TeacherAvailability_DayOfWeek 
    ON TeacherAvailability(DayOfWeek);
CREATE INDEX IX_TeacherAvailability_Active 
    ON TeacherAvailability(IsActive) WHERE IsActive = 1;
CREATE INDEX IX_TeacherAvailability_Subject 
    ON TeacherAvailability(SubjectId) WHERE SubjectId IS NOT NULL;

-- Trigger for UpdatedAt
CREATE TRIGGER TR_TeacherAvailability_UpdatedAt
ON TeacherAvailability
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE TeacherAvailability
    SET UpdatedAt = GETDATE()
    FROM TeacherAvailability ta
    INNER JOIN inserted i ON ta.Id = i.Id;
END;
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `SessionType` | NVARCHAR(20) | **OneToOne**: Private 1-on-1 sessions<br>**Group**: Group sessions (requires MaxStudents 2-10)<br>**BookingFirst**: First booking determines the type |
| `MaxStudents` | INT | Required if SessionType = 'Group'<br>Range: 2-10 students<br>NULL for other types |
| `SubjectId` | INT | Optional - if teacher specializes in specific subject<br>NULL means available for any subject they teach |
| `DayOfWeek` | INT | 0=Sunday, 1=Monday, ..., 6=Saturday |

---

### **3. TutoringBookings Table - Updates**

```sql
-- Add new columns for per-subject settings
ALTER TABLE TutoringBookings
ADD TeachingType NVARCHAR(20) NOT NULL DEFAULT 'OneToOne';

ALTER TABLE TutoringBookings
ADD Hours INT NOT NULL DEFAULT 10;

ALTER TABLE TutoringBookings
ADD SubjectDiscount DECIMAL(5,2) NOT NULL DEFAULT 0;

ALTER TABLE TutoringBookings
ADD GroupDiscount DECIMAL(5,2) NOT NULL DEFAULT 0;

ALTER TABLE TutoringBookings
ADD HoursDiscount DECIMAL(5,2) NOT NULL DEFAULT 0;

-- Add constraints
ALTER TABLE TutoringBookings
ADD CONSTRAINT CK_TutoringBookings_TeachingType 
    CHECK (TeachingType IN ('OneToOne', 'Group'));

ALTER TABLE TutoringBookings
ADD CONSTRAINT CK_TutoringBookings_Hours 
    CHECK (Hours IN (10, 20, 30));

ALTER TABLE TutoringBookings
ADD CONSTRAINT CK_TutoringBookings_SubjectDiscount 
    CHECK (SubjectDiscount BETWEEN 0 AND 20);

ALTER TABLE TutoringBookings
ADD CONSTRAINT CK_TutoringBookings_GroupDiscount 
    CHECK (GroupDiscount IN (0, 35));

ALTER TABLE TutoringBookings
ADD CONSTRAINT CK_TutoringBookings_HoursDiscount 
    CHECK (HoursDiscount BETWEEN 0 AND 10);
```

---

## 🔌 **API ENDPOINTS**

### **A. ADMIN - Teacher Management**

#### **1. Update Teacher Priority**
```http
PUT /api/Admin/Teachers/{teacherId}/Priority
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "priority": 8
}
```

**Validation:**
- Priority must be between 1 and 10
- Teacher must exist
- User must have Admin role

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Teacher priority updated successfully",
  "data": {
    "teacherId": 15,
    "priority": 8,
    "updatedAt": "2025-12-24T10:30:00Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Priority must be between 1 and 10"
}
```

---

#### **2. Get All Teachers with Priority**
```http
GET /api/Admin/Teachers?sortBy=priority
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `sortBy`: "priority" | "name" | "subject" (default: "name")
- `orderBy`: "asc" | "desc" (default: "desc" for priority)
- `page`: number (default: 1)
- `pageSize`: number (default: 20)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 15,
      "name": "John Doe",
      "email": "john@example.com",
      "priority": 9,
      "subjects": ["Mathematics", "Physics"],
      "isActive": true,
      "totalBookings": 45,
      "avgRating": 4.8
    },
    {
      "id": 22,
      "name": "Sara Ahmed",
      "email": "sara@example.com",
      "priority": 7,
      "subjects": ["English", "Arabic"],
      "isActive": true,
      "totalBookings": 32,
      "avgRating": 4.6
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 94,
    "pageSize": 20
  }
}
```

---

### **B. TEACHER - Availability Management**

#### **1. Create Availability Slot**
```http
POST /api/Teacher/Availability
Authorization: Bearer {teacher_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "dayOfWeek": 1,
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "sessionType": "Group",
  "maxStudents": 5,
  "subjectId": 10
}
```

**Field Validation:**
- `dayOfWeek`: 0-6 (0=Sunday)
- `startTime`: HH:mm:ss format
- `endTime`: Must be after startTime, min 30 minutes
- `sessionType`: "OneToOne" | "Group" | "BookingFirst"
- `maxStudents`: Required if Group (2-10), null otherwise
- `subjectId`: Optional, must be a subject teacher teaches

**Business Rules:**
1. Cannot overlap with existing slots
2. Duration must be at least 30 minutes
3. Must be within reasonable hours (6 AM - 11 PM)
4. Teacher must teach the subject if subjectId is provided

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Availability slot created successfully",
  "data": {
    "id": 123,
    "teacherId": 15,
    "dayOfWeek": 1,
    "dayName": "Monday",
    "startTime": "09:00:00",
    "endTime": "10:00:00",
    "sessionType": "Group",
    "maxStudents": 5,
    "subjectId": 10,
    "subjectName": "Mathematics",
    "isActive": true,
    "currentBookings": 0,
    "createdAt": "2025-12-24T10:30:00Z"
  }
}
```

**Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Time slot overlaps with existing availability",
  "conflicts": [
    {
      "id": 98,
      "startTime": "08:30:00",
      "endTime": "09:30:00"
    }
  ]
}
```

---

#### **2. Get Teacher's Availability Slots**
```http
GET /api/Teacher/Availability?includeInactive=false
Authorization: Bearer {teacher_token}
```

**Query Parameters:**
- `includeInactive`: boolean (default: false)
- `dayOfWeek`: number (0-6, optional)
- `subjectId`: number (optional)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 123,
      "dayOfWeek": 1,
      "dayName": "Monday",
      "startTime": "09:00:00",
      "endTime": "10:00:00",
      "sessionType": "Group",
      "maxStudents": 5,
      "subjectId": 10,
      "subjectName": "Mathematics",
      "isActive": true,
      "currentBookings": 2,
      "upcomingSessions": [
        {
          "date": "2025-12-29",
          "studentCount": 2,
          "studentNames": ["Ahmed Ali", "Sara Hassan"]
        }
      ]
    },
    {
      "id": 124,
      "dayOfWeek": 2,
      "dayName": "Tuesday",
      "startTime": "10:00:00",
      "endTime": "11:00:00",
      "sessionType": "OneToOne",
      "maxStudents": null,
      "subjectId": null,
      "subjectName": "Any Subject",
      "isActive": true,
      "currentBookings": 0,
      "upcomingSessions": []
    }
  ]
}
```

---

#### **3. Update Availability Slot**
```http
PUT /api/Teacher/Availability/{id}
Authorization: Bearer {teacher_token}
Content-Type: application/json
```

**Request Body:** Same as Create

**Business Rules:**
1. Cannot change if there are upcoming bookings (must cancel bookings first)
2. Can only deactivate (isActive=false) if bookings exist

**Response (200 OK):** Same structure as Create

**Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Cannot update slot with upcoming bookings",
  "upcomingBookingsCount": 3,
  "nextBookingDate": "2025-12-28T09:00:00Z"
}
```

---

#### **4. Delete Availability Slot**
```http
DELETE /api/Teacher/Availability/{id}
Authorization: Bearer {teacher_token}
```

**Business Rules:**
- Cannot delete if there are upcoming bookings
- Soft delete (sets IsActive = false) if past bookings exist
- Hard delete if no bookings exist

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Availability slot deleted successfully",
  "wasHardDeleted": true
}
```

---

#### **5. Get Teacher's Sessions (Management)**
```http
GET /api/Teacher/Sessions?status=Scheduled&startDate=2025-01-01&endDate=2025-03-31
Authorization: Bearer {teacher_token}
```

**Query Parameters:**
- `status`: "Scheduled" | "Completed" | "Cancelled" (optional)
- `startDate`: ISO date (optional)
- `endDate`: ISO date (optional)
- `sessionType`: "OneToOne" | "Group" (optional)
- `page`: number (default: 1)
- `pageSize`: number (default: 20)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 456,
      "sessionType": "OneToOne",
      "studentId": 10,
      "studentName": "Ahmed Ali",
      "subjectId": 5,
      "subjectName": "Mathematics",
      "dateTime": "2025-01-15T09:00:00Z",
      "duration": 60,
      "status": "Scheduled",
      "meetingLink": "https://meet.google.com/abc-defg-hij",
      "studentCount": 1,
      "maxStudents": null,
      "notes": "Focus on algebra"
    },
    {
      "id": 457,
      "sessionType": "Group",
      "studentIds": [11, 12],
      "studentNames": ["Sara Ahmed", "Mona Hassan"],
      "subjectId": 8,
      "subjectName": "Physics",
      "dateTime": "2025-01-15T10:00:00Z",
      "duration": 60,
      "status": "Scheduled",
      "meetingLink": "https://meet.google.com/xyz-abcd-efg",
      "studentCount": 2,
      "maxStudents": 5,
      "notes": null
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalRecords": 45
  }
}
```

---

#### **6. Cancel Session**
```http
PUT /api/Teacher/Sessions/{id}/Cancel
Authorization: Bearer {teacher_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Teacher unavailable due to emergency",
  "notifyStudents": true,
  "offerReschedule": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session cancelled successfully",
  "studentsNotified": true,
  "refundInitiated": false
}
```

---

#### **7. Reschedule Session**
```http
PUT /api/Teacher/Sessions/{id}/Reschedule
Authorization: Bearer {teacher_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "newDateTime": "2025-01-16T09:00:00Z",
  "reason": "Original time not suitable",
  "notifyStudents": true
}
```

**Validation:**
- New time must match teacher's availability
- Must be at least 24 hours in advance
- Student must confirm if less than 48 hours notice

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session rescheduled successfully",
  "newDateTime": "2025-01-16T09:00:00Z",
  "requiresStudentConfirmation": false
}
```

---

### **C. PARENT - Updated Booking Flow**

#### **1. Get Available Slots (Smart Scheduling)**
```http
POST /api/Tutoring/AvailableSlots
Authorization: Bearer {parent_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentSelections": [
    {
      "studentId": 10,
      "subjects": [
        {
          "subjectId": 5,
          "teachingType": "OneToOne",
          "hours": 20
        },
        {
          "subjectId": 8,
          "teachingType": "Group",
          "hours": 10
        }
      ]
    }
  ],
  "startDate": "2025-01-15",
  "endDate": "2025-03-15",
  "preferredDays": [1, 3, 5],
  "preferredTimeRange": {
    "start": "16:00:00",
    "end": "19:00:00"
  }
}
```

**Business Logic:**
1. Calculate total sessions needed (hours ÷ 1-hour sessions)
2. Find teachers for each subject sorted by:
   - Priority (10 → 1)
   - Availability match
   - Current load (least busy first)
   - Rating (if tied)
3. Try to assign same teacher for multiple subjects if possible
4. Return slots that match preferred days/times first

**Response (200 OK):**
```json
{
  "recommendedSchedule": {
    "teachers": [
      {
        "teacherId": 15,
        "teacherName": "John Doe",
        "priority": 9,
        "rating": 4.8,
        "matchedSubjects": ["Mathematics", "Physics"],
        "subjectSchedules": [
          {
            "subjectId": 5,
            "subjectName": "Mathematics",
            "teachingType": "OneToOne",
            "totalSessions": 20,
            "slots": [
              {
                "dateTime": "2025-01-15T16:00:00Z",
                "dayOfWeek": 3,
                "isPreferred": true,
                "availabilityId": 123,
                "conflictingBookings": 0
              },
              {
                "dateTime": "2025-01-17T16:00:00Z",
                "dayOfWeek": 5,
                "isPreferred": true,
                "availabilityId": 123,
                "conflictingBookings": 0
              }
            ]
          }
        ]
      }
    ]
  },
  "alternativeTeachers": [
    {
      "teacherId": 22,
      "teacherName": "Sara Ahmed",
      "priority": 7,
      "rating": 4.6,
      "matchedSubjects": ["Mathematics"],
      "availableSlots": 15
    }
  ],
  "summary": {
    "totalSessions": 30,
    "matchedSessions": 28,
    "unmatchedSessions": 2,
    "sameTeacherForMultipleSubjects": true
  }
}
```

---

#### **2. Calculate Price (NEW DISCOUNT STRUCTURE)**
```http
POST /api/Tutoring/CalculatePrice
Authorization: Bearer {parent_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentSelections": [
    {
      "studentId": 10,
      "studentName": "Ahmed Ali",
      "subjects": [
        {
          "subjectId": 5,
          "subjectName": "Mathematics",
          "basePrice": 100,
          "teachingType": "OneToOne",
          "hours": 20
        },
        {
          "subjectId": 8,
          "subjectName": "Physics",
          "basePrice": 120,
          "teachingType": "Group",
          "hours": 10
        },
        {
          "subjectId": 12,
          "subjectName": "Chemistry",
          "basePrice": 110,
          "teachingType": "OneToOne",
          "hours": 10
        }
      ]
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "students": [
    {
      "studentId": 10,
      "studentName": "Ahmed Ali",
      "subjects": [
        {
          "subjectId": 5,
          "subjectName": "Mathematics",
          "hours": 20,
          "teachingType": "OneToOne",
          "basePrice": 2000,
          "discounts": {
            "multiSubject": {
              "percentage": 10,
              "amount": 200,
              "reason": "3 subjects selected"
            },
            "hours": {
              "percentage": 5,
              "amount": 100,
              "reason": "20 hours plan"
            },
            "group": {
              "percentage": 0,
              "amount": 0,
              "reason": "OneToOne session"
            }
          },
          "totalDiscount": 300,
          "finalPrice": 1700
        },
        {
          "subjectId": 8,
          "subjectName": "Physics",
          "hours": 10,
          "teachingType": "Group",
          "basePrice": 1200,
          "discounts": {
            "multiSubject": {
              "percentage": 10,
              "amount": 120,
              "reason": "3 subjects selected"
            },
            "hours": {
              "percentage": 0,
              "amount": 0,
              "reason": "10 hours - no hours discount"
            },
            "group": {
              "percentage": 35,
              "amount": 420,
              "reason": "Group session"
            }
          },
          "totalDiscount": 540,
          "finalPrice": 660
        },
        {
          "subjectId": 12,
          "subjectName": "Chemistry",
          "hours": 10,
          "teachingType": "OneToOne",
          "basePrice": 1100,
          "discounts": {
            "multiSubject": {
              "percentage": 10,
              "amount": 110,
              "reason": "3 subjects selected"
            },
            "hours": {
              "percentage": 0,
              "amount": 0,
              "reason": "10 hours - no hours discount"
            },
            "group": {
              "percentage": 0,
              "amount": 0,
              "reason": "OneToOne session"
            }
          },
          "totalDiscount": 110,
          "finalPrice": 990
        }
      ],
      "studentSubtotal": 4300,
      "studentTotalDiscount": 950,
      "studentTotal": 3350
    }
  ],
  "grandTotal": 3350,
  "totalDiscount": 950,
  "overallDiscountPercentage": 22.09,
  "breakdown": {
    "multiSubjectSavings": 430,
    "groupSavings": 420,
    "hoursSavings": 100
  }
}
```

---

## 🧮 **DISCOUNT CALCULATION ALGORITHM**

### **C# Implementation:**

```csharp
public class DiscountCalculator
{
    public decimal CalculateFinalPrice(
        Subject subject, 
        int hours, 
        string teachingType, 
        int totalSubjectsForStudent)
    {
        decimal basePrice = subject.Price * hours;
        decimal totalDiscount = 0;
        
        // 1. Multi-Subject Discount (per student)
        decimal subjectDiscountPercentage = GetSubjectDiscountPercentage(totalSubjectsForStudent);
        decimal subjectDiscount = basePrice * (subjectDiscountPercentage / 100);
        totalDiscount += subjectDiscount;
        
        // 2. Group Discount (per subject)
        if (teachingType == "Group")
        {
            decimal groupDiscount = basePrice * 0.35m; // 35%
            totalDiscount += groupDiscount;
        }
        
        // 3. Hours Discount (per subject)
        // Special: 20+ hours can add to subject count for discount eligibility
        if (hours >= 20)
        {
            int hoursAsSubjects = hours / 10;
            int effectiveSubjects = totalSubjectsForStudent + (hoursAsSubjects - 1);
            
            // Only apply if total effective subjects <= 5 (max discount cap)
            if (effectiveSubjects <= 5)
            {
                decimal hoursDiscountPercentage = GetHoursDiscountPercentage(hours);
                decimal hoursDiscount = basePrice * (hoursDiscountPercentage / 100);
                totalDiscount += hoursDiscount;
            }
        }
        
        // Cap total discount at 60% of base price (safety measure)
        decimal maxDiscount = basePrice * 0.60m;
        totalDiscount = Math.Min(totalDiscount, maxDiscount);
        
        return Math.Round(basePrice - totalDiscount, 2);
    }
    
    private decimal GetSubjectDiscountPercentage(int subjectCount)
    {
        return subjectCount switch
        {
            1 => 0,
            2 => 5,
            3 => 10,
            4 => 15,
            >= 5 => 20,
            _ => 0
        };
    }
    
    private decimal GetHoursDiscountPercentage(int hours)
    {
        return hours switch
        {
            10 => 0,
            20 => 5,
            30 => 10,
            _ => 0
        };
    }
}
```

### **Discount Rules Summary:**

| Discount Type | Condition | Percentage |
|--------------|-----------|------------|
| **Multi-Subject** | 1 subject | 0% |
| | 2 subjects | 5% |
| | 3 subjects | 10% |
| | 4 subjects | 15% |
| | 5+ subjects | 20% (MAX) |
| **Group** | OneToOne | 0% |
| | Group | 35% |
| **Hours** | 10 hours | 0% |
| | 20 hours | 5% |
| | 30 hours | 10% |

**Special Rule:** 20 hours = treated as 2 subjects for discount calculation purposes

---

## 🎯 **SMART SCHEDULING ALGORITHM**

### **Priority-Based Teacher Selection:**

```csharp
public async Task<List<TeacherSlot>> GetAvailableSlots(
    int subjectId, 
    string teachingType, 
    DateTime startDate, 
    DateTime endDate)
{
    // 1. Get teachers for subject, ordered by priority
    var teachers = await _context.Teachers
        .Include(t => t.SubjectTeachers)
        .Include(t => t.Availabilities)
        .Where(t => t.IsActive && 
                    t.SubjectTeachers.Any(st => st.SubjectId == subjectId))
        .OrderByDescending(t => t.Priority) // 10 → 1
        .ThenBy(t => t.CurrentBookingCount) // Least busy
        .ThenByDescending(t => t.Rating) // Highest rated
        .ToListAsync();
    
    var availableSlots = new List<TeacherSlot>();
    
    foreach (var teacher in teachers)
    {
        // 2. Get matching availabilities
        var availabilities = teacher.Availabilities
            .Where(a => a.IsActive &&
                       (a.SessionType == teachingType || 
                        a.SessionType == "BookingFirst") &&
                       (a.SubjectId == null || a.SubjectId == subjectId))
            .ToList();
        
        // 3. Generate time slots
        foreach (var availability in availabilities)
        {
            var slots = GenerateTimeSlots(
                availability, 
                startDate, 
                endDate, 
                teachingType);
            
            availableSlots.AddRange(slots);
            
            // Early exit if enough slots found
            if (availableSlots.Count >= requiredSlots)
            {
                return availableSlots.Take(requiredSlots).ToList();
            }
        }
    }
    
    return availableSlots;
}

private List<TimeSlot> GenerateTimeSlots(
    TeacherAvailability availability,
    DateTime startDate,
    DateTime endDate,
    string teachingType)
{
    var slots = new List<TimeSlot>();
    var currentDate = startDate;
    
    while (currentDate <= endDate)
    {
        // Check if day matches
        if ((int)currentDate.DayOfWeek == availability.DayOfWeek)
        {
            var slotDateTime = currentDate.Date + availability.StartTime;
            
            // Check if slot is not already booked
            if (!IsSlotBooked(availability.TeacherId, slotDateTime, teachingType))
            {
                slots.Add(new TimeSlot
                {
                    TeacherId = availability.TeacherId,
                    DateTime = slotDateTime,
                    AvailabilityId = availability.Id,
                    SessionType = teachingType
                });
            }
        }
        
        currentDate = currentDate.AddDays(1);
    }
    
    return slots;
}
```

---

## 📊 **DATA TRANSFER OBJECTS (DTOs)**

### **TeacherAvailabilityDto:**
```csharp
public class TeacherAvailabilityDto
{
    public int Id { get; set; }
    public int TeacherId { get; set; }
    public int DayOfWeek { get; set; }
    public string DayName { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string SessionType { get; set; }
    public int? MaxStudents { get; set; }
    public int? SubjectId { get; set; }
    public string SubjectName { get; set; }
    public bool IsActive { get; set; }
    public int CurrentBookings { get; set; }
    public List<UpcomingSessionDto> UpcomingSessions { get; set; }
}
```

### **TeacherSessionDto:**
```csharp
public class TeacherSessionDto
{
    public int Id { get; set; }
    public string SessionType { get; set; }
    public List<int> StudentIds { get; set; }
    public List<string> StudentNames { get; set; }
    public int SubjectId { get; set; }
    public string SubjectName { get; set; }
    public DateTime DateTime { get; set; }
    public int Duration { get; set; }
    public string Status { get; set; }
    public string MeetingLink { get; set; }
    public int StudentCount { get; set; }
    public int? MaxStudents { get; set; }
    public string Notes { get; set; }
}
```

### **PriceCalculationRequest:**
```csharp
public class PriceCalculationRequest
{
    public List<StudentSelectionDto> StudentSelections { get; set; }
}

public class StudentSelectionDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; }
    public List<SubjectSelectionDto> Subjects { get; set; }
}

public class SubjectSelectionDto
{
    public int SubjectId { get; set; }
    public string SubjectName { get; set; }
    public decimal BasePrice { get; set; }
    public string TeachingType { get; set; }
    public int Hours { get; set; }
}
```

---

## ✅ **VALIDATION RULES**

### **TeacherAvailability Validation:**
1. ✅ DayOfWeek must be 0-6
2. ✅ StartTime < EndTime
3. ✅ Minimum duration: 30 minutes
4. ✅ SessionType must be valid enum value
5. ✅ MaxStudents required if Group (2-10)
6. ✅ Cannot overlap with existing slots
7. ✅ SubjectId must be one teacher teaches

### **Booking Validation:**
1. ✅ Student must be active
2. ✅ Subject must exist and be active
3. ✅ Teacher must be available for selected slot
4. ✅ Hours must be 10, 20, or 30
5. ✅ TeachingType must match availability
6. ✅ Group booking respects MaxStudents limit
7. ✅ Booking must be at least 24 hours in advance

---

## 🚀 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Database (CRITICAL)**
- [ ] Add Priority field to Teachers table
- [ ] Create TeacherAvailability table
- [ ] Update TutoringBookings table
- [ ] Create necessary indexes
- [ ] Create update triggers
- [ ] Test database migrations

### **Phase 2: Admin APIs**
- [ ] Teacher priority CRUD endpoints
- [ ] Teacher list with priority sorting
- [ ] Teacher statistics dashboard

### **Phase 3: Teacher APIs**
- [ ] Availability CRUD endpoints
- [ ] Session management endpoints
- [ ] Cancel/reschedule functionality
- [ ] Conflict detection

### **Phase 4: Parent APIs**
- [ ] Smart slot availability
- [ ] New price calculation
- [ ] Booking creation with new structure
- [ ] Schedule optimization

### **Phase 5: Testing**
- [ ] Unit tests for discount calculation
- [ ] Integration tests for scheduling
- [ ] Load tests for priority queries
- [ ] E2E tests for full booking flow

---

## ⚠️ **IMPORTANT NOTES**

1. **Priority Importance:** Higher priority (10) = scheduled first
2. **BookingFirst Type:** First booking locks the session type
3. **Discount Stacking:** All discounts can stack (multi-subject + group + hours)
4. **Maximum Discount:** Cap at 60% to ensure profitability
5. **24-Hour Rule:** Bookings must be at least 24 hours in advance
6. **Cancellation Policy:** Teachers can cancel with proper notice
7. **Rescheduling:** Requires availability and student confirmation

---

## 📞 **EXPECTED CONFIRMATION**

Please implement these changes and confirm:

```
✅ BACKEND IMPLEMENTATION COMPLETE
Date: _______________

Completed Items:
□ Teachers.Priority field added
□ TeacherAvailability table created
□ TutoringBookings table updated
□ Admin APIs implemented
□ Teacher APIs implemented
□ Parent APIs implemented
□ Discount calculation tested
□ Smart scheduling tested
□ All validations in place
□ Documentation updated

Deployed To: □ Development  □ Staging  □ Production
```

---

**Report Generated:** December 24, 2025  
**Frontend Developer:** Ahmed Hamdi  
**System:** NaplanBridge Tutoring Platform  
**Version:** 2.0 - Flexible Booking System
