# 📊 تقرير التحقق من توافق إدارة المحتوى مع API

## 🔍 النتائج الأولية

تم فحص توافق `teacher-content-management.service.ts` مع `swagger.json`

---

## ✅ المتوافق

### 1. Lessons Endpoints
✅ **GET /api/Lessons** - يطابق مع `getLessons()` في الخدمة
✅ **GET /api/Lessons/{id}** - يطابق مع `getLesson(id)` 
✅ **DELETE /api/Lessons/{id}** - يطابق مع `deleteContent()`

### 2. Subjects Endpoints
✅ **GET /api/Subjects** - يطابق مع `getAllSubjects()`
✅ **GET /api/Subjects/{id}** - يطابق مع `getSubjectById(id)`
✅ **POST /api/Subjects** - يطابق مع `createSubject()`
✅ **PUT /api/Subjects/{id}** - يطابق مع `updateSubject()`

---

## ⚠️ المشاكل المكتشفة

### المشكلة 1: POST /api/Lessons - طريقة إرسال البيانات
**في Swagger:**
```json
"parameters": [
  {"name": "Title", "in": "query", "required": true},
  {"name": "Description", "in": "query", "required": true},
  {"name": "WeekId", "in": "query"}
],
"requestBody": {
  "content": {
    "multipart/form-data": {
      "schema": {
        "properties": {
          "PosterFile": {"type": "string", "format": "binary"},
          "VideoFile": {"type": "string", "format": "binary"}
        }
      }
    }
  }
}
```

**في الخدمة (service):**
```typescript
createLesson(lessonData: any): Observable<any> {
  return this.http.post<any>(`${this.baseApiUrl}/Lessons`, lessonData)
}
```

**المشكلة:** 
- ❌ الخدمة ترسل البيانات كـ JSON عادي
- ✅ يجب إرسالها كـ `multipart/form-data` مع الملفات

---

### المشكلة 2: PUT /api/Lessons/{id} - نفس الطريقة
**في Swagger:**
```json
"put": {
  "parameters": [
    {"name": "id", "in": "path", "required": true},
    {"name": "Title", "in": "query"},
    {"name": "Description", "in": "query"},
    {"name": "WeekId", "in": "query"}
  ],
  "requestBody": {
    "multipart/form-data": {
      "properties": {
        "PosterFile": {"type": "string", "format": "binary"},
        "VideoFile": {"type": "string", "format": "binary"}
      }
    }
  }
}
```

**في الخدمة:**
```typescript
updateLesson(lessonId: number, lessonData: any): Observable<any> {
  return this.http.put<any>(`${this.baseApiUrl}/Lessons/${lessonId}`, lessonData)
}
```

**المشكلة:**
- ❌ نفس المشكلة - يجب استخدام `multipart/form-data`

---

### المشكلة 3: POST /api/Subjects - المتطلبات

**في Swagger POST /api/Subjects:**
```json
"post": {
  "parameters": [
    {"name": "YearId", "in": "query"},
    {"name": "SubjectNameId", "in": "query"},
    {"name": "OriginalPrice", "in": "query"},
    {"name": "DiscountPercentage", "in": "query"},
    {"name": "Level", "in": "query"},
    {"name": "Duration", "in": "query"},
    {"name": "TeacherId", "in": "query"},
    {"name": "StartDate", "in": "query"}
  ],
  "requestBody": {
    "multipart/form-data": {
      "required": ["PosterFile"]
    }
  }
}
```

**في الخدمة:**
```typescript
createSubject(subjectData: any): Observable<TeacherSubject> {
  return this.http.post<ApiResponse<TeacherSubject>>(
    `${this.baseApiUrl}/Subjects`, 
    subjectData
  )
}
```

**المشاكل:**
- ❌ الخدمة لا ترسل ملف PosterFile
- ❌ لا تستخدم multipart/form-data
- ❌ قد تكون هناك حقول مفقودة (SubjectNameId, OriginalPrice, إلخ)

---

## 🔧 الحلول المطلوبة

### الحل 1: تحسين createLesson()
```typescript
createLesson(lessonData: any): Observable<any> {
  const formData = new FormData();
  
  // Add form fields
  formData.append('Title', lessonData.title);
  formData.append('Description', lessonData.description);
  if (lessonData.weekId) {
    formData.append('WeekId', lessonData.weekId);
  }
  
  // Add files
  if (lessonData.posterFile) {
    formData.append('PosterFile', lessonData.posterFile);
  }
  if (lessonData.videoFile) {
    formData.append('VideoFile', lessonData.videoFile);
  }
  
  return this.http.post<any>(`${this.baseApiUrl}/Lessons`, formData)
    .pipe(
      catchError(error => {
        console.error('Error creating lesson:', error);
        throw error;
      })
    );
}
```

