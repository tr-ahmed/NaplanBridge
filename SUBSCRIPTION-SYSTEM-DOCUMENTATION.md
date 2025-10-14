# نظام الاشتراكات التعليمية
# Educational Subscription System Documentation

## نظرة عامة | Overview

تم إنشاء نظام اشتراكات تعليمي شامل يوفر للطلاب خيارات متنوعة للاشتراك في المحتوى التعليمي حسب الفصول الدراسية أو السنة كاملة.

A comprehensive educational subscription system has been created that provides students with various options to subscribe to educational content by academic terms or the full academic year.

## 🌟 الميزات الرئيسية | Key Features

### ✅ أنواع الباقات المختلفة | Different Plan Types
- **Terms 1 & 2**: الفصل الأول والثاني (النصف الأول من السنة)
- **Terms 3 & 4**: الفصل الثالث والرابع (النصف الثاني من السنة)  
- **Full Academic Year**: السنة الدراسية كاملة (أفضل قيمة)
- **Monthly Subscription**: اشتراك شهري مرن

### ✅ طرق الدفع المتعددة | Multiple Payment Methods
- **Credit/Debit Cards**: بطاقات ائتمان وخصم
- **Bank Transfer**: تحويل بنكي
- **PayPal**: باي بال
- **Apple Pay**: أبل باي
- **Google Pay**: جوجل باي

### ✅ نظام الخصومات | Discount System
- أكواد خصم قابلة للتطبيق
- خصومات للعملاء الجدد
- خصومات تلقائية للباقات السنوية
- تحقق من صلاحية الكوبونات

### ✅ واجهة مستخدم متقدمة | Advanced UI
- تصميم responsive متجاوب
- عرض مقارنة الباقات
- مؤشرات التقدم في عملية الشراء
- رسائل تأكيد وأخطاء واضحة

## 📁 هيكل الملفات | File Structure

```
src/app/
├── models/
│   └── subscription.models.ts          # نماذج البيانات
├── core/services/
│   └── subscription.service.ts         # خدمة الاشتراكات
├── features/
│   ├── subscription-plans/             # صفحة عرض الباقات
│   │   ├── subscription-plans.component.ts
│   │   ├── subscription-plans.component.html
│   │   └── subscription-plans.component.scss
│   └── subscription-checkout/          # صفحة إتمام الشراء
│       ├── subscription-checkout.component.ts
│       ├── subscription-checkout.component.html
│       └── subscription-checkout.component.scss
└── app.routes.ts                       # إعدادات التنقل
```

## 🔧 النماذج والواجهات | Models & Interfaces

### SubscriptionPlan
```typescript
interface SubscriptionPlan {
  id: number;
  name: string;
  nameAr: string;
  price: number;
  originalPrice: number;
  type: SubscriptionType;
  termIds: number[];
  subjectIds: number[];
  features: string[];
  // ... المزيد من الخصائص
}
```

### StudentSubscription
```typescript
interface StudentSubscription {
  id: number;
  studentId: number;
  planId: number;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  // ... المزيد من الخصائص
}
```

## 🚀 طريقة الاستخدام | Usage

### 1. عرض الباقات | Viewing Plans
```typescript
// الانتقال لصفحة الباقات
this.router.navigate(['/subscription/plans']);

// عرض باقات فصول معينة
this.router.navigate(['/subscription/plans'], {
  queryParams: { filter: 'terms_1_2' }
});
```

### 2. اختيار باقة | Selecting a Plan
```typescript
// الانتقال لصفحة الدفع
selectPlan(plan: SubscriptionPlan) {
  this.router.navigate(['/subscription/checkout', plan.id]);
}
```

### 3. إتمام الشراء | Completing Purchase
```typescript
// إرسال طلب الشراء
const purchase: SubscriptionPurchase = {
  planId: selectedPlan.id,
  studentId: selectedStudent.id,
  paymentMethod: 'credit_card',
  // ... المزيد من البيانات
};

this.subscriptionService.createSubscription(purchase);
```

## 📊 بيانات وهمية للتطوير | Mock Data for Development

يتضمن النظام بيانات وهمية غنية للتطوير والاختبار:
- 4 باقات اشتراك مختلفة
- أكواد خصم متنوعة
- بيانات تقدم الطلاب
- إحصائيات شاملة

## 🎯 الباقات المتوفرة | Available Plans

### 1. باقة الفصل الأول والثاني | Terms 1 & 2 Package
- **السعر**: $299 (بدلاً من $399)
- **المدة**: 6 أشهر
- **التغطية**: الفصل الأول والثاني
- **المواد**: جميع المواد الدراسية

### 2. باقة الفصل الثالث والرابع | Terms 3 & 4 Package  
- **السعر**: $299 (بدلاً من $399)
- **المدة**: 6 أشهر
- **التغطية**: الفصل الثالث والرابع
- **المواد**: جميع المواد الدراسية

