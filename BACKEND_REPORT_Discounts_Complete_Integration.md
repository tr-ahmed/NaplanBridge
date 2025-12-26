# 📌 BACKEND REPORT: Discount Rules Complete Integration

## Endpoints Involved
```
GET  /api/Admin/Tutoring/DiscountRules    → Load settings
PUT  /api/Admin/Tutoring/DiscountRules    → Save settings
POST /api/Tutoring/CalculatePriceV2       → Use settings in price calculation
```

---

## 🚨 Issue Summary

The following discount types are **NOT being saved** properly:
1. **Hours Package Discount** ❌
2. **Multiple Students Discount** ❌

Admin saves settings → API receives data → Data is NOT persisted → Next page load shows default values.

---

## 📤 Frontend Payload (What Frontend Sends)

When admin clicks "Save Changes", frontend sends:

```json
{
  "groupDiscount": {
    "isActive": true,
    "percentage": 35
  },
  "hoursDiscount": {
    "isActive": true,
    "tiers": {
      "hours20": 5,
      "hours30": 10
    }
  },
  "multiSubjectDiscount": {
    "isActive": true,
    "tiers": {
      "subjects2": 5,
      "subjects3": 10,
      "subjects4": 15,
      "subjects5": 20
    }
  },
  "multiStudentsDiscount": {
    "isActive": true,
    "tiers": {
      "students2": 5,
      "students3": 10,
      "students4": 15,
      "maxPercentage": 20
    }
  }
}
```

---

## 📥 Expected Response (What Frontend Expects on Load)

When admin opens `/admin/tutoring` → Discounts tab, frontend calls `GET /api/Admin/Tutoring/DiscountRules` and expects:

```json
{
  "groupDiscount": {
    "isActive": true,
    "percentage": 35
  },
  "hoursDiscount": {
    "isActive": true,
    "tiers": {
      "hours20": 5,
      "hours30": 10
    }
  },
  "multiSubjectDiscount": {
    "isActive": true,
    "tiers": {
      "subjects2": 5,
      "subjects3": 10,
      "subjects4": 15,
      "subjects5": 20
    }
  },
  "multiStudentsDiscount": {
    "isActive": true,
    "tiers": {
      "students2": 5,
      "students3": 10,
      "students4": 15,
      "maxPercentage": 20
    }
  }
}
```

---

## 📊 Business Rules for Each Discount

### 1. Group Discount
| Field | Description |
|-------|-------------|
| `isActive` | Enable/disable |
| `percentage` | Flat percentage off for Group tutoring (e.g., 35%) |

**Calculation:** If `teachingType === "Group"` → Apply percentage discount

---

### 2. Hours Package Discount ⚠️
| Field | Description |
|-------|-------------|
| `isActive` | Enable/disable |
| `tiers.hours20` | Discount % for 20-hour packages |
| `tiers.hours30` | Discount % for 30-hour packages |

**Calculation:**
```csharp
if (hours == 10) discount = 0%;     // Base, no discount
if (hours == 20) discount = tiers.hours20;  // e.g., 5%
if (hours == 30) discount = tiers.hours30;  // e.g., 10%
```

---

### 3. Multiple Subjects Discount
| Field | Description |
|-------|-------------|
| `isActive` | Enable/disable |
| `tiers.subjects2` | Discount % for 2 subjects per student |
| `tiers.subjects3` | Discount % for 3 subjects per student |
| `tiers.subjects4` | Discount % for 4 subjects per student |
| `tiers.subjects5` | Discount % for 5+ subjects per student |

**Calculation:**
```csharp
int subjectCount = student.Subjects.Count;
decimal discount = subjectCount switch {
  1 => 0,
  2 => tiers.subjects2,
  3 => tiers.subjects3,
  4 => tiers.subjects4,
  _ => tiers.subjects5  // 5+
};
```

---

### 4. Multiple Students Discount ⚠️
| Field | Description |
|-------|-------------|
| `isActive` | Enable/disable |
| `tiers.students2` | Discount % for 2 students |
| `tiers.students3` | Discount % for 3 students |
| `tiers.students4` | Discount % for 4+ students |
| `tiers.maxPercentage` | Maximum cap (e.g., 20%) |

