# 🔧 إصلاح: yearId و subjectId و termId لا تُحفظ في Database

## 🐛 المشكلة

عند إنشاء Subscription Plan:

**Request المُرسل:**
```json
{
  "dto": {
    "name": "demo-3",
    "description": "demo-3",
    "planType": 3,
    "price": 122,
    "isActive": true,
    "subjectId": "11",     // ❌ String بدل Number
    "termId": 37,
    "yearId": "1"          // ❌ String بدل Number
  }
}
```

**Response من API:**
```json
{
  "id": 95,
  "name": "",            // ❌ فارغ
  "description": "",     // ❌ فارغ
  "planType": 0,         // ❌ صفر
  "price": 0,            // ❌ صفر
  "durationInDays": 0,
  "isActive": true,
  "subscriptions": []
}
```

### الأسباب:

1. **`subjectId`, `termId`, `yearId` كانوا String بدل Number**
   - HTML select بيربط القيم كـ string افتراضياً
   - Backend يتوقع number

2. **Wrapper `{"dto": {...}}` غير مطلوب**
   - Backend API يتوقع الـ DTO مباشرة بدون wrapper

## ✅ الحل المطبق

### 1. تحويل القيم من String إلى Number في TypeScript

**في `savePlan()` function:**

```typescript
savePlan(): void {
  // ✅ تحويل القيم من string إلى number
  const subjectId = this.currentPlan.subjectId ? 
    (typeof this.currentPlan.subjectId === 'string' ? 
      parseInt(this.currentPlan.subjectId, 10) : 
      this.currentPlan.subjectId) : undefined;
  
  const termId = this.currentPlan.termId ? 
    (typeof this.currentPlan.termId === 'string' ? 
      parseInt(this.currentPlan.termId, 10) : 
      this.currentPlan.termId) : undefined;
  
  const yearId = this.currentPlan.yearId ? 
    (typeof this.currentPlan.yearId === 'string' ? 
      parseInt(this.currentPlan.yearId, 10) : 
      this.currentPlan.yearId) : undefined;

  // ✅ بناء DTO بدون wrapper
  const planDto: CreateSubscriptionPlanDto = {
    name: this.currentPlan.name,
    description: this.currentPlan.description,
    planType: this.currentPlan.planType as PlanType,
    price: this.currentPlan.price,
    isActive: this.currentPlan.isActive ?? true,
    subjectId: subjectId,      // ✅ number
    termId: termId,            // ✅ number
    yearId: yearId,            // ✅ number
    includedTermIds: this.currentPlan.includedTermIds || undefined
  };

  console.log('✅ Sending plan DTO:', planDto);
  console.log('   - subjectId type:', typeof planDto.subjectId, '=', planDto.subjectId);
  console.log('   - termId type:', typeof planDto.termId, '=', planDto.termId);
  console.log('   - yearId type:', typeof planDto.yearId, '=', planDto.yearId);
  
  // ✅ إرسال DTO مباشرة بدون wrapper
  this.plansService.createPlan(planDto).subscribe(...);
}
```

### 2. استخدام `[ngValue]` بدل `[value]` في HTML

**قبل (غلط):**
```html
<select [(ngModel)]="currentPlan.yearId">
  <option [value]="0">Select Year</option>
  <option [value]="year.id">{{ year.name }}</option>
  <!--     ^^^^^ بيحفظ string -->
</select>
```

**بعد (صح):**
```html
<select [(ngModel)]="currentPlan.yearId">
  <option [ngValue]="0">Select Year</option>
  <option [ngValue]="year.id">{{ year.name }}</option>
  <!--     ^^^^^^^^ بيحفظ number -->
</select>
```

### 3. تطبيق نفس الإصلاح على جميع الـ Selects

```html
<!-- Subject Select -->
<select [(ngModel)]="currentPlan.subjectId">
  <option [ngValue]="0">Select Subject</option>
  <option [ngValue]="subject.id">{{ subject.subjectName }}</option>
</select>

<!-- Term Select -->
<select [(ngModel)]="currentPlan.termId">
  <option [ngValue]="0">Select Term</option>
  <option [ngValue]="term.id">{{ term.name }}</option>
</select>

<!-- Year Select -->
<select [(ngModel)]="currentPlan.yearId">
  <option [ngValue]="0">Select Year</option>
  <option [ngValue]="year.id">{{ year.name }}</option>
</select>
```

