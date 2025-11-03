# 🔧 Backend Change Report

**Date:** November 3, 2025  
**Feature:** Lessons API Pagination  
**Reporter:** AI Assistant  
**Priority:** Medium

---

## 1. Reason for Change

The current `GET /api/Lessons` endpoint returns **all lessons** without pagination, which can cause performance issues when:
- The database contains hundreds or thousands of lessons
- Frontend needs to display a paginated list (currently using client-side pagination)
- Network bandwidth is limited
- Initial page load time is slow due to large data transfer

**Current Implementation:**
```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<Lesson>>> GetLessons()
{
    return await _context.Lessons.ToListAsync();
}
```

This returns **all lessons** in a single request, which is inefficient for large datasets.

---

## 2. Required Endpoint Modification

### Current Endpoint
- **URL:** `GET /api/Lessons`
- **Returns:** `IEnumerable<Lesson>` (all lessons)
- **No pagination parameters**

### Modified Endpoint (Requested)
- **URL:** `GET /api/Lessons`
- **Method:** `GET`
- **Controller:** `LessonsController`
- **Action:** `GetLessons`
- **Query Parameters:**
  - `pageNumber` (int, optional, default: 1) - Current page number
  - `pageSize` (int, optional, default: 10) - Number of items per page
  - `searchTerm` (string, optional) - Search filter for lesson title/description
  - `weekId` (int, optional) - Filter by week
  - `subjectId` (int, optional) - Filter by subject
  - `termId` (int, optional) - Filter by term

**Returns:** Paginated result with metadata

---

## 3. Suggested Backend Implementation

### Step 1: Create a Paginated Result DTO

Create a new file: `DTOs/PaginatedResult.cs`

```csharp
namespace NaplanBridge.DTOs
{
    public class PaginatedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
        public bool HasPreviousPage => PageNumber > 1;
        public bool HasNextPage => PageNumber < TotalPages;
    }
}
```

### Step 2: Update LessonsController

Modify the `GetLessons` method in `Controllers/LessonsController.cs`:

```csharp
[HttpGet]
public async Task<ActionResult<PaginatedResult<LessonDetailsDto>>> GetLessons(
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] string? searchTerm = null,
    [FromQuery] int? weekId = null,
    [FromQuery] int? subjectId = null,
    [FromQuery] int? termId = null)
{
    // Validate pagination parameters
    if (pageNumber < 1) pageNumber = 1;
    if (pageSize < 1) pageSize = 10;
    if (pageSize > 100) pageSize = 100; // Max limit to prevent abuse

    // Build query
    var query = _context.Lessons
        .Include(l => l.Week)
        .Include(l => l.Subject)
        .Include(l => l.Resources)
        .AsQueryable();

    // Apply filters
    if (!string.IsNullOrWhiteSpace(searchTerm))
    {
        query = query.Where(l => 
            l.Title.Contains(searchTerm) || 
            l.Description.Contains(searchTerm));
    }

    if (weekId.HasValue)
    {
        query = query.Where(l => l.WeekId == weekId.Value);
    }

    if (subjectId.HasValue)
    {
        query = query.Where(l => l.SubjectId == subjectId.Value);
    }

    if (termId.HasValue)
    {
        query = query.Where(l => l.Week.TermId == termId.Value);
    }

    // Get total count before pagination
    var totalCount = await query.CountAsync();

    // Apply pagination
    var lessons = await query
        .OrderBy(l => l.OrderIndex)
        .ThenBy(l => l.CreatedAt)
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .Select(l => new LessonDetailsDto
        {
            Id = l.Id,
            Title = l.Title,
            Description = l.Description,
            VideoUrl = l.VideoUrl,
            Duration = l.Duration,
            OrderIndex = l.OrderIndex,
            IsPublished = l.IsPublished,
            WeekId = l.WeekId,
            WeekNumber = l.Week != null ? l.Week.WeekNumber : 0,
            SubjectId = l.SubjectId,
            SubjectName = l.Subject != null ? l.Subject.SubjectName : "",
            ResourceCount = l.Resources != null ? l.Resources.Count : 0,
            CreatedAt = l.CreatedAt
        })
        .ToListAsync();

    var result = new PaginatedResult<LessonDetailsDto>
    {
        Items = lessons,
        TotalCount = totalCount,
        PageNumber = pageNumber,
        PageSize = pageSize
    };

    return Ok(result);
}
```

