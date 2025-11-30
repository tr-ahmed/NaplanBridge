# 🔍 DEBUG: Term Access Issue

**Date:** 2025-01-28  
**Student:** mohamed (ID: 11)  
**Subject:** Algebra (ID: 1)  
**Expected:** Subscribed to Term 4  
**Actual:** Has access to Term 1

---

## 📊 Console Log Analysis

### From Console:
```javascript
// Initial URL parameters
termNumber: 1  // ❌ Expected: 4
hasAccess: false  // ❌ Then changes to true

// Term Access Status
accessibleTerms: Array(0)  // ❌ Expected: [4]
currentTerm: 1  // ❌ Expected: 4

// But then...
hasAccess: true  // ✅ For term 1
Loaded 29 lessons for term 1  // ✅ Works for term 1
```

---

## 🔍 Possible Causes

### 1. Student is Actually Subscribed to Term 1 (Not Term 4)
**Verification needed:**
- Check database: `SELECT * FROM Subscriptions WHERE StudentId = 11 AND SubjectId = 1`
- Check if subscription is for Term 1, not Term 4

### 2. Term 4 Subscription is Inactive
**Verification needed:**
- Check `IsActive` flag in Subscriptions table
- Check `StartDate` and `EndDate` of subscription

### 3. Backend Still Using Old Logic
**Verification needed:**
- Test API directly: `GET /api/StudentSubjects/student/11/current-term-week?subjectId=1`
- Check response: Should show `currentTermNumber: 4` if subscribed to Term 4

---

## 🧪 Debug Steps

### Step 1: Check API Response Directly

Open browser console and run:
```javascript
fetch('https://naplan2.runasp.net/api/StudentSubjects/student/11/current-term-week?subjectId=1', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Accept': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('📡 API Response:', data));
```

Expected if subscribed to Term 4:
```json
{
  "studentId": 11,
  "currentTermNumber": 4,
  "currentTermName": "Term 4",
  "hasAccess": true,
  "subjectId": 1
}
```

### Step 2: Check Term Access Status

```javascript
fetch('https://naplan2.runasp.net/api/StudentSubjects/student/11/subject/1/term-access', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Accept': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('🔒 Term Access:', data));
```

Expected if subscribed to Term 4:
```json
{
  "studentId": 11,
  "subjectId": 1,
  "currentTermNumber": 4,
  "terms": [
    { "termNumber": 1, "hasAccess": false },
    { "termNumber": 2, "hasAccess": false },
    { "termNumber": 3, "hasAccess": false },
    { "termNumber": 4, "hasAccess": true }  // ✅
  ]
}
```

### Step 3: Check Database

```sql
-- Check student's subscriptions
SELECT 
    s.Id,
    s.StudentId,
    s.SubjectId,
    s.TermId,
    t.TermNumber,
    t.Name as TermName,
    s.IsActive,
    s.StartDate,
    s.EndDate,
    s.PlanType
FROM Subscriptions s
LEFT JOIN Terms t ON s.TermId = t.Id
WHERE s.StudentId = 11 
  AND s.SubjectId = 1
  AND s.IsActive = 1
ORDER BY s.CreatedAt DESC;
```

Expected result:
```
Id | TermId | TermNumber | IsActive | PlanType
---|--------|------------|----------|----------
XX | 4      | 4          | 1        | SingleTerm
```

---

## 🎯 Quick Fix for Testing

If you want to test Term 4 access immediately:

1. **Subscribe to Term 4** via Subscriptions page
2. **Refresh** the courses page
3. **Click "View Lessons"** again
4. **Check console** for `🔍 RAW API Response from getCurrentTermWeek`

---

## 📝 Current Situation

Based on console logs:
- ✅ Student **has access** to Term 1
- ❌ Student **does not have access** to Term 4
- ✅ Code is working correctly (shows Term 1 because that's what backend returns)

**Next Step:** Verify actual subscription in database or create new subscription to Term 4.

---

## 🚨 Action Required

Please provide:
1. Database query result for student's subscriptions
2. Or API response from `/current-term-week` endpoint
3. Or confirm if student actually needs to create Term 4 subscription

This will help us determine if:
- A) Backend still has bug (unlikely based on logs)
- B) Student is subscribed to Term 1 (most likely)
- C) Subscription is inactive or expired
