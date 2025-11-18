# ❓ Backend Inquiry Report - Teacher Content Management

**Date:** November 18, 2025  
**Priority:** HIGH  
**Status:** Issues Found - Backend Implementation Required

---

## 🎯 Inquiry Overview

The teacher content management feature requires several backend endpoints and fixes to work properly. The **frontend is ready**, but the **backend implementation is incomplete or not returning correct data**.

---

## 📋 Main Issues Found

### Issue #1: Subjects Not Returning from Backend ⚠️ **CRITICAL**

**Problem:** When teachers try to get their authorized subjects, the endpoint returns empty or incomplete data.

**Frontend Call:**
```typescript
getMySubjects(): Observable<TeacherSubject[]> {
  const endpoint = `${this.apiUrl}/my-subjects`;  // /api/TeacherContent/my-subjects
  return this.http.get<ApiResponse<TeacherSubject[]>>(endpoint);
}
```

**What's Missing/Wrong:**
- The endpoint `/api/TeacherContent/my-subjects` returns `List<Int32>` (just subject IDs)
- Frontend expects `TeacherSubject[]` with full details (name, stats, permissions)
- No response structure defined in Swagger for the actual data

**Required Backend Implementation:**
```csharp
// Expected Response Format:
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "subjectId": 1,
      "subjectName": "Mathematics",
      "yearId": 1,
      "yearName": "Grade 10",
      "canCreate": true,
      "canEdit": true,
      "canDelete": false,
      "stats": {
        "total": 5,
        "approved": 3,
        "pending": 1,
        "rejected": 0,
        "revisionRequested": 1
      }
    }
  ]
}
```

---

### Issue #2: Missing Endpoint for Getting Teacher's Content with Stats

**Problem:** Teachers need a way to fetch their content with filtering options.

**Frontend Method:**
```typescript
getMyContent(filters?: ContentFilterDto): Observable<ContentItem[]>
// Calls: /api/TeacherContent/my-content
```

**Current Status in Swagger:**
- ✅ Endpoint exists: `/api/TeacherContent/my-content` (GET)
- ✅ Supports filters (Status, CreatedBy, SubjectId, DateFrom, DateTo)
- ❓ **Not confirmed:** Actual response structure and data returned

**Questions:**
1. Does it return `ContentItem[]` with all required fields?
   - `id`, `itemType`, `title`, `description`, `status`
   - `createdAt`, `updatedAt`, `approvedAt`
   - `rejectionReason`, `revisionFeedback`
   - `subjectId`, `weekId`, `termId`

2. Are the status values correctly mapped?
   - Frontend expects: `'CREATED' | 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'REVISION_REQUESTED'`
   - What does backend return?

3. Is pagination working?
   - Frontend sends: `pageNumber`, `pageSize`
   - Does backend support it?

---

### Issue #3: Creating Subjects Fails with 403 (Permission Issue)

**Problem:** Teachers cannot create subjects because they don't have the required permission.

**Current Behavior:**
```
POST /api/Subjects
Response: 403 Forbidden
Message: "Only Admin users or teachers with special permission can create subjects"
```

**What's Needed:**
1. **Option A:** Grant the `create_subject` permission to teachers via:
   ```
   POST /api/TeacherPermissions/grant
   {
     "teacherId": <id>,
     "subjectId": null,
     "canCreate": true,
     "canEdit": true,
     "canDelete": false
   }
   ```

2. **Option B:** Modify the authorization policy to allow teachers to create subjects directly

3. **Option C:** Create a separate teacher-specific endpoint:
   ```
   POST /api/Teacher/subjects  (instead of /api/Subjects)
   ```

---

### Issue #4: Lessons/Content Creation File Upload Issues

**Problem:** When uploading lessons with poster and video files, the backend might not be processing multipart/form-data correctly.

**Frontend Implementation:**
```typescript
createLesson(lessonData: any): Observable<any> {
  const formData = new FormData();
  formData.append('Title', lessonData.title);
  formData.append('Description', lessonData.description);
  formData.append('WeekId', lessonData.weekId);
  formData.append('PosterFile', lessonData.posterFile);  // File object
  formData.append('VideoFile', lessonData.videoFile);    // File object
  
  return this.http.post<any>(`${this.baseApiUrl}/Lessons`, formData);
}
```

**Questions:**
1. Does the backend correctly receive multipart/form-data?
2. Are files stored properly?
3. What is the response format? (filename, URL, etc.)
4. Are file size limits enforced? (Frontend: 10MB for images, 500MB for video)

---

### Issue #5: Pending Approvals Not Working Correctly

**Problem:** Admin approval workflow might not be complete.

**Frontend Call:**
```typescript
getPendingApprovals(filters?: ContentFilterDto): Observable<PendingApprovalDto[]> {
  // Calls: /api/TeacherContent/pending-approvals
}
```

**Questions:**
1. Does the endpoint return all pending content?
2. Are teacher details included (name, ID)?
3. Is submission timestamp accurate?
4. Are rejection reasons and revision feedback returned?

---

### Issue #6: Approval History Not Populated

**Problem:** Teachers cannot see the history of approvals and rejections for their content.

