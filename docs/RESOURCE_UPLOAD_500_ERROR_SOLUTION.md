# Resource Upload 500 Error - Solution Guide

**Date:** November 11, 2025  
**Issue:** Backend 500 Internal Server Error when uploading resources  
**Status:** ⚠️ **BACKEND ISSUE** - Frontend implementation is correct

---

## 📋 Issue Summary

When trying to upload a resource file through the Lesson Management component, the backend returns a **500 Internal Server Error** despite the frontend sending a correctly formatted request according to the Swagger documentation.

### Error Details
```
POST https://naplan2.runasp.net/api/Resources?Title=aaaaaaaaaaaaa&LessonId=32
Status: 500 (Internal Server Error)

Response:
{
  "statusCode": 500,
  "message": "An internal server error occurred",
  "details": "Please contact support",
  "errors": null,
  "traceId": "44f42a06-588c-4c88-ac0b-2b877707f3e9"
}
```

---

## ✅ Frontend Implementation (Correct)

### 1. Service Layer (`content.service.ts`)
```typescript
addLessonResource(lessonId: number, title: string, description: string, resourceType: string, file: File): Observable<any> {
  const formData = new FormData();
  formData.append('File', file, file.name); // Correct: Capital 'F' matches backend
  
  const params = new HttpParams()
    .set('Title', title)               // ✅ Required parameter
    .set('LessonId', lessonId.toString()); // ✅ Correct format
  
  return this.http.post<any>(`${this.apiUrl}/Resources`, formData, { params });
}
```

### 2. Component Layer (`lesson-management.component.ts`)
```typescript
await this.contentService.addLessonResource(
  this.lessonId,
  this.resourceForm.title,
  this.resourceForm.description,
  this.resourceForm.resourceType,
  this.resourceForm.file
).toPromise();
```

### 3. Modal Form (HTML)
```html
<form (ngSubmit)="saveResource()">
  <input type="text" [(ngModel)]="resourceForm.title" name="title" required>
  <textarea [(ngModel)]="resourceForm.description" name="description"></textarea>
  <select [(ngModel)]="resourceForm.resourceType" name="resourceType"></select>
  <input type="file" (change)="onFileChange($event, 'resource')">
</form>
```

**Verification:** ✅ All requirements from Swagger specification are met:
- ✅ Title sent as query parameter (required)
- ✅ LessonId sent as query parameter
- ✅ File sent in multipart/form-data body
- ✅ Content-Type automatically set by Angular HttpClient
- ✅ File parameter named exactly "File" (capital F)

---

## ❌ Backend Issues to Investigate

### Possible Causes (Based on Similar 500 Errors)

#### 1. **Controller Parameter Mismatch**
```csharp
// ❌ WRONG - Parameter name doesn't match FormData key
[HttpPost]
public async Task<IActionResult> UploadResource(
    [FromQuery] string Title,
    [FromQuery] int LessonId,
    IFormFile file)  // Should be "File" not "file"

// ✅ CORRECT
[HttpPost]
public async Task<IActionResult> UploadResource(
    [FromQuery] string Title,
    [FromQuery] int? LessonId,
    IFormFile File)  // Must match FormData key exactly
```

#### 2. **Database Constraints**
- Resources table might not exist
- LessonId foreign key constraint might fail if lesson doesn't exist
- Required columns might be missing NULL values
- Unique constraint violations

#### 3. **File Storage Issues**
- Upload directory doesn't exist or lacks write permissions
- Disk space exhausted
- File storage service not properly injected
- Blob storage connection string missing/invalid

#### 4. **Missing Service Registration**
```csharp
// In Program.cs
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
```

#### 5. **Null Reference Exceptions**
```csharp
// Common missing null checks:
if (File == null || File.Length == 0)
    return BadRequest("File is required");

var lesson = await _context.Lessons.FindAsync(LessonId);
if (lesson == null)
    return NotFound($"Lesson with ID {LessonId} not found");
```

---

## 🔧 Recommended Backend Fixes

### Step 1: Add Logging to Controller
```csharp
[HttpPost]
public async Task<IActionResult> UploadResource(
    [FromQuery] string Title,
    [FromQuery] int? LessonId,
    IFormFile File)
{
    try
    {
        _logger.LogInformation($"Upload request - Title: {Title}, LessonId: {LessonId}, File: {File?.FileName}");
        
        // Validation
        if (string.IsNullOrWhiteSpace(Title))
            return BadRequest("Title is required");
        
        if (File == null || File.Length == 0)
            return BadRequest("File is required");
        
        if (LessonId.HasValue)
        {
            var lesson = await _context.Lessons.FindAsync(LessonId.Value);
            if (lesson == null)
                return NotFound($"Lesson with ID {LessonId} not found");
        }
        
        // File storage logic here...
        
        return Ok(result);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error uploading resource");
        return StatusCode(500, new { 
            message = "File upload failed", 
            details = ex.Message,
            stackTrace = ex.StackTrace // Remove in production
        });
    }
}
```

