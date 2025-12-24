# 📌 BACKEND REPORT: Separate Tutoring Pricing from Self-Learning

**Date:** December 24, 2025  
**Priority:** 🔴 HIGH - Critical for Tutoring System  
**Component:** Subject Model & Tutoring Pricing

---

## 🎯 Issue Description

Currently, the Tutoring system uses the **same price** as Self-Learning subscriptions:

### ❌ Current (Incorrect) Behavior:
```typescript
// Frontend currently uses:
basePrice: subject.price  // This is Self-Learning subscription price!
```

**Problem:**
- `subject.price` = Monthly subscription price for Self-Learning content
- Tutoring pricing = Price per hour for live tutoring sessions
- **These are completely different pricing models!**

### ✅ Expected (Correct) Behavior:
```typescript
// Should use separate field:
basePrice: subject.tutoringPricePerHour  // Dedicated tutoring hourly rate
```

---

## 🔍 Why This Matters

### Current Problem:
A subject with:
- Self-Learning subscription: **$50/month** (access to all videos, quizzes, materials)
- Tutoring hourly rate: **$100/hour** (live 1-on-1 or group sessions)

Currently the system incorrectly uses $50/hour for tutoring, which is:
- ❌ Not profitable for teachers
- ❌ Confuses two different services
- ❌ Cannot be managed independently

### Correct Implementation:
- ✅ Self-Learning: $50/month subscription
- ✅ Tutoring: $100/hour for live sessions
- ✅ Each can be priced and managed independently

---

## 🛠️ Required Backend Changes

### 1. Database Schema Update

Add new column to `Subjects` table:

```sql
-- Add Tutoring Price Per Hour column
ALTER TABLE Subjects 
ADD TutoringPricePerHour DECIMAL(18,2) NULL;

-- Set default values (example: 2x the monthly subscription price)
UPDATE Subjects 
SET TutoringPricePerHour = Price * 2
WHERE TutoringPricePerHour IS NULL;

-- Add index for performance
CREATE INDEX IX_Subjects_TutoringPricePerHour 
ON Subjects(TutoringPricePerHour);
```

**Field Description:**
- `TutoringPricePerHour`: Price per hour for tutoring sessions
- Type: `DECIMAL(18,2)`
- Nullable: `NULL` (defaults can be set by admin)
- Independent from Self-Learning pricing

---

### 2. Update Subject Model (C#)

```csharp
public class Subject
{
    public int Id { get; set; }
    public string SubjectName { get; set; }
    
    // Self-Learning Pricing
    public decimal Price { get; set; }                    // Monthly subscription
    public decimal OriginalPrice { get; set; }            // Original subscription price
    public decimal DiscountPercentage { get; set; }       // Discount on subscription
    
    // ✅ NEW: Tutoring Pricing
    public decimal? TutoringPricePerHour { get; set; }    // Price per hour for tutoring
    
    // Other fields...
}
```

---

### 3. Update Subject DTOs

#### SubjectDto (GET responses):
```csharp
public class SubjectDto
{
    public int Id { get; set; }
    public string SubjectName { get; set; }
    
    // Self-Learning
    public decimal Price { get; set; }
    public decimal OriginalPrice { get; set; }
    public decimal DiscountPercentage { get; set; }
    
    // ✅ NEW: Tutoring
    public decimal? TutoringPricePerHour { get; set; }
}
```

#### CreateSubjectDto:
```csharp
public class CreateSubjectDto
{
    // Required fields
    public int YearId { get; set; }
    public int SubjectNameId { get; set; }
    
    // Self-Learning pricing (optional)
    public decimal? OriginalPrice { get; set; }
    public decimal? DiscountPercentage { get; set; }
    
    // ✅ NEW: Tutoring pricing (optional)
    public decimal? TutoringPricePerHour { get; set; }
    
    // Other fields...
}
```

#### UpdateSubjectDto:
```csharp
public class UpdateSubjectDto
{
    // Self-Learning pricing
    public decimal? OriginalPrice { get; set; }
    public decimal? DiscountPercentage { get; set; }
    
    // ✅ NEW: Tutoring pricing
    public decimal? TutoringPricePerHour { get; set; }
    
    // Other fields...
}
```

---

### 4. Update Price Calculation Logic

#### NewPriceCalculationRequest (already correct):
```csharp
public class NewSubjectSelectionDto
{
    public int SubjectId { get; set; }
    public string SubjectName { get; set; }
    public decimal BasePrice { get; set; }  // ✅ Frontend will send TutoringPricePerHour
    public string TeachingType { get; set; }
    public int Hours { get; set; }
}
```

**Note:** Frontend is responsible for sending the correct `BasePrice` (TutoringPricePerHour).

---

### 5. Admin API Endpoints

#### Get Subjects with Tutoring Prices:
```http
GET /api/Subjects?includeTutoringPrices=true
```

**Response:**
```json
{
  "data": [
    {
      "id": 5,
      "subjectName": "Mathematics",
      "categoryName": "STEM",
      "price": 50.00,                    // Self-Learning monthly
      "originalPrice": 60.00,
      "discountPercentage": 16.67,
      "tutoringPricePerHour": 100.00    // ✅ Tutoring hourly rate
    }
  ]
}
```