### الحل 2: تحسين updateLesson()
```typescript
updateLesson(lessonId: number, lessonData: any): Observable<any> {
  const formData = new FormData();
  
  if (lessonData.title) {
    formData.append('Title', lessonData.title);
  }
  if (lessonData.description) {
    formData.append('Description', lessonData.description);
  }
  if (lessonData.weekId) {
    formData.append('WeekId', lessonData.weekId);
  }
  if (lessonData.posterFile) {
    formData.append('PosterFile', lessonData.posterFile);
  }
  if (lessonData.videoFile) {
    formData.append('VideoFile', lessonData.videoFile);
  }
  
  return this.http.put<any>(
    `${this.baseApiUrl}/Lessons/${lessonId}`, 
    formData
  )
    .pipe(
      catchError(error => {
        console.error('Error updating lesson:', error);
        throw error;
      })
    );
}
```

### الحل 3: تحسين createSubject()
```typescript
createSubject(subjectData: any): Observable<any> {
  const formData = new FormData();
  
  // Required fields
  formData.append('YearId', subjectData.yearId);
  formData.append('SubjectNameId', subjectData.subjectNameId);
  
  // Optional fields
  if (subjectData.originalPrice) {
    formData.append('OriginalPrice', subjectData.originalPrice);
  }
  if (subjectData.discountPercentage) {
    formData.append('DiscountPercentage', subjectData.discountPercentage);
  }
  if (subjectData.level) {
    formData.append('Level', subjectData.level);
  }
  if (subjectData.duration) {
    formData.append('Duration', subjectData.duration);
  }
  if (subjectData.teacherId) {
    formData.append('TeacherId', subjectData.teacherId);
  }
  if (subjectData.startDate) {
    formData.append('StartDate', subjectData.startDate);
  }
  
  // Required poster file
  if (subjectData.posterFile) {
    formData.append('PosterFile', subjectData.posterFile);
  }
  
  return this.http.post<ApiResponse<any>>(
    `${this.baseApiUrl}/Subjects`, 
    formData
  )
    .pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error creating subject:', error);
        throw error;
      })
    );
}
```

---

## 📋 قائمة التحقق

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| GET /api/Lessons | ✅ | متوافق |
| GET /api/Lessons/{id} | ✅ | متوافق |
| DELETE /api/Lessons/{id} | ✅ | متوافق |
| POST /api/Lessons | ⚠️ | يحتاج تعديل (multipart) |
| PUT /api/Lessons/{id} | ⚠️ | يحتاج تعديل (multipart) |
| GET /api/Subjects | ✅ | متوافق |
| GET /api/Subjects/{id} | ✅ | متوافق |
| POST /api/Subjects | ⚠️ | يحتاج تعديل (multipart) |
| PUT /api/Subjects/{id} | ✅ | متوافق (JSON) |

---

## 🎯 الأولويات

**عالية (High):**
1. ✅ تصحيح `createLesson()` لاستخدام multipart
2. ✅ تصحيح `updateLesson()` لاستخدام multipart
3. ✅ تصحيح `createSubject()` لاستخدام multipart

**متوسطة (Medium):**
4. إضافة validation للحقول المطلوبة
5. تحسين معالجة الأخطاء

---

## 📝 ملاحظات مهمة

1. **Multipart/Form-Data:**
   - الملفات يجب أن ترسل عبر `FormData` في JavaScript
   - المعاملات يجب أن تكون في الـ query أو في الـ FormData نفسه

2. **الحقول المطلوبة:**
   - POST /api/Lessons: Title, Description, PosterFile, VideoFile
   - POST /api/Subjects: YearId, SubjectNameId, PosterFile
   
3. **الحقول الاختيارية:**
   - POST /api/Lessons: WeekId
   - POST /api/Subjects: OriginalPrice, DiscountPercentage, Level, Duration, TeacherId, StartDate

---

## 🚀 التالي

بعد تطبيق التصحيحات:
1. اختبر POST /api/Lessons مع ملفات
2. اختبر PUT /api/Lessons/{id} مع ملفات
3. اختبر POST /api/Subjects مع جميع الحقول
