# 📋 Backend Inquiry: Teacher Lesson Access Validation

**تاريخ التقرير:** 4 ديسمبر 2025  
**النوع:** استفسار / تأكيد  
**الأولوية:** 🟡 متوسطة

---

## 📌 السؤال الرئيسي

هل الـ Backend يتحقق من صلاحيات المعلم عند الوصول للدروس؟

بمعنى: لو معلم حاول يدخل على درس في مادة **ليس** لديه صلاحية عليها، هل الـ Backend يرفض الطلب؟

---

## 🔍 التحقق المطلوب

### Endpoint 1: `GET /api/Lessons/{id}`

**السيناريو:**
- المعلم "أحمد" لديه صلاحية على مادة "الرياضيات" (subjectId: 1)
- المعلم "أحمد" **ليس** لديه صلاحية على مادة "العلوم" (subjectId: 2)
- يوجد درس في مادة "العلوم" (lessonId: 50)

**Request:**
```http
GET /api/Lessons/50
Authorization: Bearer <ahmed_teacher_token>
```

**السؤال:** ماذا يحدث؟

| الاحتمال | الـ Response | الحالة |
|----------|-------------|--------|
| أ | `200 OK` + تفاصيل الدرس | ❌ غير آمن - يجب إصلاحه |
| ب | `403 Forbidden` | ✅ صحيح ومطلوب |
| ج | `404 Not Found` | ⚠️ مقبول لكن ليس مثالي |

---

### Endpoint 2: `POST /api/Progress/students/{studentId}/lessons/{lessonId}`

**السؤال:** هل المعلم يستطيع إنشاء تقدم لطالب في درس خارج صلاحياته؟

---

### Endpoint 3: `PUT /api/Progress/students/{studentId}/lessons/{lessonId}`

**السؤال:** هل المعلم يستطيع تعديل تقدم طالب في درس خارج صلاحياته؟

---

## 📊 جدول الصلاحيات المتوقع

| الدور | الوصول للدروس |
|-------|--------------|
| **Admin** | كل الدروس ✅ |
| **Teacher** | دروس المواد المصرح بها فقط ✅ |
| **Student** | الدروس المشترك فيها فقط ✅ |
| **Parent** | دروس أبنائه المشتركين فيها ✅ |

---

## 🔧 التطبيق المتوقع في الـ Backend

### في `LessonsController.cs`:

```csharp
[Authorize]
[HttpGet("{id:int}")]
public async Task<ActionResult<LessonDetailsDto>> GetLessonById(int id)
{
    var userId = GetUserIdFromClaims();
    var lesson = await context.Lessons
        .Include(l => l.Week)
        .ThenInclude(w => w.Term)
        .FirstOrDefaultAsync(l => l.Id == id);
    
    if (lesson == null) return NotFound();
    
    // ✅ Admin يتجاوز التحقق
    if (User.IsInRole("Admin"))
    {
        return Ok(await MapToDto(lesson));
    }
    
    // ✅ Teacher: تحقق من الصلاحيات على المادة
    if (User.IsInRole("Teacher"))
    {
        var subjectId = lesson.Week.Term.SubjectId;
        var hasPermission = await context.TeacherPermissions
            .AnyAsync(tp => tp.TeacherId == userId && tp.SubjectId == subjectId);
        
        if (!hasPermission)
        {
            return StatusCode(403, new
            {
                StatusCode = 403,
                Message = "You do not have permission to access lessons in this subject",
                Details = new
                {
                    LessonId = id,
                    SubjectId = subjectId,
                    RequiredPermission = "Subject access"
                }
            });
        }
        
        return Ok(await MapToDto(lesson));
    }
    
    // ✅ Student: تحقق من الاشتراك (تم تطبيقه سابقاً)
    // ...
}
```

---

## ✅ Checklist للتأكيد

يرجى تأكيد الآتي:

- [ ] `GET /api/Lessons/{id}` يتحقق من صلاحيات المعلم على المادة
- [ ] `POST /api/Progress/...` يتحقق من صلاحيات المعلم
- [ ] `PUT /api/Progress/...` يتحقق من صلاحيات المعلم
- [ ] `GET /api/Lessons/subject/{subjectId}/...` يتحقق من صلاحيات المعلم
- [ ] الـ Response عند الرفض هو `403 Forbidden` مع رسالة واضحة

---

## 📝 الـ Response المطلوب من الـ Backend Team

### إذا كان مُطبق ✅:
```
✔ TEACHER PERMISSION CHECK CONFIRMED

الـ Endpoints التالية تتحقق من صلاحيات المعلم:
- GET /api/Lessons/{id} ✅
- POST /api/Progress/... ✅
- PUT /api/Progress/... ✅

Response عند عدم وجود صلاحية: 403 Forbidden
```

### إذا كان غير مُطبق ❌:
```
❌ TEACHER PERMISSION CHECK NOT IMPLEMENTED

الـ Endpoints التي تحتاج تعديل:
- [ ] GET /api/Lessons/{id}
- [ ] POST /api/Progress/...
- [ ] PUT /api/Progress/...

الوقت المتوقع للتطبيق: [X] ساعات
```

---

## 🎯 ملخص

| العنصر | الحالة |
|--------|--------|
| التحقق من اشتراك الطالب | ✅ مُطبق |
| التحقق من صلاحيات المعلم | ❓ **بانتظار التأكيد** |
| الـ Frontend Guard | ✅ جاهز (يعتمد على Backend) |

---

## 📞 ملاحظة للـ Frontend

الـ Frontend جاهز بالفعل للتعامل مع صلاحيات المعلم:

1. **`subscriptionGuard`**: يتحقق من صلاحيات المعلم قبل الدخول للصفحة
2. **`LessonDetailComponent`**: يعالج Response 403 ويعرض رسالة مناسبة

**المطلوب من الـ Backend:**
- تأكيد أن التحقق من صلاحيات المعلم مُطبق
- أو تطبيقه إذا لم يكن موجوداً

---

*بانتظار الرد من فريق الـ Backend* 🙏
