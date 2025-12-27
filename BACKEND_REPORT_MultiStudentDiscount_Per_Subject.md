# 📌 BACKEND REPORT: Multi-Student Discount Not Applied Per-Subject

## Endpoint
`POST /api/Tutoring/CalculatePrice`

---

## Issue Summary
The **Multi-Student Discount** is calculated correctly at the summary level (`breakdown.multiStudentsSavings`), but it is **NOT distributed to each subject's `finalPrice`**. This causes incorrect line item prices when sending to **Stripe Checkout**.

---

## Current Behavior (❌ WRONG)

### Example Response:
```json
{
    "students": [
        {
            "studentId": 31,
            "studentName": "ahmed2",
            "subjects": [
                {
                    "subjectId": 16,
                    "subjectName": "Linear Algebra",
                    "hours": 10,
                    "basePrice": 100,
                    "totalDiscount": 0,
                    "finalPrice": 100,        // ❌ No multi-student discount applied
                    "discounts": {
                        "multiSubject": { "amount": 0 },
                        "hours": { "amount": 0 },
                        "group": { "amount": 0 }
                        // ❌ MISSING: multiStudents discount
                    }
                }
            ],
            "studentTotal": 100
        },
        {
            "studentId": 35,
            "studentName": "ch6",
            "subjects": [
                {
                    "subjectId": 24,
                    "subjectName": "Math",
                    "hours": 20,
                    "basePrice": 200,
                    "totalDiscount": 10.00,
                    "finalPrice": 190.00,     // ❌ Only multi-subject discount, no multi-student
                    "discounts": {
                        "multiSubject": { "amount": 10.00 },
                        "hours": { "amount": 0 },
                        "group": { "amount": 0 }
                        // ❌ MISSING: multiStudents discount
                    }
                },
                {
                    "subjectId": 26,
                    "subjectName": "Tajweed",
                    "hours": 20,
                    "basePrice": 200,
                    "totalDiscount": 10.00,
                    "finalPrice": 190.00,     // ❌ Only multi-subject discount, no multi-student
                    "discounts": {
                        "multiSubject": { "amount": 10.00 },
                        "hours": { "amount": 0 },
                        "group": { "amount": 0 }
                        // ❌ MISSING: multiStudents discount
                    }
                }
            ],
            "studentTotal": 380.00
        }
    ],
    "grandTotal": 461.00,  // 480 - 19 (multi-student) = 461
    "totalDiscount": 39.00,
    "breakdown": {
        "multiSubjectSavings": 20.00,
        "multiStudentsSavings": 19.00,  // ⚠️ Calculated but NOT distributed
        "groupSavings": 0,
        "hoursSavings": 0.00
    }
}
```

### Problem:
- `grandTotal = 461` (correct after multi-student discount)
- But sum of all `subject.finalPrice` = 100 + 190 + 190 = **480** (wrong!)
- The $19 multi-student discount is NOT reflected in individual subjects

---

## Expected Behavior (✅ CORRECT)

The multi-student discount should be **proportionally distributed** to each subject's `finalPrice`.

### Calculation Logic:
1. Calculate base total after other discounts: `$480 - $20 (multi-subject) = $460`
2. Apply multi-student percentage (4% for 2 students): `$460 * 4% = $18.40` ≈ `$19`
3. **Distribute this $19 proportionally to each subject based on their share of the total**

### Distribution Formula:
```
subject.multiStudentDiscount = (subject.priceAfterOtherDiscounts / totalAfterOtherDiscounts) * totalMultiStudentDiscount
```

### Example Distribution for $19 multi-student discount:
- Linear Algebra ($100): `(100 / 460) * 19 = $4.13`
- Math ($190): `(190 / 460) * 19 = $7.85`
- Tajweed ($190): `(190 / 460) * 19 = $7.85`
- **Total distributed: $4.13 + $7.85 + $7.85 = $19.83** (rounding handled)

