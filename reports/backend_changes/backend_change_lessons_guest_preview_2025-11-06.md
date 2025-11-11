# 🔧 Backend Change Report

**Date:** November 6, 2025  
**Feature:** Guest/Preview Mode for Lessons  
**Reporter:** AI Frontend Assistant  

---

## 1. Reason for Change

The frontend now allows **guest users (non-authenticated)** to browse and preview lessons without logging in. This enables potential students and parents to explore course content before enrolling.

**Current Issue:**
- Lessons endpoints currently require `studentId` parameter (mandatory)
- Guests cannot view lessons because they don't have a `studentId`
- This blocks the preview/demo functionality

**Requested Change:**
- Make `studentId` parameter **optional**
- When `studentId` is not provided or is `null`:
  - Return all lessons for the requested subject/term
  - Set `isEnrolled: false` for all lessons
  - Set `hasAccess: false` 
  - Set `progress: 0`
  - Return lesson metadata (title, description, duration, etc.)

---

## 2. Required or Modified Endpoints

### Endpoint 1: Get Lessons by Subject with Progress
- **URL:** `/api/Lessons/subject/{subjectId}/with-progress/{studentId}`
- **Method:** `GET`
- **Current Implementation:** Requires `studentId` in URL path (mandatory)
- **Requested Change:** Make `studentId` **optional**

**Suggested New Endpoint Structure:**
```
/api/Lessons/subject/{subjectId}/with-progress/{studentId?}
```

### Endpoint 2: Get Lessons by Term with Progress
- **URL:** `/api/Lessons/term/{termId}/with-progress/{studentId}`
- **Method:** `GET`
- **Current Implementation:** Requires `studentId` in URL path (mandatory)
- **Requested Change:** Make `studentId` **optional**

**Suggested New Endpoint Structure:**
```
/api/Lessons/term/{termId}/with-progress/{studentId?}
```

### Endpoint 3: Get Lessons by Subject, Term Number with Progress
- **URL:** `/api/Lessons/subject/{subjectId}/term-number/{termNumber}/with-progress/{studentId}`
- **Method:** `GET`
- **Current Implementation:** Requires `studentId` in URL path (mandatory)
- **Requested Change:** Make `studentId` **optional**

**Suggested New Endpoint Structure:**
```
/api/Lessons/subject/{subjectId}/term-number/{termNumber}/with-progress/{studentId?}
```

---

## 3. Suggested Backend Implementation

### Controller Changes

**File:** `Controllers/LessonsController.cs`

#### Before (Current):
```csharp
[HttpGet("subject/{subjectId}/with-progress/{studentId}")]
public async Task<IActionResult> GetLessonsBySubjectWithProgress(int subjectId, int studentId)
{
    // Requires studentId - fails if not provided
    var lessons = await _lessonsService.GetLessonsBySubjectWithProgress(subjectId, studentId);
    return Ok(lessons);
}
```

#### After (Requested):
```csharp
[HttpGet("subject/{subjectId}/with-progress/{studentId?}")]
public async Task<IActionResult> GetLessonsBySubjectWithProgress(int subjectId, int? studentId = null)
{
    // ✅ studentId is now optional (nullable int)
    var lessons = await _lessonsService.GetLessonsBySubjectWithProgress(subjectId, studentId);
    return Ok(lessons);
}
```

### Service Layer Changes

**File:** `Services/LessonsService.cs`

```csharp
public async Task<List<LessonWithProgressDto>> GetLessonsBySubjectWithProgress(int subjectId, int? studentId)
{
    // Get all lessons for the subject
    var lessons = await _context.Lessons
        .Where(l => l.SubjectId == subjectId)
        .ToListAsync();

    // ✅ If no studentId provided (guest user):
    if (studentId == null)
    {
        // Return lessons with default "not enrolled" values
        return lessons.Select(lesson => new LessonWithProgressDto
        {
            // Lesson data
            Id = lesson.Id,
            Title = lesson.Title,
            Description = lesson.Description,
            Duration = lesson.Duration,
            WeekNumber = lesson.WeekNumber,
            TermNumber = lesson.TermNumber,
            SubjectId = lesson.SubjectId,
            PosterUrl = lesson.PosterUrl,
            
            // ✅ Default values for guests
            IsEnrolled = false,
            HasAccess = false,
            Progress = 0,
            IsCompleted = false,
            IsLocked = true,
            LastAccessedDate = null
        }).ToList();
    }

    // ✅ If studentId provided (authenticated user):
    // Check enrollment and get progress
    var enrollment = await _context.StudentSubjects
        .Where(ss => ss.StudentId == studentId && ss.SubjectId == subjectId)
        .FirstOrDefaultAsync();

    var progress = await _context.StudentProgress
        .Where(sp => sp.StudentId == studentId && sp.Lesson.SubjectId == subjectId)
        .ToListAsync();

    return lessons.Select(lesson => {
        var lessonProgress = progress.FirstOrDefault(p => p.LessonId == lesson.Id);
        
        return new LessonWithProgressDto
        {
            // Lesson data
            Id = lesson.Id,
            Title = lesson.Title,
            Description = lesson.Description,
            Duration = lesson.Duration,
            WeekNumber = lesson.WeekNumber,
            TermNumber = lesson.TermNumber,
            SubjectId = lesson.SubjectId,
            PosterUrl = lesson.PosterUrl,
            
            // ✅ Actual enrollment and progress data
            IsEnrolled = enrollment != null,
            HasAccess = enrollment != null && enrollment.IsActive,
            Progress = lessonProgress?.Progress ?? 0,
            IsCompleted = lessonProgress?.IsCompleted ?? false,
            IsLocked = enrollment == null || !enrollment.IsActive,
            LastAccessedDate = lessonProgress?.LastAccessedDate
        };
    }).ToList();
}
```

