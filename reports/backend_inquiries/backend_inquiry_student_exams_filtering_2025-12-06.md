# ❓ Backend Inquiry Report: Student Exams Filtering Enhancement

**Date**: December 6, 2025  
**Priority**: HIGH  
**Status**: ✅ **RESOLVED** - See: `reports/backend_changes/backend_change_student_exams_filtering_2025-12-06.md`

---

## 1. Inquiry Topic

Request to enhance the student exams endpoint response structure to include `subjectId` and `yearId` for proper filtering.

---

## 2. Reason for Inquiry

### Current Issue:
The endpoint `GET /api/Exam/student/{studentId}/all` returns exam data with limited filtering capabilities.

**Current Response Structure:**
```json
{
  "id": 15,
  "title": "sass week 1 term 1",
  "subject": "sass",           // ❌ Only name, no ID
  "startDate": "2025-12-05T21:39:00",
  "endDate": "2025-12-07T06:39:00",
  "durationInMinutes": 60,
  "totalMarks": 100,
  "passingMarks": 50,
  "examType": "Lesson",
  "isPublished": true
}
```

### Problems:
1. ❌ No `subjectId` field - cannot filter by enrolled subjects accurately
2. ❌ No `yearId` or `yearNumber` field - cannot filter by student's year level
3. ❌ Subject name alone is unreliable for matching (inconsistent formatting)
4. ❌ Must use slow string matching instead of fast ID comparison

### Current Workaround:
Frontend currently uses **string matching** on subject names and year names extracted from subscriptions, which is:
- Slower (string comparison vs. integer comparison)
- Less reliable (depends on consistent naming)
- Error-prone (typos, formatting differences)

---

## 3. Requested Details from Backend Team

### Question 1: Add `subjectId` to Response
**Q:** Can the exam response include the `subjectId` field?

**Expected Response Structure:**
```json
{
  "id": 15,
  "title": "sass week 1 term 1",
  "subjectId": 5,              // ✅ ADD THIS
  "subject": "sass",            // Keep this too
  "yearId": 8,                  // ✅ ADD THIS
  "yearNumber": 8,              // OR THIS
  "startDate": "2025-12-05T21:39:00",
  "endDate": "2025-12-07T06:39:00",
  "durationInMinutes": 60,
  "totalMarks": 100,
  "passingMarks": 50,
  "examType": "Lesson",
  "isPublished": true
}
```

### Question 2: Database Schema
**Q:** What is the relationship between `Exams` table and `Subjects`/`Years` tables?

**Expected Answer:**
```sql
-- Please confirm table structure
Exams
  - Id (int)
  - Title (nvarchar)
  - SubjectId (int, FK to Subjects)  -- ✅ Does this exist?
  - YearId (int, FK to Years)        -- ✅ Does this exist?
  - ...

Subjects
  - Id (int)
  - Name (nvarchar)
  - YearId (int, FK to Years)        -- ✅ Or is year relationship here?
  - ...
```

### Question 3: Backend Filtering
**Q:** Can the backend filter exams based on student's enrolled subjects?

**Current Behavior:**
- Does `GET /api/Exam/student/{studentId}/all` already filter by student's subscriptions?
- Or does it return ALL published exams (no filtering)?

**Desired Behavior:**
- Backend should return only exams for subjects the student is enrolled in
- Backend should filter by student's year level automatically

**If backend already has filtering logic:**
- Frontend workaround is unnecessary
- Just need to add `subjectId` and `yearId` to response

**If backend does NOT filter:**
- Please add filtering logic on backend
- More efficient than frontend filtering

### Question 4: Alternative Endpoints
**Q:** Is there a different endpoint that returns properly filtered exams?

Possible alternatives:
- `GET /api/StudentSubjects/student/{studentId}/exams`
- `GET /api/Exam/student/{studentId}/enrolled-subjects-exams`

---

## 4. Suggested Backend Implementation

### Option 1: Add Fields Only (Quick Fix)
Update the DTO to include missing fields:

```csharp
public class UpcomingExamDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    
    // ✅ ADD THESE FIELDS
    public int SubjectId { get; set; }        // From exam.SubjectId
    public string Subject { get; set; }        // From exam.Subject.Name
    public int? YearId { get; set; }          // From exam.Subject.YearId or exam.YearId
    public int? YearNumber { get; set; }      // From exam.Subject.Year.Number
    
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DurationInMinutes { get; set; }
    public int TotalMarks { get; set; }
    public int? PassingMarks { get; set; }
    public string ExamType { get; set; }
    public bool IsPublished { get; set; }
}
```

