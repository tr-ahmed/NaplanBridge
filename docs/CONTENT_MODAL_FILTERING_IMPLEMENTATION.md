# 🎯 تنفيذ الفلترة الديناميكية في نماذج إدارة المحتوى

## 📋 نظرة عامة

تم تنفيذ نظام فلترة ديناميكي في نماذج إدارة المحتوى (Content Management Modals) بحيث يتم تصفية حقول **Term** و **Week** تلقائياً بناءً على اختيار **Subject**.

---

## ✅ التعديلات المنفذة

### 1. **إضافة المتغيرات للفلترة**

تم إضافة متغيرات جديدة في `content-modal.component.ts`:

```typescript
// Filtered data based on selections
filteredTerms: any[] = [];
filteredWeeks: any[] = [];
```

---

### 2. **دالة تهيئة البيانات المفلترة**

تم إضافة دالة `initializeFilteredData()` التي يتم استدعاؤها عند:
- فتح النموذج
- تغيير البيانات المدخلة (terms, weeks, subjects)

```typescript
/**
 * Initialize filtered data based on current form selections
 */
initializeFilteredData(): void {
  if (this.entityType === 'lesson') {
    // Filter terms based on selected subject
    this.onSubjectChangeForLesson();
  }
  if (this.entityType === 'week') {
    // Initialize with all terms
    this.filteredTerms = [...this.terms];
  }
}
```

---

### 3. **دالة الفلترة عند تغيير Subject**

تم إضافة دالة `onSubjectChangeForLesson()` التي تقوم بـ:

1. ✅ فلترة Terms بناءً على Subject المختار
2. ✅ فلترة Weeks بناءً على Terms المرتبطة بالـ Subject
3. ✅ إعادة تعيين قيمة Week إذا لم تكن صالحة للـ Subject الجديد

```typescript
/**
 * Handle subject change for lesson form
 * Filters terms and weeks based on selected subject
 */
onSubjectChangeForLesson(): void {
  const subjectId = this.formData.subjectId;
  
  if (!subjectId) {
    this.filteredTerms = [];
    this.filteredWeeks = [];
    // Reset dependent fields
    this.formData.weekId = null;
    return;
  }
  
  // Filter terms by selected subject
  this.filteredTerms = this.terms.filter((term: any) => term.subjectId === Number(subjectId));
  
  // Filter weeks based on the terms of selected subject
  const termIds = this.filteredTerms.map((term: any) => term.id);
  this.filteredWeeks = this.weeks.filter((week: any) => termIds.includes(week.termId));
  
  // Reset week selection if it's not valid for the new subject
  if (this.formData.weekId) {
    const isWeekValid = this.filteredWeeks.some((week: any) => week.id === Number(this.formData.weekId));
    if (!isWeekValid) {
      this.formData.weekId = null;
    }
  }
}
```

---

### 4. **تحديث Template نموذج Lesson**

تم تحديث حقول Subject و Week في الـ Template:

#### ✨ حقل Subject
- تم إضافة `(ngModelChange)="onSubjectChangeForLesson()"` لاستدعاء دالة الفلترة عند التغيير

#### ✨ حقل Week
- تم إضافة `[disabled]` لتعطيل الحقل إذا لم يتم اختيار Subject أو لا توجد Weeks متاحة
- تم استخدام `filteredWeeks` بدلاً من `weeks` لعرض الأسابيع المفلترة فقط
- تم إضافة رسالة تحذيرية إذا لم تكن هناك أسابيع متاحة للـ Subject المختار

