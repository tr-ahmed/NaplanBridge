# ❓ Backend Inquiry Report: Preview Lessons Without Subscription

**Date:** December 5, 2025  
**Feature:** Preview Mode for Locked Terms  
**Status:** 🔴 **ENDPOINT MODIFICATION NEEDED**  
**Priority:** 🔴 HIGH (Critical UX Feature)

---

## 1. Inquiry Topic

Request modification to lessons endpoint to return lesson **previews** (titles, descriptions, thumbnails) even when student doesn't have an active subscription.

---

## 2. Current Situation

### Problem:

Currently, when a student accesses a term without subscription:

```
GET /api/Lessons/subject/{subjectId}/term-number/{termNumber}/with-progress/{studentId}
→ Returns 403 Forbidden
```

This blocks the frontend from showing lesson names/previews, which hurts UX.

### Desired Behavior:

```
GET /api/Lessons/subject/{subjectId}/term-number/{termNumber}/with-progress/{studentId}
→ Returns 200 OK with lessons array (limited data)
```

**For non-subscribed students:**
- ✅ Return lesson titles
- ✅ Return lesson descriptions
- ✅ Return thumbnails/posters
- ✅ Return lesson order/number
- ❌ Don't return video URLs
- ❌ Don't return resources
- ❌ Don't return progress data
- ✅ Add `isLocked: true` flag

---

## 3. User Story

**As a student without subscription:**
- I want to **see lesson titles** so I know what content is available
- I want to **see lesson descriptions** so I understand what I'll learn
- I want to **see thumbnails** to make the interface appealing
- I want to click "Add to Cart" knowing exactly what I'm buying

**Current Experience (Bad):**
```
1. Student navigates to Algebra → Term 4
2. Sees: "Loading..."
3. Sees: "No lessons available" (403 error)
4. Thinks: "This term has no content!"
5. Leaves without subscribing ❌
```

**Desired Experience (Good):**
```
1. Student navigates to Algebra → Term 4
2. Sees 27 lesson cards with titles & thumbnails
3. Each card shows 🔒 lock icon
4. Top shows: "Add to Cart" button with "$29.99"
5. Student understands value proposition
6. Clicks "Add to Cart" ✅
```

---

## 4. Proposed Solution

### Option 1: Modify Existing Endpoint (Recommended)

**Endpoint:**
```
GET /api/Lessons/subject/{subjectId}/term-number/{termNumber}/with-progress/{studentId}
```

**Change Behavior:**
- If student has subscription → Return full data (current behavior)
- If student doesn't have subscription → Return preview data (NEW)

**Preview Response Example:**
```json
[
  {
    "id": 101,
    "title": "Introduction to Algebra",
    "description": "Learn the basics of algebra including variables and equations",
    "thumbnailUrl": "https://cdn.example.com/thumbnails/lesson101.jpg",
    "posterUrl": "https://cdn.example.com/posters/lesson101.jpg",
    "lessonNumber": 1,
    "orderIndex": 1,
    "duration": 45,
    "difficulty": "Easy",
    "isLocked": true,  // ← NEW: Indicates no access
    "videoUrl": null,  // Hidden for preview
    "resources": [],   // Empty for preview
    "progress": null,  // No progress data
    "hasAccess": false // ← NEW: Subscription status
  },
  {
    "id": 102,
    "title": "Variables and Expressions",
    "description": "Understanding algebraic variables and how to form expressions",
    "thumbnailUrl": "https://cdn.example.com/thumbnails/lesson102.jpg",
    "posterUrl": "https://cdn.example.com/posters/lesson102.jpg",
    "lessonNumber": 2,
    "orderIndex": 2,
    "duration": 50,
    "difficulty": "Easy",
    "isLocked": true,
    "videoUrl": null,
    "resources": [],
    "progress": null,
    "hasAccess": false
  }
  // ... more lessons
]
```

---

### Option 2: Create New Preview Endpoint

**New Endpoint:**
```
GET /api/Lessons/subject/{subjectId}/term-number/{termNumber}/preview
```

