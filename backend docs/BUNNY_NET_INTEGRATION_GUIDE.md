# ?? Bunny.net Video Integration Guide - NaplanBridge

## ?? ???? ????

?? ??? **Bunny.net** ????? ????? ?????????? ?? NaplanBridge? ???????? ??? Cloudinary ??????? ??????.

### ????? Bunny.net?

| ?????? | Cloudinary | Bunny.net | ??????? |
|-------|-----------|-----------|---------|
| **???????** | ?????? | ?? | **Bunny ???? 10x** |
| **??????** | ?? | ??? | **Bunny ????** |
| **Streaming** | HLS ??? | HLS + DASH | **Bunny ????** |
| **Bandwidth** | ????? | ??? ????? | **Bunny ????** |
| **Storage** | ????? | ??? ????? | **Bunny ????** |

---

## ?? ???????? ???????

### 1. **Bunny Storage** (Simple Storage)
- ??? ???????? ?????
- CDN ?????
- ????? ?????????? ???????
- **???????**: $0.01/GB Storage + $0.005/GB Bandwidth

### 2. **Bunny Stream** (Adaptive Streaming) ? **???? ??**
- Adaptive bitrate streaming (HLS/DASH)
- ????? ?????? ?????? ?????? ??? ???? ????????
- Thumbnails ???????
- ????? ?????????? ??????? (???? ?????)
- **???????**: $0.005/GB Storage + $0.01/GB Bandwidth

---

## ?? ???????

### 1. ????? ???? Bunny.net

