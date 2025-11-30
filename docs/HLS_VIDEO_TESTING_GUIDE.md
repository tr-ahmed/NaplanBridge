# دليل اختبار فيديو HLS في صفحة Lesson Detail

## 📋 نظرة عامة

تم تفعيل دعم HLS (HTTP Live Streaming) بالكامل في صفحة lesson-detail. النظام يدعم:
- ✅ **BunnyStream**: Adaptive HLS streaming
- ✅ **Mux**: Premium HLS with analytics
- ✅ **Fallback**: لدعم Safari وأنظمة HLS الأصلية

---

## 🔧 الإعدادات المطلوبة

### 1. التأكد من وجود المكتبات المطلوبة
تأكد من أن `src/index.html` يحتوي على:

```html
<!-- HLS.js for BunnyStream HLS Support -->
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>

<!-- Plyr.io for Video Player UI -->
<link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
<script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
```

### 2. إعدادات الدرس (Lesson Data)
يجب أن يحتوي الدرس على:

```typescript
{
  id: 41,
  title: "اسم الدرس",
  videoUrl: "https://vz-9161a4ae-e6d.b-cdn.net/VIDEO_ID/playlist.m3u8",
  videoProvider: "BunnyStream",  // أو "Mux"
  posterUrl: "https://example.com/poster.jpg",  // اختياري
  // ... باقي البيانات
}
```

### 3. أنواع URLs المدعومة

#### BunnyStream HLS:
```
https://vz-9161a4ae-e6d.b-cdn.net/VIDEO_ID/playlist.m3u8
```

#### Mux HLS:
```javascript
{
  videoProvider: "Mux",
  muxPlaybackId: "PLAYBACK_ID",
  muxAssetId: "ASSET_ID"  // اختياري
}
```

---

## 🧪 خطوات الاختبار

### المرحلة 1: فحص Console Logs

1. افتح DevTools (F12)
2. انتقل إلى tab **Console**
3. افتح الصفحة: `http://localhost:4200/lesson-detail/41`
4. ابحث عن هذه الرسائل:

```
📹 Lesson loaded: {id: 41, ...}
📹 Video URL: https://...m3u8
🎬 Initializing video player with HLS support: {
  lessonId: 41,
  provider: "BunnyStream",
  videoUrl: "...",
  isHLS: true
}
🎥 VideoService: Initializing player {
  provider: "BunnyStream",
  videoUrl: "...",
  isHLS: true
}
🎥 Using BunnyStream player (HLS)
🎥 BunnyStream: Checking HLS support... {
  'HLS.isSupported()': true,
  'Native HLS support': '',
  'Video URL': '...'
}
✅ HLS.js is supported, initializing...
✅ HLS manifest parsed successfully
```

### المرحلة 2: فحص الأخطاء المحتملة

#### خطأ: "❌ No HLS support available!"
**الحل:**
- تأكد من أن HLS.js محمل في index.html
- جرب متصفح آخر (Chrome, Firefox, Edge)

#### خطأ: "❌ HLS Error: Network error"
**الحل:**
- تأكد من أن رابط الفيديو صحيح
- تأكد من وجود اتصال بالإنترنت
- تأكد من أن CDN متاح

#### خطأ: "❌ HLS Error: Media error"
**الحل:**
- تأكد من أن ملف .m3u8 موجود وصحيح
- تأكد من أن الفيديو متوفر على السيرفر

### المرحلة 3: اختبار التشغيل

1. **تحميل الصفحة:**
   - يجب أن يظهر الفيديو مع poster image
   - يجب أن يكون Play button ظاهر

2. **الضغط على Play:**
   - يجب أن يبدأ الفيديو بالتشغيل
   - يجب أن تظهر controls (play, pause, volume, fullscreen)

3. **اختبار Quality Selector:**
   - افتح Settings في الفيديو player
   - يجب أن ترى خيارات Quality مختلفة (Auto, 1080p, 720p, ...)

4. **اختبار Adaptive Streaming:**
   - شغل الفيديو
   - قلل سرعة الإنترنت (في DevTools: Network tab → Throttling)
   - يجب أن يتكيف الفيديو تلقائياً مع السرعة الجديدة

---

## 🔍 التحقق من المشاكل الشائعة

