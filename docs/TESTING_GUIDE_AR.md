# 🧪 دليل الاختبار - Subscription Plans CRUD

## 📋 جدول المحتويات
1. [الاختبارات اليدوية](#الاختبارات-اليدوية)
2. [أمثلة الكود](#أمثلة-الكود)
3. [سيناريوهات الاختبار](#سيناريوهات-الاختبار)
4. [حل المشاكل الشائعة](#حل-المشاكل-الشائعة)

---

## 🧪 الاختبارات اليدوية

### 1. اختبار إنشاء Single Term Plan

**الخطوات:**
1. افتح صفحة `/subscriptions`
2. اضغط على "Add New Subscription Plan"
3. أدخل البيانات التالية:
   ```
   Name: Mathematics Year 7 - Term 1
   Description: Complete access to Mathematics Term 1
   Price: 49.99
   Plan Type: Single Term
   Subject: Mathematics
   Term: Term 1
   ```
4. اضغط "Create"

**النتيجة المتوقعة:**
- ✅ رسالة نجاح "Subscription plan created successfully"
- ✅ الخطة تظهر في القائمة
- ✅ Plan Type يظهر "Single Term"
- ✅ السعر $49.99

---

### 2. اختبار إنشاء Multi-Term Plan

**الخطوات:**
1. افتح صفحة `/subscriptions`
2. اضغط "Add New Subscription Plan"
3. أدخل:
   ```
   Name: Mathematics Terms 1 & 2
   Description: Save 20% with this bundle
   Price: 79.99
   Plan Type: Multi Term
   Subject: Mathematics
   ```
4. اختر Terms: ✓ Term 1 ✓ Term 2
5. اضغط "Create"

**النتيجة المتوقعة:**
- ✅ رسالة نجاح
- ✅ الخطة تظهر مع "Multi Term"
- ✅ includedTermIds = "1,2"

---

### 3. اختبار Validation

**سيناريو 1: Single Term بدون Term**
1. اختر Plan Type: Single Term
2. اختر Subject فقط
3. اترك Term فارغ
4. اضغط Create

**النتيجة المتوقعة:**
- ❌ رسالة خطأ: "Term is required for Single Term plans"

**سيناريو 2: Multi Term بدون اختيار Terms**
1. اختر Plan Type: Multi Term
2. اختر Subject
3. لا تختر أي Terms
4. اضغط Create

**النتيجة المتوقعة:**
- ❌ رسالة خطأ: "At least 2 terms must be selected"

**سيناريو 3: سعر = 0**
1. أدخل Price: 0
2. اضغط Create

**النتيجة المتوقعة:**
- ❌ رسالة خطأ: "Price must be greater than 0"

---

### 4. اختبار التحديث

**الخطوات:**
1. اضغط "Edit" على خطة موجودة
2. غيّر السعر من 49.99 إلى 44.99
3. اضغط "Update"

**النتيجة المتوقعة:**
- ✅ رسالة "Plan updated successfully"
- ✅ السعر الجديد يظهر في القائمة

---

### 5. اختبار التعطيل

**الخطوات:**
1. اضغط "Deactivate" على خطة
2. أكّد في الـ popup

**النتيجة المتوقعة:**
- ✅ رسالة "Plan deactivated successfully"
- ✅ الخطة لا تظهر للطلاب (لكن تظهر للـ admin)

---

## 💻 أمثلة الكود

### مثال 1: استخدام Service في Component

```typescript
import { Component, OnInit } from '@angular/core';
import { SubscriptionPlansService } from '@app/core/services/subscription-plans.service';
import { PlanType } from '@app/models/enums';

export class MyComponent implements OnInit {
  constructor(private plansService: SubscriptionPlansService) {}

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.plansService.getAllPlans().subscribe({
      next: (plans) => {
        console.log('Loaded plans:', plans);
      },
      error: (err) => {
        console.error('Error:', err.message);
      }
    });
  }

  createPlan() {
    const dto = {
      name: 'Test Plan',
      description: 'Test',
      planType: PlanType.SingleTerm,
      price: 49.99,
      subjectId: 5,
      termId: 12,
      isActive: true
    };

    this.plansService.createPlan(dto).subscribe({
      next: (plan) => alert('Plan created!'),
      error: (err) => alert(err.message)
    });
  }
}
```

---

### مثال 2: Validation قبل الإرسال

```typescript
import { validateSubscriptionPlan } from '@app/utils/validation.helpers';

createPlan() {
  const dto = { /* ... */ };

  // Validate first
  const validation = validateSubscriptionPlan(dto);
  
  if (!validation.isValid) {
    const errors = validation.errors.map(e => e.message).join('\n');
    alert('Validation failed:\n' + errors);
    return;
  }

  // Proceed with creation
  this.plansService.createPlan(dto).subscribe(/*...*/);
}
```

---

### مثال 3: Dynamic Form بناءً على Plan Type

```typescript
onPlanTypeChange(planType: PlanType) {
  switch (planType) {
    case PlanType.SingleTerm:
      this.showSubjectField = true;
      this.showTermField = true;
      this.showTermsCheckboxes = false;
      this.showYearField = false;
      break;

    case PlanType.MultiTerm:
      this.showSubjectField = true;
      this.showTermField = false;
      this.showTermsCheckboxes = true;
      this.showYearField = false;
      break;

    case PlanType.FullYear:
      this.showSubjectField = false;
      this.showTermField = false;
      this.showTermsCheckboxes = false;
      this.showYearField = true;
      break;

    case PlanType.SubjectAnnual:
      this.showSubjectField = true;
      this.showTermField = false;
      this.showTermsCheckboxes = false;
      this.showYearField = false;
      break;
  }
}
```

---

## 📊 سيناريوهات الاختبار

### سيناريو 1: إنشاء خطط لمادة جديدة

**الهدف:** إضافة جميع أنواع الخطط لمادة English

**الخطوات:**
1. ✅ Create: English Term 1 (Single Term) - $49.99
2. ✅ Create: English Term 2 (Single Term) - $49.99
3. ✅ Create: English Terms 1&2 (Multi Term) - $79.99 (save $19.99)
4. ✅ Create: English Full Year (Subject Annual) - $149.99 (save $49.97)

**التحقق:**
- جميع الخطط تم إنشاؤها بنجاح
- الأسعار صحيحة
- includedTermIds صحيح للـ Multi Term
- Validation يعمل لكل نوع

---

### سيناريو 2: تحديث أسعار الخطط (عرض خاص)

**الهدف:** تطبيق خصم 10% على جميع خطط Mathematics

**الخطوات:**
1. احصل على جميع الخطط
2. فلتر plans حيث subjectId = 5 (Mathematics)
3. لكل خطة:
   - احسب السعر الجديد = السعر القديم × 0.9
   - استدعي updatePlan()

**كود:**
```typescript
applyDiscount() {
  this.plansService.getAllPlans().subscribe(plans => {
    const mathPlans = plans.filter(p => p.subjectId === 5);
    
    mathPlans.forEach(plan => {
      const newPrice = plan.price * 0.9;
      
      this.plansService.updatePlan(plan.id!, {
        ...plan,
        price: newPrice,
        description: plan.description + ' (10% OFF)'
      }).subscribe({
        next: () => console.log('Updated:', plan.name),
        error: (err) => console.error('Failed:', err)
      });
    });
  });
}
```

---

### سيناريو 3: نسخ خطط من Year 7 إلى Year 8

**الهدف:** إنشاء نفس الخطط لسنة دراسية جديدة

**الخطوات:**
1. احصل على خطط Year 7
2. لكل خطة:
   - انسخ البيانات
   - غيّر yearId إلى Year 8
   - غيّر name لتضمين "Year 8"
   - أنشئ الخطة الجديدة

**كود:**
```typescript
duplicatePlansForNewYear(fromYearId: number, toYearId: number) {
  this.plansService.getAllPlans().subscribe(plans => {
    const year7Plans = plans.filter(p => p.yearId === fromYearId);
    
    year7Plans.forEach(plan => {
      const newPlan = {
        ...plan,
        name: plan.name.replace('Year 7', 'Year 8'),
        yearId: toYearId
      };
      
      delete newPlan.id; // Remove ID for new creation
      
      this.plansService.createPlan(newPlan).subscribe({
        next: () => console.log('Duplicated:', newPlan.name),
        error: (err) => console.error('Failed:', err)
      });
    });
  });
}
```

---

## 🔧 حل المشاكل الشائعة

### مشكلة 1: "Plan type is required"

**السبب:** planType غير محدد أو null

**الحل:**
```typescript
// ✅ تأكد من استخدام enum
planType: PlanType.SingleTerm  // = 1

// ❌ لا تستخدم
planType: 'SingleTerm'  // Wrong!
planType: null  // Wrong!
```

---

### مشكلة 2: "termId is required for Single Term plans"

**السبب:** لم يتم اختيار Term في Single Term plan

**الحل:**
```typescript
// للـ Single Term، يجب تحديد كل من:
{
  planType: PlanType.SingleTerm,
  subjectId: 5,   // ✅ Required
  termId: 12      // ✅ Required
}
```

---

### مشكلة 3: "includedTermIds is required for Multi Term plans"

**السبب:** لم يتم اختيار Terms في Multi Term plan

**الحل:**
```typescript
// للـ Multi Term، يجب تحديد:
{
  planType: PlanType.MultiTerm,
  subjectId: 5,              // ✅ Required
  includedTermIds: '12,13'   // ✅ Required (comma-separated)
}

// ملاحظة: يجب أن يكون 2 terms على الأقل
```

---

### مشكلة 4: API يرجع 400 Bad Request

**الأسباب المحتملة:**

1. **حقول مفقودة:**
   ```typescript
   // تحقق من وجود جميع الحقول المطلوبة
   const validation = validateSubscriptionPlan(dto);
   console.log(validation.errors);
   ```

2. **نوع بيانات خاطئ:**
   ```typescript
   // ✅ صحيح
   price: 49.99  // number
   
   // ❌ خطأ
   price: "49.99"  // string
   ```

3. **planType غير صحيح:**
   ```typescript
   // ✅ استخدم enum
   planType: PlanType.SingleTerm  // = 1
   
   // ❌ لا تستخدم string
   planType: "SingleTerm"  // Wrong!
   ```

---

### مشكلة 5: الخطة لا تظهر في القائمة

**الحل:**
```typescript
// تأكد من:
1. isActive = true
2. name ليس فارغ
3. price > 0
4. planType محدد

// استخدم isValidPlan() للتحقق
if (this.plansService.isValidPlan(plan)) {
  // Plan is valid
}
```

---

## 📝 Checklist للاختبار النهائي

قبل نشر التطبيق، تأكد من:

### CRUD Operations
- [ ] ✅ Create Single Term Plan
- [ ] ✅ Create Multi Term Plan  
- [ ] ✅ Create Full Year Plan
- [ ] ✅ Create Subject Annual Plan
- [ ] ✅ Update Plan (change price)
- [ ] ✅ Update Plan (change name)
- [ ] ✅ Deactivate Plan
- [ ] ✅ Get All Plans
- [ ] ✅ Get Plans for Term
- [ ] ✅ Get Plans for Subject

### Validation
- [ ] ✅ Empty name → error
- [ ] ✅ Empty description → error
- [ ] ✅ Price = 0 → error
- [ ] ✅ Single Term without termId → error
- [ ] ✅ Multi Term without includedTermIds → error
- [ ] ✅ Full Year without yearId → error
- [ ] ✅ Subject Annual without subjectId → error

### UI/UX
- [ ] ✅ Plan Type dropdown يعمل
- [ ] ✅ Form fields تتغير حسب Plan Type
- [ ] ✅ Multi Term checkboxes تعمل
- [ ] ✅ Selected terms تظهر بشكل صحيح
- [ ] ✅ Error messages واضحة
- [ ] ✅ Success messages تظهر
- [ ] ✅ Loading states تعمل

### Integration
- [ ] ✅ API calls تعمل
- [ ] ✅ Service layer يعمل
- [ ] ✅ Validation helper يعمل
- [ ] ✅ Enums متسقة
- [ ] ✅ TypeScript types صحيحة

---

**آخر تحديث:** 21 نوفمبر 2025  
**الحالة:** ✅ جاهز للاختبار
