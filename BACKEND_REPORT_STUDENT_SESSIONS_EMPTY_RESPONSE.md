# Backend Report: Student Sessions Empty Response

**Date:** December 2, 2025  
**Priority:** HIGH  
**Component:** Private Sessions - Student Endpoint  
**Technology:** .NET 8 / ASP.NET Core / Entity Framework Core

---

## Problem Description

The student sessions endpoint is returning an **empty array** despite having confirmed sessions in the database.

### Current Behavior:

**Endpoint:** `GET /api/Sessions/student/upcoming`  
**Authorization:** Bearer Token (Student role)  
**Response:**
```json
{
  "data": [],
  "success": true,
  "message": "Sessions retrieved successfully",
  "errors": []
}
```

### Expected Behavior:

Should return all upcoming sessions for the logged-in student where:
- `Status = 1` (Confirmed) - Paid sessions
- `Status = 4` (Pending Payment) - Awaiting payment
- `ScheduledDateTime > Now` - Future sessions only

---

## Student Information (from JWT Token)

```javascript
{
  userId: '34',
  userName: 'mtarek9814',
  studentId: '17',      // ⚠️ This is the Student.Id we need to query
  yearId: '6',
  roles: ['Student', ...]
}
```

**Important:** The `studentId` in the token is **17** - this should be used to filter sessions.

---

## Root Cause Analysis

The issue is likely one of the following:

### 1. **Wrong Student ID Lookup**

The endpoint might be using `User.Id` instead of `Student.Id`:

```csharp
// ❌ WRONG - Using User.Id
var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
var sessions = await _context.PrivateSessions
    .Where(s => s.StudentId == userId)  // ❌ Wrong ID
    .ToListAsync();

// ✅ CORRECT - Using Student.Id from token claim
var studentIdStr = User.FindFirst("studentId")?.Value;
var studentId = int.Parse(studentIdStr);
var sessions = await _context.PrivateSessions
    .Where(s => s.StudentId == studentId)  // ✅ Correct
    .ToListAsync();
```

### 2. **Missing Status Filter**

The endpoint might be filtering only `Status = 1` (Confirmed) and excluding `Status = 4` (Pending Payment):

```csharp
// ❌ WRONG - Only confirmed sessions
var sessions = await _context.PrivateSessions
    .Where(s => s.StudentId == studentId && s.Status == SessionStatus.Confirmed)
    .ToListAsync();

// ✅ CORRECT - Include both Confirmed and Pending Payment
var sessions = await _context.PrivateSessions
    .Where(s => s.StudentId == studentId && 
                (s.Status == SessionStatus.Confirmed || 
                 s.Status == SessionStatus.Pending))
    .Where(s => s.ScheduledDateTime > DateTime.UtcNow)
    .OrderBy(s => s.ScheduledDateTime)
    .ToListAsync();
```

### 3. **Authorization Issue**

The endpoint might require `Parent` role instead of `Student` role:

```csharp
// ❌ WRONG
[Authorize(Roles = "Parent")]  // Student can't access

// ✅ CORRECT
[Authorize(Roles = "Student")]
```

---

## Required Backend Fix

**File:** `Controllers/SessionsController.cs`

### Current Problematic Code (likely):

```csharp
[HttpGet("student/upcoming")]
[Authorize(Roles = "Student")]
public async Task<IActionResult> GetStudentUpcomingSessions()
{
    try
    {
        // ❌ Problem: Using User.Id instead of Student.Id
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        
        var sessions = await _context.PrivateSessions
            .Where(s => s.StudentId == userId)  // ❌ Wrong ID
            .Where(s => s.Status == SessionStatus.Confirmed)  // ❌ Missing Pending
            .ToListAsync();

        return Ok(new ApiResponse<List<PrivateSessionDto>>
        {
            Success = true,
            Data = sessions.Select(MapToDto).ToList(),
            Message = "Sessions retrieved successfully"
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrieving student sessions");
        return StatusCode(500, new ApiResponse<List<PrivateSessionDto>>
        {
            Success = false,
            Message = "Error retrieving sessions"
        });
    }
}
```

### Corrected Code:

```csharp
/// <summary>
/// Get upcoming sessions for the logged-in student
/// Endpoint: GET /api/Sessions/student/upcoming
/// Authorization: Student role
/// </summary>
[HttpGet("student/upcoming")]
[Authorize(Roles = "Student")]
public async Task<IActionResult> GetStudentUpcomingSessions()
{
    try
    {
        // ✅ Get Student.Id from JWT token claim
        var studentIdClaim = User.FindFirst("studentId")?.Value;
        
        if (string.IsNullOrEmpty(studentIdClaim))
        {
            _logger.LogWarning("Student ID not found in token claims");
            return BadRequest(new ApiResponse<List<PrivateSessionDto>>
            {
                Success = false,
                Message = "Student ID not found in authentication token"
            });
        }

        var studentId = int.Parse(studentIdClaim);
        _logger.LogInformation($"Fetching upcoming sessions for Student ID: {studentId}");

        // ✅ Query using Student.Id and include both Confirmed and Pending Payment
        var sessions = await _context.PrivateSessions
            .Include(s => s.Teacher)
            .Include(s => s.Teacher.User)
            .Include(s => s.Parent)
            .Include(s => s.Parent.User)
            .Where(s => s.StudentId == studentId)  // ✅ Correct Student.Id
            .Where(s => s.ScheduledDateTime > DateTime.UtcNow)  // Future sessions only
            .Where(s => s.Status == SessionStatus.Confirmed ||   // Paid sessions
                       s.Status == SessionStatus.Pending)        // Awaiting payment
            .OrderBy(s => s.ScheduledDateTime)
            .ToListAsync();

        _logger.LogInformation($"Found {sessions.Count} upcoming sessions for Student ID: {studentId}");

        var sessionsDto = sessions.Select(s => new PrivateSessionDto
        {
            Id = s.Id,
            TeacherId = s.TeacherId,
            TeacherName = s.Teacher?.User?.UserName ?? "Unknown",
            StudentId = s.StudentId,
            StudentName = s.Student?.User?.UserName ?? "Unknown",
            ParentId = s.ParentId,
            ParentName = s.Parent?.User?.UserName ?? "Unknown",
            ScheduledDateTime = s.ScheduledDateTime,
            DurationMinutes = s.DurationMinutes,
            Price = s.Price,
            Status = s.Status,
            GoogleMeetLink = s.GoogleMeetLink,
            CreatedAt = s.CreatedAt,
            Notes = s.Notes,
            Rating = s.Rating,
            Feedback = s.Feedback
        }).ToList();

        return Ok(new ApiResponse<List<PrivateSessionDto>>
        {
            Success = true,
            Data = sessionsDto,
            Message = "Sessions retrieved successfully"
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrieving student sessions");
        return StatusCode(500, new ApiResponse<List<PrivateSessionDto>>
        {
            Success = false,
            Message = "An error occurred while retrieving sessions"
        });
    }
}
```

---

## Key Changes Required:

1. ✅ **Use `studentId` claim from JWT token** instead of `User.Id`
2. ✅ **Include both Confirmed (1) and Pending (0) status** sessions
3. ✅ **Filter future sessions only** (`ScheduledDateTime > DateTime.UtcNow`)
4. ✅ **Add logging** to track query results
5. ✅ **Include navigation properties** (Teacher, Parent) for complete data
6. ✅ **Order by scheduled date** (earliest first)

---

## Testing Checklist

### Database Verification:

```sql
-- Check if sessions exist for Student ID 17
SELECT 
    Id,
    StudentId,
    TeacherId,
    ScheduledDateTime,
    Status,
    CreatedAt
FROM PrivateSessions
WHERE StudentId = 17
ORDER BY ScheduledDateTime;

-- Check student record
SELECT * FROM Students WHERE Id = 17;

-- Check user record
SELECT * FROM Users WHERE Id = 34;
```

### API Testing:

1. **Get JWT Token for Student:**
   - Login as student: `mtarek9814`
   - Extract token from response

2. **Call Endpoint with Token:**
   ```
   GET https://naplan2.runasp.net/api/Sessions/student/upcoming
   Authorization: Bearer {student_token}
   ```

3. **Verify Response:**
   - Should return array with sessions
   - Each session should have:
     - `studentId: 17`
     - `status: 1` (Confirmed) or `status: 0` (Pending)
     - `scheduledDateTime` in the future

4. **Check Logs:**
   - Verify `studentId` being used in query
   - Verify number of sessions found
   - Check for any SQL errors

---

## Related Endpoints to Verify

Similar issue might exist in:

| Endpoint | Fix Required |
|----------|--------------|
| `GET /api/Sessions/student/upcoming` | ✅ **This one** |
| `GET /api/Sessions/{sessionId}/join` | Verify Student.Id check |
| `GET /api/Sessions/parent/bookings` | Working (uses Parent.Id) |
| `GET /api/Sessions/teacher/sessions` | Verify Teacher.Id check |

---

## JWT Token Claims Structure

Ensure the JWT token includes:

```csharp
var claims = new List<Claim>
{
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),  // User.Id = 34
    new Claim(ClaimTypes.Name, user.UserName),                 // mtarek9814
    new Claim("studentId", student.Id.ToString()),              // Student.Id = 17 ✅
    new Claim("yearId", student.YearId.ToString()),            // 6
    new Claim(ClaimTypes.Role, "Student")
};
```

---

## Priority: HIGH

**Impact:**
- Students cannot view their booked sessions
- Parents book sessions but students can't see them
- Core functionality is broken

**Urgency:**
- Critical user experience issue
- Affects all student users
- Needs immediate fix

---

## Additional Recommendations

1. **Add Unit Tests:**
   ```csharp
   [Fact]
   public async Task GetStudentUpcomingSessions_ReturnsCorrectSessions()
   {
       // Test with Student ID from token claim
   }
   ```

2. **Add Integration Tests:**
   - Test with real student JWT token
   - Verify correct sessions returned

3. **Monitor Logs:**
   - Add logging for all Student.Id queries
   - Track which ID is being used (User.Id vs Student.Id)

---

**END OF REPORT**