### Step 3: Update Swagger Documentation

Add XML documentation to the endpoint:

```csharp
/// <summary>
/// Get paginated list of lessons with optional filters
/// </summary>
/// <param name="pageNumber">Page number (default: 1)</param>
/// <param name="pageSize">Items per page (default: 10, max: 100)</param>
/// <param name="searchTerm">Search in title and description</param>
/// <param name="weekId">Filter by week ID</param>
/// <param name="subjectId">Filter by subject ID</param>
/// <param name="termId">Filter by term ID</param>
/// <returns>Paginated list of lessons</returns>
[HttpGet]
[ProducesResponseType(typeof(PaginatedResult<LessonDetailsDto>), 200)]
public async Task<ActionResult<PaginatedResult<LessonDetailsDto>>> GetLessons(...)
```

---

## 4. Database Impact

**No database changes required** - This is a query optimization only.

---

## 5. Files to Modify or Create

### Files to Create:
1. `DTOs/PaginatedResult.cs` - Generic pagination wrapper

### Files to Modify:
1. `Controllers/LessonsController.cs` - Update `GetLessons` action
2. `Program.cs` or `Startup.cs` - No changes needed (if already configured)
3. Swagger XML documentation - Add parameter descriptions

---

## 6. Request and Response Examples

### Request Example 1: Basic Pagination

```http
GET /api/Lessons?pageNumber=1&pageSize=10
Authorization: Bearer {token}
```

### Request Example 2: With Filters

```http
GET /api/Lessons?pageNumber=2&pageSize=20&searchTerm=algebra&subjectId=5
Authorization: Bearer {token}
```

### Request Example 3: Filter by Week

```http
GET /api/Lessons?weekId=12&pageNumber=1&pageSize=5
Authorization: Bearer {token}
```

### Response Example (Success - 200 OK)

```json
{
  "items": [
    {
      "id": 101,
      "title": "Introduction to Algebra",
      "description": "Basic algebraic concepts and operations",
      "videoUrl": "https://cdn.example.com/videos/algebra-intro.mp4",
      "duration": 45,
      "orderIndex": 1,
      "isPublished": true,
      "weekId": 12,
      "weekNumber": 3,
      "subjectId": 5,
      "subjectName": "Mathematics",
      "resourceCount": 3,
      "createdAt": "2025-10-15T10:30:00Z"
    },
    {
      "id": 102,
      "title": "Solving Linear Equations",
      "description": "Learn how to solve linear equations step by step",
      "videoUrl": "https://cdn.example.com/videos/linear-equations.mp4",
      "duration": 50,
      "orderIndex": 2,
      "isPublished": true,
      "weekId": 12,
      "weekNumber": 3,
      "subjectId": 5,
      "subjectName": "Mathematics",
      "resourceCount": 5,
      "createdAt": "2025-10-16T14:20:00Z"
    }
  ],
  "totalCount": 156,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 16,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

---

## 7. Frontend Impact

### Current Frontend Code (content-management.ts)
The frontend currently loads all lessons:

```typescript
async loadLessons(): Promise<void> {
  try {
    this.lessons = (await this.contentService.getLessons().toPromise()) || [];
  } catch (error) {
    console.error('Error loading lessons:', error);
    throw error;
  }
}
```

### Required Frontend Changes

#### Update ContentService (content.service.ts)

```typescript
getLessons(
  pageNumber: number = 1, 
  pageSize: number = 10,
  filters?: {
    searchTerm?: string;
    weekId?: number;
    subjectId?: number;
    termId?: number;
  }
): Observable<PaginatedResult<Lesson>> {
  let params = new HttpParams()
    .set('pageNumber', pageNumber.toString())
    .set('pageSize', pageSize.toString());

  if (filters?.searchTerm) {
    params = params.set('searchTerm', filters.searchTerm);
  }
  if (filters?.weekId) {
    params = params.set('weekId', filters.weekId.toString());
  }
  if (filters?.subjectId) {
    params = params.set('subjectId', filters.subjectId.toString());
  }
  if (filters?.termId) {
    params = params.set('termId', filters.termId.toString());
  }

  return this.http.get<PaginatedResult<Lesson>>(`${this.apiUrl}/Lessons`, { params });
}
```

#### Add PaginatedResult Interface

```typescript
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