### 1. الفيديو لا يظهر
✅ **افحص:**
- هل `videoUrl` موجود في بيانات الدرس؟
- هل `#videoPlayer` موجود في HTML؟
- هل `VideoService` تم حقنه بشكل صحيح؟

### 2. الفيديو يعرض error
✅ **افحص:**
- Network tab: هل الفيديو يتم تحميله؟
- Console: هل هناك أخطاء CORS؟
- هل URL صحيح وينتهي بـ `.m3u8`؟

### 3. Controls لا تظهر
✅ **افحص:**
- هل Plyr.js محمل؟
- هل CSS الخاص بـ Plyr محمل؟
- افحص Elements tab للتأكد من أن controls موجودة

---

## 📊 اختبار مع بيانات حقيقية

### استخدام BunnyStream
```typescript
// في API response أو mock data:
{
  id: 41,
  title: "الدرس 41 - الرياضيات",
  videoUrl: "https://vz-9161a4ae-e6d.b-cdn.net/abc123xyz/playlist.m3u8",
  videoProvider: "BunnyStream",
  bunnyVideoId: "abc123xyz",
  posterUrl: "https://vz-9161a4ae-e6d.b-cdn.net/abc123xyz/thumbnail.jpg"
}
```

### استخدام Mux
```typescript
{
  id: 41,
  title: "الدرس 41 - الرياضيات",
  videoProvider: "Mux",
  muxPlaybackId: "YOUR_PLAYBACK_ID",
  muxAssetId: "YOUR_ASSET_ID"
}
```

---

## 🚀 النشر (Production)

### قبل النشر:
1. ✅ اختبر على متصفحات مختلفة (Chrome, Firefox, Safari, Edge)
2. ✅ اختبر على أجهزة مختلفة (Desktop, Mobile, Tablet)
3. ✅ اختبر مع سرعات إنترنت مختلفة
4. ✅ تأكد من أن CDN متاح عالمياً

### بعد النشر:
1. راقب Console للأخطاء
2. راقب Network لسرعة التحميل
3. اجمع feedback من المستخدمين

---

## 📝 ملاحظات إضافية

### الميزات المفعلة:
- ✅ **Adaptive Bitrate Streaming**: يتكيف تلقائياً مع سرعة الإنترنت
- ✅ **Quality Selection**: المستخدم يمكنه اختيار الجودة يدوياً
- ✅ **Speed Control**: تغيير سرعة التشغيل (0.5x - 2x)
- ✅ **Resume Playback**: الاستكمال من آخر موضع
- ✅ **Error Recovery**: معالجة الأخطاء تلقائياً
- ✅ **Progress Tracking**: حفظ التقدم تلقائياً

### الميزات المتقدمة (متاحة):
- Picture-in-Picture (PiP)
- AirPlay (iOS/macOS)
- Fullscreen
- Keyboard shortcuts

---

## 🔗 روابط مفيدة

- [HLS.js Documentation](https://github.com/video-dev/hls.js/)
- [Plyr.io Documentation](https://plyr.io/)
- [Bunny.net Stream Documentation](https://docs.bunny.net/docs/stream)
- [Mux Video Documentation](https://docs.mux.com/guides/video)

---

## ✅ Checklist النهائي

قبل اعتبار الميزة جاهزة:

- [ ] الفيديو يعمل على Chrome
- [ ] الفيديو يعمل على Firefox
- [ ] الفيديو يعمل على Safari
- [ ] الفيديو يعمل على Edge
- [ ] الفيديو يعمل على Mobile
- [ ] Quality selection يعمل
- [ ] Speed control يعمل
- [ ] Resume playback يعمل
- [ ] Progress tracking يعمل
- [ ] Error handling يعمل
- [ ] Console logs واضحة ومفيدة
- [ ] لا توجد أخطاء في Console

---

## 🎯 الخلاصة

الإعدادات الحالية جاهزة تماماً لعرض فيديو HLS في صفحة lesson-detail/41. النظام يستخدم:

1. **VideoService** - يدير جميع أنواع الفيديو
2. **HLS.js** - للمتصفحات التي لا تدعم HLS أصلاً
3. **Plyr.js** - لواجهة المستخدم الاحترافية
4. **Auto-detection** - يختار تلقائياً الطريقة الأفضل للتشغيل

ما عليك إلا التأكد من أن بيانات الدرس تحتوي على `videoUrl` صحيح ينتهي بـ `.m3u8`!
