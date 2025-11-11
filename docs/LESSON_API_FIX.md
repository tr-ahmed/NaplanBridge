# تحديث API إضافة الدرس - Lesson Creation API Fix

## 🔧 المشكلة

كان الـ API call يرسل `SubjectId` كـ query parameter، لكن حسب Swagger API الفعلي، الـ endpoint لا يتوقع هذا المعامل.

## ✅ الحل

تم تحديث `content.service.ts` لإزالة `SubjectId` من الـ query parameters.

### Before (قبل):
```typescript
let params = new HttpParams()
  .set('Title', title)
  .set('Description', description)
  .set('WeekId', weekId.toString())
  .set('SubjectId', subjectId.toString());  // ❌ غير مطلوب
```

### After (بعد):
```typescript
let params = new HttpParams()
  .set('Title', title)
  .set('Description', description)
  .set('WeekId', weekId.toString());  // ✅ فقط المعاملات المطلوبة
```

## 📋 Swagger API Specification

### Endpoint:
```
POST /api/Lessons
```

### Query Parameters:
- `Title` (required) - string
- `Description` (required) - string
- `WeekId` (required) - integer
- `Duration` (optional) - integer
- `OrderIndex` (optional) - integer

### Request Body (multipart/form-data):
- `PosterFile` (required) - binary file
- `VideoFile` (required) - binary file

### Response:
```json
{
  "id": 31,
  "title": "string",
  "posterUrl": "https://...",
  "videoUrl": "https://...",
  "description": "string",
  "weekId": 1,
  "subjectId": 0,  // يُحسب تلقائياً من الـ backend
  "termId": 0      // يُحسب تلقائياً من الـ backend
}
```

## 📝 ملاحظات

1. **SubjectId و TermId** يتم حسابهما تلقائياً في الـ backend بناءً على الـ `WeekId`
2. الـ backend يستخرج الـ `SubjectId` من الـ `Week` المحدد
3. الـ backend يستخرج الـ `TermId` من الـ `Week` المحدد

## ✅ الملفات المحدثة

- `src/app/core/services/content.service.ts`

## 🧪 الاختبار

### Request Example:
```bash
curl -X 'POST' \
  'https://naplan2.runasp.net/api/Lessons?Title=Test&Description=Description&WeekId=1' \
  -H 'Content-Type: multipart/form-data' \
  -F 'PosterFile=@image.jpg' \
  -F 'VideoFile=@video.mp4'
```

### Expected Response:
```json
{
  "id": 31,
  "title": "Test",
  "posterUrl": "https://cloudinary.../image.jpg",
  "videoUrl": "https://cloudinary.../video.mp4",
  "description": "Description",
  "weekId": 1,
  "subjectId": 5,  // حُسب من Week
  "termId": 2      // حُسب من Week
}
```

## 🎯 التأثير

- ✅ الـ API call الآن متوافق 100% مع Swagger
- ✅ لا حاجة لإرسال SubjectId يدوياً
- ✅ الـ backend يحسب SubjectId و TermId تلقائياً
- ✅ تقليل احتمالية الأخطاء

## 📅 التاريخ

**تاريخ التحديث:** 4 نوفمبر 2025  
**الحالة:** ✅ مكتمل ومختبر
