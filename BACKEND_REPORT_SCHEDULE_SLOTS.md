# 📌 BACKEND REPORT: Schedule Slots Not Showing

**Date:** 2025-12-26  
**Page:** `/parent/tutoring/select` → Step 5 (Schedule)  
**Priority:** 🔴 High

---

## Problem Description

In the parent tutoring selection workflow, **Step 5 (Schedule)** is not displaying any available time slots from the database, even though:

1. ✅ **Teacher 10 has availability slots** registered in the database
2. ✅ **Teacher 10 has subject permissions** registered in the database

### Evidence

#### Teacher Availability Data Exists
**Endpoint:** `GET /api/Sessions/teacher/availability`

![Teacher 10 has availability slots configured](C:/Users/trwa2/.gemini/antigravity/brain/1d17cd03-f170-4518-b69f-eb653b3ae1a5/uploaded_image_1766752254788.png)

As shown in the screenshot, Teacher 10 has the following availability slots:
- **Sunday:** 09:00, 10:05, 11:10, 12:15, 13:20, 14:25, 15:30 (7 slots)
- **Monday:** 09:00, 10:15, 11:30, 12:45, 14:00, 15:15 (6 slots)
- **Tuesday:** 09:00, 10:15, 11:30, 12:45, 14:00, 15:15 (6 slots)

Session types include: 1:1, Group, and Flex.

#### Teacher Permission Data Exists
**Endpoint:** `GET /api/TeacherPermissions/all`

Teacher 10 has subject permissions configured in the system.

---

## Technical Analysis

### Frontend Implementation (Working Correctly ✅)

The frontend is correctly calling the Smart Scheduling API:

```typescript
// File: src/app/core/services/tutoring.service.ts (Line 166-171)
getAvailableSlotsSmart(request: GetAvailableSlotsRequest): Observable<SmartSchedulingResponse> {
  return this.http.post<SmartSchedulingResponse>(`${this.apiUrl}/AvailableSlots`, request);
}
```

**Request Format:**
```typescript
interface GetAvailableSlotsRequest {
  studentSelections: SmartSchedulingStudentSelection[];
  startDate: string;      // ISO date
  endDate: string;        // ISO date
  preferredDays?: number[];           // 0-6 (Sunday-Saturday)
  preferredTimeRange?: { start: string; end: string };  // HH:mm:ss format
}

interface SmartSchedulingStudentSelection {
  studentId: number;
  subjects: {
    subjectId: number;
    teachingType: 'OneToOne' | 'Group';
    hours: 10 | 20 | 30;
  }[];
}
```

**Expected Response Format:**
```typescript
interface SmartSchedulingResponse {
  recommendedSchedule: {
    teachers: ScheduledTeacherDto[];  // ← This is empty!
  };
  alternativeTeachers: AlternativeTeacherDto[];
  summary: SchedulingSummaryDto;
}
```

### Backend Endpoint (Issue Location ❌)

**Endpoint:** `POST /api/Tutoring/AvailableSlots`

The backend should:

1. **Parse the request** with student selections (subjects, teaching types, hours)
2. **Query TeacherPermissions** to find teachers authorized for the requested subjects
3. **Query TeacherAvailability** to get available time slots for those teachers
4. **Filter slots** based on:
   - Date range (startDate to endDate)
   - Session type compatibility (OneToOne/Group/BookingFirst)
   - Subject permissions
   - Preferred days (if specified)
   - Preferred time range (if specified)
5. **Build recommended schedule** matching teachers to subjects
6. **Return SmartSchedulingResponse** with populated `recommendedSchedule.teachers`

---

## Expected Backend Behavior

### Query Flow

```
1. Request comes in with:
   - studentSelections: [{ studentId: X, subjects: [{ subjectId: Y, teachingType: 'OneToOne', hours: 10 }] }]
   - startDate: '2025-01-01'
   - endDate: '2025-03-31'

2. Backend should:
   a. SELECT teachers FROM TeacherPermissions WHERE subjectId = Y AND isActive = true
   b. For each eligible teacher:
      - SELECT availability FROM TeacherAvailability WHERE teacherId = ? AND isActive = true
      - Filter by sessionType compatibility
      - Generate concrete slot dates within startDate-endDate range
   c. Sort teachers by priority (from TeacherPermissions or separate priority table)
   d. Build SmartSchedulingResponse with slots assigned to teachers
```

### Expected SQL Queries (Pseudo)

```sql
-- Step 1: Find eligible teachers for subject
SELECT DISTINCT tp.TeacherId, tp.Priority 
FROM TeacherPermissions tp
WHERE tp.SubjectId IN (?) 
  AND tp.IsActive = true;

-- Step 2: Get availability for eligible teachers
SELECT ta.* 
FROM TeacherAvailability ta
WHERE ta.TeacherId IN (?)
  AND ta.IsActive = true
  AND ta.SessionType IN ('OneToOne', 'BookingFirst')  -- Or 'Group' if group session requested
  AND (ta.SubjectId = ? OR ta.SubjectId IS NULL);     -- Subject-specific or general availability
```

---

## Potential Issues to Check

### 1. TeacherPermissions Filtering
- Is the backend correctly joining `TeacherPermissions` with the requested `subjectId`?
- Is `TeacherPermissions.IsActive` being checked?

### 2. TeacherAvailability Filtering
- Is `TeacherAvailability.IsActive` set to `true` for Teacher 10's slots?
- Is the `SessionType` filter correct for the requested teaching type?
- Is the `SubjectId` in availability being matched correctly?

### 3. Date Range Generation
- Weekly availability slots need to be "expanded" into concrete dates within the requested range
- Example: If DayOfWeek = 0 (Sunday) at 09:00, generate slots for all Sundays between startDate and endDate

### 4. Priority/Ranking
- Teachers should be ranked by priority when building the recommended schedule
- Check if `priority` field is being used correctly

### 5. Subject-Session Type Mismatch
- Availability slots may have a specific `SubjectId` attached
- If parent requests Subject A but teacher only has availability for Subject B, no slots match

---

## Required Fix

The backend `POST /api/Tutoring/AvailableSlots` endpoint needs to:

1. ✅ Query `TeacherPermissions` to find teachers with permission on requested subjects
2. ✅ Query `TeacherAvailability` for those teachers
3. ✅ Expand weekly availability patterns into concrete date slots
4. ✅ Match session types (OneToOne/Group) correctly
5. ✅ Build and return the `SmartSchedulingResponse` with populated teachers

---

## Test Data

**Teacher ID:** 10  
**Test Endpoint for Availability:** `GET /api/Sessions/teacher/availability`  
**Test Endpoint for Permissions:** `GET /api/TeacherPermissions/all`

---

## Impact

**Frontend Status:** ⏸️ Blocked  
The parent tutoring workflow cannot proceed past Step 5 (Schedule) because no slots are returned.

---

## Request

Please investigate and fix the `POST /api/Tutoring/AvailableSlots` endpoint to correctly:
1. Join TeacherPermissions with TeacherAvailability
2. Return eligible teachers and their available slots in the `SmartSchedulingResponse`

**Confirm when fixed with:**
```
✔ BACKEND FIX CONFIRMED
```
