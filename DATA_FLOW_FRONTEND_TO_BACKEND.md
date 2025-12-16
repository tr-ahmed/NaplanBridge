# 🔄 Data Flow: Frontend → Backend

**Date:** December 16, 2025  
**Topic:** كيف يصل الباك إند للمواد والطلاب اللي الـ Parent اختارهم؟

---

## 📤 Frontend: إرسال البيانات

### **الكود الفعلي (في parent-package-selection.component.ts):**

```typescript
async proceedToCheckout(): Promise<void> {
  // تجميع كل البيانات
  const orderRequest = {
    teachingType: this.teachingType,           // "OneToOne" أو "GroupTutoring"
    studentCount: this.studentCount,           // عدد الطلاب (1-4)
    subjectIds: this.selectedSubjectIds,       // 👈 المواد [1, 3, 5]
    studentIds: this.selectedStudentIds,       // 👈 الطلاب [7, 8, 9]
    yearId: this.selectedYearId,               // السنة الدراسية (مثلاً: 2)
    termId: this.selectedTermId,               // الترم (مثلاً: 4)
    expectedPrice: this.getTotalPrice()        // السعر المتوقع
  };

  // إرسال الطلب للباك إند
  this.packageService.createPackageOrder(orderRequest).subscribe({
    next: (response) => {
      // الباك إند رد بـ:
      // - orderId
      // - stripeCheckoutUrl
      // - totalAmount
      window.location.href = response.stripeCheckoutUrl;
    }
  });
}
```

---

## 🌐 HTTP Request الفعلي

### **ما يُرسل للباك إند:**

```http
POST https://naplan2.runasp.net/api/PackagePricing/create-order
Authorization: Bearer {parent_token}
Content-Type: application/json

{
  "teachingType": "GroupTutoring",
  "studentCount": 3,
  "subjectIds": [1, 3, 5],          // 👈 المواد (Math, English, Arabic)
  "studentIds": [7, 8, 9],          // 👈 الطلاب (Ahmed, Sara, Ali)
  "yearId": 2,                       // Year 8
  "termId": 4,                       // Term 4
  "expectedPrice": 540.00
}
```

---

## 📥 Backend: استقبال ومعالجة البيانات

### **1. Backend يستقبل الـ Request**

