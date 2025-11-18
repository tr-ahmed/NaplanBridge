# 🚀 خطة العمل السريعة - تصليح محتوى المعلم

**الهدف:** جعل إدارة المحتوى شغالة بـ 100%

---

## 🔴 المشكلة الأساسية

المعلم يدخل لإدارة المحتوى لكن:
- ❌ ما بيشوف المواد الخاصة به
- ❌ ما يقدر ينشئ موضوع جديد
- ❌ الملفات قد تضيع

---

## ✅ الحل العملي

### الخطوة 1: المواد (Subjects) ⭐ **الأهم**

**المشكلة:** الـ Endpoint `/api/TeacherContent/my-subjects` برجع أرقام فقط

**الحل في الـ Backend:**

```csharp
// File: TeacherContentController.cs
[HttpGet("my-subjects")]
[Authorize(Roles = "Teacher")]
public async Task<ApiResponse<List<TeacherSubjectDto>>> GetMySubjects()
{
    var teacherId = User.GetTeacherId(); // من JWT Token
    
    var subjects = await _db.TeacherSubjects
        .Where(ts => ts.TeacherId == teacherId)
        .Select(ts => new TeacherSubjectDto
        {
            SubjectId = ts.SubjectId,
            SubjectName = ts.Subject.Name,
            YearId = ts.Subject.YearId,
            YearName = ts.Subject.Year.Name,
            CanCreate = ts.CanCreate,
            CanEdit = ts.CanEdit,
            CanDelete = ts.CanDelete,
            Stats = new SubjectStatsDto
            {
                Total = ts.Subject.Lessons.Count(),
                Approved = ts.Subject.Lessons.Count(l => l.Status == ContentStatus.Approved),
                Pending = ts.Subject.Lessons.Count(l => l.Status == ContentStatus.Pending),
                Rejected = ts.Subject.Lessons.Count(l => l.Status == ContentStatus.Rejected),
                RevisionRequested = ts.Subject.Lessons.Count(l => l.Status == ContentStatus.RevisionRequested)
            }
        })
        .ToListAsync();
    
    return ApiResponse<List<TeacherSubjectDto>>.Success(subjects, "Subjects retrieved successfully");
}
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "subjectId": 1,
      "subjectName": "الرياضيات",
      "yearId": 1,
      "yearName": "الصف الأول الثانوي",
      "canCreate": true,
      "canEdit": true,
      "canDelete": false,
      "stats": {
        "total": 5,
        "approved": 3,
        "pending": 1,
        "rejected": 0,
        "revisionRequested": 1
      }
    }
  ]
}
```

---

### الخطوة 2: إنشاء المواد (Create Subjects)

**المشكلة:** المعلم بيحصل على 403 Forbidden

**السبب:** عند محاولة:
```csharp
POST /api/Subjects
```

الخادم بيقول: "فقط Admin!"

**الحل - اختر واحد:**

#### **الحل أ: اعطاء صلاحية للمعلم (الأسهل)**

في الـ Database أو عبر API:
```csharp
// أول مرة فقط
POST /api/TeacherPermissions/grant
{
  "teacherId": <معرف المعلم>,
  "subjectId": null,
  "canCreate": true,
  "canEdit": true,
  "canDelete": false
}
```

#### **الحل ب: تعديل الـ Authorization (الأفضل)**

```csharp
// File: SubjectsController.cs
[HttpPost]
[Authorize]  // بدل [Authorize(Roles = "Admin")]
public async Task<IActionResult> CreateSubject([FromForm] CreateSubjectDto dto)
{
    var userId = User.GetUserId();
    var userRole = User.GetRole();
    
    // Check: هل هذا Admin؟
    if (userRole == "Admin")
    {
        // Admin ممكن ينشئ مادة وينسبها لأي معلم
    }
    else if (userRole == "Teacher")
    {
        // Teacher بس ممكن ينشئ مادة لنفسه
        dto.TeacherId = userId;
    }
    else
    {
        return Unauthorized("فقط Admin والمعلمين يقدرو ينشئو مواد");
    }
    
    // ... بقية الـ Code
}
```

---

### الخطوة 3: المحتوى (Lessons/Content)

**التأكد من:**

```csharp
// File: TeacherContentController.cs
[HttpGet("my-content")]
[Authorize(Roles = "Teacher")]
public async Task<ApiResponse<List<ContentItemDto>>> GetMyContent(
    [FromQuery] int? subjectId,
    [FromQuery] string status,
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10)
{
    var teacherId = User.GetTeacherId();
    
    var query = _db.ContentItems
        .Where(c => c.TeacherId == teacherId || c.SubjectTeachers.Any(st => st.TeacherId == teacherId))
        .AsQueryable();
    
    if (subjectId.HasValue)
        query = query.Where(c => c.SubjectId == subjectId.Value);
    
    if (!string.IsNullOrEmpty(status))
        query = query.Where(c => c.Status.ToString() == status);
    
    var items = await query
        .OrderByDescending(c => c.CreatedAt)
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .Select(c => new ContentItemDto
        {
            Id = c.Id,
            ItemType = c.ItemType,
            Title = c.Title,
            Description = c.Description,
            Status = c.Status.ToString(),
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            ApprovedAt = c.ApprovedAt,
            RejectionReason = c.RejectionReason,
            RevisionFeedback = c.RevisionFeedback,
            SubjectId = c.SubjectId
        })
        .ToListAsync();
    
    return ApiResponse<List<ContentItemDto>>.Success(items);
}
```

