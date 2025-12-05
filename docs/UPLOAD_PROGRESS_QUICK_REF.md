# 📤 Upload Progress - Quick Reference

## Quick Start

### 1. Add to Your Component Template

```html
<!-- Inline progress for specific upload -->
<app-upload-progress trackingKey="avatar_upload"></app-upload-progress>

<!-- Global progress indicator (all uploads) -->
<app-upload-progress></app-upload-progress>
```

### 2. Import in Component

```typescript
import { UploadProgressComponent } from '../../shared/components/upload-progress/upload-progress.component';

@Component({
  imports: [UploadProgressComponent]
})
```

### 3. Upload Files (Already Integrated)

All these methods now support upload progress:

```typescript
// Avatar
profileService.uploadAvatar(file)

// Lesson
contentService.addLesson(title, desc, weekId, subjectId, posterFile, videoFile)

// Subject
contentService.addSubject(yearId, nameId, price, discount, level, duration, teacherId, startDate, posterFile)

// Resource
contentService.addResource(title, lessonId, file)

// Teacher Lesson
teacherService.createLesson(lessonData)

// Teacher Subject
teacherService.createSubject(subjectData)
```

## Tracking Keys

| Upload Type | Key |
|------------|-----|
| Avatar | `avatar_upload` |
| Lesson | `lesson_upload` |
| Subject | `subject_upload` |
| Resource | `resource_upload` |
| Teacher Lesson | `teacher_lesson_upload` |

## Component Options

```html
<app-upload-progress 
  trackingKey="lesson_upload"    <!-- Optional: specific upload -->
  [showFileName]="true"          <!-- Show filename (default: true) -->
  [showSize]="true"              <!-- Show bytes (default: true) -->
  containerClass="p-4">          <!-- Custom CSS classes -->
</app-upload-progress>
```

## Visual States

- 🔵 **Blue**: Uploading
- 🟢 **Green**: Completed
- 🔴 **Red**: Error
- ⚪ **Gray**: Pending

## Example: Avatar Upload

```typescript
// template
<input type="file" (change)="uploadAvatar($event)" accept="image/*">
<app-upload-progress trackingKey="avatar_upload"></app-upload-progress>

// component
uploadAvatar(event: any) {
  const file = event.target.files[0];
  this.profileService.uploadAvatar(file).subscribe({
    next: (res) => console.log('✅ Done:', res),
    error: (err) => console.error('❌ Error:', err)
  });
}
```

## Example: Global Indicator

Add to `app.component.html` or main layout:

```html
<router-outlet></router-outlet>
<app-upload-progress></app-upload-progress>
```

This shows all active uploads in the bottom-right corner.

## Manual Progress Check

```typescript
constructor(private uploadService: UploadService) {}

checkProgress() {
  const progress = this.uploadService.getProgress('avatar_upload');
  console.log(progress?.percentage + '%');
}

getAllUploads() {
  const all = this.uploadService.getAllProgress();
  console.log('Active uploads:', all);
}
```

## Features

✅ Real-time percentage updates  
✅ File size tracking (bytes)  
✅ Multiple simultaneous uploads  
✅ Error handling with messages  
✅ Auto cleanup after 5 seconds  
✅ Smooth animations  
✅ Responsive design  

## No Changes Required!

All existing upload services already integrated. Just add the component to your templates.
