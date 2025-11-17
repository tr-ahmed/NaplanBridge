# 📋 Session Booking System - Complete Endpoints Reference

**Date:** 2025-11-15  
**System:** Private Sessions Booking System  
**Purpose:** Complete reference for all API endpoints used in booking sessions

---

## 📌 Table of Contents

1. [Teacher Endpoints](#teacher-endpoints)
2. [Parent Endpoints](#parent-endpoints)
3. [Student Endpoints](#student-endpoints)
4. [Payment Endpoints](#payment-endpoints)
5. [Data Models](#data-models)
6. [Google Meet Integration Issue](#google-meet-integration-issue)

---

## 🧑‍🏫 Teacher Endpoints

### 1. Get Teacher Session Settings
```
GET /api/Sessions/teacher/settings
Authorization: Bearer Token (Teacher)
```

**Response:**
```json
{
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    "id": 1,
    "sessionDurationMinutes": 60,
    "bufferTimeMinutes": 15,
    "pricePerSession": 50.00,
    "isAcceptingBookings": true,
    "maxSessionsPerDay": 5,
    "description": "Experienced math teacher"
  }
}
```

---

### 2. Update Teacher Session Settings
```
PUT /api/Sessions/teacher/settings
Authorization: Bearer Token (Teacher)
Content-Type: application/json
```

**Request Body:**
```json
{
  "sessionDurationMinutes": 60,
  "bufferTimeMinutes": 15,
  "pricePerSession": 50.00,
  "isAcceptingBookings": true,
  "maxSessionsPerDay": 5,
  "description": "Experienced math teacher"
}
```

---

### 3. Get Teacher Availability Slots
```
GET /api/Sessions/teacher/availability
Authorization: Bearer Token (Teacher)
```

**Response:**
```json
{
  "success": true,
  "message": "Availability retrieved successfully",
  "data": [
    {
      "id": 1,
      "dayOfWeek": "Monday",
      "startTime": "09:00:00",
      "endTime": "12:00:00",
      "isActive": true
    },
    {
      "id": 2,
      "dayOfWeek": "Wednesday",
      "startTime": "14:00:00",
      "endTime": "17:00:00",
      "isActive": true
    }
  ]
}
```

---

### 4. Add Teacher Availability Slot
```
POST /api/Sessions/teacher/availability
Authorization: Bearer Token (Teacher)
Content-Type: application/json
```

**Request Body:**
```json
{
  "dayOfWeek": 1,  // 0=Sunday, 1=Monday, ..., 6=Saturday
  "startTime": "09:00:00",
  "endTime": "12:00:00"
}
```

---

### 5. Delete Teacher Availability Slot
```
DELETE /api/Sessions/teacher/availability/{availabilityId}
Authorization: Bearer Token (Teacher)
```

**Response:**
```json
{
  "success": true,
  "message": "Availability deleted successfully",
  "data": true
}
```

---

### 6. Get Teacher Upcoming Sessions
```
GET /api/Sessions/teacher/upcoming
Authorization: Bearer Token (Teacher)
```

**Response:**
```json
{
  "success": true,
  "message": "Upcoming sessions retrieved successfully",
  "data": [
    {
      "id": 456,
      "teacherId": 5,
      "teacherName": "john_smith",
      "studentId": 10,
      "studentName": "ali_ahmed",
      "parentId": 8,
      "parentName": "john_doe",
      "scheduledDateTime": "2024-01-22T14:00:00",
      "durationMinutes": 60,
      "price": 50.00,
      "status": "Confirmed",
      "googleMeetLink": "https://meet.google.com/abc-defg-hij",  // ❌ Currently null
      "createdAt": "2024-01-15T10:30:00",
      "notes": "Need help with algebra",
      "rating": null,
      "feedback": null
    }
  ]
}
```

---

### 7. Get Teacher Session History
```
GET /api/Sessions/teacher/history
Authorization: Bearer Token (Teacher)
```

**Response:** Same structure as upcoming sessions, but for past sessions.

---

### 8. Update Session Meeting Link (Google Meet)
```
PUT /api/Sessions/{sessionId}/meeting-link
Authorization: Bearer Token (Teacher)
Content-Type: application/json
```

**Request Body:**
```json
{
  "meetingLink": "https://meet.google.com/abc-defg-hij"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Meeting link updated successfully",
  "data": true
}
```

**⚠️ Question:** Is this endpoint currently implemented and working?

---

### 9. Mark Session as Completed
```
PUT /api/Sessions/{sessionId}/complete
Authorization: Bearer Token (Teacher)
```

**Response:**
```json
{
  "success": true,
  "message": "Session marked as completed",
  "data": true
}
```

---

## 👨‍👩‍👧 Parent Endpoints

### 1. Get Available Teachers
```
GET /api/Sessions/teachers/available
Authorization: Bearer Token (Parent)
```

**Response:**
```json
{
  "success": true,
  "message": "Available teachers retrieved successfully",
  "data": [
    {
      "teacherId": 5,
      "teacherName": "john_smith",
      "email": "john@example.com",
      "subjects": ["Math", "Science"],
      "pricePerSession": 50.00,
      "sessionDurationMinutes": 60,
      "isAcceptingBookings": true,
      "description": "Experienced teacher with 10 years of experience"
    }
  ]
}
```

---

### 2. Get Teacher Available Slots
```
GET /api/Sessions/teachers/{teacherId}/slots?fromDate={ISO_DATE}&toDate={ISO_DATE}
Authorization: Bearer Token (Parent)
```

**Example:**
```
GET /api/Sessions/teachers/5/slots?fromDate=2024-01-20T00:00:00Z&toDate=2024-01-27T00:00:00Z
```

**Response:**
```json
{
  "success": true,
  "message": "Available slots retrieved successfully",
  "data": [
    {
      "dateTime": "2024-01-22T09:00:00",
      "isAvailable": true,
      "reason": null
    },
    {
      "dateTime": "2024-01-22T10:00:00",
      "isAvailable": true,
      "reason": null
    },
    {
      "dateTime": "2024-01-22T14:00:00",
      "isAvailable": false,
      "reason": "Already booked"
    }
  ]
}
```

---

### 3. Book a Session ⭐ MAIN ENDPOINT
```
POST /api/Sessions/book
Authorization: Bearer Token (Parent)
Content-Type: application/json
```

**Request Body:**
```json
{
  "teacherId": 5,
  "studentId": 10,
  "scheduledDateTime": "2024-01-22T14:00:00",
  "notes": "Need help with algebra homework"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session booked successfully",
  "data": {
    "sessionId": 456,
    "stripeCheckoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
    "stripeSessionId": "cs_test_a1b2c3d4e5f6"
  }
}
```

**Flow:**
1. Frontend calls this endpoint
2. Backend creates session with status "Pending"
3. Backend creates Stripe checkout session
4. Frontend redirects user to Stripe checkout
5. User completes payment
6. Stripe redirects back to frontend
7. Frontend calls payment confirmation endpoint

---

### 4. Get Parent Bookings
```
GET /api/Sessions/parent/bookings
Authorization: Bearer Token (Parent)
```

**Response:**
```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": [
    {
      "id": 456,
      "teacherId": 5,
      "teacherName": "john_smith",
      "studentId": 10,
      "studentName": "ali_ahmed",
      "parentId": 8,
      "parentName": "john_doe",
      "scheduledDateTime": "2024-01-22T14:00:00",
      "durationMinutes": 60,
      "price": 50.00,
      "status": "Confirmed",
      "googleMeetLink": null,  // ❌ PROBLEM: Should have Google Meet link
      "createdAt": "2024-01-15T10:30:00",
      "notes": "Need help with algebra",
      "rating": null,
      "feedback": null
    }
  ]
}
```

---

### 5. Cancel a Session
```
PUT /api/Sessions/{sessionId}/cancel
Authorization: Bearer Token (Parent)
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Student is sick"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session cancelled successfully",
  "data": true
}
```

---

## 🎓 Student Endpoints

### 1. Get Student Upcoming Sessions
```
GET /api/Sessions/student/upcoming
Authorization: Bearer Token (Student)
```

**Response:**
```json
{
  "success": true,
  "message": "Upcoming sessions retrieved successfully",
  "data": [
    {
      "id": 456,
      "teacherId": 5,
      "teacherName": "john_smith",
      "studentId": 10,
      "studentName": "ali_ahmed",
      "parentId": 8,
      "parentName": "john_doe",
      "scheduledDateTime": "2024-01-22T14:00:00",
      "durationMinutes": 60,
      "price": 50.00,
      "status": "Confirmed",
      "googleMeetLink": null,  // ❌ PROBLEM: Should have Google Meet link
      "createdAt": "2024-01-15T10:30:00",
      "notes": "Need help with algebra"
    }
  ]
}
```

---

### 2. Join a Session (Get Session with Google Meet Link)
```
GET /api/Sessions/{sessionId}/join
Authorization: Bearer Token (Student or Teacher)
```

**Response:**
```json
{
  "success": true,
  "message": "Session details retrieved successfully",
  "data": {
    "id": 456,
    "teacherId": 5,
    "teacherName": "john_smith",
    "studentId": 10,
    "studentName": "ali_ahmed",
    "parentId": 8,
    "parentName": "john_doe",
    "scheduledDateTime": "2024-01-22T14:00:00",
    "durationMinutes": 60,
    "price": 50.00,
    "status": "Confirmed",
    "googleMeetLink": null,  // ❌ PROBLEM: Should have Google Meet link
    "createdAt": "2024-01-15T10:30:00",
    "notes": "Need help with algebra"
  }
}
```

**Purpose:** This endpoint is called when a student clicks "Join Session" button. It should return the Google Meet link.

---

## 💳 Payment Endpoints

### 1. Confirm Payment
```
POST /api/Sessions/confirm-payment/{stripeSessionId}
Authorization: Bearer Token (Parent)
```

**Example:**
```
POST /api/Sessions/confirm-payment/cs_test_a1b2c3d4e5f6
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": true
}
```

**Expected Backend Actions:**
1. ✅ Verify payment with Stripe
2. ✅ Update session status from "Pending" to "Confirmed"
3. ❌ **Generate Google Meet link** ← Currently NOT happening
4. ❌ **Store Google Meet link in database** ← Currently NOT happening
5. ✅ Send confirmation email
6. ✅ Return success

---

## 📊 Data Models

### PrivateSessionDto (Used in all responses)
```typescript
{
  id: number;
  teacherId: number;
  teacherName: string;
  studentId: number;
  studentName: string;
  parentId: number;
  parentName: string;
  scheduledDateTime: string;  // ISO 8601 format
  durationMinutes: number;
  price: number;
  status: string;  // "Pending", "Confirmed", "Completed", "Cancelled"
  googleMeetLink?: string;  // ❌ Currently always null
  createdAt: string;  // ISO 8601 format
  notes?: string;
  rating?: number;
  feedback?: string;
}
```

### BookSessionDto (Request body for booking)
```typescript
{
  teacherId: number;
  studentId: number;
  scheduledDateTime: string;  // ISO 8601 format
  notes?: string;
}
```

### BookingResponseDto (Response from booking)
```typescript
{
  sessionId: number;
  stripeCheckoutUrl: string;
  stripeSessionId: string;
}
```

---

## 🔴 Google Meet Integration Issue

### Problem Summary
All session endpoints return `googleMeetLink: null` even for confirmed, paid sessions.

### Affected Endpoints:
1. ❌ `GET /api/Sessions/teacher/upcoming`
2. ❌ `GET /api/Sessions/teacher/history`
3. ❌ `GET /api/Sessions/parent/bookings`
4. ❌ `GET /api/Sessions/student/upcoming`
5. ❌ `GET /api/Sessions/{sessionId}/join`

### Expected Behavior:
After payment confirmation, `googleMeetLink` should contain a valid Google Meet URL:
```
"googleMeetLink": "https://meet.google.com/abc-defg-hij"
```

### Questions for Backend Team:

1. **Is Google Meet link generation implemented?**
   - Using Google Calendar API?
   - Using Google Meet API?
   - Manual entry by teacher only?

2. **When should the link be generated?**
   - Immediately when booked?
   - After payment confirmation?
   - Manually by teacher?

3. **Is the database field present?**
   - Does `PrivateSessions` table have `GoogleMeetLink` column?
   - Is it being populated?
   - Is it being mapped to DTO?

4. **Is the update endpoint working?**
   - `PUT /api/Sessions/{sessionId}/meeting-link`
   - Can teachers manually add links?

### Frontend Status:
✅ Frontend is **fully ready** to handle Google Meet links  
✅ All UI components display "Join Session" buttons when `googleMeetLink` is available  
✅ No frontend changes needed once backend is fixed  

---

## 📝 Complete Endpoint Summary

| # | Method | Endpoint | Authorization | Purpose | Google Meet? |
|---|--------|----------|---------------|---------|--------------|
| 1 | GET | `/api/Sessions/teacher/settings` | Teacher | Get teacher settings | - |
| 2 | PUT | `/api/Sessions/teacher/settings` | Teacher | Update teacher settings | - |
| 3 | GET | `/api/Sessions/teacher/availability` | Teacher | Get availability slots | - |
| 4 | POST | `/api/Sessions/teacher/availability` | Teacher | Add availability slot | - |
| 5 | DELETE | `/api/Sessions/teacher/availability/{id}` | Teacher | Delete availability slot | - |
| 6 | GET | `/api/Sessions/teacher/upcoming` | Teacher | Get upcoming sessions | ❌ Missing |
| 7 | GET | `/api/Sessions/teacher/history` | Teacher | Get past sessions | ❌ Missing |
| 8 | PUT | `/api/Sessions/{sessionId}/meeting-link` | Teacher | Update Google Meet link | ❓ Unknown |
| 9 | PUT | `/api/Sessions/{sessionId}/complete` | Teacher | Mark session complete | - |
| 10 | GET | `/api/Sessions/teachers/available` | Parent | Get available teachers | - |
| 11 | GET | `/api/Sessions/teachers/{id}/slots` | Parent | Get teacher slots | - |
| 12 | POST | `/api/Sessions/book` | Parent | **Book a session** | ❌ Missing |
| 13 | GET | `/api/Sessions/parent/bookings` | Parent | Get parent bookings | ❌ Missing |
| 14 | PUT | `/api/Sessions/{sessionId}/cancel` | Parent | Cancel session | - |
| 15 | GET | `/api/Sessions/student/upcoming` | Student | Get student sessions | ❌ Missing |
| 16 | GET | `/api/Sessions/{sessionId}/join` | Student/Teacher | **Join session** | ❌ Missing |
| 17 | POST | `/api/Sessions/confirm-payment/{stripeSessionId}` | Parent | **Confirm payment** | ❌ Should generate |

---

## ⚠️ Critical Issue

**Google Meet links are missing in all session responses.**

**Impact:**
- 🔴 Students cannot join their paid sessions
- 🔴 Teachers cannot join their scheduled sessions
- 🔴 Parents see bookings but no way to access the meeting
- 🔴 System is non-functional for its core purpose

**Required Action:**
Backend team must implement Google Meet link generation, either:
1. Automatically via Google Calendar/Meet API after payment confirmation
2. Via manual entry by teacher using update endpoint

**See detailed report:**
`/reports/backend_inquiries/backend_inquiry_google_meet_link_missing_2025-11-15.md`

---

**Report Generated:** November 15, 2025  
**Frontend Developer:** FrontEnd Team  
**Status:** ⏳ Awaiting backend implementation/clarification
