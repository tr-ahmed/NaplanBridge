# إصلاح عرض حالة Pending Payment في صفحة جلسات المعلم

**التاريخ:** 2 ديسمبر 2025  
**الأولوية:** متوسطة  
**المكون:** Private Sessions - Teacher Dashboard  

---

## المشكلة

في صفحة `/sessions/teacher` عند المعلم:

1. ✅ **تم الإصلاح**: كانت حالة `Pending Payment` تظهر كـ "Unknown"
2. ✅ **تم الإصلاح**: لا يوجد عرض للوقت المتبقي للدفع

---

## الحل المُطبّق

### 1. إصلاح عرض حالة Pending Payment

**الملف:** `teacher-sessions.component.ts`

#### التعديلات في دالة `getReadableStatus`:

```typescript
getReadableStatus(status: any): string {
  const statusStr = status?.toString();

  const statusMap: { [key: string]: string } = {
    '0': 'Pending',
    '1': 'Confirmed',
    '2': 'Completed',
    '3': 'Cancelled',
    'Pending': 'Pending',
    'Confirmed': 'Confirmed',
    'Completed': 'Completed',
    'Cancelled': 'Cancelled',
    'Unknown': 'Pending Payment',     // ✅ إضافة
    'null': 'Pending Payment',        // ✅ إضافة
    'undefined': 'Pending Payment'    // ✅ إضافة
  };

  return statusMap[statusStr] || 'Pending Payment'; // ✅ تغيير من 'Unknown'
}
```

#### التعديلات في دالة `getStatusClass`:

```typescript
getStatusClass(status: any): string {
  const readableStatus = this.getReadableStatus(status);

  const classes: { [key: string]: string } = {
    'Confirmed': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200',
    'Completed': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200',
    'Cancelled': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200',
    'Pending': 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200',
    'Pending Payment': 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200' // ✅ إضافة
  };
  return classes[readableStatus] || 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200';
}
```

#### التعديلات في دالة `getStatusText`:

```typescript
getStatusText(status: any): string {
  const readableStatus = this.getReadableStatus(status);

  const texts: { [key: string]: string } = {
    'Confirmed': '✅ Confirmed',
    'Completed': '✔️ Completed',
    'Cancelled': '❌ Cancelled',
    'Pending': '⏳ Pending',
    'Pending Payment': '💳 Pending Payment' // ✅ إضافة
  };
  return texts[readableStatus] || '💳 ' + readableStatus;
}
```

---

### 2. إضافة نظام عرض الوقت المتبقي للدفع

**الملف:** `teacher-sessions.component.ts`

#### دالة حساب الوقت المتبقي للدفع:

```typescript
/**
 * Get remaining time for payment (24 hours from creation)
 */
getPaymentTimeRemaining(createdAt: string): string {
  const now = new Date();
  const createdTime = new Date(createdAt);
  const expiryTime = new Date(createdTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
  const diff = expiryTime.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}
```

#### دالة التحقق من انتهاء وقت الدفع:

```typescript
/**
 * Check if payment has expired (more than 24 hours since creation)
 */
isPaymentExpired(createdAt: string): boolean {
  const now = new Date();
  const createdTime = new Date(createdAt);
  const expiryTime = new Date(createdTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
  return now.getTime() > expiryTime.getTime();
}
```

---

### 3. تحديثات واجهة المستخدم (HTML)

**الملف:** `teacher-sessions.component.html`

#### عرض عداد الوقت المتبقي في رأس الجلسة:

```html
<div class="flex flex-col items-end gap-2">
  <span
    class="px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
    [class]="getStatusClass(session.status)">
    {{ getStatusText(session.status) }}
  </span>
  <!-- Payment Timer for Pending Payment -->
  <div *ngIf="getReadableStatus(session.status) === 'Pending Payment'" 
       class="text-xs font-medium"
       [class.text-red-600]="isPaymentExpired(session.createdAt)"
       [class.text-orange-600]="!isPaymentExpired(session.createdAt)">
    <div class="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border"
         [class.border-red-200]="isPaymentExpired(session.createdAt)"
         [class.border-orange-200]="!isPaymentExpired(session.createdAt)">
      <i class="fas fa-clock"></i>
      <span>{{ getPaymentTimeRemaining(session.createdAt) }}</span>
    </div>
  </div>
</div>
```

#### إضافة رسالة تنبيه للمعلم:

```html
<!-- Pending Payment Notice for Teacher -->
<div *ngIf="getReadableStatus(session.status) === 'Pending Payment'"
     class="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-300 rounded-lg p-4">
  <div class="flex items-start gap-3">
    <div class="flex-shrink-0">
      <i class="fas fa-exclamation-triangle text-orange-600 text-xl"></i>
    </div>
    <div class="flex-1">
      <p class="text-xs font-semibold text-orange-700 uppercase mb-1">Awaiting Payment</p>
      <p class="text-sm text-gray-700">
        This session is awaiting payment from the parent. 
        <span *ngIf="!isPaymentExpired(session.createdAt)">
          The parent has <strong>{{ getPaymentTimeRemaining(session.createdAt) }}</strong> to complete payment.
        </span>
        <span *ngIf="isPaymentExpired(session.createdAt)" class="text-red-600 font-semibold">
          Payment time has expired. This booking may be cancelled automatically.
        </span>
      </p>
    </div>
  </div>
</div>
```

