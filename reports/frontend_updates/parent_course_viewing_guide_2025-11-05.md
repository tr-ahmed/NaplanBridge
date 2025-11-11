# 🎯 Parent Dashboard - View Courses Integration Guide

**Date:** November 5, 2025  
**Feature:** Parent can view courses for selected student  
**Status:** ✅ READY

---

## 🔧 How It Works

### Scenario: Parent with Multiple Children

```
Parent Dashboard
  ├─ Student 1 (Ahmed - Year 7)
  ├─ Student 2 (Sara - Year 8)
  └─ Student 3 (Omar - Year 7)
```

When parent clicks **"View Courses"** for a specific student:

1. Navigate to `/courses` with `studentId` and `yearId` params
2. Courses page auto-filters by student's year
3. "View Lessons" and "Continue Learning" work with selected student

---

## 📋 Implementation

### In Parent Dashboard Component

```typescript
// parent-dashboard.component.ts

interface Student {
  id: number;
  name: string;
  email: string;
  yearId: number;
  yearName: string;
}

/**
 * Navigate to courses page for specific student
 */
viewCoursesForStudent(student: Student): void {
  console.log('📚 Viewing courses for student:', student);
  
  this.router.navigate(['/courses'], {
    queryParams: {
      studentId: student.id,      // ✅ Used by "View Lessons" and "Continue Learning"
      yearId: student.yearId       // ✅ Auto-filter courses by student's year
    }
  });
}
```

### In Parent Dashboard Template

```html
<!-- parent-dashboard.component.html -->

<div class="students-list">
  @for (student of students(); track student.id) {
    <div class="student-card">
      <div class="student-info">
        <h3>{{ student.name }}</h3>
        <p class="text-gray-600">{{ student.yearName }} • {{ student.email }}</p>
      </div>
      
      <div class="student-actions">
        <!-- View Courses Button -->
        <button
          (click)="viewCoursesForStudent(student)"
          class="btn-primary">
          📚 View Courses
        </button>
        
        <!-- View Progress Button -->
        <button
          (click)="viewProgressForStudent(student)"
          class="btn-secondary">
          📊 View Progress
        </button>
      </div>
    </div>
  }
</div>
```

---

## 🔄 Data Flow

### Step 1: Parent Selects Student
```typescript
// Parent clicks "View Courses" for Ahmed (Year 7)
viewCoursesForStudent({
  id: 123,
  name: 'Ahmed',
  yearId: 1,
  yearName: 'Year 7'
})
```

### Step 2: Navigate with Params
```typescript
this.router.navigate(['/courses'], {
  queryParams: {
    studentId: 123,  // Ahmed's ID
    yearId: 1        // Year 7
  }
});

// URL: http://localhost:4200/courses?studentId=123&yearId=1
```

### Step 3: Courses Component Receives Params
```typescript
// courses.component.ts - handleQueryParameters()

if (params['studentId']) {
  this.selectedStudentId.set(123);  // ✅ Store for "View Lessons"
}

if (params['yearId']) {
  this.selectedYearId.set(1);       // ✅ Auto-filter to Year 7 courses
}
```

### Step 4: Courses Filtered by Year
```typescript
// Only shows courses for Year 7
filteredCourses = [
  { id: 1, name: 'Algebra Year 7', yearId: 1 },
  { id: 2, name: 'English Year 7', yearId: 1 },
  { id: 3, name: 'Science Year 7', yearId: 1 }
]
```

### Step 5: Parent Clicks "View Lessons"
```typescript
// courses.component.ts - viewLessons()

const user = this.authService.getCurrentUser();

if (user?.role === 'Parent') {
  // ✅ Get studentId from URL params
  studentId = this.selectedStudentId();  // 123 (Ahmed)
  
  // Navigate to lessons for Ahmed
  this.router.navigate(['/lessons'], {
    queryParams: {
      subjectId: course.id,
      studentId: 123,  // ✅ Ahmed's ID
      ...
    }
  });
}
```

---

## ✅ Features

### 1. **Auto-Filter by Year**
- Parent selects Year 7 student → Only Year 7 courses shown
- Parent selects Year 8 student → Only Year 8 courses shown

### 2. **Student Context Preservation**
- Selected student ID stored in component
- Works across "View Lessons" and "Continue Learning"
- No need to re-select student

### 3. **Clear Navigation**
- URL contains both `studentId` and `yearId`
- Parent can bookmark specific student's courses
- Browser back button works correctly

---

## 🎨 UI/UX Considerations

### Parent Dashboard
```
┌─────────────────────────────────────────┐
│  My Children                            │
├─────────────────────────────────────────┤
│  👤 Ahmed - Year 7                      │
│     ahmed@email.com                     │
│     [📚 View Courses] [📊 Progress]     │
├─────────────────────────────────────────┤
│  👤 Sara - Year 8                       │
│     sara@email.com                      │
│     [📚 View Courses] [📊 Progress]     │
└─────────────────────────────────────────┘
```

