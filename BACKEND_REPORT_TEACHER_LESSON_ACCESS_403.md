# Backend Issue: Teacher Lesson Access 403 Forbidden

## Issue Description
When a teacher tries to access lesson details through `/teacher/lesson-management/:id`, they receive a **403 Forbidden** error from the backend API.

## API Endpoint
- **Endpoint**: `GET /api/Lessons/{id}`
- **Current Behavior**: Returns 403 Forbidden for Teacher role
- **Expected Behavior**: Should allow teachers to access lessons they are assigned to

## Error Details
```
GET https://naplan2.runasp.net/api/Lessons/50 403 (Forbidden)
```

## Root Cause
The `/api/Lessons/{id}` endpoint appears to be restricted to Admin role only. Teachers need access to view lesson details for lessons they are teaching.

## Frontend Implementation
✅ **Temporary Solution Implemented**:
- Added 403 error handling with user-friendly message
- Automatically redirects user back when access is denied
- Shows clear explanation that this is a backend permission issue

## Backend Fix Required
The backend needs to:

1. **Update Authorization Policy** for `/api/Lessons/{id}`:
   - Allow Admin role (current behavior)
   - Allow Teacher role with validation:
     - Teacher can only access lessons for subjects they teach
     - Verify teacher has permission for the subject that contains this lesson

2. **OR Create Teacher-Specific Endpoint**:
   ```
   GET /api/Teachers/lessons/{id}
   ```
   - Returns same `LessonDetailsDto` as admin endpoint
   - Only returns lessons for subjects the authenticated teacher is assigned to

## Alternative Workarounds

### Option 1: Use Admin Account
Teachers can use admin credentials temporarily to access lesson management.

### Option 2: Check Existing Endpoints
Check if there's an alternative endpoint in the API that teachers can use:
- `/api/Lessons/subject/{subjectId}` - Get all lessons in a subject
- Filter on frontend to find the specific lesson

## Related Files
- Frontend: `src/app/features/content-management/lesson-management.component.ts`
- Frontend Route: `/teacher/lesson-management/:id`
- API Endpoint: `/api/Lessons/{id}`

## Priority
🔴 **HIGH** - This blocks teachers from accessing the lesson management feature that was just implemented.

## Date Reported
December 6, 2025
