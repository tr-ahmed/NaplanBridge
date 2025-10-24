# ?? Term-Level Data Structure - Complete Guide

## ?? ???? ????

?? ????? ???? ?????? ??? ????? **Term** ??? ????? ??? ???? ??:
- ? ????? ?????? ??? Term
- ? ??? Poster ?????? ??? Term
- ? ?????? ??????? ??? Term
- ? ?????? ??????? ??? Term (Description, Duration, etc.)

---

## ??? ?????? ???????

### ??? ??????? ?
```
Subject: "Algebra Year 7"
??? Price: 99.99 (??? ???? ?????? ????)
??? PosterUrl: "algebra.jpg" (???? ????? ?????? ????)
??? Terms
    ??? Term 1
    ??? Term 2
    ??? Term 3
    ??? Term 4
```

### ??? ??????? ?
```
Subject: "Algebra Year 7"
??? DefaultPrice: 99.99 (??? ?????? ?????)
??? DefaultPoster: "algebra-main.jpg"
??? Terms
    ??? Term 1
    ?   ??? Price: 29.99
    ?   ??? PosterUrl: "algebra-term1.jpg"
    ?   ??? Description: "Introduction to Algebra"
    ?   ??? DurationHours: 40
    ?   ??? Instructors: [Teacher1 (Primary), Teacher3 (Assistant)]
    ??? Term 2
    ?   ??? Price: 31.99
    ?   ??? PosterUrl: "algebra-term2.jpg"
    ?   ??? Instructors: [Teacher1 (Primary)]
    ??? Term 3
    ? ??? Price: 33.99
    ?   ??? PosterUrl: "algebra-term3.jpg"
    ?   ??? Instructors: [Teacher2 (Primary), Teacher3 (Assistant)]
    ??? Term 4
        ??? Price: 35.99
        ??? PosterUrl: "algebra-term4.jpg"
     ??? Instructors: [Teacher2 (Primary)]
```

---

## ?? Term Entity - ?????? ???????

### ?????? ???????

```csharp
public class Term
{
    // Existing fields
    public int Id { get; set; }
    public int TermNumber { get; set; }
    public DateOnly? StartDate { get; set; }
    public int SubjectId { get; set; }

    // ?? NEW FIELDS

    /// <summary>
    /// ??? ???????? ?? ??? Term (??????? - ??? ?? ??? ??????? ?????? ??? ??????)
    /// </summary>
    public decimal? Price { get; set; }

    /// <summary>
    /// ????? ?????? ??? ????? (???????)
    /// </summary>
    public decimal? OriginalPrice { get; set; }

    /// <summary>
  /// ???? ????? (???????)
    /// </summary>
    public int? DiscountPercentage { get; set; }

    /// <summary>
    /// ???? ??? Poster ?????? ???? Term (???????)
    /// </summary>
    public string? PosterUrl { get; set; }

    /// <summary>
    /// Public ID ?????? ?? Cloudinary (???????)
    /// </summary>
  public string? PosterPublicId { get; set; }

    /// <summary>
    /// ??? ??? Term (???????)
/// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// ??? Term ???????? (???????)
    /// </summary>
public int? DurationHours { get; set; }

/// <summary>
    /// ???????? ????????? ?? ????? ??? Term
    /// </summary>
    public ICollection<TermInstructor> TermInstructors { get; set; } = [];
}
```

---

## ?? TermInstructor Entity - ???? ?????

```csharp
/// <summary>
/// ???? ??? ??? Term ????????? (Many-to-Many)
/// </summary>
public class TermInstructor
{
    public int TermId { get; set; }
    public Term? Term { get; set; }

    public int InstructorId { get; set; }
    public User? Instructor { get; set; }

    /// <summary>
    /// ?? ??? ?????? ?? ?????? ??????? ???? Term
    /// </summary>
    public bool IsPrimary { get; set; }

    /// <summary>
    /// ????? ????? ??????
    /// </summary>
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
```

---

## ?? Database Schema

### Term Table (Updated)
```sql
CREATE TABLE Terms (
    Id INT PRIMARY KEY IDENTITY,
    TermNumber INT NOT NULL,
    SubjectId INT NOT NULL,
StartDate DATE,
    
    -- ?? NEW COLUMNS
    Price DECIMAL(10, 2),
    OriginalPrice DECIMAL(10, 2),
    DiscountPercentage INT,
    PosterUrl NVARCHAR(MAX),
    PosterPublicId NVARCHAR(MAX),
    Description NVARCHAR(MAX),
    DurationHours INT,
 
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id)
);
```

### TermInstructors Table (New)
```sql
CREATE TABLE TermInstructors (
    TermId INT NOT NULL,
    InstructorId INT NOT NULL,
    IsPrimary BIT NOT NULL DEFAULT 0,
    AssignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    PRIMARY KEY (TermId, InstructorId),
    FOREIGN KEY (TermId) REFERENCES Terms(Id) ON DELETE CASCADE,
    FOREIGN KEY (InstructorId) REFERENCES AspNetUsers(Id)
);
```

