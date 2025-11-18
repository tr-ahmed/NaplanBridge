# Teacher Content Management - Quick Reference Guide

## Updated Components Overview

### 1. Subject Creation Modal
**Purpose:** Create new subjects with all required metadata

**Required Fields:**
- SubjectNameId (dropdown)
- YearId (dropdown)
- PosterFile (image upload)

**Optional Fields:**
- OriginalPrice
- DiscountPercentage
- Level
- Duration
- StartDate

**File Requirements:**
- Format: JPEG, PNG, GIF, WebP
- Max Size: 10MB

**Example Usage:**
```typescript
// In parent component
<app-subject-creation-modal 
  [isOpen]="showSubjectModal"
  (onClose)="showSubjectModal = false"
  (onSubmit)="handleSubjectCreated($event)">
</app-subject-creation-modal>
```

### 2. Content Creation Wizard
**Purpose:** Create lessons, exams, resources, questions, or certificates with guided steps

**4-Step Process:**
1. **Type Selection** - Choose content type (Lesson, Exam, Resource, Question, Certificate)
2. **Basic Info** - Enter title, description, subject, duration
3. **Details & Media** - Add files, week info, objectives
4. **Review** - Confirm all details before submission

**For Lessons Specifically:**
- **Required Files:**
  - Poster Image (10MB max)
  - Video File (500MB max)
- **Optional Fields:**
  - Week ID

**Supported Content Types:**
- 📚 Lesson
- 📝 Exam
- 📎 Resource
- ❓ Question
- 🏆 Certificate

**Example Usage:**
```typescript
// In parent component
<app-content-creation-wizard 
  [isOpen]="showContentWizard"
  (onClose)="showContentWizard = false"
  (onSubmit)="handleContentCreated($event)">
</app-content-creation-wizard>
```

## File Upload Details

### Poster Image Upload
- Trigger: Click button or drag-drop in designated area
- Accepted: JPEG, PNG, GIF, WebP
- Max: 10MB
- Validation: On selection with visual feedback

### Video Upload (Lessons Only)
- Trigger: Click button or drag-drop
- Accepted: MP4, WebM, OGG, MKV
- Max: 500MB
- Validation: On selection with visual feedback

### Error Handling
All validation errors shown via toast notifications:
```
❌ File size exceeds 10MB limit
❌ Please select a valid image file (JPEG, PNG, GIF, or WebP)
❌ Please select a valid video file (MP4, WebM, OGG, or MKV)
```

## Form Submission Flow

### Subject Creation
1. User fills in required fields (SubjectNameId, YearId)
2. User selects poster image
3. User fills in optional fields (price, discount, etc.)
4. User clicks "Create Subject"
5. System validates form and files
6. System sends FormData to `/api/Subjects`
7. On success: Toast message + modal closes + list refreshes
8. On error: Toast message with specific error details

### Content Creation (Lesson)
1. User selects "Lesson" content type
2. User enters title and description
3. User selects subject and duration
4. User uploads poster image and video file
5. User optionally enters week ID and objectives
6. User reviews all details
7. User clicks "Create Content"
8. System validates all fields and files
9. System sends to backend for admin approval
10. On success: Confirmation message + modal closes

## FormData Conversion

The service automatically converts form data to multipart/form-data:

```typescript
// For Subjects:
// Query Parameters: YearId, SubjectNameId, OriginalPrice, etc.
// Files: PosterFile (required)

// For Lessons:
// Query Parameters: Title, Description, WeekId
// Files: PosterFile (required), VideoFile (required)
```

## Backend Integration

### Subject Endpoint
```
POST /api/Subjects
```
**Parameters:** Sent as form fields/query params
**Files:** PosterFile as multipart

### Lesson Endpoint
```
POST /api/Lessons
```
**Parameters:** Sent as form fields/query params
**Files:** PosterFile, VideoFile as multipart

## Troubleshooting

### File Won't Upload
1. Check file size (poster ≤10MB, video ≤500MB)
2. Check file format (poster: JPEG/PNG/GIF/WebP, video: MP4/WebM/OGG/MKV)
3. Check browser console for detailed error message

### Form Won't Submit
1. Ensure all required fields filled (red * asterisk)
2. For lessons: Both poster and video must be selected
3. Check validation messages below fields

### No Confirmation Message
1. Check browser console for errors
2. Verify backend is running
3. Check network tab in DevTools for API response

## Next Steps After Creation

### Subject
- Admin approves subject creation
- Teacher can add lessons to the subject
- Subject appears in student's available subjects

### Content (Lesson)
- Content submitted for admin approval
- Admin reviews and approves/rejects
- On approval: Students can see and access lesson
- On rejection: Teacher receives feedback for revision

## Key Improvements from Previous Version

### Subject Modal
✅ Now asks for SubjectNameId instead of just name
✅ Added pricing fields (OriginalPrice, DiscountPercentage)
✅ Added Level and Duration fields
✅ Added StartDate picker
✅ Now requires poster image upload
✅ Larger modal for better UX (max-w-2xl)

### Content Wizard
✅ Now requires poster for all lessons
✅ Now requires video file for lessons
✅ Added WeekId selector
✅ Better step-by-step guidance
✅ File validation before proceeding
✅ Better error messages

## Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## Performance Notes
- File validation happens instantly on selection
- Large files (videos) may take time to upload depending on network
- Recommend testing with realistic file sizes
- Consider showing upload progress bar for videos (future enhancement)

## Security Considerations
- File type validation on frontend (UX)
- Backend should validate file types and sizes (security)
- Files scanned for malware before storage (backend responsibility)
- Only authenticated teachers can upload content
- All uploads logged for audit trail

---

**Version:** 1.0 - Complete Swagger Alignment
**Last Updated:** 2024
**Maintained By:** Development Team
