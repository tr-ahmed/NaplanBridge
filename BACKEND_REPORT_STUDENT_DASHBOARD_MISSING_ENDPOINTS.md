# 📌 BACKEND REPORT - Student Dashboard Missing Endpoints

**Date:** November 30, 2025  
**Component:** Student Dashboard  
**Status:** ⚠️ Real API Integration Required - Resume Functionality Broken

---

## 🔥 Critical Issues

### Issue #1: Resume Lesson Button Not Working
**Problem:** When student clicks "Resume" button in "Recently Started Lessons" section, it navigates to `/lessons` (generic page) instead of the specific lesson.

**Root Cause:** `RecentActivity` response from backend missing `lessonId` field.

**User Impact:** 🔴 HIGH - Students cannot directly resume their in-progress lessons

---

## 🔍 Current Issues

### 1. Recent Activities Endpoint
**Issue:** The "Recent Activity" section shows placeholder data from activities API, but the data structure might not be optimal.

**Current Endpoint:**
```
GET /api/Dashboard/student/{studentId}/recent-activities
```

**Current Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "title": "Completed Algebra Lesson 5",
      "description": "Linear Equations",
      "type": "LessonCompleted",
      "date": "2024-11-25T14:30:00Z"
    }
  ]
}
```

**❌ Problem:** Missing critical data:
- No `lessonId` to navigate to specific lesson
- No `examId` for exam activities
- No `subjectId` for filtering
- No `progress` percentage for lesson progress activities

**✅ Required Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "title": "Completed Algebra Lesson 5",
      "description": "Linear Equations",
      "type": "LessonProgress" | "LessonCompleted" | "ExamTaken" | "AchievementUnlocked",
      "date": "2024-11-25T14:30:00Z",
      "lessonId": 45,        // ✅ Required for navigation
      "examId": null,
      "subjectId": 5,
      "subjectName": "Mathematics",
      "progress": 75,        // ✅ Progress percentage (0-100)
      "score": null,         // For exams
      "metadata": {
        "termId": 2,
        "weekId": 8
      }
    }
  ]
}
```

---

### 2. Recently Started Lessons Endpoint
**Issue:** No dedicated endpoint to get lessons in progress with resume capability.

**Required Endpoint:**
```
GET /api/Lessons/student/{studentId}/in-progress
```

**Description:** Get all lessons that student has started but not completed yet.

**Required Response:**
```json
{
  "success": true,
  "data": [
    {
      "lessonId": 45,
      "title": "Linear Equations",
      "description": "Learn about solving linear equations",
      "subjectId": 5,
      "subjectName": "Mathematics",
      "termId": 2,
      "termNumber": 2,
      "weekId": 8,
      "weekNumber": 3,
      "progress": 65,              // ✅ How much completed (0-100)
      "lastAccessedAt": "2024-11-25T14:30:00Z",
      "duration": 45,              // Total duration in minutes
      "timeSpent": 29,             // Time spent so far in minutes
      "posterUrl": "https://...",
      "videoUrl": "https://..."
    }
  ]
}
```

**Business Logic:**
- Only return lessons where `progress > 0` AND `progress < 100`
- Order by `lastAccessedAt DESC`
- Include lesson details for direct navigation

---

### 3. Mock Dashboard Service
**Issue:** Component still imports and uses `MockDashboardService`.

**Files Affected:**
```typescript
// student-dashboard.component.ts
import { MockDashboardService } from '../../core/services/mock-dashboard.service';
private mockDashboardService = inject(MockDashboardService);

// Methods using mock data:
- loadMockDashboardData()
- loadMockProgress()
- loadMockSubscriptions()
- loadMockCertificates()
- loadMockAchievements()
- calculateMockStats()
```

**Action Required:** Remove all mock-related code once real endpoints are available.

---

## 📋 Summary of Required Backend Changes

### ✅ Already Available
1. ✅ `/api/Dashboard/student/{studentId}/subscriptions-summary`
2. ✅ `/api/Progress/by-student/{studentId}`
3. ✅ `/api/Dashboard/student/{studentId}/exam-history`
4. ✅ `/api/Dashboard/student/{studentId}/upcoming-exams`

### 🆕 New Endpoints Required

#### 1. Enhanced Recent Activities
```http
GET /api/Dashboard/student/{studentId}/recent-activities
```
**Changes Needed:**
- Add `lessonId` field
- Add `examId` field
- Add `subjectId` field
- Add `subjectName` field
- Add `progress` field (for lesson activities)
- Add `score` field (for exam activities)
- Add `metadata` object with termId, weekId

#### 2. In-Progress Lessons
```http
GET /api/Lessons/student/{studentId}/in-progress
```
**New Endpoint:**
- Get all lessons with 0 < progress < 100
- Include last accessed date
- Include time spent vs total duration
- Order by lastAccessedAt DESC
- Include poster and video URLs for direct navigation

---

## 🔧 Frontend Actions Required

Once backend endpoints are updated:

1. **Remove Mock Service:**
   ```typescript
   // Remove import
   - import { MockDashboardService } from '../../core/services/mock-dashboard.service';
   - private mockDashboardService = inject(MockDashboardService);
   
   // Remove methods
   - loadMockDashboardData()
   - loadMockProgress()
   - loadMockSubscriptions()
   - loadMockCertificates()
   - loadMockAchievements()
   - calculateMockStats()
   ```

2. **Update Recent Activities Display:**
   ```typescript
   // Add lessonId to activity interface
   interface RecentActivity {
     id: number;
     title: string;
     description: string;
     type: string;
     date: string;
     lessonId?: number;      // ✅ Add
     examId?: number;        // ✅ Add
     subjectId?: number;     // ✅ Add
     subjectName?: string;   // ✅ Add
     progress?: number;      // ✅ Add
     score?: number;         // ✅ Add
   }
   ```

3. **Fix Resume Lesson Navigation:**
   ```typescript
   resumeLesson(activity: RecentActivity): void {
     if (activity.lessonId) {
       this.router.navigate(['/lesson', activity.lessonId]);
     } else {
       this.toastService.showError('Lesson ID not available');
     }
   }
   ```

4. **Add In-Progress Lessons Section:**
   ```typescript
   // Load in-progress lessons
   this.lessonService.getInProgressLessons(this.studentId).subscribe({
     next: (lessons) => {
       this.inProgressLessons.set(lessons);
     }
   });
   ```

---

## 🎯 Impact

**High Priority:**
- ✅ Recent Activities enhancement - enables proper navigation
- ✅ In-Progress Lessons endpoint - critical for resume functionality

**Medium Priority:**
- Remove mock data - cleanup and maintainability

---

## ✅ Definition of Done

- [ ] Backend: Recent Activities includes lessonId, examId, progress
- [ ] Backend: New endpoint for in-progress lessons
- [ ] Frontend: Mock service removed
- [ ] Frontend: Resume button navigates to actual lesson
- [ ] Frontend: No placeholder/mock data visible
- [ ] Testing: All dashboard sections load real data
- [ ] Testing: Navigation works for all activity types

---

**End of Report**