```csharp
// API/Controllers/PackagePricingController.cs

[HttpPost("create-order")]
[Authorize(Roles = "Parent")]
public async Task<ActionResult<CreatePackageOrderResponse>> CreateOrder(
    [FromBody] CreatePackageOrderRequest dto)
{
    // 1. الحصول على Parent ID من الـ token
    var parentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    
    // 2. التحقق من أن الطلاب ينتمون للـ Parent
    var parent = await _context.Users
        .Include(u => u.Students)
        .FirstOrDefaultAsync(u => u.Id == parentUserId);
    
    var validStudentIds = parent.Students.Select(s => s.Id).ToList();
    var invalidStudents = dto.StudentIds.Except(validStudentIds).ToList();
    
    if (invalidStudents.Any())
    {
        return BadRequest($"Invalid student IDs: {string.Join(", ", invalidStudents)}");
    }
    
    // 3. حساب السعر والتحقق منه
    var priceRequest = new PriceCalculationRequest
    {
        TeachingType = dto.TeachingType,
        StudentCount = dto.StudentCount,
        SubjectIds = dto.SubjectIds,
        YearId = dto.YearId,
        TermId = dto.TermId
    };
    
    var priceResponse = await GetPackagePriceAsync(priceRequest);
    
    if (Math.Abs(priceResponse.Price - dto.ExpectedPrice) > 0.01m)
    {
        return BadRequest("Price mismatch. Please refresh and try again.");
    }
    
    // 4. إنشاء Order
    var order = new Order
    {
        UserId = parentUserId,
        TotalAmount = priceResponse.Price,
        OrderStatus = OrderStatus.Pending,
        CreatedAt = DateTime.UtcNow
    };
    
    _context.Orders.Add(order);
    await _context.SaveChangesAsync();
    
    // 5. إنشاء OrderItem لكل طالب × كل مادة
    foreach (var studentId in dto.StudentIds)
    {
        foreach (var subjectId in dto.SubjectIds)
        {
            // إنشاء أو الحصول على SubscriptionPlan
            var plan = await GetOrCreateSubscriptionPlan(
                subjectId, 
                dto.YearId, 
                dto.TermId, 
                dto.TeachingType,
                priceResponse.Price / dto.StudentIds.Count / dto.SubjectIds.Count
            );
            
            var orderItem = new OrderItem
            {
                OrderId = order.Id,
                StudentId = studentId,              // 👈 ID الطالب
                SubscriptionPlanId = plan.Id,
                ItemType = "Subscription",
                Description = $"{plan.SubjectName} - {dto.TeachingType}",
                UnitPrice = plan.Price,
                Quantity = 1
            };
            
            _context.OrderItems.Add(orderItem);
        }
    }
    
    await _context.SaveChangesAsync();
    
    // 6. إنشاء Stripe Checkout Session
    var stripeSession = await _stripeService.CreateCheckoutSessionAsync(
        order.Id,
        order.TotalAmount,
        "Package Subscription Payment"
    );
    
    order.StripeSessionId = stripeSession.SessionId;
    await _context.SaveChangesAsync();
    
    // 7. إرجاع الرد للـ Frontend
    return Ok(new CreatePackageOrderResponse
    {
        OrderId = order.Id,
        OrderNumber = $"PKG-{order.Id:D6}",
        TotalAmount = order.TotalAmount,
        StripeSessionId = stripeSession.SessionId,
        StripeCheckoutUrl = stripeSession.Url,
        TeachingType = dto.TeachingType,
        StudentCount = dto.StudentCount,
        SubjectNames = await GetSubjectNames(dto.SubjectIds),
        Students = await GetOrderStudents(dto.StudentIds, dto.SubjectIds)
    });
}
```

---

## 💾 Database: كيف يتم التخزين؟

### **1. Orders Table**
```sql
INSERT INTO Orders (UserId, TotalAmount, OrderStatus, StripeSessionId, CreatedAt)
VALUES (42, 540.00, 'Pending', 'cs_test_a1b2c3...', '2025-01-27 10:30:00');

-- Result: OrderId = 123
```

### **2. OrderItems Table (لكل طالب × لكل مادة)**
```sql
-- Ahmed × Math
INSERT INTO OrderItems (OrderId, StudentId, SubscriptionPlanId, Description, UnitPrice, Quantity)
VALUES (123, 7, 15, 'Math - GroupTutoring', 60.00, 1);

-- Ahmed × English
INSERT INTO OrderItems (OrderId, StudentId, SubscriptionPlanId, Description, UnitPrice, Quantity)
VALUES (123, 7, 16, 'English - GroupTutoring', 60.00, 1);

-- Ahmed × Arabic
INSERT INTO OrderItems (OrderId, StudentId, SubscriptionPlanId, Description, UnitPrice, Quantity)
VALUES (123, 7, 17, 'Arabic - GroupTutoring', 60.00, 1);

-- Sara × Math
INSERT INTO OrderItems (OrderId, StudentId, SubscriptionPlanId, Description, UnitPrice, Quantity)
VALUES (123, 8, 15, 'Math - GroupTutoring', 60.00, 1);

-- Sara × English
INSERT INTO OrderItems (OrderId, StudentId, SubscriptionPlanId, Description, UnitPrice, Quantity)
VALUES (123, 8, 16, 'English - GroupTutoring', 60.00, 1);

-- Sara × Arabic
INSERT INTO OrderItems (OrderId, StudentId, SubscriptionPlanId, Description, UnitPrice, Quantity)
VALUES (123, 8, 17, 'Arabic - GroupTutoring', 60.00, 1);

-- Ali × Math
INSERT INTO OrderItems (OrderId, StudentId, SubscriptionPlanId, Description, UnitPrice, Quantity)
VALUES (123, 9, 15, 'Math - GroupTutoring', 60.00, 1);

-- Ali × English
INSERT INTO OrderItems (OrderId, StudentId, SubscriptionPlanId, Description, UnitPrice, Quantity)
VALUES (123, 9, 16, 'English - GroupTutoring', 60.00, 1);

-- Ali × Arabic
INSERT INTO OrderItems (OrderId, StudentId, SubscriptionPlanId, Description, UnitPrice, Quantity)
VALUES (123, 9, 17, 'Arabic - GroupTutoring', 60.00, 1);
```

