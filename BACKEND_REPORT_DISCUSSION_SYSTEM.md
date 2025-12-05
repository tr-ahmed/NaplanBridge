# 📌 BACKEND REPORT - Discussion System APIs

**Date:** December 2, 2025  
**Project:** NaplanBridge  
**Component:** Discussion System (Lesson Detail Page)  
**Status:** ⛔ BLOCKED - Missing Backend APIs

---

## 🎯 Summary

The **Discussion System** feature has been fully implemented in the frontend, but cannot function because the required backend API endpoints are **missing (404 errors)**.

---

## ❌ Missing Backend Endpoints

### 1. **GET `/api/Discussions/lessons/{lessonId}`**
**Purpose:** Retrieve all discussions/questions for a specific lesson

**Current Status:** `404 Not Found`

**Expected Response:**
```json
[
  {
    "id": 1,
    "lessonId": 37,
    "studentId": 17,
    "studentName": "Ahmed Tarek",
    "question": "Can you explain this concept?",
    "videoTimestamp": 145,
    "createdAt": "2025-12-02T10:30:00Z",
    "replies": [
      {
        "id": 1,
        "discussionId": 1,
        "userId": 5,
        "userName": "Teacher Ahmed",
        "userRole": "Teacher",
        "reply": "Sure! Here's the explanation...",
        "createdAt": "2025-12-02T11:00:00Z"
      }
    ]
  }
]
```

**Request Parameters:**
- `lessonId` (path parameter, required) - Integer
- `studentId` (query parameter, optional) - Integer

**Error Log:**
```
GET https://naplan2.runasp.net/api/Discussions/lessons/37 404 (Not Found)
404 Resource not found: https://naplan2.runasp.net/api/Discussions/lessons/37
```

---

### 2. **POST `/api/Discussions/lessons/{lessonId}`**
**Purpose:** Create a new discussion/question for a lesson

**Current Status:** `404 Not Found`

**Expected Request Body:**
```json
{
  "question": "Can you explain this concept?",
  "videoTimestamp": 145
}
```

**Field Details:**
- `question` (string, required) - The student's question
- `videoTimestamp` (integer, optional) - Video time in seconds when question was asked

**Expected Response:**
```json
{
  "id": 1,
  "lessonId": 37,
  "studentId": 17,
  "studentName": "Ahmed Tarek",
  "question": "Can you explain this concept?",
  "videoTimestamp": 145,
  "createdAt": "2025-12-02T10:30:00Z",
  "replies": []
}
```

**Error Log:**
```
POST https://naplan2.runasp.net/api/Discussions/lessons/37 404 (Not Found)
Backend error 404: {message: 'Student not found'}
```

**⚠️ Additional Error:**
```json
{
  "errors": {
    "dto": ["The dto field is required."],
    "$.videoTimestamp": [
      "The JSON value could not be converted to System.Nullable`1[System.Int32]"
    ]
  }
}
```

**Solution Applied in Frontend:**
- `videoTimestamp` is now sent as `Math.floor(seconds)` or `undefined` (not `0`)
- This ensures it's either a valid integer or null

---

### 3. **POST `/api/Discussions/{discussionId}/replies`**
**Purpose:** Add a reply to an existing discussion

**Current Status:** Not tested yet (main endpoint missing)

**Expected Request Body:**
```json
{
  "reply": "Here's my answer..."
}
```

**Expected Response:**
```json
{
  "id": 1,
  "discussionId": 1,
  "userId": 5,
  "userName": "Teacher Ahmed",
  "userRole": "Teacher",
  "reply": "Here's my answer...",
  "createdAt": "2025-12-02T11:00:00Z"
}
```

---

## 🔧 Required Backend Implementation

### **Database Schema (Suggestion)**

```sql
-- Discussions Table
CREATE TABLE Discussions (
    Id INT PRIMARY KEY IDENTITY,
    LessonId INT NOT NULL,
    StudentId INT NOT NULL,
    Question NVARCHAR(MAX) NOT NULL,
    VideoTimestamp INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (LessonId) REFERENCES Lessons(Id),
    FOREIGN KEY (StudentId) REFERENCES Students(Id)
);

