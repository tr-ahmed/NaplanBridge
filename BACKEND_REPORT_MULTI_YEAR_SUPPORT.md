# 🔧 Backend Logic Update Required - Multi-Year Student Support

**Date:** December 16, 2025  
**Priority:** 🔴 **HIGH - Critical Logic Change**  
**Status:** ⚠️ **Requires Backend Implementation**

---

## 🎯 Problem Statement

### **Current Implementation (Wrong):**
- Frontend sends `subjectIds` (e.g., `[1, 3, 5]`)
- Backend assumes all students are in the **same year**
- Creates subscriptions using these fixed subject IDs

### **Issue:**
❌ Students can be in **different year levels**:
- Student 1 (Ahmed): Year 7
- Student 2 (Sara): Year 8  
- Student 3 (Ali): Year 9

❌ Subject IDs are **different per year**:
- Math Year 7: `subjectId = 1`
- Math Year 8: `subjectId = 15`
- Math Year 9: `subjectId = 29`

❌ If parent selects "Math" and has students in different years, the current system would assign **the wrong subject IDs**.

---

## ✅ New Implementation Required

### **Frontend Changes (Already Implemented):**
✅ Frontend now sends `subjectNames` instead of `subjectIds`:
```json
{
  "subjectNames": ["Math", "English", "Arabic"],  // ✅ Names, not IDs
  "studentIds": [7, 8, 9]
}
```

### **Backend Changes Required:**

#### **1. Update DTO (CreatePackageOrderRequest)**

```csharp
public class CreatePackageOrderRequest
{
    public TeachingType TeachingType { get; set; }
    public int StudentCount { get; set; }
    
    // ❌ REMOVE this
    // public List<int> SubjectIds { get; set; }
    
    // ✅ ADD this
    public List<string> SubjectNames { get; set; }  // NEW
    
    public List<int> StudentIds { get; set; }
    
    // ❌ REMOVE this (not needed anymore)
    // public int YearId { get; set; }
    
    public int TermId { get; set; }
    public decimal ExpectedPrice { get; set; }
    public string? PromotionCode { get; set; }
}
```

---

#### **2. Update Controller Logic**

