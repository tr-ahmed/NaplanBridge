# 📌 BACKEND REPORT: Teacher Tutoring System Improvements

**Date:** 2025-12-25  
**Frontend:** Angular 17 - NaplanBridge  
**Status:** ⏳ Pending Backend Implementation

---

## Summary

The frontend requires **3 new endpoints** for managing teacher exception days (holidays/time off), and an **update to the available slots calculation logic** to exclude exception dates.

---

## New Endpoints Required

### 1. GET `/api/Sessions/teacher/exceptions`

Get all exception days for the authenticated teacher.

**Request:**
```http
GET /api/Sessions/teacher/exceptions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "teacherId": 5,
      "startDate": "2025-12-31",
      "endDate": "2025-12-31",
      "reason": "New Year's Eve",
      "createdAt": "2025-12-20T10:00:00Z"
    },
    {
      "id": 2,
      "teacherId": 5,
      "startDate": "2025-01-01",
      "endDate": "2025-01-03",
      "reason": "Winter Holiday",
      "createdAt": "2025-12-20T10:00:00Z"
    }
  ],
  "message": "Exceptions retrieved successfully"
}
```

---

### 2. POST `/api/Sessions/teacher/exceptions`

Add a new exception day or date range.

**Request:**
```http
POST /api/Sessions/teacher/exceptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2025-12-31",
  "endDate": "2026-01-01",  // Optional - defaults to startDate if not provided
  "reason": "New Year Holiday"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exception added successfully",
  "data": {
    "id": 3,
    "teacherId": 5,
    "startDate": "2025-12-31",
    "endDate": "2026-01-01",
    "reason": "New Year Holiday",
    "createdAt": "2025-12-25T22:00:00Z"
  }
}
```

**Validation:**
- `startDate` is required
- `startDate` must be today or in the future
- `endDate` must be >= `startDate` if provided
- Should not overlap with existing exceptions (optional - can merge overlaps)

---

### 3. DELETE `/api/Sessions/teacher/exceptions/{id}`

Delete an exception day.

**Request:**
```http
DELETE /api/Sessions/teacher/exceptions/3
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Exception deleted successfully"
}
```

---

## Database Schema Suggestion

```sql
CREATE TABLE TeacherExceptions (
    Id INT PRIMARY KEY IDENTITY(1,1),
    TeacherId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Reason NVARCHAR(255) NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    
    INDEX IX_TeacherExceptions_TeacherId (TeacherId),
    INDEX IX_TeacherExceptions_DateRange (TeacherId, StartDate, EndDate)
);
```

---

## ⚠️ CRITICAL: Update Available Slots Calculation

### Current Issue
When parents browse available tutoring slots, the system currently shows ALL slots from teacher availability without considering exception days.

### Required Update

The existing endpoint(s) that return available slots for booking MUST exclude dates that fall within a teacher's exception periods.

**Affected Endpoints (to update):**
- `GET /api/Teacher/Availability/Slots` (or similar)
- `GET /api/Tutoring/AvailableSlots/Smart`
- Any endpoint used by parent tutoring booking flow

**Logic:**

```csharp
public List<AvailableSlotDto> GetAvailableSlots(int teacherId, DateTime fromDate, DateTime toDate)
{
    // 1. Get teacher's weekly recurring availability
    var weeklyAvailability = GetTeacherWeeklyAvailability(teacherId);
    
    // 2. Get exception days for this teacher
    var exceptions = _context.TeacherExceptions
        .Where(e => e.TeacherId == teacherId)
        .Where(e => e.EndDate >= fromDate && e.StartDate <= toDate)
        .ToList();
    
    // 3. Get already booked slots
    var bookedSlots = GetBookedSlots(teacherId, fromDate, toDate);
    
    var availableSlots = new List<AvailableSlotDto>();
    
    // 4. Generate slots for each day in range
    for (var date = fromDate.Date; date <= toDate.Date; date = date.AddDays(1))
    {
        // ✅ SKIP if date falls within an exception period
        if (exceptions.Any(e => date >= e.StartDate && date <= e.EndDate))
            continue;
            
        var dayOfWeek = (int)date.DayOfWeek;
        var daySlots = weeklyAvailability.Where(a => a.DayOfWeek == dayOfWeek);
        
        foreach (var slot in daySlots)
        {
            var slotDateTime = date.Add(TimeSpan.Parse(slot.StartTime));
            
            // Skip if already booked
            if (bookedSlots.Any(b => b.DateTime == slotDateTime))
                continue;
                
            availableSlots.Add(new AvailableSlotDto 
            { 
                DateTime = slotDateTime,
                TeacherId = teacherId,
                // ... other props
            });
        }
    }
    
    return availableSlots;
}
```

---

## Impact

| Area | Impact |
|------|--------|
| **Frontend: Teacher Availability** | Cannot display or manage exception days |
| **Frontend: Parent Booking** | Will show slots on exception days as available (incorrect) |
| **User Experience** | Parents may book slots that teacher cannot fulfill |

---

## Request

Please implement the 3 endpoints above and update the available slots calculation.

**Confirm when ready:**
```
✔ BACKEND FIX CONFIRMED
```

---

## Contact

If you have questions about the expected behavior or data format, please reach out before implementation.
