# 🧪 Admin Exams Testing Guide - دليل اختبار الامتحانات في لوحة التحكم

## ✅ التحقق من التصحيحات المطبقة

تم تطبيق التصحيحات التالية لتفعيل Create و Edit للامتحانات في `/admin/exams`:

### 1. ✅ Updated CreateEditExamComponent to Accept Admin Users
**File:** `src/app/features/create-edit-exam/create-edit-exam.component.ts`

**Change:** Modified ngOnInit() to accept both Teacher and Admin roles:
```typescript
// ✅ Check if user has Teacher or Admin role (could be string or array)
const userRoles = Array.isArray(currentUser.role) ? currentUser.role : [currentUser.role];
const isTeacherOrAdmin = userRoles.includes('Teacher') || userRoles.includes('admin');

if (isTeacherOrAdmin) {
  this.loadSubjects();
  this.checkEditMode();
} else {
  console.warn('⚠️ User is not a Teacher or Admin. Roles:', userRoles);
  this.router.navigate(['/login']);
}
```

**Impact:** Admin users can now access the create and edit exam pages.

---

### 2. ✅ Routes Configuration
**File:** `src/app/app.routes.ts` (lines 176-190)

Routes are properly configured with admin guards:
```typescript
{
  path: 'admin/exams',
  loadComponent: () => import('./features/exam-management/exam-management.component').then(m => m.ExamManagementComponent),
  canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
},
{
  path: 'admin/exam/create',
  loadComponent: () => import('./features/create-edit-exam/create-edit-exam.component').then(m => m.CreateEditExamComponent),
  canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
},
{
  path: 'admin/exam/edit/:id',
  loadComponent: () => import('./features/create-edit-exam/create-edit-exam.component').then(m => m.CreateEditExamComponent),
  canActivate: [authGuard, () => inject(AuthService).hasRole('admin')]
}
```

---

### 3. ✅ ExamManagementComponent Navigation
**File:** `src/app/features/exam-management/exam-management.component.ts` (lines 248-280)

Navigation methods are correctly configured:
```typescript
createExam(): void {
  this.router.navigate(['/admin/exam/create']);
}

editExam(examId: number, event?: Event): void {
  event?.stopPropagation();
  this.router.navigate(['/admin/exam/edit', examId]);
}
```

---

### 4. ✅ HTML Buttons
**File:** `src/app/features/exam-management/exam-management.component.html`

- **Create Button:** Line 17-23 - "Create Exam" button triggers `createExam()`
- **Edit Buttons:** Lines 317 and 438 - Edit icons trigger `editExam()`

---

## 🧪 Testing Steps

### Prerequisites
1. Server running: `npm run start` (should be running on http://localhost:4200)
2. Backend API accessible at: `https://naplan2.runasp.net/api`

### Test Scenario 1: Access Admin Exams Page
1. Navigate to: `http://localhost:4200/admin/exams`
2. You should see the "Exam Management" page with:
   - ✅ "Create Exam" button in the top right
   - ✅ List/Grid of existing exams
   - ✅ Edit and Delete buttons for each exam

**Expected:** Page loads and displays exam list with action buttons

---

### Test Scenario 2: Create New Exam
1. Click the "Create Exam" button
2. You should be redirected to: `http://localhost:4200/admin/exam/create`
3. Form should load with fields for:
   - Title
   - Description
   - Exam Type (Lesson, Monthly, Term)
   - Subject
   - Year
   - Duration
   - Questions (with options to add multiple questions)
4. Fill in the form and click "Save & Publish" or "Save as Draft"
5. After saving, you should be redirected back to: `/admin/exams`

**Expected:** 
- ✅ Form loads successfully
- ✅ All input fields are functional
- ✅ Can add/remove questions
- ✅ Save redirects back to exam list

---

### Test Scenario 3: Edit Existing Exam
1. On `/admin/exams` page, find an exam
2. Click the Edit button (pencil icon)
3. You should be redirected to: `http://localhost:4200/admin/exam/edit/{examId}`
4. Form should load with existing exam data:
   - ✅ Title populated
   - ✅ Questions populated
   - ✅ All fields pre-filled
5. Make changes (e.g., add new questions)
6. Click "Save" button
7. If adding new questions in edit mode:
   - System should detect new questions (count > original count)
   - New questions should be POSTed to `/api/exam/{examId}/questions`
   - After all saves complete, redirect to `/admin/exams`

**Expected:**
- ✅ Existing data loads correctly
- ✅ Can modify exam details
- ✅ Can add new questions
- ✅ New questions save via separate API call
- ✅ Redirect back to exam list after save

---

### Test Scenario 4: Cancel Operations
1. On either Create or Edit page, click Cancel
2. Should redirect back to: `/admin/exams`

**Expected:** ✅ Redirect without saving changes

---

## 🔍 Debugging

### Check Browser Console for Messages:

**Expected Log Messages:**
```javascript
// When navigating to edit page:
"📍 Route detected: admin/exam/edit/123 Is Admin: true"

// When saving in edit mode:
"✅ Exam updated successfully: {...}"
"📌 Found 1 new questions to add"
"➕ Adding new question 1: {...}"
"✅ Question 1 added successfully"
"✅ All new questions added successfully"
"✅ Exam saved successfully!"

// When creating new exam:
"✅ Exam created successfully: {...}"
"✅ Exam saved successfully!"
```

---

## 📋 Checklist

- [ ] Successfully login with admin account
- [ ] `/admin/exams` page loads and shows exam list
- [ ] "Create Exam" button navigates to `/admin/exam/create`
- [ ] Create exam form loads successfully
- [ ] Can add/remove questions in create form
- [ ] Saving new exam redirects to `/admin/exams`
- [ ] "Edit" button on exam navigates to `/admin/exam/edit/:id`
- [ ] Edit form loads with existing data
- [ ] Can modify exam details
- [ ] Can add new questions in edit mode
- [ ] New questions save correctly via API
- [ ] Saving exam redirects to `/admin/exams`
- [ ] Cancel buttons work correctly

---

## 🚀 Next Steps

If all tests pass:
1. Verify that exams created/edited are persisted in the backend
2. Test with different question types (Text, Multiple Choice, etc.)
3. Test publishing and unpublishing exams
4. Test with various exam types (Lesson, Monthly, Term)

---

## ⚠️ Potential Issues

### Issue 1: "User is not authorized" when accessing admin routes
**Cause:** User doesn't have 'admin' role in the backend
**Solution:** Ensure logged-in user has admin role assigned in backend

### Issue 2: Backend API returns 404 or 500 errors
**Cause:** Backend endpoint issues
**Solution:** Check backend logs and verify API endpoints are implemented

### Issue 3: Questions don't save in edit mode
**Cause:** `addQuestion()` method not implemented or endpoint not working
**Solution:** Check that ExamService.addQuestion() calls correct endpoint: `POST /api/exam/{examId}/questions`

### Issue 4: "Port 4200 is already in use"
**Solution:** 
```powershell
# Kill the process using port 4200
taskkill /PID <PID> /F
# Or use a different port
ng serve --port 4201
```

---

## 📞 Support

For issues or questions, check:
1. Browser console for error messages
2. Network tab in DevTools to see API calls
3. Backend logs for server errors