---

## ?? Seeds Data

### Term Seeds (Updated)
```csharp
// ?? ???? ??? 4 Terms ?? ?????? ????? ??? Term
for (int i = 1; i <= 4; i++)
{
    terms.Add(new Term
    {
  SubjectId = subject.Id,
 TermNumber = i,
        StartDate = new DateOnly(2025, (i - 1) * 3 + 1, 1),
  
  // ????? ????? ????????
        Price = 29.99m + (i * 2), // 29.99, 31.99, 33.99, 35.99
        OriginalPrice = 39.99m + (i * 2), // 39.99, 41.99, 43.99, 45.99
     DiscountPercentage = 25,
        
      // ???? ????? ??? Term
      PosterUrl = $"https://res.cloudinary.com/.../term-{i}.jpg",
        PosterPublicId = $"term-poster-{subject.Id}-{i}",
        
        // ??????? ??????
Description = $"Term {i} covers advanced topics in the subject",
   DurationHours = 40 + (i * 5) // 40, 45, 50, 55 hours
  });
}
```

### TermInstructor Seeds
```csharp
// Teacher 1 ???? Term 1 & 2 (Primary Instructor)
termInstructors.Add(new TermInstructor
{
    TermId = algebraTerms[0].Id, // Term 1
    InstructorId = teacher1.Id,
    IsPrimary = true
});

// Teacher 3 ?????? ?? Term 1
termInstructors.Add(new TermInstructor
{
    TermId = algebraTerms[0].Id, // Term 1
    InstructorId = teacher3.Id,
    IsPrimary = false // Assistant
});
```

---

## ?? Use Cases

### 1. ?????? ??? ??????? Term ?? Instructors

```csharp
var term = await context.Terms
    .Include(t => t.TermInstructors)
        .ThenInclude(ti => ti.Instructor)
.FirstAsync(t => t.Id == termId);

// Primary Instructor
var primaryInstructor = term.TermInstructors
    .Where(ti => ti.IsPrimary)
    .Select(ti => ti.Instructor)
    .FirstOrDefault();

// All Instructors
var allInstructors = term.TermInstructors
    .Select(ti => new
    {
        ti.Instructor.UserName,
        ti.Instructor.Email,
        ti.IsPrimary,
        Role = ti.IsPrimary ? "Primary" : "Assistant"
    })
    .ToList();
```

### 2. ?????? ??? Terms ????? ?? ???????

```csharp
var subjectTerms = await context.Terms
    .Where(t => t.SubjectId == subjectId)
    .Select(t => new
    {
        t.Id,
        t.TermNumber,
     t.Price,
  t.OriginalPrice,
  t.DiscountPercentage,
        t.PosterUrl,
    t.Description,
      t.DurationHours,
  InstructorCount = t.TermInstructors.Count,
        PrimaryInstructor = t.TermInstructors
     .Where(ti => ti.IsPrimary)
      .Select(ti => ti.Instructor.UserName)
   .FirstOrDefault()
 })
    .ToListAsync();
```

### 3. ?????? ??? ???? Terms ???? ?????? ????

```csharp
var teacherTerms = await context.TermInstructors
    .Where(ti => ti.InstructorId == teacherId)
  .Include(ti => ti.Term)
        .ThenInclude(t => t.Subject)
            .ThenInclude(s => s.SubjectName)
    .Select(ti => new
    {
     ti.Term.Id,
   ti.Term.TermNumber,
        SubjectName = ti.Term.Subject.SubjectName.Name,
        ti.IsPrimary,
 Role = ti.IsPrimary ? "Primary Instructor" : "Assistant",
        ti.Term.StartDate,
        ti.Term.DurationHours
    })
    .ToListAsync();
```

### 4. ??? ????? Term ?? Frontend

```typescript
interface TermCard {
  id: number;
  termNumber: number;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  posterUrl: string;
  description: string;
  durationHours: number;
  primaryInstructor: {
    name: string;
 email: string;
  };
  assistantInstructors: string[];
}

// API Response
{
  "id": 1,
  "termNumber": 1,
  "price": 29.99,
  "originalPrice": 39.99,
  "discountPercentage": 25,
  "posterUrl": "https://res.cloudinary.com/.../term-1.jpg",
  "description": "Term 1 covers introduction to Algebra",
  "durationHours": 40,
  "primaryInstructor": {
    "name": "John Smith",
    "email": "john.smith@naplan.edu"
  },
  "assistantInstructors": ["Mike Brown"]
}
```

---

## ?? Frontend Implementation

### Term Card Component