```csharp
[HttpPost("create-order")]
[Authorize(Roles = "Parent")]
public async Task<ActionResult<CreatePackageOrderResponse>> CreateOrder(
    [FromBody] CreatePackageOrderRequest dto)
{
    var parentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    
    // 1. Get parent and their students
    var parent = await _context.Users
        .Include(u => u.Students)
        .FirstOrDefaultAsync(u => u.Id == parentUserId);
    
    if (parent == null)
        return Unauthorized("Parent not found");
    
    // 2. Verify all students belong to this parent
    var validStudentIds = parent.Students.Select(s => s.Id).ToList();
    var invalidStudents = dto.StudentIds.Except(validStudentIds).ToList();
    
    if (invalidStudents.Any())
        return BadRequest($"Invalid student IDs: {string.Join(", ", invalidStudents)}");
    
    // 3. Get students with their year information
    var students = await _context.Students
        .Where(s => dto.StudentIds.Contains(s.Id))
        .ToListAsync();
    
    // 4. ✅ NEW: Resolve subject IDs for each student based on their year
    var orderItemsData = new List<(int StudentId, int SubjectId, string SubjectName, int YearId)>();
    
    foreach (var student in students)
    {
        foreach (var subjectName in dto.SubjectNames)
        {
            // Find the subject for this student's year with matching name
            var subject = await _context.Subjects
                .Include(s => s.SubjectName)
                .FirstOrDefaultAsync(s => 
                    s.YearId == student.Year &&  // ✅ Match student's year
                    s.SubjectName.Name == subjectName);  // ✅ Match subject name
            
            if (subject == null)
            {
                return BadRequest($"Subject '{subjectName}' not found for Year {student.Year}");
            }
            
            orderItemsData.Add((student.Id, subject.Id, subjectName, student.Year));
        }
    }
    
    // 5. Calculate total price (sum of all subject prices for all students)
    decimal totalPrice = 0;
    foreach (var item in orderItemsData)
    {
        var subject = await _context.Subjects.FindAsync(item.SubjectId);
        totalPrice += subject.Price;
    }
    
    // Apply teaching type discount if needed
    if (dto.TeachingType == TeachingType.GroupTutoring)
    {
        totalPrice *= 0.8m; // 20% discount for group
    }
    
    // 6. Verify price matches expected
    if (Math.Abs(totalPrice - dto.ExpectedPrice) > 0.01m)
    {
        return BadRequest(new {
            message = "Price mismatch. Please refresh and try again.",
            calculated = totalPrice,
            expected = dto.ExpectedPrice
        });
    }
    
    // 7. Create Order
    var order = new Order
    {
        UserId = parentUserId,
        TotalAmount = totalPrice,
        OrderStatus = OrderStatus.Pending,
        CreatedAt = DateTime.UtcNow
    };
    
    _context.Orders.Add(order);
    await _context.SaveChangesAsync();
    
    // 8. Create OrderItems (one for each student × subject combination)
    foreach (var item in orderItemsData)
    {
        // Get or create subscription plan
        var plan = await GetOrCreateSubscriptionPlanAsync(
            item.SubjectId,
            item.YearId,
            dto.TermId,
            dto.TeachingType
        );
        
        var orderItem = new OrderItem
        {
            OrderId = order.Id,
            StudentId = item.StudentId,
            SubscriptionPlanId = plan.Id,
            ItemType = "Subscription",
            Description = $"{item.SubjectName} - Year {item.YearId} - {dto.TeachingType}",
            UnitPrice = plan.Price,
            Quantity = 1
        };
        
        _context.OrderItems.Add(orderItem);
    }
    
    await _context.SaveChangesAsync();
    
    // 9. Create Stripe Checkout Session
    var stripeSession = await _stripeService.CreateCheckoutSessionAsync(
        order.Id,
        order.TotalAmount,
        "Package Subscription Payment"
    );
    
    order.StripeSessionId = stripeSession.SessionId;
    await _context.SaveChangesAsync();
    
    // 10. Return response
    return Ok(new CreatePackageOrderResponse
    {
        OrderId = order.Id,
        OrderNumber = $"PKG-{order.Id:D6}",
        TotalAmount = order.TotalAmount,
        StripeSessionId = stripeSession.SessionId,
        StripeCheckoutUrl = stripeSession.Url,
        TeachingType = dto.TeachingType,
        StudentCount = dto.StudentCount,
        SubjectNames = dto.SubjectNames,
        Students = students.Select(s => new OrderStudent
        {
            StudentId = s.Id,
            StudentName = s.UserName,
            SubjectIds = orderItemsData
                .Where(x => x.StudentId == s.Id)
                .Select(x => x.SubjectId)
                .ToList(),
            SubjectNames = dto.SubjectNames
        }).ToList()
    });
}
```

---

#### **3. Update Price Calculation Endpoint**

```csharp
[HttpPost("calculate-price")]
[AllowAnonymous]
public async Task<ActionResult<PriceCalculationResponse>> CalculatePrice(
    [FromBody] PriceCalculationRequest dto)
{
    // ❌ OLD: Used dto.SubjectIds directly
    // ✅ NEW: Calculate average price across all years for the selected subjects
    
    decimal totalPrice = 0;
    var breakdown = new List<SubjectPriceBreakdown>();
    
    foreach (var subjectName in dto.SubjectNames)
    {
        // Get average price for this subject across all years
        var subjectPrices = await _context.Subjects
            .Include(s => s.SubjectName)
            .Where(s => s.SubjectName.Name == subjectName)
            .Select(s => s.Price)
            .ToListAsync();
        
        if (!subjectPrices.Any())
        {
            return BadRequest($"Subject '{subjectName}' not found");
        }
        
        var avgPrice = subjectPrices.Average();
        totalPrice += avgPrice * dto.StudentCount;
        
        breakdown.Add(new SubjectPriceBreakdown
        {
            SubjectName = subjectName,
            Price = avgPrice * dto.StudentCount
        });
    }
    
    // Apply teaching type discount
    if (dto.TeachingType == TeachingType.GroupTutoring)
    {
        totalPrice *= 0.8m; // 20% discount
    }
    
    return Ok(new PriceCalculationResponse
    {
        Price = totalPrice,
        TotalPrice = totalPrice,
        HasDirectPrice = false,
        UsedIndividualPricing = true,
        SubjectNames = dto.SubjectNames,
        PackageName = string.Join(" + ", dto.SubjectNames),
        PriceBreakdown = $"Average price across all year levels: ${totalPrice:F2}",
        Breakdown = breakdown,
        Message = $"{dto.SubjectNames.Count} subject(s) for {dto.StudentCount} student(s)"
    });
}
```

