# 🎯 دليل سريع: Subject vs Plan في الـ Cart

## المشكلة

عندك **حالتين** لإضافة items للـ Cart:

### ❌ الحالة الخطأ (الموجودة حالياً)
```
Courses Page → Subject → Add to Cart
                  ↓
            subjectId ❌ (API لا يدعم هذا)
```

### ✅ الحالة الصحيحة (المطلوبة)
```
Courses Page → Subject → Select Plan → Add to Cart
                            ↓
                    subscriptionPlanId ✅
```

---

## الفرق في الكود

### ❌ الكود الحالي (خطأ)
```typescript
// courses.service.ts
addToCart(course: Course) {
  return this.http.post('/cart/add', {
    subjectId: course.id,  // ❌ API لا يقبل هذا
    quantity: 1
  });
}
```

### ✅ الكود الصحيح (مطلوب)
```typescript
// courses.service.ts
addToCart(course: Course) {
  // الحصول على plan من الـ subject
  const plan = course.subscriptionPlans[0];
  
  // استخدام CartService الصحيح
  return this.cartService.addToCart({
    subscriptionPlanId: plan.id,  // ✅ هذا صحيح
    studentId: currentUser.studentId,
    quantity: 1
  });
}
```

---

## الـ API الصحيح

```http
POST /api/cart/items

Body:
{
  "subscriptionPlanId": 1,  ← Plan ID (مش Subject ID)
  "studentId": 10,
  "quantity": 1
}
```

---

## الـ Data Flow

```
Subject
  ├─ id: 1
  ├─ name: "Algebra"
  └─ subscriptionPlans: [
      {
        id: 10,           ← هذا اللي هنضيفه للـ Cart
        name: "Algebra - Term 1",
        planType: "SingleTerm",
        price: 29.99
      },
      {
        id: 11,
        name: "Algebra - Full Year",
        planType: "FullYear",
        price: 99.99
      }
    ]
```

عند الضغط على "Add to Cart" → نضيف **Plan ID (10)** مش **Subject ID (1)**

---

## التعديلات المطلوبة

### 1. Subject Model
```typescript
// ✅ تأكد من وجود
interface Subject {
  subscriptionPlans: SubscriptionPlanSummary[];
}
```

### 2. Courses Service
```typescript
// ✅ استخدم CartService
constructor(
  private cartService: CartService  // ← أضف هذا
) {}

addToCart(course: Course) {
  const plan = course.subscriptionPlans[0];
  return this.cartService.addToCart({
    subscriptionPlanId: plan.id,
    studentId: this.authService.getCurrentUser().studentId,
    quantity: 1
  });
}
```

### 3. Cart Service
```typescript
// ✅ هذا موجود بالفعل - مضبوط
addToCart(dto: AddToCartDto) {
  return this.api.post('cart/add', dto);
}
```

---

## الخلاصة في سطر واحد

**Cart API يقبل Subscription Plan ID فقط، مش Subject ID مباشرة.**

لذلك: **Subject → Plan → Cart** ✅
