# 📌 BACKEND REPORT: Teacher Create Subject Authentication Error

**Date:** December 2, 2025  
**Endpoint:** `POST /api/Subjects`  
**Severity:** 🔴 Critical - Blocking Feature  
**Reporter:** Frontend Development Team

---

## 🔍 Issue Summary

When a Teacher attempts to create a new subject, the API returns a **500 Internal Server Error** with an invalid authentication handler error. The error message is being incorrectly used as an authentication scheme name instead of being returned as a proper HTTP response.

---

## 📋 Error Details

### HTTP Response:
```json
{
    "statusCode": 400,
    "message": "Invalid operation",
    "details": "Operation failed: No authentication handler is registered for the scheme 'You don't have permission to create subjects. Please contact an administrator.'. The registered schemes are: Bearer. Did you forget to call AddAuthentication().Add[SomeAuthHandler](\"You don't have permission to create subjects. Please contact an administrator.\",...)?",
    "innerError": null,
    "stackTrace": null,
    "errors": null,
    "traceId": "e7735e90-cdcd-4ddf-8821-af5c0d7199c7",
    "timestamp": "2025-12-01T23:49:28.2757256Z"
}
```

### Request Details:
- **Method:** POST
- **Endpoint:** `/api/Subjects`
- **Content-Type:** multipart/form-data
- **Authorization:** Bearer token (properly sent)

### Request Payload:
```
YearId=6
SubjectNameId=9
OriginalPrice=200
DiscountPercentage=40
Level=Beginner
Duration=4
TeacherId=3
StartDate=2025-12-03
PosterFile=[File object]
```

---

## 🐛 Root Cause Analysis

The error message indicates that the backend code is incorrectly calling:

```csharp
// ❌ INCORRECT - This is the bug
await HttpContext.ChallengeAsync("You don't have permission to create subjects. Please contact an administrator.");
```

The `ChallengeAsync()` method expects an **authentication scheme name** (like "Bearer"), but the code is passing an **error message string** instead.

---

## ✅ Expected Behavior

When a user lacks permission to create subjects, the API should return:

1. **HTTP 401 Unauthorized** or **403 Forbidden** status code
2. A proper JSON response with the error message
3. Should NOT trigger an authentication handler registration error

---

## 🔧 Required Fix

### Option 1: Return Unauthorized Response
```csharp
// ✅ CORRECT
if (!User.HasClaim("Permission", "create_subject") && !User.IsInRole("Admin"))
{
    return Unauthorized(new 
    { 
        message = "You don't have permission to create subjects. Please contact an administrator." 
    });
}
```

### Option 2: Return Forbidden Response
```csharp
// ✅ CORRECT
if (!User.HasClaim("Permission", "create_subject") && !User.IsInRole("Admin"))
{
    return StatusCode(403, new 
    { 
        message = "You don't have permission to create subjects. Please contact an administrator." 
    });
}
```

### Option 3: Use Custom Exception
```csharp
// ✅ CORRECT
if (!User.HasClaim("Permission", "create_subject") && !User.IsInRole("Admin"))
{
    throw new UnauthorizedAccessException("You don't have permission to create subjects. Please contact an administrator.");
}
```

---

## 🔍 Where to Look

The bug is likely located in one of these files:

1. **SubjectsController.cs** - In the `CreateSubject` action method
2. **Authorization Policy Handler** - Custom authorization handler for subject creation
3. **Custom Middleware** - If there's custom permission checking middleware

### Search for:
- `ChallengeAsync("You don't have permission`
- Permission checking logic in `POST /api/Subjects` endpoint
- Authorization policies for subject creation

---

## 🎯 Required Permissions

Please confirm the correct permission setup for Teachers to create subjects:

### Current Understanding:
- Teachers should be able to create subjects for themselves
- The `create_subject` permission should be assigned to the Teacher role
- Or individual Teachers should have `create_subject` permission in UserPermissions table

### Questions:
1. ✅ Should Teachers have permission to create subjects?
2. ✅ What is the correct permission name in the database?
3. ✅ Is it a Role-based permission or User-specific permission?

---

## 📊 Database Check Required

Please verify in the database:

```sql
-- Check if Teacher role has create_subject permission
SELECT r.Name as RoleName, p.Name as PermissionName
FROM AspNetRoles r
INNER JOIN RolePermissions rp ON r.Id = rp.RoleId
INNER JOIN Permissions p ON rp.PermissionId = p.Id
WHERE r.Name = 'Teacher' AND p.Name LIKE '%subject%';

-- Check specific user permissions
SELECT u.UserName, p.Name as PermissionName
FROM AspNetUsers u
INNER JOIN UserPermissions up ON u.Id = up.UserId
INNER JOIN Permissions p ON up.PermissionId = p.Id
WHERE u.Id = 3 AND p.Name LIKE '%subject%';
```

---

## 🧪 Testing Instructions

After the fix, test with:

### Valid Request:
```bash
curl -X POST "https://api.naplanbridge.com/api/Subjects" \
  -H "Authorization: Bearer {teacher_token}" \
  -H "Content-Type: multipart/form-data" \
  -F "YearId=6" \
  -F "SubjectNameId=9" \
  -F "OriginalPrice=200" \
  -F "DiscountPercentage=40" \
  -F "Level=Beginner" \
  -F "Duration=4" \
  -F "TeacherId=3" \
  -F "StartDate=2025-12-03" \
  -F "PosterFile=@subject-poster.jpg"
```

### Expected Success Response (201 Created):
```json
{
  "id": 123,
  "yearId": 6,
  "subjectNameId": 9,
  "originalPrice": 200,
  "discountPercentage": 40,
  "finalPrice": 120,
  "level": "Beginner",
  "duration": 4,
  "teacherId": 3,
  "startDate": "2025-12-03",
  "posterUrl": "https://cdn.naplanbridge.com/subjects/poster-123.jpg"
}
```

### Expected Unauthorized Response (if no permission):
```json
{
  "statusCode": 401,
  "message": "You don't have permission to create subjects. Please contact an administrator."
}
```

---

## 💥 Impact on Frontend

**Current Status:** Feature completely blocked  
**Users Affected:** All Teachers attempting to create subjects  
**Frontend Status:** Cannot proceed with UI development until fixed

### Frontend is Ready:
- ✅ UI form implemented
- ✅ FormData properly constructed
- ✅ Authorization token properly sent
- ✅ Error handling implemented
- ⏸️ **Waiting for backend fix**

---

## 🚀 Priority Request

**This is a critical blocking issue for the Teacher dashboard feature delivery.**

Please prioritize fixing this issue and confirm when ready for testing.

---

## 📞 Contact

If you need any additional information or have questions about the frontend implementation, please respond to this report.

**Status:** ⏳ Waiting for Backend Fix

---

**Generated by:** NaplanBridge Frontend Team  
**Trace ID:** e7735e90-cdcd-4ddf-8821-af5c0d7199c7
