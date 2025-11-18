# 📖 دليل الاستخدام - Lessons و Subjects

## 🎓 الاستخدام الصحيح للخدمات

بعد التحديثات، إليك كيفية استخدام الخدمة بشكل صحيح:

---

## 📚 Lessons - الدروس

### 1. إنشاء درس جديد

**الطريقة الصحيحة:**
```typescript
// في المكون (Component)
import { TeacherContentManagementService } from './teacher-content-management.service';

export class CreateLessonComponent {
  onCreateLesson(formData: any) {
    // تجميع البيانات مع الملفات
    const lessonData = {
      title: formData.title,           // مثل: "مقدمة الجبر"
      description: formData.description, // مثل: "شرح المفاهيم الأساسية"
      weekId: formData.weekId,         // مثل: 1
      posterFile: formData.posterFile, // صورة الغلاف (File object)
      videoFile: formData.videoFile    // فيديو الدرس (File object)
    };

    this.contentService.createLesson(lessonData).subscribe({
      next: (lesson) => {
        console.log('✅ تم إنشاء الدرس:', lesson);
        this.showSuccessMessage('تم إنشاء الدرس بنجاح');
      },
      error: (error) => {
        console.error('❌ خطأ:', error);
        this.showErrorMessage(error.message);
      }
    });
  }
}
```

**في الـ HTML (Template):**
```html
<form (ngSubmit)="onCreateLesson(form.value)" #form="ngForm">
  <!-- عنوان الدرس -->
  <input 
    type="text" 
    name="title" 
    placeholder="عنوان الدرس"
    required
    ngModel>

  <!-- وصف الدرس -->
  <textarea 
    name="description" 
    placeholder="وصف الدرس"
    required
    ngModel></textarea>

  <!-- أسبوع الدرس -->
  <select name="weekId" ngModel>
    <option value="">اختر الأسبوع</option>
    <option *ngFor="let week of weeks" [value]="week.id">
      {{ week.name }}
    </option>
  </select>

  <!-- صورة الغلاف -->
  <input 
    type="file" 
    name="posterFile" 
    (change)="onPosterSelected($event)"
    accept="image/*"
    required>

  <!-- فيديو الدرس -->
  <input 
    type="file" 
    name="videoFile" 
    (change)="onVideoSelected($event)"
    accept="video/*"
    required>

  <button type="submit">إنشاء الدرس</button>
</form>
```

**معالجة الملفات:**
```typescript
posterFile: File | null = null;
videoFile: File | null = null;

onPosterSelected(event: any) {
  this.posterFile = event.target.files[0];
}

onVideoSelected(event: any) {
  this.videoFile = event.target.files[0];
}

onCreateLesson(formData: any) {
  const lessonData = {
    ...formData,
    posterFile: this.posterFile,
    videoFile: this.videoFile
  };
  
  this.contentService.createLesson(lessonData).subscribe({...});
}
```

---

### 2. تحديث درس موجود

```typescript
onUpdateLesson(lessonId: number, formData: any) {
  const updateData = {
    title: formData.title,           // اختياري
    description: formData.description, // اختياري
    weekId: formData.weekId,         // اختياري
    posterFile: formData.posterFile, // اختياري (ملف جديد)
    videoFile: formData.videoFile    // اختياري (ملف جديد)
  };

  this.contentService.updateLesson(lessonId, updateData).subscribe({
    next: (lesson) => {
      console.log('✅ تم تحديث الدرس:', lesson);
      this.showSuccessMessage('تم تحديث الدرس بنجاح');
    },
    error: (error) => {
      console.error('❌ خطأ:', error);
      this.showErrorMessage(error.message);
    }
  });
}
```

---

### 3. حذف درس

```typescript
onDeleteLesson(lessonId: number) {
  this.contentService.deleteContent('Lesson', lessonId).subscribe({
    next: () => {
      console.log('✅ تم حذف الدرس');
      this.showSuccessMessage('تم حذف الدرس بنجاح');
    },
    error: (error) => {
      console.error('❌ خطأ:', error);
    }
  });
}
```

---

## 🎯 Subjects - المواد

### 1. إنشاء مادة جديدة

**الطريقة الصحيحة:**
```typescript
onCreateSubject(formData: any) {
  const subjectData = {
    // الحقول المطلوبة
    yearId: formData.yearId,               // مثل: 1 (السنة الدراسية)
    subjectNameId: formData.subjectNameId, // مثل: 5 (اسم المادة)
    
    // الحقول الاختيارية
    originalPrice: formData.originalPrice,           // مثل: 100 (السعر الأصلي)
    discountPercentage: formData.discountPercentage, // مثل: 10 (الخصم)
    level: formData.level,                           // مثل: "Beginner" (المستوى)
    duration: formData.duration,                     // مثل: 30 (الساعات)
    teacherId: formData.teacherId,                   // معرف المدرس
    startDate: formData.startDate,                   // تاريخ البدء
    
    // الملف المطلوب
    posterFile: formData.posterFile  // صورة المادة (File object)
  };

  this.contentService.createSubject(subjectData).subscribe({
    next: (subject) => {
      console.log('✅ تم إنشاء المادة:', subject);
      this.showSuccessMessage('تم إنشاء المادة بنجاح');
    },
    error: (error) => {
      console.error('❌ خطأ:', error);
      this.showErrorMessage(error.message);
    }
  });
}
```

