# 🔧 Backend Implementation Checklist - Teacher Content Management

**Date:** November 18, 2025  
**Version:** 1.0  
**Status:** Requires Backend Implementation

---

## Overview

The **Frontend** (Angular) is **100% complete** and **ready to work**. However, the **Backend** (.NET API) has **several issues** that prevent the feature from working properly.

This document provides a **detailed checklist** of what needs to be fixed/implemented in the backend.

---

## 🚨 Critical Issues (Must Fix)

### Issue #1: Teacher's Subjects Endpoint - Returns Wrong Data

**Current Behavior:**
```
GET /api/TeacherContent/my-subjects
Response: { "data": [1, 2, 3] }  // ❌ Only IDs!
```

**Expected Behavior:**
```
GET /api/TeacherContent/my-subjects
Response: {
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "subjectId": 1,
      "subjectName": "Mathematics",
      "yearId": 1,
      "yearName": "Grade 10",
      "canCreate": true,
      "canEdit": true,
      "canDelete": false,
      "stats": {
        "total": 5,      // Total lessons
        "approved": 3,   // Approved lessons
        "pending": 1,    // Pending approval
        "rejected": 0,   // Rejected lessons
        "revisionRequested": 1  // Needs revision
      }
    },
    {
      "subjectId": 2,
      "subjectName": "Science",
      "yearId": 1,
      "yearName": "Grade 10",
      "canCreate": true,
      "canEdit": true,
      "canDelete": false,
      "stats": { "total": 3, "approved": 2, "pending": 1, "rejected": 0, "revisionRequested": 0 }
    }
  ]
}
```

**What Needs to Change:**
- [ ] Return full `TeacherSubject` object, not just ID
- [ ] Include subject name and year information
- [ ] Include permissions (canCreate, canEdit, canDelete)
- [ ] Include statistics for each subject
- [ ] Test the endpoint with real data

**Backend Implementation:**

File: `Controllers/TeacherContentController.cs`

```csharp
[HttpGet("my-subjects")]
[Authorize(Roles = "Teacher")]
public async Task<ActionResult<ApiResponse<List<TeacherSubjectDto>>>> GetMySubjects()
{
    try
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!int.TryParse(userId, out var teacherId))
            return Unauthorized("Invalid teacher ID");
        
        var subjects = await _context.TeacherSubjects
            .Where(ts => ts.TeacherId == teacherId)
            .Include(ts => ts.Subject)
            .Include(ts => ts.Subject.Year)
            .Select(ts => new TeacherSubjectDto
            {
                SubjectId = ts.SubjectId,
                SubjectName = ts.Subject.Name,
                YearId = ts.Subject.YearId,
                YearName = ts.Subject.Year?.Name ?? "Unknown",
                CanCreate = ts.CanCreate,
                CanEdit = ts.CanEdit,
                CanDelete = ts.CanDelete,
                Stats = new SubjectStatsDto
                {
                    Total = ts.Subject.Lessons.Count(),
                    Approved = ts.Subject.Lessons.Count(l => l.Status == ContentStatus.APPROVED),
                    Pending = ts.Subject.Lessons.Count(l => l.Status == ContentStatus.PENDING),
                    Rejected = ts.Subject.Lessons.Count(l => l.Status == ContentStatus.REJECTED),
                    RevisionRequested = ts.Subject.Lessons.Count(l => l.Status == ContentStatus.REVISION_REQUESTED)
                }
            })
            .ToListAsync();
        
        return Ok(ApiResponse<List<TeacherSubjectDto>>.Success(
            subjects, 
            "Subjects retrieved successfully"
        ));
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching teacher subjects");
        return StatusCode(500, ApiResponse<string>.Failure("An error occurred while fetching subjects"));
    }
}
```

**DTOs Needed:**

File: `DTOs/TeacherSubjectDto.cs`