### Option 2: Add Backend Filtering (Recommended)
Filter exams before sending to frontend:

```csharp
[HttpGet("student/{studentId}/all")]
public async Task<IActionResult> GetAllStudentExams(int studentId)
{
    // ✅ Get student's enrolled subject IDs
    var enrolledSubjectIds = await _context.StudentSubjects
        .Where(ss => ss.StudentId == studentId && ss.IsActive)
        .Select(ss => ss.SubjectId)
        .ToListAsync();
    
    // ✅ Get student's year ID
    var student = await _context.Students
        .Include(s => s.Year)
        .FirstOrDefaultAsync(s => s.Id == studentId);
    
    // ✅ Filter exams by enrolled subjects AND year
    var exams = await _context.Exams
        .Include(e => e.Subject)
        .ThenInclude(s => s.Year)
        .Where(e => e.IsPublished 
                 && enrolledSubjectIds.Contains(e.SubjectId)
                 && e.Subject.YearId == student.YearId)  // ✅ Year filtering
        .Select(e => new UpcomingExamDto
        {
            Id = e.Id,
            Title = e.Title,
            SubjectId = e.SubjectId,          // ✅ Include ID
            Subject = e.Subject.Name,
            YearId = e.Subject.YearId,        // ✅ Include year
            YearNumber = e.Subject.Year.Number,
            StartDate = e.StartDate,
            EndDate = e.EndDate,
            DurationInMinutes = e.DurationInMinutes,
            TotalMarks = e.TotalMarks,
            PassingMarks = e.PassingMarks,
            ExamType = e.ExamType.ToString(),
            IsPublished = e.IsPublished
        })
        .ToListAsync();
    
    return Ok(new { data = new { totalCount = exams.Count, exams }, success = true });
}
```

---

## 5. Impact on Frontend

### Current Implementation:
- ✅ Frontend filters using string matching on subject names and year names
- ❌ Slow and unreliable
- ❌ All exams are transmitted even if student shouldn't see them

### After Backend Fix:
- ✅ Backend sends only relevant exams (better performance)
- ✅ Frontend uses ID comparison (faster)
- ✅ More secure (students don't receive irrelevant exam data)
- ✅ Reduced network payload

---

## 6. Affected Endpoints

The same changes should be applied to:
- ✅ `GET /api/Exam/student/{studentId}/all`
- ✅ `GET /api/Exam/student/{studentId}/upcoming`
- ✅ `GET /api/Exam/student/{studentId}/history` (if not already included)

---

## 7. Benefits of Implementation

### Performance:
- 🚀 Faster filtering (ID comparison vs. string matching)
- 🚀 Reduced network payload (only relevant exams)
- 🚀 Less processing on frontend

### Security:
- 🔒 Students don't receive exam data they shouldn't access
- 🔒 Backend controls data visibility

### Reliability:
- ✅ No dependency on consistent subject name formatting
- ✅ Accurate filtering using foreign keys
- ✅ Year-level filtering works correctly

### Maintainability:
- 📝 Cleaner frontend code
- 📝 Single source of truth (backend controls filtering)
- 📝 Easier to debug filtering issues

---

## 8. Timeline Request

**Priority**: HIGH  
**Reason**: Current workaround is functional but suboptimal

**Request**: Please implement within next backend update cycle

---

## 9. Frontend Status

**Current Status**: ✅ Temporary workaround implemented
- Filtering by subject names (string matching)
- Filtering by year names (string matching)
- Functional but not optimal

**Waiting for**: Backend to add `subjectId` and `yearId` fields, and optionally add backend filtering

**Frontend Update Required After Backend Fix**: 
- Update `UpcomingExamDto` interface to include new fields
- Switch from string matching to ID comparison
- Remove workaround code

---

## 10. Contact

**Frontend Developer**: Ready to update once backend changes are deployed  
**Files Affected**: 
- `src/app/features/student/student-exams/student-exams.component.ts`
- `src/app/models/exam-api.models.ts`
- `src/app/core/services/exam-api.service.ts`
