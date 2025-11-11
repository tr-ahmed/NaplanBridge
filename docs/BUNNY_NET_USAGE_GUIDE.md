# دليل استخدام Bunny.net Stream في NaplanBridge

## 📋 المعلومات الأساسية

### بيانات الحساب
```
Library ID: 525022
CDN Hostname: vz-9161a4ae-e6d.b-cdn.net
Pull Zone: vz-9161a4ae-e6d
API Key: b05fbe57-f7de-4872-88cf5fd802cb-897e-48cf
```

### الملفات المُحدثة
- ✅ `src/environments/environment.ts` - إضافة بيانات Bunny.net
- ✅ `src/environments/environment.prod.ts` - إضافة بيانات الإنتاج
- ✅ `src/app/core/constants/bunny-net.constants.ts` - Constants و Helper functions
- ✅ `src/app/core/services/bunny-net.service.ts` - Service للتعامل مع API
- ✅ `src/app/features/bunny-video-upload/bunny-video-upload.component.ts` - واجهة رفع الفيديو

---

## 🎬 كيفية رفع فيديو جديد

### 1. استخدام الواجهة (Recommended)
```typescript
// Navigate to upload page
this.router.navigate(['/admin/upload-video']);

// Or use the component directly
<app-bunny-video-upload></app-bunny-video-upload>
```

### 2. استخدام الـ Service مباشرة
```typescript
import { BunnyNetService } from './core/services/bunny-net.service';

constructor(private bunnyService: BunnyNetService) {}

async uploadVideo(file: File, title: string) {
  try {
    // Step 1: Create video entry
    const createResult = await this.bunnyService.createVideo(title).toPromise();
    const videoId = createResult.guid;
    
    // Step 2: Upload file
    await this.bunnyService.uploadVideo(
      videoId,
      file,
      createResult.authorizationSignature,
      createResult.authorizationExpire
    ).toPromise();
    
    // Step 3: Get playback URL
    const playbackUrl = this.bunnyService.getVideoPlaybackUrl(videoId);
    const thumbnailUrl = this.bunnyService.getVideoThumbnail(videoId);
    
    console.log('Video uploaded successfully!');
    console.log('Video ID:', videoId);
    console.log('Playback URL:', playbackUrl);
    
    return { videoId, playbackUrl, thumbnailUrl };
    
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}
```

---

## 📺 كيفية تشغيل فيديو من Bunny.net

### 1. في Lesson Component
```typescript
import { BunnyNetService } from '../../core/services/bunny-net.service';
import { VideoService } from '../../core/services/video.service';

constructor(
  private bunnyService: BunnyNetService,
  private videoService: VideoService
) {}

playBunnyVideo(videoId: string, videoElement: HTMLVideoElement) {
  // Get video URLs
  const videoUrl = this.bunnyService.getVideoPlaybackUrl(videoId);
  const thumbnailUrl = this.bunnyService.getVideoThumbnail(videoId);
  
  // Initialize player
  this.videoService.initializePlayer({
    videoUrl: videoUrl,
    posterUrl: thumbnailUrl,
    provider: 'BunnyStream',
    autoplay: false,
    muted: false
  }, videoElement, lessonId);
}
```

### 2. في Lesson Model
```typescript
// When creating/updating a lesson
const lesson = {
  title: 'Algebra Lesson 1',
  videoProvider: 'BunnyStream',
  videoUrl: 'https://vz-9161a4ae-e6d.b-cdn.net/{VIDEO_ID}/playlist.m3u8',
  posterUrl: 'https://vz-9161a4ae-e6d.b-cdn.net/{VIDEO_ID}/thumbnail.jpg',
  videoDuration: 1800 // in seconds
};
```

---

## 🔧 Helper Functions

### Get Video URLs
```typescript
import { BunnyStreamHelper } from './core/constants/bunny-net.constants';

// HLS Playlist (for streaming)
const playlistUrl = BunnyStreamHelper.getPlaylistUrl('abc123xyz');
// Result: https://vz-9161a4ae-e6d.b-cdn.net/abc123xyz/playlist.m3u8

// Thumbnail at specific time
const thumbnail = BunnyStreamHelper.getThumbnail('abc123xyz', 30);
// Result: https://vz-9161a4ae-e6d.b-cdn.net/abc123xyz/thumbnail.jpg?time=30

// Preview sprite
const preview = BunnyStreamHelper.getPreviewSprite('abc123xyz');
// Result: https://vz-9161a4ae-e6d.b-cdn.net/abc123xyz/preview.webp

// Direct MP4 link (optional)
const mp4Url = BunnyStreamHelper.getDirectMp4Url('abc123xyz', '720p');
// Result: https://vz-9161a4ae-e6d.b-cdn.net/abc123xyz/play_720p.mp4
```