**Frontend Call:**
```typescript
getApprovalHistory(type: string, id: number): Observable<ApprovalHistoryDto[]> {
  // Calls: /api/TeacherContent/history?type={type}&id={id}
}
```

**Questions:**
1. Is the history endpoint implemented?
2. What values are expected for `type` parameter? (Lesson, Exam, etc.)
3. Does it return action details, timestamps, and remarks?

---

### Issue #7: Subject Permissions Not Synchronized

**Problem:** When granting permissions to a teacher for a subject, the permissions might not be saved or retrieved correctly.

**Frontend Call:**
```typescript
canManageSubject(subjectId: number): Observable<SubjectPermissions> {
  // Calls: /api/TeacherContent/can-manage/{subjectId}
}
```

**Questions:**
1. Does this endpoint check the current logged-in teacher's permissions?
2. Are permissions inherited from parent roles?
3. Is the response correct? (`{ canCreate, canEdit, canDelete }`)

---

## 📊 Summary of Required Backend Implementations

| # | Endpoint | Method | Status | Issue |
|---|----------|--------|--------|-------|
| 1 | `/api/TeacherContent/my-subjects` | GET | ⚠️ Broken | Returns only IDs, needs full subject data |
| 2 | `/api/TeacherContent/my-content` | GET | ❓ Unclear | Response structure unknown |
| 3 | `/api/Subjects` | POST | ❌ 403 Forbidden | Permission issue - needs fixing |
| 4 | `/api/Lessons` | POST | ❓ Unclear | File upload handling unknown |
| 5 | `/api/TeacherContent/pending-approvals` | GET | ❓ Unclear | Implementation status unknown |
| 6 | `/api/TeacherContent/history` | GET | ❓ Unclear | Implementation status unknown |
| 7 | `/api/TeacherContent/can-manage/{subjectId}` | GET | ❓ Unclear | Implementation status unknown |

---

## 🔄 What Frontend Has Already Done

✅ **Completed:**
- Subject creation modal with all required fields (8 fields)
- Lesson creation wizard with file upload support (poster + video)
- Form validation and error handling
- API call structure with FormData support
- Error messages for users
- Loading states and UI feedback

✅ **Ready to Work:**
- All components are compiled without errors
- Service methods are properly typed
- Forms are fully functional
- File validation is in place

---

## 🛠️ What Backend Needs to Provide

### Priority 1: CRITICAL (Required for Basic Functionality)

1. **Fix `/api/TeacherContent/my-subjects`**
   - Return full `TeacherSubject` objects with stats
   - Include permissions for each subject
   - Proper error handling

2. **Implement Subject Creation Permission**
   - Either grant permission to teachers to create subjects
   - Or modify authorization to allow teacher-created subjects

### Priority 2: HIGH (Required for Full Feature)

3. **Confirm `/api/TeacherContent/my-content` Response**
   - Verify response structure matches `ContentItem[]`
   - Test filtering and pagination
   - Ensure all fields are returned

4. **Test Lesson/Content File Upload**
   - Verify multipart/form-data is handled
   - Confirm files are stored correctly
   - Provide file URLs in response

### Priority 3: MEDIUM (Required for Admin Features)

5. **Implement Pending Approvals**
   - Return pending content with teacher details
   - Include submission timestamps
   - Support filtering

6. **Implement Approval History**
   - Track all approval actions
   - Store action details and remarks
   - Provide approval timeline

### Priority 4: LOW (Nice to Have)

7. **Verify Permission Checking**
   - Ensure `can-manage` endpoint works
   - Check role inheritance
   - Validate permission caching

---

## 🚀 Next Steps

### For Backend Team:
1. Review this inquiry report
2. Verify each endpoint implementation
3. Run tests against the endpoints
4. Provide response examples for each endpoint
5. Confirm file upload handling

### For Frontend Team:
1. **Wait for backend confirmation** of endpoints
2. Once confirmed, test with real backend responses
3. Handle any response format differences
4. Update services if needed based on actual backend

---

## 📞 Questions to Backend Team

Please provide answers to these questions:

1. **Subjects API:**
   - [ ] What is the actual response format for `/api/TeacherContent/my-subjects`?
   - [ ] Can you include subject details, not just IDs?
   - [ ] How do we get stats for each subject?

2. **Content API:**
   - [ ] Is `/api/TeacherContent/my-content` fully implemented?
   - [ ] What filters are currently supported?
   - [ ] Is pagination working?

3. **Creation API:**
   - [ ] Can teachers create subjects? (If not, why not?)
   - [ ] What is the endpoint for creating subjects as a teacher?
   - [ ] Does `/api/Lessons` accept multipart/form-data with files?

4. **Approval API:**
   - [ ] Is the approval workflow complete?
   - [ ] How does a teacher request revision?
   - [ ] Can admins approve/reject content?

5. **File Handling:**
   - [ ] What is the maximum file size allowed?
   - [ ] Where are files stored?
   - [ ] What URL is returned for uploaded files?

---

## 📎 Attachments

Related frontend files:
- `src/app/features/teacher/services/teacher-content-management.service.ts`
- `swagger.json` (API specification)
- `src/app/features/teacher/content-management/teacher-content-management.component.ts`

---

**Prepared by:** GitHub Copilot  
**Date:** November 18, 2025  
**Version:** 1.0

