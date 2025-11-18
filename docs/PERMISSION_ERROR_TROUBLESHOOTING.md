# 🔒 Permission Error: Creating Subjects - Troubleshooting Guide

## Problem
```
POST https://naplan2.runasp.net/api/Subjects 403 (Forbidden)
Error: 🔒 You do not have permission to create subjects. 
        Only Admin users can create new subjects.
```

## Root Cause
The API endpoint `POST /api/Subjects` requires **Admin role** or special **create_subject permission** to create new subjects. Your current user account is a **Teacher** without these permissions.

### What This Means
- ❌ Teachers cannot create subjects without special permission
- ✅ Only Admins can create subjects by default
- ⚠️ Teachers can have permission granted by Admin

---

## ✅ Solutions

### Solution 1: Request Permission from Admin (Recommended)
**Steps:**
1. Ask your **Administrator** to grant you the **"create_subject"** permission
2. Administrator should use the endpoint: `POST /api/TeacherPermissions/grant`
3. Once granted, you can create subjects

**Permission Endpoint:**
```
POST /api/TeacherPermissions/grant
Body: {
  "teacherId": <your-id>,
  "subjectId": <subject-id>,
  "canCreate": true,
  "canEdit": true,
  "canDelete": false
}
```

### Solution 2: Use Admin Account
1. Log out of your current Teacher account
2. Log in with an **Admin account**
3. Create subjects with Admin privileges
4. Assign the created subjects to teachers

### Solution 3: Backend Configuration (Admin Only)
If you are the system administrator, you can modify the authorization policy in the backend to allow teachers to create subjects directly without requiring Admin role.

---

## How Permissions Work

### Current Authorization Model
```
POST /api/Subjects
├─ Requires: Admin Role
└─ Or: Teacher with create_subject permission

POST /api/Lessons
├─ Requires: Authenticated User
├─ Allows: Teachers to submit lessons for approval
└─ Status: CREATED → SUBMITTED → PENDING → APPROVED
```

### Role-Based Access Control
```
Admin
├─ Can create subjects directly ✅
├─ Can create lessons directly ✅
└─ Can grant permissions to teachers ✅

Teacher
├─ Can create subjects (if permission granted) ✅
├─ Can create lessons (always) ✅
└─ Content requires admin approval ✅
```

---

## Understanding the Workflow

### For Subjects
1. **Admin creates** subject with all details
2. Subject becomes available immediately
3. Teachers can then create lessons within subjects

### For Lessons/Content
1. **Teacher creates** lesson and uploads files
2. Lesson status: `CREATED`
3. Teacher submits for approval
4. Lesson status: `SUBMITTED` → `PENDING`
5. Admin reviews and approves
6. Lesson status: `APPROVED` → `PUBLISHED`

---

## What You Can Do Now

### ✅ You Can Do (Teacher Account)
- ✅ Create **Lessons** within existing subjects
- ✅ Upload lesson files (poster image, video)
- ✅ Submit lessons for admin approval
- ✅ Edit your own content
- ✅ View your content status

### ❌ You Cannot Do (Without Permission)
- ❌ Create new **Subjects** (requires Admin or special permission)
- ❌ Approve content (requires Admin)
- ❌ Delete subjects (requires Admin)
- ❌ Grant permissions to other teachers (requires Admin)

---

## Next Steps

### Immediate Action
1. **Contact your Administrator** with this message:
   ```
   "Please grant me the 'create_subject' permission using the 
   TeacherPermissions endpoint. My Teacher ID is: [YOUR_ID]"
   ```

2. Or **ask for the Admin to create subjects** that you can teach

### For Now
You can still:
- ✅ Create lessons in existing subjects (if you have permission)
- ✅ Upload lesson content
- ✅ Submit lessons for approval
- ✅ Manage your existing content

---

## Error Message Details

### Updated Error Messages
```
❌ 403 Forbidden
"Permission Denied: Only Admin users or teachers with special 
permission can create subjects. Please contact your administrator 
to grant you the 'create_subject' permission."
```

### Other Possible Errors
```
❌ 400 Bad Request
"Invalid subject data. Please check your inputs and ensure 
PosterFile is provided."

❌ 401 Unauthorized
"Your session has expired. Please log in again."

❌ 409 Conflict
"A subject with this name already exists."
```

---

## Technical Details

### API Endpoint
```
POST /api/Subjects
Query Parameters:
- YearId (required)
- SubjectNameId (required)
- OriginalPrice (optional)
- DiscountPercentage (optional)
- Level (optional)
- Duration (optional)
- StartDate (optional)
- TeacherId (optional)

Request Body (multipart/form-data):
- PosterFile (required, image file max 10MB)

Authorization Required:
- Admin Role
- OR Teacher with "create_subject" permission
```

### Permission Grant Endpoint
```
POST /api/TeacherPermissions/grant
Body:
{
  "teacherId": number,
  "subjectId": number,
  "canCreate": boolean,
  "canEdit": boolean,
  "canDelete": boolean
}

Authorization Required:
- Admin Role only
```

---

## FAQ

### Q: Why do I need Admin to create subjects?
**A:** The system separates subject creation from lesson creation to maintain quality control. Admins create subjects, teachers create lessons within them.

### Q: Can I create lessons?
**A:** Yes! Teachers can always create lessons. Only subjects require special permission.

### Q: What if I'm the teacher and the admin too?
**A:** Log in with your Admin account, create subjects, then switch to Teacher account to create lessons.

### Q: How long does permission take?
**A:** Usually immediate. The admin grants permission using the API endpoint, and it takes effect immediately.

### Q: Can I see who has what permissions?
**A:** Yes, the system maintains an audit trail. Ask your admin to check permissions.

---

## Code Changes Made

### Updated Error Message Service
**File:** `teacher-content-management.service.ts`

**Change:** Enhanced 403 error message to include actionable guidance
```typescript
if (error.status === 403) {
  errorMessage = '🔒 Permission Denied: Only Admin users or teachers with special permission can create subjects. Please contact your administrator to grant you the "create_subject" permission.';
}
```

---

## Support

If you need help with permissions, provide:
1. Your user ID
2. The subject ID you want to create
3. Your Admin's email
4. Any error messages you received

Share this document with your administrator if you need them to grant permissions.

---

## Related Documentation
- API Documentation: See swagger.json `/api/TeacherPermissions` endpoints
- Backend authorization: Check API authorization policies
- User roles: See authentication service documentation

---

**Status:** 🔒 Permission-based error
**Action Required:** Request from Administrator
**Can proceed with:** Lessons (in existing subjects) ✅
