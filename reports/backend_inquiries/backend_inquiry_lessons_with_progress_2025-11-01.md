# ❓ Backend Inquiry Report - Student Lessons Progress Endpoint

## Date: November 1, 2025

---

## 1. Inquiry Topic

**Request endpoint to retrieve all lessons with student progress for filtering and display purposes**

---

## 2. Reason for Inquiry

### Current Situation:

The **Lessons page** (`/lessons`) needs to display:
1. All lessons for a specific subject/term
2. Student's progress/completion status for each lesson
3. Lock status (completed prerequisites)

### Problem:

Currently, we have these endpoints:

**Available Endpoints:**
- `GET /api/Lessons/subject/{subjectId}` - Returns lessons but **without** student progress
- `GET /api/Lessons/term/{termId}` - Returns lessons but **without** student progress
- `GET /api/Progress/by-student/{id}` - Returns progress but **without** lesson details
- `GET /api/Lessons/student-lessons/{id}` - Returns **single lesson** only

**What's Missing:**
- No endpoint returns **all lessons with student progress combined**
- Frontend needs to match lessons with progress manually
- Causes multiple API calls and complex client-side logic

### Current Frontend Code Issue:

```typescript
// lessons.component.ts (Line 161)
private loadStudentProgress(): void {
  const studentId = 1;
  
  // This endpoint returns only ONE lesson, not an array!
  this.lessonsService.getStudentLessons(studentId)  // ❌ Wrong endpoint
    .subscribe({
      next: (studentLessons) => {
        // Expects array but gets single object
        const subjectLessons = studentLessons.filter(
          sl => sl.lesson.subject === this.currentSubject()
        );
        this.studentLessons.set(subjectLessons);
      }
    });
}
```

---

## 3. Requested Endpoint

### **Option 1: Get Lessons with Progress by Subject (Recommended)**

**Endpoint:** `GET /api/Lessons/subject/{subjectId}/with-progress/{studentId}`

**Purpose:** Return all lessons for a subject with the student's progress embedded in each lesson object

**Authorization:** Student, Parent, Teacher, Admin

**Request Example:**
```http
GET /api/Lessons/subject/5/with-progress/1
Authorization: Bearer {token}
```

**Response Schema:**
```json
[
  {
    "id": 101,
    "title": "Introduction to Algebra",
    "description": "Learn basic algebra concepts",
    "subject": "Mathematics",
    "subjectId": 5,
    "termId": 2,
    "termNumber": 2,
    "weekId": 15,
    "weekNumber": 5,
    "orderIndex": 1,
    "duration": 45,
    "videoUrl": "https://...",
    "resourcesCount": 3,
    "hasQuiz": true,
    "prerequisiteIds": [],
    
    // ✅ Student Progress (embedded)
    "studentProgress": {
      "studentId": 1,
      "lessonId": 101,
      "isCompleted": true,
      "progress": 100,
      "lastAccessedAt": "2025-10-25T14:30:00Z",
      "completedAt": "2025-10-25T15:00:00Z",
      "timeSpent": 45
    },
    
    // ✅ Computed fields
    "isLocked": false,
    "isAvailable": true
  },
  {
    "id": 102,
    "title": "Algebraic Expressions",
    "subject": "Mathematics",
    "subjectId": 5,
    "termId": 2,
    "weekId": 15,
    "orderIndex": 2,
    "prerequisiteIds": [101],
    
    "studentProgress": {
      "studentId": 1,
      "lessonId": 102,
      "isCompleted": false,
      "progress": 30,
      "lastAccessedAt": "2025-11-01T10:00:00Z",
      "completedAt": null,
      "timeSpent": 15
    },
    
    "isLocked": false,  // Prerequisite 101 is completed
    "isAvailable": true
  },
  {
    "id": 103,
    "title": "Advanced Equations",
    "subject": "Mathematics",
    "subjectId": 5,
    "termId": 2,
    "weekId": 16,
    "orderIndex": 3,
    "prerequisiteIds": [102],
    
    "studentProgress": null,  // Not started yet
    
    "isLocked": true,  // Prerequisite 102 not completed
    "isAvailable": false
  }
]
```