```csharp
public class TeacherSubjectDto
{
    public int SubjectId { get; set; }
    public string SubjectName { get; set; }
    public int YearId { get; set; }
    public string YearName { get; set; }
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public SubjectStatsDto Stats { get; set; }
}

public class SubjectStatsDto
{
    public int Total { get; set; }
    public int Approved { get; set; }
    public int Pending { get; set; }
    public int Rejected { get; set; }
    public int RevisionRequested { get; set; }
}
```

---

### Issue #2: Subject Creation Permission - Teacher Cannot Create

**Current Behavior:**
```
POST /api/Subjects
Response: 403 Forbidden
Message: "Only Admin users can create subjects"
```

**Problem:** The authorization is too restrictive.

**Solution Options:**

#### Option A: Grant Permission to Teacher (Simple - 5 minutes)

```sql
-- Run in Database Management Studio or via Migrations
INSERT INTO TeacherPermissions (TeacherId, SubjectId, CanCreate, CanEdit, CanDelete, CreatedAt)
VALUES (5, NULL, 1, 1, 0, GETUTCDATE());
-- Replace 5 with actual teacher ID
```

**OR via API:**
```
POST /api/TeacherPermissions/grant
Content-Type: application/json

{
  "teacherId": 5,
  "subjectId": null,
  "canCreate": true,
  "canEdit": true,
  "canDelete": false
}
```

#### Option B: Modify Authorization (Better - 30 minutes)

File: `Controllers/SubjectsController.cs`

```csharp
[HttpPost]
[Authorize]  // Changed from [Authorize(Roles = "Admin")]
public async Task<ActionResult<ApiResponse<SubjectDto>>> CreateSubject(
    [FromForm] CreateSubjectDto dto)
{
    try
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (!int.TryParse(userId, out var id))
            return Unauthorized();
        
        // Check permissions
        bool hasPermission = userRole == "Admin";
        
        if (userRole == "Teacher")
        {
            // Teacher can create subject for themselves
            dto.TeacherId = id;
            
            // Check if teacher has create_subject permission
            var permission = await _context.TeacherPermissions
                .FirstOrDefaultAsync(p => p.TeacherId == id && p.CanCreate);
            
            hasPermission = permission != null;
        }
        
        if (!hasPermission)
            return Forbid("🔒 Permission Denied: You do not have permission to create subjects");
        
        // Rest of the implementation...
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating subject");
        return StatusCode(500, ApiResponse<string>.Failure("Error creating subject"));
    }
}
```

---

### Issue #3: File Upload Handling - Unconfirmed

**Questions:**
- [ ] Does the backend accept multipart/form-data?
- [ ] Are files being stored correctly?
- [ ] What is the file storage location?
- [ ] What URL is returned to the frontend?
- [ ] Are file size limits enforced server-side?

**Required Endpoint:**

```
POST /api/Lessons
Content-Type: multipart/form-data

Parameters:
- Title (string, required) - query parameter
- Description (string, required) - query parameter
- WeekId (int, optional) - query parameter
- PosterFile (file, required) - form field, max 10MB, image only
- VideoFile (file, required) - form field, max 500MB, video only

Response:
{
  "success": true,
  "message": "Lesson created successfully",
  "data": {
    "id": 123,
    "title": "Introduction to Algebra",
    "posterUrl": "https://api.example.com/uploads/lessons/posters/lesson-123.jpg",
    "videoUrl": "https://api.example.com/uploads/lessons/videos/lesson-123.mp4",
    "status": "CREATED"
  }
}
```

**Backend Implementation:**

