# 📌 BACKEND REPORT: Duplicate IDs in Bulk-Generated Availability Slots

**Date:** 2025-12-26  
**Priority:** 🔴 **HIGH - Critical Data Integrity Issue**  
**Status:** ⏳ **PENDING FIX**  
**Reporter:** Frontend Team  

---

## 📋 Summary

When using the bulk slot generation endpoint, all generated availability slots receive the **same ID** instead of unique IDs. This causes editing one slot to update ALL slots simultaneously.

---

## 🔍 Affected Endpoints

| Endpoint | Issue |
|----------|-------|
| `POST /api/Sessions/teacher/availability/generate` | Returns slots with duplicate IDs |
| `PUT /api/Sessions/teacher/availability/{id}` | Updates ALL slots with same ID |
| `DELETE /api/Sessions/teacher/availability/{id}` | May delete wrong slot |

---

## 🐛 Bug Details

### Evidence from Frontend Console:

```
NG0955: The provided track expression resulted in duplicated keys for a given collection. 
Duplicated keys were: 
- key "18" at index "0" and "1", 
- key "18" at index "1" and "2", 
- key "18" at index "2" and "3", 
- key "18" at index "3" and "4", 
- key "18" at index "4" and "5".
```

This shows that **6 different time slots** all share `id = 18`.

---

## 🔄 Reproduction Steps

1. Login as Teacher
2. Go to Tutoring Management → Availability tab
3. Click "Add Time Slot" → "Advanced: Slot Generator"
4. Configure:
   - Day: Monday
   - Start Time: 09:00
   - End Time: 17:00
   - Session Duration: 60 min
   - Break Between: 15 min
5. Click "Generate Slots"
6. Observe: All generated slots have the same ID
7. Try to edit ONE slot's session type
8. **Bug:** ALL slots change their session type

---

## ❌ Current (Broken) Behavior

### API Response from Generate Slots:

```json
{
  "success": true,
  "data": {
    "slotsGenerated": 6,
    "slots": [
      { "id": 18, "dayOfWeek": 1, "startTime": "09:00:00", "endTime": "10:00:00", "sessionType": "OneToOne" },
      { "id": 18, "dayOfWeek": 1, "startTime": "10:15:00", "endTime": "11:15:00", "sessionType": "OneToOne" },
      { "id": 18, "dayOfWeek": 1, "startTime": "11:30:00", "endTime": "12:30:00", "sessionType": "OneToOne" },
      { "id": 18, "dayOfWeek": 1, "startTime": "13:00:00", "endTime": "14:00:00", "sessionType": "OneToOne" },
      { "id": 18, "dayOfWeek": 1, "startTime": "14:15:00", "endTime": "15:15:00", "sessionType": "OneToOne" },
      { "id": 18, "dayOfWeek": 1, "startTime": "15:30:00", "endTime": "16:30:00", "sessionType": "OneToOne" }
    ]
  }
}
```

**Problem:** All slots have `id: 18`

---

## ✅ Expected Behavior

### API Response Should Be:

```json
{
  "success": true,
  "data": {
    "slotsGenerated": 6,
    "slots": [
      { "id": 18, "dayOfWeek": 1, "startTime": "09:00:00", "endTime": "10:00:00", "sessionType": "OneToOne" },
      { "id": 19, "dayOfWeek": 1, "startTime": "10:15:00", "endTime": "11:15:00", "sessionType": "OneToOne" },
      { "id": 20, "dayOfWeek": 1, "startTime": "11:30:00", "endTime": "12:30:00", "sessionType": "OneToOne" },
      { "id": 21, "dayOfWeek": 1, "startTime": "13:00:00", "endTime": "14:00:00", "sessionType": "OneToOne" },
      { "id": 22, "dayOfWeek": 1, "startTime": "14:15:00", "endTime": "15:15:00", "sessionType": "OneToOne" },
      { "id": 23, "dayOfWeek": 1, "startTime": "15:30:00", "endTime": "16:30:00", "sessionType": "OneToOne" }
    ]
  }
}
```

**Each slot has a UNIQUE ID**

---

## 🔧 Root Cause Analysis

The issue is likely in `SessionBookingService.cs` → `GenerateAvailabilitySlotsAsync`:

### Possible Causes:

1. **Slots not saved to DB before returning** - IDs are assigned by database on save
2. **Using same object reference** - All slots point to same memory location
3. **Returning DTO before SaveChanges** - IDs are 0 or default before save
4. **Mapping issue** - DTO mapper returning same ID for all

---

