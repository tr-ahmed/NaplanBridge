# 📌 BACKEND REPORT: Alternative Slots API Needed

**Date:** 2025-12-26  
**Feature:** Slot Swap in Smart Scheduling  
**Priority:** 🟡 Medium

---

## Problem Description

The frontend Swap Modal needs to show **alternative available slots** that are NOT already assigned in the schedule. However, the current Smart Scheduling API only returns the slots it has **already assigned**.

### Current Flow:
1. User clicks "Swap" on a slot (e.g., Sunday Jan 19 at 09:00)
2. Frontend opens modal to show alternatives
3. Frontend can only show OTHER slots from the SAME response
4. These are NOT alternatives - they're other assigned sessions!

### Expected Flow:
1. User clicks "Swap" on a slot
2. Frontend calls API: "Give me OTHER available times for this teacher/subject"
3. API returns slots NOT in the current schedule
4. User selects a new time

---

## Current API Limitations

### `POST /api/Tutoring/AvailableSlots` (Smart Scheduling)
- ✅ Returns `recommendedSchedule.teachers[].subjectSchedules[].slots[]`
- ❌ Only returns slots it ASSIGNS (e.g., 10 out of 50 available)
- ❌ Does NOT return the other 40 available slots

### `GET /api/Tutoring/time-slots` (Legacy)
- Returns `TimeSlot[]` with `dayOfWeek`, `startTime`, `endTime`
- ❌ Returns day/time patterns, NOT specific dates
- ❌ Cannot be used for swapping specific dated slots

---

## Proposed Solution

### Option 1: New Endpoint (Recommended)

Create a new endpoint to get alternative slots for a given teacher/subject:

```
GET /api/Tutoring/AlternativeSlots
    ?teacherId=51
    &subjectId=23
    &startDate=2025-01-15
    &endDate=2025-04-15
    &excludeSlotIds=101,102,103 (currently assigned slots)
```

**Response:**
```json
{
  "alternativeSlots": [
    {
      "availabilityId": 201,
      "dateTime": "2025-01-21T14:00:00",
      "dayOfWeek": 2,
      "duration": 60,
      "isPreferred": false,
      "teacherId": 51,
      "teacherName": "moataz"
    },
    // ... more slots that are AVAILABLE but NOT ASSIGNED
  ]
}
```

### Option 2: Enhance Smart Scheduling Response

Add an `additionalSlots` array to the current response:

```json
{
  "recommendedSchedule": {
    "teachers": [...]
  },
  "additionalSlots": {
    "51": {  // teacherId
      "23": [  // subjectId
        { "availabilityId": 201, "dateTime": "2025-01-21T14:00:00", ... },
        { "availabilityId": 202, "dateTime": "2025-01-28T14:00:00", ... }
      ]
    }
  }
}
```

---

## Why This is Needed

| Use Case | Current State | Expected |
|----------|---------------|----------|
| User wants different time | ❌ No alternatives shown | ✅ Show other available times |
| User has conflict | ❌ Must reload entire schedule | ✅ Quick swap to different slot |
| User prefers afternoon | ❌ Stuck with morning slot | ✅ See PM alternatives |

---

## Frontend Ready

The frontend is already prepared to handle this:

```typescript
// Currently fetches from existing slots (same data)
this.availableAlternativeSlots = currentSchedule.slots
  .filter(s => s.dateTime !== currentDateTime);

// When API is ready, will fetch:
this.tutoringService.getAlternativeSlots(request).subscribe({
  next: (response) => {
    this.availableAlternativeSlots = response.alternativeSlots;
  }
});
```

---

## Implementation Suggestion

```csharp
// In SmartSchedulingService.cs

public async Task<List<ScheduledSlotDto>> GetAlternativeSlotsAsync(
    int teacherId, 
    int subjectId, 
    DateOnly startDate, 
    DateOnly endDate,
    List<int> excludeSlotIds)
{
    // Get all availability for this teacher/subject
    var allSlots = await _context.TeacherAvailabilities
        .Where(a => a.TeacherId == teacherId)
        .Where(a => a.SubjectId == null || a.SubjectId == subjectId)
        .Where(a => a.IsActive)
        .ToListAsync();
    
    // Expand to date range
    var expandedSlots = ExpandToDateRange(allSlots, startDate, endDate);
    
    // Exclude already assigned slots
    var alternatives = expandedSlots
        .Where(s => !excludeSlotIds.Contains(s.AvailabilityId))
        .OrderBy(s => s.DateTime)
        .Take(30)
        .ToList();
    
    return alternatives;
}
```

---

## Request

Please create an API endpoint that returns **additional available slots** for a teacher/subject that are NOT already assigned in the schedule.

**Confirm when ready:**
```
✔ BACKEND FIX CONFIRMED - Alternative Slots API
```
