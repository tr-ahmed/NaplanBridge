# 📌 BACKEND REQUEST - Student Details for Parent View

**Date:** 2025-11-23  
**From:** Frontend Team  
**To:** Backend Team  
**Priority:** HIGH  
**Status:** 🔴 REQUIRED - Current navigation broken

---

## ⚠️ Current Problem

في الـ Parent Dashboard، في زرارين في كل student card:

1. **"View Details"** - المفروض يعرض تفاصيل الطالب
2. **"Settings" (⚙️)** - المفروض يفتح إعدادات الطالب

**المشكلة الحالية:**
- الـ endpoints الموجودة مش مناسبة للـ parent view
- `/courses?studentId={childId}` → بيجيب كل الكورسات عادي (مش مخصص للطالب)
- `/profile` → بيفتح profile الـ parent نفسه (مش الطفل)

**المطلوب:**
- Endpoint جديد يجيب تفاصيل الطالب المحدد للـ parent
- صفحة frontend مخصصة لعرض تفاصيل الطفل من منظور الـ parent

---

## 📋 Required Backend Endpoints

### 1. Get Student Details for Parent 🆕

**Endpoint:**
```
GET /api/Parent/student/{studentId}/details
```

**Authentication:**
- Required: Bearer Token
- Role: Parent only
- Validation: studentId must belong to the authenticated parent

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 123,
      "userName": "Ahmed Ali",
      "email": "ahmed@example.com",
      "age": 12,
      "yearId": 7,
      "yearName": "Year 7",
      "avatar": "https://...",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "progress": {
      "overallProgress": 75,
      "completedLessons": 45,
      "totalLessons": 60,
      "averageScore": 85,
      "timeSpent": 2400,
      "lastActivityDate": "2024-11-20T14:30:00Z"
    },
    "activeSubscriptions": [
      {
        "id": 1,
        "planId": 5,
        "planName": "Mathematics Term 1",
        "planType": "SingleTerm",
        "subject": "Mathematics",
        "subjectId": 3,
        "yearId": 7,
        "startDate": "2024-01-15T00:00:00Z",
        "expiryDate": "2024-06-30T00:00:00Z",
        "daysRemaining": 45,
        "isActive": true,
        "price": 29.99
      }
    ],
    "subjects": [
      {
        "subjectId": 3,
        "subjectName": "Mathematics",
        "progress": 80,
        "completedLessons": 15,
        "totalLessons": 20,
        "hasActiveSubscription": true,
        "lastAccessed": "2024-11-20T14:30:00Z"
      }
    ],
    "upcomingExams": [
      {
        "examId": 10,
        "title": "Math Term 1 Final",
        "subject": "Mathematics",
        "startDate": "2024-12-01T09:00:00Z",
        "duration": 60,
        "totalMarks": 100,
        "status": "scheduled"
      }
    ],
    "recentActivities": [
      {
        "id": 1,
        "type": "lesson",
        "description": "Completed Lesson: Introduction to Algebra",
        "subject": "Mathematics",
        "date": "2024-11-20T14:30:00Z",
        "progress": 100,
        "score": 90
      },
      {
        "id": 2,
        "type": "exam",
        "description": "Took Exam: Math Quiz 5",
        "subject": "Mathematics",
        "date": "2024-11-18T10:00:00Z",
        "progress": 100,
        "score": 85
      }
    ],
    "stats": {
      "totalTimeSpent": 2400,
      "averageScore": 85,
      "completionRate": 75,
      "strongestSubject": "Mathematics",
      "weakestSubject": "Science",
      "totalExamsTaken": 12,
      "totalExamsPassed": 10
    }
  }
}
```

**Error Cases:**
```json
// studentId doesn't belong to parent
{
  "success": false,
  "message": "You don't have permission to view this student's details",
  "statusCode": 403
}