### Courses Page (After Selection)
```
┌─────────────────────────────────────────┐
│  Courses for: Ahmed (Year 7)           │
├─────────────────────────────────────────┤
│  📚 Algebra Year 7                      │
│     [✓ Continue Learning] [View Lessons]│
├─────────────────────────────────────────┤
│  📚 English Year 7                      │
│     [Add to Cart] [View Lessons]        │
└─────────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Test 1: Parent with Multiple Children in Same Year
```typescript
Parent has:
- Ahmed (Year 7)
- Omar (Year 7)

Expected:
1. Click "View Courses" for Ahmed → See Year 7 courses
2. Click "View Courses" for Omar → See Year 7 courses (same list)
3. Both can access same courses with different progress
```

### Test 2: Parent with Children in Different Years
```typescript
Parent has:
- Ahmed (Year 7)
- Sara (Year 8)

Expected:
1. Click "View Courses" for Ahmed → See Year 7 courses only
2. Click "View Courses" for Sara → See Year 8 courses only
3. No overlap between course lists
```

### Test 3: View Lessons Works
```typescript
1. Parent selects Ahmed (Year 7)
2. Navigates to courses
3. Clicks "View Lessons" on Algebra
4. Should open lessons for Ahmed
5. Should NOT redirect to parent dashboard
```

### Test 4: Continue Learning Works
```typescript
1. Parent selects Ahmed (enrolled in Algebra)
2. Clicks "Continue Learning"
3. Should navigate to Ahmed's last incomplete lesson
4. Should show Ahmed's progress
```

---

## 🐛 Error Handling

### No Student Selected
```typescript
// If parent navigates to /courses directly (no params)
if (user?.role === 'Parent' && !this.selectedStudentId()) {
  this.toastService.showInfo('Please select a student from your dashboard first.');
  this.router.navigate(['/parent-dashboard']);
}
```

### Invalid Student ID
```typescript
// If studentId param is invalid
if (params['studentId']) {
  const studentId = parseInt(params['studentId'], 10);
  if (isNaN(studentId)) {
    console.error('Invalid studentId param');
    this.router.navigate(['/parent-dashboard']);
  }
}
```

---

## 📊 Example API Calls

### When Parent Clicks "View Lessons"
```http
GET /api/Courses/1/current-term-week?studentId=123
```

**Response:**
```json
{
  "currentTermNumber": 3,
  "currentTermName": "Term 3",
  "currentWeekNumber": 5,
  "hasAccess": true,
  "progressPercentage": 45.5
}
```

### When Parent Clicks "Continue Learning"
```http
GET /api/Courses/1/lessons-with-progress?studentId=123
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Introduction to Algebra",
    "progress": 100,
    "completed": true
  },
  {
    "id": 2,
    "name": "Linear Equations",
    "progress": 45,
    "completed": false
  }
]
```

---

## ✅ Checklist

### Frontend (Courses Component)
- [x] Accept `studentId` from query params
- [x] Accept `yearId` from query params
- [x] Store `selectedStudentId` in signal
- [x] Auto-filter courses by `yearId`
- [x] Pass `studentId` to "View Lessons"
- [x] Pass `studentId` to "Continue Learning"
- [x] Handle Parent role in both methods

### Parent Dashboard (To Implement)
- [ ] Add "View Courses" button per student
- [ ] Pass `studentId` and `yearId` in navigation
- [ ] Show student name in UI
- [ ] Handle multiple students

### Backend (No Changes Required)
- [x] Endpoints already accept `studentId` parameter
- [x] Authentication validates parent has access to student
- [x] Progress tracking per student works

---

## 🚀 Deployment

### Step 1: Update Parent Dashboard
Add the navigation logic to parent dashboard component.

### Step 2: Test Navigation
1. Login as parent
2. Select a student
3. Verify courses are filtered by student's year
4. Click "View Lessons" → Should work
5. Click "Continue Learning" → Should work

### Step 3: Monitor Logs
Check console for:
```
✅ Selected student ID from params: 123
✅ Selected year ID from params: 1
📚 Fetching current term/week for student: 123
```

---

## 📝 Notes

- **No Backend Changes Required** - All endpoints already support `studentId` parameter
- **Backward Compatible** - Students continue to work as before
- **Secure** - Backend validates parent has access to selected student
- **Scalable** - Works with any number of children

---

**Status:** ✅ **READY FOR PARENT DASHBOARD IMPLEMENTATION**

**Next Step:** Add "View Courses" button in Parent Dashboard component

---

**Implementation Date:** November 5, 2025  
**Feature:** Parent Course Viewing  
**Version:** 1.0
