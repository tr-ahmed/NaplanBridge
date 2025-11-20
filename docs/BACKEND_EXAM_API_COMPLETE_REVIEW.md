# 📋 Exam System - Complete Backend API Review
**For:** Backend Development Team  
**Date:** November 20, 2025  
**Scope:** All exam-related endpoints & issues

---

## 📌 Overview

This document lists **ALL exam-related endpoints** and identifies issues that need backend attention for the exam system to work correctly.

---

## 📍 Endpoint #1: Start Exam

### Endpoint Details
```
POST /api/Exam/{examId}/start
```

### Current Implementation (Expected)
```csharp
[HttpPost("{examId}/start")]
public IActionResult StartExam(int examId)
{
    var exam = _context.Exams.Find(examId);
    var studentId = GetCurrentUserId();
    
    // Create new student exam attempt
    var studentExam = new StudentExam
    {
        StudentId = studentId,
        ExamId = examId,
        StartedAt = DateTime.UtcNow,
        Status = "InProgress"
    };
    
    _context.StudentExams.Add(studentExam);
    _context.SaveChanges();
    
    return Ok(new { 
        studentExamId = studentExam.Id,
        startTime = studentExam.StartedAt,
        durationInMinutes = exam.DurationInMinutes
    });
}
```

### Required Validations
- ✅ Exam exists
- ✅ Student exists
- ✅ Student has subscription to this subject
- ✅ Exam hasn't started yet (startTime <= now)
- ✅ Exam hasn't ended yet (endTime > now)
- ✅ Student hasn't already started this exam
- ✅ Student isn't in another exam right now

### Error Scenarios
```json
// 400: Exam not available yet
{
  "message": "Exam not available yet",
  "availableAt": "2025-11-21T10:00:00Z"
}

// 400: Exam already ended
{
  "message": "Exam has ended",
  "endedAt": "2025-11-20T14:00:00Z"
}

// 400: Student already attempted this exam
{
  "message": "You have already attempted this exam",
  "previousAttemptId": 456,
  "submittedAt": "2025-11-19T15:30:00Z"
}

// 403: No subscription access
{
  "message": "You don't have access to this exam",
  "requiredSubscription": "Mathematics - Term 1"
}
```

---

## 📍 Endpoint #2: Get Exam Questions

### Endpoint Details
```
GET /api/Exam/{examId}/questions
```

### Expected Response
```json
{
  "examId": 123,
  "title": "Mathematics Term 1 Test",
  "durationInMinutes": 60,
  "totalMarks": 100,
  "questions": [
    {
      "id": 1,
      "questionText": "What is 2 + 2?",
      "marks": 5,
      "questionType": "MultipleChoice",
      "options": [
        {
          "id": 10,
          "optionText": "3",
          "sequence": 1
        },
        {
          "id": 11,
          "optionText": "4",
          "sequence": 2
        },
        {
          "id": 12,
          "optionText": "5",
          "sequence": 3
        }
      ]
    }
  ]
}
```

### Issues to Check
- ✅ Questions load in correct order (by sequence/order)
- ✅ All question types present: Text, MultipleChoice, MultipleSelect, TrueFalse
- ✅ Options include all required fields (id, optionText, sequence)
- ✅ Question IDs match the actual question IDs in database
- ✅ No null values in required fields

---

## 📍 Endpoint #3: Submit Exam (CRITICAL)

### Endpoint Details
```
POST /api/Exam/submit
```

### Request Body
```json
{
  "studentExamId": 123,
  "answers": [
    {
      "questionId": 1,
      "textAnswer": "My answer text",
      "selectedOptionIds": [10]
    },
    {
      "questionId": 2,
      "selectedOptionIds": [20, 22]
    }
  ]
}
```

### Current Issues (TO BE FIXED)
1. ❌ **No check for already submitted**
   - Same exam submitted twice → Error
   - Should return 409 Conflict instead

2. ❌ **No validation of answer format**
   - Invalid question ID → Should reject
   - Empty answers → Should accept (unanswered)
   - Wrong number of options → Should validate

3. ❌ **No concurrency handling**
   - Race condition if 2 submit at same time
   - Should lock/flag immediately

### Required Changes
See detailed section: **BACKEND_REQUIREMENTS_EXAM_SUBMIT.md**

### Success Response (201)
```json
{
  "studentExamId": 123,
  "message": "Exam submitted successfully",
  "submittedAt": "2025-11-20T14:30:00Z"
}
```

