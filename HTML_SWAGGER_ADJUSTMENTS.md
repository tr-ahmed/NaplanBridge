# تعديلات HTML لمطابقة Swagger.json 📋

## مراجعة المتطلبات من Swagger

### 1. POST /api/Subjects - المتطلبات:

**Query Parameters (Required):**
- `YearId` - معرف السنة/المستوى
- `SubjectNameId` - معرف اسم المادة

**Query Parameters (Optional):**
- `OriginalPrice` - السعر الأصلي (رقم)
- `DiscountPercentage` - نسبة الخصم (رقم)
- `Level` - المستوى (نص)
- `Duration` - المدة (رقم دقائق)
- `TeacherId` - معرف المعلم (رقم)
- `StartDate` - تاريخ البداية (تاريخ)

**Request Body (Multipart):**
- `PosterFile` - صورة الغلاف (مطلوب)

---

### 2. POST /api/Lessons - المتطلبات:

**Query Parameters (Required):**
- `Title` - عنوان الدرس
- `Description` - وصف الدرس

**Query Parameters (Optional):**
- `WeekId` - معرف الأسبوع

**Request Body (Multipart):**
- `PosterFile` - صورة الغلاف (مطلوب)
- `VideoFile` - ملف الفيديو (مطلوب)

---

## المشاكل الحالية ❌

### في `subject-creation-modal.component.ts`:

```
الحالية:
- formControlName: "name" (text field)
- formControlName: "description" (textarea)
- formControlName: "yearId" (select)
- formControlName: "code" (text field)

المطلوب حسب Swagger:
✅ YearId - معرف السنة (مطلوب)
✅ SubjectNameId - معرف اسم المادة (مطلوب)
❌ OriginalPrice - السعر الأصلي (اختياري)
❌ DiscountPercentage - نسبة الخصم (اختياري)
❌ Level - المستوى (اختياري)
❌ Duration - المدة (اختياري)
❌ TeacherId - معرف المعلم (اختياري)
❌ StartDate - تاريخ البداية (اختياري)
❌ PosterFile - صورة الغلاف (مطلوب)

المشاكل:
1. لا يوجد field لـ SubjectNameId (مطلوب)
2. لا يوجد file upload للـ PosterFile (مطلوب)
3. حقول اختيارية مهمة مفقودة (السعر، الخصم، المستوى، المدة، تاريخ البداية)
4. حقل "name" و "code" غير موجود في Swagger
```

### في `content-creation-wizard.component.ts`:

```
الحالية:
- itemType, title, description, subjectId, duration, videoUrl, questionCount, objectives

المطلوب حسب Swagger (للدروس):
✅ Title - العنوان (مطلوب - كـ query param)
✅ Description - الوصف (مطلوب - كـ query param)
❌ WeekId - معرف الأسبوع (اختياري - كـ query param)
❌ PosterFile - صورة الغلاف (مطلوب - multipart)
❌ VideoFile - ملف الفيديو (مطلوب - multipart)

المشاكل:
1. لا يوجد file upload للـ PosterFile (مطلوب)
2. لا يوجد file upload للـ VideoFile (مطلوب)
3. لا يوجد WeekId selector
4. Duration يُمرر كـ form field بدلاً من query parameter
```

---

## الحل الموصى به 🎯

### 1. تحديث `subject-creation-modal.component.ts`

```typescript
// إضافة الحقول المطلوبة:
subjectForm: FormGroup = this.fb.group({
  subjectNameId: ['', Validators.required],  // ✅ معرف اسم المادة
  yearId: ['', Validators.required],         // ✅ معرف السنة
  originalPrice: [''],                        // ⭕ السعر الأصلي
  discountPercentage: [''],                   // ⭕ نسبة الخصم
  level: [''],                                // ⭕ المستوى
  duration: [''],                             // ⭕ المدة
  startDate: [''],                            // ⭕ تاريخ البداية
  posterFile: [null, Validators.required]     // ✅ صورة الغلاف
});
```

### 2. تحديث `content-creation-wizard.component.ts`

```typescript
// للدروس (Lesson):
contentForm: FormGroup = this.fb.group({
  itemType: ['', Validators.required],
  title: ['', Validators.required],
  description: ['', Validators.required],
  weekId: [''],                        // ⭕ معرف الأسبوع
  posterFile: [null, Validators.required],  // ✅ صورة الغلاف
  videoFile: [null, Validators.required]    // ✅ ملف الفيديو
});
```

---

## خطوات التطبيق

### الخطوة 1: تحديث subject-creation-modal.component.ts
- إضافة file input للـ PosterFile
- إضافة حقول السعر والخصم والمستوى والمدة والتاريخ
- تغيير "name" إلى "subjectNameId" (مع fetch dropdown من API)
- تحديث service call لإرسال البيانات بشكل صحيح

### الخطوة 2: تحديث content-creation-wizard.component.ts
- إضافة file inputs للـ PosterFile و VideoFile
- إضافة WeekId selector
- إعادة تنظيم الخطوات لتشمل file uploads
- تحديث validation logic

### الخطوة 3: تحديث teacher-content-management.service.ts
- التأكد من أن methods تستخدم FormData بشكل صحيح
- إرسال query parameters بشكل صحيح
- معالجة الأخطاء المناسبة

---

## ملاحظات مهمة ⚠️

1. **Query Parameters**: يجب إرسالها عبر URL، لا في Request Body
2. **FormData**: يجب استخدام FormData لـ multipart/form-data uploads
3. **File Validation**: تحقق من نوع وحجم الملف
4. **Optional Fields**: يمكن تجاوزها إن لم تملأ

---

## التوافق الكامل ✅

بعد التطبيق سيكون لديك:
- ✅ HTML forms متطابقة تماماً مع Swagger endpoints
- ✅ جميع الحقول المطلوبة موجودة
- ✅ جميع الحقول الاختيارية متاحة
- ✅ file uploads صحيحة
- ✅ query parameters صحيحة
