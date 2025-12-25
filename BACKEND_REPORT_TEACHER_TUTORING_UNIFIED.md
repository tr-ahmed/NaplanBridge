# 📌 BACKEND REPORT: Teacher Tutoring Unified System

**Date:** December 25, 2025  
**Component:** Teacher Tutoring Management (Unified)  
**Priority:** HIGH  
**Status:** Missing Endpoints & Integration Requirements

---

## 🎯 Overview

The frontend has implemented a unified Teacher Tutoring Management system that combines:
- `/teacher/availability` → redirects to `/teacher/tutoring-sessions?tab=availability`
- `/teacher/tutoring-sessions` → unified page with tabs (Sessions & Availability)

All UI features are ready, but we need to verify backend endpoints for complete integration.

---

## ✅ What Frontend Has Implemented

### 1. **Unified Tutoring Management Page**
   - **Path:** `/teacher/tutoring-sessions`
   - **Tabs:**
     - Sessions (Calendar View with today/day/week modes)
     - Availability (Settings, Time Slots, Exceptions)

### 2. **Advanced Slot Generator**
   - Generate multiple time slots automatically
   - Configurable:
     - Day of week
     - Start/End time
     - Session duration (minutes)
     - Break between sessions (minutes)
     - Default session type (OneToOne/Group)
     - Subject (optional)

### 3. **Exception Days Management**
   - Add holidays/time off
   - Date range support (single day or multiple days)
   - Optional reason field

### 4. **Calendar View Enhancements**
   - Three view modes: Today, Day, Week
   - Date navigation (previous/next)
   - Direct date picker
   - "Go to Today" quick action
   - Meeting link icons (🎥) for sessions with video links

### 5. **Meeting Integration**
   - Each session card shows meeting link icon if available
   - One-click to open Google Meet/Zoom/etc in new tab

---

## 📝 Backend Endpoints - Status Check

### ✅ **Already Working (Based on Implementation)**

#### Session Management:
```
GET  /api/Sessions/teacher/settings
PUT  /api/Sessions/teacher/settings
GET  /api/Sessions/teacher/availability
POST /api/Sessions/teacher/availability
DELETE /api/Sessions/teacher/availability/{id}
GET  /api/Sessions/teacher/upcoming
GET  /api/Sessions/teacher/history
PUT  /api/Sessions/{sessionId}/meeting-link
PUT  /api/Sessions/{sessionId}/complete
```

#### Exceptions:
```
GET    /api/Sessions/teacher/exceptions
POST   /api/Sessions/teacher/exceptions
DELETE /api/Sessions/teacher/exceptions/{id}
```

#### Tutoring Sessions:
```
GET /api/tutoring/teacher/sessions?status={status}&startDate={date}&endDate={date}
PUT /api/tutoring/teacher/session/{sessionId}/start
PUT /api/tutoring/teacher/session/{sessionId}/complete
PUT /api/tutoring/teacher/session/{sessionId}/cancel
```

---

## ⚠️ Backend Requirements & Clarifications

### 1. **Slot Generator - Backend Processing**

**Current Frontend Implementation:**
- Frontend generates multiple slots based on time range
- Makes multiple POST requests to `/api/Sessions/teacher/availability`

**⚠️ ISSUE:**
This approach is inefficient for large slot counts.

**💡 BACKEND REQUEST:**
Create a dedicated endpoint for bulk slot generation:

```
POST /api/Sessions/teacher/availability/generate
```

**Request Body:**
```json
{
  "dayOfWeek": "Monday",
  "startTime": "09:00:00",
  "endTime": "17:00:00",
  "sessionDurationMinutes": 60,
  "breakBetweenMinutes": 15,
  "defaultSessionType": "OneToOne",
  "subjectId": null  // optional
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Generated 7 time slots successfully",
  "data": [
    {
      "id": 1,
      "dayOfWeek": "Monday",
      "startTime": "09:00:00",
      "endTime": "10:00:00",
      "isActive": true
    },
    {
      "id": 2,
      "dayOfWeek": "Monday",
      "startTime": "10:15:00",
      "endTime": "11:15:00",
      "isActive": true
    }
    // ... more slots
  ]
}
```

**Benefits:**
- Single database transaction
- Better performance
- Atomic operation (all or nothing)
- Easier error handling