#### Update Component to Use Server Pagination

```typescript
async loadLessons(): Promise<void> {
  try {
    const result = await this.contentService.getLessons(
      this.lessonPage, 
      this.pageSize,
      {
        searchTerm: this.searchTerm,
        weekId: this.filters.weekId,
        subjectId: this.filters.subjectId,
        termId: this.filters.termId
      }
    ).toPromise();
    
    if (result) {
      this.lessons = result.items;
      this.lessonTotalPages = result.totalPages;
      this.filteredLessons = result.items; // Server already filtered
    }
  } catch (error) {
    console.error('Error loading lessons:', error);
    throw error;
  }
}
```

---

## 8. Testing Checklist

- [ ] Test pagination with different page numbers
- [ ] Test pagination with different page sizes
- [ ] Test with pageSize > 100 (should limit to 100)
- [ ] Test with pageNumber < 1 (should default to 1)
- [ ] Test search filter functionality
- [ ] Test weekId filter
- [ ] Test subjectId filter
- [ ] Test termId filter
- [ ] Test combined filters
- [ ] Verify totalCount accuracy
- [ ] Verify hasNextPage and hasPreviousPage flags
- [ ] Test with empty result set
- [ ] Test performance with large dataset (1000+ lessons)
- [ ] Verify frontend pagination integration

---

## 9. Performance Benefits

### Before (No Pagination)
- **Database:** Fetches ALL lessons + includes (could be 1000s)
- **Network:** Transfers entire dataset (could be several MB)
- **Frontend:** Must handle and filter all data client-side
- **Load Time:** Slow initial page load

### After (With Pagination)
- **Database:** Fetches only requested page (e.g., 10-20 items)
- **Network:** Transfers only current page (KB instead of MB)
- **Frontend:** Renders only current page data
- **Load Time:** Fast initial load, smooth navigation

**Estimated Improvement:**
- 90%+ reduction in data transfer
- 85%+ faster initial load time
- Scalable for thousands of lessons

---

## 10. Backward Compatibility Considerations

### Option 1: Keep Old Endpoint (Recommended)
Create a new endpoint `/api/Lessons/all` for the old behavior:

```csharp
[HttpGet("all")]
public async Task<ActionResult<IEnumerable<Lesson>>> GetAllLessons()
{
    return await _context.Lessons.ToListAsync();
}
```

### Option 2: Make Pagination Optional
Allow very large pageSize to simulate "get all":

```csharp
if (pageSize == int.MaxValue) 
{
    // Return all without pagination
}
```

**Recommendation:** Implement Option 1 to maintain backward compatibility while encouraging pagination usage.

---

## 11. Additional Recommendations

1. **Add Caching:** Consider adding response caching for frequently accessed pages
2. **Add Sorting:** Add `sortBy` and `sortOrder` parameters
3. **Add Index:** Ensure database has indexes on `WeekId`, `SubjectId`, `OrderIndex`, `CreatedAt`
4. **Rate Limiting:** Consider rate limiting to prevent API abuse
5. **ETag Support:** Implement ETag headers for client-side caching

---

## 12. Timeline Estimate

- **Backend Implementation:** 2-3 hours
- **Testing:** 1-2 hours
- **Frontend Integration:** 2-3 hours
- **Total:** ~6-8 hours

---

## ✅ Next Steps

1. **Backend Team:** Implement the changes in `LessonsController.cs`
2. **Backend Team:** Create and test `PaginatedResult<T>` DTO
3. **Backend Team:** Update Swagger documentation
4. **Backend Team:** Deploy to staging environment
5. **Frontend Team:** Update `ContentService` to use new pagination
6. **Frontend Team:** Update component to handle paginated response
7. **QA Team:** Test all scenarios in testing checklist
8. **DevOps:** Deploy to production after successful testing

---

**Report Generated By:** AI Assistant  
**Report Location:** `/reports/backend_changes/backend_change_lessons_pagination_2025-11-03.md`