**Returns:** Same preview data as Option 1

**Note:** This requires frontend changes to detect subscription status first, then choose which endpoint to call.

---

## 5. Backend Implementation (Option 1 - Recommended)

### Current Logic:
```csharp
public async Task<IActionResult> GetLessonsByTermNumberWithProgress(
    int subjectId, 
    int termNumber, 
    int studentId)
{
    // Check if student has access
    var hasAccess = await _subscriptionService
        .HasAccessToTerm(studentId, subjectId, termNumber);
    
    if (!hasAccess)
    {
        return Forbid(); // ❌ Returns 403
    }
    
    // Return full lesson data
    var lessons = await _lessonService.GetLessonsWithProgress(...);
    return Ok(lessons);
}
```

### Proposed Logic:
```csharp
public async Task<IActionResult> GetLessonsByTermNumberWithProgress(
    int subjectId, 
    int termNumber, 
    int studentId)
{
    // Check if student has access
    var hasAccess = await _subscriptionService
        .HasAccessToTerm(studentId, subjectId, termNumber);
    
    if (!hasAccess)
    {
        // ✅ Return preview data instead of 403
        var previewLessons = await _lessonService
            .GetLessonsPreview(subjectId, termNumber);
        
        // Mark all as locked
        foreach (var lesson in previewLessons)
        {
            lesson.IsLocked = true;
            lesson.HasAccess = false;
            lesson.VideoUrl = null;
            lesson.Resources = new List<Resource>();
            lesson.Progress = null;
        }
        
        return Ok(previewLessons);
    }
    
    // Return full lesson data for subscribed students
    var lessons = await _lessonService
        .GetLessonsWithProgress(subjectId, termNumber, studentId);
    
    foreach (var lesson in lessons)
    {
        lesson.HasAccess = true;
        lesson.IsLocked = false; // Or based on prerequisites
    }
    
    return Ok(lessons);
}
```

---

## 6. Frontend Handling

### Current Code:
```typescript
// lessons.component.ts
this.coursesService.getLessonsByTermNumber(subjectId, termNumber, studentId)
  .subscribe({
    next: (lessons) => {
      this.lessons.set(lessons);
      this.loading.set(false);
    },
    error: (error) => {
      if (error.status === 403) {
        // ❌ Shows empty state
        this.lessons.set([]);
      }
    }
  });
```

### After Backend Change:
```typescript
// lessons.component.ts
this.coursesService.getLessonsByTermNumber(subjectId, termNumber, studentId)
  .subscribe({
    next: (lessons) => {
      // ✅ Always receives lessons (preview or full)
      this.lessons.set(lessons);
      
      // Check if first lesson is locked (preview mode)
      if (lessons.length > 0 && lessons[0].isLocked) {
        this.hasAccess.set(false);
        this.showSubscriptionBanner.set(true);
      } else {
        this.hasAccess.set(true);
        this.showSubscriptionBanner.set(false);
      }
      
      this.loading.set(false);
    },
    error: (error) => {
      // Error handling for real errors (500, etc.)
      this.error.set('Unable to load lessons');
    }
  });
```

---

## 7. UI Impact

### Before:
```
┌────────────────────────────────────┐
│  Algebra Year 7 - Term 4          │
│                                    │
│  Loading...                        │
│                                    │
│  [Empty State]                     │
│  "No lessons available"            │
│                                    │
│  Student thinks: "No content yet?" │
└────────────────────────────────────┘
```

### After:
```
┌────────────────────────────────────────┐
│  Algebra Year 7 - Term 4   [Add Cart] │
│                Starting from $29.99    │
│                                        │
│  🔒 Preview Mode: Subscribe to unlock │
│                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │🔒Lesson 1│ │🔒Lesson 2│ │🔒Lesson 3│ │
│  │ Intro   │ │Variables │ │Equations │ │
│  │ 45 min  │ │ 50 min  │ │ 40 min  │ │
│  └─────────┘ └─────────┘ └─────────┘ │
│                                        │
│  Student knows: "27 lessons available!"│
└────────────────────────────────────────┘
```