### 3. باقة السنة كاملة | Full Academic Year (⭐ الأكثر شعبية)
- **السعر**: $499 (بدلاً من $798)
- **التوفير**: 37% خصم
- **المدة**: 12 شهر
- **التغطية**: السنة الدراسية كاملة
- **المواد**: جميع المواد + ميزات إضافية

### 4. الاشتراك الشهري | Monthly Subscription
- **السعر**: $59/شهر (بدلاً من $79)
- **المرونة**: إلغاء في أي وقت
- **التغطية**: وصول كامل للمحتوى
- **الفوترة**: شهرية

## 🔐 الأمان والحماية | Security & Protection

- تشفير معلومات الدفع
- التحقق من صحة البيانات
- حماية من XSS و CSRF
- رسائل خطأ آمنة
- تخزين آمن للمعلومات

## 📱 التجاوب والتوافق | Responsiveness & Compatibility

- تصميم متجاوب لجميع الشاشات
- دعم الأجهزة المحمولة
- متوافق مع جميع المتصفحات الحديثة
- سرعة تحميل محسنة

## 🔗 ربط النظام | System Integration

### ربط مع الهيدر | Header Integration
تم إضافة dropdown للاشتراكات في الهيدر يتضمن:
- رابط لجميع الباقات
- روابط مباشرة للفصول المختلفة
- أيقونات مميزة لكل خيار

### ربط مع صفحة الكورسات | Courses Page Integration
تم إضافة زر "Subscribe Now" مميز في صفحة الكورسات للتوجيه المباشر لصفحة الاشتراكات.

## 🛣️ الطرق والتنقل | Routes & Navigation

```typescript
// الطرق الجديدة المضافة
{
  path: 'subscription/plans',
  component: SubscriptionPlansComponent
},
{
  path: 'subscription/checkout/:planId',
  component: SubscriptionCheckoutComponent,
  canActivate: [authGuard]
}
```

## 🎨 التصميم والستايل | Design & Styling

### الألوان المستخدمة | Color Scheme
- **الأزرق**: `#3B82F6` (العناصر التفاعلية)
- **الأخضر**: `#10B981` (الخصومات والنجاح)
- **الأحمر**: `#EF4444` (التحذيرات والأخطاء)
- **البنفسجي**: `#8B5CF6` (الباقة المميزة)

### الانتقالات والحركات | Animations & Transitions
- انتقالات سلسة للأزرار
- تأثيرات hover مميزة
- loading spinners
- انتقالات الصفحات

## 📊 الإحصائيات والتقارير | Analytics & Reports

يوفر النظام إحصائيات شاملة تشمل:
- إجمالي الاشتراكات النشطة
- إجمالي الإيرادات
- معدل النمو الشهري
- معدل التحويل
- الباقة الأكثر شعبية

## 🧪 الاختبار والتطوير | Testing & Development

### البيانات الوهمية | Mock Data
- 4 خطط اشتراك مختلفة
- بيانات طلاب وأولياء أمور
- أكواد خصم متنوعة
- سجلات مدفوعات وهمية

### طرق الاختبار | Testing Methods
```typescript
// تفعيل الوضع الوهمي
this.subscriptionService.setUseMock(true);

// اختبار عملية شراء
const testPurchase = {
  planId: 1,
  studentId: 1,
  paymentMethod: 'credit_card'
};
```

## 🚀 الخطوات التالية | Next Steps

### تحسينات مقترحة | Suggested Improvements
1. **إضافة نظام تقييم** للباقات
2. **تطوير dashboard** لإدارة الاشتراكات
3. **إضافة إشعارات** انتهاء الاشتراك
4. **تطوير تطبيق موبايل** مخصص
5. **إضافة نظام إحالة** للأصدقاء

### ميزات متقدمة | Advanced Features
1. **A/B Testing** للباقات المختلفة
2. **AI Recommendations** للباقات المناسبة
3. **Integration** مع أنظمة دفع إضافية
4. **Advanced Analytics** وتقارير مفصلة
5. **Multi-language Support** كامل

## 📞 الدعم والمساعدة | Support & Help

للحصول على المساعدة أو الإبلاغ عن مشاكل:
- ✉️ البريد الإلكتروني: support@naplanbridge.com
- 📞 الهاتف: +1-800-NAPLAN
- 💬 الدردشة المباشرة: متوفرة في الموقع
- 📚 الوثائق: `/docs/subscription-help`

---

## 📝 ملاحظات التطوير | Development Notes

### الاعتمادات المطلوبة | Required Dependencies
```json
{
  "@angular/forms": "^17.0.0",
  "@angular/router": "^17.0.0",
  "rxjs": "^7.8.0"
}
```

### متغيرات البيئة | Environment Variables
```typescript
export const environment = {
  apiBaseUrl: 'https://api.naplanbridge.com',
  useMock: false, // تغيير إلى true للتطوير
  paymentGateway: 'stripe'
};
```

هذا النظام جاهز للإنتاج ويوفر تجربة مستخدم ممتازة للاشتراك في الخدمات التعليمية! 🎓✨
