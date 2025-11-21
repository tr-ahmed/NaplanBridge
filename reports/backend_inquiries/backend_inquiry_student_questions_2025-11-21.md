# 🔧 Backend Change Report

## 1. Reason for Change

The frontend requires a feature that allows **students to ask questions to teachers about specific lessons**, and teachers must be able to **view and answer these questions**. Currently, the API only provides `LessonQuestions` endpoint which is designed for quiz/video questions (MCQ-style), not for student-to-teacher Q&A communication.

**Use Case:**
- Student watches a lesson and has a question → sends question to teacher
- Teacher views all unanswered student questions → responds to them
- Student can view their questions and teacher's answers

---

## 2. Required or Modified Endpoint

### **New Endpoints Required:**

#### **A. POST /api/StudentQuestions**
* **Method:** `POST`
* **Controller:** `StudentQuestionsController`
* **Action:** `Create`
* **Description:** Allows a student to submit a question about a specific lesson
* **Authentication:** Required (Student role)
* **Request Body:**
```json
{
  "lessonId": 123,
  "questionText": "Can you explain the second example in more detail?"
}
```
* **Response:**
```json
{
  "id": 456,
  "lessonId": 123,
  "studentId": 789,
  "studentName": "Ahmed Ali",
  "questionText": "Can you explain the second example in more detail?",
  "answerText": null,
  "answeredByTeacherId": null,
  "answeredByTeacherName": null,
  "createdAt": "2025-11-21T10:30:00Z",
  "answeredAt": null,
  "isAnswered": false
}
```

---

#### **B. GET /api/StudentQuestions/lesson/{lessonId}**
* **Method:** `GET`
* **Controller:** `StudentQuestionsController`
* **Action:** `GetByLesson`
* **Description:** Get all student questions for a specific lesson (accessible by teacher and students)
* **Authentication:** Required (Teacher or Student role)
* **Parameters:**
  - `lessonId` (path parameter): int
  - `includeAnswered` (query parameter, optional): bool (default: true)
* **Response:**
```json
[
  {
    "id": 456,
    "lessonId": 123,
    "studentId": 789,
    "studentName": "Ahmed Ali",
    "questionText": "Can you explain the second example?",
    "answerText": "Sure! The second example demonstrates...",
    "answeredByTeacherId": 10,
    "answeredByTeacherName": "Dr. Mohamed",
    "createdAt": "2025-11-21T10:30:00Z",
    "answeredAt": "2025-11-21T14:20:00Z",
    "isAnswered": true
  }
]
```

---

#### **C. GET /api/StudentQuestions/my-questions**
* **Method:** `GET`
* **Controller:** `StudentQuestionsController`
* **Action:** `GetMyQuestions`
* **Description:** Get all questions submitted by the currently authenticated student
* **Authentication:** Required (Student role)
* **Query Parameters:**
  - `lessonId` (optional): int - Filter by specific lesson
  - `isAnswered` (optional): bool - Filter by answered status
* **Response:** Same structure as endpoint B

---

#### **D. GET /api/StudentQuestions/teacher/pending**
* **Method:** `GET`
* **Controller:** `StudentQuestionsController`
* **Action:** `GetTeacherPendingQuestions`
* **Description:** Get all unanswered questions for lessons created by the authenticated teacher
* **Authentication:** Required (Teacher role)
* **Query Parameters:**
  - `lessonId` (optional): int - Filter by specific lesson
  - `subjectId` (optional): int - Filter by subject
  - `termId` (optional): int - Filter by term
* **Response:** Same structure as endpoint B

---

#### **E. GET /api/StudentQuestions/teacher/all**
* **Method:** `GET`
* **Controller:** `StudentQuestionsController`
* **Action:** `GetTeacherAllQuestions`
* **Description:** Get all questions (answered and unanswered) for lessons created by the authenticated teacher
* **Authentication:** Required (Teacher role)
* **Query Parameters:**
  - `isAnswered` (optional): bool - Filter by answered status
  - `lessonId` (optional): int
  - `subjectId` (optional): int
  - `termId` (optional): int
  - `page` (optional): int (default: 1)
  - `pageSize` (optional): int (default: 20)