#### تحديث الشريط العلوي الملون:

```html
<div class="h-1.5" [ngClass]="{
  'bg-gradient-to-r from-cyan-500 to-sky-500': getReadableStatus(session.status) === 'Confirmed',
  'bg-gradient-to-r from-blue-500 to-cyan-500': getReadableStatus(session.status) === 'Completed',
  'bg-gradient-to-r from-yellow-400 to-amber-400': getReadableStatus(session.status) === 'Pending',
  'bg-gradient-to-r from-orange-500 to-red-500': getReadableStatus(session.status) === 'Pending Payment',
  'bg-gradient-to-r from-red-500 to-rose-500': getReadableStatus(session.status) === 'Cancelled'
}"></div>
```

---

## النتيجة النهائية

### قبل الإصلاح ❌

- حالة الدفع المعلقة تظهر كـ "Unknown" 🤷
- لا يوجد معلومات عن الوقت المتبقي للدفع
- المعلم لا يعرف متى ستنتهي صلاحية الحجز

### بعد الإصلاح ✅

1. **عرض صحيح للحالة:**
   - حالة "Pending Payment" تظهر بوضوح بأيقونة 💳
   - لون برتقالي-أحمر مميز لتنبيه المعلم
   - نص واضح: "💳 Pending Payment"

2. **عداد الوقت المتبقي:**
   - عرض الوقت المتبقي في شكل: `23h 45m remaining`
   - تغيير اللون من برتقالي إلى أحمر عند انتهاء الصلاحية
   - عرض "Expired" عند انتهاء فترة الـ 24 ساعة

3. **رسالة تنبيه للمعلم:**
   - رسالة واضحة توضح أن الحجز في انتظار الدفع
   - عرض الوقت المتبقي في الرسالة
   - تنبيه بالأحمر عند انتهاء الصلاحية

---

## الملفات المعدّلة

### Frontend Files ✅

1. **`teacher-sessions.component.ts`**
   - ✅ تحديث `getReadableStatus()` لمعالجة Unknown/null/undefined
   - ✅ تحديث `getStatusClass()` لإضافة لون Pending Payment
   - ✅ تحديث `getStatusText()` لإضافة نص Pending Payment
   - ✅ إضافة `getPaymentTimeRemaining()` لحساب الوقت المتبقي
   - ✅ إضافة `isPaymentExpired()` للتحقق من انتهاء الصلاحية

2. **`teacher-sessions.component.html`**
   - ✅ إضافة عداد الوقت في رأس كل session
   - ✅ إضافة رسالة تنبيه للمعلم
   - ✅ تحديث الشريط الملون العلوي

---

## ملاحظات مهمة

### فترة الدفع
- ⏰ **24 ساعة** من وقت إنشاء الحجز (`createdAt`)
- ⚠️ بعد 24 ساعة، تظهر رسالة "Expired"
- 🔴 اللون يتحول للأحمر عند انتهاء الصلاحية

### حالات الـ Status المختلفة

| القيمة في DB | العرض للمعلم | اللون | الأيقونة |
|-------------|--------------|-------|----------|
| `0` | Pending | أصفر-برتقالي | ⏳ |
| `1` | Confirmed | أخضر | ✅ |
| `2` | Completed | أزرق | ✔️ |
| `3` | Cancelled | أحمر | ❌ |
| `Unknown/null/undefined` | Pending Payment | برتقالي-أحمر | 💳 |

### التوافق مع صفحة ولي الأمر

هذا الإصلاح يتوافق مع صفحة `my-bookings.component` لولي الأمر:
- نفس منطق معالجة `Pending Payment`
- نفس نظام الألوان والأيقونات
- نفس حساب الوقت المتبقي (24 ساعة)

---

## ما يحتاج للعمل عليه في الـ Backend

⚠️ **ملاحظة:** Backend يحتاج لإصلاح لضمان:

1. **تعيين Status افتراضية:**
   ```csharp
   Status = SessionStatus.Pending  // عند إنشاء Session جديدة
   ```

2. **إضافة endpoint للإلغاء:**
   ```csharp
   POST /api/Sessions/cancel-payment/{stripeSessionId}
   ```

3. **حذف/إلغاء الحجوزات المنتهية:**
   - Background job لحذف الحجوزات بعد 24 ساعة من Pending Payment
   - أو تحديث Status إلى Cancelled

لمزيد من التفاصيل، راجع: `BACKEND_REPORT_SESSION_PENDING_PAYMENT_STATUS.md`

---

## الاختبار

### خطوات الاختبار:

1. ✅ افتح صفحة `/sessions/teacher` كمعلم
2. ✅ تحقق من وجود جلسات بحالة Pending Payment
3. ✅ تأكد من عرض "💳 Pending Payment" بدلاً من "Unknown"
4. ✅ تحقق من عرض عداد الوقت المتبقي
5. ✅ تحقق من تغير اللون حسب الوقت المتبقي
6. ✅ تحقق من عرض رسالة التنبيه للمعلم

---

## الخلاصة

✅ **تم إصلاح المشكلة بنجاح!**

- حالة Pending Payment تظهر بشكل واضح
- عداد الوقت المتبقي يعمل بشكل صحيح
- المعلم لديه معلومات كافية عن حالة الحجز
- التصميم متسق مع باقي التطبيق

**END OF REPORT**