---

### **Option 2: Get Lessons with Progress by Term**

**Endpoint:** `GET /api/Lessons/term/{termId}/with-progress/{studentId}`

**Purpose:** Same as Option 1 but filtered by term instead of subject

**Request Example:**
```http
GET /api/Lessons/term/2/with-progress/1
Authorization: Bearer {token}
```

---

### **Option 3: Enhance Existing Progress Endpoint**

**Endpoint:** `GET /api/Progress/by-student/{studentId}/with-lessons?subjectId={subjectId}`

**Purpose:** Return progress records with full lesson details embedded

**Request Example:**
```http
GET /api/Progress/by-student/1/with-lessons?subjectId=5
Authorization: Bearer {token}
```

**Response Schema:**
```json
[
  {
    "studentId": 1,
    "lessonId": 101,
    "isCompleted": true,
    "progress": 100,
    "lastAccessedAt": "2025-10-25T14:30:00Z",
    "completedAt": "2025-10-25T15:00:00Z",
    "timeSpent": 45,
    
    // ✅ Full lesson details embedded
    "lesson": {
      "id": 101,
      "title": "Introduction to Algebra",
      "description": "Learn basic algebra concepts",
      "subject": "Mathematics",
      "subjectId": 5,
      "termId": 2,
      "weekId": 15,
      "orderIndex": 1,
      "duration": 45,
      "videoUrl": "https://...",
      "prerequisiteIds": []
    }
  }
]
```

---

## 4. Backend Logic Suggestions

### A. Option 1 Implementation (Recommended)

```csharp
// LessonsController.cs

[HttpGet("subject/{subjectId}/with-progress/{studentId}")]
[Authorize]
public async Task<ActionResult<IEnumerable<LessonWithProgressDto>>> GetLessonsBySubjectWithProgress(
    int subjectId, 
    int studentId)
{
    // 1. Get all lessons for the subject
    var lessons = await _context.Lessons
        .Where(l => l.SubjectId == subjectId)
        .OrderBy(l => l.TermId)
            .ThenBy(l => l.WeekId)
            .ThenBy(l => l.OrderIndex)
        .ToListAsync();

    // 2. Get all progress records for this student
    var progressRecords = await _context.Progress
        .Where(p => p.StudentId == studentId && p.Lesson.SubjectId == subjectId)
        .ToListAsync();

    // 3. Create a dictionary for quick lookup
    var progressDict = progressRecords.ToDictionary(p => p.LessonId);

    // 4. Map to DTO with embedded progress
    var result = lessons.Select(lesson => new LessonWithProgressDto
    {
        Id = lesson.Id,
        Title = lesson.Title,
        Description = lesson.Description,
        Subject = lesson.Subject.Name,
        SubjectId = lesson.SubjectId,
        TermId = lesson.TermId,
        TermNumber = lesson.Term?.TermNumber,
        WeekId = lesson.WeekId,
        WeekNumber = lesson.Week?.WeekNumber,
        OrderIndex = lesson.OrderIndex,
        Duration = lesson.Duration,
        VideoUrl = lesson.VideoUrl,
        ResourcesCount = lesson.Resources.Count,
        HasQuiz = lesson.Questions.Any(),
        PrerequisiteIds = lesson.Prerequisites.Select(p => p.Id).ToList(),
        
        // Embed student progress
        StudentProgress = progressDict.TryGetValue(lesson.Id, out var progress)
            ? new StudentProgressDto
            {
                StudentId = progress.StudentId,
                LessonId = progress.LessonId,
                IsCompleted = progress.IsCompleted,
                Progress = progress.Progress,
                LastAccessedAt = progress.LastAccessedAt,
                CompletedAt = progress.CompletedAt,
                TimeSpent = progress.TimeSpent
            }
            : null,
        
        // Compute lock status
        IsLocked = IsLessonLocked(lesson, progressDict),
        IsAvailable = !IsLessonLocked(lesson, progressDict)
    }).ToList();

    return Ok(result);
}

private bool IsLessonLocked(Lesson lesson, Dictionary<int, Progress> progressDict)
{
    // If no prerequisites, lesson is unlocked
    if (!lesson.Prerequisites.Any())
        return false;

    // Check if all prerequisites are completed
    foreach (var prereq in lesson.Prerequisites)
    {
        if (!progressDict.TryGetValue(prereq.Id, out var progress) || !progress.IsCompleted)
        {
            return true;  // At least one prerequisite not completed
        }
    }

    return false;  // All prerequisites completed
}
```

