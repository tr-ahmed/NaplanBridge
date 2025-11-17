# ❓ Backend Inquiry Report - Google Meet Link Not Returning in Sessions

**Date:** 2025-11-15  
**Feature:** Private Sessions Booking System  
**Issue:** Google Meet links are not being returned in session responses  
**Priority:** 🔴 High (Critical for session functionality)

---

## 1. Issue Summary

The frontend booking system is successfully creating session bookings, but the `googleMeetLink` field is consistently returning `null` or empty in all session-related API responses. This prevents students and teachers from joining their booked sessions.

---

## 2. Affected Endpoints

### 📍 Endpoint 1: Book Session
**URL:** `POST /api/Sessions/book`

**Frontend Request:**
```json
{
  "teacherId": 5,
  "studentId": 10,
  "scheduledDateTime": "2024-01-22T14:00:00",
  "notes": "Need help with algebra"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Session booked successfully",
  "data": {
    "sessionId": 456,
    "stripeCheckoutUrl": "https://checkout.stripe.com/...",
    "stripeSessionId": "cs_test_..."
  }
}
```

**Issue:** After payment confirmation, when fetching the session details, `googleMeetLink` is `null`.

---

### 📍 Endpoint 2: Get Parent Bookings
**URL:** `GET /api/Sessions/parent/bookings`

**Current Response:**
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
      "googleMeetLink": null,  // ❌ PROBLEM: Always null
      "createdAt": "2024-01-15T10:30:00",
      "notes": "Need help with algebra"
    }
  ]
}
```

**Expected:** `googleMeetLink` should contain a valid Google Meet URL like:
```
"googleMeetLink": "https://meet.google.com/abc-defg-hij"
```

---

### 📍 Endpoint 3: Get Teacher Upcoming Sessions
**URL:** `GET /api/Sessions/teacher/upcoming`

**Issue:** Same as above - `googleMeetLink` returns `null` for confirmed sessions.

---

### 📍 Endpoint 4: Get Student Upcoming Sessions
**URL:** `GET /api/Sessions/student/upcoming`

**Issue:** Same as above - `googleMeetLink` returns `null` for confirmed sessions.

---

### 📍 Endpoint 5: Join Session
**URL:** `GET /api/Sessions/{sessionId}/join`

**Current Response:**
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
    "googleMeetLink": null,  // ❌ PROBLEM: Always null
    "createdAt": "2024-01-15T10:30:00",
    "notes": "Need help with algebra"
  }
}
```

---

### 📍 Endpoint 6: Update Meeting Link (Teacher Only)
**URL:** `PUT /api/Sessions/{sessionId}/meeting-link`

**Frontend Request:**
```json
{
  "meetingLink": "https://meet.google.com/abc-defg-hij"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Meeting link updated successfully",
  "data": true
}
```

**Question:** Does this endpoint exist and is it working correctly?

---

## 3. Questions for Backend Team

### 🔍 Question 1: Google Meet Link Generation
**Is the backend automatically generating Google Meet links when a session is created/confirmed?**

- ❓ Are you using Google Calendar API to create meetings?
- ❓ Are you using a third-party service to generate meeting links?
- ❓ Or should the **teacher manually add** the Google Meet link via the `PUT /api/Sessions/{sessionId}/meeting-link` endpoint?

---

### 🔍 Question 2: When Should Links Be Created?
**At what point in the session lifecycle should the Google Meet link be generated?**

Options:
1. ✅ Immediately when session is booked (`POST /api/Sessions/book`)
2. ✅ After payment is confirmed (`POST /api/Sessions/confirm-payment/{stripeSessionId}`)
3. ✅ Manually by teacher via update endpoint
4. ❌ Something else (please specify)

---

### 🔍 Question 3: Database Field Check
**Is the `GoogleMeetLink` field properly stored in the database?**

Please verify:
- ✅ The `PrivateSessions` table has a `GoogleMeetLink` column (type: `nvarchar(500)`)
- ✅ The field is being populated when sessions are created/updated
- ✅ The field is being mapped correctly in the DTO response

---

### 🔍 Question 4: Payment Confirmation Flow
**Is the Google Meet link being generated during payment confirmation?**

Current flow as understood by frontend:
1. Parent books session → receives `stripeCheckoutUrl`
2. Parent completes payment on Stripe
3. Stripe redirects back to frontend with `stripeSessionId`
4. Frontend calls `POST /api/Sessions/confirm-payment/{stripeSessionId}`
5. **Backend should update session status to "Confirmed" AND generate Google Meet link**

