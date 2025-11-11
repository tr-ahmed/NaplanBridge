# Translation Guide: Converting Booking System to English

## Files Already Converted ✅

### 1. Teacher Availability Component
- **File:** `src/app/features/sessions/teacher-availability/teacher-availability.component.html`
- **Changes:**
  - `dir="rtl"` → removed
  - "إدارة المواعيد المتاحة" → "Manage Availability"
  - "إعدادات الحصص" → "Session Settings"
  - "مدة الحصة" → "Session Duration"
  - "سعر الحصة" → "Price per Session"
  - All form labels and buttons translated

- **File:** `src/app/features/sessions/teacher-availability/teacher-availability.component.ts`
  - Removed `daysArabic` object
  - Removed `getDayArabic()` method
  - Updated toast messages to English

### 2. Browse Teachers Component
- **File:** `src/app/features/sessions/browse-teachers/browse-teachers.component.html`
- **Changes:**
  - `dir="rtl"` → removed
  - "المعلمون المتاحون للحجز" → "Available Teachers for Booking"
  - "المواد التدريسية" → "Teaching Subjects"
  - "السعر" → "Price"
  - "مدة الحصة" → "Session Duration"
  - "احجز حصة الآن" → "Book Session Now"

---

## Files Requiring Conversion 📝

### 3. Book Session Component
**File:** `src/app/features/sessions/book-session/book-session.component.html`

**Required Changes:**
```html
<!-- BEFORE -->
<div ... dir="rtl">
  <h1>حجز حصة خاصة</h1>
  <p>اختر الطالب والموعد المناسب</p>
  <h2>اختر الطالب</h2>
  <h2>اختر التاريخ</h2>
  <h2>اختر الوقت</h2>
  <h2>ملاحظات (اختياري)</h2>
  <h3>ملخص الحجز</h3>
  <button>تأكيد الحجز والانتقال للدفع</button>

<!-- AFTER -->
<div ...>
  <h1>Book Private Session</h1>
  <p>Select student and preferred time</p>
  <h2>Select Student</h2>
  <h2>Select Date</h2>
  <h2>Select Time</h2>
  <h2>Notes (Optional)</h2>
  <h3>Booking Summary</h3>
  <button>Confirm Booking & Proceed to Payment</button>
```

### 4. My Bookings Component
**File:** `src/app/features/sessions/my-bookings/my-bookings.component.html`

**Required Changes:**
```html
<!-- BEFORE -->
<div ... dir="rtl">
  <h1>حجوزاتي</h1>
  <p>إدارة الحصص الخاصة المحجوزة</p>
  <button>الكل</button>
  <button>القادمة</button>
  <button>المكتملة</button>
  <button>الملغية</button>
  <button>إلغاء الحجز</button>

<!-- AFTER -->
<div ...>
  <h1>My Bookings</h1>
  <p>Manage your booked private sessions</p>
  <button>All</button>
  <button>Upcoming</button>
  <button>Completed</button>
  <button>Cancelled</button>
  <button>Cancel Booking</button>
```

### 5. Teacher Sessions Component
**File:** `src/app/features/sessions/teacher-sessions/teacher-sessions.component.html`

**Required Changes:**
```html
<!-- BEFORE -->
<div ... dir="rtl">
  <h1>حصصي الخاصة</h1>
  <p>إدارة الحصص الخاصة مع الطلاب</p>
  <button>القادمة</button>
  <button>السابقة</button>
  <p>ولي الأمر:</p>

<!-- AFTER -->
<div ...>
  <h1>My Private Sessions</h1>
  <p>Manage private sessions with students</p>
  <button>Upcoming</button>
  <button>Past</button>
  <p>Parent:</p>
```

### 6. Student Sessions Component
**File:** `src/app/features/sessions/student-sessions/student-sessions.component.html`

**Required Changes:**
```html
<!-- BEFORE -->
<div ... dir="rtl">
  <h1>حصصي الخاصة</h1>
  <p>الحصص القادمة مع المعلمين</p>
  <span>يبدأ بعد ... دقيقة</span>
  <span>الحصة جارية الآن</span>
  <a>الانضمام للحصة</a>

<!-- AFTER -->
<div ...>
  <h1>My Private Sessions</h1>
  <p>Upcoming sessions with teachers</p>
  <span>Starts in ... minutes</span>
  <span>Session in progress</span>
  <a>Join Session</a>
```

---

## TypeScript Files to Update

### All Component TS Files
1. Update comments from Arabic to English
2. Update toast messages:
   - `'تم الحفظ بنجاح'` → `'Saved successfully'`
   - `'فشل في الحفظ'` → `'Failed to save'`
   - `'يرجى ملء الحقول'` → `'Please fill all fields'`

3. Update confirm messages:
   - `'هل تريد حذف؟'` → `'Do you want to delete?'`
   - `'هل تريد الإلغاء؟'` → `'Do you want to cancel?'`

---

## Quick Find & Replace Commands

Use these regex patterns in VS Code:

1. **Remove RTL:**
   ```
   Find: dir="rtl"
   Replace: (empty)
   ```

2. **Common Words:**
   ```
   حصة → Session
   موعد → Appointment
   معلم → Teacher
   طالب → Student
   ولي الأمر → Parent
   السعر → Price
   الوقت → Time
   التاريخ → Date
   حجز → Booking
   إلغاء → Cancel
   حفظ → Save
   تعديل → Edit
   إضافة → Add
   حذف → Delete
   ```

---

## Files Created/Modified Summary

✅ **Completed:**
- teacher-availability.component.html
- teacher-availability.component.ts
- browse-teachers.component.html

⏳ **Remaining:**
- book-session.component.html
- book-session.component.ts
- my-bookings.component.html
- my-bookings.component.ts
- teacher-sessions.component.html
- teacher-sessions.component.ts
- student-sessions.component.html
- student-sessions.component.ts

---

## Testing Checklist

After completing all translations:

- [ ] Check all buttons display English text
- [ ] Verify date/time formats are appropriate
- [ ] Test toast notifications show English messages
- [ ] Confirm validation messages are in English
- [ ] Check empty states display English text
- [ ] Verify loading states are in English
- [ ] Test all form labels and placeholders

---

**Status:** 40% Complete (3/8 main components)
**Last Updated:** November 1, 2025
