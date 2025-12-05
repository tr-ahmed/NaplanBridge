# Backend Exam API - Complete Specification

## 📋 Overview

This document provides the complete specification for all exam-related API endpoints with all fields including exam settings.

---

## 🆕 CREATE EXAM

**Endpoint:** `POST /api/exam`

**Request Body (CreateExamDto):**

```json
{
  // ========== BASIC INFORMATION ==========
  "title": "Math Week 3 - Algebra Quiz",
  "description": "Test your knowledge of basic algebra concepts",
  "examType": "Lesson", // Enum: "Lesson" | "Term" | "Year" | "Quiz"

  // ========== RELATIONSHIPS ==========
  "subjectId": 5, // REQUIRED: Subject ID (number)
  "yearId": 2, // REQUIRED: Academic Year ID (number)
  "termId": 1, // OPTIONAL: Term ID (number or null)
  "weekId": 3, // OPTIONAL: Week ID (number or null)
  "lessonId": 15, // OPTIONAL: Lesson ID (number or null)

  // ========== TIMING & SCORING ==========
  "durationInMinutes": 60, // REQUIRED: Exam duration (number, min: 5)
  "totalMarks": 100, // REQUIRED: Total marks (number, min: 1)
  "passingMarks": 50, // REQUIRED: Passing marks (number, min: 0)
  "startTime": "2025-12-10T10:00:00Z", // OPTIONAL: ISO 8601 format (string or null)
  "endTime": "2025-12-10T12:00:00Z", // OPTIONAL: ISO 8601 format (string or null)

  // ========== EXAM SETTINGS (NEW) ==========
  "allowLateSubmission": false, // Allow submission after endTime (boolean, default: false)
  "shuffleQuestions": true, // Randomize question order (boolean, default: false)
  "showResults": true, // Show results to student immediately (boolean, default: true)
  "allowReview": true, // Allow student to review answers (boolean, default: true)
  "maxAttempts": 1, // Maximum attempts allowed (number, min: 1, default: 1)

  // ========== PUBLICATION STATUS ==========
  "isPublished": false, // Publish exam (boolean, default: false)

  // ========== QUESTIONS ==========
  "questions": [
    {
      "questionText": "What is 2 + 2?",
      "questionType": "MultipleChoice", // Enum: "Text" | "MultipleChoice" | "MultipleSelect"
      "marks": 10, // Marks for this question (number)
      "order": 1, // Question order (number)
      "isMultipleSelect": false, // Allow multiple correct answers (boolean)
      "options": [
        {
          "optionText": "3",
          "isCorrect": false,
          "order": 1
        },
        {
          "optionText": "4",
          "isCorrect": true,
          "order": 2
        },
        {
          "optionText": "5",
          "isCorrect": false,
          "order": 3
        }
      ]
    },
    {
      "questionText": "Explain the Pythagorean theorem",
      "questionType": "Text",
      "marks": 20,
      "order": 2,
      "isMultipleSelect": false,
      "options": [] // Empty for text questions
    }
  ]
}
```

**Response (ExamDto):**

```json
{
  "id": 25,
  "title": "Math Week 3 - Algebra Quiz",
  "description": "Test your knowledge of basic algebra concepts",
  "examType": "Lesson",
  "subjectId": 5,
  "subjectName": "Mathematics",
  "yearId": 2,
  "yearName": "Year 2",
  "termId": 1,
  "termName": "Term 1",
  "weekId": 3,
  "lessonId": 15,
  "durationInMinutes": 60,
  "totalMarks": 100,
  "passingMarks": 50,
  "startTime": "2025-12-10T10:00:00Z",
  "endTime": "2025-12-10T12:00:00Z",
  "allowLateSubmission": false,
  "shuffleQuestions": true,
  "showResults": true,
  "allowReview": true,
  "maxAttempts": 1,
  "isPublished": false,
  "createdAt": "2025-12-05T14:30:00Z",
  "questions": [...]
}
```

---

## ✏️ UPDATE EXAM

**Endpoint:** `PUT /api/exam/{examId}`

**URL Parameters:**

- `examId` (number) - The ID of the exam to update

**Request Body (UpdateExamDto):**

```json
{
  // ========== BASIC INFORMATION ==========
  "title": "Math Week 3 - Algebra Quiz (Updated)",
  "description": "Updated description",

  // ========== TIMING & SCORING ==========
  "durationInMinutes": 90,
  "totalMarks": 120,
  "passingMarks": 60,
  "startTime": "2025-12-10T10:00:00Z",
  "endTime": "2025-12-10T13:00:00Z",

  // ========== EXAM SETTINGS (MUST BE INCLUDED) ==========
  "allowLateSubmission": true,
  "shuffleQuestions": false,
  "showResults": true,
  "allowReview": true,
  "maxAttempts": 2,

  // ========== PUBLICATION STATUS ==========
  "isPublished": true
}
```

