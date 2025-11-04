# ❓ Backend Inquiry Report

**Date:** November 4, 2025  
**Feature:** Lesson Resources Upload  
**Frontend Component:** `lesson-detail.component`  
**API Endpoint:** `POST /api/Resources`

---

## 1. Inquiry Topic

**500 Internal Server Error when uploading lesson resources via `POST /api/Resources`**

---

## 2. Reason for Inquiry

The frontend successfully sends a valid request to upload a lesson resource file, but the backend consistently returns a **500 Internal Server Error** with the following details:

```
POST https://naplan2.runasp.net/api/Resources?Title=aaaaaaaaaa&LessonId=36
Status: 500 (Internal Server Error)
```

**Error Details from Backend:**
```json
{
  "statusCode": 500,
  "message": "An internal server error occurred",
  "details": "Please contact support",
  "errors": null,
  "traceId": "c8ccccd2-9c13-4f8e-8c42-22b28d67b9f1"
}
```

### Frontend Request Structure (Confirmed via Swagger):

**Method:** `POST`  
**URL:** `/api/Resources`  
**Query Parameters:**
- `Title` (string, **required**): ✅ Sent correctly (e.g., "aaaaaaaaaa")
- `LessonId` (integer, optional): ✅ Sent correctly (e.g., 36)

**Request Body (multipart/form-data):**
- `File` (binary): ✅ Sent correctly as FormData

**Frontend Code (content.service.ts):**
```typescript
addLessonResource(lessonId: number, title: string, description: string, resourceType: string, file: File): Observable<any> {
  const formData = new FormData();
  formData.append('File', file);

  const params = new HttpParams()
    .set('Title', title)
    .set('LessonId', lessonId.toString());

  return this.http.post<any>(`${this.apiUrl}/Resources`, formData, { params });
}
```

### What Works:
- ✅ Request structure matches Swagger specification exactly
- ✅ File is appended to FormData correctly
- ✅ Query parameters are sent correctly
- ✅ Content-Type is automatically set to `multipart/form-data` by Angular HttpClient

### What Doesn't Work:
- ❌ Backend returns 500 error instead of processing the upload
- ❌ No validation error messages (suggests server-side exception)
- ❌ Error occurs consistently regardless of file type/size

---

## 3. Requested Details from Backend Team

### A. Error Investigation:
1. **What is causing the 500 error?**
   - Check backend logs for the trace ID: `c8ccccd2-9c13-4f8e-8c42-22b28d67b9f1`
   - Identify the exact exception being thrown
   - Is it a database issue, file system permission issue, or code bug?
   - Check if the Resources table exists and has proper schema
   - Verify file storage path has write permissions

2. **Is the file being received by the controller?**
   - Can you confirm the `IFormFile File` parameter is being populated?
   - Are there any middleware/filters interfering with multipart uploads?
   - Check if multipart form-data is being parsed correctly
   - Verify the parameter name is exactly `File` (case-sensitive)

3. **Is LessonId validation failing?**
   - Does LessonId=36 exist in the Lessons table?
   - Is there a foreign key constraint issue?
   - Is the LessonId parameter being received correctly?
   - Are there any validation attributes on the controller action?

4. **Database and Storage Issues:**
   - Check if Resources table has all required columns
   - Verify file storage service (local/blob) is configured
   - Check database connection string
   - Ensure no conflicting migrations

### B. API Clarifications:
1. **Expected Request Format:**
   - Confirm the exact multipart/form-data structure expected
   - Should the file parameter name be `File` or `file` (case-sensitive)?
   - Are there any additional hidden parameters not in Swagger?

2. **File Upload Requirements:**
   - What are the allowed file types? (PDF, DOC, DOCX, etc.)
   - What is the maximum file size limit?
   - Where are files stored? (local path, blob storage, etc.)
   - Are there any file validation rules?

3. **Response Schema:**
   - What does a successful `LessonResourceDetailsDto` response look like?
   - Example successful response JSON needed

### C. Backend Implementation Details:
1. **Controller Code:**
   - Can you share the `ResourcesController.cs` POST action implementation?
   - Are there any [Authorize] attributes or role requirements?
   - Is there dependency injection that might be failing?

2. **Database Schema:**
   - What is the `Resources` table structure?
   - Are there required fields not mentioned in Swagger?
   - Is there a relationship with `Lessons` table via `LessonId`?

3. **Error Handling:**
   - Why is the error message generic ("An internal server error occurred")?
   - Can more detailed validation messages be returned for debugging?

---

## 4. Suggested Temporary Workarounds (Frontend)

Until the backend issue is resolved, we recommend:

1. ✅ **Keep the current implementation** (it's correct according to Swagger)
2. ⚠️ **Add better error feedback** to users
3. 🔧 **Test with different file types/sizes** to isolate the issue
4. 📋 **Log full request details** for backend team analysis

---

## 5. Impact on Frontend Development

**Current Status:**
- ❌ Lesson detail page cannot upload resources
- ✅ All other features (questions, discussions) work correctly
- ⚠️ User experience is incomplete without resource upload

**Priority:** **HIGH**  
This is a critical feature for teachers to provide learning materials to students.

---

## 6. Files Affected (Frontend)

- `src/app/features/lesson-detail/lesson-detail.ts` (lines 322-361)
- `src/app/features/lesson-detail/lesson-detail.html` (lines 523-587)
- `src/app/core/services/content.service.ts` (lines 504-514)

---

## 7. Next Steps

1. **Backend Team:** Investigate the 500 error using trace ID
2. **Backend Team:** Provide detailed error logs/stack trace
3. **Backend Team:** Confirm or update Swagger documentation
4. **Frontend Team:** Await backend fix or clarification
5. **Both Teams:** Test the fix with various file types

---

**Report Status:** ⏳ Awaiting Backend Response  
**Frontend Implementation:** ✅ Complete and Ready  
**Backend Investigation:** ❓ Required

---

## 8. Possible Backend Solutions to Investigate

### Common Causes of 500 Errors in File Upload APIs:

#### 1. **Missing or Incorrect Controller Action Signature**
```csharp
// ❌ WRONG - File parameter name doesn't match
[HttpPost]
public async Task<IActionResult> UploadResource(
    [FromQuery] string Title,
    [FromQuery] int LessonId,
    IFormFile file)  // Should be "File" not "file"

// ✅ CORRECT
[HttpPost]
public async Task<IActionResult> UploadResource(
    [FromQuery] string Title,
    [FromQuery] int LessonId,
    IFormFile File)  // Matches FormData key
```

#### 2. **Database Constraints**
```csharp
// Check if:
- Resources table exists
- LessonId foreign key is properly configured
- Required columns are nullable or have default values
- No unique constraint violations
```

#### 3. **File Storage Configuration**
```csharp
// Verify:
- File upload path exists
- Directory has write permissions
- Disk space available
- File storage service is injected properly
```

#### 4. **Missing Service Registration**
```csharp
// In Program.cs or Startup.cs:
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
```

#### 5. **Null Reference Exceptions**
```csharp
// Common null checks needed:
if (File == null || File.Length == 0)
    return BadRequest("File is required");

var lesson = await _context.Lessons.FindAsync(LessonId);
if (lesson == null)
    return NotFound("Lesson not found");
```

---

*This report was auto-generated based on AI Backend Change Guidelines.*