**في الـ HTML:**
```html
<form (ngSubmit)="onCreateSubject(form.value)" #form="ngForm">
  <!-- السنة الدراسية (مطلوب) -->
  <select name="yearId" required ngModel>
    <option value="">اختر السنة</option>
    <option *ngFor="let year of years" [value]="year.id">
      {{ year.name }}
    </option>
  </select>

  <!-- اسم المادة (مطلوب) -->
  <select name="subjectNameId" required ngModel>
    <option value="">اختر المادة</option>
    <option *ngFor="let subject of subjectNames" [value]="subject.id">
      {{ subject.name }}
    </option>
  </select>

  <!-- السعر الأصلي (اختياري) -->
  <input 
    type="number" 
    name="originalPrice" 
    placeholder="السعر الأصلي"
    ngModel>

  <!-- الخصم (اختياري) -->
  <input 
    type="number" 
    name="discountPercentage" 
    placeholder="نسبة الخصم (%)"
    ngModel>

  <!-- المستوى (اختياري) -->
  <input 
    type="text" 
    name="level" 
    placeholder="المستوى (Beginner, Intermediate, Advanced)"
    ngModel>

  <!-- عدد الساعات (اختياري) -->
  <input 
    type="number" 
    name="duration" 
    placeholder="عدد الساعات"
    ngModel>

  <!-- صورة المادة (مطلوب) -->
  <input 
    type="file" 
    name="posterFile" 
    (change)="onPosterSelected($event)"
    accept="image/*"
    required>

  <button type="submit">إنشاء المادة</button>
</form>
```

---

### 2. تحديث مادة

```typescript
onUpdateSubject(subjectId: number, formData: any) {
  const updateData = {
    yearId: formData.yearId,
    subjectNameId: formData.subjectNameId,
    originalPrice: formData.originalPrice,
    discountPercentage: formData.discountPercentage,
    level: formData.level,
    duration: formData.duration,
    posterFile: formData.posterFile // اختياري
  };

  this.contentService.updateSubject(subjectId, updateData).subscribe({
    next: (subject) => {
      console.log('✅ تم تحديث المادة');
      this.showSuccessMessage('تم تحديث المادة بنجاح');
    },
    error: (error) => {
      console.error('❌ خطأ:', error);
    }
  });
}
```

---

## ⚠️ أخطاء شائعة وحلولها

### ❌ خطأ 1: نسيان ملف PosterFile
```typescript
// ❌ خطأ
const subjectData = {
  yearId: 1,
  subjectNameId: 5
  // لا يوجد posterFile!
};

// ✅ صحيح
const subjectData = {
  yearId: 1,
  subjectNameId: 5,
  posterFile: fileObject
};
```

### ❌ خطأ 2: إرسال البيانات كـ JSON بدلاً من FormData
```typescript
// ❌ خطأ (الخدمة تعالج هذا الآن)
this.http.post('/api/Lessons', {
  title: 'درس',
  posterFile: file  // خطأ! لا يعمل مع JSON
})

// ✅ صحيح (الخدمة تفعله)
const formData = new FormData();
formData.append('Title', 'درس');
formData.append('PosterFile', file);
this.http.post('/api/Lessons', formData)
```

### ❌ خطأ 3: عدم التحقق من صحة الملفات
```typescript
// ❌ خطأ
onFileSelected(event: any) {
  const file = event.target.files[0];
  // لا يوجد تحقق!
}

// ✅ صحيح
onFileSelected(event: any) {
  const file = event.target.files[0];
  
  // تحقق من نوع الملف
  if (!file.type.startsWith('image/')) {
    this.showErrorMessage('يجب اختيار صورة');
    return;
  }
  
  // تحقق من حجم الملف
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    this.showErrorMessage('حجم الملف كبير جداً');
    return;
  }
  
  this.posterFile = file;
}
```

---

## 🔍 معالجة الأخطاء

### رسائل الأخطاء المتوقعة

```typescript
// 403 - بدون صلاحيات
"🔒 You do not have permission to create subjects"

// 400 - بيانات خاطئة
"⚠️ Invalid subject data. Please ensure PosterFile is provided."

// 401 - جلسة منتهية
"🔐 Your session has expired. Please log in again."

// 409 - المادة موجودة
"⚠️ A subject with this name already exists."
```

---

## 📋 قائمة تحقق - ما قبل الإرسال

- [ ] جميع الحقول المطلوبة معبأة
- [ ] الملفات تم تحديدها (PosterFile، VideoFile)
- [ ] نوع الملفات صحيح (صور، فيديو)
- [ ] حجم الملفات مقبول
- [ ] لا توجد أخطاء في Console
- [ ] البيانات منطقية (أسعار موجبة، تواريخ صحيحة)

---

## ✅ الخلاصة

✅ جميع الخدمات الآن تستخدم `multipart/form-data`
✅ جميع الملفات تُعالج بشكل صحيح
✅ جميع الحقول تُرسل بالصيغة الصحيحة
✅ معالجة الأخطاء محسّنة وواضحة

**جاهز للاستخدام!** 🚀