### API Headers
```typescript
// Get authenticated headers for API requests
const headers = BunnyStreamHelper.getApiHeaders();
// Result: { 'AccessKey': '...', 'Content-Type': 'application/json' }

// Build API URL
const apiUrl = BunnyStreamHelper.getApiUrl('/videos');
// Result: https://video.bunnycdn.com/library/525022/videos
```

---

## 📊 إدارة الفيديوهات

### Get Video List
```typescript
this.bunnyService.getVideoList(1, 50, 'algebra').subscribe(result => {
  console.log('Total videos:', result.totalItems);
  console.log('Videos:', result.items);
});
```

### Get Video Details
```typescript
this.bunnyService.getVideo('abc123xyz').subscribe(video => {
  console.log('Title:', video.title);
  console.log('Duration:', video.length, 'seconds');
  console.log('Status:', this.bunnyService.getVideoStatusText(video.status));
  console.log('Views:', video.views);
  console.log('Is ready:', this.bunnyService.isVideoReady(video.status));
});
```

### Update Video
```typescript
this.bunnyService.updateVideo('abc123xyz', {
  title: 'New Title',
  isPublic: true
}).subscribe(() => {
  console.log('Video updated');
});
```

### Delete Video
```typescript
this.bunnyService.deleteVideo('abc123xyz').subscribe(() => {
  console.log('Video deleted');
});
```

### Get Statistics
```typescript
this.bunnyService.getVideoStatistics('abc123xyz').subscribe(stats => {
  console.log('Total views:', stats.views);
  console.log('Watch time:', stats.totalWatchTime);
});

// Get heatmap (viewing patterns)
this.bunnyService.getVideoHeatmap('abc123xyz').subscribe(heatmap => {
  console.log('Popular sections:', heatmap);
});
```

---

## 🎨 Video Player Integration

### مع VideoService الموجود
```typescript
// في lesson-player.component.ts
private initializeVideoPlayer(): void {
  const lessonData = this.lesson();
  if (!lessonData) return;

  // If video is from Bunny.net
  if (lessonData.videoProvider === 'BunnyStream') {
    const config = {
      videoUrl: lessonData.videoUrl,
      posterUrl: lessonData.posterUrl,
      provider: 'BunnyStream' as VideoProvider,
      autoplay: false,
      muted: false,
      startTime: 0
    };

    this.videoService.initializePlayer(
      config,
      this.videoPlayerRef.nativeElement,
      this.lessonId
    );
  }
}
```

### HTML Template
```html
<!-- Video player container -->
<div class="video-container">
  <video #videoPlayer 
         class="w-full rounded-lg shadow-lg"
         controls
         playsinline>
  </video>
</div>

<!-- Video info -->
<div class="mt-4">
  <h3 class="text-xl font-bold">{{ lesson()?.title }}</h3>
  <p class="text-gray-600">{{ lesson()?.description }}</p>
  
  <!-- Thumbnail preview -->
  @if (lesson()?.posterUrl) {
    <img [src]="lesson()?.posterUrl" 
         alt="Video thumbnail"
         class="w-32 h-auto rounded mt-2">
  }
</div>
```

---

## 🔐 Security Notes

### ⚠️ Important
```typescript
// ❌ DON'T expose API key in frontend code
// ✅ API key should only be used in backend

// Frontend: Only use for video playback
const videoUrl = BunnyStreamHelper.getPlaylistUrl(videoId);

// Backend: Use API key for upload/management
// API calls should be proxied through your backend
```

### Best Practice
```typescript
// Create a backend endpoint for video upload
POST /api/lessons/upload-video
- Accepts: file, title, description
- Backend handles Bunny.net API calls
- Returns: videoId, playbackUrl

// Frontend only sends file to your backend
uploadVideo(file: File, title: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  
  return this.http.post('/api/lessons/upload-video', formData);
}
```

