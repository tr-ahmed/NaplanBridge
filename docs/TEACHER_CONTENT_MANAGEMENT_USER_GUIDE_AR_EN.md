# 🏫 نظام إدارة محتوى المعلم - دليل التطبيق الكامل
# Teacher Content Management System - Complete Implementation Guide

## 📊 نظرة عامة | System Overview

تم بناء **نظام شامل لإدارة محتوى المعلم** يسمح للمعلمين بـ:

✅ **إنشاء المحتوى** - دروس، امتحانات، موارد، أسئلة، شهادات
✅ **تحرير المحتوى** - تعديل المحتوى قبل الموافقة
✅ **إدارة المحتوى** - عرض وحذف المحتوى
✅ **تتبع الموافقات** - رؤية حالة المحتوى والتغييرات
✅ **تقديم المحتوى** - إرسال المحتوى لمراجعة الإدمن
✅ **الرد على الملاحظات** - إعادة تقديم بعد الملاحظات

---

## 🗂️ البنية الهندسية | Architecture

### المجلد الرئيسي
```
src/app/features/teacher/
├── services/
│   └── teacher-content-management.service.ts
├── content-management/
│   ├── teacher-content-management.component.ts (المكون الرئيسي)
│   ├── teacher-content-management.component.html
│   ├── teacher-content-management.component.scss
│   ├── teacher-dashboard/
│   │   └── teacher-dashboard.component.ts
│   ├── my-content-list/
│   │   └── my-content-list.component.ts
│   ├── content-creation-wizard/
│   │   └── content-creation-wizard.component.ts
│   └── approval-history/
│       └── approval-history.component.ts
```

---

## 🔧 الخدمة الرئيسية | Main Service

### `TeacherContentManagementService`

**الطرق الأساسية:**

```typescript
// الحصول على المواد المصرح بها
getMySubjects(): Observable<TeacherSubject[]>

// التحقق من الصلاحيات
canManageSubject(subjectId: number): Observable<SubjectPermissions>

// الحصول على محتوى المعلم
getMyContent(filters?: ContentFilterDto): Observable<ContentItem[]>

// إنشاء محتوى جديد
createContent(contentData: any): Observable<ContentItem>

// تحديث المحتوى
updateContent(itemType: string, itemId: number, contentData: any): Observable<ContentItem>

// حذف المحتوى
deleteContent(itemType: string, itemId: number): Observable<void>

// الحصول على سجل الموافقات
getApprovalHistory(itemType: string, itemId: number): Observable<ApprovalHistoryDto[]>

// معاينة المحتوى
getContentPreview(itemType: string, itemId: number): Observable<ContentPreviewDto>

// إحصائيات لوحة التحكم
getDashboardStats(): Observable<any>
```

---

## 📱 مكونات الواجهة | UI Components

### 1️⃣ المكون الرئيسي - Teacher Content Management
يدير حالة التطبيق والملاحة بين التابات المختلفة

**التابات:**
- 📊 Dashboard
- 📚 My Content
- ➕ Create Content
- 📋 Approval History

**الحالة:**
- `authorizedSubjects` - المواد المصرح بها
- `selectedSubject` - المادة المختارة
- `allContent` - كل محتوى المعلم
- `stats` - الإحصائيات

### 2️⃣ لوحة التحكم - Teacher Dashboard
عرض الإحصائيات والملخص العام

**المميزات:**
- 5 بطاقات إحصائيات (إجمالي، موافق عليه، معلق، تعديلات، مرفوض)
- عرض المواد المصرح بها
- نسبة الموافقة
- معلومات الإرشادات

### 3️⃣ قائمة المحتوى الخاص بي - My Content List
عرض وتصفية جميع محتوى المعلم

**المميزات:**
- تصفية متقدمة (الحالة، النوع، البحث)
- أزرار العمل المرتبطة بالسياق
- عرض ملاحظات الإدمن
- بيانات وصفية (التاريخ، النوع، المعرف)

