# 📤 Upload Progress Implementation Guide

## Overview
This guide explains how to use the upload progress tracking system for file uploads (avatars, posters, videos, resources, etc.).

## Architecture

### 1. Upload Service (`upload.service.ts`)
Central service that handles all file uploads with progress tracking.

**Key Features:**
- ✅ Real-time upload progress percentage
- ✅ File size tracking (loaded/total bytes)
- ✅ Status tracking (pending, uploading, completed, error)
- ✅ Automatic cleanup after upload completion
- ✅ Support for both POST and PUT requests
- ✅ Observable-based progress updates

### 2. Upload Progress Component (`upload-progress.component.ts`)
Reusable component for displaying upload progress.

**Two Modes:**
1. **Inline Mode**: Shows progress for a specific upload
2. **Global Mode**: Shows all active uploads (bottom-right corner)

## Usage Examples

### Example 1: Avatar Upload with Progress

```typescript
// In your component
import { UploadProgressComponent } from '../../shared/components/upload-progress/upload-progress.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, UploadProgressComponent],
  template: `
    <input type="file" (change)="onFileSelected($event)" accept="image/*">
    
    <!-- Show upload progress -->
    <app-upload-progress 
      trackingKey="avatar_upload"
      [showFileName]="true"
      [showSize]="true">
    </app-upload-progress>
  `
})
export class ProfileComponent {
  constructor(private profileService: ProfileService) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profileService.uploadAvatar(file).subscribe({
        next: (response) => {
          console.log('Avatar uploaded successfully:', response);
        },
        error: (error) => {
          console.error('Upload failed:', error);
        }
      });
    }
  }
}
```

### Example 2: Lesson Upload with Poster and Video

```typescript
@Component({
  selector: 'app-lesson-form',
  standalone: true,
  imports: [CommonModule, FormsModule, UploadProgressComponent],
  template: `
    <form (ngSubmit)="createLesson()">
      <input [(ngModel)]="title" name="title" placeholder="Lesson Title">
      <textarea [(ngModel)]="description" name="description"></textarea>
      
      <!-- Poster Upload -->
      <input type="file" (change)="onPosterSelected($event)" accept="image/*">
      
      <!-- Video Upload -->
      <input type="file" (change)="onVideoSelected($event)" accept="video/*">
      
      <button type="submit">Create Lesson</button>
    </form>

    <!-- Show upload progress -->
    <app-upload-progress 
      trackingKey="lesson_upload"
      containerClass="mt-4">
    </app-upload-progress>
  `
})
export class LessonFormComponent {
  title = '';
  description = '';
  posterFile?: File;
  videoFile?: File;

  constructor(private contentService: ContentService) {}

  onPosterSelected(event: any) {
    this.posterFile = event.target.files[0];
  }

  onVideoSelected(event: any) {
    this.videoFile = event.target.files[0];
  }

  createLesson() {
    if (this.posterFile && this.videoFile) {
      this.contentService.addLesson(
        this.title,
        this.description,
        1, // weekId
        1, // subjectId
        this.posterFile,
        this.videoFile
      ).subscribe({
        next: (lesson) => {
          console.log('Lesson created:', lesson);
        },
        error: (error) => {
          console.error('Failed to create lesson:', error);
        }
      });
    }
  }
}
```

### Example 3: Global Upload Progress Indicator

```typescript
// In your app.component.ts or layout component
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, UploadProgressComponent],
  template: `
    <router-outlet></router-outlet>
    
    <!-- Global upload progress (bottom-right corner) -->
    <app-upload-progress></app-upload-progress>
  `
})
export class AppComponent {
  // The component automatically shows all active uploads
}
```

### Example 4: Manual Progress Checking

```typescript
// Check upload progress programmatically
export class MyComponent {
  constructor(
    private uploadService: UploadService,
    private contentService: ContentService
  ) {}

  uploadFile(file: File) {
    // Start upload
    this.contentService.addResource('My Resource', 1, file).subscribe({
      next: (resource) => console.log('Done:', resource),
      error: (error) => console.error('Error:', error)
    });

    // Manually check progress
    setInterval(() => {
      const progress = this.uploadService.getProgress('resource_upload');
      if (progress) {
        console.log(`Upload progress: ${progress.percentage}%`);
        console.log(`Uploaded: ${progress.loaded} / ${progress.total} bytes`);
      }
    }, 500);
  }

  // Get all active uploads
  getAllUploads() {
    const uploads = this.uploadService.getAllProgress();
    console.log('Active uploads:', uploads);
  }
}
```