---

### B. Required DTOs

```csharp
// DTOs/LessonWithProgressDto.cs

public class LessonWithProgressDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Subject { get; set; }
    public int SubjectId { get; set; }
    public int? TermId { get; set; }
    public int? TermNumber { get; set; }
    public int? WeekId { get; set; }
    public int? WeekNumber { get; set; }
    public int OrderIndex { get; set; }
    public int Duration { get; set; }
    public string VideoUrl { get; set; }
    public int ResourcesCount { get; set; }
    public bool HasQuiz { get; set; }
    public List<int> PrerequisiteIds { get; set; }
    
    // Student progress (null if not started)
    public StudentProgressDto? StudentProgress { get; set; }
    
    // Computed fields
    public bool IsLocked { get; set; }
    public bool IsAvailable { get; set; }
}

public class StudentProgressDto
{
    public int StudentId { get; set; }
    public int LessonId { get; set; }
    public bool IsCompleted { get; set; }
    public int Progress { get; set; }  // 0-100
    public DateTime? LastAccessedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int TimeSpent { get; set; }  // in minutes
}
```

---

## 5. Use Cases

### Use Case 1: Display Lessons Page

**Scenario:**
- Student: Ali Ahmed (ID: 1)
- Viewing: Mathematics subject (ID: 5)
- Has completed: 2 out of 10 lessons

**Request:**
```http
GET /api/Lessons/subject/5/with-progress/1
```

**Expected Response:**
- Array of 10 lessons
- Each lesson has embedded `studentProgress` (or null)
- Lessons with completed prerequisites have `isLocked: false`
- Lessons without completed prerequisites have `isLocked: true`

**Frontend Usage:**
```typescript
this.lessonsService.getLessonsWithProgress(subjectId, studentId)
  .subscribe(lessons => {
    this.lessons.set(lessons);
    
    // Can directly use in template
    // No need for separate progress loading or client-side matching
  });
```

---

### Use Case 2: Filter by Term

**Scenario:**
- Student viewing Term 2 lessons only
- Want to see progress for current term

**Request:**
```http
GET /api/Lessons/term/2/with-progress/1
```

---

### Use Case 3: No Progress Yet

**Scenario:**
- New student viewing lessons for first time
- No progress records exist

**Expected Response:**
```json
[
  {
    "id": 101,
    "title": "Introduction to Algebra",
    "studentProgress": null,  // ← No progress yet
    "isLocked": false,  // First lesson always unlocked
    "isAvailable": true
  }
]
```

---

## 6. Benefits of This Approach

### ✅ Performance
- **1 API call** instead of 2+ calls
- Backend joins data efficiently
- Reduced network overhead

### ✅ Simplicity
- No client-side data matching needed
- No complex RxJS operators (combineLatest, forkJoin)
- Cleaner component code

### ✅ Consistency
- Lock status calculated by backend (single source of truth)
- Progress data always matches lesson data
- Easier to maintain business logic

### ✅ Scalability
- Easy to add more fields (e.g., nextLessonId, estimatedTime)
- Can add filtering (e.g., completedOnly, availableOnly)
- Can add sorting options

---

## 7. Alternative: Frontend Approach (Not Recommended)

