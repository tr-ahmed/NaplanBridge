# 📌 BACKEND REPORT - Teacher Exams Missing examType

## Issue Description
When fetching teacher exams via `/api/Teacher/my-exams`, the response does not include the `examType` field.

## Current Behavior
```
📝 Exam: ffffff, Type from API: undefined, Converted: undefined
```

## Expected Behavior
The API should return `examType` field with one of these values:
- `0` = Lesson Quiz
- `1` = Monthly Test  
- `2` = Term Exam
- `3` = Annual Exam

## API Endpoint
- **GET** `/api/Teacher/my-exams`

## Expected Response Structure
```json
{
  "data": [
    {
      "id": 1,
      "title": "ffffff",
      "examType": 0,  // ⚠️ THIS IS MISSING
      "subjectName": "Mathematics",
      "totalMarks": 100,
      "durationInMinutes": 60,
      "isPublished": true,
      "totalSubmissions": 0,
      "pendingGradingCount": 0,
      "averageScore": null
    }
  ]
}
```

## Impact
- Frontend cannot display the exam type in the table
- Teachers cannot filter by exam type properly
- UI shows default "Lesson Quiz" for all exams

## Temporary Fix Applied
Frontend now defaults to `ExamType.Lesson` when `examType` is undefined.

## Request
Please add the `examType` field to the `TeacherExamDto` class and include it in the `/api/Teacher/my-exams` response.

---
**Date**: December 2, 2025
**Reporter**: Frontend Team
**Priority**: Medium