---

### 2. **Tutoring Sessions - Filtering by Date Range**

**Current Endpoint:**
```
GET /api/tutoring/teacher/sessions?status={status}&startDate={date}&endDate={date}
```

**⚠️ CONFIRMATION NEEDED:**
Does this endpoint:
1. Return sessions within the date range? ✅
2. Exclude dates marked as exceptions? ⚠️
3. Include `meetingLink` field in response? ⚠️
4. Include `startTime` (HH:mm) separate from `dateTime`? ⚠️

**Expected Response Structure:**
```json
[
  {
    "id": 123,
    "studentName": "Ahmad Ali",
    "studentId": 45,
    "subjectName": "Mathematics",
    "subjectId": 12,
    "dateTime": "2025-12-26T10:00:00Z",
    "startTime": "10:00",      // ⚠️ Is this included?
    "duration": 60,
    "status": "Scheduled",
    "meetingLink": "https://meet.google.com/xyz",  // ⚠️ Is this included?
    "notes": null,
    "createdAt": "2025-12-20T08:30:00Z"
  }
]
```

**If missing fields:**
- Please add `startTime` (HH:mm format) for easier display
- Please add `meetingLink` if session has video link

---

### 3. **Exception Days - Impact on Available Slots**

**Frontend Expectation:**
When parents view available slots for booking (`GET /api/Sessions/teachers/{teacherId}/slots`), the backend should:

✅ **Exclude slots on exception days**
✅ **Exclude slots already booked**
✅ **Respect buffer times between sessions**

**⚠️ CONFIRMATION NEEDED:**
Does the backend currently:
1. Check teacher's exception days when generating available slots? ⚠️
2. Hide slots that fall on holidays? ⚠️
3. Return proper reason when slot unavailable due to exception? ⚠️

**Example Request:**
```
GET /api/Sessions/teachers/15/slots?fromDate=2025-12-26&toDate=2025-12-30
```

**Expected Response (with exceptions):**
```json
{
  "success": true,
  "data": [
    {
      "dateTime": "2025-12-26T10:00:00Z",
      "isAvailable": true,
      "reason": null
    },
    {
      "dateTime": "2025-12-27T10:00:00Z",
      "isAvailable": false,
      "reason": "Teacher is on holiday"  // ⚠️ Is this working?
    },
    {
      "dateTime": "2025-12-28T10:00:00Z",
      "isAvailable": true,
      "reason": null
    }
  ]
}
```

**💡 BACKEND ACTION REQUIRED:**
If exceptions are not currently factored into slot availability, please:
1. Check teacher's exceptions table when generating slots
2. Mark slots as unavailable if they fall within exception date range
3. Return appropriate reason message

---

### 4. **Session Actions - Meeting Link Updates**

**Current Endpoint:**
```
PUT /api/Sessions/{sessionId}/meeting-link
```

**Request Body:**
```json
{
  "meetingLink": "https://meet.google.com/abc-defg-hij"
}
```

**⚠️ CONFIRMATION NEEDED:**
- Is this endpoint working? ⚠️
- Does it validate URL format? ⚠️
- Does it update immediately? ⚠️
- Can teacher update meeting link after session is created? ⚠️

---

### 5. **Calendar View - Sessions by Date**

**Frontend Implementation:**
The calendar filters sessions locally based on:
- Selected date
- View mode (today/day/week)

**Backend Optimization Opportunity:**
Consider adding date-specific endpoints:

```
GET /api/tutoring/teacher/sessions/today
GET /api/tutoring/teacher/sessions/week?startDate={date}
GET /api/tutoring/teacher/sessions/date/{YYYY-MM-DD}
```

**Benefits:**
- Reduced payload size
- Better performance
- Server-side filtering

**Current Workaround:**
Frontend fetches all sessions and filters locally - this works but is less efficient.

---

## 🔄 Session Status Workflow

**Frontend Implemented Actions:**

1. **Scheduled → InProgress:**
   ```
   PUT /api/tutoring/teacher/session/{id}/start
   ```

2. **InProgress → Completed:**
   ```
   PUT /api/tutoring/teacher/session/{id}/complete
   ```

3. **Scheduled → Cancelled:**
   ```
   PUT /api/tutoring/teacher/session/{id}/cancel
   ```