**النتيجة:** 9 OrderItems (3 طلاب × 3 مواد)

---

## 💳 After Payment: Subscription Activation

### **عند نجاح الدفع (Stripe Webhook):**

```csharp
// API/Controllers/StripeWebhookController.cs

[HttpPost]
public async Task<IActionResult> HandleWebhook()
{
    var stripeEvent = EventUtility.ConstructEvent(json, ...);
    
    if (stripeEvent.Type == Events.CheckoutSessionCompleted)
    {
        var session = stripeEvent.Data.Object as Session;
        var orderId = int.Parse(session.Metadata["orderId"]);
        
        // 1. Update Order Status
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Student)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.SubscriptionPlan)
            .FirstOrDefaultAsync(o => o.Id == orderId);
        
        order.OrderStatus = OrderStatus.Paid;
        
        // 2. Create Subscriptions for each OrderItem
        foreach (var item in order.OrderItems)
        {
            var subscription = new Subscription
            {
                StudentId = item.StudentId,              // 👈 الطالب
                SubjectId = item.SubscriptionPlan.SubjectId.Value,  // 👈 المادة
                SubscriptionPlanId = item.SubscriptionPlanId.Value,
                OrderId = orderId,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(90),  // 90 يوم
                PaymentStatus = PaymentStatus.Paid,
                IsActive = true
            };
            
            _context.Subscriptions.Add(subscription);
        }
        
        await _context.SaveChangesAsync();
        
        // 3. Send Notifications
        await _notificationService.SendPaymentSuccessNotification(order.UserId, orderId);
    }
    
    return Ok();
}
```

### **Subscriptions Table (بعد الدفع):**
```sql
-- Ahmed - Math
INSERT INTO Subscriptions (StudentId, SubjectId, SubscriptionPlanId, OrderId, StartDate, EndDate, IsActive)
VALUES (7, 1, 15, 123, '2025-01-27', '2025-04-27', 1);

-- Ahmed - English
INSERT INTO Subscriptions (StudentId, SubjectId, SubscriptionPlanId, OrderId, StartDate, EndDate, IsActive)
VALUES (7, 3, 16, 123, '2025-01-27', '2025-04-27', 1);

-- Ahmed - Arabic
INSERT INTO Subscriptions (StudentId, SubjectId, SubscriptionPlanId, OrderId, StartDate, EndDate, IsActive)
VALUES (7, 5, 17, 123, '2025-01-27', '2025-04-27', 1);

-- (وهكذا لباقي الطلاب...)
```

---

## 🔍 كيف يتحقق الباك إند من صحة البيانات؟

### **1. التحقق من ملكية الطلاب**
```csharp
// الباك إند يجيب الـ Parent من الـ token
var parentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

// يجيب طلابه
var parent = await _context.Users
    .Include(u => u.Students)
    .FirstOrDefaultAsync(u => u.Id == parentUserId);

var validStudentIds = parent.Students.Select(s => s.Id).ToList();

// يتحقق أن كل الـ studentIds المبعوتة تنتمي للـ Parent
var invalidStudents = dto.StudentIds.Except(validStudentIds).ToList();

if (invalidStudents.Any())
{
    return BadRequest("Invalid student IDs");
}
```

### **2. التحقق من صحة المواد**
```csharp
// يجيب المواد من الـ database
var subjects = await _context.Subjects
    .Where(s => dto.SubjectIds.Contains(s.Id))
    .ToListAsync();

if (subjects.Count != dto.SubjectIds.Count)
{
    return BadRequest("Some subject IDs are invalid");
}
```