Is this the correct flow? If not, please clarify.

---

### 🔍 Question 5: Update Meeting Link Endpoint
**Is the `PUT /api/Sessions/{sessionId}/meeting-link` endpoint implemented?**

- ✅ Does it accept a JSON body: `{ "meetingLink": "..." }`?
- ✅ Does it validate that only the **teacher** of that session can update the link?
- ✅ Does it return success/failure correctly?
- ✅ Is there any logging/error handling if the update fails?

---

## 4. Expected Backend Behavior

### Scenario A: Automatic Generation (Recommended)
1. When payment is confirmed, backend should:
   - Update session status to `Confirmed`
   - Generate a Google Meet link using Google Calendar API
   - Store the link in the `GoogleMeetLink` field
   - Return the updated session with the link

### Scenario B: Manual Entry by Teacher
1. Teacher receives notification of new confirmed session
2. Teacher manually creates a Google Meet link
3. Teacher uses the frontend UI to add the link
4. Frontend calls `PUT /api/Sessions/{sessionId}/meeting-link`
5. Backend stores the link and returns success

**Which scenario is currently implemented?**

---

## 5. Suggested Backend Implementation (If Missing)

### Option 1: Using Google Calendar API (Recommended)

```csharp
// In SessionsController.cs or SessionService.cs

public async Task<string> GenerateGoogleMeetLink(PrivateSession session)
{
    try
    {
        // Initialize Google Calendar API client
        var service = new CalendarService(new BaseClientService.Initializer()
        {
            HttpClientInitializer = _googleCredential,
            ApplicationName = "NaplanBridge"
        });

        // Create event with Google Meet
        var newEvent = new Event()
        {
            Summary = $"Private Session: {session.TeacherName} & {session.StudentName}",
            Description = session.Notes ?? "Private tutoring session",
            Start = new EventDateTime()
            {
                DateTime = session.ScheduledDateTime,
                TimeZone = "Australia/Sydney"
            },
            End = new EventDateTime()
            {
                DateTime = session.ScheduledDateTime.AddMinutes(session.DurationMinutes),
                TimeZone = "Australia/Sydney"
            },
            ConferenceData = new ConferenceData()
            {
                CreateRequest = new CreateConferenceRequest()
                {
                    RequestId = Guid.NewGuid().ToString(),
                    ConferenceSolutionKey = new ConferenceSolutionKey()
                    {
                        Type = "hangoutsMeet"
                    }
                }
            },
            Attendees = new List<EventAttendee>()
            {
                new EventAttendee() { Email = session.Teacher.Email },
                new EventAttendee() { Email = session.Student.Email }
            }
        };

        // Insert event with conference data
        var request = service.Events.Insert(newEvent, "primary");
        request.ConferenceDataVersion = 1;
        var createdEvent = await request.ExecuteAsync();

        // Extract Google Meet link
        return createdEvent.ConferenceData?.EntryPoints
            ?.FirstOrDefault(e => e.EntryPointType == "video")?.Uri;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to generate Google Meet link for session {SessionId}", session.Id);
        return null;
    }
}
```

### Option 2: Using Google Meet REST API Directly

```csharp
public async Task<string> CreateGoogleMeetAsync(PrivateSession session)
{
    var httpClient = new HttpClient();
    httpClient.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", _accessToken);

    var response = await httpClient.PostAsync(
        "https://meet.googleapis.com/v2/spaces",
        new StringContent(JsonSerializer.Serialize(new { }), Encoding.UTF8, "application/json")
    );

    if (response.IsSuccessStatusCode)
    {
        var result = await response.Content.ReadAsStringAsync();
        var meetData = JsonSerializer.Deserialize<GoogleMeetResponse>(result);
        return meetData?.MeetingUri;
    }

    return null;
}
```

---

## 6. Database Schema Verification

Please confirm the `PrivateSessions` table has:

```sql
CREATE TABLE PrivateSessions (
    Id INT PRIMARY KEY IDENTITY(1,1),
    TeacherId INT NOT NULL,
    StudentId INT NOT NULL,
    ParentId INT NOT NULL,
    ScheduledDateTime DATETIME2 NOT NULL,
    DurationMinutes INT NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    GoogleMeetLink NVARCHAR(500) NULL,  -- ⚠️ This field must exist
    CreatedAt DATETIME2 NOT NULL,
    Notes NVARCHAR(1000) NULL,
    Rating INT NULL,
    Feedback NVARCHAR(2000) NULL,
    -- Foreign keys and indexes...
);
```

