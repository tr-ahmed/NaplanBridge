# 📌 BACKEND REPORT: Lesson Access Security Vulnerability

## 🔴 Critical Security Issue

**Report Date:** December 4, 2025  
**Priority:** 🔴 CRITICAL  
**Impact:** Students can access lessons without valid subscription

---

## 📍 Issue Description

Students can access lesson content (videos) without having an active subscription by:
1. Directly navigating to `/lesson/{lessonId}` URL
2. The backend does NOT validate subscription before returning lesson details

---

## 🔍 Current Behavior

### Frontend Issues (Will Fix):
- Route `/lesson/:id` has NO subscription guard
- `LessonDetailComponent` loads lesson without checking access
- Access control only exists in UI (easy to bypass)

### Backend Issues (Needs Fix):

**Endpoint:** `GET /api/Lessons/{lessonId}`

**Current Response:** Returns full lesson details including video URL to ANY authenticated user

**Expected Behavior:** Should validate subscription before returning sensitive data (video URL)

---

## ✅ Required Backend Changes

### Option 1: Validate in Lessons Controller (Recommended)

```csharp
[HttpGet("{id}")]
[Authorize]
public async Task<ActionResult<LessonDto>> GetLesson(int id)
{
    var studentId = GetCurrentStudentId();
    
    // ✅ SECURITY: Check subscription access
    var hasAccess = await _subscriptionService.HasAccessToLesson(studentId, id);
    
    if (!hasAccess)
    {
        return Forbid(new
        {
            StatusCode = 403,
            Message = "You do not have an active subscription to access this lesson",
            Details = new
            {
                LessonId = id,
                SubscriptionRequired = true
            }
        });
    }
    
    // Return full lesson details
    return Ok(await _lessonsService.GetLessonById(id));
}
```

### Option 2: Separate Endpoint for Access Check

If you prefer to keep the current endpoint unchanged, provide:

```http
GET /api/StudentSubjects/student/{studentId}/has-access/lesson/{lessonId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "hasAccess": true,
  "reason": null
}
```
or
```json
{
  "hasAccess": false,
  "reason": "No active subscription for this lesson's subject"
}
```

---

## 📊 Affected Endpoints

| Endpoint | Current Status | Required Change |
|----------|---------------|-----------------|
| `GET /api/Lessons/{id}` | ❌ No subscription check | ✅ Add subscription validation |
| `GET /api/Lessons/{id}/video-url` | ❌ No subscription check | ✅ Add subscription validation |
| `POST /api/Progress/students/{studentId}/lessons/{lessonId}` | ❌ No subscription check | ✅ Validate before allowing progress update |

---

## 🛡️ Frontend Fixes (Already Planned)

1. Add `subscriptionGuard` to `/lesson/:id` route
2. Add access check in `LessonDetailComponent.loadLesson()`
3. Show proper error message if access denied

**Note:** Frontend fixes alone are NOT sufficient - backend validation is REQUIRED for security.

---

## 🧪 Test Scenarios

1. **Student without subscription** tries to access `/lesson/123`
   - Expected: 403 Forbidden
   - Current: ❌ Returns lesson details

2. **Student with expired subscription** tries to access lesson
   - Expected: 403 Forbidden
   - Current: ❌ Returns lesson details

3. **Student with different subject subscription** tries to access lesson
   - Expected: 403 Forbidden
   - Current: ❌ Returns lesson details

---

## 📝 Additional Notes

The frontend already has the infrastructure for access control:
- `SubscriptionService.hasAccessToLesson()` method exists
- `subscriptionGuard` is implemented but not applied
- Backend endpoint `/api/StudentSubjects/student/{studentId}/has-access/lesson/{lessonId}` should work

**The gap is:**
1. Backend doesn't enforce access when returning lesson content
2. Frontend route is unprotected

---

## ⏳ Awaiting Backend Fix

Please confirm when the backend validation is implemented so we can complete the frontend security updates.

```
✔ BACKEND FIX CONFIRMED (please reply with this when ready)
```

---

## 🔧 Frontend Changes Ready to Implement

Once backend is fixed, we will:

1. **Update `app.routes.ts`:**
```typescript
{
  path: 'lesson/:id',
  loadComponent: () => import('./features/lesson-detail/lesson-detail.component').then(m => m.LessonDetailComponent),
  canActivate: [authGuard, subscriptionGuard],
  data: { contentType: 'lesson' }
}
```

2. **Update `LessonDetailComponent`:**
```typescript
private loadLesson(lessonId: number): void {
  // First check access
  this.subscriptionService.hasAccessToLesson(studentId, lessonId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (result) => {
        if (!result.hasAccess) {
          this.error.set(result.reason || 'Subscription required');
          this.router.navigate(['/lessons']);
          return;
        }
        // Then load lesson
        this.actuallyLoadLesson(lessonId);
      }
    });
}
```

---

## 📌 Summary

| Component | Issue | Fix Owner |
|-----------|-------|-----------|
| Backend `/api/Lessons/{id}` | No subscription validation | **Backend Team** |
| Backend `/api/Lessons/{id}/video-url` | No subscription validation | **Backend Team** |
| Frontend Route Guard | Not applied | Frontend (waiting) |
| Frontend Component | No access check | Frontend (waiting) |

**Status:** ⏳ Waiting for Backend Fix