### Step 2: Verify Database Schema
```sql
-- Check if Resources table exists
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Resources';

-- Check table structure
SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Resources';

-- Verify lesson exists
SELECT * FROM Lessons WHERE Id = 32;
```

### Step 3: Check File Storage Configuration
```csharp
// appsettings.json
{
  "FileStorage": {
    "Type": "Local", // or "AzureBlob"
    "LocalPath": "wwwroot/uploads/resources",
    "MaxFileSize": 10485760, // 10MB
    "AllowedExtensions": [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"]
  }
}

// Ensure directory exists
if (!Directory.Exists(uploadPath))
    Directory.CreateDirectory(uploadPath);
```

---

## 🎯 Immediate Actions Required

### Backend Team:
1. ✅ **Check server logs** for trace ID: `44f42a06-588c-4c88-ac0b-2b877707f3e9`
2. ✅ **Verify LessonId=32** exists in database
3. ✅ **Test controller action** with Swagger UI or Postman
4. ✅ **Add detailed error logging** to identify exact exception
5. ✅ **Check file system permissions** on upload directory
6. ✅ **Verify Resources table schema** matches entity model

### Frontend Team:
- ✅ **No changes required** - implementation is correct
- ✅ **Enhanced error messaging** already implemented
- ✅ **Waiting for backend fix**

---

## 📝 Testing Checklist (After Backend Fix)

```markdown
### Backend Testing:
- [ ] Test with Swagger UI directly
- [ ] Test with valid LessonId
- [ ] Test with invalid LessonId
- [ ] Test without LessonId
- [ ] Test with various file types (PDF, DOC, DOCX, etc.)
- [ ] Test with large files (near size limit)
- [ ] Test with empty file
- [ ] Check file is saved correctly
- [ ] Verify database record is created
- [ ] Confirm file URL is accessible

### Frontend Testing:
- [ ] Upload PDF resource
- [ ] Upload Word document
- [ ] Upload image file
- [ ] Edit existing resource (change file)
- [ ] Edit resource (keep same file)
- [ ] Delete resource
- [ ] Verify file appears in resources list
- [ ] Test with multiple files sequentially
- [ ] Test error handling for invalid files
```

---

## 📊 API Specification (From Swagger)

### Endpoint
```
POST /api/Resources
```

### Parameters
| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| Title | query | string | ✅ Yes | Resource title |
| LessonId | query | integer | ❌ No | Associated lesson ID |
| File | body | binary | ✅ Yes | File to upload |

### Request Example
```http
POST /api/Resources?Title=My%20Resource&LessonId=32
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="File"; filename="document.pdf"
Content-Type: application/pdf

[Binary file content]
------WebKitFormBoundary--
```

### Success Response (200 OK)
```json
{
  "id": 123,
  "title": "My Resource",
  "fileUrl": "https://example.com/uploads/document.pdf",
  "lessonId": 32
}
```

---

## 🔗 Related Documentation

- **Backend Inquiry Report:** `reports/backend_inquiries/backend_inquiry_resources_upload_500_error_2025-11-04.md`
- **Swagger Specification:** `/api/Resources` POST endpoint
- **Frontend Service:** `src/app/core/services/content.service.ts` (lines 504-524)
- **Frontend Component:** `src/app/features/content-management/lesson-management.component.ts` (lines 380-431)
- **Modal UI:** `src/app/features/content-management/lesson-management.component.html` (lines 681-724)

---

## 💡 Workaround Options

Until the backend is fixed:

1. **Skip Resource Upload Feature**
   - Comment out resource upload functionality
   - Display "Coming Soon" message

2. **Use Alternative Endpoint** (if available)
   - Check if there's an alternative resources API
   - Verify with backend team

3. **Manual Backend Test**
   - Have backend team manually create test resources
   - Verify frontend can display them correctly

---

## 📞 Support Contacts

**Backend Team:** support@naplanbridge.com  
**Issue Type:** 500 Internal Server Error  
**Priority:** HIGH - Blocking critical feature  
**Trace IDs:** 
- `44f42a06-588c-4c88-ac0b-2b877707f3e9`
- `c8ccccd2-9c13-4f8e-8c42-22b28d67b9f1` (previous occurrence)

---

**Last Updated:** November 11, 2025  
**Status:** 🔴 Open - Awaiting Backend Fix  
**Frontend Status:** ✅ Complete and Correct
