# Backend 500 Error - Debugging Guide

## Error Details
- **Status**: 500 Internal Server Error
- **Trace ID**: `78900f38-9cf8-453d-b25f-cfa6197dfd47`
- **Endpoint**: `POST /api/Subjects`
- **Message**: "An internal server error occurred"

## Data Being Sent (VALID)
```json
{
  "yearId": 1,
  "yearNumber": 7,
  "subjectNameId": 1,
  "subjectName": "Algebra",
  "originalPrice": 111,
  "discountPercentage": 10,
  "level": "Beginner",
  "duration": 1,
  "teacherId": 2,
  "startDate": "2025-11-03",
  "posterFile": "[File uploaded]"
}
```

## ✅ Frontend Status: WORKING CORRECTLY
The frontend is sending all required data in the correct format according to swagger.json.

## ❌ Backend Status: ERROR
The backend is returning a 500 error - this is a **BACKEND ISSUE**.

---

## 🔍 How to Debug on Backend

### Step 1: Check Backend Logs
Look for trace ID: `78900f38-9cf8-453d-b25f-cfa6197dfd47`

The logs should show:
- Exception type
- Stack trace
- Inner exception details
- Exact line where error occurred

### Step 2: Common Causes of 500 Error

#### A. Foreign Key Constraint Violation
**Check if these records exist in your database:**

```sql
-- Check if Year with ID 1 exists
SELECT * FROM Years WHERE Id = 1;

-- Check if SubjectName with ID 1 exists
SELECT * FROM SubjectNames WHERE Id = 1;

-- Check if Teacher (User) with ID 2 exists
SELECT * FROM AspNetUsers WHERE Id = 2;

-- Check if Teacher has the "Teacher" role
SELECT * FROM AspNetUserRoles WHERE UserId = 2;
SELECT * FROM AspNetRoles WHERE Id IN (SELECT RoleId FROM AspNetUserRoles WHERE UserId = 2);
```

#### B. Duplicate Subject
**Check if subject already exists:**

```sql
-- Check for duplicate subject
SELECT * FROM Subjects 
WHERE YearId = 1 
  AND SubjectNameId = 1;
```

If a unique constraint exists on `(YearId, SubjectNameId)`, this would cause a 500 error.

#### C. File Upload Issue
**Check backend controller code:**
- Does the server have write permissions to save files?
- Is the file path configured correctly?
- Is there enough disk space?
- Is the uploaded file being validated correctly?

#### D. Database Connection
- Check if database is accessible
- Check connection string
- Check if database user has INSERT permissions

#### E. Null Reference Exception
- Check if all navigation properties are properly configured
- Check if AutoMapper is configured correctly
- Check if any required fields are null

---

## 🛠️ Backend Code to Check

### 1. Subject Controller
Look at your `SubjectsController.cs` POST method:

```csharp
[HttpPost]
public async Task<ActionResult<SubjectDto>> CreateSubject(
    [FromQuery] int YearId,
    [FromQuery] int SubjectNameId,
    [FromQuery] decimal OriginalPrice,
    [FromQuery] decimal DiscountPercentage,
    [FromQuery] string Level,
    [FromQuery] int Duration,
    [FromQuery] int TeacherId,
    [FromQuery] DateTime StartDate,
    [FromForm] IFormFile PosterFile)
{
    try 
    {
        // Check if Year exists
        var year = await _context.Years.FindAsync(YearId);
        if (year == null) throw new NotFoundException("Year not found");
        
        // Check if SubjectName exists
        var subjectName = await _context.SubjectNames.FindAsync(SubjectNameId);
        if (subjectName == null) throw new NotFoundException("SubjectName not found");
        
        // Check if Teacher exists
        var teacher = await _context.Users.FindAsync(TeacherId);
        if (teacher == null) throw new NotFoundException("Teacher not found");
        
        // Save poster file
        var posterUrl = await SaveFile(PosterFile, "posters");
        
        // Create subject
        var subject = new Subject
        {
            YearId = YearId,
            SubjectNameId = SubjectNameId,
            OriginalPrice = OriginalPrice,
            DiscountPercentage = DiscountPercentage,
            Level = Level,
            Duration = Duration,
            TeacherId = TeacherId,
            StartDate = StartDate,
            PosterUrl = posterUrl
        };
        
        _context.Subjects.Add(subject);
        await _context.SaveChangesAsync();
        
        return Ok(subject);
    }
    catch (Exception ex)
    {
        // Log the full exception
        _logger.LogError(ex, "Error creating subject");
        throw;
    }
}
```