### 4️⃣ معالج الإنشاء - Content Creation Wizard
نموذج خطوة بخطوة لإنشاء محتوى جديد

**الخطوات:**
1. اختيار نوع المحتوى
2. البيانات الأساسية (العنوان، الوصف)
3. التفاصيل الإضافية
4. المراجعة قبل الإرسال

### 5️⃣ سجل الموافقات - Approval History
عرض تاريخ جميع الإجراءات على المحتوى

**المميزات:**
- عرض زمني للإجراءات
- عرض الانتقالات بين الحالات
- الملاحظات والتفاصيل
- معلومات الحالة الحالية

---

## 🔐 نظام الصلاحيات | Permissions System

### صلاحيات المادة

```typescript
interface SubjectPermissions {
  canCreate: boolean;  // إنشاء محتوى جديد
  canEdit: boolean;    // تحرير المحتوى
  canDelete: boolean;  // حذف المحتوى
}
```

### حالات المحتوى

| الحالة | الوصف | يمكن التحرير | يمكن الحذف | الرمز |
|-------|-------|-----------|-----------|------|
| CREATED | مسودة محلية | ✅ | ✅ | ✏️ |
| SUBMITTED | تم الإرسال للمراجعة | ❌ | ❌ | 📤 |
| PENDING | قيد الانتظار | ❌ | ❌ | ⏳ |
| APPROVED | موافق عليه | ❌ | ❌ | ✅ |
| PUBLISHED | مُنشّر | ❌ | ❌ | 🔴 |
| REJECTED | مرفوض | ✅ | ✅ | ❌ |
| REVISION_REQUESTED | طلب تعديل | ✅ | ✅ | 🔄 |

### القواعد
- 🚫 **لا يمكن تحرير** المحتوى الموافق عليه أو المنشور
- 🚫 **لا يمكن حذف** المحتوى قيد الانتظار (يمكن فقط تحريره وإعادة إرساله)
- ✅ **يمكن تحرير وحذف** المحتوى المرفوض والمعلق للمراجعة

---

## 🎯 سير العمل | Workflow

### إنشاء وتقديم محتوى جديد

```
1. المعلم ينقر على "إنشاء محتوى"
2. يختار نوع المحتوى (درس، امتحان، إلخ)
3. يملأ البيانات الأساسية (العنوان، الوصف)
4. يملأ التفاصيل الإضافية
5. يراجع ويُنشئ المحتوى
6. الحالة: CREATED (مسودة محلية)
7. المعلم ينقر على "تقديم"
8. الحالة: PENDING (قيد الانتظار)
9. الإدمن يراجع المحتوى
   ✅ إذا موافق: الحالة APPROVED → PUBLISHED
   ❌ إذا مرفوض: الحالة REJECTED
   🔄 إذا يحتاج تعديل: الحالة REVISION_REQUESTED
10. المعلم يرى الملاحظات ويعدّل
11. يعيد الإرسال
12. العملية تتكرر
```

---

## 🎨 الألوان والرموز | Colors and Icons

### الحالات
| الحالة | الرمز | اللون | الخلفية |
|-------|------|-------|---------|
| CREATED | ✏️ | Gray | Gray-100 |
| SUBMITTED | 📤 | Blue | Blue-100 |
| PENDING | ⏳ | Yellow | Yellow-100 |
| APPROVED | ✅ | Green | Green-100 |
| PUBLISHED | 🔴 | Green | Green-100 |
| REJECTED | ❌ | Red | Red-100 |
| REVISION | 🔄 | Purple | Purple-100 |

### أنواع المحتوى
| النوع | الرمز |
|------|------|
| Lesson | 📚 |
| Exam | 📝 |
| Question | ❓ |
| Resource | 📎 |
| Certificate | 🏆 |

---

## 📊 الإحصائيات | Statistics