## 🛠️ Suggested Fix

### In `SessionBookingService.cs`:

```csharp
public async Task<GenerateAvailabilitySlotsResponse> GenerateAvailabilitySlotsAsync(
    int teacherId, 
    GenerateAvailabilitySlotsDto dto)
{
    var slots = new List<TeacherAvailability>();
    var currentTime = dto.StartTime;
    var sessionDuration = TimeSpan.FromMinutes(dto.SessionDurationMinutes);
    var bufferTime = TimeSpan.FromMinutes(dto.BreakBetweenMinutes);
    var endTime = dto.EndTime;
    
    // Generate slot entities
    while (currentTime + sessionDuration <= endTime) 
    {
        // ⚠️ IMPORTANT: Create NEW object each iteration
        var slot = new TeacherAvailability 
        {
            TeacherId = teacherId,
            DayOfWeek = dto.DayOfWeek,
            StartTime = currentTime,
            EndTime = currentTime + sessionDuration,
            SessionType = Enum.Parse<SessionType>(dto.DefaultSessionType),
            MaxStudents = dto.MaxStudents,
            SubjectId = dto.SubjectId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        
        slots.Add(slot);
        currentTime += sessionDuration + bufferTime;
    }
    
    // ✅ FIX: Add all slots to context
    context.TeacherAvailabilities.AddRange(slots);
    
    // ✅ FIX: Save to database - THIS assigns unique IDs
    await context.SaveChangesAsync();
    
    // ✅ FIX: Map AFTER save so IDs are populated
    var slotDtos = slots.Select(s => new TeacherAvailabilityDto 
    {
        Id = s.Id,  // Now has unique ID from database
        DayOfWeek = (int)s.DayOfWeek,
        DayName = s.DayOfWeek.ToString(),
        StartTime = s.StartTime.ToString(@"hh\:mm\:ss"),
        EndTime = s.EndTime.ToString(@"hh\:mm\:ss"),
        SessionType = s.SessionType.ToString(),
        MaxStudents = s.MaxStudents,
        SubjectId = s.SubjectId,
        IsActive = s.IsActive
    }).ToList();
    
    return new GenerateAvailabilitySlotsResponse 
    {
        SlotsGenerated = slots.Count,
        Slots = slotDtos,
        Warnings = new List<string>()
    };
}
```

### Key Points:
1. Create **new object** for each slot (not reusing same reference)
2. Call `SaveChangesAsync()` **before** mapping to DTO
3. Map to DTO **after** save so `Id` property is populated

---

## 📊 Impact Assessment

| Feature | Current Status | After Fix |
|---------|---------------|-----------|
| Generate bulk slots | ⚠️ Works but broken IDs | ✅ Unique IDs |
| Edit single slot | ❌ Edits ALL slots | ✅ Edits one slot |
| Delete single slot | ❌ Unpredictable | ✅ Deletes one slot |
| Session type per slot | ❌ Cannot customize | ✅ Individual control |
| Booking specific slots | ❌ Ambiguous | ✅ Clear slot selection |

---

## 🧪 Verification Steps After Fix

1. **Generate Slots:**
   ```bash
   POST /api/Sessions/teacher/availability/generate
   # Verify each slot has unique ID in response
   ```

2. **Get Availability:**
   ```bash
   GET /api/Sessions/teacher/availability
   # Verify unique IDs persist
   ```

3. **Update Single Slot:**
   ```bash
   PUT /api/Sessions/teacher/availability/19
   {
     "sessionType": "Group",
     "maxStudents": 5
   }
   # Verify ONLY slot 19 is updated
   ```

4. **Verify Other Slots Unchanged:**
   ```bash
   GET /api/Sessions/teacher/availability
   # Verify slots 18, 20, 21, etc. still have original sessionType
   ```

---

## 📝 Frontend Workaround (Temporary)

Until backend is fixed, frontend uses composite key for tracking:

```typescript
// Instead of: track availability.id
// Using: track (availability.id + '-' + availability.dayOfWeek + '-' + availability.startTime)
```

This prevents Angular rendering errors but does NOT fix the update issue.

---

## ✅ Confirmation Required

Please confirm when the fix is deployed:

```
✔ BACKEND FIX CONFIRMED
- Endpoint: POST /api/Sessions/teacher/availability/generate
- Fix: Each slot now has unique ID
- Verified: PUT updates only targeted slot
```

---

## 📞 Contact

For questions about this report, contact the Frontend Team.

---

**Last Updated:** 2025-12-26 01:37 UTC+2