**Notes:**

- ❌ **Cannot update:** `examType`, `subjectId`, `yearId`, `termId`, `weekId`, `lessonId`
- ✅ **Can update:** All settings, timing, scoring, and publication status
- ⚠️ **Questions:** Use separate endpoints to add/update/delete questions

**Response:**

```json
{
  "success": true,
  "message": "Exam updated successfully",
  "data": {
    /* Updated ExamDto */
  }
}
```

---

## 📖 GET EXAM BY ID

**Endpoint:** `GET /api/exam/{examId}`

**URL Parameters:**

- `examId` (number) - The ID of the exam to retrieve

**Response (ExamDto):**

```json
{
  "id": 25,
  "title": "Math Week 3 - Algebra Quiz",
  "description": "Test your knowledge of basic algebra concepts",
  "examType": "Lesson",
  "subjectId": 5,
  "subjectName": "Mathematics",
  "yearId": 2,
  "yearName": "Year 2",
  "termId": 1,
  "termName": "Term 1",
  "weekId": 3,
  "lessonId": 15,
  "durationInMinutes": 60,
  "totalMarks": 100,
  "passingMarks": 50,
  "startTime": "2025-12-10T10:00:00Z",
  "endTime": "2025-12-10T12:00:00Z",

  // ========== EXAM SETTINGS ==========
  "allowLateSubmission": false,
  "shuffleQuestions": true,
  "showResults": true,
  "allowReview": true,
  "maxAttempts": 1,

  "isPublished": false,
  "createdAt": "2025-12-05T14:30:00Z",
  "updatedAt": "2025-12-05T15:00:00Z",

  "questions": [
    {
      "id": 101,
      "questionText": "What is 2 + 2?",
      "questionType": "MultipleChoice",
      "marks": 10,
      "order": 1,
      "isMultipleSelect": false,
      "options": [
        {
          "id": 501,
          "optionText": "3",
          "isCorrect": false,
          "order": 1
        },
        {
          "id": 502,
          "optionText": "4",
          "isCorrect": true,
          "order": 2
        }
      ]
    }
  ]
}
```

---

## 📝 ADD QUESTION TO EXAM

**Endpoint:** `POST /api/exam/{examId}/questions`

**URL Parameters:**

- `examId` (number) - The ID of the exam

**Request Body (CreateQuestionDto):**

```json
{
  "questionText": "What is the capital of France?",
  "questionType": "MultipleChoice",
  "marks": 5,
  "order": 3,
  "isMultipleSelect": false,
  "options": [
    {
      "optionText": "Paris",
      "isCorrect": true,
      "order": 1
    },
    {
      "optionText": "London",
      "isCorrect": false,
      "order": 2
    },
    {
      "optionText": "Berlin",
      "isCorrect": false,
      "order": 3
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Question added successfully",
  "data": {
    "id": 102,
    "questionText": "What is the capital of France?",
    "questionType": "MultipleChoice",
    "marks": 5,
    "order": 3,
    "options": [...]
  }
}
```

---

## 🔄 UPDATE QUESTION

**Endpoint:** `PUT /api/exam/questions/{questionId}`

**URL Parameters:**

- `questionId` (number) - The ID of the question to update

**Request Body (UpdateQuestionDto):**

```json
{
  "questionText": "Updated question text",
  "marks": 15,
  "order": 1
}
```

---

## 🗑️ DELETE QUESTION

**Endpoint:** `DELETE /api/exam/questions/{questionId}`

**URL Parameters:**

- `questionId` (number) - The ID of the question to delete

**Response:**

