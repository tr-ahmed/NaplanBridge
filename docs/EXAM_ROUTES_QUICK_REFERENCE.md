# مرجع سريع - مسارات الامتحانات
# Quick Reference - Exam Routes

## مسارات المعلم / Teacher Routes

| المسار / Route | المكون / Component | الوصف / Description |
|---------------|-------------------|-------------------|
| `/teacher/exams` | `TeacherExamsComponent` | قائمة الامتحانات / Exams list |
| `/teacher/exam/create` | `CreateEditExamComponent` | إنشاء امتحان / Create exam |
| `/teacher/exam/edit/:id` | `CreateEditExamComponent` | تعديل امتحان / Edit exam |
| `/teacher/exams/:id/submissions` | `ExamGradingComponent` | إجابات الطلاب / Student submissions |

---

## مسارات المشرف / Admin Routes

| المسار / Route | المكون / Component | الوصف / Description |
|---------------|-------------------|-------------------|
| `/admin/exams` | `ExamManagementComponent` | إدارة الامتحانات / Exam management |
| `/admin/exam/create` | `CreateEditExamComponent` | إنشاء امتحان / Create exam |
| `/admin/exam/edit/:id` | `CreateEditExamComponent` | تعديل امتحان / Edit exam |

---

## مسارات الطالب / Student Routes

| المسار / Route | المكون / Component | الوصف / Description |
|---------------|-------------------|-------------------|
| `/student/exams` | `StudentExamsComponent` | الامتحانات المتاحة / Available exams |
| `/student/exam/:id` | `ExamTakingComponent` | حل الامتحان / Take exam |
| `/student/exam-result/:id` | `ExamResultComponent` | نتيجة الامتحان / Exam result |

---

## أمثلة الاستخدام / Usage Examples

### TypeScript Navigation

```typescript
// إنشاء امتحان جديد / Create new exam
this.router.navigate(['/teacher/exam/create']);

// تعديل امتحان / Edit exam
this.router.navigate(['/teacher/exam/edit', examId]);

// عرض الإجابات / View submissions
this.router.navigate(['/teacher/exams', examId, 'submissions']);
```

### HTML Navigation

```html
<!-- إنشاء امتحان / Create exam -->
<button routerLink="/teacher/exam/create">Create Exam</button>

<!-- تعديل امتحان / Edit exam -->
<button [routerLink]="['/teacher/exam/edit', exam.id]">Edit</button>

<!-- عرض الإجابات / View submissions -->
<button [routerLink]="['/teacher/exams', exam.id, 'submissions']">Submissions</button>
```

---

## الحماية / Protection

جميع المسارات محمية بـ:
All routes are protected by:

- ✅ `authGuard` - تسجيل الدخول / Authentication
- ✅ `hasRole()` - التحقق من الدور / Role verification
- ✅ Laravel Sanctum token

---

## API Endpoints

```
GET    /api/teacher/exams              - List exams
POST   /api/teacher/exams              - Create exam
GET    /api/teacher/exams/{id}         - Get exam
PUT    /api/teacher/exams/{id}         - Update exam
DELETE /api/teacher/exams/{id}         - Delete exam
GET    /api/teacher/exams/{id}/submissions - Get submissions
```

---

**Last Updated**: 17 Nov 2025