If backend endpoint cannot be created, frontend can:

```typescript
// Not recommended - requires multiple API calls and complex logic
forkJoin({
  lessons: this.lessonsService.getLessonsBySubjectId(subjectId),
  progress: this.progressService.getProgressByStudent(studentId)
}).pipe(
  map(({ lessons, progress }) => {
    // Manually match and merge data
    const progressMap = new Map(progress.map(p => [p.lessonId, p]));
    
    return lessons.map(lesson => ({
      ...lesson,
      studentProgress: progressMap.get(lesson.id) || null,
      isLocked: this.isLessonLocked(lesson, progressMap)
    }));
  })
).subscribe(lessonsWithProgress => {
  this.lessons.set(lessonsWithProgress);
});
```

**Problems with this approach:**
- ❌ 2 separate API calls
- ❌ Increased network latency
- ❌ Complex client-side logic
- ❌ Harder to maintain
- ❌ Inconsistent lock status calculation

---

## 8. Database Schema Requirements

### Required Tables/Relationships:

```sql
Lessons
├── Id (PK)
├── Title
├── SubjectId (FK → Subjects)
├── TermId (FK → Terms, nullable)
├── WeekId (FK → Weeks, nullable)
├── OrderIndex
├── Duration
└── Prerequisites (Many-to-Many self-reference)

Progress (StudentLessons)
├── StudentId (FK → Students)
├── LessonId (FK → Lessons)
├── IsCompleted (bool)
├── Progress (int, 0-100)
├── LastAccessedAt (DateTime)
├── CompletedAt (DateTime, nullable)
└── TimeSpent (int, minutes)

LessonPrerequisites (Junction Table)
├── LessonId (FK → Lessons)
└── PrerequisiteId (FK → Lessons)
```

---

## 9. Priority

**🔴 HIGH**

**Why:**
- Critical for Lessons page functionality
- Currently causing 404 errors
- Affects user experience significantly
- Blocks lesson progress tracking
- Needed for production release

---

## 10. Questions for Backend Team

1. ✅ Can you create endpoint `GET /api/Lessons/subject/{subjectId}/with-progress/{studentId}`?
2. ✅ Should we also add term variant: `GET /api/Lessons/term/{termId}/with-progress/{studentId}`?
3. ✅ Should `studentProgress` be null or empty object when no progress exists?
4. ✅ Should `isLocked` calculation be done backend or frontend?
5. ✅ Can we add query params for filtering (e.g., `?completedOnly=true`)?
6. ✅ What's the performance impact with many lessons (100+)?
7. ✅ Should we paginate results or return all lessons?
8. ✅ Can we include prerequisite lesson titles (not just IDs)?

---

## 11. Frontend Implementation (After Endpoint Available)

```typescript
// lessons.service.ts
getLessonsWithProgress(subjectId: number, studentId: number): Observable<LessonWithProgress[]> {
  const url = `${this.baseUrl}/Lessons/subject/${subjectId}/with-progress/${studentId}`;
  return this.http.get<LessonWithProgress[]>(url);
}

// lessons.component.ts
private loadLessons(): void {
  const subjectId = this.currentSubjectId();
  const studentId = this.authService.getCurrentUser()?.studentId;
  
  if (!subjectId || !studentId) return;
  
  this.loading.set(true);
  
  this.lessonsService.getLessonsWithProgress(subjectId, studentId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (lessons) => {
        this.lessons.set(lessons);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load lessons');
        this.loading.set(false);
      }
    });
}
```

---

**Report Generated:** November 1, 2025  
**Frontend Status:** ⏳ **BLOCKED** - Waiting for lessons with progress endpoint  
**Backend Action Required:** ✅ **HIGH PRIORITY** - Create combined lessons+progress endpoint

---

**Recommendation:** Implement `GET /api/Lessons/subject/{subjectId}/with-progress/{studentId}` endpoint to provide lessons with embedded student progress. This eliminates multiple API calls and simplifies frontend logic significantly.
