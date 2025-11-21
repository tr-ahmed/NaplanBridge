# 🧪 Student Dashboard - Quick Testing Guide

## 🎯 How to Test Recent Activity & Recently Started Lessons

---

## 📍 Step 1: Login as Student

1. Open the app: `http://localhost:4200`
2. Login with student credentials
3. Navigate to Student Dashboard

---

## 📍 Step 2: Open Browser Console

Press `F12` or `Ctrl+Shift+I` to open Developer Tools

### Check Console Logs

You should see:
```
🎓 Loading dashboard for Student.Id: X
🔄 Loading recent activities for studentId: X
📥 Recent activities response: {...}
✅ Recent activities loaded: X activities
📊 Activities breakdown: {total: X, lessons: X, exams: X, ...}
```

---

## 📍 Step 3: Check Network Tab

1. Open **Network** tab in DevTools
2. Filter by **XHR** or **Fetch**
3. Look for request: `recent-activities`

### Expected Request
```
Request URL: https://your-api.com/api/Student/123/recent-activities
Method: GET
Status: 200 OK
```

### Expected Response
```json
{
  "success": true,
  "data": [
    {
      "title": "Introduction to Mathematics",
      "description": "Completed 50% of the lesson",
      "type": "LessonProgress",
      "date": "2025-11-21T10:30:00Z"
    },
    {
      "title": "Science Quiz #1",
      "description": "Scored 85%",
      "type": "ExamTaken",
      "date": "2025-11-20T14:15:00Z"
    }
  ]
}
```

---

## 📍 Step 4: Visual Inspection

### Recent Activity Section

**Expected Display:**
- [ ] Section title: "Recent Activity" with 🔔 icon
- [ ] Shows last 5 activities
- [ ] Each activity has:
  - Colored circle icon (📝📚🏆⭐)
  - Activity title (bold)
  - Activity description
  - Time ago (e.g., "2h ago", "1d ago")
  - Activity type badge (colored)

**Activity Colors:**
- ExamTaken → Blue
- LessonProgress/Completed → Green
- CertificateEarned → Purple
- AchievementUnlocked → Yellow

### Recently Started Lessons Section

**Expected Display:**
- [ ] Section title: "Recently Started Lessons" with 📖 icon
- [ ] Shows only lessons (filtered from activities)
- [ ] Each lesson has:
  - Green left border
  - Lesson icon 📚
  - Lesson title
  - Description
  - "In Progress" badge
  - Green "Resume" button with play icon ▶

---

## 📍 Step 5: Test Empty States

### If No Activities
Should show:
```
🔔 Recent Activity
┌─────────────────────┐
│    🕐 icon          │
│ No recent activities│
│ Start learning to   │
│ see your activity   │
└─────────────────────┘
```

### If No Lessons
Should show:
```
📖 Recently Started Lessons
┌─────────────────────┐
│    📚 icon          │
│ No lessons started  │
│   [Browse Lessons]  │
└─────────────────────┘
```

---

## 📍 Step 6: Test Interactions

### Resume Button
1. Click **Resume** button on any lesson
2. Should navigate to lessons page
3. Toast message: "Resuming: [Lesson Title]"

### View All Button
1. If more than 5 activities → "View All (X)" appears
2. If more than 4 lessons → "View All X Lessons in Progress"

---

## 🚨 Common Issues & Solutions

### Issue 1: No Activities Display

**Symptoms:**
- Empty state shows even with API data
- Console shows data but UI is blank

**Solutions:**
```typescript
// Check signal value
console.log('Activities signal:', this.recentActivities());

// Check if data structure matches
// Expected: response.data = RecentActivity[]
```

### Issue 2: API 404 Error

**Symptoms:**
```
❌ 404: Recent activities endpoint not found
```

**Solutions:**
1. Verify backend endpoint exists
2. Check API base URL in environment
3. Verify student authentication token

### Issue 3: API 500 Error

**Symptoms:**
```
❌ Backend 500 Error: Recent activities endpoint failed
```

**Solutions:**
1. Check backend logs
2. Verify database connection
3. Check studentId is valid
4. Verify activity records exist in DB

### Issue 4: Wrong Activity Types

