# 📋 Solutions for 403 Forbidden Error - Subject Creation

## Summary
The error `403 Forbidden` when trying to create subjects indicates **insufficient permissions**. This is by design - the system requires either Admin role or special permission to create subjects.

---

## What You're Experiencing

### Error Message
```
POST https://naplan2.runasp.net/api/Subjects 403 (Forbidden)
Backend error 403: null
Error creating subject: {status: 403, message: '...', error: null}
🔒 Permission Denied: Only Admin users or teachers with special 
   permission can create subjects. Please contact your administrator 
   to grant you the "create_subject" permission.
```

### Cause
Your user account is a **Teacher** without the `create_subject` permission.

---

## ✅ How to Fix

### Option A: Contact Your Administrator ⭐ Recommended
**Steps:**
1. Send the following message to your system administrator:
   ```
   "Please grant me the 'create_subject' permission. 
    I need this to create new subjects through the TeacherContentManagement interface."
   ```

2. Administrator will use this API call:
   ```
   POST /api/TeacherPermissions/grant
   {
     "teacherId": <your-teacher-id>,
     "subjectId": <optional-subject-id>,
     "canCreate": true,
     "canEdit": true,
     "canDelete": false
   }
   ```

3. Once permission is granted (usually immediate):
   - Refresh your browser
   - Try creating a subject again
   - It should work! ✅

---

### Option B: Use Admin Account
1. Log out of your Teacher account
2. Log in with Administrator credentials
3. Go to Teacher Content Management
4. Create subjects with Admin privileges
5. Optionally assign subjects to teachers

**Advantages:**
- Works immediately
- No waiting for admin approval

**Disadvantages:**
- Requires admin credentials
- Not practical for day-to-day operations

---

### Option C: Teach Within Existing Subjects ⭐ Alternative
While waiting for subject creation permission, you can:
1. **Create Lessons** within existing subjects (this is allowed for teachers)
2. Upload lesson files (poster image, video)
3. Submit lessons for admin approval
4. Your lessons will appear once admin approves them

**This workflow:**
```
Existing Subject
    ↓
You create Lesson (Teacher can do this ✅)
    ↓
You submit for approval
    ↓
Admin approves
    ↓
Lesson published
```

---

## Permission Hierarchy

### What Can Teachers Do?
```
✅ Create Lessons (always allowed)
✅ Upload lesson files (poster, video)
✅ Submit lessons for approval
✅ Edit own lessons
✅ View own content status
✅ Request admin feedback
```

### What Requires Admin?
```
❌ Create Subjects (needs permission)
❌ Edit subjects
❌ Delete subjects
❌ Approve lessons
❌ Manage all users
❌ Grant permissions
```

---

## Step-by-Step: Requesting Permission

### Step 1: Identify Your Information
- Your Name
- Your Teacher ID
- Your Email
- Your School/Institution

### Step 2: Contact Administrator
**Email Template:**
```
Subject: Request for Subject Creation Permission

Dear Administrator,

I would like to request the "create_subject" permission for my 
teacher account in the NaplanBridge system.

My Details:
- Name: [Your Name]
- Teacher ID: [Your ID]
- Email: [Your Email]

This permission will allow me to create new subjects for my classes.

Thank you,
[Your Name]
```

### Step 3: What Admin Does
Admin will:
1. Log in with admin account
2. Navigate to Teacher Management
3. Find your account
4. Grant "create_subject" permission
5. Send confirmation

### Step 4: You're Done! 
- Permission takes effect immediately
- Refresh your browser
- You can now create subjects ✅

---

## If You Are the Administrator

If you are the system admin and want to grant yourself permission:

### Option 1: Direct API Call (Postman/curl)
```bash
POST https://naplan2.runasp.net/api/TeacherPermissions/grant
Authorization: Bearer [your-admin-token]
Content-Type: application/json

{
  "teacherId": 1,
  "subjectId": null,
  "canCreate": true,
  "canEdit": true,
  "canDelete": false
}
```

### Option 2: Database Update (If Available)
Contact your technical team to directly update the TeacherPermissions table.

### Option 3: Backend Configuration
Modify the authorization policy in the API to allow teachers to create subjects directly (requires code change).

---

## Frequently Asked Questions

### Q1: Why this permission restriction?
**A:** It ensures quality control. Admins create subjects with curriculum standards, teachers create lessons within them.

### Q2: Can I create lessons while waiting for permission?
**A:** Yes! You can create lessons in any existing subject. Only subject creation requires special permission.

### Q3: How long does the permission process take?
**A:** Usually immediate - as soon as admin grants it through the API.

### Q4: What if my admin forgets to grant permission?
**A:** Follow up with them or escalate to your institution's IT department.

### Q5: Can I see my permissions?
**A:** Yes, check your user profile or ask your admin to verify your permissions.

### Q6: What if I get a different error?

#### 400 Bad Request
- Check if you filled all required fields
- Ensure you selected an image file for PosterFile
- File must be valid image format (JPEG, PNG, GIF, WebP)
- File must be under 10MB

#### 401 Unauthorized
- Your login session expired
- Log out and log back in
- Try again

#### 409 Conflict
- A subject with this name already exists
- Try a different subject name

---

## After Permission is Granted

### You Can Now:
1. ✅ Create new subjects
2. ✅ Add subject details (price, discount, level, duration)
3. ✅ Upload subject poster image
4. ✅ Create lessons within those subjects
5. ✅ Upload lesson files
6. ✅ Submit lessons for approval

### Subject Creation Workflow
```
1. Click "Create New Subject"
   ↓
2. Fill in required fields
   - Subject Name
   - Year Level
   - Poster Image
   ↓
3. Add optional details
   - Original Price
   - Discount %
   - Level
   - Duration
   - Start Date
   ↓
4. Click "Create Subject"
   ↓
5. Subject appears immediately ✅
   ↓
6. You're assigned as instructor
   ↓
7. Create lessons in this subject
```

---

## Troubleshooting Checklist

- [ ] I have requested permission from my administrator
- [ ] I am logged in as a Teacher (not Admin)
- [ ] I have the required subject information
- [ ] I have selected a valid poster image (JPEG/PNG/GIF/WebP, <10MB)
- [ ] I have filled all required fields
- [ ] My browser is up to date
- [ ] I have cleared browser cache
- [ ] I have tried refreshing the page
- [ ] Permission grant email confirmed
- [ ] At least 5 minutes have passed since permission grant

---

## Additional Resources

### Related Documentation
- `PERMISSION_ERROR_TROUBLESHOOTING.md` - Detailed permission guide
- `CONTENT_MANAGEMENT_QUICK_REFERENCE.md` - Usage guide
- `API_DOCUMENTATION_FOR_FRONTEND.md` - API endpoints
- swagger.json - Complete API specification

### Contact Information
- System Admin: [Ask your institution]
- Technical Support: support@naplanbridge.com
- API Issues: Check logs in backend

---

## Current Status

✅ **Updated:** Error message now provides clear guidance
✅ **Solution:** Request permission from administrator
✅ **Alternative:** Create lessons in existing subjects
✅ **Timeline:** Permission grants are instant

---

**This is a security feature, not a bug. Permission is working as designed.**

**Next Action:** Contact your administrator for permission grant.
