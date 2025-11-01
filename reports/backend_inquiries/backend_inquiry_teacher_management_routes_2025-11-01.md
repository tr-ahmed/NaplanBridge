# ❓ Backend Inquiry Report - Teacher Management Routes

**Date:** November 1, 2025  
**Inquiry Topic:** Clarification on Teacher-Specific Management Endpoints  
**Priority:** MEDIUM

---

## 1. Inquiry Topic

Request clarification and confirmation about teacher-specific management endpoints that are required by the Teacher Dashboard but are **not documented** in the current Swagger API documentation.

---

## 2. Reason for Inquiry

The Teacher Dashboard frontend requires several teacher-specific management functionalities:

1. **Grading Interface** - Teachers need to grade student exam submissions
2. **Exam Management** - Teachers need to create, edit, and manage their exams
3. **Class Management** - Teachers need to view and manage their classes
4. **Student Management** - Teachers need to view students enrolled in their subjects

However, the current Swagger documentation (`swagger.json`) does **not include** dedicated teacher management endpoints. It only shows:

### Currently Available (from Swagger):
- ✅ `GET /api/Dashboard/teacher` - Teacher dashboard overview
- ✅ `GET /api/Exam` - Get all exams (but not teacher-specific)
- ✅ `POST /api/Exam` - Create exam (but authorization unclear)
- ✅ `GET /api/Teachings/by-teacher/{teacherId}` - Get subjects taught by teacher

### Missing or Unclear:
- ❓ Grading endpoints for teachers
- ❓ Teacher-specific exam management
- ❓ Teacher-specific student lists
- ❓ Class/subject management for teachers

---

## 3. Requested Details from Backend Team

### 3.1 Exam Grading Endpoints

**Question:** How should teachers grade student exam submissions?

**Expected Endpoints:**
```
GET  /api/Teacher/grade/{studentExamId}
     - Get exam submission details for grading
     - Should include: student info, questions, answers, current scores

POST /api/Teacher/grade/{studentExamId}
     - Submit grades for individual questions
     - Body: { questionId: number, score: number, feedback: string }[]
```

**OR** use existing exam endpoints?
```
GET  /api/Exam/{studentExamId}/result  // Can teacher access this?
PUT  /api/Exam/questions/{questionId}  // Is this for grading?
```

**Please clarify:**
- Which endpoint should be used for grading?
- What is the request/response format?
- How to submit partial vs final grades?
- How to add feedback for each question?

---

### 3.2 Teacher Exam Management

**Question:** How should teachers manage their exams?

**Current Endpoints:**
```
GET  /api/Exam                    // Gets ALL exams (admin only?)
POST /api/Exam                    // Create exam (teacher allowed?)
PUT  /api/Exam/{id}               // Update exam (teacher allowed?)
DELETE /api/Exam/{id}             // Delete exam (teacher allowed?)
GET  /api/Exam/subject/{subjectId} // Get exams by subject
```

**Please clarify:**
- Can teachers use `POST /api/Exam` to create exams?
- Can teachers use `PUT /api/Exam/{id}` to update their own exams only?
- Is there authorization check that teachers can only modify their own exams?
- Should there be a dedicated `/api/Teacher/exams` endpoint instead?

**Suggested Teacher-Specific Endpoints:**
```
GET  /api/Teacher/exams           // Get only teacher's exams
POST /api/Teacher/exams           // Create exam for teacher's subject
PUT  /api/Teacher/exams/{id}      // Update teacher's own exam
DELETE /api/Teacher/exams/{id}    // Delete teacher's own exam
GET  /api/Teacher/exams/{id}/submissions  // Get all student submissions
```

---

### 3.3 Teacher Class/Subject Management

**Question:** How should teachers view and manage their classes?

**Current Endpoints:**
```
GET /api/Teachings/by-teacher/{teacherId}  // Get subjects taught
GET /api/Subjects/{id}                     // Get subject details
```

**Missing Information:**
- How to get list of students enrolled in teacher's subject?
- How to view class statistics (average scores, completion rates)?
- How to view class roster with student details?