1. ???? ??? [Bunny.net](https://bunny.net/)
2. ??? ???? ????
3. ???? ???:
   - Storage Zone Name
   - Storage API Key
   - Video Library ID (??? Stream)
   - Video API Key (??? Stream)

---

### 2. ????? `appsettings.json`

```json
{
  "Bunny": {
    "StorageZoneName": "naplan-videos",
    "StorageApiKey": "your-storage-api-key-here",
    "CdnHostname": "naplan.b-cdn.net",
    "StorageRegion": "de",
    "VideoLibraryId": 12345,
    "VideoApiKey": "your-video-api-key-here"
  }
}
```

#### ??????? ??????? (StorageRegion):
| Region | ?????? | ?????? ?? |
|--------|--------|-----------|
| `de` | Germany | ?????? ?????? ?????? ? |
| `ny` | New York | ?????? ???????? |
| `la` | Los Angeles | ?????? ???????? (?????) |
| `sg` | Singapore | ???? |
| `syd` | Sydney | ???????? |

---

## ?? ????????? ?? ?????

### Option 1: Bunny Storage (Simple)

```csharp
public class LessonController : ControllerBase
{
    private readonly IBunnyVideoService _bunnyService;

    [HttpPost("upload-video-simple")]
    public async Task<ActionResult> UploadVideoSimple(IFormFile videoFile)
    {
 // Upload to Bunny Storage
        var result = await _bunnyService.UploadVideoAsync(
   videoFile,
   folderPath: "lessons/algebra/term1" // ???????
        );

        if (!result.Success)
            return BadRequest(result.ErrorMessage);

        // Save to database
        var lesson = new Lesson
      {
            Title = "Lesson 1",
          VideoUrl = result.CdnUrl, // https://naplan.b-cdn.net/lessons/algebra/term1/xxxx.mp4
 BunnyVideoId = result.VideoId,
       BunnyStoragePath = result.StoragePath,
    VideoProvider = "BunnyStorage",
   VideoDuration = 1200 // seconds
        };

        return Ok(new
        {
    videoUrl = result.CdnUrl,
  videoId = result.VideoId
    });
    }
}
```

---

### Option 2: Bunny Stream (Adaptive Streaming) ? **???? ??**

```csharp
[HttpPost("upload-video-stream")]
public async Task<ActionResult> UploadVideoStream(IFormFile videoFile, string title)
{
    // Upload to Bunny Stream
    var result = await _bunnyService.UploadVideoToStreamAsync(
        videoFile,
      title: title,
    collectionId: null // ??????? - ?????? ??????????
    );

    if (!result.Success)
        return BadRequest(result.ErrorMessage);

    // Save to database
    var lesson = new Lesson
    {
        Title = title,
        VideoUrl = result.CdnUrl, // HLS URL: https://naplan.b-cdn.net/{videoId}/playlist.m3u8
        BunnyVideoId = result.VideoId,
        VideoProvider = "BunnyStream",
 VideoDuration = result.DurationSeconds,
        PosterUrl = result.ThumbnailUrl // Thumbnail ??????
    };

   await _context.Lessons.AddAsync(lesson);
    await _context.SaveChangesAsync();

    return Ok(new
    {
        videoUrl = result.CdnUrl,
 videoId = result.VideoId,
    thumbnailUrl = result.ThumbnailUrl,
     status = result.Status // "processing" ?? "finished"
    });
}
```

---

### ??? ?????

```csharp
[HttpDelete("delete-video/{lessonId}")]
public async Task<ActionResult> DeleteVideo(int lessonId)
{
    var lesson = await _context.Lessons.FindAsync(lessonId);
    if (lesson == null) return NotFound();

    // ??? ?? Bunny.net
    bool deleted = false;

    if (lesson.VideoProvider == "BunnyStream")
    {
        deleted = await _bunnyService.DeleteStreamVideoAsync(lesson.BunnyVideoId!);
    }
else if (lesson.VideoProvider == "BunnyStorage")
    {
    deleted = await _bunnyService.DeleteVideoAsync(lesson.BunnyStoragePath!);
    }

    if (!deleted)
     return BadRequest("Failed to delete video from Bunny.net");

    // ??? ?? Database
    _context.Lessons.Remove(lesson);
 await _context.SaveChangesAsync();

    return NoContent();
}
```

---

### ?????? ??? ??????? ???????

```csharp
[HttpGet("video-info/{videoId}")]
public async Task<ActionResult<BunnyVideoInfo>> GetVideoInfo(string videoId)
{
    var videoInfo = await _bunnyService.GetVideoInfoAsync(videoId);

    if (videoInfo == null)
        return NotFound();

    return Ok(videoInfo);
}
```

---

### ????? Signed URL (?????????? ??????)

```csharp
[HttpGet("video-signed-url/{lessonId}")]
public async Task<ActionResult> GetSignedVideoUrl(int lessonId)
{
    var lesson = await _context.Lessons.FindAsync(lessonId);
    if (lesson == null) return NotFound();

    // ?????? ?? ???? ??????
    // ...

    // ????? URL ????? ????? ??? ????
    var signedUrl = _bunnyService.GenerateSignedUrl(
        lesson.BunnyStoragePath!,
        expirationMinutes: 60
    );

    return Ok(new { videoUrl = signedUrl });
}
```

---

## ?? Frontend Integration

### HTML5 Video (??? Storage)

```html
<video controls width="100%" poster="https://naplan.b-cdn.net/poster.jpg">
  <source src="https://naplan.b-cdn.net/lessons/video.mp4" type="video/mp4">
  Your browser does not support video playback.
</video>
```

---

### HLS Player (??? Stream) ? **???? ??**

#### Using Video.js

```html
<!-- CDN -->
<link href="https://vjs.zencdn.net/8.0.4/video-js.css" rel="stylesheet" />
<script src="https://vjs.zencdn.net/8.0.4/video.min.js"></script>

<!-- Video Player -->
<video
  id="my-video"
  class="video-js vjs-default-skin"
  controls
  preload="auto"
  width="640"
  height="360"
  poster="https://naplan.b-cdn.net/{videoId}/thumbnail.jpg"
  data-setup="{}"
>
  <source
    src="https://naplan.b-cdn.net/{videoId}/playlist.m3u8"
  type="application/x-mpegURL"
  />
</video>

<script>
  var player = videojs('my-video');
</script>
```

---

#### Using Plyr.js (??? ?????)

```html
<!-- CDN -->
<link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
<script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>

<!-- Video Player -->
<video id="player" controls></video>

<script>
  const video = document.getElementById('player');
  const source = 'https://naplan.b-cdn.net/{videoId}/playlist.m3u8';

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(source);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, function() {
      const player = new Plyr(video, {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
        settings: ['quality', 'speed'],
      });
    });
  }
</script>
```

---

### Angular Component

```typescript
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import Hls from 'hls.js';

@Component({
  selector: 'app-video-player',
  template: `
    <video #videoPlayer controls class="video-player">
      Your browser does not support video playback.
    </video>
  `
})
export class VideoPlayerComponent implements OnInit {
  @ViewChild('videoPlayer', { static: true }) videoElement!: ElementRef;

  videoUrl = 'https://naplan.b-cdn.net/{videoId}/playlist.m3u8';

  ngOnInit() {
    const video: HTMLVideoElement = this.videoElement.nativeElement;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(this.videoUrl);
      hls.attachMedia(video);
      
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
  console.log('Video ready to play');
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = this.videoUrl;
    }
  }
}
```

---

## ?? ?????? ??????

### ????: ????? 1 GB

| Provider | Upload Time | Processing Time | First Byte | Cost (Storage + 100GB Traffic) |
|----------|-------------|-----------------|------------|-------------------------------|
| **Cloudinary** | 5 min | 10 min | 200ms | $25/month |
| **Bunny Storage** | 2 min | 0 min (instant) | 50ms | $0.51/month |
| **Bunny Stream** | 2 min | 5 min | 50ms | $1.01/month |

---

## ?? Best Practices

### 1. ?????? Bunny Stream ?????? ???????

```csharp
if (videoDuration > 300) // ???? ?? 5 ?????
{
    result = await _bunnyService.UploadVideoToStreamAsync(file, title);
}
else
{
    result = await _bunnyService.UploadVideoAsync(file);
}
```

---

### 2. ?????? Folder Organization

```csharp
var folderPath = $"lessons/year{yearId}/term{termId}/week{weekId}";
await _bunnyService.UploadVideoAsync(file, folderPath);
```

---

### 3. ?????? Signed URLs ?????????? ????????

```csharp
// ?????? ????????? ???
if (studentHasActiveSubscription)
{
    var signedUrl = _bunnyService.GenerateSignedUrl(
   videoPath,
     expirationMinutes: 120 // ??????
    );
}
```

---

### 4. ?????? Thumbnails ?????????

```csharp
// ??? Stream
var thumbnailUrl = _bunnyService.GetThumbnailUrl(videoId);

// ??? ?? Database
lesson.PosterUrl = thumbnailUrl;
```

---

## ?? ??????

### 1. Token Authentication

```csharp
// Bunny.net ???? Token Authentication ????????
var signedUrl = _bunnyService.GenerateSignedUrl(videoPath, expirationMinutes: 60);

// URL ????? ??? token ?expiration:
// https://naplan.b-cdn.net/video.mp4?token=xxx&expires=123456789
```

---

### 2. Geo Blocking (???????)

?? Bunny.net Dashboard:
- ???? ??? Pull Zone Settings
- ???? Geo Blocking
- ???? ????? ???????? (???: ????????? ????? ???????)

---

### 3. Hotlink Protection

?? Bunny.net Dashboard:
- ???? ??? Pull Zone Settings
- ???? Hotlink Protection
- ??? domains ????????:
  - `naplanbridge.com`
  - `*.naplanbridge.com`

---

## ?? Monitoring

### ?????? ??? ????????

```csharp
// Bunny.net ???? API ??????????
// ???? ????? Endpoint ????:
// - Total storage used
// - Total bandwidth used
// - Number of views
// - Geographic distribution
```

---

## ?? Migration ?? Cloudinary

### Script ???????

```csharp
public class VideoMigrationService
{
    private readonly IBunnyVideoService _bunnyService;
    private readonly IVideoService _cloudinaryService;
    private readonly DataContext _context;

    public async Task MigrateVideosFromCloudinary()
    {
        var lessons = await _context.Lessons
   .Where(l => l.VideoProvider == "Cloudinary")
            .ToListAsync();

        foreach (var lesson in lessons)
        {
            try
         {
     // 1. Download from Cloudinary
       var videoBytes = await DownloadVideo(lesson.VideoUrl);

          // 2. Upload to Bunny
    var file = CreateFormFile(videoBytes, lesson.Title);
 var result = await _bunnyService.UploadVideoToStreamAsync(file, lesson.Title);

  if (result.Success)
    {
       // 3. Update database
       lesson.VideoUrl = result.CdnUrl;
          lesson.BunnyVideoId = result.VideoId;
 lesson.VideoProvider = "BunnyStream";

  // 4. Delete from Cloudinary
      await _cloudinaryService.DeleteVideoAsync(lesson.VideoPublicId);
     }
      }
   catch (Exception ex)
            {
    // Log error
    Console.WriteLine($"Failed to migrate lesson {lesson.Id}: {ex.Message}");
            }
        }

        await _context.SaveChangesAsync();
    }
}
```

---

## ?? ??????? ??? ?????

| ??? | ????? |
|-----|-------|
| `API/Helpers/BunnySettings.cs` | Bunny.net configuration |
| `API/Services/Interfaces/IBunnyVideoService.cs` | Service interface |
| `API/Services/Implementations/BunnyVideoService.cs` | Service implementation |
| `API/DTOs/BunnyVideoUploadResult.cs` | Upload result DTO |
| `API/Entities/Lesson.cs` | Lesson entity (updated) |

---

## ?? ????? ?????

### Controller ????

```csharp
[ApiController]
[Route("api/[controller]")]
public class VideoController : ControllerBase
{
    private readonly IBunnyVideoService _bunnyService;
    private readonly DataContext _context;

    public VideoController(IBunnyVideoService bunnyService, DataContext context)
    {
        _bunnyService = bunnyService;
   _context = context;
    }

    [HttpPost("upload-lesson-video")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult> UploadLessonVideo(
   [FromForm] IFormFile videoFile,
        [FromForm] string title,
 [FromForm] int lessonId)
    {
        // Validate
        if (videoFile == null || videoFile.Length == 0)
       return BadRequest("Video file is required");

      var lesson = await _context.Lessons.FindAsync(lessonId);
     if (lesson == null) return NotFound();

  // Upload to Bunny Stream
        var result = await _bunnyService.UploadVideoToStreamAsync(videoFile, title);

 if (!result.Success)
         return BadRequest(result.ErrorMessage);

        // Update lesson
        lesson.VideoUrl = result.CdnUrl;
   lesson.BunnyVideoId = result.VideoId;
        lesson.VideoProvider = "BunnyStream";
        lesson.PosterUrl = result.ThumbnailUrl;

        await _context.SaveChangesAsync();

        return Ok(new
        {
    success = true,
  videoUrl = result.CdnUrl,
            videoId = result.VideoId,
      thumbnailUrl = result.ThumbnailUrl,
      status = result.Status
   });
    }

    [HttpGet("lesson/{lessonId}/video-url")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult> GetLessonVideoUrl(int lessonId)
    {
        var lesson = await _context.Lessons.FindAsync(lessonId);
     if (lesson == null) return NotFound();

        // ?????? ?? ??????
    var studentId = User.FindFirst("StudentId")?.Value;
        if (string.IsNullOrEmpty(studentId))
          return Unauthorized();

        // TODO: Check if student has active subscription
        
        // Generate signed URL (valid for 2 hours)
        string videoUrl;
        
        if (lesson.VideoProvider == "BunnyStorage")
   {
            videoUrl = _bunnyService.GenerateSignedUrl(lesson.BunnyStoragePath!, 120);
        }
        else
  {
     videoUrl = lesson.VideoUrl!; // HLS URL ?? ????? ?????
    }

        return Ok(new
        {
            videoUrl,
            thumbnailUrl = lesson.PosterUrl,
    duration = lesson.VideoDuration,
            provider = lesson.VideoProvider
        });
    }

    [HttpDelete("lesson/{lessonId}/video")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteLessonVideo(int lessonId)
    {
        var lesson = await _context.Lessons.FindAsync(lessonId);
      if (lesson == null) return NotFound();

        if (string.IsNullOrEmpty(lesson.BunnyVideoId))
   return BadRequest("No video to delete");

     // Delete from Bunny
        bool deleted = false;

        if (lesson.VideoProvider == "BunnyStream")
     {
        deleted = await _bunnyService.DeleteStreamVideoAsync(lesson.BunnyVideoId);
    }
        else if (lesson.VideoProvider == "BunnyStorage")
        {
  deleted = await _bunnyService.DeleteVideoAsync(lesson.BunnyStoragePath!);
        }

        if (!deleted)
            return BadRequest("Failed to delete video");

        // Update database
        lesson.VideoUrl = null;
        lesson.BunnyVideoId = null;
  lesson.BunnyStoragePath = null;
lesson.VideoProvider = null;

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
```

---

**??? ?????**: 2025-01-24  
**???????**: 1.0  
**Status**: ? Ready for Production