-- Discussion Replies Table
CREATE TABLE DiscussionReplies (
    Id INT PRIMARY KEY IDENTITY,
    DiscussionId INT NOT NULL,
    UserId INT NOT NULL,
    UserRole NVARCHAR(50) NOT NULL, -- 'Student', 'Teacher', 'Admin'
    Reply NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (DiscussionId) REFERENCES Discussions(Id)
);
```

---

### **Controller Implementation (C# Example)**

```csharp
[ApiController]
[Route("api/[controller]")]
public class DiscussionsController : ControllerBase
{
    // GET /api/Discussions/lessons/{lessonId}
    [HttpGet("lessons/{lessonId}")]
    public async Task<ActionResult<List<DiscussionDto>>> GetLessonDiscussions(
        int lessonId,
        [FromQuery] int? studentId = null)
    {
        // 1. Validate lesson exists
        // 2. Get all discussions for this lesson
        // 3. Include replies with user details
        // 4. Return list ordered by CreatedAt DESC
    }

    // POST /api/Discussions/lessons/{lessonId}
    [HttpPost("lessons/{lessonId}")]
    public async Task<ActionResult<DiscussionDto>> CreateDiscussion(
        int lessonId,
        [FromBody] CreateDiscussionDto dto)
    {
        // 1. Validate lesson exists
        // 2. Get studentId from authenticated user
        // 3. Validate videoTimestamp is null or positive integer
        // 4. Create discussion record
        // 5. Return created discussion with student details
    }

    // POST /api/Discussions/{discussionId}/replies
    [HttpPost("{discussionId}/replies")]
    public async Task<ActionResult<ReplyDto>> AddReply(
        int discussionId,
        [FromBody] CreateReplyDto dto)
    {
        // 1. Validate discussion exists
        // 2. Get userId and role from authenticated user
        // 3. Create reply record
        // 4. Return reply with user details
    }
}
```

---

### **DTOs Required**

```csharp
public class CreateDiscussionDto
{
    [Required]
    [MinLength(10)]
    public string Question { get; set; }
    
    public int? VideoTimestamp { get; set; } // Nullable integer
}

public class CreateReplyDto
{
    [Required]
    [MinLength(5)]
    public string Reply { get; set; }
}

public class DiscussionDto
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; }
    public string Question { get; set; }
    public int? VideoTimestamp { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ReplyDto> Replies { get; set; }
}

public class ReplyDto
{
    public int Id { get; set; }
    public int DiscussionId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; }
    public string UserRole { get; set; } // "Student", "Teacher", "Admin"
    public string Reply { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

---

## ✅ Frontend Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Discussion Tab UI | ✅ Complete | Fully implemented |
| Load Discussions (GET) | ✅ Ready | Waiting for API |
| Create Discussion (POST) | ✅ Ready | Waiting for API |
| Add Reply | ✅ Ready | Waiting for API |
| Video Timestamp Integration | ✅ Fixed | Now sends correct integer or null |
| Error Handling | ✅ Complete | Graceful fallback |
| Loading States | ✅ Complete | Spinners and messages |
| Empty States | ✅ Complete | "No discussions yet" |

---

## 🔐 Authentication & Authorization

**Required Permissions:**
- **View Discussions:** Any authenticated user (Student, Teacher, Admin)
- **Create Discussion:** Students only (for their enrolled lessons)
- **Reply to Discussion:** Teachers and Admins (for all lessons), Students (for their own discussions)

**Note:** The frontend automatically includes:
```
Authorization: Bearer <token>
Accept: application/json
```

---

## 🧪 Testing Checklist (After Backend Implementation)

- [ ] GET discussions for a lesson with no discussions (should return empty array)
- [ ] GET discussions for a lesson with existing discussions
- [ ] POST new discussion without videoTimestamp
- [ ] POST new discussion with videoTimestamp (e.g., 145 seconds)
- [ ] POST discussion with invalid data (should return 400)
- [ ] POST discussion for non-existent lesson (should return 404)
- [ ] POST discussion by unauthenticated user (should return 401)
- [ ] POST reply to existing discussion
- [ ] POST reply to non-existent discussion (should return 404)

---

## 📊 Impact

**Frontend Status:** ✅ **COMPLETE AND READY**  
**Backend Status:** ❌ **BLOCKING DEPLOYMENT**

**Cannot proceed with Discussion System until these APIs are implemented.**

---

## 🚀 Request

**Please implement the three endpoints listed above and confirm when ready for testing.**

Once confirmed, the Discussion System will be immediately functional with zero changes required on the frontend.

---

## 📎 Related Files (Frontend)

- `src/app/core/services/discussion.service.ts` - API service
- `src/app/features/lesson-detail/lesson-detail.component.ts` - Main component
- `src/app/features/lesson-detail/lesson-detail.component.html` - Discussion tab UI
- `src/app/models/discussion.models.ts` - TypeScript interfaces

---

**End of Report**
