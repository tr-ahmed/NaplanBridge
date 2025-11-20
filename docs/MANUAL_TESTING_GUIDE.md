# 🧪 Manual Testing Guide

**URL:** http://localhost:4300/student/exam/2

---

## Step-by-Step Testing

### Step 1: Navigate to Exam Page
```
Browser URL: http://localhost:4300/student/exam/2
Expected: See exam instructions page with:
  ✅ Exam title
  ✅ Duration (e.g., "30 Minutes")
  ✅ Number of questions
  ✅ Total marks
  ✅ "Start Exam Now" button
```

### Step 2: Start Exam
```
Action: Click "Start Exam Now"
Expected: 
  ✅ First question displayed
  ✅ Question text visible
  ✅ Answer options visible (for MCQ) or textarea (for Text)
  ✅ Timer shows countdown
  ✅ Sidebar shows question numbers
```

### Step 3: Check Question Display
```
Expected for EACH question type:
  
TEXT question:
  ✅ Textarea visible with placeholder "Type your answer here..."
  ✅ Can type in it
  
MCQ (Multiple Choice):
  ✅ Radio buttons visible
  ✅ Option text displayed
  ✅ Can select one option
  
MultiSelect (Multiple Selection):
  ✅ Checkboxes visible
  ✅ Text "Select all that apply"
  ✅ Can select multiple options
  
TrueFalse:
  ✅ Two options: "True" and "False"
  ✅ Can select one
```

### Step 4: Navigate Questions
```
Action 1: Click "Next" button
Expected:
  ✅ Move to next question
  ✅ Previous answer remembered
  ✅ Question counter updated

Action 2: Click question number in sidebar
Expected:
  ✅ Jump to that question
  ✅ That question highlighted in blue in sidebar

Action 3: Click "Previous" button
Expected:
  ✅ Move to previous question
  ✅ Previous answers still there
```

### Step 5: Check Answer Persistence
```
Action 1: Answer question 1
Action 2: Go to question 2
Action 3: Go back to question 1
Expected:
  ✅ Question 1 answer still there (not cleared)
```

### Step 6: Check Progress
```
Expected:
  ✅ Progress percentage increases as you answer
  ✅ Shows "X/Y answered" counter
  ✅ Sidebar shows answered questions in green
  ✅ Progress bar fills up
```

### Step 7: Submit Exam
```
Action 1: Answer at least one question (or leave empty, both work)
Action 2: Click "Submit Exam" button
Expected:
  ✅ Confirmation dialog appears
  ✅ Can click "OK" or "Cancel"

Action 3: Click "OK" in dialog
Expected:
  ✅ Button shows "Submitting..."
  ✅ Button is disabled
  ✅ Loading state shown
  ✅ After 2 seconds, redirect to results page (or success message)
```

### Step 8: Test Timer Warning
```
When timer gets to 5 minutes:
  ✅ Toast notification: "5 minutes remaining!"

When timer gets to 1 minute:
  ✅ Toast notification: "1 minute remaining!"

When timer reaches 0:
  ✅ Toast: "Time's up! Submitting your exam..."
  ✅ Auto-submit happens
  ✅ Redirect to results
```

---

## Console Checks (F12 DevTools)

### Open DevTools
```
Press: F12
Go to: Console tab
```

### Check for Good Logs
```
Look for:
✅ "🚀 Submitting exam: { studentExamId: ..., answersCount: ... }"
✅ No RED errors
✅ No warnings about missing options
```

### Check for Bad Logs
```
❌ Errors like "Cannot read property 'id' of undefined"
❌ "currentQuestion is null"
❌ Network errors
```

---

## Network Tab Checks (F12 DevTools)

### Open Network Tab
```
Press: F12
Click: Network tab
Filter: XHR
```

### When Starting Exam
```
Expected request:
  POST /api/exam/2/start
  Status: 200
  Response has: studentExamId, questions, options
```

### When Submitting Exam
```
Expected request:
  POST /api/exam/2/submit
  Status: 200 (or 409 if duplicate)
  Response has: studentExamId, score, totalMarks
```

---

## Known Issues & Workarounds

### Issue 1: Questions Not Showing
**Fix:**
1. Refresh page (F5)
2. Check console for errors
3. Check Network tab for API errors

### Issue 2: Answer Not Saving
**Fix:**
1. Check if you're clicking on the right element
2. For text: Check if textarea is focused
3. For options: Check if radio/checkbox is clickable

### Issue 3: Double-Click Error
**This is FIXED now:**
  ✅ Button disables after first click
  ✅ Only 1 request sent to backend
  ✅ No "Already submitted" error

### Issue 4: Timer Not Counting
**Check:**
1. Refresh page
2. Check browser console
3. Check if durationInMinutes is correct

---

## Success Criteria

All items should be ✅:

- [ ] Questions display correctly
- [ ] Answer input fields visible
- [ ] Can answer all types (Text, MCQ, MultiSelect, TrueFalse)
- [ ] Answers persist when navigate
- [ ] Progress bar updates
- [ ] Submit button works
- [ ] No double submission
- [ ] Timer counts down
- [ ] Timer warnings appear
- [ ] Auto-submit happens at 0
- [ ] Redirect to results page

---

**If all items are ✅, then READY TO GO!**