### Error Responses

**409 Conflict - Already Submitted:**
```json
{
  "message": "Attempt already submitted",
  "studentExamId": 123,
  "submittedAt": "2025-11-20T14:25:00Z",
  "score": 85,
  "totalMarks": 100
}
```

**400 Bad Request - Invalid Answers:**
```json
{
  "message": "Invalid answer format",
  "errors": {
    "answers[0]": "Question ID 999 does not exist",
    "answers[1]": "MultipleChoice must have exactly 1 option selected, got 2"
  }
}
```

---

## 📍 Endpoint #4: Get Exam Result

### Endpoint Details
```
GET /api/Exam/{studentExamId}/result
```

### Expected Response
```json
{
  "studentExamId": 123,
  "examId": 10,
  "studentId": 5,
  "examTitle": "Mathematics Term 1 Test",
  "totalMarks": 100,
  "obtainedMarks": 85,
  "percentage": 85.0,
  "grade": "A",
  "passingMarks": 40,
  "status": "Passed",
  "submittedAt": "2025-11-20T14:30:00Z",
  "duration": 60,
  "timeSpent": 45,
  "answers": [
    {
      "questionId": 1,
      "questionText": "What is 2 + 2?",
      "marks": 5,
      "obtainedMarks": 5,
      "questionType": "MultipleChoice",
      "studentAnswer": "4",
      "correctAnswer": "4",
      "isCorrect": true
    }
  ]
}
```

### Issues to Check
- ✅ Result only shown after exam submitted
- ✅ Grade calculation correct
- ✅ Pass/Fail determination correct
- ✅ Student only sees their own result
- ✅ No partial answers shown if not graded yet

---

## 📍 Endpoint #5: Get Upcoming Exams (FOR STUDENT)

### Endpoint Details
```
GET /api/Exam/student/{studentId}/upcoming
```

### Expected Response
```json
[
  {
    "id": 123,
    "title": "Mathematics Term 1 Test",
    "examType": "Midterm",
    "subject": "Mathematics",
    "year": "Year 7",
    "totalMarks": 100,
    "durationInMinutes": 60,
    "questionCount": 20,
    "startTime": "2025-11-21T10:00:00Z",
    "endTime": "2025-11-21T11:00:00Z",
    "status": "Upcoming",
    "totalQuestions": 20
  }
]
```

### Filtering Logic
**Should return ONLY:**
- ✅ Exams where `startTime` > now (future exams)
- ✅ Exams from subjects student has subscription to
- ✅ Exams not yet submitted/attempted by this student
- ✅ Sorted by `startTime` ascending (earliest first)

### Issues Currently Causing Discrepancy
1. **Different filtering on different endpoints**
   - Dashboard uses: `/api/Exam/student/{id}/upcoming`
   - Maybe another page uses: `/api/Exam` (without studentId)
   - Results in different lists

2. **Inconsistent date comparison**
   - Some might use `startTime < now` (already started)
   - Some might use `startTime > now` (not started yet)
   - Some might use `<` instead of `<=`

3. **Subscription check missing or inconsistent**
   - Some endpoints check if student has subscription
   - Some don't check and return all exams

### FIX REQUIRED
Backend should have **ONE standard method** for filtering upcoming exams:
```csharp
public List<Exam> GetUpcomingExamsForStudent(int studentId)
{
    var now = DateTime.UtcNow;
    
    return _context.Exams
        .Where(e => e.StartTime > now)  // Only future exams
        .Where(e => StudentHasSubscription(studentId, e.SubjectId))  // Only subscribed
        .Where(e => !StudentAttemptedExam(studentId, e.Id))  // Not attempted yet
        .OrderBy(e => e.StartTime)  // Earliest first
        .ToList();
}
```

---

## 📍 Endpoint #6: Get All Exams (FOR STUDENT)

### Endpoint Details
```
GET /api/Exam
or
GET /api/Exam/student/{studentId}
```

### Expected Response
```json
[
  {
    "id": 123,
    "title": "Mathematics Test",
    "examType": "Quiz",
    "subject": "Mathematics",
    "year": "Year 7",
    "totalMarks": 100,
    "durationInMinutes": 60,
    "questionCount": 20,
    "startTime": "2025-11-21T10:00:00Z",
    "status": "Upcoming",  // or "Completed", "Ongoing"
    "studentAttempted": false,
    "lastScore": null
  }
]
```