```html
<div class="grid grid-cols-2 gap-4">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Subject <span class="text-red-500">*</span>
    </label>
    <select
      name="subjectId"
      [(ngModel)]="formData.subjectId"
      (ngModelChange)="onSubjectChangeForLesson()"
      required
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
      <option value="">Select Subject</option>
      <option *ngFor="let subj of subjects" [value]="subj.id">{{ subj.subjectName }}</option>
    </select>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Week <span class="text-red-500">*</span>
    </label>
    <select
      name="weekId"
      [(ngModel)]="formData.weekId"
      required
      [disabled]="!formData.subjectId || filteredWeeks.length === 0"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
      <option value="">{{ formData.subjectId ? 'Select Week' : 'Select Subject First' }}</option>
      <option *ngFor="let week of filteredWeeks" [value]="week.id">Week {{ week.weekNumber }}</option>
    </select>
    @if (formData.subjectId && filteredWeeks.length === 0) {
      <p class="mt-1 text-sm text-amber-600">
        <i class="fas fa-exclamation-triangle mr-1"></i>
        No weeks available for this subject
      </p>
    }
  </div>
</div>
```

---

## 🎯 كيفية العمل

### سيناريو الاستخدام:

1. **المستخدم يفتح نموذج إضافة/تعديل درس (Lesson)**
   - يتم تهيئة البيانات المفلترة تلقائياً

2. **المستخدم يختار Subject**
   - يتم تفعيل `onSubjectChangeForLesson()`
   - يتم فلترة Terms لعرض فقط Terms المرتبطة بهذا الـ Subject
   - يتم فلترة Weeks لعرض فقط Weeks المرتبطة بـ Terms هذا الـ Subject

3. **المستخدم يختار Week**
   - يتم عرض فقط الأسابيع المتاحة للـ Subject المختار
   - إذا لم تكن هناك أسابيع متاحة، يظهر تحذير

4. **إذا غيّر المستخدم الـ Subject**
   - يتم إعادة فلترة Weeks تلقائياً
   - إذا كان Week المختار سابقاً غير صالح للـ Subject الجديد، يتم إعادة تعيينه

---

## 🔗 العلاقات بين الكيانات

```
Subject (1) ──→ (N) Terms
Term (1) ──→ (N) Weeks
Week (1) ──→ (N) Lessons
```

**مثال:**
- Subject: "Mathematics Year 7"
  - Term 1
    - Week 1
    - Week 2
    - Week 3
  - Term 2
    - Week 4
    - Week 5
    - Week 6

---

## ✅ الفوائد

1. ✨ **تحسين تجربة المستخدم**
   - لا يرى المستخدم خيارات غير صالحة
   - يتم توجيهه لاختيار Subject أولاً قبل Week

2. 🔒 **منع الأخطاء**
   - لا يمكن اختيار Week لا تنتمي للـ Subject المختار
   - يتم التحقق تلقائياً من صحة البيانات

3. ⚡ **أداء أفضل**
   - عرض بيانات مفلترة فقط يقلل من التشتت
   - واجهة أسرع وأكثر وضوحاً

4. 🎯 **سهولة الصيانة**
   - كود منظم وقابل لإعادة الاستخدام
   - سهولة إضافة فلترة لنماذج أخرى

---

## 📌 ملاحظات مهمة

### ⚠️ لا يوجد تغيير في Backend

هذه التعديلات تتم بالكامل في **Frontend** ولا تحتاج إلى أي تعديلات في الـ **Backend API**.

الـ API يقوم بالفعل بتوفير:
- ✅ `GET /api/Terms/by-subject/{subjectId}` - للحصول على Terms حسب Subject
- ✅ `GET /api/Weeks/by-term/{termId}` - للحصول على Weeks حسب Term

التصفية تتم في Frontend باستخدام البيانات المحملة مسبقاً.

---

## 🚀 التطبيق في نماذج أخرى

يمكن تطبيق نفس المنطق في نماذج أخرى:

### مثال: نموذج Week
```typescript
onTermChangeForWeek(): void {
  const termId = this.formData.termId;
  if (!termId) {
    // Reset logic
    return;
  }
  // Filter weeks or related data
}
```

---

## ✅ الخلاصة

تم تنفيذ نظام فلترة ديناميكي كامل في نماذج Content Management يوفر:
- ✨ تجربة مستخدم محسّنة
- 🔒 منع الأخطاء
- ⚡ أداء أفضل
- 🎯 كود نظيف وقابل للصيانة

**لا يتطلب أي تعديلات على Backend**