* **Response:** Paginated list with same structure as endpoint B

---

#### **F. POST /api/StudentQuestions/{id}/answer**
* **Method:** `POST`
* **Controller:** `StudentQuestionsController`
* **Action:** `AnswerQuestion`
* **Description:** Teacher provides an answer to a student's question
* **Authentication:** Required (Teacher role)
* **Path Parameter:**
  - `id`: int (question ID)
* **Request Body:**
```json
{
  "answerText": "The second example demonstrates how to use the formula in real-world scenarios..."
}
```
* **Response:**
```json
{
  "id": 456,
  "lessonId": 123,
  "studentId": 789,
  "studentName": "Ahmed Ali",
  "questionText": "Can you explain the second example?",
  "answerText": "The second example demonstrates...",
  "answeredByTeacherId": 10,
  "answeredByTeacherName": "Dr. Mohamed",
  "createdAt": "2025-11-21T10:30:00Z",
  "answeredAt": "2025-11-21T14:20:00Z",
  "isAnswered": true
}
```

---

#### **G. PUT /api/StudentQuestions/{id}**
* **Method:** `PUT`
* **Controller:** `StudentQuestionsController`
* **Action:** `Update`
* **Description:** Student can edit their question (only if not answered yet)
* **Authentication:** Required (Student role - must be question owner)
* **Path Parameter:**
  - `id`: int (question ID)
* **Request Body:**
```json
{
  "questionText": "Updated question text..."
}
```

---

#### **H. DELETE /api/StudentQuestions/{id}**
* **Method:** `DELETE`
* **Controller:** `StudentQuestionsController`
* **Action:** `Delete`
* **Description:** Student can delete their question (only if not answered yet), or Admin can delete any question
* **Authentication:** Required (Student must be owner, or Admin role)
* **Path Parameter:**
  - `id`: int (question ID)

---

## 3. Suggested Backend Implementation

### **Database Table: `StudentQuestions`**

```sql
CREATE TABLE StudentQuestions (
    Id INT PRIMARY KEY IDENTITY(1,1),
    LessonId INT NOT NULL,
    StudentId INT NOT NULL,
    QuestionText NVARCHAR(MAX) NOT NULL,
    AnswerText NVARCHAR(MAX) NULL,
    AnsweredByTeacherId INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    AnsweredAt DATETIME2 NULL,
    IsAnswered BIT NOT NULL DEFAULT 0,
    
    FOREIGN KEY (LessonId) REFERENCES Lessons(Id) ON DELETE CASCADE,
    FOREIGN KEY (StudentId) REFERENCES Users(Id) ON DELETE NO ACTION,
    FOREIGN KEY (AnsweredByTeacherId) REFERENCES Users(Id) ON DELETE NO ACTION
);

CREATE INDEX IX_StudentQuestions_LessonId ON StudentQuestions(LessonId);
CREATE INDEX IX_StudentQuestions_StudentId ON StudentQuestions(StudentId);
CREATE INDEX IX_StudentQuestions_IsAnswered ON StudentQuestions(IsAnswered);
CREATE INDEX IX_StudentQuestions_CreatedAt ON StudentQuestions(CreatedAt DESC);
```

### **Models:**

```csharp
// API/Models/StudentQuestion.cs
public class StudentQuestion
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public int StudentId { get; set; }
    public string QuestionText { get; set; }
    public string? AnswerText { get; set; }
    public int? AnsweredByTeacherId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AnsweredAt { get; set; }
    public bool IsAnswered { get; set; }
    
    // Navigation properties
    public virtual Lesson Lesson { get; set; }
    public virtual User Student { get; set; }
    public virtual User? AnsweredByTeacher { get; set; }
}
```

### **DTOs:**

