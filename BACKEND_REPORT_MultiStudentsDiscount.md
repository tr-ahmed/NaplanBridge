# 📌 BACKEND REPORT: Missing Multiple Students Discount

## Endpoint
```
POST /api/Tutoring/CalculatePriceV2
```

---

## Issue
The **Multiple Students Discount** (5% per additional student, max 20%) is configured in Admin but **NOT applied** in price calculations.

---

## Business Rule (from Requirements 2.2.2)
> If Parent registers more than one student, receive **5% discount** up to a maximum of **20%** or preset minimum price for subject.

| Students | Discount |
|----------|----------|
| 1 | 0% |
| 2 | 5% |
| 3 | 10% |
| 4+ | 15-20% (max 20%) |

---

## Current Response (Missing)

```json
{
  "students": [...],
  "breakdown": {
    "multiSubjectSavings": 50,
    "groupSavings": 100,
    "hoursSavings": 25
    // ❌ MISSING: multiStudentsSavings
  }
}
```

---

## Expected Response

```json
{
  "students": [...],
  "breakdown": {
    "multiSubjectSavings": 50,
    "groupSavings": 100,
    "hoursSavings": 25,
    "multiStudentsSavings": 75  // ✅ ADD THIS
  },
  "totalDiscount": 250
}
```

---

## Files to Update

### 1. DTO (Add field)
`DTOs/Tutoring/PriceCalculationDtos.cs`:
```csharp
public class DiscountBreakdownDto
{
    public decimal MultiSubjectSavings { get; set; }
    public decimal GroupSavings { get; set; }
    public decimal HoursSavings { get; set; }
    public decimal MultiStudentsSavings { get; set; }  // ✅ ADD
}
```

### 2. Service (Apply discount)
`Services/Implementations/TutoringPriceCalculationService.cs`:

```csharp
// Calculate multiple students discount
private decimal CalculateMultiStudentsDiscount(int studentCount, decimal baseTotal)
{
    var settings = GetDiscountSettings();
    
    if (!settings.MultipleStudentsDiscount.IsActive || studentCount < 2)
        return 0;
    
    // Get tier percentage based on student count
    decimal percentage = studentCount switch
    {
        2 => settings.MultipleStudentsDiscount.TwoStudentsPercentage,
        3 => settings.MultipleStudentsDiscount.ThreeStudentsPercentage,
        _ => settings.MultipleStudentsDiscount.FourPlusStudentsPercentage
    };
    
    // Cap at max percentage
    percentage = Math.Min(percentage, settings.MultipleStudentsDiscount.MaxPercentage);
    
    return baseTotal * percentage / 100;
}
```

---

## Admin Settings Reference
Path: `/admin/tutoring` → Discount Management

| Setting | Value |
|---------|-------|
| 2 Students | 5% |
| 3 Students | 10% |
| 4+ Students | 15% |
| Max | 20% |

---

## Frontend Already Prepared

Frontend will display the discount once backend returns it:
```typescript
// step6-review.component.ts
@if (priceResponse.breakdown.multiStudentsSavings > 0) {
  <div class="discount-pill">
    👨‍👩‍👧‍👦 Multi-Students: -${{ priceResponse.breakdown.multiStudentsSavings }}
  </div>
}
```

---

## Impact

| Current | Expected |
|---------|----------|
| 2 students, $1000 total → $1000 | 2 students, $1000 total → **$950** (5% off) |
| 4 students, $2000 total → $2000 | 4 students, $2000 total → **$1700** (15% off) |

---

**Priority:** HIGH - Missing core discount feature  
**Reported:** 2025-12-26

Reply with:
```
✔ BACKEND FIX CONFIRMED
```