```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

---

## 🗑️ DELETE EXAM

**Endpoint:** `DELETE /api/exam/{examId}`

**URL Parameters:**

- `examId` (number) - The ID of the exam to delete

**Response:**

```json
{
  "success": true,
  "message": "Exam deleted successfully"
}
```

---

## 📊 Complete Field Reference

### Exam Settings Fields

| Field Name            | Type    | Required | Default | Description                                 |
| --------------------- | ------- | -------- | ------- | ------------------------------------------- |
| `allowLateSubmission` | boolean | No       | `false` | Allow students to submit after `endTime`    |
| `shuffleQuestions`    | boolean | No       | `false` | Randomize question order for each student   |
| `showResults`         | boolean | No       | `true`  | Show results immediately after submission   |
| `allowReview`         | boolean | No       | `true`  | Allow students to review their answers      |
| `maxAttempts`         | number  | No       | `1`     | Maximum number of attempts allowed (min: 1) |

### Exam Type Enum

```typescript
enum ExamType {
  Lesson = "Lesson", // Lesson-level exam
  Term = "Term", // Term exam
  Year = "Year", // Year-end exam
  Quiz = "Quiz", // Quick quiz
}
```

### Question Type Enum

```typescript
enum QuestionType {
  Text = "Text", // Essay/text answer
  MultipleChoice = "MultipleChoice", // Single correct answer
  MultipleSelect = "MultipleSelect", // Multiple correct answers
}
```

---

## 🔍 Important Notes

### For CREATE (POST /api/exam):

✅ **Must include:**

- `title`, `examType`, `subjectId`, `yearId`
- `durationInMinutes`, `totalMarks`, `passingMarks`
- `questions` array (at least one question)
- All exam settings (with defaults if not specified)

### For UPDATE (PUT /api/exam/{id}):

✅ **Can update:**

- Basic info: `title`, `description`
- Timing: `durationInMinutes`, `startTime`, `endTime`
- Scoring: `totalMarks`, `passingMarks`
- **ALL exam settings:** `allowLateSubmission`, `shuffleQuestions`, `showResults`, `allowReview`, `maxAttempts`
- Publication: `isPublished`

❌ **Cannot update:**

- Relationships: `examType`, `subjectId`, `yearId`, `termId`, `weekId`, `lessonId`
- Questions (use separate endpoints)

### Datetime Format:

- **Input:** ISO 8601 format string: `"2025-12-10T10:00:00Z"`
- **Can be null** if no specific start/end time
- Frontend converts from `datetime-local` input: `new Date(value).toISOString()`

### Type Conversions (Frontend → Backend):

```typescript
{
  subjectId: Number(formValue.subjectId),
  yearId: Number(formValue.yearId),
  durationInMinutes: Number(formValue.durationInMinutes),
  totalMarks: Number(formValue.totalMarks),
  passingMarks: Number(formValue.passingMarks),
  maxAttempts: Number(formValue.maxAttempts),
  startTime: formValue.startTime ? new Date(formValue.startTime).toISOString() : null,
  endTime: formValue.endTime ? new Date(formValue.endTime).toISOString() : null,
  allowLateSubmission: formValue.allowLateSubmission ?? false,
  shuffleQuestions: formValue.shuffleQuestions ?? false,
  showResults: formValue.showResults ?? true,
  allowReview: formValue.allowReview ?? true
}
```

---

## 🧪 Test Scenarios

### Scenario 1: Create Exam with All Settings

```json
POST /api/exam
{
  "title": "Final Math Exam",
  "description": "Comprehensive mathematics final exam",
  "examType": "Year",
  "subjectId": 5,
  "yearId": 2,
  "termId": null,
  "weekId": null,
  "lessonId": null,
  "durationInMinutes": 120,
  "totalMarks": 200,
  "passingMarks": 100,
  "startTime": "2025-12-15T09:00:00Z",
  "endTime": "2025-12-15T11:00:00Z",
  "allowLateSubmission": true,
  "shuffleQuestions": true,
  "showResults": false,
  "allowReview": true,
  "maxAttempts": 2,
  "isPublished": false,
  "questions": [...]
}
```

### Scenario 2: Update Exam Settings Only

```json
PUT /api/exam/25
{
  "title": "Final Math Exam",
  "description": "Updated description",
  "durationInMinutes": 120,
  "totalMarks": 200,
  "passingMarks": 100,
  "startTime": "2025-12-15T09:00:00Z",
  "endTime": "2025-12-15T11:00:00Z",
  "allowLateSubmission": false,
  "shuffleQuestions": false,
  "showResults": true,
  "allowReview": false,
  "maxAttempts": 1,
  "isPublished": true
}
```

### Scenario 3: Publish Exam

```json
PUT /api/exam/25
{
  "title": "Math Quiz",
  "description": "Week 3 Quiz",
  "durationInMinutes": 30,
  "totalMarks": 50,
  "passingMarks": 25,
  "startTime": null,
  "endTime": null,
  "allowLateSubmission": false,
  "shuffleQuestions": true,
  "showResults": true,
  "allowReview": true,
  "maxAttempts": 1,
  "isPublished": true  // ✅ Publishing the exam
}
```

---

## 📌 Frontend Implementation Status

### ✅ FIXED:

1. **CreateExamDto** - Now includes all exam settings
2. **UpdateExamDto** - Now includes all exam settings
3. **Type conversions** - All IDs and numbers properly converted
4. **Datetime handling** - ISO 8601 format with null support
5. **Default values** - Proper fallbacks with `??` operator

### 🔄 Data Flow:

```
Form Input → Validation → Transform to DTO → API Call → Backend
     ↓           ↓              ↓              ↓          ↓
  datetime-  Required   Number(value)   HTTP POST   Database
   local     fields     toISOString()    /PUT
```

---

**Last Updated:** December 5, 2025
**Status:** ✅ Complete with all exam settings included