```csharp
[HttpPost]
[Authorize(Roles = "Teacher")]
public async Task<ActionResult<ApiResponse<LessonDto>>> CreateLesson(
    [FromQuery] string title,
    [FromQuery] string description,
    [FromQuery] int? weekId,
    [FromForm] IFormFile posterFile,
    [FromForm] IFormFile videoFile)
{
    try
    {
        // Validation
        if (string.IsNullOrWhiteSpace(title))
            return BadRequest(ApiResponse<string>.Failure("Title is required"));
        
        if (posterFile == null || posterFile.Length == 0)
            return BadRequest(ApiResponse<string>.Failure("Poster file is required"));
        
        if (videoFile == null || videoFile.Length == 0)
            return BadRequest(ApiResponse<string>.Failure("Video file is required"));
        
        // File size validation
        const long maxImageSize = 10 * 1024 * 1024;      // 10 MB
        const long maxVideoSize = 500 * 1024 * 1024;     // 500 MB
        
        if (posterFile.Length > maxImageSize)
            return BadRequest(ApiResponse<string>.Failure("Poster file exceeds 10MB limit"));
        
        if (videoFile.Length > maxVideoSize)
            return BadRequest(ApiResponse<string>.Failure("Video file exceeds 500MB limit"));
        
        // File type validation
        var posterFileTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        var videoFileTypes = new[] { "video/mp4", "video/webm", "video/ogg", "video/x-matroska" };
        
        if (!posterFileTypes.Contains(posterFile.ContentType))
            return BadRequest(ApiResponse<string>.Failure("Invalid poster file type"));
        
        if (!videoFileTypes.Contains(videoFile.ContentType))
            return BadRequest(ApiResponse<string>.Failure("Invalid video file type"));
        
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userId, out var teacherId))
            return Unauthorized();
        
        // Save files
        var posterPath = await _fileService.SaveFileAsync(posterFile, "lessons/posters");
        var videoPath = await _fileService.SaveFileAsync(videoFile, "lessons/videos");
        
        // Create lesson
        var lesson = new Lesson
        {
            Title = title,
            Description = description,
            WeekId = weekId,
            PosterUrl = posterPath,
            VideoUrl = videoPath,
            TeacherId = teacherId,
            Status = ContentStatus.CREATED,
            CreatedAt = DateTime.UtcNow
        };
        
        _context.Lessons.Add(lesson);
        await _context.SaveChangesAsync();
        
        return Ok(ApiResponse<LessonDto>.Success(
            _mapper.Map<LessonDto>(lesson),
            "Lesson created successfully"
        ));
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating lesson");
        return StatusCode(500, ApiResponse<string>.Failure("Error creating lesson"));
    }
}
```

---

## ⚠️ Important Endpoints to Verify

### 1. Get Teacher's Content

**Endpoint:** `GET /api/TeacherContent/my-content`

**Query Parameters:**
- `subjectId` (optional) - Filter by subject
- `status` (optional) - Filter by status (CREATED, PENDING, APPROVED, REJECTED, PUBLISHED)
- `pageNumber` (optional) - Default: 1
- `pageSize` (optional) - Default: 10

**Expected Response:**
```json
{
  "success": true,
  "message": "Content retrieved successfully",
  "data": [
    {
      "id": 1,
      "itemType": "Lesson",
      "title": "Introduction to Algebra",
      "description": "Basic algebra concepts",
      "status": "PENDING",
      "createdAt": "2025-11-18T10:00:00Z",
      "updatedAt": "2025-11-18T11:00:00Z",
      "approvedAt": null,
      "rejectionReason": null,
      "revisionFeedback": null,
      "subjectId": 1,
      "weekId": 1
    }
  ]
}
```

**Checklist:**
- [ ] Endpoint exists and is accessible
- [ ] Returns only user's content
- [ ] Filtering works correctly
- [ ] Pagination works correctly
- [ ] Status values match frontend expectations

---

### 2. Get Pending Approvals (Admin)

**Endpoint:** `GET /api/TeacherContent/pending-approvals`

**Expected Response:**
```json
{
  "success": true,
  "message": "Pending approvals retrieved successfully",
  "data": [
    {
      "id": 1,
      "itemType": "Lesson",
      "title": "Mathematics 101",
      "status": "PENDING",
      "createdAt": "2025-11-18T10:00:00Z",
      "updatedAt": "2025-11-18T11:00:00Z",
      "teacherName": "Ahmed Teacher",
      "teacherId": 5,
      "submittedAt": "2025-11-18T11:00:00Z"
    }
  ]
}
```

**Checklist:**
- [ ] Only admin can access
- [ ] Returns pending content only
- [ ] Includes teacher information
- [ ] Sorted by submission date

---

### 3. Approve Content