---

## 8. Benefits

### For Students:
- ✅ See exactly what they're buying
- ✅ Understand course structure
- ✅ Make informed decisions
- ✅ Better conversion rate

### For Business:
- ✅ Higher subscription conversions
- ✅ Reduced support tickets ("Where's the content?")
- ✅ Better user engagement
- ✅ Competitive advantage

### For Platform:
- ✅ Better UX/UI
- ✅ Consistent behavior across all terms
- ✅ Easier to implement freemium features later
- ✅ Preview → Trial → Subscribe funnel

---

## 9. Security Considerations

### What to Hide:
- ❌ Video URLs
- ❌ Resource download links
- ❌ Quiz/exam questions
- ❌ Progress data
- ❌ Sensitive lesson content

### What to Show:
- ✅ Lesson titles
- ✅ Lesson descriptions (public info)
- ✅ Thumbnails/posters (marketing material)
- ✅ Lesson order/structure
- ✅ Duration/difficulty

**Rationale:** This is equivalent to showing a "course syllabus" which is standard for any educational platform.

---

## 10. Alternative Approach (If Backend Can't Change)

### Frontend Workaround:

If backend cannot return preview data, we could:

1. Create a **static preview** in frontend
2. Use **cached lesson list** from somewhere else
3. Show **generic placeholders** instead of real lessons

**But this is NOT ideal because:**
- ❌ Doesn't show real lesson data
- ❌ Requires manual updates
- ❌ Less engaging for students
- ❌ Harder to maintain

---

## 11. Comparison with Competitors

### Coursera, Udemy, Khan Academy:
All show **full course syllabus** including:
- ✅ All lesson titles
- ✅ Lesson descriptions
- ✅ Video previews (first few seconds)
- ✅ Course structure

**Our approach is even more conservative** (we don't even show video previews).

---

## 12. Testing Scenarios

### Test 1: Student With Subscription ✅
```
Request: GET /api/Lessons/subject/1/term/3/...
Expected: Full lesson data with videoUrl, resources, progress
Result: hasAccess: true, isLocked: false
```

### Test 2: Student Without Subscription ✅
```
Request: GET /api/Lessons/subject/1/term/4/...
Expected: Preview data (no videoUrl, no resources)
Result: hasAccess: false, isLocked: true
```

### Test 3: Invalid Term ✅
```
Request: GET /api/Lessons/subject/1/term/99/...
Expected: 404 Not Found or empty array
```

---

## 13. Request Summary

**What We Need:**

1. ✅ Modify existing endpoint to return preview data for non-subscribed students
2. ✅ Add `isLocked` and `hasAccess` flags to lesson DTOs
3. ✅ Hide sensitive data (video URLs, resources) in preview mode
4. ✅ Return 200 OK instead of 403 Forbidden

**Expected Timeline:**
- Backend changes: 1-2 hours
- Testing: 30 minutes
- Deployment: Same day

**Priority:** 🔴 HIGH - Critical for user experience and conversion rates

---

## 14. Questions for Backend Team

1. **Is this approach acceptable from security perspective?**
   - Preview data only contains public marketing information

2. **Should we use Option 1 (modify existing) or Option 2 (new endpoint)?**
   - Frontend prefers Option 1 for simplicity

3. **What should happen for completely invalid requests?**
   - E.g., subject doesn't exist, term out of range

4. **Do we need rate limiting for preview requests?**
   - Since it returns less data, should be fine

5. **Should preview data be cached?**
   - Could improve performance

---

**Requested By:** Frontend Team  
**Date:** December 5, 2025  
**Status:** ⏳ Awaiting Backend Response  
**Tracking:** Backend Ticket #TBD

---

**Priority:** 🔴 **CRITICAL** - Blocking optimal user experience  
**Impact:** 📈 **HIGH** - Affects conversion rates and user satisfaction  
**Effort:** ⚡ **LOW** - Small backend change, big UX improvement