---

#### **4. Update Webhook Logic (Subscription Activation)**

```csharp
public async Task ProcessSuccessfulPaymentAsync(int orderId, string? paymentIntentId)
{
    var order = await _context.Orders
        .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Student)
        .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.SubscriptionPlan)
                .ThenInclude(sp => sp.Subject)
        .FirstOrDefaultAsync(o => o.Id == orderId);
    
    if (order == null) return;
    
    // Update order status
    order.OrderStatus = OrderStatus.Paid;
    order.StripePaymentIntentId = paymentIntentId;
    
    // Create payment record
    var payment = new Payment
    {
        OrderId = orderId,
        Amount = order.TotalAmount,
        PaymentMethod = "Stripe",
        PaymentDate = DateTime.UtcNow,
        TransactionId = paymentIntentId,
        PaymentStatus = "Succeeded"
    };
    _context.Payments.Add(payment);
    
    // ✅ Create subscriptions - each OrderItem already has correct SubjectId for student's year
    foreach (var item in order.OrderItems)
    {
        var subscription = new Subscription
        {
            StudentId = item.StudentId,
            SubjectId = item.SubscriptionPlan.SubjectId.Value,  // ✅ Already correct for student's year!
            SubscriptionPlanId = item.SubscriptionPlanId.Value,
            OrderId = orderId,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(item.SubscriptionPlan.DurationInDays),
            PaymentStatus = PaymentStatus.Paid,
            IsActive = true
        };
        
        _context.Subscriptions.Add(subscription);
    }
    
    await _context.SaveChangesAsync();
    
    // Send notifications
    await _notificationService.SendPaymentSuccessNotificationAsync(order.UserId, orderId);
}
```

---

## 📊 Example Flow

### **Frontend Request:**
```json
POST /api/PackagePricing/create-order
{
  "teachingType": "GroupTutoring",
  "studentCount": 3,
  "subjectNames": ["Math", "English"],  // ✅ Names only
  "studentIds": [7, 8, 9],
  "termId": 4,
  "expectedPrice": 360.00
}
```

### **Backend Processing:**

#### **1. Get Students with Years:**
```sql
SELECT Id, UserName, Year FROM Students WHERE Id IN (7, 8, 9)

Results:
- Student 7 (Ahmed): Year 7
- Student 8 (Sara): Year 8
- Student 9 (Ali): Year 9
```

#### **2. Resolve Subject IDs:**
```sql
-- For Ahmed (Year 7)
SELECT Id FROM Subjects 
WHERE YearId = 7 AND SubjectName.Name = 'Math'  → SubjectId = 1

SELECT Id FROM Subjects 
WHERE YearId = 7 AND SubjectName.Name = 'English'  → SubjectId = 2

-- For Sara (Year 8)
SELECT Id FROM Subjects 
WHERE YearId = 8 AND SubjectName.Name = 'Math'  → SubjectId = 15

SELECT Id FROM Subjects 
WHERE YearId = 8 AND SubjectName.Name = 'English'  → SubjectId = 16

-- For Ali (Year 9)
SELECT Id FROM Subjects 
WHERE YearId = 9 AND SubjectName.Name = 'Math'  → SubjectId = 29

SELECT Id FROM Subjects 
WHERE YearId = 9 AND SubjectName.Name = 'English'  → SubjectId = 30
```