### Issues
- ⚠️ Unclear which exams should be here vs. `/upcoming`
- ⚠️ If same exam appears in both places → **DISCREPANCY**

### FIX REQUIRED
**Option A: Single endpoint**
```
GET /api/Exam/student/{studentId}?status=upcoming
GET /api/Exam/student/{studentId}?status=all
GET /api/Exam/student/{studentId}?status=completed
```

**Option B: Two endpoints with same logic**
```
GET /api/Exam/student/{studentId}/upcoming      → future only
GET /api/Exam/student/{studentId}              → all accessible
```

---

## 📍 Endpoint #7: Get Exam by ID

### Endpoint Details
```
GET /api/Exam/{examId}
```

### Response Should Include
```json
{
  "id": 123,
  "title": "Mathematics Term 1 Test",
  "description": "Test your knowledge on algebra",
  "examType": "Midterm",
  "subject": "Mathematics",
  "year": "Year 7",
  "totalMarks": 100,
  "passingMarks": 40,
  "durationInMinutes": 60,
  "questionCount": 20,
  "startTime": "2025-11-21T10:00:00Z",
  "endTime": "2025-11-21T11:00:00Z",
  "showAnswersAfter": "2025-11-22T10:00:00Z",
  "negativeMarking": false,
  "negativeMarksPerWrongAnswer": 0
}
```

---

## 🔄 Complete Exam Flow (Backend Perspective)

### Student Journey
```
1. View Dashboard
   → GET /api/Exam/student/{id}/upcoming
   → Show upcoming exams

2. Click "Take Exam"
   → POST /api/Exam/{examId}/start
   → Get studentExamId

3. Load Exam Page
   → GET /api/Exam/{examId}/questions
   → Display questions

4. Answer Questions
   → (Frontend handles)

5. Click Submit
   → POST /api/Exam/submit
   → Should return 201 (success) or 409 (duplicate)

6. View Results
   → GET /api/Exam/{studentExamId}/result
   → Show score, answers, feedback
```

### Backend Responsibilities
| Step | Endpoint | Responsibility |
|------|----------|-----------------|
| 1 | GET /upcoming | Filter correctly, no duplicates |
| 2 | POST /start | Validate access, create attempt |
| 3 | GET /questions | Return all questions with options |
| 4 | - | (Frontend only) |
| 5 | POST /submit | **Prevent double submission** ⚠️ |
| 6 | GET /result | Return graded result |

---

## 🐛 Known Issues & Fixes

| # | Endpoint | Issue | Fix |
|---|----------|-------|-----|
| 1 | POST /submit | Double submission not prevented | Add IsSubmitted flag + 409 check |
| 2 | GET /upcoming | Inconsistent filtering | Standardize date comparison |
| 3 | GET /questions | Unclear if all types included | Add logging, verify in tests |
| 4 | GET /result | May show before graded | Clarify grading policy |
| 5 | POST /start | No validation of exam window | Add startTime/endTime check |

---

## 🧪 Backend Test Checklist

### Unit Tests Needed
- [ ] StartExam: Validates student subscription
- [ ] StartExam: Rejects if exam not started yet
- [ ] StartExam: Rejects if already attempted
- [ ] GetQuestions: Returns all question types correctly
- [ ] SubmitExam: Accepts first submission
- [ ] SubmitExam: Rejects duplicate submission (409)
- [ ] SubmitExam: Validates answer format
- [ ] GetResult: Shows graded result
- [ ] GetUpcomingExams: Only shows future exams
- [ ] GetUpcomingExams: Only shows subscribed subjects

### Integration Tests Needed
- [ ] Full exam flow: Start → Answer → Submit → View Result
- [ ] Race condition: 2 submits at same time
- [ ] Concurrent students: Multiple students taking exam
- [ ] Grading: Auto-grade correct answers
- [ ] Subscription: Student without subscription can't access

### Manual Testing Needed
- [ ] Can't submit same exam twice (gets 409)
- [ ] Result shows immediately after submit
- [ ] Dashboard count matches exams page count
- [ ] All question types display correctly

---

## 💾 Database Schema Verification