**Calculation:**
```csharp
int studentCount = request.StudentSelections.Count;
decimal discount = studentCount switch {
  1 => 0,
  2 => tiers.students2,
  3 => tiers.students3,
  _ => Math.Min(tiers.students4, tiers.maxPercentage)
};
```

---

## 🔧 Backend Implementation Checklist

### Database Schema
```sql
CREATE TABLE DiscountRules (
  Id INT PRIMARY KEY,
  RuleType VARCHAR(50),        -- 'group', 'hours', 'multiSubject', 'multiStudents'
  IsActive BIT,
  Percentage DECIMAL(5,2),     -- For flat discounts
  TiersJson NVARCHAR(MAX)      -- JSON for tiered discounts
);
```

### DTO Structure
```csharp
public class DiscountRulesDto
{
    public GroupDiscountDto GroupDiscount { get; set; }
    public HoursDiscountDto HoursDiscount { get; set; }
    public MultiSubjectDiscountDto MultiSubjectDiscount { get; set; }
    public MultiStudentsDiscountDto MultiStudentsDiscount { get; set; }
}

public class GroupDiscountDto
{
    public bool IsActive { get; set; }
    public decimal Percentage { get; set; }
}

public class HoursDiscountDto
{
    public bool IsActive { get; set; }
    public HoursTiersDto Tiers { get; set; }
}

public class HoursTiersDto
{
    public decimal Hours20 { get; set; }
    public decimal Hours30 { get; set; }
}

public class MultiSubjectDiscountDto
{
    public bool IsActive { get; set; }
    public SubjectTiersDto Tiers { get; set; }
}

public class SubjectTiersDto
{
    public decimal Subjects2 { get; set; }
    public decimal Subjects3 { get; set; }
    public decimal Subjects4 { get; set; }
    public decimal Subjects5 { get; set; }
}

public class MultiStudentsDiscountDto
{
    public bool IsActive { get; set; }
    public StudentsTiersDto Tiers { get; set; }
}

public class StudentsTiersDto
{
    public decimal Students2 { get; set; }
    public decimal Students3 { get; set; }
    public decimal Students4 { get; set; }
    public decimal MaxPercentage { get; set; }
}
```

---

## 🧮 Price Calculator Integration

The `CalculatePriceV2` endpoint **MUST** load and apply these discounts:

```csharp
public async Task<NewPriceCalculationResponse> CalculatePriceAsync(NewPriceCalculationRequest request)
{
    // 1. Load discount settings from DB
    var discountRules = await GetDiscountRulesAsync();
    
    int studentCount = request.StudentSelections.Count;
    decimal totalDiscount = 0;
    decimal multiStudentsSavings = 0;
    decimal hoursSavings = 0;
    
    foreach (var student in request.StudentSelections)
    {
        foreach (var subject in student.Subjects)
        {
            decimal basePrice = subject.BasePrice * subject.Hours;
            
            // 2. Apply Group Discount
            if (discountRules.GroupDiscount.IsActive && subject.TeachingType == "Group")
            {
                var groupSaving = basePrice * discountRules.GroupDiscount.Percentage / 100;
                totalDiscount += groupSaving;
            }
            
            // 3. Apply Hours Package Discount ⚠️
            if (discountRules.HoursDiscount.IsActive)
            {
                decimal hoursPercent = subject.Hours switch {
                    20 => discountRules.HoursDiscount.Tiers.Hours20,
                    30 => discountRules.HoursDiscount.Tiers.Hours30,
                    _ => 0
                };
                hoursSavings += basePrice * hoursPercent / 100;
            }
            
            // 4. Apply Multi-Subject Discount (per student)
            // ... existing logic
        }
    }
    
    // 5. Apply Multiple Students Discount ⚠️
    if (discountRules.MultiStudentsDiscount.IsActive && studentCount >= 2)
    {
        decimal studentPercent = studentCount switch {
            2 => discountRules.MultiStudentsDiscount.Tiers.Students2,
            3 => discountRules.MultiStudentsDiscount.Tiers.Students3,
            _ => Math.Min(
                discountRules.MultiStudentsDiscount.Tiers.Students4,
                discountRules.MultiStudentsDiscount.Tiers.MaxPercentage
            )
        };
        
        decimal subtotal = /* sum of all student totals */;
        multiStudentsSavings = subtotal * studentPercent / 100;
        totalDiscount += multiStudentsSavings;
    }
    
    return new NewPriceCalculationResponse {
        // ... other fields
        Breakdown = new DiscountBreakdownDto {
            MultiSubjectSavings = multiSubjectSavings,
            GroupSavings = groupSavings,
            HoursSavings = hoursSavings,              // ⚠️ Must be calculated
            MultiStudentsSavings = multiStudentsSavings // ⚠️ Must be calculated
        }
    };
}
```

