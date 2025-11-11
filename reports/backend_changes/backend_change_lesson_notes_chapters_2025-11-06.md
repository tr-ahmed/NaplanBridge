# 🔧 Backend Change Report

## 1. Reason for Change

The frontend lesson detail page requires additional endpoints to support:
- **Student Notes**: Allow students to create, edit, and manage personal notes for lessons
- **Video Chapters**: Enable structured navigation within lesson videos with timestamped chapters

Currently, the API only provides:
- ✅ Lesson Questions (Quiz) - Already implemented at `/api/LessonQuestions`
- ❌ Student Notes for lessons - **Missing**
- ❌ Video Chapters with timestamps - **Missing**

---

## 2. Required New Endpoints

### A. Student Notes Endpoints

#### GET `/api/LessonNotes/lesson/{lessonId}`
- **Method:** `GET`
- **Controller:** `LessonNotesController`
- **Action:** `GetLessonNotes`
- **Description:** Get all notes created by the authenticated student for a specific lesson
- **Authentication:** Required (Student role)

#### POST `/api/LessonNotes`
- **Method:** `POST`
- **Controller:** `LessonNotesController`
- **Action:** `CreateNote`
- **Description:** Create a new note for a lesson
- **Authentication:** Required (Student role)

#### PUT `/api/LessonNotes/{noteId}`
- **Method:** `PUT`
- **Controller:** `LessonNotesController`
- **Action:** `UpdateNote`
- **Description:** Update an existing note
- **Authentication:** Required (Student role, owner only)

#### DELETE `/api/LessonNotes/{noteId}`
- **Method:** `DELETE`
- **Controller:** `LessonNotesController`
- **Action:** `DeleteNote`
- **Description:** Delete a note
- **Authentication:** Required (Student role, owner only)

#### POST `/api/LessonNotes/{noteId}/favorite`
- **Method:** `POST`
- **Controller:** `LessonNotesController`
- **Action:** `ToggleFavorite`
- **Description:** Toggle favorite status of a note
- **Authentication:** Required (Student role, owner only)

#### GET `/api/LessonNotes/search`
- **Method:** `GET`
- **Controller:** `LessonNotesController`
- **Action:** `SearchNotes`
- **Description:** Search notes by keyword across all lessons
- **Authentication:** Required (Student role)

### B. Video Chapters Endpoints

#### GET `/api/VideoChapters/lesson/{lessonId}`
- **Method:** `GET`
- **Controller:** `VideoChaptersController`
- **Action:** `GetVideoChapters`
- **Description:** Get all chapters for a lesson's video with timestamps
- **Authentication:** Optional (public if lesson is accessible)

#### POST `/api/VideoChapters`
- **Method:** `POST`
- **Controller:** `VideoChaptersController`
- **Action:** `CreateChapter`
- **Description:** Create a new video chapter (Admin/Teacher only)
- **Authentication:** Required (Admin/Teacher role)

#### PUT `/api/VideoChapters/{chapterId}`
- **Method:** `PUT`
- **Controller:** `VideoChaptersController`
- **Action:** `UpdateChapter`
- **Description:** Update chapter details
- **Authentication:** Required (Admin/Teacher role)

#### DELETE `/api/VideoChapters/{chapterId}`
- **Method:** `DELETE`
- **Controller:** `VideoChaptersController`
- **Action:** `DeleteChapter`
- **Description:** Delete a video chapter
- **Authentication:** Required (Admin/Teacher role)

---

## 3. Suggested Backend Implementation

### A. LessonNotes Implementation

#### Model: `LessonNote.cs`
```csharp
public class LessonNote
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public int StudentId { get; set; }
    public string Content { get; set; } // Rich text content
    public int? VideoTimestamp { get; set; } // Optional timestamp in seconds
    public bool IsFavorite { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public virtual Lesson Lesson { get; set; }
    public virtual User Student { get; set; }
}
```

#### DTO: `LessonNoteDto.cs`
```csharp
public class LessonNoteDto
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public string LessonTitle { get; set; }
    public string Content { get; set; }
    public int? VideoTimestamp { get; set; }
    public bool IsFavorite { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateLessonNoteDto
{
    [Required]
    public int LessonId { get; set; }
    
    [Required]
    [StringLength(5000)]
    public string Content { get; set; }
    
    public int? VideoTimestamp { get; set; }
}

public class UpdateLessonNoteDto
{
    [Required]
    [StringLength(5000)]
    public string Content { get; set; }
    
    public int? VideoTimestamp { get; set; }
}
```

#### Controller: `LessonNotesController.cs`
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LessonNotesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public LessonNotesController(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet("lesson/{lessonId}")]
    public async Task<ActionResult<IEnumerable<LessonNoteDto>>> GetLessonNotes(int lessonId)
    {
        var studentId = GetCurrentStudentId();
        
        var notes = await _context.LessonNotes
            .Include(n => n.Lesson)
            .Where(n => n.LessonId == lessonId && n.StudentId == studentId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(_mapper.Map<IEnumerable<LessonNoteDto>>(notes));
    }

    [HttpPost]
    public async Task<ActionResult<LessonNoteDto>> CreateNote(CreateLessonNoteDto dto)
    {
        var studentId = GetCurrentStudentId();
        
        var note = new LessonNote
        {
            LessonId = dto.LessonId,
            StudentId = studentId,
            Content = dto.Content,
            VideoTimestamp = dto.VideoTimestamp,
            IsFavorite = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LessonNotes.Add(note);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLessonNotes), 
            new { lessonId = note.LessonId }, 
            _mapper.Map<LessonNoteDto>(note));
    }

    // Additional methods: UpdateNote, DeleteNote, ToggleFavorite, SearchNotes
}
```

### B. VideoChapters Implementation

#### Model: `VideoChapter.cs`
```csharp
public class VideoChapter
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public int Timestamp { get; set; } // In seconds
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation property
    public virtual Lesson Lesson { get; set; }
}
```

#### DTO: `VideoChapterDto.cs`
```csharp
public class VideoChapterDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public int Timestamp { get; set; }
    public string FormattedTime { get; set; } // e.g., "05:30"
}

