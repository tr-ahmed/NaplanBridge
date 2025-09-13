# Lessons API Update Summary

## Overview
Updated the lessons functionality to use the new API endpoint `/api/Lessons/subject/{subjectId}` instead of the previous subject-based filtering approach.

## Changes Made

### 1. Lesson Models (`lesson.models.ts`)
- **Updated `Lesson` interface** to match new API response structure:
  - Made `posterUrl` and `videoUrl` required fields from API
  - Added `weekId`, `subjectId`, `termId` as required fields from API
  - Made other fields optional to handle backward compatibility
  - Updated `LessonFilter` interface to support both old and new filtering

### 2. API Nodes (`api-nodes.ts`)
- **Added new endpoint**: `getLessonsBySubjectId` with URL `/Lessons/subject/:subjectId`
- Kept existing endpoints for backward compatibility

### 3. Lessons Service (`lessons.service.ts`)
- **Added new method**: `getLessonsBySubjectId(subjectId: number)` for the new API endpoint
- **Updated mock data** to match new lesson structure with required fields
- **Enhanced filter method** to handle both old and new filter properties
- **Fixed type safety issues** with optional fields

### 4. Lessons Component (`lessons.component.ts`)
- **Added state tracking** for `currentSubjectId` 
- **Updated route parameter handling** to support both `subjectId` and `subject` parameters
- **Added new method**: `loadLessonsForSubjectId()` for preferred API calls
- **Enhanced navigation methods** to pass both subjectId and subject name
- **Updated utility methods** to handle optional lesson properties:
  - `formatDuration()` handles undefined duration
  - `getDifficultyColorClass()` handles undefined difficulty

### 5. Lessons Template (`lessons.component.html`)
- **Updated image source** to use `posterUrl` as primary, with `thumbnailUrl` as fallback
- **Enhanced lesson meta display** to handle both old and new term/week properties
- **Added conditional rendering** for optional difficulty badges
- **Improved duration display** to handle missing duration values

### 6. Courses Component (`courses.component.ts`)
- **Updated `viewLessons()` method** to pass `subjectId` from `course.subjectNameId`
- Maintained backward compatibility by passing both new and old parameters

## API Response Structure

The new API returns lessons with this structure:
```json
[
  {
    "id": 11,
    "title": "First Lesson", 
    "posterUrl": "https://res.cloudinary.com/...",
    "videoUrl": "https://res.cloudinary.com/...",
    "description": "Lesson number one in this term",
    "weekId": 11,
    "subjectId": 2,
    "termId": 6
  }
]
```

## Backward Compatibility

- Supports both old query parameters (`?subject=Mathematics`) and new ones (`?subjectId=2`)
- Falls back to legacy methods if new parameters are not available
- Handles optional lesson properties gracefully
- Maintains existing functionality while enabling new API features

## Usage Examples

### Navigate to lessons with new API:
```typescript
this.router.navigate(['/lessons'], {
  queryParams: {
    subjectId: 2,           // Preferred - uses new API
    subject: 'Mathematics', // Fallback for display
    courseId: 1
  }
});
```

### Navigate to lessons with legacy support:
```typescript
this.router.navigate(['/lessons'], {
  queryParams: {
    subject: 'Mathematics',  // Will use legacy filtering
    courseId: 1
  }
});
```

## Benefits

1. **Better Performance**: Direct API calls by subject ID instead of filtering
2. **Type Safety**: Proper TypeScript interfaces matching API response
3. **Flexibility**: Supports both new and legacy approaches
4. **Future-Proof**: Ready for API-driven lesson content
5. **Maintainability**: Clear separation between API fields and computed properties
