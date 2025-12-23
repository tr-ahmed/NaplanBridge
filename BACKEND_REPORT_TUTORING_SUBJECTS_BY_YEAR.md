📌 **BACKEND REPORT: Missing Subjects By Year Endpoint**

---

## 🔴 **Issue**

**Endpoint:** `GET /api/Subjects/by-year/{yearId}`  
**Status:** `404 Not Found`  
**Impact:** Cannot load subjects for students in Tutoring booking flow

---

## 📋 **Problem Description**

The frontend tutoring system now allows parents to select students with different academic years. Each student needs to see subjects specific to their year level.

**Current Flow:**
1. Parent selects students (each has their own `academicYearId`)
2. Step 3 tries to load subjects using `GET /api/Subjects/by-year/{yearId}`
3. **ERROR 404** - Endpoint doesn't exist

**Example Request:**
```
GET https://naplan2.runasp.net/api/Subjects/by-year/8
Response: 404 Not Found
```

---

## ✅ **Required Implementation**

### **1. Create New Endpoint**

**Controller:** `SubjectsController`  
**Method:** `GET /api/Subjects/by-year/{yearId}`

**Expected Response:**
```json
[
  {
    "id": 1,
    "yearId": 8,
    "subjectNameId": 5,
    "subjectName": "Mathematics",
    "categoryId": 2,
    "categoryName": "STEM",
    "categoryDescription": "Science, Technology, Engineering, Mathematics",
    "price": 100.00,
    "originalPrice": 100.00,
    "discountPercentage": 0,
    "posterUrl": "https://...",
    "level": "Intermediate",
    "duration": 60,
    "weekNumber": 1,
    "termNumber": 1,
    "studentCount": 0,
    "termIds": [1, 2],
    "weekIds": [1, 2, 3, 4]
  }
]
```

---

## 🛠️ **Implementation Details**

### **Backend Code (C# / .NET)**

```csharp
[HttpGet("by-year/{yearId}")]
[Authorize]
public async Task<ActionResult<IEnumerable<SubjectDto>>> GetSubjectsByYear(int yearId)
{
    try
    {
        var subjects = await _context.Subjects
            .Where(s => s.YearId == yearId && s.IsActive)
            .Include(s => s.SubjectName)
            .Include(s => s.Category)
            .Select(s => new SubjectDto
            {
                Id = s.Id,
                YearId = s.YearId,
                SubjectNameId = s.SubjectNameId,
                SubjectName = s.SubjectName.Name,
                CategoryId = s.Category.Id,
                CategoryName = s.Category.Name,
                CategoryDescription = s.Category.Description,
                Price = s.Price,
                OriginalPrice = s.OriginalPrice,
                DiscountPercentage = s.DiscountPercentage,
                PosterUrl = s.PosterUrl,
                Level = s.Level,
                Duration = s.Duration,
                WeekNumber = s.WeekNumber,
                TermNumber = s.TermNumber,
                StudentCount = s.StudentCount,
                TermIds = s.Terms.Select(t => t.Id).ToList(),
                WeekIds = s.Weeks.Select(w => w.Id).ToList()
            })
            .ToListAsync();

        return Ok(subjects);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error getting subjects for year {YearId}", yearId);
        return StatusCode(500, new { error = "Failed to retrieve subjects" });
    }
}
```

---

## 🔍 **Alternative Solution (If Endpoint Exists with Different Route)**

If the endpoint already exists but with a different route, please provide:
1. The correct route pattern
2. Any required query parameters
3. Expected response format

We will update the frontend accordingly.

---

## 📊 **Current Frontend Implementation**

**Service Method:**
```typescript
// content.service.ts
getSubjectsByYear(yearId: number): Observable<Subject[]> {
  return this.http.get<Subject[]>(`${this.apiUrl}/Subjects/by-year/${yearId}`);
}
```

**Usage in Tutoring Step 3:**
```typescript
// step3-subjects.component.ts
loadSubjects(): void {
  const uniqueYears = [...new Set(this.students.map(s => s.academicYearId))];
  
  uniqueYears.forEach(yearId => {
    this.contentService.getSubjectsByYear(yearId).subscribe({
      next: (subjects) => {
        this.subjectsByYear.set(yearId, subjects);
      },
      error: (error) => {
        console.error(`Error loading subjects for year ${yearId}:`, error);
      }
    });
  });
}
```

---

## 🎯 **Expected Behavior After Fix**

1. Parent selects students with different years (e.g., Year 7, Year 9)
2. Frontend calls:
   - `GET /api/Subjects/by-year/7`
   - `GET /api/Subjects/by-year/9`
3. Each student sees subjects appropriate for their year level
4. No more 404 errors

---

## ⚠️ **Priority**

**HIGH** - Blocks tutoring booking functionality completely.

---

## 📞 **Request**

Please implement this endpoint and confirm when ready. The frontend is already configured to use it.

**Expected Confirmation:**
```
✅ BACKEND FIX CONFIRMED
Endpoint: GET /api/Subjects/by-year/{yearId}
Status: Implemented and tested
```

---

**Report Generated:** December 23, 2025  
**Frontend Developer:** Ahmed Hamdi  
**Feature:** Tutoring System - Subject Selection by Year
