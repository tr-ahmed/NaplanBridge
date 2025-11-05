# 🔍 Debugging Guide: Preview Mode Not Showing

**Date:** December 5, 2025  
**Issue:** Empty state showing instead of lesson previews  
**Status:** 🔴 Investigating

---

## 🐛 Problem Description

When student selects a locked term (no subscription):
- ❌ Shows: "This Term is Locked" (empty state)
- ✅ Expected: "Preview Mode" with lesson cards

---

## 📋 Checklist

### 1. Check Console Logs

Open browser console and look for these logs:

```
🔄 ====== SWITCHING TERM ======
🔄 Selected Term: { termId: X, termNumber: Y, hasAccess: false }
📚 Loading lessons for: subjectId=1, termNumber=4
📡 API Call: getLessonsByTermNumber(1, 4, 123)
📦 API Response: { lessonsCount: 0 or 27 }
```

**Key Questions:**
- [ ] Is `termNumber` correct? (1-4)
- [ ] Is API returning lessons? (`lessonsCount > 0`)
- [ ] Does first lesson have `hasAccess: false`?

---

### 2. Check API Response

**Expected Response (Preview Mode):**
```json
[
  {
    "id": 101,
    "title": "Introduction to Algebra",
    "hasAccess": false,
    "isLocked": true,
    "videoUrl": null,
    "posterUrl": "https://..."
  }
]
```

**Check in Network Tab:**
- [ ] Status: 200 OK (not 403)
- [ ] Response has lessons array
- [ ] Each lesson has `hasAccess: false`
- [ ] Each lesson has `isLocked: true`

---

### 3. Common Issues

#### Issue 1: Backend Not Updated
**Symptom:** API returns 403 or empty array  
**Solution:** Verify backend deployed with preview changes

#### Issue 2: Wrong Term Number
**Symptom:** API call uses `termNumber=1` instead of selected term  
**Check:** Console log shows correct `termNumber`

#### Issue 3: Frontend Not Updated
**Symptom:** Old code still running  
**Solution:** Clear cache, rebuild, refresh

---

## 🔧 Quick Fixes

### Fix 1: Force Reload Lessons
```typescript
// In browser console:
window.location.reload(true);
```

### Fix 2: Check API Manually
```bash
# Test API directly
curl https://naplan2.runasp.net/api/Lessons/subject/1/term-number/4/with-progress/123
```

**Expected:**
- Status: 200
- Body: Array of lessons with `hasAccess: false`

---

## 📊 Debug Flow

```
User selects Term 4
    ↓
switchTerm(termId) called
    ↓
    Log: "🔄 ====== SWITCHING TERM ======"
    Log: "termNumber: 4"
    ↓
loadLessonsByTermNumber(1, 4) called
    ↓
    Log: "📡 API Call: getLessonsByTermNumber(1, 4, 123)"
    ↓
API returns response
    ↓
    Log: "📦 API Response: { lessonsCount: ?? }"
    ↓
IF lessonsCount === 0:
    → Empty state shown ❌
    → Check: Why no lessons?

IF lessonsCount > 0:
    → Lessons displayed ✅
    → Check: hasAccess field?
```

---

## 🎯 Expected Console Output

### Scenario: Preview Mode (No Subscription)

```
🔄 ====== SWITCHING TERM ======
🔄 Selected Term: {
  termId: 15,
  termNumber: 4,
  termName: "Term 4",
  hasAccess: false
}
🔒 Updated UI: hasAccess=false, showBanner=true
📚 Loading lessons for: subjectId=1, termNumber=4
📡 API Call: getLessonsByTermNumber(1, 4, 123)
📦 API Response: {
  lessonsCount: 27,
  firstLesson: {
    id: 101,
    title: "Introduction to Algebra",
    hasAccess: false,
    isLocked: true,
    videoUrl: null
  }
}
✅ Loaded 27 lessons for term 4
🔍 Checking hasAccess: {
  hasAccessField: false,
  isLocked: true,
  videoUrl: null
}
🎯 Access Status: PREVIEW MODE
🔒 Preview mode - Student viewing locked lessons
📚 Showing 27 lesson previews
```

---

## ⚠️ Common Mistakes

### Mistake 1: Using termId instead of termNumber
```typescript
// ❌ WRONG
loadLessonsByTermNumber(subjectId, term.id)

// ✅ CORRECT
loadLessonsByTermNumber(subjectId, term.termNumber)
```

### Mistake 2: Not handling empty response
```typescript
// ❌ WRONG
if (lessons.length > 0) {
  // Show lessons
} else {
  // Show empty state ← This is wrong for preview mode!
}

// ✅ CORRECT
// Backend should return lessons even without subscription
// Empty array means truly no content (not just locked)
```

---

## 📝 Testing Steps

1. **Open browser console** (F12)
2. **Navigate to subject** (e.g., Algebra)
3. **Select locked term** (e.g., Term 4)
4. **Watch console logs:**
   - Should see "SWITCHING TERM"
   - Should see API call
   - Should see "lessonsCount: 27" (not 0)
   - Should see "PREVIEW MODE"
5. **Check UI:**
   - Should see lesson cards (not empty state)
   - Each card has 🔒 lock icon
   - Top has "Add to Cart" button

---

## 🚨 If Still Not Working

### Step 1: Verify Backend
```bash
# Check if backend returns preview data
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://naplan2.runasp.net/api/Lessons/subject/1/term-number/4/with-progress/123

# Should return:
# - 200 OK
# - Array with lessons
# - hasAccess: false on each lesson
```

### Step 2: Check Frontend Build
```bash
# Rebuild frontend
ng build --configuration=development
```

### Step 3: Clear All Cache
1. Clear browser cache (Ctrl+Shift+Del)
2. Clear Angular cache: `ng cache clean`
3. Restart dev server: `ng serve`

---

## 📞 Report Issue

If problem persists, provide:
- [ ] Console logs (full output)
- [ ] Network tab screenshot (API call)
- [ ] UI screenshot (empty state)
- [ ] Browser version
- [ ] User role (student ID)

---

**Next Steps:**
1. Check console logs
2. Verify API response
3. Report findings

