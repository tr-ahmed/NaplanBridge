# 🎓 Teacher Subject Editing Implementation - Complete Guide

## 📋 Overview

Teachers can now edit and add content to subjects they have been granted permission for, following the same hierarchical structure as administrators. This includes creating and editing:

- ✅ **Subjects** (for authorized categories)
- ✅ **Terms** (within their subjects)
- ✅ **Weeks** (within their terms)
- ✅ **Lessons** (within their weeks)

---

## 🔑 How Teacher Permissions Work

### Permission Structure

When an admin grants a teacher permission for a subject, they specify:

```typescript
{
  teacherId: number,
  subjectId: number,
  canCreate: boolean,  // Can create new content
  canEdit: boolean,    // Can edit existing content
  canDelete: boolean,  // Can delete content
  isActive: boolean    // Permission is active
}
```

### Hierarchical Access

When a teacher has permission for a subject, they can:

1. **Create/Edit/Delete the Subject** itself (if they have the respective permissions)
2. **Create Terms** within that subject
3. **Create Weeks** within those terms
4. **Create Lessons** within those weeks
5. **Manage Resources** for their lessons

---

## 🎯 Implementation Details

### Files Modified

1. **`teacher-content-management-redesigned.ts`**
   - Updated `openAdd()` to allow subjects, terms, weeks, and lessons
   - Updated `openEdit()` to allow editing all four entity types
   - Updated `createEntity()` to handle subject creation
   - Updated `updateEntity()` to handle subject updates
   - Updated `deleteEntity()` to handle subject deletion
   - Added subject form template to `getEmptyForm()`

2. **`teacher-content-management-redesigned.html`**
   - Added "Create Subject" button in header
   - Updated permission notice to reflect new capabilities
   - Hierarchy view already supports all operations through event emissions

### Permission Checks

The system performs multiple permission checks:

```typescript
// Check if teacher can create for a subject
canCreateForSubject(subjectId: number): boolean {
  const subject = this.authorizedSubjects.find(s => s.subjectId === subjectId);
  return subject?.canCreate || false;
}

// Check if teacher can edit for a subject
canEditForSubject(subjectId: number): boolean {
  const subject = this.authorizedSubjects.find(s => s.subjectId === subjectId);
  return subject?.canEdit || false;
}

// Check if teacher can delete for a subject
canDeleteForSubject(subjectId: number): boolean {
  const subject = this.authorizedSubjects.find(s => s.subjectId === subjectId);
  return subject?.canDelete || false;
}
```

---

## 🚀 How Teachers Use This Feature

### Step 1: Admin Grants Permission

An administrator must first grant the teacher permission for a subject:

1. Admin goes to **Teacher Permissions** page
2. Selects the teacher
3. Selects the subject
4. Grants permissions:
   - ✅ **Can Create** - Teacher can add new content
   - ✅ **Can Edit** - Teacher can modify existing content
   - ✅ **Can Delete** - Teacher can remove content

### Step 2: Teacher Creates/Edits Content

Once granted permission, the teacher can:

#### Create a New Subject

1. Navigate to **Teacher Content Management**
2. Click **"Create Subject"** button
3. Fill in the form:
   - Year Level
   - Subject Name
   - Category
   - Price (optional)
   - Discount (optional)
   - Level (optional)
   - Duration (optional)
   - Poster Image (optional)
4. Submit - **Requires admin approval**

#### Create Terms

1. In the **Hierarchy View**, expand a subject you have permission for
2. Click **"+ Term"** button on the subject
3. Enter term number and start date
4. Submit - **Requires admin approval**

#### Create Weeks

1. In the **Hierarchy View**, expand a term
2. Click **"+ Week"** button on the term
3. Enter week number
4. Submit - **Requires admin approval**

#### Create Lessons

1. In the **Hierarchy View**, expand a week
2. Click **"+ Lesson"** button
3. Fill in lesson details:
   - Title
   - Description
   - Video URL
   - Duration
   - Order Index
4. Submit - **Requires admin approval**

#### Edit Existing Content

1. In the **Hierarchy View**, find the content item
2. Click the **Edit** button (✏️ icon)
3. Modify the fields
4. Submit - **Requires admin approval**

---

## 🔒 Security & Approval Workflow

### Permission Enforcement

- Teachers can **only** see edit/delete buttons for content they have permission for
- Backend API validates permissions before allowing any changes
- All operations check `canCreate`, `canEdit`, or `canDelete` flags

### Admin Approval Required

⚠️ **Important:** All teacher changes require admin approval before becoming visible to students.

This ensures:
- Quality control over educational content
- Review of all modifications
- Prevention of unauthorized changes
- Audit trail of all updates

---

## 🎨 User Interface Features

### Visual Indicators