#### **3. Create OrderItems:**
```sql
INSERT INTO OrderItems (OrderId, StudentId, SubjectId, Description)
VALUES 
  (123, 7, 1, 'Math - Year 7'),      -- Ahmed × Math Year 7
  (123, 7, 2, 'English - Year 7'),   -- Ahmed × English Year 7
  (123, 8, 15, 'Math - Year 8'),     -- Sara × Math Year 8
  (123, 8, 16, 'English - Year 8'),  -- Sara × English Year 8
  (123, 9, 29, 'Math - Year 9'),     -- Ali × Math Year 9
  (123, 9, 30, 'English - Year 9');  -- Ali × English Year 9
```

#### **4. After Payment - Create Subscriptions:**
```sql
INSERT INTO Subscriptions (StudentId, SubjectId, StartDate, EndDate, IsActive)
VALUES 
  (7, 1, '2025-01-27', '2025-04-27', 1),   -- Ahmed can access Math Year 7 ✅
  (7, 2, '2025-01-27', '2025-04-27', 1),   -- Ahmed can access English Year 7 ✅
  (8, 15, '2025-01-27', '2025-04-27', 1),  -- Sara can access Math Year 8 ✅
  (8, 16, '2025-01-27', '2025-04-27', 1),  -- Sara can access English Year 8 ✅
  (9, 29, '2025-01-27', '2025-04-27', 1),  -- Ali can access Math Year 9 ✅
  (9, 30, '2025-01-27', '2025-04-27', 1);  -- Ali can access English Year 9 ✅
```

---

## 🔍 Database Schema Verification

### **Required Tables:**

#### **Subjects Table:**
```sql
CREATE TABLE Subjects (
    Id INT PRIMARY KEY,
    YearId INT NOT NULL,           -- ✅ Required
    SubjectNameId INT NOT NULL,    -- ✅ Required (FK to SubjectNames)
    Price DECIMAL(18,2),
    -- ... other fields
    FOREIGN KEY (YearId) REFERENCES Years(Id),
    FOREIGN KEY (SubjectNameId) REFERENCES SubjectNames(Id)
);
```

#### **SubjectNames Table:**
```sql
CREATE TABLE SubjectNames (
    Id INT PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,   -- ✅ "Math", "English", "Arabic", etc.
    CategoryId INT,
    -- ... other fields
);
```

#### **Students Table:**
```sql
CREATE TABLE Students (
    Id INT PRIMARY KEY,
    UserName NVARCHAR(100),
    Email NVARCHAR(100),
    Year INT NOT NULL,             -- ✅ Required (7, 8, 9, 10, 11, 12)
    ParentUserId INT,
    -- ... other fields
);
```

---

## ✅ Validation & Error Handling

### **Backend Must Validate:**

1. **Subject Name Exists:**
   ```csharp
   if (subject == null)
   {
       return BadRequest($"Subject '{subjectName}' not found for Year {student.Year}");
   }
   ```

2. **All Students Have Year Info:**
   ```csharp
   if (student.Year == null || student.Year == 0)
   {
       return BadRequest($"Student {student.UserName} does not have a year assigned");
   }
   ```

3. **Subject Available for Student's Year:**
   ```csharp
   var availableYears = await _context.Subjects
       .Where(s => s.SubjectName.Name == subjectName)
       .Select(s => s.YearId)
       .Distinct()
       .ToListAsync();
   
   if (!availableYears.Contains(student.Year))
   {
       return BadRequest($"Subject '{subjectName}' is not available for Year {student.Year}");
   }
   ```

---

## 🎯 Benefits of New Approach

### **✅ Advantages:**

1. **Multi-Year Support:** Parents can enroll children in different year levels
2. **Flexibility:** Same parent can have Year 7, Year 8, and Year 9 students
3. **Correct Subject Mapping:** Each student gets subjects for their year level
4. **Simpler Frontend:** Frontend doesn't need to know year-specific subject IDs
5. **Future-Proof:** Easy to add new subjects across all years