```csharp
// API/DTOs/StudentQuestion/CreateStudentQuestionDto.cs
public class CreateStudentQuestionDto
{
    [Required]
    public int LessonId { get; set; }
    
    [Required]
    [MaxLength(2000)]
    public string QuestionText { get; set; }
}

// API/DTOs/StudentQuestion/StudentQuestionDto.cs
public class StudentQuestionDto
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public string LessonTitle { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; }
    public string QuestionText { get; set; }
    public string? AnswerText { get; set; }
    public int? AnsweredByTeacherId { get; set; }
    public string? AnsweredByTeacherName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AnsweredAt { get; set; }
    public bool IsAnswered { get; set; }
}

// API/DTOs/StudentQuestion/AnswerStudentQuestionDto.cs
public class AnswerStudentQuestionDto
{
    [Required]
    [MaxLength(5000)]
    public string AnswerText { get; set; }
}

// API/DTOs/StudentQuestion/UpdateStudentQuestionDto.cs
public class UpdateStudentQuestionDto
{
    [Required]
    [MaxLength(2000)]
    public string QuestionText { get; set; }
}
```

### **Controller Implementation Guidelines:**

```csharp
// API/Controllers/StudentQuestionsController.cs
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StudentQuestionsController : ControllerBase
{
    // Implement all endpoints listed in section 2
    
    // Authorization checks:
    // - Create: Student role only
    // - GetByLesson: Teacher (if owns lesson) or Student
    // - GetMyQuestions: Student role only
    // - GetTeacherPendingQuestions: Teacher role only
    // - GetTeacherAllQuestions: Teacher role only
    // - AnswerQuestion: Teacher role + must own the lesson
    // - Update: Student role + must be question owner + question not answered
    // - Delete: Student (if owner + not answered) or Admin
}
```

### **Business Logic:**
1. When teacher answers a question:
   - Set `AnswerText`
   - Set `AnsweredByTeacherId` to current teacher's ID
   - Set `AnsweredAt` to current UTC datetime
   - Set `IsAnswered` to `true`

2. Student can only edit/delete their own unanswered questions

3. Teacher can only answer questions for lessons they created

4. Include proper validation and error handling

---

## 4. Database Impact

* **New Table:** `StudentQuestions`
* **Migration Required:** Yes
* **Relationships:**
  - `StudentQuestions.LessonId` → `Lessons.Id` (CASCADE DELETE)
  - `StudentQuestions.StudentId` → `Users.Id` (NO ACTION)
  - `StudentQuestions.AnsweredByTeacherId` → `Users.Id` (NO ACTION)

---

## 5. Files to Modify or Create

### **New Files:**
* `API/Models/StudentQuestion.cs`
* `API/DTOs/StudentQuestion/CreateStudentQuestionDto.cs`
* `API/DTOs/StudentQuestion/StudentQuestionDto.cs`
* `API/DTOs/StudentQuestion/AnswerStudentQuestionDto.cs`
* `API/DTOs/StudentQuestion/UpdateStudentQuestionDto.cs`
* `API/Controllers/StudentQuestionsController.cs`
* `API/Migrations/2025xxxx_CreateStudentQuestionsTable.cs`

### **Files to Modify:**
* `API/Data/ApplicationDbContext.cs` - Add `DbSet<StudentQuestion>`
* `API/Services/IStudentQuestionService.cs` (if using service layer)
* `API/Services/StudentQuestionService.cs` (if using service layer)

---

## 6. Additional Features (Optional but Recommended)

### **Notifications:**
- Notify teacher when student asks a question
- Notify student when teacher answers their question

### **Statistics for Teacher Dashboard:**
- Total unanswered questions count
- Questions per lesson
- Average response time

### **Filtering and Sorting:**
- Sort by newest/oldest
- Filter by date range
- Search in question text

---

## 7. Request Confirmation

Please confirm:
1. ✅ All endpoints are implemented as specified
2. ✅ DTOs match the structure described
3. ✅ Authorization rules are properly enforced
4. ✅ Database migration is created and tested
5. ✅ Swagger documentation is updated
6. ✅ Error handling returns proper HTTP status codes

Once confirmed, I will proceed with the Angular frontend implementation.

---

**Priority:** High  
**Estimated Backend Work:** 4-6 hours  
**Frontend Dependency:** Cannot proceed without these endpoints