### تابع الإحصائيات
```typescript
stats = signal({
  totalContent: number;      // إجمالي المحتوى
  approved: number;          // الموافق عليه
  pending: number;           // المعلق
  rejected: number;          // المرفوض
  revisionRequested: number; // المطلوب تعديله
  totalSubjects: number;     // إجمالي المواد
});
```

### لوحة الإحصائيات
- **نسبة الموافقة** - (الموافق ÷ الإجمالي) × 100
- **وقت المراجعة المتوسط** - من النظام الخلفي
- **الطلبات هذا الشهر** - عدد الطلبات الجديدة

---

## 🔍 التصفية والبحث | Filtering and Search

### مرشحات المحتوى
```typescript
interface ContentFilterDto {
  status?: string;          // الحالة (PENDING, APPROVED, إلخ)
  itemType?: string;        // النوع (Lesson, Exam, إلخ)
  dateFrom?: Date;          // من التاريخ
  dateTo?: Date;            // إلى التاريخ
  searchTerm?: string;      // البحث في العنوان والوصف
  pageNumber?: number;      // رقم الصفحة
  pageSize?: number;        // عدد العناصر بالصفحة
  subjectId?: number;       // معرف المادة
}
```

### أنواع التصفية
1. **حسب الحالة** - PENDING, APPROVED, REJECTED, إلخ
2. **حسب النوع** - Lesson, Exam, Resource, Question
3. **البحث** - في العنوان والوصف
4. **حسب المادة** - اختيار مادة محددة

---

## 🔌 نقاط الاتصال | API Integration Points

### نقاط نهاية مقترحة للنظام الخلفي

```
الصلاحيات والمواد:
GET    /api/TeacherContent/my-subjects
GET    /api/TeacherContent/can-manage/{subjectId}

إدارة المحتوى:
GET    /api/TeacherContent/my-content
POST   /api/TeacherContent/create
PUT    /api/TeacherContent/update/{type}/{id}
DELETE /api/{type}s/{id}
POST   /api/TeacherContent/submit/{type}/{id}

سجل الموافقات:
GET    /api/TeacherContent/history/{type}/{id}
GET    /api/TeacherContent/preview/{type}/{id}
GET    /api/TeacherContent/stats
GET    /api/TeacherContent/notifications

اختصارات:
POST   /api/Lessons
PUT    /api/Lessons/{id}
DELETE /api/Lessons/{id}
```

---

## 📝 نموذج المحتوى | Content Model

```typescript
interface ContentItem {
  id: number;                              // معرف المحتوى
  itemId: number;                          // معرف العنصر الفعلي
  itemType: 'Lesson' | 'Exam' | '...';    // نوع المحتوى
  title: string;                           // العنوان
  description?: string;                    // الوصف
  status: ContentStatus;                   // الحالة
  createdBy?: string;                      // أنشأه
  createdAt: Date;                         // تاريخ الإنشاء
  updatedAt?: Date;                        // آخر تحديث
  approvedBy?: string;                     // وافق عليه
  approvedAt?: Date;                       // تاريخ الموافقة
  rejectionReason?: string;                // سبب الرفض
  revisionFeedback?: string;               // ملاحظات التعديل
  subjectId?: number;                      // معرف المادة
  weekId?: number;                         // معرف الأسبوع
  termId?: number;                         // معرف الفصل
  videoUrl?: string;                       // رابط الفيديو
  duration?: number;                       // المدة بالدقائق
}
```

---

## 🎓 مثال عملي | Practical Example

### إنشاء درس جديد