#### Bulk Update Tutoring Prices:
```http
PUT /api/Admin/Subjects/BulkUpdateTutoringPrices
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request:**
```json
{
  "updates": [
    {
      "subjectId": 5,
      "tutoringPricePerHour": 100.00
    },
    {
      "subjectId": 8,
      "tutoringPricePerHour": 120.00
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Updated 2 subjects successfully",
  "updatedCount": 2
}
```

---

## 📊 API Response Examples

### Example 1: Subject with Both Pricing Models
```json
{
  "id": 5,
  "subjectName": "Mathematics",
  "categoryName": "STEM",
  "yearId": 7,
  
  "selfLearning": {
    "price": 50.00,
    "originalPrice": 60.00,
    "discountPercentage": 16.67,
    "subscriptionType": "Monthly"
  },
  
  "tutoring": {
    "pricePerHour": 100.00,
    "isAvailableForTutoring": true
  }
}
```

### Example 2: Subject Only Available for Self-Learning
```json
{
  "id": 12,
  "subjectName": "Art History",
  "categoryName": "Arts",
  
  "selfLearning": {
    "price": 30.00,
    "originalPrice": 30.00,
    "discountPercentage": 0
  },
  
  "tutoring": {
    "pricePerHour": null,
    "isAvailableForTutoring": false
  }
}
```

---

## 🎯 Business Logic

### Pricing Rules:
1. **Self-Learning Price:**
   - Monthly subscription
   - Access to all content (videos, quizzes, materials)
   - Calculated: `Price = OriginalPrice * (1 - DiscountPercentage/100)`

2. **Tutoring Price:**
   - Per hour rate
   - For live sessions (1-on-1 or group)
   - Applied to session hours (10, 20, or 30 hours packages)
   - Additional discounts apply:
     - Group sessions: 35% OFF
     - Multiple subjects: up to 20% OFF
     - Hours packages: 5-10% OFF

### Default Values:
When creating a subject without `TutoringPricePerHour`:
```csharp
// Option 1: Set to null (tutoring not available)
subject.TutoringPricePerHour = null;

// Option 2: Calculate from self-learning price
subject.TutoringPricePerHour = subject.Price * 2; // Example multiplier
```

---

## 🔧 Migration Strategy

### Phase 1: Add Column (Non-Breaking)
```sql
ALTER TABLE Subjects ADD TutoringPricePerHour DECIMAL(18,2) NULL;
```
- Existing code continues to work
- `TutoringPricePerHour` is NULL for existing subjects

### Phase 2: Set Default Values
```sql
-- Set default based on self-learning price
UPDATE Subjects 
SET TutoringPricePerHour = Price * 2.5
WHERE TutoringPricePerHour IS NULL 
AND CategoryId IN (1, 2, 3); -- Only for STEM/Languages/Sciences

-- For other subjects, leave NULL (not available for tutoring)
```

### Phase 3: Frontend Update
- Update Subject interface to include `tutoringPricePerHour`
- Update price calculation to use tutoring price
- Add admin UI for managing tutoring prices

### Phase 4: Validation (Optional)
```sql
-- Add check constraint (optional)
ALTER TABLE Subjects
ADD CONSTRAINT CK_TutoringPrice_Positive
CHECK (TutoringPricePerHour IS NULL OR TutoringPricePerHour > 0);
```

---

## ⚠️ Edge Cases to Handle

### Case 1: Subject Not Available for Tutoring
```json
{
  "subjectId": 15,
  "subjectName": "Physical Education",
  "tutoringPricePerHour": null  // Not available for tutoring
}
```

**Frontend Handling:**
- Don't show in tutoring subject selection
- Or show with "Not Available" badge

### Case 2: Price Update During Active Booking
```
Student is in Step 3 of booking process
Admin updates tutoring price from $100 to $120

Solution: Lock price when booking starts (save in session state)
```

### Case 3: Discount Calculation
```typescript
// Tutoring price calculation:
basePrice = subject.tutoringPricePerHour * hours

// Then apply discounts:
- Group discount: 35%
- Multiple subjects: 5-20%
- Hours package: 0-10%

finalPrice = basePrice - totalDiscounts
```

---

## 📝 Testing Checklist

### Backend Tests:
- [ ] Create subject with `TutoringPricePerHour`
- [ ] Create subject without `TutoringPricePerHour` (NULL)
- [ ] Update `TutoringPricePerHour` for existing subject
- [ ] Get subjects with tutoring prices
- [ ] Filter subjects by tutoring availability
- [ ] Bulk update tutoring prices
- [ ] Validate positive price constraint

### Frontend Tests:
- [ ] Display subjects with tutoring prices in Step 2
- [ ] Calculate price using `tutoringPricePerHour` in Step 6
- [ ] Handle subjects without tutoring prices (NULL)
- [ ] Admin can view all tutoring prices
- [ ] Admin can update tutoring prices
- [ ] Prices persist correctly during booking flow

---

## 🎯 Success Criteria

After implementing the fix:

1. ✅ `Subjects` table has `TutoringPricePerHour` column
2. ✅ Subject DTOs include `TutoringPricePerHour` field
3. ✅ Create/Update APIs support tutoring price
4. ✅ Admin can manage tutoring prices independently
5. ✅ Frontend uses correct price for tutoring calculations
6. ✅ Self-Learning and Tutoring prices are completely separate

---

## 📞 Action Required

Please implement the following:

1. **Database:**
   - Add `TutoringPricePerHour` column
   - Set initial values
   - Add index

2. **Backend:**
   - Update Subject model
   - Update DTOs (Subject, Create, Update)
   - Update GET/POST/PUT endpoints
   - Add bulk update endpoint

3. **Validation:**
   - Test all subject CRUD operations
   - Test price calculation with new field
   - Test admin endpoints

**Confirmation needed when ready:**
```
✔ BACKEND FIX CONFIRMED: TutoringPricePerHour field added and tested
```

---

**Frontend Status:** ⏳ Ready to integrate (models & UI prepared)  
**Backend Status:** ⏳ Awaiting Implementation  
**Blocker:** Cannot calculate correct tutoring prices until backend is updated

---

**Created:** December 24, 2025  
**Priority:** HIGH  
**Impact:** Critical for Tutoring System Launch