---

## 📈 Video Status Flow

```
0: Queued       → Video is in upload queue
1: Processing   → Video is being processed
2: Encoding     → Video is being encoded
3: Finished     → Video is ready for playback ✅
4: Error        → Encoding failed ❌
```

### Check if video is ready
```typescript
this.bunnyService.getVideo(videoId).subscribe(video => {
  if (this.bunnyService.isVideoReady(video.status)) {
    console.log('Video is ready!');
    this.playVideo(videoId);
  } else {
    console.log('Status:', this.bunnyService.getVideoStatusText(video.status));
    console.log('Please wait...');
  }
});
```

---

## 🎯 Complete Example: Create Lesson with Bunny Video

```typescript
// Step 1: Upload video to Bunny.net
async uploadAndCreateLesson(videoFile: File, lessonData: any) {
  try {
    // Upload to Bunny.net
    const bunnyResult = await this.uploadToBunny(videoFile, lessonData.title);
    
    // Step 2: Create lesson in your backend
    const lesson = {
      title: lessonData.title,
      description: lessonData.description,
      weekId: lessonData.weekId,
      order: lessonData.order,
      
      // Bunny.net video info
      videoProvider: 'BunnyStream',
      videoUrl: bunnyResult.playbackUrl,
      posterUrl: bunnyResult.thumbnailUrl,
      videoDuration: bunnyResult.duration
    };
    
    // Save lesson
    await this.lessonService.createLesson(lesson).toPromise();
    
    this.toastService.showSuccess('Lesson created successfully!');
    
  } catch (error) {
    this.toastService.showError('Failed to create lesson');
    console.error(error);
  }
}

private async uploadToBunny(file: File, title: string) {
  // Create video entry
  const createResult = await this.bunnyService.createVideo(title).toPromise();
  
  // Upload file
  await this.bunnyService.uploadVideo(
    createResult.guid,
    file,
    createResult.authorizationSignature,
    createResult.authorizationExpire
  ).toPromise();
  
  // Wait for processing
  await this.waitForProcessing(createResult.guid);
  
  // Get video details
  const video = await this.bunnyService.getVideo(createResult.guid).toPromise();
  
  return {
    videoId: createResult.guid,
    playbackUrl: this.bunnyService.getVideoPlaybackUrl(createResult.guid),
    thumbnailUrl: this.bunnyService.getVideoThumbnail(createResult.guid),
    duration: video.length
  };
}
```

---

## 📚 API Documentation Links

- **Bunny.net Stream API**: https://docs.bunny.net/reference/video_getvideoheatmap
- **Video Library Management**: https://docs.bunny.net/docs/stream
- **CDN Configuration**: https://docs.bunny.net/docs/stream-cdn-configuration

---

## ✅ Checklist للاستخدام

- [x] ✅ تم إضافة بيانات Bunny.net في Environment files
- [x] ✅ تم إنشاء Constants file مع Helper functions
- [x] ✅ تم إنشاء BunnyNetService للتعامل مع API
- [x] ✅ تم إنشاء Upload Component
- [x] ✅ تم دمج VideoService مع BunnyStream
- [ ] ⚠️ إضافة Backend endpoint لرفع الفيديو (Recommended)
- [ ] ⚠️ إضافة Webhook handler لـ Status notifications
- [ ] ⚠️ إضافة Route للـ Upload Component في Admin

---

## 🚀 الخطوات التالية

1. **إضافة Route للـ Upload Component**
```typescript
// في admin.routes.ts
{
  path: 'upload-video',
  loadComponent: () => import('./features/bunny-video-upload/bunny-video-upload.component')
    .then(c => c.BunnyVideoUploadComponent),
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Admin', 'Teacher'] }
}
```

2. **إضافة Navigation Link**
```html
<!-- في admin dashboard -->
<a routerLink="/admin/upload-video" class="nav-link">
  <i class="fas fa-upload"></i>
  Upload Video
</a>
```

3. **Backend Integration (Recommended)**
- إنشاء endpoint في الـ Backend لرفع الفيديو
- حماية API Key من التعرض في الـ Frontend
- معالجة الـ Webhooks من Bunny.net

---

**آخر تحديث:** 31 أكتوبر 2025  
**الحالة:** ✅ جاهز للاستخدام