**Endpoint:** `POST /api/TeacherContent/approve`

**Request Body:**
```json
{
  "contentId": 1,
  "remarks": "Looks good!"  // Optional
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Content approved successfully",
  "data": {
    "id": 1,
    "status": "APPROVED",
    "approvedAt": "2025-11-18T12:00:00Z",
    "approvedBy": 10
  }
}
```

**Checklist:**
- [ ] Only admin can access
- [ ] Updates content status to APPROVED
- [ ] Saves approval timestamp
- [ ] Saves admin ID who approved

---

### 4. Request Revision

**Endpoint:** `POST /api/TeacherContent/request-revision`

**Request Body:**
```json
{
  "contentId": 1,
  "feedback": "Please improve the video quality"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Revision request sent successfully",
  "data": {
    "id": 1,
    "status": "REVISION_REQUESTED",
    "revisionFeedback": "Please improve the video quality"
  }
}
```

**Checklist:**
- [ ] Only admin can access
- [ ] Updates content status to REVISION_REQUESTED
- [ ] Saves feedback for teacher
- [ ] Teacher can see the feedback

---

## 📋 Comprehensive Checklist

### Database Changes Needed
- [ ] `TeacherSubjectPermissions` table exists and has correct schema
- [ ] `TeacherPermissions` table with `CanCreate`, `CanEdit`, `CanDelete` columns
- [ ] `ContentStatus` enum includes: CREATED, SUBMITTED, PENDING, APPROVED, PUBLISHED, REJECTED, REVISION_REQUESTED
- [ ] Lesson/Content tables have `PosterUrl`, `VideoUrl`, `RejectionReason`, `RevisionFeedback` columns

### API Endpoints to Verify
- [ ] `GET /api/TeacherContent/my-subjects` - Returns full subject objects
- [ ] `POST /api/Subjects` - Teacher can create subjects
- [ ] `GET /api/TeacherContent/my-content` - Returns teacher's content
- [ ] `POST /api/Lessons` - Accepts multipart/form-data with files
- [ ] `GET /api/TeacherContent/pending-approvals` - Returns pending content
- [ ] `POST /api/TeacherContent/approve` - Approves content
- [ ] `POST /api/TeacherContent/request-revision` - Requests revision
- [ ] `GET /api/TeacherContent/history` - Returns approval history
- [ ] `GET /api/TeacherContent/can-manage/{subjectId}` - Checks permissions

### Code Quality
- [ ] All endpoints have proper error handling
- [ ] All endpoints validate input data
- [ ] All endpoints check user permissions
- [ ] All endpoints log errors
- [ ] All endpoints return consistent response format

### Testing
- [ ] Test all endpoints with valid data
- [ ] Test all endpoints with invalid data
- [ ] Test all endpoints without authentication
- [ ] Test all endpoints with wrong role
- [ ] Test file uploads with large files
- [ ] Test file uploads with wrong file types

---

## 🚀 Implementation Priority

**Priority 1 (CRITICAL - Do First):**
1. Fix `/api/TeacherContent/my-subjects` to return full objects
2. Allow teachers to create subjects (grant permission or modify authorization)

**Priority 2 (HIGH - Do Second):**
3. Verify `/api/Lessons` file upload handling
4. Verify `/api/TeacherContent/my-content` works correctly

**Priority 3 (MEDIUM - Do Third):**
5. Implement approval workflow (`approve`, `request-revision`)
6. Verify approval history tracking

**Priority 4 (LOW - Do Last):**
7. Performance optimization
8. Caching implementation
9. Logging improvements

---

## 📞 Questions for Backend Team

Before you start, answer these:

1. Is the `TeacherSubjects` relationship correctly configured in EF Core?
2. What is the current file upload implementation?
3. Where are files stored (local, blob storage, CDN)?
4. What is the production URL for file access?
5. Are there any existing issues with multipart/form-data handling?
6. How are permissions currently enforced?
7. Is there a migration for the latest schema changes?

---

**Prepared by:** GitHub Copilot  
**Date:** November 18, 2025  
**Status:** Ready for Backend Implementation