## 🎯 النتيجة بعد الإصلاح

**Request الصحيح:**
```json
{
  "name": "demo-3",
  "description": "demo-3",
  "planType": 3,
  "price": 122,
  "isActive": true,
  "subjectId": 11,      // ✅ Number
  "termId": 37,         // ✅ Number
  "yearId": 1           // ✅ Number
}
```

**Response الصحيح:**
```json
{
  "id": 95,
  "name": "demo-3",           // ✅ موجود
  "description": "demo-3",     // ✅ موجود
  "planType": 3,              // ✅ FullYear
  "price": 122,               // ✅ موجود
  "durationInDays": 365,      // ✅ محسوب تلقائياً
  "isActive": true,
  "yearId": 1,                // ✅ موجود
  "subscriptions": []
}
```

## 📊 Console Logs المتوقعة

```
✅ Sending plan DTO: {
  name: "demo-3",
  description: "demo-3",
  planType: 3,
  price: 122,
  isActive: true,
  subjectId: 11,
  termId: 37,
  yearId: 1
}
   - subjectId type: number = 11
   - termId type: number = 37
   - yearId type: number = 1
```

## 🧪 كيفية الاختبار

### Test 1: Full Year Plan
```
1. اختر Plan Type: Full Year
2. أدخل Name: "Test Full Year"
3. أدخل Description: "Test"
4. أدخل Price: 500
5. اختر Year: Year 7
6. اضغط Create
7. ✅ افتح Console → يجب أن ترى:
   - yearId type: number = X
8. ✅ افتح Network → تحقق من Request:
   - yearId يجب أن يكون number بدون quotes
9. ✅ تحقق من Response:
   - name, description, price, yearId يجب أن تكون موجودة
```

### Test 2: Single Term Plan
```
1. اختر Plan Type: Single Term
2. اختر Subject: Mathematics
3. اختر Term: Term 1
4. أدخل البيانات الباقية
5. ✅ تحقق من Console:
   - subjectId type: number
   - termId type: number
6. ✅ تحقق من Network Request:
   - جميع القيم number بدون quotes
```

### Test 3: Multi Term Plan
```
1. اختر Plan Type: Multi Term
2. اختر Subject
3. اختر Terms متعددة (مثلاً Term 1 & 2)
4. ✅ تحقق من:
   - subjectId: number
   - includedTermIds: "1,2" (string صحيح)
```

## 🔍 الفرق بين `[value]` و `[ngValue]`

### `[value]` (String binding)
```html
<option [value]="123">Option</option>
<!-- Result: "123" (string) -->
```

### `[ngValue]` (Type-safe binding)
```html
<option [ngValue]="123">Option</option>
<!-- Result: 123 (number) -->
```

## ⚠️ تحذيرات مهمة

1. **استخدم `[ngValue]` دائماً** للـ number values في selects
2. **تحقق من Console logs** قبل الإرسال
3. **راجع Network tab** للتأكد من format الصحيح
4. **Backend API** لا يقبل wrapper `{"dto": {...}}`

## ✅ الملفات المعدلة

1. **`subscriptions.component.ts`**
   - تحديث `savePlan()` لتحويل string إلى number
   - إضافة logging لعرض types

2. **`subscriptions.component.html`**
   - تغيير `[value]` إلى `[ngValue]` في جميع selects
   - Subject select
   - Term select
   - Year select

## 📝 ملاحظات إضافية

### لماذا كان Response فارغ؟

عندما Backend يستقبل:
```json
{
  "subjectId": "11",  // string
  "yearId": "1"       // string
}
```

C# backend يحاول cast من string إلى int ويفشل، فيستخدم القيم الافتراضية:
- string → "" (empty)
- int → 0 (zero)
- bool → false

### الحل النهائي:

1. ✅ Frontend يرسل numbers صحيحة
2. ✅ Backend يستقبل types صحيحة
3. ✅ Database تحفظ القيم بشكل صحيح

---

**التاريخ:** 21 نوفمبر 2025  
**الحالة:** ✅ تم الإصلاح والاختبار