## Tracking Keys

Each upload type has a specific tracking key:

| Upload Type | Tracking Key | Service Method |
|------------|--------------|----------------|
| Avatar | `avatar_upload` | `ProfileService.uploadAvatar()` |
| Lesson (Create) | `lesson_upload` | `ContentService.addLesson()` |
| Lesson (Update) | `lesson_update` | `ContentService.updateLesson()` |
| Subject | `subject_upload` | `ContentService.addSubject()` |
| Resource | `resource_upload` | `ContentService.addResource()` |
| Teacher Lesson | `teacher_lesson_upload` | `TeacherContentManagementService.createLesson()` |
| Teacher Lesson Update | `teacher_lesson_update` | `TeacherContentManagementService.updateLesson()` |
| Teacher Subject | `teacher_subject_upload` | `TeacherContentManagementService.createSubject()` |

## Component API

### UploadProgressComponent Inputs

```typescript
@Input() trackingKey?: string;        // Specific upload to track (optional)
@Input() showFileName = true;         // Show file name
@Input() showSize = true;             // Show bytes uploaded/total
@Input() containerClass = '';         // Additional CSS classes
```

### Upload Progress Interface

```typescript
interface UploadProgress {
  fileName: string;           // Name of the file
  percentage: number;         // Upload percentage (0-100)
  loaded: number;            // Bytes uploaded
  total: number;             // Total file size in bytes
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;            // Error message if failed
}
```

## Styling

The component uses Tailwind CSS classes. You can customize with:

```html
<app-upload-progress 
  trackingKey="my_upload"
  containerClass="p-4 bg-gray-50 rounded-lg shadow">
</app-upload-progress>
```

## Features

### ✅ What's Implemented

1. **Real-time Progress Updates**
   - Live percentage updates
   - Byte-level tracking
   - Status changes (pending → uploading → completed/error)

2. **Visual Indicators**
   - Progress bars with animations
   - Color-coded statuses (blue=uploading, green=success, red=error)
   - Icons for different states
   - Smooth transitions

3. **Multiple Upload Modes**
   - Inline progress for specific uploads
   - Global floating progress indicator
   - File name and size display

4. **Error Handling**
   - Error status tracking
   - Error message display
   - Automatic cleanup on failure

5. **Auto Cleanup**
   - Progress removed 5 seconds after completion
   - Memory-efficient observable management

### 🎨 UI Features

- Modern, clean design
- Responsive layout
- Smooth animations
- Accessibility-friendly
- Mobile-optimized

## Testing

To test the upload progress:

1. Upload a large file (video > 10MB recommended)
2. Watch the progress bar update in real-time
3. Check console for detailed progress logs
4. Verify completion/error handling

## Browser Compatibility

Works in all modern browsers that support:
- `XMLHttpRequest` Level 2 (upload progress events)
- Angular 17+
- ES6+

## Performance

- Minimal overhead (uses Angular's HttpClient progress events)
- Efficient RxJS observables
- Auto cleanup prevents memory leaks
- Optimized re-renders with OnPush strategy (can be added)

## Troubleshooting

### Progress stuck at 0%
- Check if `reportProgress: true` is set in HTTP request
- Verify file is being uploaded correctly
- Check network tab in browser DevTools

### Progress not showing
- Ensure component is imported correctly
- Check if tracking key matches
- Verify UploadService is injected

### Multiple uploads conflicting
- Each upload needs a unique tracking key
- Use timestamp-based keys for dynamic uploads
- Clear old progress if needed: `uploadService.clearAllProgress()`

## Next Steps

1. Add to your main app layout for global progress
2. Integrate with existing upload forms
3. Customize styling to match your design
4. Add sound/notification on completion (optional)
5. Implement retry logic for failed uploads (optional)

## Support

For issues or questions, refer to:
- `upload.service.ts` - Core upload logic
- `upload-progress.component.ts` - UI component
- Service implementations (profile.service.ts, content.service.ts, etc.)