```typescript
// 1. المعلم يملأ النموذج
const contentData = {
  itemType: 'Lesson',
  title: 'مقدمة إلى الجبر',
  description: 'شرح العمليات الأساسية للجبر',
  subjectId: 5,
  duration: 45,
  videoUrl: 'https://youtube.com/...'
};

// 2. إرسال البيانات
this.contentService.createContent(contentData).subscribe({
  next: (content) => {
    console.log('تم الإنشاء بنجاح');
    // الحالة: CREATED
  },
  error: (error) => {
    console.error('خطأ:', error);
  }
});

// 3. المعلم ينقر على "تقديم"
this.contentService.submitContent('Lesson', contentData.id).subscribe({
  next: () => {
    console.log('تم التقديم للمراجعة');
    // الحالة: PENDING
  }
});

// 4. المعلم يمكنه رؤية السجل
this.contentService.getApprovalHistory('Lesson', contentData.id).subscribe({
  next: (history) => {
    console.log('السجل:', history);
  }
});
```

---

## ⚙️ إعدادات التكوين | Configuration

### استيراد الخدمة
```typescript
import { TeacherContentManagementService } from './teacher/services/teacher-content-management.service';

// في Component
constructor(private contentService: TeacherContentManagementService) {}
```

### استيراد المكونات
```typescript
import { TeacherDashboardComponent } from './teacher-dashboard/teacher-dashboard.component';
import { MyContentListComponent } from './my-content-list/my-content-list.component';
import { ContentCreationWizardComponent } from './content-creation-wizard/content-creation-wizard.component';
import { ApprovalHistoryComponent } from './approval-history/approval-history.component';

@Component({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TeacherDashboardComponent,
    MyContentListComponent,
    ContentCreationWizardComponent,
    ApprovalHistoryComponent
  ]
})
```

---

## 🧪 الاختبار | Testing

### اختبارات الوحدة المقترحة
- ✅ اختبار دوال الفلترة
- ✅ اختبار التحقق من الصلاحيات
- ✅ اختبار حساب الإحصائيات
- ✅ اختبار التحقق من النماذج

### اختبارات التكامل المقترحة
- ✅ اختبار استدعاءات API
- ✅ اختبار سير عمل الموافقة
- ✅ اختبار إدارة الحالة
- ✅ اختبار معالجة الأخطاء

### اختبارات E2E المقترحة
- ✅ سير عمل إنشاء المحتوى الكامل
- ✅ الملاحة بين التابات
- ✅ وظائف التصفية
- ✅ عرض السجل

---

## 🐛 معالجة الأخطاء | Error Handling

### أنواع الأخطاء
- `400 Bad Request` - بيانات خاطئة
- `401 Unauthorized` - جلسة منتهية
- `403 Forbidden` - لا توجد صلاحيات
- `404 Not Found` - المحتوى غير موجود
- `500 Internal Server Error` - خطأ في الخادم

### الاستجابة
```typescript
.subscribe({
  next: (data) => {
    this.toastService.showSuccess('تم بنجاح');
  },
  error: (error) => {
    if (error.status === 403) {
      this.toastService.showError('ليس لديك صلاحية');
    } else if (error.status === 404) {
      this.toastService.showError('المحتوى غير موجود');
    } else {
      this.toastService.showError('حدث خطأ ما');
    }
  }
});
```

---

## 🚀 النشر والدعم | Deployment & Support

### المتطلبات
- Angular 17+
- TypeScript 5+
- Tailwind CSS
- RxJS
- Standalone Components

### المتغيرات البيئية
```typescript
// environment.ts
export const environment = {
  apiBaseUrl: 'https://api.example.com',
  production: false
};
```

### الدعم الفني
للأسئلة والمشاكل، يرجى التواصل مع:
- 👤 فريق التطوير الأمامي
- 📧 البريد الإلكتروني
- 🐛 نظام تتبع الأخطاء

---

## 📚 المراجع الإضافية

- [دليل إدارة المحتوى للإدمن](./ADMIN_CONTENT_MANAGEMENT.md)
- [مواصفات API الكاملة](./API_DOCUMENTATION.md)
- [نموذج قاعدة البيانات](./DATABASE_SCHEMA.md)

---

**الإصدار:** 1.0  
**الحالة:** ✅ جاهز للاستخدام  
**آخر تحديث:** 17 نوفمبر 2025