public class CreateVideoChapterDto
{
    [Required]
    public int LessonId { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Title { get; set; }
    
    [StringLength(500)]
    public string Description { get; set; }
    
    [Required]
    public int Timestamp { get; set; }
    
    public int Order { get; set; }
}
```

#### Controller: `VideoChaptersController.cs`
```csharp
[ApiController]
[Route("api/[controller]")]
public class VideoChaptersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public VideoChaptersController(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet("lesson/{lessonId}")]
    public async Task<ActionResult<IEnumerable<VideoChapterDto>>> GetVideoChapters(int lessonId)
    {
        var chapters = await _context.VideoChapters
            .Where(c => c.LessonId == lessonId)
            .OrderBy(c => c.Order)
            .ThenBy(c => c.Timestamp)
            .ToListAsync();

        return Ok(_mapper.Map<IEnumerable<VideoChapterDto>>(chapters));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<VideoChapterDto>> CreateChapter(CreateVideoChapterDto dto)
    {
        var chapter = _mapper.Map<VideoChapter>(dto);
        chapter.CreatedAt = DateTime.UtcNow;

        _context.VideoChapters.Add(chapter);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetVideoChapters), 
            new { lessonId = chapter.LessonId }, 
            _mapper.Map<VideoChapterDto>(chapter));
    }

    // Additional methods: UpdateChapter, DeleteChapter
}
```

---

## 4. Database Impact

### New Tables Required:

#### `LessonNotes` Table
```sql
CREATE TABLE LessonNotes (
    Id INT PRIMARY KEY IDENTITY(1,1),
    LessonId INT NOT NULL,
    StudentId INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    VideoTimestamp INT NULL,
    IsFavorite BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NOT NULL,
    FOREIGN KEY (LessonId) REFERENCES Lessons(Id) ON DELETE CASCADE,
    FOREIGN KEY (StudentId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_LessonNotes_LessonId ON LessonNotes(LessonId);
CREATE INDEX IX_LessonNotes_StudentId ON LessonNotes(StudentId);
CREATE INDEX IX_LessonNotes_CreatedAt ON LessonNotes(CreatedAt DESC);
```

#### `VideoChapters` Table
```sql
CREATE TABLE VideoChapters (
    Id INT PRIMARY KEY IDENTITY(1,1),
    LessonId INT NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    Timestamp INT NOT NULL,
    [Order] INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL,
    FOREIGN KEY (LessonId) REFERENCES Lessons(Id) ON DELETE CASCADE
);

CREATE INDEX IX_VideoChapters_LessonId ON VideoChapters(LessonId);
CREATE INDEX IX_VideoChapters_Order ON VideoChapters([Order]);
```

---

## 5. Files to Modify or Create

### New Files:
- `Controllers/LessonNotesController.cs`
- `Controllers/VideoChaptersController.cs`
- `Models/LessonNote.cs`
- `Models/VideoChapter.cs`
- `DTOs/LessonNoteDto.cs`
- `DTOs/VideoChapterDto.cs`
- `Migrations/2025xxxx_AddLessonNotesAndVideoChapters.cs`

### Files to Modify:
- `Data/ApplicationDbContext.cs` (Add DbSets)
- `Profiles/MappingProfile.cs` (Add AutoMapper mappings)

---

## 6. Request and Response Examples

### A. Create Lesson Note

**Request:**
```http
POST /api/LessonNotes
Content-Type: application/json
Authorization: Bearer {token}

{
  "lessonId": 1,
  "content": "Important concept: Always remember to...",
  "videoTimestamp": 325
}
```

**Response:**
```json
{
  "id": 15,
  "lessonId": 1,
  "lessonTitle": "Lesson 1 - Week 1",
  "content": "Important concept: Always remember to...",
  "videoTimestamp": 325,
  "isFavorite": false,
  "createdAt": "2025-11-06T10:30:00Z",
  "updatedAt": "2025-11-06T10:30:00Z"
}
```

### B. Get Video Chapters

**Request:**
```http
GET /api/VideoChapters/lesson/1
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Introduction",
    "description": "Overview of the lesson topic",
    "timestamp": 0,
    "formattedTime": "00:00"
  },
  {
    "id": 2,
    "title": "Main Concept",
    "description": "Detailed explanation of key concepts",
    "timestamp": 180,
    "formattedTime": "03:00"
  },
  {
    "id": 3,
    "title": "Examples",
    "description": "Practical examples and applications",
    "timestamp": 420,
    "formattedTime": "07:00"
  }
]
```

---

## 7. Priority and Timeline

**Priority:** Medium
**Estimated Development Time:** 2-3 days
**Dependencies:** None

**Recommended Implementation Order:**
1. Video Chapters (Higher priority - affects all students)
2. Lesson Notes (Nice to have - personal feature)

---

## 8. Additional Notes

- Consider adding pagination for notes search
- Video chapters should be cached for performance
- Add validation to prevent duplicate timestamps
- Consider adding chapter thumbnails in future enhancement
- Notes should support rich text formatting (HTML sanitization required)

---

**Generated:** November 6, 2025
**Feature:** Lesson Detail Page - Notes & Video Chapters
**Status:** Awaiting Backend Implementation
