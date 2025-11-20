# Admin Exam Management - Testing Guide

## ✅ What Was Fixed

The exam management system for admin users has been updated to use the **real backend API** instead of mock data.

### Changes Made:

1. **Updated `create-edit-exam.component.ts`**
   - Switched from `ExamService` to `ExamApiService`
   - Connected to real API endpoints for creating and editing exams
   - Fixed data transformation to match backend DTO structure
   - Properly formats questions with options

2. **Updated `exam-api.service.ts`**
   - Removed mock mode flag
   - Now uses real API calls only

3. **Form Data Transformation**
   - Questions are now properly formatted with `order` field
   - Options include `order` field
   - `isMultipleSelect` flag is set based on question type
   - All fields match the backend's `CreateExamDto` structure

---

## 🧪 How to Test

### 1. **Login as Admin**
   - Navigate to: `http://localhost:4200/login`
   - Login with admin credentials

### 2. **Access Exam Management**
   - Click on **"Exams"** in the admin sidebar
   - Or navigate to: `/admin/exams`

### 3. **Create New Exam**

#### Step 1: Click "Create New Exam" Button
   - Should navigate to `/admin/exam/create`

#### Step 2: Fill Basic Information
   - **Title**: e.g., "Math Term 1 Final Exam"
   - **Description**: e.g., "Final exam covering algebra and geometry"
   - **Exam Type**: Select from dropdown (Lesson, Monthly, Term)
   - **Subject**: Select a subject from dropdown
   - **Year**: Select year (required)
   - **Term**: Select term (optional)
   - **Duration**: e.g., 60 minutes
   - **Start Time**: Pick date and time
   - **End Time**: Pick date and time

#### Step 3: Add Questions

##### **Multiple Choice Question:**
1. Click "Add Question"
2. Enter question text: "What is 2 + 2?"
3. Select question type: "Multiple Choice"
4. Enter marks: 5
5. Add options:
   - Option 1: "3" - Not correct
   - Option 2: "4" - Check as correct ✅
   - Option 3: "5" - Not correct
   - Option 4: "6" - Not correct

##### **Multiple Select Question:**
1. Click "Add Question"
2. Enter question text: "Select all prime numbers"
3. Select question type: "Multiple Select"
4. Enter marks: 10
5. Add options:
   - Option 1: "2" - Check as correct ✅
   - Option 2: "3" - Check as correct ✅
   - Option 3: "4" - Not correct
   - Option 4: "5" - Check as correct ✅

##### **Text Question:**
1. Click "Add Question"
2. Enter question text: "Explain the Pythagorean theorem"
3. Select question type: "Text"
4. Enter marks: 15

##### **True/False Question:**
1. Click "Add Question"
2. Enter question text: "The Earth is round"
3. Select question type: "True/False"
4. Enter marks: 2
5. Mark "True" as correct ✅

#### Step 4: Review Settings
   - Set **Total Marks** (auto-calculated from questions)
   - Set **Passing Marks**: e.g., 50
   - Enable/disable options as needed

#### Step 5: Save
   - Click **"Save as Draft"** or **"Publish Exam"**

---

## 📊 Expected API Calls

### Creating Exam:
```http
POST https://naplan2.runasp.net/api/Exam
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Math Term 1 Final Exam",
  "description": "Final exam covering algebra and geometry",
  "examType": "Term",
  "subjectId": 1,
  "termId": 1,
  "lessonId": null,
  "weekId": null,
  "yearId": 1,
  "durationInMinutes": 60,
  "totalMarks": 32,
  "passingMarks": 16,
  "startTime": "2025-11-25T10:00:00",
  "endTime": "2025-11-25T11:00:00",
  "isPublished": false,
  "questions": [
    {
      "questionText": "What is 2 + 2?",
      "questionType": "MultipleChoice",
      "marks": 5,
      "order": 1,
      "isMultipleSelect": false,
      "options": [
        { "optionText": "3", "isCorrect": false, "order": 1 },
        { "optionText": "4", "isCorrect": true, "order": 2 },
        { "optionText": "5", "isCorrect": false, "order": 3 },
        { "optionText": "6", "isCorrect": false, "order": 4 }
      ]
    },
    {
      "questionText": "Select all prime numbers",
      "questionType": "MultipleSelect",
      "marks": 10,
      "order": 2,
      "isMultipleSelect": true,
      "options": [
        { "optionText": "2", "isCorrect": true, "order": 1 },
        { "optionText": "3", "isCorrect": true, "order": 2 },
        { "optionText": "4", "isCorrect": false, "order": 3 },
        { "optionText": "5", "isCorrect": true, "order": 4 }
      ]
    },
    {
      "questionText": "Explain the Pythagorean theorem",
      "questionType": "Text",
      "marks": 15,
      "order": 3,
      "isMultipleSelect": false,
      "options": []
    },
    {
      "questionText": "The Earth is round",
      "questionType": "TrueFalse",
      "marks": 2,
      "order": 4,
      "isMultipleSelect": false,
      "options": [
        { "optionText": "True", "isCorrect": true, "order": 1 },
        { "optionText": "False", "isCorrect": false, "order": 2 }
      ]
    }
  ]
}
```

---

## ✅ Success Criteria

### ✓ Exam Creation Works If:
1. No console errors appear
2. API call is made to `POST /api/Exam`
3. Backend returns success response (status 200/201)
4. User is redirected to `/admin/exams`
5. Success toast message appears
6. New exam appears in the exam list

### ✓ Question Creation Works If:
1. Each question type can be added
2. Options are properly saved
3. Correct answers are marked
4. Question order is maintained

---

## 🐛 Troubleshooting

### Issue: "Failed to create exam"
**Check:**
1. Open browser console (F12)
2. Check Network tab for API call
3. Verify request payload structure
4. Check backend response for error details

### Issue: Questions not saved
**Check:**
1. Ensure at least one correct answer is marked for MCQ/Multiple Select
2. Verify question validation passes
3. Check console for validation errors

### Issue: 401 Unauthorized
**Solution:**
- Logout and login again
- Token might have expired

### Issue: 403 Forbidden
**Solution:**
- User doesn't have admin role
- Verify role assignment in backend

---

## 🔍 Backend Verification

After creating an exam, verify in the backend database:

```sql
-- Check if exam was created
SELECT * FROM Exams ORDER BY Id DESC;

-- Check questions
SELECT * FROM ExamQuestions WHERE ExamId = {examId};

-- Check options
SELECT * FROM QuestionOptions WHERE QuestionId IN 
  (SELECT Id FROM ExamQuestions WHERE ExamId = {examId});
```

---

## 📝 Notes

- **All API calls are real** - no mock data is used
- **Backend URL**: `https://naplan2.runasp.net/api`
- **Authentication required**: Bearer token from login
- **Minimum requirements**:
  - At least 1 question
  - Each MCQ/Multiple Select must have at least 1 correct answer
  - Valid subject and year selection

---

## 🎯 Next Steps

After verifying exam creation works:
1. Test exam editing: `/admin/exam/edit/{id}`
2. Test exam deletion
3. Test exam publishing/unpublishing
4. Verify students can see published exams
5. Test exam taking flow
6. Test grading functionality

---

## 🚨 Known Limitations

1. **Edit mode** loads exam data from API (verify backend returns questions)
2. **Adding questions to existing exam** uses separate API call (`POST /api/Exam/{examId}/questions`)
3. **Updating questions** - backend may not have update endpoint yet (check Swagger)

---

**Testing Date**: November 21, 2025  
**Status**: ✅ Ready for Testing  
**API Mode**: Real Backend Only
