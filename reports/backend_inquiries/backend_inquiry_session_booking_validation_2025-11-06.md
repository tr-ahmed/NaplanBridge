# 🔧 Backend Inquiry Report

## 📅 Date: November 6, 2025

## 1. Inquiry Topic

**Session Booking API Validation Issue** - `/api/Sessions/book` endpoint returning 400 Bad Request

---

## 2. Problem Description

### Current Behavior:
When attempting to book a private session, the API returns:
```
POST https://naplan2.runasp.net/api/Sessions/book 400 (Bad Request)
Response: "Failed to book session. Slot may be unavailable."
```

### Request Payload:
```json
{
  "teacherId": 3,
  "studentId": 1,
  "scheduledDateTime": "2025-11-07T12:30:00Z",
  "notes": undefined
}
```

### Issues Identified:

1. **Student ID Validation**: The `studentId: 1` in the request might not belong to the currently logged-in parent, causing validation failure.

2. **Missing Parent-Student Relationship Check**: The backend should verify that the studentId belongs to the parent making the booking request.

3. **Generic Error Message**: "Failed to book session. Slot may be unavailable." is not specific enough. It doesn't tell us if:
   - The slot is actually unavailable
   - The student doesn't belong to the parent
   - The teacher is not accepting bookings
   - Some other validation failed

---

## 3. Reason for Inquiry

The frontend successfully:
- ✅ Loads available teachers
- ✅ Loads available time slots
- ✅ Displays booking form
- ✅ Sends properly formatted request

However, the booking fails with a 400 error even when:
- The slot appears available in the UI
- The teacher is marked as "Available for Booking"
- All required fields are provided

**Root Cause Suspicion**: The `studentId` in the request may not match any student belonging to the currently authenticated parent user.

---

## 4. Requested Details from Backend Team

### A. **Validation Logic**:
Please clarify the validation steps in `/api/Sessions/book`:
1. How do you verify that `studentId` belongs to the requesting parent?
2. Do you check `AspNetUsers.Id` or `Student.ParentId`?
3. What happens if the parent has no students?

### B. **Error Response Structure**:
Please provide more specific error messages for different scenarios:
- "Student does not belong to your account"
- "This time slot is already booked"
- "Teacher is not accepting bookings at this time"
- "Invalid student ID"

### C. **Student-Parent Relationship**:
- What is the correct way to associate a student with a parent?
- Should we use `/api/User/my-students` to get valid student IDs?
- Does the endpoint require the parent to be the creator of the student?

### D. **Booking Constraints**:
- Are there any restrictions on when a booking can be made (e.g., minimum hours in advance)?
- Is there a maximum bookings per student limit?
- Does the teacher's `maxSessionsPerDay` affect availability?

---

## 5. Test Scenarios Needed

Please test these scenarios and confirm expected behavior:

### ✅ **Scenario 1**: Valid Booking
```json
{
  "teacherId": 3,
  "studentId": 123,  // Valid student belonging to logged-in parent
  "scheduledDateTime": "2025-11-07T12:30:00Z"
}
```
**Expected**: 200 OK with `BookingResponseDto`

### ❌ **Scenario 2**: Student Doesn't Belong to Parent
```json
{
  "teacherId": 3,
  "studentId": 999,  // Student belonging to different parent
  "scheduledDateTime": "2025-11-07T12:30:00Z"
}
```
**Expected**: 400 Bad Request with message "Student does not belong to your account"

### ❌ **Scenario 3**: Slot Already Booked
```json
{
  "teacherId": 3,
  "studentId": 123,
  "scheduledDateTime": "2025-11-07T12:30:00Z"  // Already booked
}
```
**Expected**: 400 Bad Request with message "This time slot is already booked"

### ❌ **Scenario 4**: Teacher Not Available
```json
{
  "teacherId": 3,
  "studentId": 123,
  "scheduledDateTime": "2025-11-07T23:00:00Z"  // Outside teacher availability
}
```
**Expected**: 400 Bad Request with message "Teacher is not available at this time"

---

## 6. Proposed Backend Improvements

### **Improve BookSessionDto Validation**:
```csharp
public class BookSessionDto
{
    [Required]
    public int TeacherId { get; set; }
    
    [Required]
    public int StudentId { get; set; }
    
    [Required]
    public DateTime ScheduledDateTime { get; set; }
    
    public string? Notes { get; set; }
}
```

### **Add Detailed Error Responses**:
```csharp
public class BookingError
{
    public string Code { get; set; }  // "STUDENT_NOT_FOUND", "SLOT_UNAVAILABLE", etc.
    public string Message { get; set; }
    public Dictionary<string, string[]> ValidationErrors { get; set; }
}
```

### **Validation Order**:
1. Check if teacher exists and is accepting bookings
2. Check if student exists and belongs to requesting parent
3. Check if slot is within teacher availability
4. Check if slot is not already booked
5. Check if slot is not in the past
6. Create booking and Stripe session

---

## 7. Frontend Workaround (Temporary)

Until backend fixes are implemented, the frontend will:
1. ✅ Load students from `/api/User/my-students` to ensure valid student IDs
2. ✅ Display clear error messages to users
3. ✅ Show "No Students Found" if parent has no students
4. ✅ Prevent booking if no students are available

---

## 8. Related Endpoints

- `GET /api/User/my-students` - Returns list of students for logged-in parent
- `GET /api/Sessions/teachers/available` - Returns available teachers
- `GET /api/Sessions/teachers/{id}/slots` - Returns available time slots
- `POST /api/Sessions/book` - Creates booking (currently failing)

---

## 9. Priority

**🔴 HIGH PRIORITY** - This blocks the entire booking system functionality

---

## 10. Next Steps

1. Backend team to review validation logic in `/api/Sessions/book`
2. Provide detailed error messages for each failure scenario
3. Confirm that `/api/User/my-students` returns correct student IDs
4. Test all scenarios mentioned in section 5
5. Update API documentation with validation rules

---

## Contact

**Frontend Team**: Ready to provide more details or test scenarios as needed.

**Related Files**:
- Frontend: `book-session.component.ts`
- Backend: `SessionsController.cs` (assumed)
- Models: `BookSessionDto`, `BookingResponseDto`