### Expected Response:
```json
{
    "students": [
        {
            "studentId": 31,
            "studentName": "ahmed2",
            "subjects": [
                {
                    "subjectId": 16,
                    "subjectName": "Linear Algebra",
                    "hours": 10,
                    "basePrice": 100,
                    "discounts": {
                        "multiSubject": { "percentage": 0, "amount": 0 },
                        "hours": { "percentage": 0, "amount": 0 },
                        "group": { "percentage": 0, "amount": 0 },
                        "multiStudents": {                          // ✅ ADD THIS
                            "percentage": 4.00,
                            "amount": 4.00,
                            "reason": "Multi-student discount: 4% applied"
                        }
                    },
                    "totalDiscount": 4.00,
                    "finalPrice": 96.00      // ✅ 100 - 4 = 96
                }
            ],
            "studentTotal": 96.00
        },
        {
            "studentId": 35,
            "studentName": "ch6",
            "subjects": [
                {
                    "subjectId": 24,
                    "subjectName": "Math",
                    "hours": 20,
                    "basePrice": 200,
                    "discounts": {
                        "multiSubject": { "percentage": 5.00, "amount": 10.00 },
                        "hours": { "percentage": 0, "amount": 0 },
                        "group": { "percentage": 0, "amount": 0 },
                        "multiStudents": {                          // ✅ ADD THIS
                            "percentage": 4.00,
                            "amount": 7.60,
                            "reason": "Multi-student discount: 4% applied"
                        }
                    },
                    "totalDiscount": 17.60,
                    "finalPrice": 182.40     // ✅ 200 - 10 - 7.60 = 182.40
                },
                {
                    "subjectId": 26,
                    "subjectName": "Tajweed",
                    "hours": 20,
                    "basePrice": 200,
                    "discounts": {
                        "multiSubject": { "percentage": 5.00, "amount": 10.00 },
                        "hours": { "percentage": 0, "amount": 0 },
                        "group": { "percentage": 0, "amount": 0 },
                        "multiStudents": {                          // ✅ ADD THIS
                            "percentage": 4.00,
                            "amount": 7.60,
                            "reason": "Multi-student discount: 4% applied"
                        }
                    },
                    "totalDiscount": 17.60,
                    "finalPrice": 182.40     // ✅ 200 - 10 - 7.60 = 182.40
                }
            ],
            "studentTotal": 364.80
        }
    ],
    "grandTotal": 460.80,
    "totalDiscount": 39.20,
    "breakdown": {
        "multiSubjectSavings": 20.00,
        "multiStudentsSavings": 19.20,      // ✅ Sum of all subject multiStudents.amount
        "groupSavings": 0,
        "hoursSavings": 0.00
    }
}
```

---

## Required Changes

### 1. Add `multiStudents` to `SubjectDiscountsDto`
```csharp
public class SubjectDiscountsDto
{
    public DiscountDetailDto MultiSubject { get; set; }
    public DiscountDetailDto Hours { get; set; }
    public DiscountDetailDto Group { get; set; }
    public DiscountDetailDto MultiStudents { get; set; }  // ✅ ADD THIS
}
```

### 2. Update Price Calculation Logic
```csharp
// After calculating all other discounts...
decimal totalAfterOtherDiscounts = students.Sum(s => s.Subjects.Sum(sub => sub.PriceAfterOtherDiscounts));

// Get multi-student discount percentage
decimal multiStudentPercent = GetMultiStudentDiscountPercentage(totalStudents);

// Distribute to each subject
foreach (var student in students)
{
    foreach (var subject in student.Subjects)
    {
        decimal subjectShare = subject.PriceAfterOtherDiscounts / totalAfterOtherDiscounts;
        decimal multiStudentAmount = subject.PriceAfterOtherDiscounts * multiStudentPercent / 100;
        
        subject.Discounts.MultiStudents = new DiscountDetailDto
        {
            Percentage = multiStudentPercent,
            Amount = multiStudentAmount,
            Reason = $"Multi-student discount: {multiStudentPercent}% applied"
        };
        
        subject.TotalDiscount += multiStudentAmount;
        subject.FinalPrice = subject.BasePrice - subject.TotalDiscount;
    }
    
    // Update student totals
    student.StudentTotal = student.Subjects.Sum(s => s.FinalPrice);
}
```

### 3. Ensure Sum Equals Grand Total
```csharp
// Validation: Sum of all finalPrices should equal grandTotal
decimal sumOfFinalPrices = students.Sum(s => s.Subjects.Sum(sub => sub.FinalPrice));
Assert(sumOfFinalPrices == grandTotal);  // Must be equal for Stripe accuracy
```

---

## Impact: Why This Matters

1. **Stripe Line Items**: When creating Stripe Checkout, each subject becomes a line item with its `finalPrice`. If multi-student discount isn't included, Stripe will charge **$480 instead of $461**.

2. **Invoice Accuracy**: Generated invoices will show incorrect per-subject pricing.

3. **Order Verification**: The `create-order-v2` endpoint may fail price verification if `expectedPrice` doesn't match calculated totals.

---

## Frontend Changes Required

Once backend is fixed, update the TypeScript interface:

```typescript
// In tutoring.models.ts
export interface SubjectDiscountsDto {
  multiSubject: DiscountDetailDto;
  hours: DiscountDetailDto;
  group: DiscountDetailDto;
  multiStudents: DiscountDetailDto;  // ✅ ADD THIS
}
```

And update the template to display:
```html
@if (subject.discounts.multiStudents?.amount > 0) {
  <span class="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
    -${{ subject.discounts.multiStudents.amount.toFixed(0) }} Students
  </span>
}
```

---

## Verification Checklist

| Test Case | Expected Result |
|-----------|-----------------|
| 2 students, 3 subjects total | Each subject's `finalPrice` includes 4% multi-student discount |
| Sum of all `subject.finalPrice` | Equals `grandTotal` exactly |
| `breakdown.multiStudentsSavings` | Equals sum of all `subject.discounts.multiStudents.amount` |
| Stripe line item total | Matches `grandTotal` |

---

## Request

Please update the `CalculatePrice` endpoint to distribute the multi-student discount to each subject's `finalPrice` and add the `multiStudents` field to the subject discounts DTO.

Confirm when ready:
```
✔ BACKEND FIX CONFIRMED
```
