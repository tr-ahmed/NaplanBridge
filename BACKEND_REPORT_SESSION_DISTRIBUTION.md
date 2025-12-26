# 📌 BACKEND REPORT: Session Distribution Logic

**Date:** 2025-12-26  
**Feature:** Smart Scheduling - `/api/Tutoring/AvailableSlots`  
**Priority:** 🟡 Medium

---

## Problem Description

When assigning sessions to teachers, the backend is selecting **multiple sessions on the same day** instead of distributing them evenly across the requested date range.

### Example

**Request:**
- Student wants 10 sessions of Math
- Date range: January 15 - April 15 (3 months / ~13 weeks)
- Teacher available: Sunday 09:00, Monday 10:00, Wednesday 14:00

**Current (Wrong) Behavior:**
```json
{
  "slots": [
    { "dateTime": "2025-01-19T09:00:00", "dayOfWeek": 0 },  // Sunday Week 1
    { "dateTime": "2025-01-19T10:00:00", "dayOfWeek": 0 },  // Sunday Week 1 ❌ SAME DAY
    { "dateTime": "2025-01-19T14:00:00", "dayOfWeek": 0 },  // Sunday Week 1 ❌ SAME DAY
    { "dateTime": "2025-01-20T09:00:00", "dayOfWeek": 1 },  // Monday Week 1
    { "dateTime": "2025-01-20T10:00:00", "dayOfWeek": 1 },  // Monday Week 1 ❌ SAME DAY
    // ... more slots crammed into first weeks
  ]
}
```

**Expected (Correct) Behavior:**
```json
{
  "slots": [
    { "dateTime": "2025-01-19T09:00:00", "dayOfWeek": 0 },  // Sunday Week 1
    { "dateTime": "2025-01-26T09:00:00", "dayOfWeek": 0 },  // Sunday Week 2
    { "dateTime": "2025-02-02T09:00:00", "dayOfWeek": 0 },  // Sunday Week 3
    { "dateTime": "2025-02-09T09:00:00", "dayOfWeek": 0 },  // Sunday Week 4
    { "dateTime": "2025-02-16T09:00:00", "dayOfWeek": 0 },  // Sunday Week 5
    // ... distributed weekly across the date range
  ]
}
```

---

## Root Cause

The current algorithm in `SmartSchedulingService.cs` likely:

1. Generates ALL possible slots within the date range
2. Takes the first N slots without checking if they're on different dates
3. Doesn't enforce a "one session per day" or "weekly distribution" rule

---

## Proposed Solution

### Option 1: Weekly Distribution (Recommended)

For each subject, distribute sessions evenly across the weeks:

```csharp
// Pseudo-code
int sessionsNeeded = 10;
int weeksInRange = (endDate - startDate).Days / 7;
int sessionsPerWeek = Math.Max(1, sessionsNeeded / weeksInRange);

var assignedSlots = new List<ScheduledSlotDto>();
var currentWeek = 0;
var slotsThisWeek = 0;

foreach (var slot in availableSlots.OrderBy(s => s.DateTime))
{
    int slotWeek = (slot.DateTime - startDate).Days / 7;
    
    // Move to next week if we've assigned enough for this week
    if (slotWeek > currentWeek)
    {
        currentWeek = slotWeek;
        slotsThisWeek = 0;
    }
    
    // Only assign if we haven't reached the limit for this week
    if (slotsThisWeek < sessionsPerWeek)
    {
        assignedSlots.Add(slot);
        slotsThisWeek++;
        
        if (assignedSlots.Count >= sessionsNeeded)
            break;
    }
}
```

### Option 2: One Session Per Day Per Subject

Simpler rule - never assign more than one session of the same subject on the same day:

```csharp
var assignedSlots = new List<ScheduledSlotDto>();
var usedDates = new HashSet<DateTime>();

foreach (var slot in availableSlots.OrderBy(s => s.DateTime))
{
    var slotDate = slot.DateTime.Date;
    
    // Skip if we already have a session on this date
    if (usedDates.Contains(slotDate))
        continue;
    
    assignedSlots.Add(slot);
    usedDates.Add(slotDate);
    
    if (assignedSlots.Count >= sessionsNeeded)
        break;
}
```

### Option 3: Configurable Distribution

Add a parameter to control distribution:

```csharp
public enum DistributionStrategy
{
    Weekly,           // One session per week
    BiWeekly,         // One session every 2 weeks  
    TwiceWeekly,      // Two sessions per week
    DailyMax1,        // Max 1 session per day
    NoLimit           // Current behavior - first available
}
```

---

## Implementation Location

**File:** `API\Services\Implementations\SmartSchedulingService.cs`

**Method to modify:** The slot assignment logic (likely in `AssignSlotsToTeacher` or similar)

---

## Validation Rules

After implementing, the backend should ensure:

1. ✅ No two sessions of the same subject on the same day
2. ✅ Sessions distributed across the date range (not front-loaded)
3. ✅ Respect user's preferred days if specified
4. ✅ Fill gaps by using alternative days if primary days are exhausted

---

## Test Cases

### Test 1: Basic Weekly Distribution
```
Input: 10 sessions, 3-month range
Expected: ~1 session per week, spread across 10 different weeks
```

### Test 2: High Session Count
```
Input: 30 sessions, 3-month range (13 weeks)
Expected: ~2-3 sessions per week, never more than 1 per day
```

### Test 3: Limited Teacher Availability
```
Input: 10 sessions, teacher only available Sundays
Expected: 10 sessions on 10 different Sundays
```

### Test 4: Short Date Range
```
Input: 10 sessions, 2-week range
Expected: 5 sessions per week, spread across available days
```

---

## Frontend Impact

No frontend changes needed. The frontend displays whatever the backend returns.

Current frontend shows each slot with:
- Session number (1, 2, 3...)
- Day name (Sunday, Monday...)
- Date (Jan 15, Jan 22...)
- Time (09:00 AM, 02:30 PM...)

---

## Request

Please update the session distribution logic to spread sessions across the date range instead of grouping them in the first available dates.

**Confirm when fixed with:**
```
✔ BACKEND FIX CONFIRMED
```
