# 🎓 نظام حجز الحصص الخاصة (Private Sessions Booking System)

تم إنشاء نظام متكامل لحجز الحصص الخاصة بين المعلمين وأولياء الأمور والطلاب.

---

## ✅ ما تم إنجازه

### 1. **Models & Types** ✅
- **ملف:** `src/app/models/session.models.ts`
- **يحتوي على:**
  - `PrivateSession` - بيانات الحصة الخاصة
  - `TeacherSessionSettings` - إعدادات المعلم
  - `TeacherAvailability` - مواعيد المعلم المتاحة
  - `AvailableTeacher` - المعلمون المتاحون للحجز
  - `AvailableSlot` - الأوقات المتاحة للحجز
  - `BookSessionDto` - بيانات حجز حصة جديدة
  - جميع الـ DTOs والـ Enums اللازمة

### 2. **Session Service** ✅
- **ملف:** `src/app/core/services/session.service.ts`
- **يحتوي على:**
  - جميع endpoints الخاصة بالـ API
  - دوال مساعدة لتنسيق التواريخ والأوقات
  - دوال للتحقق من إمكانية الانضمام للحصة
  - 17 method للتعامل مع النظام بالكامل

### 3. **Components المنجزة** ✅

#### للمعلمين (Teachers):
1. **Teacher Availability Management** 
   - **المسار:** `/sessions/availability`
   - **المجلد:** `src/app/features/sessions/teacher-availability/`
   - **الوظيفة:** إدارة المواعيد المتاحة وإعدادات الأسعار

2. **Teacher Sessions Dashboard**
   - **المسار:** `/sessions/teacher`
   - **المجلد:** `src/app/features/sessions/teacher-sessions/`
   - **الوظيفة:** عرض الحصص القادمة والسابقة

#### لأولياء الأمور (Parents):
3. **Browse Available Teachers**
   - **المسار:** `/sessions/browse`
   - **المجلد:** `src/app/features/sessions/browse-teachers/`
   - **الوظيفة:** تصفح المعلمين المتاحين للحجز

4. **Book Session**
   - **المسار:** `/sessions/book/:teacherId`
   - **المجلد:** `src/app/features/sessions/book-session/`
   - **الوظيفة:** حجز حصة خاصة مع اختيار التاريخ والوقت

5. **My Bookings**
   - **المسار:** `/sessions/my-bookings`
   - **المجلد:** `src/app/features/sessions/my-bookings/`
   - **الوظيفة:** عرض وإدارة الحجوزات (إلغاء، عرض)

#### للطلاب (Students):
6. **Student Sessions**
   - **المسار:** `/sessions/student`
   - **المجلد:** `src/app/features/sessions/student-sessions/`
   - **الوظيفة:** عرض الحصص القادمة والانضمام إليها

### 4. **Routes** ✅
تم إضافة جميع الـ routes في `app.routes.ts`:
```typescript
/sessions/browse           // للأولياء - تصفح المعلمين
/sessions/book/:teacherId  // للأولياء - حجز حصة
/sessions/my-bookings      // للأولياء - عرض الحجوزات
/sessions/availability     // للمعلمين - إدارة المواعيد
/sessions/teacher          // للمعلمين - عرض الحصص
/sessions/student          // للطلاب - عرض الحصص
```

### 5. **Dashboard Integration** ✅
تم إضافة روابط سريعة في:
- ✅ **Parent Dashboard** - روابط "Book Session" و "My Bookings"
- ✅ **Teacher Dashboard** - روابط "Manage Availability" و "My Private Sessions"
- ✅ **Student Dashboard** - رابط "My Private Sessions"

---

## 🎯 مميزات النظام

### للمعلمين:
- ⚙️ إعداد سعر الحصة ومدتها
- 📅 إضافة وحذف المواعيد المتاحة (حسب اليوم والوقت)
- ⏰ تحديد وقت الاستراحة بين الحصص
- 🔛 تفعيل/إيقاف قبول الحجوزات
- 📊 عرض الحصص القادمة والسابقة
- 🎥 رابط Google Meet لكل حصة

### لأولياء الأمور:
- 👨‍🏫 تصفح المعلمين المتاحين مع الأسعار
- 🔍 البحث عن معلم أو مادة
- 📅 اختيار التاريخ والوقت المناسب
- 📝 إضافة ملاحظات للمعلم
- 💳 الدفع عبر Stripe
- ❌ إلغاء الحجوزات (قبل الموعد بساعة)
- 📊 عرض جميع الحجوزات مع الفلترة

### للطلاب:
- 📅 عرض الحصص القادمة
- 🎥 الانضمام للحصة عبر Google Meet
- ⏱ تنبيه قبل الموعد بـ 15 دقيقة
- 📝 عرض ملاحظات الحصة

---

## 🔗 التكامل مع الـ Backend

النظام متكامل بالكامل مع الـ API endpoints الموجودة:

### Teacher Endpoints:
- `PUT /api/Sessions/teacher/settings` - تحديث الإعدادات
- `GET /api/Sessions/teacher/settings` - عرض الإعدادات
- `POST /api/Sessions/teacher/availability` - إضافة موعد
- `DELETE /api/Sessions/teacher/availability/{id}` - حذف موعد
- `GET /api/Sessions/teacher/availability` - عرض المواعيد
- `GET /api/Sessions/teacher/upcoming` - الحصص القادمة
- `GET /api/Sessions/teacher/history` - سجل الحصص

### Parent Endpoints:
- `GET /api/Sessions/teachers/available` - المعلمون المتاحون
- `GET /api/Sessions/teachers/{teacherId}/slots` - المواعيد المتاحة
- `POST /api/Sessions/book` - حجز حصة
- `GET /api/Sessions/parent/bookings` - عرض الحجوزات
- `PUT /api/Sessions/{sessionId}/cancel` - إلغاء حجز

### Student Endpoints:
- `GET /api/Sessions/student/upcoming` - الحصص القادمة
- `GET /api/Sessions/{sessionId}/join` - الانضمام للحصة

### Payment:
- `POST /api/Sessions/confirm-payment/{stripeSessionId}` - تأكيد الدفع

---

## 🎨 التصميم

- ✅ Responsive Design (يعمل على جميع الأجهزة)
- ✅ Tailwind CSS للتنسيق
- ✅ RTL Support (عربي)
- ✅ Loading States
- ✅ Error Handling
- ✅ Toast Notifications
- ✅ Signals للـ State Management

---

## 📁 هيكل الملفات

```
src/app/
├── models/
│   └── session.models.ts              # جميع الـ Types والـ DTOs
│
├── core/services/
│   └── session.service.ts             # Service للتعامل مع API
│
└── features/sessions/
    ├── teacher-availability/          # إدارة مواعيد المعلم
    │   ├── teacher-availability.component.ts
    │   ├── teacher-availability.component.html
    │   └── teacher-availability.component.scss
    │
    ├── browse-teachers/               # تصفح المعلمين
    │   ├── browse-teachers.component.ts
    │   ├── browse-teachers.component.html
    │   └── browse-teachers.component.scss
    │
    ├── book-session/                  # حجز حصة
    │   ├── book-session.component.ts
    │   ├── book-session.component.html
    │   └── book-session.component.scss
    │
    ├── my-bookings/                   # حجوزات ولي الأمر
    │   ├── my-bookings.component.ts
    │   ├── my-bookings.component.html
    │   └── my-bookings.component.scss
    │
    ├── teacher-sessions/              # حصص المعلم
    │   ├── teacher-sessions.component.ts
    │   ├── teacher-sessions.component.html
    │   └── teacher-sessions.component.scss
    │
    └── student-sessions/              # حصص الطالب
        ├── student-sessions.component.ts
        ├── student-sessions.component.html
        └── student-sessions.component.scss
```

---

## 🚀 كيفية الاستخدام

### للمعلم:
1. الذهاب إلى `/sessions/availability`
2. تحديد السعر ومدة الحصة
3. إضافة المواعيد المتاحة (يوم + وقت)
4. تفعيل "قبول الحجوزات"
5. متابعة الحجوزات في `/sessions/teacher`

### لولي الأمر:
1. الذهاب إلى `/sessions/browse`
2. اختيار معلم
3. اختيار الطالب، التاريخ، والوقت
4. إضافة ملاحظات (اختياري)
5. الدفع عبر Stripe
6. متابعة الحجوزات في `/sessions/my-bookings`

### للطالب:
1. الذهاب إلى `/sessions/student`
2. عرض الحصص القادمة
3. الانضمام للحصة قبل الموعد بـ 15 دقيقة

---

## 🔒 Auth Guards

جميع المسارات محمية بـ:
- `authGuard` - التحقق من تسجيل الدخول
- `RoleGuard` - التحقق من الصلاحيات
  - Teacher routes → role: 'teacher'
  - Parent routes → role: 'parent'
  - Student routes → role: 'student'

---

## 📝 ملاحظات مهمة

1. **الدفع:** النظام متكامل مع Stripe للدفع
2. **Google Meet:** يتم إنشاء رابط للحصة من الـ Backend
3. **الإلغاء:** يمكن إلغاء الحجز قبل الموعد بساعة على الأقل
4. **الانضمام:** يمكن الانضمام للحصة قبل 15 دقيقة وحتى 60 دقيقة بعد البداية
5. **التنبيهات:** يمكن إضافة نظام تنبيهات (Email/SMS) لاحقًا

---

## 🎉 النظام جاهز للاستخدام!

تم إنشاء نظام حجز متكامل وجاهز للتشغيل مع:
- ✅ 6 Components كاملة
- ✅ Service متكامل مع 17 method
- ✅ جميع Models والـ Types
- ✅ 6 Routes محمية
- ✅ تكامل كامل مع Dashboard
- ✅ تصميم احترافي وresponsive
- ✅ Error handling كامل
- ✅ Loading states
- ✅ RTL support

---

**تاريخ الإنشاء:** November 1, 2025  
**الحالة:** ✅ مكتمل وجاهز للاستخدام