### **📊 Example Use Cases:**

**Use Case 1: Siblings in Different Years**
- Parent has 3 children: Year 7, Year 8, Year 9
- Parent selects: Math + English
- Result: Each child gets Math and English for their respective year ✅

**Use Case 2: All Students in Same Year**
- Parent has 2 children: both in Year 8
- Parent selects: Math + Science
- Result: Both get Math Year 8 and Science Year 8 ✅

**Use Case 3: Mixed Subjects**
- Parent has 1 child in Year 7
- Parent selects: Math + English + Arabic
- Result: Child gets all 3 subjects for Year 7 ✅

---

## 📋 Implementation Checklist

### **Backend Tasks:**

- [ ] Update `CreatePackageOrderRequest` DTO
  - [ ] Change `SubjectIds` → `SubjectNames`
  - [ ] Remove `YearId` property
  
- [ ] Update `PriceCalculationRequest` DTO
  - [ ] Change `SubjectIds` → `SubjectNames`
  
- [ ] Update `CreateOrder` endpoint
  - [ ] Accept `SubjectNames` instead of `SubjectIds`
  - [ ] Loop through students and resolve subject IDs per year
  - [ ] Create OrderItems with correct subject IDs
  
- [ ] Update `CalculatePrice` endpoint
  - [ ] Accept `SubjectNames` instead of `SubjectIds`
  - [ ] Calculate average price across years or use Year 1 as baseline
  
- [ ] Update Webhook Handler
  - [ ] Verify OrderItems already have correct SubjectIds
  - [ ] Create subscriptions (no changes needed)
  
- [ ] Add Validation
  - [ ] Verify all subject names exist
  - [ ] Verify subjects are available for student years
  - [ ] Return clear error messages
  
- [ ] Test Cases
  - [ ] Test with students in same year
  - [ ] Test with students in different years
  - [ ] Test with non-existent subject names
  - [ ] Test with subjects not available for certain years

---

## 🚨 Critical Notes

1. **Subject Name is the Common Factor:**
   - "Math" exists for Year 7, 8, 9, 10, 11, 12
   - Each has a different SubjectId, but same SubjectName
   - Backend must use SubjectName + Student.Year to find correct SubjectId

2. **Student.Year Must Be Set:**
   - Every student MUST have a Year value (7-12)
   - This is set when parent registers the student
   - Backend must validate this exists

3. **Price Calculation:**
   - For estimate: use average price or Year 1 price
   - For actual order: use exact prices for each student's year

4. **Database Constraints:**
   - Subjects table must have: YearId, SubjectNameId
   - SubjectNames table must exist
   - Students table must have: Year column

---

## 📞 Questions to Address

1. **Price Variation Across Years:**
   - Q: Do subject prices differ significantly between Year 7 and Year 12?
   - A: If yes, calculate-price should return estimated range
   - A: If no, use fixed price for all years

2. **Subject Availability:**
   - Q: Are all subjects available for all years?
   - A: If no, frontend should filter available subjects per student selection

3. **Term Mapping:**
   - Q: Is termId consistent across all years?
   - A: Assuming yes (Term 1-4 applies to all years)

---

## ✅ Expected Outcome

### **Before (Wrong):**
```
Parent selects: Math (SubjectId=1)
Students: Ahmed (Year 7), Sara (Year 8)
Result: ❌ Both get Math Year 7 (wrong for Sara!)
```

### **After (Correct):**
```
Parent selects: Math (SubjectName="Math")
Students: Ahmed (Year 7), Sara (Year 8)
Backend resolves:
  - Ahmed → Math Year 7 (SubjectId=1) ✅
  - Sara → Math Year 8 (SubjectId=15) ✅
Result: ✅ Each student gets correct year subject!
```

---

**Priority:** 🔴 **HIGH**  
**Impact:** Major - affects all package subscriptions  
**Status:** ⚠️ **Backend implementation required**  
**Frontend:** ✅ **Already updated**

---

**End of Report**