- **Green "Create Subject" button** - Appears only if teacher has create permission
- **Purple "Create Lesson" button** - Primary action for content creation
- **Permission notice** - Blue banner explaining teacher capabilities
- **Stats dashboard** - Shows:
  - My Lessons count
  - Pending Approval count
  - Authorized Subjects count
  - Can Create count

### Hierarchy View

The teacher sees the same hierarchy structure as admins:

```
Years (Read-only)
  └── Subjects (Can create/edit if has permission)
      └── Terms (Can create/edit/delete)
          └── Weeks (Can create/edit/delete)
              └── Lessons (Can create/edit/delete)
                  └── Resources (Can manage)
```

---

## 📊 Permission Matrix

| Action | Admin | Teacher with Permission | Teacher without Permission |
|--------|-------|------------------------|---------------------------|
| Create Subject | ✅ Always | ✅ If canCreate | ❌ Denied |
| Edit Subject | ✅ Always | ✅ If canEdit | ❌ Denied |
| Delete Subject | ✅ Always | ✅ If canDelete | ❌ Denied |
| Create Term | ✅ Always | ✅ If canCreate | ❌ Denied |
| Edit Term | ✅ Always | ✅ If canEdit | ❌ Denied |
| Delete Term | ✅ Always | ✅ If canDelete | ❌ Denied |
| Create Week | ✅ Always | ✅ If canCreate | ❌ Denied |
| Edit Week | ✅ Always | ✅ If canEdit | ❌ Denied |
| Delete Week | ✅ Always | ✅ If canDelete | ❌ Denied |
| Create Lesson | ✅ Always | ✅ If canCreate | ❌ Denied |
| Edit Lesson | ✅ Always | ✅ If canEdit | ❌ Denied |
| Delete Lesson | ✅ Always | ✅ If canDelete | ❌ Denied |

---

## 🧪 Testing Guide

### Test Scenario 1: Teacher Creates Subject

1. **As Admin:**
   - Grant teacher permission for Math subject with `canCreate: true`

2. **As Teacher:**
   - Login to teacher dashboard
   - Navigate to Content Management
   - Click "Create Subject"
   - Fill in subject details
   - Submit
   - Verify "Pending Approval" message appears

3. **As Admin:**
   - Review pending subject creation
   - Approve or reject

### Test Scenario 2: Teacher Edits Subject

1. **As Admin:**
   - Grant teacher permission for existing Science subject with `canEdit: true`

2. **As Teacher:**
   - Navigate to Hierarchy View
   - Find Science subject
   - Click Edit button (✏️)
   - Modify subject details
   - Submit
   - Verify "Changes submitted for approval" message

3. **As Admin:**
   - Review pending changes
   - Approve or reject

### Test Scenario 3: Permission Denied

1. **As Teacher (without permission):**
   - Try to click "Create Subject" → Should not appear
   - Try to edit a subject you don't have permission for → Warning message

---

## 🔧 Backend Requirements

The backend must support:

1. **Permission Checking Endpoints:**
   ```
   GET /api/TeacherPermissions/teacher/{teacherId}
   GET /api/TeacherContent/my-subjects
   GET /api/TeacherContent/can-manage/{subjectId}
   ```

2. **CRUD Endpoints for Teachers:**
   ```
   POST /api/Subjects (with teacher permission check)
   PUT /api/Subjects/{id} (with teacher permission check)
   DELETE /api/Subjects/{id} (with teacher permission check)
   POST /api/Terms
   PUT /api/Terms/{id}
   DELETE /api/Terms/{id}
   POST /api/Weeks
   PUT /api/Weeks/{id}
   DELETE /api/Weeks/{id}
   ```

3. **Approval Workflow:**
   - All teacher submissions marked as "Pending Approval"
   - Admin review interface
   - Approval/Rejection mechanism

---

## 📝 Notes

- Teachers **cannot** create/edit Years or Categories (admin only)
- Teachers **cannot** create/edit Subject Names (admin only)
- All teacher actions are logged for audit purposes
- Teachers can only see subjects they have explicit permission for in filtered views
- The hierarchy view shows all content but edit buttons only appear for authorized subjects

---

## ✅ Success Criteria

- ✅ Teachers can create subjects for their permitted categories
- ✅ Teachers can edit subjects they have edit permission for
- ✅ Teachers can create/edit/delete terms, weeks, and lessons in their subjects
- ✅ Permission checks prevent unauthorized access
- ✅ UI clearly indicates what actions are available
- ✅ All changes go through approval workflow
- ✅ Same hierarchical structure as admin view

---

## 🎉 Summary

Teachers now have full content management capabilities for subjects they're authorized to teach, following the same intuitive hierarchical structure as administrators, while maintaining security through permission checks and admin approval requirements.
