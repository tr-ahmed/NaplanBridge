# ❓ Backend Inquiry Report

**Date**: November 21, 2025  
**Topic**: Exam Creation/Update Permission Validation  
**Priority**: 🔴 **CRITICAL SECURITY ISSUE**  
**Impact**: High - Security vulnerability allowing unauthorized exam creation

---

## 1. Inquiry Topic

**Verify and implement server-side permission validation for Exam Creation/Update endpoints**

We need clarification and implementation of permission checks on the backend API to prevent teachers from creating or modifying exams for subjects they don't have permission to access.

---

## 2. Reason for Inquiry

### Current Situation:
- The frontend now implements permission-based filtering (subjects dropdown shows only authorized subjects)
- Frontend validates permissions before sending create/update requests
- **HOWEVER**: Frontend validation alone is **NOT SECURE**

### Security Risk:
A malicious user or anyone with API knowledge can bypass the frontend by sending direct HTTP requests to:
- `POST /api/Exam` - Create exam
- `PUT /api/Exam/{id}` - Update exam

**Example Attack Scenario:**
```http
POST /api/Exam
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "title": "Unauthorized Exam",
  "subjectId": 999,  // Subject teacher has NO permission for
  "examType": "Lesson",
  "durationInMinutes": 60,
  "totalMarks": 100,
  "passingMarks": 50,
  "isPublished": true,
  "questions": [...]
}
```

**Question**: Does the backend currently validate that the authenticated teacher has:
- `canCreate` permission for the `subjectId` when creating an exam?
- `canEdit` permission for the exam's `subjectId` when updating?

---

## 3. Expected Backend Behavior

### For `POST /api/Exam` (Create Exam):

**Required Validation:**
1. Extract `userId` from authenticated JWT token
2. Check if user has role `Teacher` or `Admin`
3. If `Teacher`:
   - Query `TeacherPermissions` table for:
     ```sql
     WHERE TeacherId = {currentUserId}
       AND SubjectId = {exam.SubjectId}
       AND CanCreate = true
       AND IsActive = true
     ```
   - If NO matching record found → **Return 403 Forbidden**
4. If `Admin` → Allow (no restriction)

**Expected Response on Failure:**
```json
{
  "success": false,
  "message": "You do not have permission to create exams for this subject",
  "error": "PermissionDenied"
}
```

**HTTP Status Code**: `403 Forbidden`

---

### For `PUT /api/Exam/{id}` (Update Exam):

**Required Validation:**
1. Load existing exam from database
2. Extract `userId` from authenticated JWT token
3. Check if user has role `Teacher` or `Admin`
4. If `Teacher`:
   - Query `TeacherPermissions` table for:
     ```sql
     WHERE TeacherId = {currentUserId}
       AND SubjectId = {exam.SubjectId}
       AND CanEdit = true
       AND IsActive = true
     ```
   - If NO matching record found → **Return 403 Forbidden**
   - **IMPORTANT**: If teacher tries to change `subjectId` to a different subject, validate permission for the NEW subject as well
5. If `Admin` → Allow

**Expected Response on Failure:**
```json
{
  "success": false,
  "message": "You do not have permission to edit exams for this subject",
  "error": "PermissionDenied"
}
```

**HTTP Status Code**: `403 Forbidden`

---

### For `DELETE /api/Exam/{id}` (Delete Exam):

**Required Validation:**
1. Load existing exam from database
2. Extract `userId` from authenticated JWT token
3. Check if user has role `Teacher` or `Admin`
4. If `Teacher`:
   - Query `TeacherPermissions` table for:
     ```sql
     WHERE TeacherId = {currentUserId}
       AND SubjectId = {exam.SubjectId}
       AND CanDelete = true
       AND IsActive = true
     ```
   - If NO matching record found → **Return 403 Forbidden**
5. If `Admin` → Allow

**Expected Response on Failure:**
```json
{
  "success": false,
  "message": "You do not have permission to delete exams for this subject",
  "error": "PermissionDenied"
}
```

**HTTP Status Code**: `403 Forbidden`

---

## 4. Requested Details from Backend Team

Please confirm or implement the following:

### ✅ Checklist:

- [ ] **POST /api/Exam** validates `canCreate` permission before creating exam
- [ ] **PUT /api/Exam/{id}** validates `canEdit` permission before updating exam
- [ ] **DELETE /api/Exam/{id}** validates `canDelete` permission before deleting exam
- [ ] Permission checks query `TeacherPermissions` table with `IsActive = true`
- [ ] Admin role bypasses permission checks
- [ ] Proper HTTP status codes (403) returned on permission denial
- [ ] Clear error messages returned to frontend
- [ ] (Optional) Audit logging for failed permission attempts

### 🔍 Testing Scenarios:

Please test and confirm the following scenarios work correctly:

1. **Valid Creation**: Teacher with `canCreate=true` for Math → Creates Math exam → ✅ Success
2. **Invalid Creation**: Teacher with NO permission for Science → Creates Science exam → ❌ 403 Forbidden
3. **Valid Update**: Teacher with `canEdit=true` for Math → Updates Math exam → ✅ Success
4. **Invalid Update**: Teacher with NO edit permission → Updates exam → ❌ 403 Forbidden
5. **Subject Change Attack**: Teacher with Math permission → Tries to update exam and change `subjectId` to Science → ❌ 403 Forbidden
6. **Valid Delete**: Teacher with `canDelete=true` → Deletes exam → ✅ Success
7. **Invalid Delete**: Teacher with NO delete permission → Deletes exam → ❌ 403 Forbidden
8. **Admin Bypass**: Admin user → Creates/Updates/Deletes any exam → ✅ Success (no restrictions)

---

## 5. Impact on Frontend

### Current Frontend Implementation (Completed):

✅ **What we've done:**
- Teacher permissions are loaded on component initialization
- Subject dropdown is filtered to show only authorized subjects
- Frontend validates permissions before API calls
- Clear error messages shown to users

### What Happens After Backend Fix:

✅ **Double Security Layer:**
- Frontend prevents accidental unauthorized attempts (UX improvement)
- Backend prevents malicious/direct API unauthorized attempts (Security)

✅ **Error Handling:**
- If backend returns 403, frontend shows appropriate message
- Already implemented in `create-edit-exam.component.ts`:
  ```typescript
  error: (error) => {
    let errorMessage = 'Failed to create exam';
    if (error.error?.message) {
      errorMessage = error.error.message;
    }
    this.toastService.showError(errorMessage);
  }
  ```

---

## 6. Technical Implementation Guidance (C# .NET API)

### Suggested Approach:

#### Option A: Custom Authorization Attribute

```csharp
[AttributeUsage(AttributeTargets.Method)]
public class RequireSubjectPermissionAttribute : Attribute
{
    public string Permission { get; set; } // "Create", "Edit", "Delete"
    
    public RequireSubjectPermissionAttribute(string permission)
    {
        Permission = permission;
    }
}
```

**Usage:**
```csharp
[HttpPost]
[RequireSubjectPermission("Create")]
public async Task<IActionResult> CreateExam([FromBody] CreateExamDto dto)
{
    // Permission already validated by attribute
    // Proceed with exam creation
}
```

#### Option B: Service Layer Validation

```csharp
public class ExamService : IExamService
{
    private readonly ITeacherPermissionService _permissionService;
    private readonly ICurrentUserService _currentUser;
    
    public async Task<ExamDto> CreateExamAsync(CreateExamDto dto)
    {
        var userId = _currentUser.GetUserId();
        var userRole = _currentUser.GetRole();
        
        if (userRole == "Teacher")
        {
            var hasPermission = await _permissionService.HasPermissionAsync(
                userId, 
                dto.SubjectId, 
                PermissionType.Create
            );
            
            if (!hasPermission)
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission to create exams for this subject"
                );
            }
        }
        
        // Proceed with creation
    }
}
```

#### Option C: Repository/Data Layer Check

```csharp
public async Task<bool> HasPermissionAsync(
    int teacherId, 
    int subjectId, 
    PermissionType permissionType)
{
    var query = _context.TeacherPermissions
        .Where(p => p.TeacherId == teacherId 
                 && p.SubjectId == subjectId 
                 && p.IsActive);
    
    return permissionType switch
    {
        PermissionType.Create => await query.AnyAsync(p => p.CanCreate),
        PermissionType.Edit => await query.AnyAsync(p => p.CanEdit),
        PermissionType.Delete => await query.AnyAsync(p => p.CanDelete),
        _ => false
    };
}
```

---

## 7. Database Schema Reference

### TeacherPermissions Table Structure:

```sql
CREATE TABLE TeacherPermissions (
    Id INT PRIMARY KEY IDENTITY(1,1),
    TeacherId INT NOT NULL,
    SubjectId INT NOT NULL,
    CanCreate BIT NOT NULL DEFAULT 0,
    CanEdit BIT NOT NULL DEFAULT 0,
    CanDelete BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    GrantedBy INT NULL,
    GrantedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    Notes NVARCHAR(500) NULL,
    
    FOREIGN KEY (TeacherId) REFERENCES Users(Id),
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id),
    FOREIGN KEY (GrantedBy) REFERENCES Users(Id)
);
```

---

## 8. Related Endpoints to Review

Please also review these related endpoints for similar permission issues:

### Content Management:
- `POST /api/Lessons` - Should validate `canCreate` for subject
- `PUT /api/Lessons/{id}` - Should validate `canEdit` for subject
- `DELETE /api/Lessons/{id}` - Should validate `canDelete` for subject
- `POST /api/Resources` - Should validate permissions
- `POST /api/VideoChapters` - Should validate permissions

### Teacher Content (Already has approval system, but check permissions):
- `POST /api/TeacherContent/*` - Verify permission checks

---

## 9. Timeline & Priority

### Priority: 🔴 **CRITICAL**

**Why Critical:**
- This is a security vulnerability, not just a feature request
- Teachers can currently create exams for ANY subject (if backend doesn't validate)
- Data integrity at risk
- Potential for abuse/misuse

**Requested Timeline:**
- **Immediate Review**: Within 24 hours
- **Implementation**: Within 2-3 days
- **Testing & Deployment**: Within 1 week

---

## 10. Testing & Verification

### Manual Testing Commands:

#### Test 1: Unauthorized Exam Creation (Should FAIL with 403)
```bash
curl -X POST "https://api.naplanbridge.com/api/Exam" \
  -H "Authorization: Bearer <teacher_token_without_math_permission>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Unauthorized Math Exam",
    "subjectId": 1,
    "examType": "Lesson",
    "durationInMinutes": 60,
    "totalMarks": 100,
    "passingMarks": 50,
    "isPublished": true,
    "questions": []
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "You do not have permission to create exams for this subject",
  "error": "PermissionDenied"
}
```
**Expected Status:** `403 Forbidden`

#### Test 2: Authorized Exam Creation (Should SUCCEED)
```bash
curl -X POST "https://api.naplanbridge.com/api/Exam" \
  -H "Authorization: Bearer <teacher_token_with_math_permission>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Authorized Math Exam",
    "subjectId": 1,
    "examType": "Lesson",
    "durationInMinutes": 60,
    "totalMarks": 100,
    "passingMarks": 50,
    "isPublished": true,
    "questions": []
  }'
```

**Expected Status:** `200 OK` or `201 Created`

---

## 11. Communication & Coordination

### Point of Contact:
- **Frontend Team**: Implemented defensive checks on Angular side
- **Backend Team**: Needs to implement server-side validation

### When Backend is Fixed:
1. Backend team confirms implementation
2. Backend team provides updated API documentation
3. Frontend team tests integration
4. Update security documentation
5. Deploy to production

### Notification:
Please notify via:
- GitHub Issue/PR comment
- Team communication channel
- Email to frontend team lead

---

## 12. Summary

### Current State:
- ❌ Backend permission validation: **UNKNOWN/MISSING**
- ✅ Frontend permission filtering: **IMPLEMENTED**
- ⚠️ Security risk: **HIGH** (if backend validation missing)

### Required Actions:
1. **Backend Team**: Implement permission checks on Exam CRUD endpoints
2. **Backend Team**: Test all scenarios listed above
3. **Backend Team**: Confirm implementation and provide documentation
4. **Frontend Team**: Verify integration after backend deployment

### Success Criteria:
- Teacher cannot create/edit/delete exams for unauthorized subjects (even via direct API calls)
- Clear error messages returned
- Admin users bypass restrictions
- All tests pass

---

## 📞 Questions or Clarifications?

If you need any clarification or have questions about:
- Permission model design
- Frontend implementation details
- Test scenarios
- Integration approach

Please reach out immediately. This is a security-critical issue.

---

**Report Generated**: November 21, 2025  
**Generated By**: Frontend Development Team  
**Status**: ⏳ Awaiting Backend Team Response