---

## 7. Required Backend Actions

Please confirm or implement the following:

### ✅ Action 1: Verify Database Field
- [ ] Confirm `GoogleMeetLink` column exists in `PrivateSessions` table
- [ ] Confirm it's being mapped in `PrivateSessionDto`

### ✅ Action 2: Implement Google Meet Generation
- [ ] Add Google Calendar API integration
- [ ] Generate Meet link when payment is confirmed
- [ ] Store link in database

### ✅ Action 3: Update Payment Confirmation Endpoint
```csharp
// POST /api/Sessions/confirm-payment/{stripeSessionId}
public async Task<IActionResult> ConfirmPayment(string stripeSessionId)
{
    // 1. Verify payment with Stripe
    // 2. Update session status to "Confirmed"
    // 3. Generate Google Meet link ← ADD THIS
    // 4. Store Google Meet link in database
    // 5. Send confirmation email with link
    // 6. Return success
}
```

### ✅ Action 4: Ensure All DTOs Include GoogleMeetLink
```csharp
public class PrivateSessionDto
{
    public int Id { get; set; }
    public int TeacherId { get; set; }
    public string TeacherName { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; }
    public int ParentId { get; set; }
    public string ParentName { get; set; }
    public DateTime ScheduledDateTime { get; set; }
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public string Status { get; set; }
    public string GoogleMeetLink { get; set; }  // ⚠️ Must be included
    public DateTime CreatedAt { get; set; }
    public string Notes { get; set; }
    public int? Rating { get; set; }
    public string Feedback { get; set; }
}
```

---

## 8. Testing Checklist

Once implemented, please test:

- [ ] Create a new session booking
- [ ] Complete payment via Stripe
- [ ] Verify session status updates to "Confirmed"
- [ ] Verify `googleMeetLink` is populated in database
- [ ] Call `GET /api/Sessions/parent/bookings` and verify link is returned
- [ ] Call `GET /api/Sessions/teacher/upcoming` and verify link is returned
- [ ] Call `GET /api/Sessions/student/upcoming` and verify link is returned
- [ ] Call `GET /api/Sessions/{sessionId}/join` and verify link is returned
- [ ] Test manual update via `PUT /api/Sessions/{sessionId}/meeting-link`

---

## 9. Frontend Impact

Once the backend is fixed, the frontend will automatically:
- ✅ Display "Join Session" buttons for confirmed sessions
- ✅ Allow students to click and join Google Meet
- ✅ Allow teachers to manually add/update meeting links if needed
- ✅ Show meeting links in booking lists

**No frontend code changes are required** - the UI already handles the `googleMeetLink` field correctly.

---

## 10. Additional Notes

### Current Frontend Implementation:
The frontend is **fully prepared** to handle Google Meet links:

```typescript
// From session.service.ts
export interface PrivateSessionDto {
  id: number;
  teacherId: number;
  teacherName: string;
  studentId: number;
  studentName: string;
  parentId: number;
  parentName: string;
  scheduledDateTime: string;
  durationMinutes: number;
  price: number;
  status: string;
  googleMeetLink?: string;  // ✅ Frontend expects this
  createdAt: string;
  notes?: string;
  rating?: number;
  feedback?: string;
}
```

### UI Components Ready:
- **Student Sessions Component:** Displays "Join Session" button when `googleMeetLink` is available
- **Teacher Sessions Component:** Displays "Join Session" button and allows manual link updates
- **My Bookings Component:** Shows meeting links for confirmed bookings
- **Book Session Component:** Handles the booking flow and expects link after payment

---

## 11. Recommended Timeline

- **Day 1-2:** Backend team investigates current implementation
- **Day 3-4:** Implement Google Meet link generation
- **Day 5:** Testing and verification
- **Day 6:** Deploy to production

---

## 12. Contact Information

**Frontend Developer:** FrontEnd Team  
**Report Date:** November 15, 2025  
**Priority:** 🔴 Critical  
**Blocking:** Yes - Users cannot join their paid sessions

---

**Please respond with:**
1. Current status of Google Meet link implementation
2. Confirmation of database schema
3. Planned approach (automatic generation vs. manual entry)
4. Estimated timeline for fix
5. Any additional questions or clarifications needed