**Symptoms:**
- All icons are the same
- Wrong colors displayed

**Solutions:**
```typescript
// Check type field in API response
// Must match exactly:
'ExamTaken' | 'LessonProgress' | 'LessonCompleted' | 
'CertificateEarned' | 'AchievementUnlocked' | 
'SubscriptionActivated'
```

---

## 🧪 Manual Test Cases

### Test Case 1: Full Dashboard Load
**Steps:**
1. Login as student
2. Dashboard loads
3. Check all sections visible

**Expected:**
- ✅ Stats cards show numbers
- ✅ Recent Activity shows ≤5 items
- ✅ Recently Started Lessons shows ≤4 items
- ✅ No console errors

### Test Case 2: Mixed Activity Types
**Setup:** Backend returns different activity types

**Expected:**
- ✅ Each type shows correct icon
- ✅ Each type shows correct color
- ✅ Badges display correct type name

### Test Case 3: Only Lessons
**Setup:** Backend returns only lesson activities

**Expected:**
- ✅ Recent Activity shows lessons
- ✅ Recently Started Lessons shows same lessons
- ✅ Lesson count matches

### Test Case 4: No Data
**Setup:** Backend returns empty array

**Expected:**
- ✅ Empty state displays in Recent Activity
- ✅ Empty state displays in Recently Started Lessons
- ✅ No errors in console
- ✅ Dashboard still loads other sections

### Test Case 5: API Failure
**Setup:** Backend returns error or is offline

**Expected:**
- ✅ Console logs error
- ✅ Empty state displays
- ✅ Dashboard doesn't crash
- ✅ Other sections still work

---

## 📊 Test Results Template

Copy and fill this out:

```markdown
## Test Results - [Date]

**Tester:** [Your Name]
**Environment:** [Dev/Staging/Production]
**Browser:** [Chrome/Firefox/Safari]

### ✅ Passed Tests
- [ ] Dashboard loads successfully
- [ ] Recent Activity displays correctly
- [ ] Recently Started Lessons displays correctly
- [ ] API call successful (200 OK)
- [ ] Data displayed matches API response
- [ ] Icons and colors correct
- [ ] Empty states work
- [ ] Resume button works
- [ ] No console errors

### ❌ Failed Tests
- [ ] Issue description...

### 📝 Notes
- ...

### 🐛 Bugs Found
1. ...

### 📸 Screenshots
[Attach screenshots if needed]
```

---

## 🔧 Debug Commands

### Check Component State
```javascript
// In browser console after dashboard loads
angular.probe($0).componentInstance.recentActivities()
angular.probe($0).componentInstance.getRecentLessons()
```

### Force Reload Activities
```javascript
// In console
angular.probe($0).componentInstance.refresh()
```

### Check Service Response
```javascript
// Check what service returned
console.log('Service response:', 
  angular.probe($0).componentInstance.dashboardService
);
```

---

## ✅ Sign-Off Checklist

Before marking as "TESTED & WORKING":

- [ ] API endpoint verified in Swagger/Postman
- [ ] API returns correct data format
- [ ] Dashboard loads without errors
- [ ] Recent Activity section displays
- [ ] Recently Started Lessons section displays
- [ ] Activity types show correct icons
- [ ] Time display works correctly
- [ ] Empty states tested
- [ ] Error handling tested
- [ ] Responsive on mobile/tablet
- [ ] No console warnings
- [ ] Performance is acceptable

---

## 📞 Who to Contact

| Issue Type | Contact |
|------------|---------|
| Backend API issues | Backend Team |
| UI/Display issues | Frontend Team |
| Data not showing | Check both teams |
| Performance issues | DevOps/Backend |

---

## 🎯 Success Criteria

Feature is considered **WORKING** when:

1. ✅ API returns data successfully
2. ✅ Recent Activity displays all activity types correctly
3. ✅ Recently Started Lessons filters and displays lessons
4. ✅ All icons, colors, and badges are correct
5. ✅ Empty states work when no data
6. ✅ Error handling works when API fails
7. ✅ No console errors
8. ✅ Resume button navigates correctly
9. ✅ Time display is accurate
10. ✅ Responsive design works

---

**Happy Testing! 🚀**