**Suggested Endpoints:**
```
GET /api/Teacher/classes
    // Returns list of classes (subjects) taught by teacher

GET /api/Teacher/classes/{subjectId}/students
    // Returns students enrolled in this subject
    
GET /api/Teacher/classes/{subjectId}/statistics
    // Returns class performance statistics
```

**OR** use existing endpoints differently?
```
GET /api/Subjects/{id}  
    // Should this include enrolled students for teachers?
    
GET /api/StudentSubjects/...  
    // Is there a way to query by subject for teacher?
```

---

### 3.4 Teacher Students Management

**Question:** How should teachers view their students?

**Current Endpoints:**
```
GET /api/User/my-students  // Is this for teachers or parents?
```

**Please clarify:**
- Does `/api/User/my-students` work for teachers?
- Does it return students from ALL subjects taught by the teacher?
- What information is included in the response?

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "studentId": 123,
      "fullName": "Ahmed Hassan",
      "email": "ahmed@example.com",
      "subjects": ["Mathematics", "Science"],
      "averageScore": 85.5,
      "completedExams": 12,
      "pendingExams": 2
    }
  ]
}
```

**Suggested Alternative:**
```
GET /api/Teacher/students
    // Returns all students across teacher's subjects
    
GET /api/Teacher/students/{subjectId}
    // Returns students in specific subject
```

---

## 4. Proposed Solution Options

### Option A: Use Existing Endpoints (Recommended)
If current endpoints already support teacher operations:
- Update documentation to clarify teacher authorization
- Provide examples of how teachers should use existing endpoints
- Confirm which endpoints are teacher-accessible

### Option B: Create Teacher-Specific Endpoints
Create dedicated teacher controller with clear separation:
```
/api/Teacher/exams/*
/api/Teacher/classes/*
/api/Teacher/students/*
/api/Teacher/grade/*
```

### Option C: Hybrid Approach
Use existing endpoints where sufficient, create new ones where needed:
- Keep `/api/Exam` for CRUD operations (with role checks)
- Add `/api/Teacher/grade/{studentExamId}` for grading workflow
- Add `/api/Teacher/students` for student lists
- Use `/api/Teachings` for class information

---

## 5. Frontend Implementation Status

**Current Status:**
- Teacher Dashboard is implemented and working
- Navigation to grading/exam pages shows "Coming Soon" messages
- Frontend is ready to implement pages once endpoints are clarified

**Blocked Features:**
- ❌ Exam grading interface
- ❌ Exam creation/editing pages
- ❌ Class management pages
- ❌ Student list pages

**Workaround:**
- Dashboard shows basic statistics
- Links temporarily disabled with toast notifications
- All features ready to implement once endpoints confirmed

---

## 6. Questions Summary

1. **Grading:** Which endpoint(s) should be used for grading student exams?
2. **Exam CRUD:** Can teachers use existing `/api/Exam/*` endpoints, or need teacher-specific?
3. **Authorization:** How is it ensured teachers only access their own data?
4. **Students List:** Does `/api/User/my-students` work for teachers? What does it return?
5. **Class Roster:** How to get list of students in a specific subject/class?
6. **Statistics:** How to get class performance metrics?

---

## 7. Urgency Level

**MEDIUM Priority** ⚠️

While the basic Teacher Dashboard works, the missing endpoints block important teacher workflows:
- Teachers cannot grade exams through the UI
- Teachers cannot create/manage exams through the UI
- Teachers cannot view detailed student information

These features are expected by teachers and should be implemented soon.

---

## 8. Recommended Next Steps

1. **Backend Team:** Review this inquiry and provide clarification
2. **Backend Team:** Update Swagger documentation with teacher-specific endpoints
3. **Backend Team:** Provide example requests/responses for each endpoint
4. **Frontend Team:** Implement teacher management pages once endpoints are confirmed
5. **Testing:** Coordinate testing of teacher workflows

---

## 9. Related Documents

- `backend_change_teacher_dashboard_2025-11-01.md` - Enhanced dashboard endpoint
- `swagger.json` - Current API documentation
- Frontend implementation: `src/app/features/teacher-dashboard/`

---

**Report Generated:** November 1, 2025  
**Status:** Awaiting Backend Team Response  
**Frontend Contact:** Angular Development Team  
**Backend Contact:** .NET API Team