---

### الخطوة 4: رفع الملفات (Upload)

**التأكد من:**

```csharp
// File: LessonsController.cs
[HttpPost]
[Authorize(Roles = "Teacher")]
public async Task<IActionResult> CreateLesson(
    [FromQuery] string title,
    [FromQuery] string description,
    [FromQuery] int weekId,
    [FromForm] IFormFile posterFile,
    [FromForm] IFormFile videoFile)
{
    // التحقق من الملفات
    if (posterFile == null || posterFile.Length == 0)
        return BadRequest("صورة الدرس مطلوبة");
    
    if (videoFile == null || videoFile.Length == 0)
        return BadRequest("فيديو الدرس مطلوب");
    
    // التحقق من الحجم
    const long maxImageSize = 10 * 1024 * 1024;      // 10 MB
    const long maxVideoSize = 500 * 1024 * 1024;     // 500 MB
    
    if (posterFile.Length > maxImageSize)
        return BadRequest("صورة الدرس كبيرة جداً (أقصى 10MB)");
    
    if (videoFile.Length > maxVideoSize)
        return BadRequest("فيديو الدرس كبير جداً (أقصى 500MB)");
    
    // حفظ الملفات
    var posterPath = await _fileService.SaveFileAsync(posterFile, "lessons/posters");
    var videoPath = await _fileService.SaveFileAsync(videoFile, "lessons/videos");
    
    var lesson = new Lesson
    {
        Title = title,
        Description = description,
        WeekId = weekId,
        PosterUrl = posterPath,
        VideoUrl = videoPath,
        TeacherId = User.GetTeacherId(),
        Status = ContentStatus.Created,
        CreatedAt = DateTime.UtcNow
    };
    
    _db.Lessons.Add(lesson);
    await _db.SaveChangesAsync();
    
    return Ok(new { 
        success = true, 
        lessonId = lesson.Id,
        posterUrl = posterPath,
        videoUrl = videoPath
    });
}
```

---

### الخطوة 5: الموافقات

**التأكد من:**

```csharp
// File: TeacherContentController.cs
[HttpGet("pending-approvals")]
[Authorize(Roles = "Admin")]
public async Task<ApiResponse<List<PendingApprovalDto>>> GetPendingApprovals()
{
    var pendingItems = await _db.ContentItems
        .Where(c => c.Status == ContentStatus.Pending)
        .Select(c => new PendingApprovalDto
        {
            Id = c.Id,
            ItemType = c.ItemType,
            Title = c.Title,
            Status = c.Status.ToString(),
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            TeacherName = c.Teacher.Name,
            TeacherId = c.TeacherId,
            SubmittedAt = c.UpdatedAt
        })
        .ToListAsync();
    
    return ApiResponse<List<PendingApprovalDto>>.Success(pendingItems);
}

[HttpPost("approve")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> ApproveContent([FromBody] int contentId)
{
    var content = await _db.ContentItems.FindAsync(contentId);
    if (content == null)
        return NotFound();
    
    content.Status = ContentStatus.Approved;
    content.ApprovedBy = User.GetUserId();
    content.ApprovedAt = DateTime.UtcNow;
    
    await _db.SaveChangesAsync();
    
    return Ok(new { success = true, message = "تم الموافقة على المحتوى" });
}
```

---

## 📊 جدول الفحص

| العنصر | الحالة | الإجراء |
|-------|--------|--------|
| الخادم يرجع الـ Subjects | ❓ | افحص `/api/TeacherContent/my-subjects` |
| المعلم يقدر ينشئ مادة | ❌ | اعطيه الصلاحية أو عدّل الـ Endpoint |
| الملفات تُحفظ | ❓ | افحص `/api/Lessons` مع multipart |
| المحتوى يظهر | ❓ | افحص `/api/TeacherContent/my-content` |
| الموافقات تشتغل | ❓ | افحص `/api/TeacherContent/approve` |

---

## ⏱️ الوقت المتوقع

| الخطوة | الوقت | الصعوبة |
|--------|-------|---------|
| إصلاح الـ Subjects | 30 دقيقة | سهل |
| صلاحيات الإنشاء | 15 دقيقة | سهل جداً |
| الملفات | 1 ساعة | متوسط |
| الموافقات | 1 ساعة | متوسط |
| **الإجمالي** | **~3 ساعات** | **متوسط** |

---

## 🚀 ترتيب الأولويات

1. ✅ **أولاً:** إصلاح `/api/TeacherContent/my-subjects`
2. ✅ **ثانياً:** حل صلاحيات الإنشاء
3. ✅ **ثالثاً:** تأكد من الملفات
4. ✅ **رابعاً:** الموافقات
5. ✅ **خامساً:** الاختبار النهائي

---

## ✨ بعد الانتهاء

يكون المعلم قادر على:
- ✅ شوف المواد الخاصة به
- ✅ ينشئ موضوع جديد
- ✅ ينشئ درس مع فيديو وصورة
- ✅ يشوف حالة محتواه
- ✅ يشتغل بسهولة على المنصة

---

**معد بواسطة:** GitHub Copilot  
**التاريخ:** 18 نوفمبر 2025  
**الحالة:** جاهز للتنفيذ 🚀