---

## 4. Database Impact

**No database changes required.** This is purely a logic change in the application layer.

---

## 5. Files to Modify or Create

### Files to Modify:
1. **`Controllers/LessonsController.cs`**
   - Make `studentId` parameter optional in route definitions
   - Change parameter type from `int` to `int?`
   - Add default value `= null`

2. **`Services/LessonsService.cs`** (or equivalent service file)
   - Update method signatures to accept `int? studentId`
   - Add logic to handle `null` studentId case
   - Return default "guest" values when no studentId

3. **`DTOs/LessonWithProgressDto.cs`** (if needed)
   - Ensure all fields support "no enrollment" state
   - May need to add `IsGuestMode` flag (optional)

### Files to Create:
- None required

---

## 6. Request and Response Examples

### Example 1: Guest User (No studentId)

**Request:**
```http
GET /api/Lessons/subject/1/with-progress
Authorization: None (guest user)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "title": "Introduction to Algebra",
      "description": "Learn the basics of algebraic expressions",
      "duration": 45,
      "weekNumber": 1,
      "termNumber": 1,
      "subjectId": 1,
      "posterUrl": "https://example.com/images/algebra-intro.jpg",
      "isEnrolled": false,
      "hasAccess": false,
      "progress": 0,
      "isCompleted": false,
      "isLocked": true,
      "lastAccessedDate": null
    },
    {
      "id": 102,
      "title": "Solving Linear Equations",
      "description": "Master the art of solving linear equations",
      "duration": 50,
      "weekNumber": 2,
      "termNumber": 1,
      "subjectId": 1,
      "posterUrl": "https://example.com/images/linear-equations.jpg",
      "isEnrolled": false,
      "hasAccess": false,
      "progress": 0,
      "isCompleted": false,
      "isLocked": true,
      "lastAccessedDate": null
    }
  ]
}
```

### Example 2: Authenticated Student

**Request:**
```http
GET /api/Lessons/subject/1/with-progress/42
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "title": "Introduction to Algebra",
      "description": "Learn the basics of algebraic expressions",
      "duration": 45,
      "weekNumber": 1,
      "termNumber": 1,
      "subjectId": 1,
      "posterUrl": "https://example.com/images/algebra-intro.jpg",
      "isEnrolled": true,
      "hasAccess": true,
      "progress": 85,
      "isCompleted": true,
      "isLocked": false,
      "lastAccessedDate": "2025-11-05T14:30:00Z"
    },
    {
      "id": 102,
      "title": "Solving Linear Equations",
      "description": "Master the art of solving linear equations",
      "duration": 50,
      "weekNumber": 2,
      "termNumber": 1,
      "subjectId": 1,
      "posterUrl": "https://example.com/images/linear-equations.jpg",
      "isEnrolled": true,
      "hasAccess": true,
      "progress": 35,
      "isCompleted": false,
      "isLocked": false,
      "lastAccessedDate": "2025-11-06T10:15:00Z"
    }
  ]
}
```

---

## 7. Additional Notes

### Frontend Impact:
- Frontend will call these endpoints **without** `studentId` for guest users
- Frontend will show "Preview Mode" banner when `isEnrolled: false`
- Guests can browse lessons but cannot access content or track progress
- Sign-in/Register buttons will be shown to convert guests to users

### Security Considerations:
- **No sensitive data exposure:** Lesson metadata is public preview content
- **Content remains protected:** Actual lesson content (videos, quizzes, etc.) still requires authentication
- **Enrollment check still enforced:** Lesson detail endpoints still require authentication and enrollment

### Testing Scenarios:
1. ✅ Guest user can view lesson list without authentication
2. ✅ Guest sees `isEnrolled: false` and `isLocked: true` for all lessons
3. ✅ Authenticated but not enrolled student sees same "locked" state
4. ✅ Enrolled student sees progress and unlocked lessons
5. ✅ API handles missing/null `studentId` gracefully without errors

---

## 8. Priority Level

**Priority:** Medium-High  
**Reason:** This enables marketing and user acquisition by allowing content preview

---

## 9. Contact Information

**Frontend Team:** Ready to test once backend changes are deployed  
**Expected Timeline:** 2-3 days for implementation and testing  

---

**End of Report**