### StudentExam Table - REQUIRED Columns
```sql
CREATE TABLE StudentExams (
    Id INT PRIMARY KEY IDENTITY,
    StudentId INT NOT NULL,
    ExamId INT NOT NULL,
    StartedAt DATETIME2 NOT NULL,
    SubmittedAt DATETIME2 NULL,
    IsSubmitted BIT DEFAULT 0,          -- ✅ REQUIRED (currently missing?)
    Score DECIMAL(5,2) NULL,
    TotalMarks DECIMAL(5,2) NULL,
    Answers NVARCHAR(MAX) NULL,
    Status NVARCHAR(50),
    
    FOREIGN KEY (StudentId) REFERENCES Users(Id),
    FOREIGN KEY (ExamId) REFERENCES Exams(Id),
    INDEX IX_StudentExams_IsSubmitted (IsSubmitted),
    INDEX IX_StudentExams_Student (StudentId, ExamId)
);
```

### Exam Table - VERIFY Columns
```sql
CREATE TABLE Exams (
    Id INT PRIMARY KEY IDENTITY,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    SubjectId INT NOT NULL,
    ExamType NVARCHAR(50),              -- "Quiz", "Midterm", "Final"
    TotalMarks DECIMAL(5,2) NOT NULL,
    PassingMarks DECIMAL(5,2),
    DurationInMinutes INT NOT NULL,
    StartTime DATETIME2 NOT NULL,       -- ✅ VERIFY used correctly
    EndTime DATETIME2 NOT NULL,         -- ✅ VERIFY used correctly
    ShowAnswersAfter DATETIME2 NULL,
    NegativeMarking BIT DEFAULT 0,
    Status NVARCHAR(50),                -- "Draft", "Published", "Archived"
    
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id),
    INDEX IX_Exams_StartTime (StartTime, EndTime),
    INDEX IX_Exams_Subject (SubjectId)
);
```

---

## 📊 Performance Considerations

### Indexes Needed
```sql
-- For filtering upcoming exams (CRITICAL)
CREATE INDEX IX_Exams_StartTime_Upcoming 
ON Exams(StartTime, EndTime, SubjectId, Status) 
WHERE Status = 'Published';

-- For finding student attempts
CREATE INDEX IX_StudentExams_Submitted 
ON StudentExams(StudentId, ExamId, IsSubmitted);

-- For tracking submissions
CREATE INDEX IX_StudentExams_SubmittedAt 
ON StudentExams(SubmittedAt) 
WHERE SubmittedAt IS NOT NULL;
```

### Query Optimization
```csharp
// ✅ DO: Use include to avoid N+1 queries
var exams = _context.Exams
    .Include(e => e.Questions)
        .ThenInclude(q => q.Options)
    .Where(e => e.StartTime > now)
    .ToList();

// ❌ DON'T: Load questions separately
var exams = _context.Exams.Where(...).ToList();
foreach (var exam in exams)
{
    exam.Questions.Load();  // N+1 query
}
```

---

## 🔐 Security Checklist

- [ ] Student can only see their own results
- [ ] Student can't access exam questions before exam starts
- [ ] Student can't submit after exam ends + grace period
- [ ] Can't modify answers after submission
- [ ] Can't see other students' answers
- [ ] Can't bypass subscription check
- [ ] No SQL injection in filters
- [ ] No authorization bypass possible

---

## 📋 Implementation Priority

### Phase 1 (CRITICAL - Do First)
1. ✅ Add `IsSubmitted` column to StudentExam
2. ✅ Update POST /submit to check & set IsSubmitted
3. ✅ Return 409 Conflict for duplicate submit
4. **Timeline:** ASAP (< 1 day)

### Phase 2 (HIGH - Do Next)
1. Standardize GET /upcoming filtering
2. Add validation to POST /start
3. Verify all question types load
4. **Timeline:** This week

### Phase 3 (MEDIUM - Do Later)
1. Add logging for all endpoints
2. Optimize database indexes
3. Add comprehensive tests
4. **Timeline:** Next week

---

## 📞 Contact & Review

**Sent to:** Backend Development Team  
**Date:** November 20, 2025  
**Urgency:** 🔴 CRITICAL  

**Questions? Check:**
1. BACKEND_REQUIREMENTS_EXAM_SUBMIT.md (detailed fix for double-submit)
2. This document (complete API overview)
3. Code comments in endpoints

**When ready to implement:** Reply with questions/clarifications

---

**Document Version:** 1.0  
**Last Updated:** November 20, 2025  
**Status:** 📋 For Review & Implementation