### **3. التحقق من السعر**
```csharp
// يحسب السعر من جديد
var calculatedPrice = await CalculatePrice(dto);

// يقارنه بالسعر المبعوت
if (Math.Abs(calculatedPrice - dto.ExpectedPrice) > 0.01m)
{
    return BadRequest("Price mismatch");
}
```

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Angular)                                          │
│                                                             │
│ Parent selects:                                             │
│  - Teaching Type: "GroupTutoring"                          │
│  - Students: [7, 8, 9] (Ahmed, Sara, Ali)                 │
│  - Subjects: [1, 3, 5] (Math, English, Arabic)            │
│  - Year: 2 (Year 8)                                        │
│  - Term: 4 (Term 4)                                        │
│  - Price: 540.00                                           │
│                                                             │
│ Clicks "Proceed to Payment"                                │
└────────────────────┬────────────────────────────────────────┘
                     │ POST /api/PackagePricing/create-order
                     │ {
                     │   "subjectIds": [1, 3, 5],
                     │   "studentIds": [7, 8, 9],
                     │   "yearId": 2,
                     │   "termId": 4,
                     │   ...
                     │ }
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend (Laravel)                                           │
│                                                             │
│ 1. Verify parent owns students [7, 8, 9] ✓                │
│ 2. Verify subjects [1, 3, 5] exist ✓                      │
│ 3. Calculate price: 540.00 ✓                              │
│ 4. Verify price matches: 540.00 = 540.00 ✓                │
│ 5. Create Order (OrderId: 123)                            │
│ 6. Create 9 OrderItems (3 students × 3 subjects)          │
│ 7. Create Stripe Checkout Session                         │
│ 8. Return Stripe URL                                       │
└────────────────────┬────────────────────────────────────────┘
                     │ Response:
                     │ {
                     │   "orderId": 123,
                     │   "stripeCheckoutUrl": "https://..."
                     │ }
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend redirects to Stripe                                │
│ Parent completes payment                                    │
└────────────────────┬────────────────────────────────────────┘
                     │ Stripe Webhook
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend Webhook Handler                                     │
│                                                             │
│ 1. Update Order.OrderStatus = Paid                         │
│ 2. Create 9 Subscriptions:                                 │
│    - Student 7 → Subject 1 (Math) ✓                       │
│    - Student 7 → Subject 3 (English) ✓                    │
│    - Student 7 → Subject 5 (Arabic) ✓                     │
│    - Student 8 → Subject 1 (Math) ✓                       │
│    - Student 8 → Subject 3 (English) ✓                    │
│    - Student 8 → Subject 5 (Arabic) ✓                     │
│    - Student 9 → Subject 1 (Math) ✓                       │
│    - Student 9 → Subject 3 (English) ✓                    │
│    - Student 9 → Subject 5 (Arabic) ✓                     │
│ 3. Send Email/Notifications                                │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ الخلاصة

### **الباك إند يعرف المواد والطلاب من خلال:**

1. **Frontend يبعتهم في الـ Request Body:**
   ```json
   {
     "subjectIds": [1, 3, 5],
     "studentIds": [7, 8, 9]
   }
   ```

2. **Backend يستقبلهم في الـ Controller:**
   ```csharp
   CreateOrder([FromBody] CreatePackageOrderRequest dto)
   ```

3. **Backend يتحقق منهم:**
   - الطلاب ينتمون للـ Parent ✓
   - المواد موجودة في الـ database ✓
   - السعر صحيح ✓

4. **Backend يخزنهم في الـ Database:**
   - Order table
   - OrderItems table (لكل طالب × لكل مادة)

5. **بعد الدفع: Backend ينشئ Subscriptions:**
   - Subscription لكل طالب × لكل مادة
   - StartDate = الآن
   - EndDate = +90 يوم
   - IsActive = true

---

**النتيجة:** كل طالب يحصل على اشتراكات في جميع المواد المختارة تلقائياً! ✅