// studentId not found
{
  "success": false,
  "message": "Student not found",
  "statusCode": 404
}
```

---

### 2. Get Student Subscriptions for Parent 🆕

**Endpoint:**
```
GET /api/Parent/student/{studentId}/subscriptions
```

**Query Parameters:**
- `includeExpired` (optional, default: false) - Include expired subscriptions
- `page` (optional, default: 1)
- `pageSize` (optional, default: 10)

**Authentication:**
- Required: Bearer Token
- Role: Parent only
- Validation: studentId must belong to the authenticated parent

**Response:**
```json
{
  "success": true,
  "data": {
    "active": [
      {
        "id": 1,
        "planId": 5,
        "planName": "Mathematics Term 1",
        "planType": "SingleTerm",
        "subject": "Mathematics",
        "subjectId": 3,
        "yearId": 7,
        "startDate": "2024-01-15T00:00:00Z",
        "expiryDate": "2024-06-30T00:00:00Z",
        "daysRemaining": 45,
        "isActive": true,
        "price": 29.99,
        "coverage": "Term 1",
        "autoRenew": false
      }
    ],
    "expired": [
      {
        "id": 2,
        "planName": "Science Term 1",
        "expiryDate": "2024-05-30T00:00:00Z",
        "isActive": false
      }
    ],
    "totalActive": 3,
    "totalExpired": 2,
    "totalSpent": 89.97
  }
}
```

---

### 3. Update Student Profile by Parent 🆕

**Endpoint:**
```
PUT /api/Parent/student/{studentId}/profile
```

**Request Body:**
```json
{
  "userName": "Ahmed Ali Updated",
  "email": "ahmed.new@example.com",
  "age": 13,
  "yearId": 8
}
```

**Authentication:**
- Required: Bearer Token
- Role: Parent only
- Validation: studentId must belong to the authenticated parent

**Response:**
```json
{
  "success": true,
  "message": "Student profile updated successfully",
  "data": {
    "id": 123,
    "userName": "Ahmed Ali Updated",
    "email": "ahmed.new@example.com",
    "age": 13,
    "yearId": 8
  }
}
```

---

### 4. Get Student Progress by Subject 🆕

**Endpoint:**
```
GET /api/Parent/student/{studentId}/progress/{subjectId}
```

**Authentication:**
- Required: Bearer Token
- Role: Parent only

**Response:**
```json
{
  "success": true,
  "data": {
    "subjectId": 3,
    "subjectName": "Mathematics",
    "yearId": 7,
    "overallProgress": 80,
    "lessons": [
      {
        "lessonId": 1,
        "lessonName": "Introduction to Algebra",
        "progress": 100,
        "completed": true,
        "score": 90,
        "timeSpent": 45,
        "lastAccessed": "2024-11-20T14:30:00Z"
      },
      {
        "lessonId": 2,
        "lessonName": "Linear Equations",
        "progress": 60,
        "completed": false,
        "score": null,
        "timeSpent": 20,
        "lastAccessed": "2024-11-19T10:00:00Z"
      }
    ],
    "exams": [
      {
        "examId": 1,
        "examTitle": "Math Quiz 1",
        "score": 85,
        "maxScore": 100,
        "percentage": 85,
        "takenAt": "2024-11-18T10:00:00Z",
        "passed": true
      }
    ],
    "stats": {
      "completedLessons": 15,
      "totalLessons": 20,
      "averageScore": 85,
      "totalTimeSpent": 450,
      "lastActivityDate": "2024-11-20T14:30:00Z"
    }
  }
}
```

---

## 🎯 Use Cases

### Use Case 1: Parent Views Child Details
```
User Story: As a parent, I want to see my child's overall learning progress
Flow:
1. Parent clicks "View Details" on student card
2. Frontend calls: GET /api/Parent/student/{studentId}/details
3. Display student details page with:
   - Student info
   - Overall progress
   - Active subscriptions
   - Recent activities
   - Upcoming exams
   - Subject-wise breakdown