**⚠️ CONFIRMATION NEEDED:**
- Do these endpoints exist and work correctly? ⚠️
- Are they different from the Private Sessions endpoints? ⚠️
- Should we use `/api/Sessions/...` or `/api/tutoring/...`? ⚠️

**Clarification:**
There seems to be two different APIs:
- `/api/Sessions/*` (Private Sessions/Booking)
- `/api/tutoring/*` (Tutoring System)

Are these separate systems or the same? Please clarify the correct endpoints to use.

---

## 📊 Data Consistency Requirements

### Meeting Links
- Must be included in session response
- Must support update after creation
- Must open in new tab (frontend handles this)

### Session Times
- Backend returns `dateTime` (ISO 8601)
- Frontend prefers separate `startTime` (HH:mm) field
- If not available, frontend extracts from dateTime

### Exception Days
- Must affect slot availability calculations
- Must support date ranges (multi-day holidays)
- Must have proper cascade on teacher deletion

---

## ✅ Definition of "DONE"

This feature is complete when:

| Condition | Status |
|-----------|--------|
| ✅ Unified page loads without errors | ✅ DONE |
| ✅ Tabs switch correctly | ✅ DONE |
| ⚠️ Slot generator creates multiple slots | ⚠️ NEEDS BACKEND |
| ⚠️ Exceptions exclude slots from availability | ⚠️ NEEDS CONFIRMATION |
| ⚠️ Calendar shows sessions with meeting links | ⚠️ NEEDS meetingLink field |
| ⚠️ Session status changes work | ⚠️ NEEDS CONFIRMATION |
| ⚠️ No console errors | ⚠️ NEEDS API TESTING |

---

## 🧪 Testing Checklist

### Backend Team Should Test:

1. **Slot Generation:**
   ```bash
   POST /api/Sessions/teacher/availability/generate
   # Should create multiple slots atomically
   ```

2. **Exception Impact:**
   ```bash
   # Add exception for 2025-12-27
   POST /api/Sessions/teacher/exceptions
   
   # Then check slots
   GET /api/Sessions/teachers/{teacherId}/slots?fromDate=2025-12-26&toDate=2025-12-28
   # Dec 27 should be unavailable
   ```

3. **Meeting Link:**
   ```bash
   PUT /api/Sessions/{sessionId}/meeting-link
   # Then verify in GET response
   ```

4. **Session Status:**
   ```bash
   GET /api/tutoring/teacher/sessions
   # Verify meetingLink, startTime fields exist
   ```

---

## 📤 Next Steps

### Backend Team Actions:
1. ✅ Confirm all listed endpoints exist and return correct structure
2. ⚠️ Implement bulk slot generation endpoint (if not exists)
3. ⚠️ Ensure exceptions affect slot availability
4. ⚠️ Add `meetingLink` and `startTime` to session responses (if missing)
5. ⚠️ Clarify difference between `/api/Sessions` and `/api/tutoring` APIs
6. ✅ Test exception days filtering in slot availability
7. ✅ Provide sample responses for all endpoints

### Frontend Team Actions:
1. ✅ Wait for backend confirmation
2. ⚠️ Test all endpoints with real API
3. ⚠️ Update service calls if endpoint structure changes
4. ⚠️ Handle edge cases (no data, errors, etc.)

---

## 💬 Communication Required

Please respond with:

```
✔ BACKEND CONFIRMATION

1. Slot Generation Endpoint: [EXISTS / WILL CREATE / NOT NEEDED]
2. Exceptions Affect Slots: [YES / NO / NEEDS FIXING]
3. Meeting Link in Response: [YES / MISSING - WILL ADD]
4. Session Status Endpoints: [WORKING / ISSUE: ...]
5. Recommended API Path: [/api/Sessions / /api/tutoring / BOTH]

Estimated completion time: [DATE]
Any blockers: [YES/NO - details if yes]
```

---

## 📌 Summary

**Frontend Status:** ✅ COMPLETE (UI + Logic)  
**Backend Status:** ⚠️ NEEDS CONFIRMATION & POSSIBLE UPDATES  
**Blocker:** Cannot test with real API until backend confirms endpoint availability  

**Impact:** High - Teachers cannot manage tutoring availability effectively until this is resolved.

---

**Contact:** Frontend Team  
**Last Updated:** December 25, 2025