---

## ✅ Verification Checklist

| Task | Status |
|------|--------|
| `GET /api/Admin/Tutoring/DiscountRules` returns all 4 discount types | ❓ |
| `PUT /api/Admin/Tutoring/DiscountRules` persists all 4 discount types | ❓ |
| `hoursDiscount.tiers` saved and loaded correctly | ❓ |
| `multiStudentsDiscount.tiers` saved and loaded correctly | ❓ |
| `CalculatePriceV2` applies `hoursSavings` | ❓ |
| `CalculatePriceV2` applies `multiStudentsSavings` | ❓ |
| Response includes `breakdown.hoursSavings` | ❓ |
| Response includes `breakdown.multiStudentsSavings` | ❓ |

---

## 🧪 Test Cases

### Test 1: Admin Saves Hours Discount
1. Go to `/admin/tutoring` → Discounts tab
2. Set Hours Package: 20hrs = 5%, 30hrs = 10%
3. Click Save
4. Refresh page
5. **Expected:** Values should persist (5%, 10%)
6. **Current:** Values reset to defaults ❌

### Test 2: Admin Saves Multiple Students Discount
1. Go to `/admin/tutoring` → Discounts tab
2. Set Multiple Students: 2=5%, 3=10%, 4+=15%, Max=20%
3. Click Save
4. Refresh page
5. **Expected:** Values should persist
6. **Current:** Values reset to defaults ❌

### Test 3: Calculator Uses Hours Discount
1. Parent selects 1 student, 1 subject, **30 hours**
2. Base price: $10/hr = $300 total
3. Hours discount: 10% = $30 off
4. **Expected:** `breakdown.hoursSavings = 30`
5. **Current:** `breakdown.hoursSavings = 0` ❌

### Test 4: Calculator Uses Multiple Students Discount
1. Parent selects **3 students**, 1 subject each, 10 hours
2. Base price: $10/hr × 10hrs × 3 = $300 total
3. Multi-students discount: 10% = $30 off
4. **Expected:** `breakdown.multiStudentsSavings = 30`
5. **Current:** `breakdown.multiStudentsSavings = 0` ❌

---

## 📁 Files to Update

| File | Changes Required |
|------|------------------|
| `DTOs/Admin/DiscountRulesDto.cs` | Add `MultiStudentsDiscountDto` |
| `Controllers/Admin/TutoringController.cs` | Handle multiStudentsDiscount in GET/PUT |
| `Services/DiscountRulesService.cs` | Save/Load all 4 discount types |
| `Services/TutoringPriceCalculationService.cs` | Apply Hours + MultiStudents discounts |
| `DTOs/Tutoring/NewPriceCalculationDtos.cs` | Include `HoursSavings` + `MultiStudentsSavings` |

---

## 🔄 Migration (if needed)

```sql
-- Add new columns or rows for discount types
INSERT INTO DiscountRules (RuleType, IsActive, TiersJson)
SELECT 'multiStudents', 1, '{"students2":5,"students3":10,"students4":15,"maxPercentage":20}'
WHERE NOT EXISTS (SELECT 1 FROM DiscountRules WHERE RuleType = 'multiStudents');
```

---

**Priority:** HIGH - Discount settings not persisting, users see wrong prices  
**Reported:** 2025-12-27  
**Impact:** Parents not receiving entitled discounts

Reply with:
```
✔ BACKEND FIX CONFIRMED
```