```typescript
<div class="term-card">
  <!-- Poster -->
  <img [src]="term.posterUrl" alt="Term {{term.termNumber}}">
  
  <!-- Badge -->
  <div class="term-badge">Term {{term.termNumber}}</div>
  
  <!-- Price -->
  <div class="price-section">
    <span class="original-price">${{term.originalPrice}}</span>
    <span class="current-price">${{term.price}}</span>
    <span class="discount">{{term.discountPercentage}}% OFF</span>
  </div>
  
  <!-- Description -->
  <p class="description">{{term.description}}</p>
  
  <!-- Duration -->
  <div class="duration">
    <i class="clock-icon"></i>
    {{term.durationHours}} Hours
  </div>
  
  <!-- Primary Instructor -->
  <div class="instructor">
 <img [src]="term.primaryInstructor.avatar" alt="Instructor">
    <div>
      <p class="instructor-name">{{term.primaryInstructor.name}}</p>
      <p class="instructor-role">Primary Instructor</p>
    </div>
  </div>
  
  <!-- Assistant Instructors (if any) -->
  <div class="assistants" *ngIf="term.assistantInstructors.length > 0">
    <p>Assistants:</p>
    <span *ngFor="let assistant of term.assistantInstructors">
      {{assistant}}
    </span>
  </div>
  
  <!-- CTA -->
  <button (click)="subscribeTerm(term.id)">
 Subscribe to Term {{term.termNumber}}
  </button>
</div>
```

---

## ?? API Endpoints (Suggested)

### 1. Get Term Details
```http
GET /api/terms/{termId}
```

**Response:**
```json
{
  "id": 1,
  "termNumber": 1,
  "subjectName": "Algebra",
  "yearNumber": 7,
  "price": 29.99,
  "originalPrice": 39.99,
  "discountPercentage": 25,
  "posterUrl": "https://...",
  "description": "Term 1 covers...",
  "durationHours": 40,
  "startDate": "2025-01-01",
  "instructors": [
    {
      "id": 1,
      "name": "John Smith",
      "email": "john.smith@naplan.edu",
      "isPrimary": true,
   "avatar": "https://..."
    },
  {
      "id": 3,
    "name": "Mike Brown",
      "email": "mike.brown@naplan.edu",
      "isPrimary": false,
      "avatar": "https://..."
    }
  ],
  "weeksCount": 12,
  "lessonsCount": 36
}
```

### 2. Get All Terms for Subject
```http
GET /api/subjects/{subjectId}/terms
```

**Response:**
```json
[
  {
  "id": 1,
  "termNumber": 1,
    "price": 29.99,
    "originalPrice": 39.99,
    "discountPercentage": 25,
 "posterUrl": "https://...",
    "primaryInstructor": "John Smith"
  },
  {
    "id": 2,
    "termNumber": 2,
    "price": 31.99,
    "originalPrice": 41.99,
    "discountPercentage": 25,
    "posterUrl": "https://...",
    "primaryInstructor": "John Smith"
  }
]
```

### 3. Get Terms for Teacher
```http
GET /api/teachers/{teacherId}/terms
```

**Response:**
```json
[
  {
    "termId": 1,
    "termNumber": 1,
    "subjectName": "Algebra Year 7",
    "role": "Primary Instructor",
    "startDate": "2025-01-01",
    "studentsCount": 25
  },
  {
    "termId": 2,
    "termNumber": 2,
    "subjectName": "Algebra Year 7",
    "role": "Primary Instructor",
    "startDate": "2025-04-01",
    "studentsCount": 28
  }
]
```

---

## ?? Migration

```bash
# ????? Migration
cd API
dotnet ef migrations add AddTermLevelDataAndInstructors

# ????? Migration
dotnet ef database update

# ????? ??????? (Seeds ????? ????????)
dotnet run
```

---

## ? Benefits

### 1. Flexibility (?????)
- ????? ?????? ??? Term ??? ??????? ????????
- ??? ????? ??? Term ??????? ??????

### 2. Teacher Management (????? ????????)
- ???? ????? + ?????? ??????? ??? Term
- ????? ???? ?? ???? ????

### 3. Marketing (?????)
- ??? ?? Term ???? ?????
- ?????? ?????? ??? Term

### 4. Student Experience (????? ??????)
- ????? ?????? ??? ????????
- ??????? ????? ?? ????? ?? Term

---

## ?? ????? ??? ???

| ??? | ????? |
|-----|-------|
| `API/Entities/Term.cs` | Term Entity ??????? |
| `API/Entities/TermInstructor.cs` | ???? ????? ?????? |
| `API/Data/DataContext.cs` | DbSet ????????? |
| `API/Data/SeedData.cs` | ???????? ????????? |
| `API/Migrations/...AddTermLevelDataAndInstructors.cs` | Migration |

---

**Version**: 1.0  
**Date**: 2025-01-24  
**Status**: ? Implemented & Ready