```

### Use Case 2: Parent Manages Child Settings
```
User Story: As a parent, I want to update my child's profile information
Flow:
1. Parent clicks "Settings" (⚙️) on student card
2. Frontend calls: GET /api/Parent/student/{studentId}/details
3. Display editable form
4. Parent updates info
5. Frontend calls: PUT /api/Parent/student/{studentId}/profile
6. Show success message
```

### Use Case 3: Parent Views Subscriptions
```
User Story: As a parent, I want to see all my child's subscriptions
Flow:
1. Parent navigates to subscriptions tab
2. Frontend calls: GET /api/Parent/student/{studentId}/subscriptions
3. Display active and expired subscriptions
4. Show renewal options
```

---

## 🔒 Security Requirements

### Authorization Rules:
1. **Parent-Child Relationship Validation:**
   - Backend MUST verify that the studentId belongs to the authenticated parent
   - Return 403 Forbidden if student doesn't belong to parent

2. **Data Privacy:**
   - Parent can only access their own children's data
   - No cross-parent data access allowed

3. **JWT Token Validation:**
   - All endpoints require valid Bearer token
   - Token must contain parent's userId
   - Token role must be "parent"

### Example Validation (Backend Pseudo-code):
```csharp
// In Parent Controller
[HttpGet("student/{studentId}/details")]
[Authorize(Roles = "Parent")]
public async Task<IActionResult> GetStudentDetails(int studentId)
{
    var parentId = GetCurrentUserId(); // From JWT token
    
    // Validate parent-child relationship
    var isParentOfStudent = await _userService
        .IsParentOfStudent(parentId, studentId);
    
    if (!isParentOfStudent)
    {
        return Forbid("You don't have permission to view this student's details");
    }
    
    // Proceed with fetching student details
    var details = await _studentService.GetStudentDetails(studentId);
    
    return Ok(new { success = true, data = details });
}
```

---

## 📊 Database Impact

### Expected Queries:
1. Join Students with Parents (validate relationship)
2. Join Students with Progress
3. Join Students with Subscriptions (where isActive = true)
4. Join Students with Exams
5. Join Students with Activities

### Performance Considerations:
- Add index on Students.ParentId
- Add index on Subscriptions (StudentId, IsActive, ExpiryDate)
- Add index on Progress (StudentId, SubjectId)
- Consider caching for frequently accessed student details

---

## 🧪 Testing Requirements

### Test Cases:

**1. Happy Path:**
```
✅ Parent can view their child's details
✅ Parent can view child's subscriptions
✅ Parent can update child's profile
✅ All data returned correctly formatted
```

**2. Security Tests:**
```
❌ Parent cannot view another parent's child
❌ Unauthenticated request returns 401
❌ Non-parent role returns 403
❌ Invalid studentId returns 404
```

**3. Data Validation:**
```
✅ All dates in ISO 8601 format
✅ Progress percentages between 0-100
✅ DaysRemaining calculated correctly
✅ IsActive flag accurate based on expiryDate
```

---

## 📅 Implementation Priority

### Phase 1: Essential (ASAP)
- ✅ GET /api/Parent/student/{studentId}/details
- ✅ Security validation (parent-child relationship)

### Phase 2: Important (This Week)
- ✅ GET /api/Parent/student/{studentId}/subscriptions
- ✅ PUT /api/Parent/student/{studentId}/profile

### Phase 3: Nice to Have (Next Week)
- ✅ GET /api/Parent/student/{studentId}/progress/{subjectId}
- ✅ Advanced filtering and sorting options

---

## 🔄 Frontend Implementation Plan

Once backend endpoints are ready, frontend will create:

### New Component: `student-details-for-parent`
**Route:** `/parent/student/:id`

**Features:**
- Student overview card
- Progress charts
- Active subscriptions list
- Recent activities timeline
- Upcoming exams calendar
- Subject-wise breakdown
- Quick actions (Add subscription, View reports)

**Navigation:**
```
Parent Dashboard → "View Details" → /parent/student/123
Parent Dashboard → "Settings" (⚙️) → /parent/student/123?tab=settings
```

---

## 📝 Response Format Standards

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "errors": {
    "fieldName": ["Error message"]
  }
}
```

---

## ❓ Questions for Backend Team

1. **Data Availability:**
   - هل كل البيانات دي متوفرة حاليا في الـ database؟
   - هل في حاجة ناقصة محتاجين نضيفها؟

2. **Performance:**
   - Expected response time for student details endpoint?
   - Maximum number of activities to return?

3. **Caching:**
   - Should we cache student details?
   - Cache expiration time?

4. **Pagination:**
   - Do we need pagination for activities/subscriptions?
   - Default page size?

---

## 📞 Contact

**Frontend Team Lead:** GitHub Copilot  
**Slack Channel:** #frontend-backend-integration  
**Priority:** HIGH - Parent dashboard navigation currently broken  

---

## ✅ Acceptance Criteria

Backend implementation is complete when:

- ✅ All 4 endpoints implemented and tested
- ✅ Security validation working (parent-child relationship)
- ✅ Response format matches specification
- ✅ All test cases pass
- ✅ API documentation updated (Swagger)
- ✅ Frontend team notified when ready

---

**Status:** 🔴 WAITING FOR BACKEND IMPLEMENTATION  
**Created:** 2025-11-23  
**Expected Completion:** TBD by Backend Team

---

**Note to Backend Team:**  
الـ parent dashboard حاليا الـ navigation مش شغال للزرارين دول. محتاجين الـ endpoints دي عشان نعمل الصفحة المخصصة لعرض تفاصيل الطفل. شكرا! 🙏