### 2. Check File Upload Service
```csharp
private async Task<string> SaveFile(IFormFile file, string folder)
{
    try
    {
        // Check if file is null
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is required");
        
        // Check file size
        if (file.Length > 10 * 1024 * 1024) // 10MB
            throw new ArgumentException("File too large");
        
        // Create directory if not exists
        var uploadPath = Path.Combine(_webHostEnvironment.WebRootPath, folder);
        if (!Directory.Exists(uploadPath))
            Directory.CreateDirectory(uploadPath);
        
        // Generate unique filename
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadPath, fileName);
        
        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }
        
        return $"/{folder}/{fileName}";
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error saving file");
        throw;
    }
}
```

---

## 🎯 Quick Fixes to Try

### Fix 1: Verify Database Records
Run these SQL commands to verify data exists:

```sql
-- Insert test Year if not exists
IF NOT EXISTS (SELECT 1 FROM Years WHERE Id = 1)
    INSERT INTO Years (YearNumber) VALUES (7);

-- Insert test SubjectName if not exists
IF NOT EXISTS (SELECT 1 FROM SubjectNames WHERE Id = 1)
    INSERT INTO SubjectNames (Name, CategoryId) VALUES ('Algebra', 1);

-- Verify Teacher exists
SELECT * FROM AspNetUsers WHERE Id = 2;
```

### Fix 2: Add Better Logging
In your backend, add detailed logging:

```csharp
[HttpPost]
public async Task<ActionResult<SubjectDto>> CreateSubject(...)
{
    _logger.LogInformation("Creating subject with YearId: {YearId}, SubjectNameId: {SubjectNameId}, TeacherId: {TeacherId}", 
        YearId, SubjectNameId, TeacherId);
    
    try 
    {
        // Your code here
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "FULL ERROR creating subject: {Message}. Inner: {InnerException}", 
            ex.Message, ex.InnerException?.Message);
        
        // Return detailed error in development
        if (_env.IsDevelopment())
        {
            return StatusCode(500, new 
            { 
                message = ex.Message, 
                innerMessage = ex.InnerException?.Message,
                stackTrace = ex.StackTrace
            });
        }
        
        throw;
    }
}
```

### Fix 3: Check Database Constraints
```sql
-- Check all constraints on Subjects table
SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_NAME = 'Subjects';

-- Check foreign keys
SELECT * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
WHERE CONSTRAINT_NAME IN (
    SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_NAME = 'Subjects'
);
```

---

## 📊 Test Using Swagger/Postman

Try the same request using Swagger UI or Postman:

**URL**: `POST https://naplan2.runasp.net/api/Subjects`

**Query Parameters**:
- YearId: 1
- SubjectNameId: 1
- OriginalPrice: 111
- DiscountPercentage: 10
- Level: Beginner
- Duration: 1
- TeacherId: 2
- StartDate: 2025-11-03

**Body** (multipart/form-data):
- PosterFile: [Upload any image file]

This will help you see the raw error response.

---

## ✅ Once Fixed

After fixing the backend issue:

1. Restart your backend server
2. Try creating the subject again from the frontend
3. The frontend will automatically handle the success response
4. Subject will be added to the list

---

## 📝 Summary

- ✅ **Frontend**: Working perfectly
- ❌ **Backend**: Has a 500 error
- 🔍 **Action**: Check backend logs with trace ID `78900f38-9cf8-453d-b25f-cfa6197dfd47`
- 🎯 **Most Likely Issue**: Missing database records (Year, SubjectName, or Teacher)

**No frontend changes needed!**
